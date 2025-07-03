"""
Q&A Mapping Routes
FastAPI router for mapping questions to answers using Gemini API
"""

import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from mongoDB.auth import get_current_user, get_current_user_optional
from mongoDB.db_config import question_papers_collection
from qna_mapping.mapper import map_questions_to_answers, get_mapping_stats
from models.schemas import APIResponse
from bson.objectid import ObjectId

# Request/Response Models
class MappingRequest(BaseModel):
    text: str
    questionPaperId: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = None

class MappingResponse(BaseModel):
    success: bool
    message: str
    questions: List[Dict[str, Any]]
    stats: Optional[Dict[str, Any]] = None
    mapping_count: int

# Create FastAPI Router
mapping_router = APIRouter()

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

@mapping_router.post("/", response_model=MappingResponse)
async def map_qa_pairs(
    request: MappingRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Map student answers to questions from a question paper
    Uses Gemini AI to intelligently match answers to questions
    """
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content is required for mapping"
            )
        
        questions = None
        
        # Get questions from question paper ID or direct questions list
        if request.questionPaperId:
            try:
                question_paper = question_papers_collection.find_one({
                    '_id': ObjectId(request.questionPaperId)
                })
                
                if not question_paper:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Question paper not found"
                    )
                
                questions = question_paper.get('questions', [])
                
            except Exception as e:
                if "ObjectId" in str(e):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid question paper ID format"
                    )
                raise
                
        elif request.questions:
            questions = request.questions
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either questionPaperId or questions list is required"
            )
        
        if not questions or len(questions) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No questions found for mapping"
            )
        
        # Perform Q&A mapping
        try:
            mapped_qa_pairs = map_questions_to_answers(request.text, questions)
            
            if not mapped_qa_pairs:
                return MappingResponse(
                    success=True,
                    message="Mapping completed but no Q&A pairs were identified",
                    questions=[],
                    mapping_count=0,
                    stats=get_mapping_stats()
                )
            
            return MappingResponse(
                success=True,
                message=f"Successfully mapped {len(mapped_qa_pairs)} Q&A pairs",
                questions=mapped_qa_pairs,
                mapping_count=len(mapped_qa_pairs),
                stats=get_mapping_stats()
            )
            
        except Exception as mapping_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Mapping process failed: {str(mapping_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Q&A mapping failed: {str(e)}"
        )

@mapping_router.get("/stats", response_model=dict)
async def get_mapping_statistics():
    """Get mapping usage statistics"""
    try:
        stats = get_mapping_stats()
        return {
            "success": True,
            "stats": stats,
            "service": "Q&A Mapping"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get mapping stats: {str(e)}"
        )

@mapping_router.get("/health", response_model=dict)
async def mapping_health_check():
    """Check Q&A mapping service health"""
    try:
        # Test if Gemini model is properly configured
        from qna_mapping.mapper import model
        
        if model is None:
            return {
                "status": "unhealthy",
                "message": "Gemini model not initialized for mapping",
                "service": "Q&A Mapping"
            }
        
        return {
            "status": "healthy",
            "message": "Q&A mapping service is operational",
            "service": "Q&A Mapping",
            "model": "gemini-2.5-flash-preview-04-17"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "message": f"Q&A mapping service error: {str(e)}",
            "service": "Q&A Mapping"
        } 