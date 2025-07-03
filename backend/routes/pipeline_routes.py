"""
Pipeline Routes
FastAPI router for complete processing pipeline (OCR + Mapping + Evaluation)
"""

import os
import time
import tempfile
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel

from mongoDB.auth import get_current_user, get_current_user_optional
from mongoDB.db_config import question_papers_collection, evaluations_collection
from ocr.ocr_processor import process_document
from qna_mapping.mapper import map_questions_to_answers, get_mapping_stats
from evaluation.evaluator import evaluate_and_generate_report, get_evaluation_stats
from mongoDB.models import EvaluationModel
from models.schemas import APIResponse
from bson.objectid import ObjectId
from config import Config

# Request/Response Models
class CompleteProcessResponse(BaseModel):
    success: bool
    message: str
    evaluationId: Optional[str] = None
    result: Dict[str, Any]
    ocrText: str
    questions: list
    stats: Dict[str, Any]

# Create FastAPI Router
pipeline_router = APIRouter()

def parse_json(obj):
    """Convert ObjectId to string for JSON serialization"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, ObjectId):
                obj[key] = str(value)
            elif isinstance(value, dict):
                obj[key] = parse_json(value)
            elif isinstance(value, list):
                obj[key] = [parse_json(item) if isinstance(item, dict) else item for item in value]
    return obj

@pipeline_router.post("/", response_model=CompleteProcessResponse)
async def process_complete_pipeline(
    file: UploadFile = File(...),
    studentName: str = Form("Anonymous"),
    evaluationType: str = Form("rubric"),
    questionPaperId: Optional[str] = Form(None),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Complete processing pipeline: OCR -> Q&A Mapping -> Evaluation
    Processes a student answer sheet from upload to final evaluation results
    """
    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp'}
        file_ext = os.path.splitext(file.filename or '')[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size
        content = await file.read()
        if len(content) > Config.MAX_CONTENT_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 16MB"
            )
        
        # Create temporary file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Step 1: OCR Processing
            try:
                extracted_text = process_document(temp_file_path)
                
                if not extracted_text or not extracted_text.strip():
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="No text could be extracted from the document"
                    )
            except Exception as ocr_error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"OCR processing failed: {str(ocr_error)}"
                )
            
            # Step 2: Get questions for mapping
            questions = None
            if questionPaperId:
                try:
                    question_paper = question_papers_collection.find_one({
                        '_id': ObjectId(questionPaperId)
                    })
                    
                    if question_paper:
                        questions = question_paper.get('questions', [])
                    else:
                        # Continue without question paper but warn
                        print(f"Warning: Question paper {questionPaperId} not found, proceeding without structured mapping")
                        
                except Exception as e:
                    print(f"Warning: Error retrieving question paper: {e}")
            
            # Step 3: Q&A Mapping
            mapped_qa_pairs = []
            if questions and len(questions) > 0:
                try:
                    mapped_qa_pairs = map_questions_to_answers(extracted_text, questions)
                    
                    if not mapped_qa_pairs or len(mapped_qa_pairs) == 0:
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="No Q&A pairs could be identified from the text"
                        )
                        
                except Exception as mapping_error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Q&A mapping failed: {str(mapping_error)}"
                    )
            else:
                # No question paper provided - cannot proceed with evaluation
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Question paper is required for complete pipeline processing"
                )
            
            # Step 4: Evaluation
            try:
                evaluation_result = evaluate_and_generate_report(
                    mapped_qa_pairs,
                    evaluationType
                )
                
                if not evaluation_result:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Evaluation process failed to generate results"
                    )
                    
            except Exception as eval_error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Evaluation failed: {str(eval_error)}"
                )
            
            # Step 5: Store results in database
            user_id = current_user.get('user_id', 'anonymous') if current_user else 'anonymous'
            
            try:
                evaluation_doc = EvaluationModel.create_evaluation_document(
                    student_id=user_id,
                    question_paper_id=questionPaperId or "pipeline",
                    evaluations=evaluation_result.get('evaluations', []),
                    summary=evaluation_result.get('summary', {}),
                    evaluation_type=evaluationType,
                    processing_stats=evaluation_result.get('processingStats', {}),
                    student_name=studentName,
                    total_questions=evaluation_result.get('totalQuestions', 0),
                    ocr_text=extracted_text,
                    original_filename=file.filename
                )
                
                result = evaluations_collection.insert_one(evaluation_doc)
                evaluation_id = str(result.inserted_id)
                
            except Exception as db_error:
                print(f"Warning: Could not store evaluation in database: {db_error}")
                evaluation_id = None
            
            # Compile statistics
            combined_stats = {
                "mapping": get_mapping_stats(),
                "evaluation": get_evaluation_stats(),
                "pipeline": {
                    "text_length": len(extracted_text),
                    "questions_mapped": len(mapped_qa_pairs),
                    "questions_evaluated": evaluation_result.get('totalQuestions', 0),
                    "processing_stages": ["OCR", "Mapping", "Evaluation"]
                }
            }
            
            return CompleteProcessResponse(
                success=True,
                message=f"Complete pipeline processing successful. Evaluated {len(mapped_qa_pairs)} questions.",
                evaluationId=evaluation_id,
                result=evaluation_result,
                ocrText=extracted_text,
                questions=mapped_qa_pairs,
                stats=combined_stats
            )
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Warning: Could not delete temporary file {temp_file_path}: {e}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Complete pipeline processing failed: {str(e)}"
        )

@pipeline_router.get("/health", response_model=dict)
async def pipeline_health_check():
    """Check complete pipeline health"""
    try:
        # Check all components
        health_status = {
            "pipeline": "healthy",
            "components": {}
        }
        
        # Check OCR
        try:
            from ocr.ocr_processor import model as ocr_model
            health_status["components"]["ocr"] = "healthy" if ocr_model else "unhealthy"
        except Exception:
            health_status["components"]["ocr"] = "unhealthy"
        
        # Check Mapping
        try:
            from qna_mapping.mapper import model as mapping_model
            health_status["components"]["mapping"] = "healthy" if mapping_model else "unhealthy"
        except Exception:
            health_status["components"]["mapping"] = "unhealthy"
        
        # Check Evaluation
        try:
            from evaluation.evaluator import model as eval_model
            health_status["components"]["evaluation"] = "healthy" if eval_model else "unhealthy"
        except Exception:
            health_status["components"]["evaluation"] = "unhealthy"
        
        # Overall health
        all_healthy = all(status == "healthy" for status in health_status["components"].values())
        health_status["pipeline"] = "healthy" if all_healthy else "partial"
        
        return {
            "status": health_status["pipeline"],
            "message": "Complete pipeline health check",
            "service": "Complete Pipeline",
            "components": health_status["components"]
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Pipeline health check error: {str(e)}",
            "service": "Complete Pipeline"
        } 