"""
OCR Routes
FastAPI router for OCR processing using Gemini API
"""

import os
import time
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse

from mongoDB.auth import get_current_user, get_current_user_optional
from ocr.ocr_processor import process_document
from models.schemas import APIResponse
from config import Config

# Create FastAPI Router
ocr_router = APIRouter()

@ocr_router.post("/", response_model=dict)
async def process_ocr(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Process uploaded file (PDF or image) using OCR
    Extracts text content using Gemini API
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
            # Process document using OCR
            extracted_text = process_document(temp_file_path)
            
            if not extracted_text or not extracted_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No text could be extracted from the document"
                )
            
            return {
                "success": True,
                "message": "OCR processing completed successfully",
                "text": extracted_text,
                "filename": file.filename,
                "file_type": file_ext,
                "text_length": len(extracted_text)
            }
            
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
            detail=f"OCR processing failed: {str(e)}"
        )

@ocr_router.get("/health", response_model=dict)
async def ocr_health_check():
    """Check OCR service health"""
    try:
        # Test if Gemini model is properly configured
        from ocr.ocr_processor import model
        
        if model is None:
            return {
                "status": "unhealthy",
                "message": "Gemini model not initialized",
                "service": "OCR"
            }
        
        return {
            "status": "healthy",
            "message": "OCR service is operational",
            "service": "OCR",
            "model": "gemini-2.5-flash-preview-04-17"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy", 
            "message": f"OCR service error: {str(e)}",
            "service": "OCR"
        } 