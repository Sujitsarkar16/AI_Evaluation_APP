"""
Upload Queue Routes
FastAPI router for file uploads, queue management, and evaluation processing
"""

import os
import time
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from bson.objectid import ObjectId

from mongoDB.auth import get_current_user
from mongoDB.db_config import upload_queue_collection, evaluations_collection, question_papers_collection
from models.schemas import BatchUploadResponse, FileMetadata, UploadStats, APIResponse
from config import Config

# Helper function for parsing JSON objects with ObjectId
def parse_json(obj):
    """Convert ObjectId to string for JSON serialization"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, ObjectId):
                obj[key] = str(value)
            elif isinstance(value, datetime):
                obj[key] = value.isoformat()
            elif isinstance(value, dict):
                obj[key] = parse_json(value)
            elif isinstance(value, list):
                obj[key] = [parse_json(item) if isinstance(item, dict) else item for item in value]
    return obj

# Create FastAPI Router
upload_router = APIRouter()

# Get collections
upload_queue = upload_queue_collection
evaluations = evaluations_collection
question_papers = question_papers_collection

@upload_router.post("/batch", response_model=BatchUploadResponse)
async def upload_batch_pdfs(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload multiple PDFs to the queue"""
    try:
        if len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files selected"
            )
        
        if len(files) > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 10 files allowed at once"
            )
        
        user_id = current_user['user_id']
        uploaded_files = []
        failed_files = []
        
        for file in files:
            try:
                if not file.filename:
                    continue
                
                # Check if it's a PDF
                if not file.filename.lower().endswith('.pdf'):
                    failed_files.append({
                        'filename': file.filename,
                        'error': 'Only PDF files are allowed'
                    })
                    continue
                
                # Read file content and check size
                content = await file.read()
                file_size = len(content)
                
                if file_size > Config.MAX_CONTENT_LENGTH:
                    failed_files.append({
                        'filename': file.filename,
                        'error': 'File too large. Maximum size is 16MB'
                    })
                    continue
                
                # Generate unique filename
                unique_filename = f"queue_{user_id}_{int(time.time())}_{file.filename}"
                
                # Save file
                file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
                
                # Create upload record
                upload_record = {
                    'user_id': user_id,
                    'original_filename': file.filename,
                    'stored_filename': unique_filename,
                    'file_path': file_path,
                    'file_url': f"/uploads/{unique_filename}",
                    'file_size': file_size,
                    'file_type': 'pdf',
                    'status': 'queued',
                    'upload_date': datetime.now(),
                    'created_at': datetime.now(),
                    'updated_at': datetime.now()
                }
                
                result = upload_queue.insert_one(upload_record)
                upload_record['_id'] = str(result.inserted_id)
                upload_record = parse_json(upload_record)
                
                uploaded_files.append(upload_record)
                
            except Exception as e:
                failed_files.append({
                    'filename': file.filename,
                    'error': f'Upload failed: {str(e)}'
                })
                continue
        
        return BatchUploadResponse(
            success=True,
            message=f"Successfully uploaded {len(uploaded_files)} files",
            uploaded_files=uploaded_files,
            failed_files=failed_files
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {str(e)}"
        )

@upload_router.get("/", response_model=dict)
async def get_uploads(
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all uploaded files for the current user"""
    try:
        user_id = current_user['user_id']
        
        # Build query
        query = {'user_id': user_id}
        if status_filter:
            query['status'] = status_filter
        
        # Get total count
        total_count = upload_queue.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cursor = upload_queue.find(query).sort('created_at', -1).skip(skip).limit(limit)
        uploads = list(cursor)
        
        # Convert to JSON serializable format
        uploads_data = parse_json(uploads)
        
        return {
            'success': True,
            'uploads': uploads_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get uploads: {str(e)}"
        )

@upload_router.get("/{upload_id}", response_model=dict)
async def get_upload(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific upload by ID"""
    try:
        user_id = current_user['user_id']
        
        upload = upload_queue.find_one({
            '_id': ObjectId(upload_id),
            'user_id': user_id
        })
        
        if not upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload not found"
            )
        
        return {
            'success': True,
            'upload': parse_json(upload)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get upload: {str(e)}"
        )

@upload_router.delete("/{upload_id}", response_model=APIResponse)
async def delete_upload(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an uploaded file"""
    try:
        user_id = current_user['user_id']
        
        # Find the upload
        upload = upload_queue.find_one({
            '_id': ObjectId(upload_id),
            'user_id': user_id
        })
        
        if not upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload not found"
            )
        
        # Delete the physical file
        file_path = upload.get('file_path')
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete from database
        upload_queue.delete_one({'_id': ObjectId(upload_id)})
        
        return APIResponse(
            success=True,
            message="File deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete upload: {str(e)}"
        )

@upload_router.post("/{upload_id}/evaluate", response_model=APIResponse)
async def evaluate_upload(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Start evaluation process for an uploaded file"""
    try:
        user_id = current_user['user_id']
        
        # Find the upload
        upload = upload_queue.find_one({
            '_id': ObjectId(upload_id),
            'user_id': user_id
        })
        
        if not upload:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upload not found"
            )
        
        if upload.get('status') != 'queued':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is not in queued status"
            )
        
        # Update status to processing
        upload_queue.update_one(
            {'_id': ObjectId(upload_id)},
            {
                '$set': {
                    'status': 'processing',
                    'updated_at': datetime.now()
                }
            }
        )
        
        # Here you would trigger the actual evaluation process
        # For now, we'll just update the status
        # TODO: Implement actual evaluation logic with Celery tasks
        
        return APIResponse(
            success=True,
            message="Evaluation started successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start evaluation: {str(e)}"
        )

@upload_router.get("/stats", response_model=UploadStats)
async def get_upload_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get upload statistics for the current user"""
    try:
        user_id = current_user['user_id']
        
        # Get status counts
        pipeline = [
            {'$match': {'user_id': user_id}},
            {'$group': {
                '_id': '$status',
                'count': {'$sum': 1},
                'total_size': {'$sum': '$file_size'}
            }}
        ]
        
        stats_result = list(upload_queue.aggregate(pipeline))
        
        # Initialize stats
        stats = {
            'total_files': 0,
            'pending_files': 0,
            'processing_files': 0,
            'completed_files': 0,
            'failed_files': 0,
            'total_size': 0
        }
        
        # Process results
        for item in stats_result:
            status_name = item['_id']
            count = item['count']
            size = item['total_size']
            
            stats['total_files'] += count
            stats['total_size'] += size
            
            if status_name == 'queued':
                stats['pending_files'] = count
            elif status_name == 'processing':
                stats['processing_files'] = count
            elif status_name == 'completed':
                stats['completed_files'] = count
            elif status_name == 'failed':
                stats['failed_files'] = count
        
        return UploadStats(**stats)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get upload stats: {str(e)}"
        ) 