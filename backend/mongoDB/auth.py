"""
MongoDB User Authentication Module
Handles user registration, login, and session management
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from functools import wraps
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson.objectid import ObjectId
import logging

logger = logging.getLogger(__name__)

class AuthManager:
    """MongoDB-based authentication manager"""
    
    def __init__(self, users_collection):
        self.users_collection = users_collection
        # Use the centralized config instead of hardcoded env vars
        from config import get_config
        config = get_config()
        self.secret_key = config.JWT_SECRET
        if not self.secret_key:
            raise ValueError("JWT_SECRET environment variable is required")
        
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_token(self, user_id: str, username: str, role: str) -> str:
        """Generate JWT token for user session"""
        from config import get_config
        config = get_config()
        payload = {
            'user_id': user_id,
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=config.JWT_ALGORITHM)
    
    def verify_token(self, token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            from config import get_config
            config = get_config()
            payload = jwt.decode(token, self.secret_key, algorithms=[config.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return {"error": "Token has expired"}
        except jwt.InvalidTokenError:
            return {"error": "Invalid token"}
    
    def register_user(self, username: str, email: str, password: str, 
                     first_name: str = "", last_name: str = "", role: str = "student") -> dict:
        """Register a new user"""
        try:
            # Check if user already exists
            existing_user = self.users_collection.find_one({
                "$or": [{"username": username}, {"email": email}]
            })
            
            if existing_user:
                if existing_user.get('username') == username:
                    return {"success": False, "message": "Username already exists"}
                else:
                    return {"success": False, "message": "Email already exists"}
            
            # Hash password
            hashed_password = self.hash_password(password)
            
            # Create user document
            from .models import UserModel
            user_doc = UserModel.create_user_document(
                username=username,
                email=email,
                password_hash=hashed_password,
                role=role,
                first_name=first_name,
                last_name=last_name
            )
            
            # Insert user
            result = self.users_collection.insert_one(user_doc)
            
            logger.info(f"New user registered: {username} ({email})")
            
            return {
                "success": True,
                "message": "User registered successfully",
                "user_id": str(result.inserted_id)
            }
            
        except Exception as e:
            logger.error(f"Error registering user: {e}")
            return {"success": False, "message": f"Registration failed: {str(e)}"}
    
    def login_user(self, username_or_email: str, password: str) -> dict:
        """Authenticate user login"""
        try:
            # Find user by username or email
            user = self.users_collection.find_one({
                "$or": [
                    {"username": username_or_email},
                    {"email": username_or_email}
                ]
            })
            
            if not user:
                return {"success": False, "message": "User not found"}
            
            # Verify password
            if not self.verify_password(password, user['password_hash']):
                return {"success": False, "message": "Invalid password"}
            
            # Check if user is active
            if user.get('status') != 'active':
                return {"success": False, "message": "Account is deactivated"}
            
            # Update last login
            self.users_collection.update_one(
                {"_id": user['_id']},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            
            # Generate token
            token = self.generate_token(
                str(user['_id']),
                user['username'],
                user['role']
            )
            
            logger.info(f"User logged in: {user['username']}")
            
            return {
                "success": True,
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": str(user['_id']),
                    "username": user['username'],
                    "email": user['email'],
                    "role": user['role'],
                    "first_name": user.get('first_name', ''),
                    "last_name": user.get('last_name', '')
                }
            }
            
        except Exception as e:
            logger.error(f"Error during login: {e}")
            return {"success": False, "message": f"Login failed: {str(e)}"}
    
    def get_user_by_id(self, user_id: str) -> dict:
        """Get user information by ID"""
        try:
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                user.pop('password_hash', None)  # Remove password hash
                return user
            return None
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    def update_user_profile(self, user_id: str, updates: dict) -> dict:
        """Update user profile information"""
        try:
            # Remove sensitive fields that shouldn't be updated this way
            forbidden_fields = ['_id', 'password_hash', 'username', 'email', 'role', 'created_at']
            for field in forbidden_fields:
                updates.pop(field, None)
            
            updates['updated_at'] = datetime.utcnow()
            
            result = self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": updates}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Profile updated successfully"}
            else:
                return {"success": True, "message": "Profile updated successfully"}
                
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return {"success": False, "message": f"Update failed: {str(e)}"}
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> dict:
        """Change user password"""
        try:
            user = self.users_collection.find_one({"_id": ObjectId(user_id)})
            if not user:
                return {"success": False, "message": "User not found"}
            
            # Verify current password
            if not self.verify_password(current_password, user['password_hash']):
                return {"success": False, "message": "Current password is incorrect"}
            
            # Hash new password
            new_hashed = self.hash_password(new_password)
            
            # Update password
            self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {
                    "password_hash": new_hashed,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {"success": True, "message": "Password changed successfully"}
            
        except Exception as e:
            logger.error(f"Error changing password: {e}")
            return {"success": False, "message": f"Password change failed: {str(e)}"}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """FastAPI dependency to get current authenticated user"""
    try:
        from mongoDB.db_config import users_collection
        auth_manager = AuthManager(users_collection)
        
        payload = auth_manager.verify_token(credentials.credentials)
        if 'error' in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=payload['error']
            )
        
        return payload
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid"
        )

async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))):
    """FastAPI dependency to get current authenticated user (optional)"""
    if not credentials:
        return None
    
    try:
        from mongoDB.db_config import users_collection
        auth_manager = AuthManager(users_collection)
        
        payload = auth_manager.verify_token(credentials.credentials)
        if 'error' in payload:
            return None
        
        return payload
        
    except Exception:
        return None

async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """FastAPI dependency to require admin role"""
    user_role = current_user.get('role')
    if user_role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user

 