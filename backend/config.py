"""
Configuration settings for AI Evaluation Backend
Centralized configuration management
"""

import os
import secrets
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'aafb939274d1e5108abe06da3e4a49d4ec651efe90de2b788dc5d25fa0a68b72')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # File Upload Configuration
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', str(16 * 1024 * 1024)))  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'txt', 'doc', 'docx', 'md', 'markdown'}
    
    # Database Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/ai_evaluation_app')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'LMS_DATA')
    
    # API Keys
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # JWT Configuration
    JWT_SECRET = os.getenv('JWT_SECRET', '7c3e8fbc53f354c87b742f6b608787eb7458efc4ffb643529d5ae316260731fd')
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8081,http://localhost:3000,http://localhost:5173').split(',')
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    @classmethod
    def get_api_key(cls):
        """Get the appropriate API key for Gemini"""
        return cls.GOOGLE_API_KEY or cls.GEMINI_API_KEY
    
    @classmethod
    def validate_config(cls):
        """Validate critical configuration settings"""
        issues = []
        
        if not cls.get_api_key():
            issues.append("Missing GOOGLE_API_KEY or GEMINI_API_KEY - AI features disabled")
        
        if not cls.MONGODB_URI:
            issues.append("Missing MONGODB_URI")
        
        # Don't require these for development
        if cls.DEBUG:
            if cls.SECRET_KEY == 'aafb939274d1e5108abe06da3e4a49d4ec651efe90de2b788dc5d25fa0a68b72':
                issues.append("Using default SECRET_KEY - set custom key for production")
            if cls.JWT_SECRET == '7c3e8fbc53f354c87b742f6b608787eb7458efc4ffb643529d5ae316260731fd':
                issues.append("Using default JWT_SECRET - set custom key for production")
        
        return issues

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    
    @classmethod
    def validate_config(cls):
        """Stricter validation for production"""
        issues = super().validate_config()
        
        if not cls.SECRET_KEY or cls.SECRET_KEY == 'aafb939274d1e5108abe06da3e4a49d4ec651efe90de2b788dc5d25fa0a68b72':
            issues.append("SECRET_KEY environment variable not set or using default")
        
        if not cls.JWT_SECRET or cls.JWT_SECRET == '7c3e8fbc53f354c87b742f6b608787eb7458efc4ffb643529d5ae316260731fd':
            issues.append("JWT_SECRET environment variable not set or using default")
        
        return issues
    
# Configuration mapping
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'default')
    return config_by_name.get(env, DevelopmentConfig) 