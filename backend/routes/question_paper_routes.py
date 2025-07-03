"""
Question Paper Routes
FastAPI router for question paper management and parsing
"""

import os
import time
import tempfile
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from pydantic import BaseModel
from datetime import datetime

from mongoDB.auth import get_current_user, get_current_user_optional
from mongoDB.db_config import question_papers_collection
from mongoDB.models import QuestionPaperModel
from question_paper.parser import parse_question_paper, validate_parsed_questions
from models.schemas import APIResponse
from bson.objectid import ObjectId
from config import Config

# Request/Response Models
class QuestionPaperCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    questions: List[Dict[str, Any]]
    subject: Optional[str] = ""
    topic: Optional[str] = ""
    difficulty: str = "medium"
    duration: int = 120
    metadata: Optional[Dict[str, Any]] = {}
    validation: Optional[Dict[str, Any]] = {}
    source: str = "manual"

class QuestionPaperUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[int] = None

class ParseResponse(BaseModel):
    success: bool
    message: str
    questions: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None
    raw_structure: Optional[List[Dict[str, Any]]] = None
    validation: Optional[Dict[str, Any]] = None
    total_questions: int
    total_marks: int
    pages_processed: int

# Create FastAPI Router
question_paper_router = APIRouter()

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

# Test endpoint - MUST come before parameterized routes
@question_paper_router.get("/test", response_model=dict)
async def test_endpoint():
    """Simple test endpoint"""
    return {"message": "Question paper router is working", "success": True}

# Health check endpoint - MUST come before parameterized routes
@question_paper_router.get("/health", response_model=dict)
async def question_paper_health_check():
    """Health check for question paper service"""
    try:
        # Test database connectivity and question paper operations
        total_papers = question_papers_collection.count_documents({})
        
        return {
            "success": True,
            "message": "Question paper service is healthy",
            "data": {
                "database_connected": True,
                "total_question_papers": total_papers,
                "service": "question_papers",
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Question paper service health check failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# Parse endpoint - MUST come before parameterized routes
@question_paper_router.post("/parse", response_model=ParseResponse)
async def parse_question_paper_file(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Parse a question paper from uploaded file using AI"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Check file extension
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in ['pdf', 'jpg', 'jpeg', 'png']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and image files are supported"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Parse question paper
            result = parse_question_paper(temp_file_path)
            
            if not result.get('success', False):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=result.get('message', 'Question paper parsing failed')
                )
            
            # Validate parsed questions
            validation = validate_parsed_questions(result['questions'])
            
            return ParseResponse(
                success=True,
                message=result['message'],
                questions=result['questions'],
                metadata=result.get('metadata', {}),
                raw_structure=result.get('raw_structure', []),
                validation=validation,
                total_questions=len(result['questions']),
                total_marks=sum(q.get('maxMarks', 0) for q in result['questions']),
                pages_processed=result.get('pages_processed', 1)
            )
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse question paper: {str(e)}"
        )

@question_paper_router.post("/", response_model=dict)
async def create_question_paper(
    request: QuestionPaperCreate,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Create a new question paper"""
    try:
        user_id = current_user.get('user_id', 'anonymous') if current_user else 'anonymous'
        
        # Validate questions
        if not request.questions or len(request.questions) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Questions list cannot be empty"
            )
        
        # Validate parsed questions
        validation = validate_parsed_questions(request.questions)
        
        # Create question paper document
        question_paper_doc = QuestionPaperModel.create_question_paper_document(
            title=request.title,
            questions=request.questions,
            creator_id=user_id,
            description=request.description,
            subject=request.subject,
            topic=request.topic,
            difficulty=request.difficulty,
            duration=request.duration,
            metadata=request.metadata,
            validation=validation,
            source=request.source
        )
        
        # Insert into database
        result = question_papers_collection.insert_one(question_paper_doc)
        question_paper_id = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Question paper created successfully",
            "id": question_paper_id,
            "validation": validation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create question paper: {str(e)}"
        )

# List question papers
@question_paper_router.get("/", response_model=dict)
async def list_question_papers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    """List question papers with pagination and search"""
    try:
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"subject": {"$regex": search, "$options": "i"}},
                {"topic": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total_count = question_papers_collection.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cursor = question_papers_collection.find(query).sort('created_at', -1).skip(skip).limit(limit)
        question_papers = list(cursor)
        
        # Parse JSON safely
        parsed_papers = []
        for paper in question_papers:
            try:
                # Simple manual parsing
                simple_paper = {}
                for key, value in paper.items():
                    if isinstance(value, ObjectId):
                        simple_paper[key] = str(value)
                    elif isinstance(value, datetime):
                        simple_paper[key] = value.isoformat()
                    else:
                        simple_paper[key] = value
                parsed_papers.append(simple_paper)
            except Exception as item_error:
                continue
        
        return {
            'success': True,
            'question_papers': parsed_papers,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error listing question papers: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list question papers: {str(e)}"
        )

@question_paper_router.get("/{question_paper_id}", response_model=dict)
async def get_question_paper(
    question_paper_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get a specific question paper by ID"""
    try:
        question_paper = question_papers_collection.find_one({
            '_id': ObjectId(question_paper_id)
        })
        
        if not question_paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question paper not found"
            )
        
        return {
            'success': True,
            'question_paper': parse_json(question_paper)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid question paper ID format"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get question paper: {str(e)}"
        )

@question_paper_router.patch("/{question_paper_id}", response_model=dict)
async def update_question_paper(
    question_paper_id: str,
    request: QuestionPaperUpdate,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Update a question paper"""
    try:
        # Check if question paper exists
        existing_paper = question_papers_collection.find_one({
            '_id': ObjectId(question_paper_id)
        })
        
        if not existing_paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question paper not found"
            )
        
        # Build update data
        update_data = request.dict(exclude_unset=True)
        update_data['updated_at'] = datetime.now()
        
        # Update total marks if questions are updated
        if 'questions' in update_data:
            update_data['total_marks'] = sum(q.get('marks', 0) for q in update_data['questions'])
            # Re-validate questions
            update_data['validation'] = validate_parsed_questions(update_data['questions'])
        
        # Update in database
        question_papers_collection.update_one(
            {'_id': ObjectId(question_paper_id)},
            {'$set': update_data}
        )
        
        return {
            "success": True,
            "message": "Question paper updated successfully",
            "id": question_paper_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid question paper ID format"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update question paper: {str(e)}"
        )

@question_paper_router.delete("/{question_paper_id}", response_model=APIResponse)
async def delete_question_paper(
    question_paper_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Delete a question paper"""
    try:
        # Check if question paper exists
        existing_paper = question_papers_collection.find_one({
            '_id': ObjectId(question_paper_id)
        })
        
        if not existing_paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question paper not found"
            )
        
        # Delete from database
        question_papers_collection.delete_one({'_id': ObjectId(question_paper_id)})
        
        return APIResponse(
            success=True,
            message="Question paper deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        if "ObjectId" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid question paper ID format"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete question paper: {str(e)}"
        )

 