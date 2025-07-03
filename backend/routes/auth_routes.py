"""
Authentication routes for user management
FastAPI router for user registration, login, profile management
"""

import os
import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Import authentication manager and models
from mongoDB.auth import AuthManager, get_current_user, get_current_admin_user
from mongoDB.db_config import users_collection
from models.schemas import (
    UserRegister, UserLogin, UserResponse, UserProfileUpdate, 
    PasswordChange, APIResponse, LoginResponse
)
from config import Config

# Helper function for parsing JSON objects with ObjectId
def parse_json(obj):
    """Convert ObjectId to string for JSON serialization"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            obj[key] = parse_json(value)
    elif hasattr(obj, '__dict__'):
        return parse_json(obj.__dict__)
    return obj

# Create FastAPI Router
auth_router = APIRouter()

# Initialize AuthManager
auth_manager = AuthManager(users_collection)

# Security scheme
security = HTTPBearer()

@auth_router.post("/register", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user account"""
    try:
        # Generate username from email (take part before @)
        username = user_data.email.split('@')[0]
        
        result = auth_manager.register_user(
            username=username,
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role
        )
        
        if result['success']:
            return APIResponse(success=True, message=result['message'])
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['message']
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@auth_router.post("/login", response_model=LoginResponse)
async def login(login_data: UserLogin):
    """Authenticate user and return JWT token"""
    try:
        result = auth_manager.login_user(login_data.email, login_data.password)
        
        if result['success']:
            return LoginResponse(
                success=True,
                message=result['message'],
                token=result.get('token'),
                user=UserResponse(**result['user']) if result.get('user') else None
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result['message']
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@auth_router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        user_id = current_user['user_id']
        user = auth_manager.get_user_by_id(user_id)
        
        if user:
            # Remove sensitive information
            user.pop('password_hash', None)
            return UserResponse(**parse_json(user))
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get profile: {str(e)}"
        )

@auth_router.put("/profile", response_model=APIResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    try:
        user_id = current_user['user_id']
        data = profile_data.dict(exclude_unset=True)
        
        result = auth_manager.update_user_profile(user_id, data)
        
        if result['success']:
            return APIResponse(success=True, message=result['message'])
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['message']
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

@auth_router.post("/change-password", response_model=APIResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    try:
        user_id = current_user['user_id']
        
        result = auth_manager.change_password(
            user_id, 
            password_data.currentPassword, 
            password_data.newPassword
        )
        
        if result['success']:
            return APIResponse(success=True, message=result['message'])
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['message']
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

@auth_router.post("/upload-avatar", response_model=APIResponse)
async def upload_avatar(
    photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload user avatar"""
    try:
        # Check file type
        allowed_types = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        file_ext = photo.filename.lower().split('.')[-1] if photo.filename else ''
        
        if file_ext not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only images are allowed"
            )
        
        # Check file size (5MB limit)
        content = await photo.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large. Maximum size is 5MB"
            )
        
        # Generate unique filename
        filename = photo.filename
        unique_filename = f"avatar_{current_user['user_id']}_{int(time.time())}_{filename}"
        
        # Save file
        file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Create avatar URL
        avatar_url = f"/uploads/{unique_filename}"
        
        # Update user profile with avatar URL
        user_id = current_user['user_id']
        user = auth_manager.get_user_by_id(user_id)
        current_profile = user.get('profile', {}) if user else {}
        current_profile['avatar'] = avatar_url
        
        result = auth_manager.update_user_profile(user_id, {
            'profile': current_profile
        })
        
        if result['success']:
            return APIResponse(
                success=True,
                message="Avatar uploaded successfully",
                data={"avatar_url": avatar_url}
            )
        else:
            # Clean up uploaded file if database update failed
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['message']
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
        )

@auth_router.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user: dict = Depends(get_current_admin_user)):
    """Get all users (admin only)"""
    try:
        users = auth_manager.get_all_users()
        return [UserResponse(**parse_json(user)) for user in users]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )

 