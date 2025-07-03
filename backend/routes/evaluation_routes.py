"""
Evaluation Routes
FastAPI router for evaluating Q&A pairs using Gemini AI
"""

import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime

from mongoDB.auth import get_current_user, get_current_user_optional
from mongoDB.db_config import evaluations_collection
from evaluation.evaluator import evaluate_and_generate_report, get_evaluation_stats
from mongoDB.models import EvaluationModel
from models.schemas import APIResponse, EvaluationResult, EvaluationSummary
from bson.objectid import ObjectId

# Request/Response Models
class EvaluationRequest(BaseModel):
    questions: List[Dict[str, Any]]
    evaluationType: str = "rubric"
    studentName: Optional[str] = "Anonymous"
    questionPaperId: Optional[str] = None

class EvaluationResponse(BaseModel):
    success: bool
    message: str
    evaluationId: Optional[str] = None
    result: Dict[str, Any]
    stats: Optional[Dict[str, Any]] = None

# Create FastAPI Router
evaluation_router = APIRouter()

def parse_json(obj):
    """Convert ObjectId to string for JSON serialization"""
    if isinstance(obj, list):
        return [parse_json(item) for item in obj]
    elif isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                result[key] = parse_json(value)
            else:
                result[key] = value
        return result
    else:
        return obj

@evaluation_router.post("/", response_model=EvaluationResponse)
async def evaluate_qa_pairs(
    request: EvaluationRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Evaluate Q&A pairs using Gemini AI with rubric-based assessment
    Stores results in database and returns comprehensive evaluation report
    """
    try:
        if not request.questions or len(request.questions) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Questions list is required and cannot be empty"
            )
        
        # Validate evaluation type
        if request.evaluationType not in ["rubric", "holistic"]:
            request.evaluationType = "rubric"  # Default to rubric
        
        user_id = current_user.get('user_id', 'anonymous') if current_user else 'anonymous'
        
        # Perform evaluation using the evaluation module
        try:
            evaluation_result = evaluate_and_generate_report(
                request.questions, 
                request.evaluationType
            )
            
            if not evaluation_result:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Evaluation process failed to generate results"
                )
            
            # Create evaluation document for database storage
            evaluation_doc = EvaluationModel.create_evaluation_document(
                student_id=user_id,
                question_paper_id=request.questionPaperId or "manual",
                evaluations=evaluation_result.get('evaluations', []),
                summary=evaluation_result.get('summary', {}),
                evaluation_type=request.evaluationType,
                processing_stats=evaluation_result.get('processingStats', {}),
                student_name=request.studentName,
                total_questions=evaluation_result.get('totalQuestions', 0)
            )
            
            # Store in database
            try:
                result = evaluations_collection.insert_one(evaluation_doc)
                evaluation_id = str(result.inserted_id)
                
                # Update the evaluation result with database ID
                evaluation_result['evaluationId'] = evaluation_id
                
            except Exception as db_error:
                print(f"Warning: Could not store evaluation in database: {db_error}")
                evaluation_id = None
            
            return EvaluationResponse(
                success=True,
                message=f"Successfully evaluated {len(request.questions)} questions",
                evaluationId=evaluation_id,
                result=evaluation_result,
                stats=get_evaluation_stats()
            )
            
        except Exception as eval_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Evaluation process failed: {str(eval_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )

@evaluation_router.get("/{evaluation_id}", response_model=dict)
async def get_evaluation(
    evaluation_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get evaluation results by ID"""
    try:
        evaluation = evaluations_collection.find_one({
            '_id': ObjectId(evaluation_id)
        })
        
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found"
            )
        
        return {
            'success': True,
            'evaluation': parse_json(evaluation)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid evaluation ID format"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get evaluation: {str(e)}"
        )

@evaluation_router.get("/", response_model=dict)
async def list_evaluations(
    current_user: Optional[dict] = Depends(get_current_user_optional),
    limit: int = 20,
    skip: int = 0
):
    """List evaluations for the current user"""
    try:
        user_id = current_user.get('user_id') if current_user else None
        
        # Build query - Show all evaluations for admin or when no user is authenticated
        # In production, you may want to restrict this based on user roles
        query = {}
        if user_id and user_id != 'anonymous':
            # Filter by user only if authenticated and not anonymous
            query['student_id'] = user_id
        
        # Get evaluations with pagination
        cursor = evaluations_collection.find(query).sort('created_at', -1).skip(skip).limit(limit)
        evaluations = list(cursor)
        
        # Get total count
        total_count = evaluations_collection.count_documents(query)
        
        return {
            'success': True,
            'evaluations': parse_json(evaluations),
            'pagination': {
                'total': total_count,
                'skip': skip,
                'limit': limit,
                'has_more': total_count > skip + limit
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list evaluations: {str(e)}"
        )

@evaluation_router.get("/stats", response_model=dict)
async def get_evaluation_statistics():
    """Get evaluation usage statistics"""
    try:
        stats = get_evaluation_stats()
        return {
            "success": True,
            "stats": stats,
            "service": "Evaluation"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get evaluation stats: {str(e)}"
        )

@evaluation_router.get("/health", response_model=dict)
async def evaluation_health_check():
    """Check evaluation service health"""
    try:
        # Test if Gemini model is properly configured
        from evaluation.evaluator import model
        
        if model is None:
            return {
                "status": "unhealthy",
                "message": "Gemini model not initialized for evaluation",
                "service": "Evaluation"
            }
        
        return {
            "status": "healthy",
            "message": "Evaluation service is operational",
            "service": "Evaluation",
            "model": "gemini-2.5-flash-preview-04-17"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Evaluation service error: {str(e)}",
            "service": "Evaluation"
        }

@evaluation_router.delete("/{evaluation_id}", response_model=dict)
async def delete_evaluation(
    evaluation_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Delete evaluation by ID"""
    try:
        # Check if evaluation exists
        evaluation = evaluations_collection.find_one({
            '_id': ObjectId(evaluation_id)
        })
        
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found"
            )
        
        # Delete the evaluation
        result = evaluations_collection.delete_one({
            '_id': ObjectId(evaluation_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete evaluation"
            )
        
        return {
            'success': True,
            'message': 'Evaluation deleted successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid evaluation ID format"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete evaluation: {str(e)}"
        ) 