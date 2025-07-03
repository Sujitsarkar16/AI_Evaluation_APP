"""
MongoDB Models for LMS_DATA Database
Defines the schema and structure for various collections
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from bson.objectid import ObjectId
import logging

logger = logging.getLogger(__name__)

class BaseModel:
    """Base model with common fields and methods"""
    
    @staticmethod
    def get_current_timestamp():
        """Get current timestamp"""
        return datetime.utcnow()
    
    @staticmethod
    def serialize_document(doc: Dict) -> Dict:
        """Convert MongoDB document to JSON serializable format"""
        if doc is None:
            return None
        
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, list):
                serialized[key] = [BaseModel.serialize_document(item) if isinstance(item, dict) else item for item in value]
            elif isinstance(value, dict):
                serialized[key] = BaseModel.serialize_document(value)
            else:
                serialized[key] = value
        return serialized

class UserModel(BaseModel):
    """User model for authentication and user management"""
    
    @staticmethod
    def create_user_document(
        username: str,
        email: str,
        password_hash: str,
        role: str = "student",
        **kwargs
    ) -> Dict:
        """Create a new user document"""
        return {
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "role": role,
            "first_name": kwargs.get("first_name", ""),
            "last_name": kwargs.get("last_name", ""),
            "status": "active",
            "profile": {
                "avatar": kwargs.get("avatar", ""),
                "bio": kwargs.get("bio", ""),
                "phone": kwargs.get("phone", ""),
                "date_of_birth": kwargs.get("date_of_birth"),
                "address": kwargs.get("address", ""),
                "preferences": kwargs.get("preferences", {})
            },
            "academic": {
                "student_id": kwargs.get("student_id", ""),
                "course": kwargs.get("course", ""),
                "semester": kwargs.get("semester", ""),
                "year": kwargs.get("year", ""),
                "department": kwargs.get("department", "")
            },
            "permissions": kwargs.get("permissions", []),
            "last_login": None,
            "login_count": 0,
            "created_at": BaseModel.get_current_timestamp(),
            "updated_at": BaseModel.get_current_timestamp()
        }

class QuestionPaperModel(BaseModel):
    """Question paper model"""
    
    @staticmethod
    def create_question_paper_document(
        title: str,
        questions: List[Dict],
        creator_id: str = "system",
        **kwargs
    ) -> Dict:
        """Create a new question paper document"""
        return {
            "title": title,
            "description": kwargs.get("description", ""),
            "questions": questions,
            "creator_id": creator_id,
            "type": kwargs.get("type", "MANUAL"),
            "difficulty": kwargs.get("difficulty", "medium"),
            "subject": kwargs.get("subject", ""),
            "topic": kwargs.get("topic", ""),
            "duration": kwargs.get("duration", 120),
            "total_marks": sum(q.get("maxMarks", 0) for q in questions),
            "metadata": kwargs.get("metadata", {}),
            "validation": kwargs.get("validation", {}),
            "status": "active",
            "source": kwargs.get("source", "manual"),
            "created_at": BaseModel.get_current_timestamp(),
            "updated_at": BaseModel.get_current_timestamp()
        }

class EvaluationModel(BaseModel):
    """Evaluation model for storing assessment results"""
    
    @staticmethod
    def create_evaluation_document(
        student_id: str,
        question_paper_id: str,
        evaluations: List[Dict],
        summary: Dict,
        **kwargs
    ) -> Dict:
        """Create a new evaluation document"""
        return {
            "student_id": student_id,
            "student_name": kwargs.get("student_name", "Anonymous"),
            "question_paper_id": ObjectId(question_paper_id) if question_paper_id != "manual" and question_paper_id != "pipeline" else question_paper_id,
            "evaluations": evaluations,
            "summary": summary,
            "evaluation_type": kwargs.get("evaluation_type", "rubric"),
            "processing_stats": kwargs.get("processing_stats", {}),
            "status": kwargs.get("status", "completed"),
            "original_filename": kwargs.get("original_filename"),
            "ocr_text": kwargs.get("ocr_text"),
            "total_questions": kwargs.get("total_questions", 0),
            "created_at": BaseModel.get_current_timestamp(),
            "updated_at": BaseModel.get_current_timestamp()
        } 