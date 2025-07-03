"""
Pydantic models for request/response validation
FastAPI automatically validates requests and generates OpenAPI documentation
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# User Authentication Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    role: str = Field(default="student", pattern="^(student|teacher|admin)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: Optional[str] = None
    email: EmailStr
    role: str
    first_name: str
    last_name: str
    created_at: Optional[datetime] = None
    profile: Optional[Dict[str, Any]] = None

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    profile: Optional[Dict[str, Any]] = None

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str = Field(..., min_length=6)

# API Response Models
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class LoginResponse(APIResponse):
    token: Optional[str] = None
    user: Optional[UserResponse] = None

# Upload Models
class UploadResponse(BaseModel):
    success: bool
    message: str
    file_id: Optional[str] = None
    filename: Optional[str] = None
    file_path: Optional[str] = None

class BatchUploadResponse(BaseModel):
    success: bool
    message: str
    uploaded_files: List[UploadResponse]
    failed_files: List[Dict[str, str]]

# Question Paper Models
class Question(BaseModel):
    questionNumber: int
    questionText: str
    maxMarks: int
    type: str = Field(default="short_answer")

class QuestionPaper(BaseModel):
    title: str
    questions: List[Question]
    subject: Optional[str] = None
    description: Optional[str] = None

# Evaluation Models
class EvaluationResult(BaseModel):
    questionNumber: int
    questionText: str
    studentAnswer: str
    maxMarks: int
    obtainedMarks: float
    percentage: float
    feedback: str

class EvaluationSummary(BaseModel):
    totalMaxMarks: int
    totalObtained: float
    overallPercentage: float
    grade: str
    questionsEvaluated: int

class EvaluationResponse(BaseModel):
    student_id: str
    question_paper_id: str
    evaluations: List[EvaluationResult]
    summary: EvaluationSummary
    evaluation_type: str
    created_at: datetime

# System Models
class HealthCheck(BaseModel):
    status: str
    message: str
    version: str
    framework: str

class SystemInfo(BaseModel):
    application: str
    version: str
    framework: str
    environment: str
    database: str
    configuration_issues: Optional[List[str]] = None

# File Upload Metadata
class FileMetadata(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    upload_date: datetime
    status: str
    uploader_id: str

class UploadStats(BaseModel):
    total_files: int
    pending_files: int
    processing_files: int
    completed_files: int
    failed_files: int
    total_size: int 