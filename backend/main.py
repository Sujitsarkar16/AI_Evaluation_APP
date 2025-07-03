"""
AI Evaluation Backend - FastAPI Application
Production-ready FastAPI application with async support
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import time
import uvicorn

# Import configuration
from config import get_config, Config

# Import routers
from routes.auth_routes import auth_router
from routes.upload_routes import upload_router
from routes.ocr_routes import ocr_router
from routes.mapping_routes import mapping_router
from routes.evaluation_routes import evaluation_router
from routes.question_paper_routes import question_paper_router
from routes.pipeline_routes import pipeline_router
from routes.analytics_routes import analytics_router

# Import database
from mongoDB.db_config import get_db

# Configure logging
def setup_logging():
    """Configure application logging"""
    config = get_config()
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL.upper()),
        format=config.LOG_FORMAT
    )
    return logging.getLogger(__name__)

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    logger = logging.getLogger(__name__)
    
    # Startup
    logger.info("🚀 Starting AI Evaluation Backend...")
    
    # Validate configuration
    config = get_config()
    issues = config.validate_config()
    if issues:
        logger.warning("Configuration issues found:")
        for issue in issues:
            logger.warning(f"  - {issue}")
    
    # Initialize database connection
    try:
        db = get_db()
        logger.info("✅ Successfully connected to MongoDB Atlas - LMS_DATA database")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        logger.warning("Application may not function properly without database connection")
    
    # API key validation
    if not config.get_api_key():
        logger.warning("⚠️  Gemini API key not found. AI features will not work.")
        logger.warning("Set GOOGLE_API_KEY or GEMINI_API_KEY in environment variables.")
    else:
        logger.info("✅ Gemini API key found - AI features enabled")
    
    logger.info("🎉 Application startup completed successfully!")
    
    yield  # Application is running
    
    # Shutdown
    logger.info("🛑 Shutting down AI Evaluation Backend...")

# Create FastAPI application
def create_app() -> FastAPI:
    """Application factory pattern for FastAPI"""
    
    # Load configuration
    config = get_config()
    
    # Create FastAPI app with lifespan events
    app = FastAPI(
        title="AI Evaluation Backend",
        description="Production-ready AI-powered evaluation system",
        version="2.0.0",
        docs_url="/docs" if config.DEBUG else None,
        redoc_url="/redoc" if config.DEBUG else None,
        lifespan=lifespan
    )
    
    # Security middleware
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["*"] if config.DEBUG else ["localhost", "127.0.0.1"]
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if config.DEBUG else config.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Request timing middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    
    # Error handling
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger = logging.getLogger(__name__)
        logger.error(f"Global exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    
    # Ensure upload directory exists
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    
    # Mount static files
    app.mount("/uploads", StaticFiles(directory=config.UPLOAD_FOLDER), name="uploads")
    
    # Include routers
    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(upload_router, prefix="/api/uploads", tags=["Uploads"])
    app.include_router(ocr_router, prefix="/api/ocr", tags=["OCR"])
    app.include_router(mapping_router, prefix="/api/mapping", tags=["Q&A Mapping"])
    app.include_router(evaluation_router, prefix="/api/evaluate", tags=["Evaluation"])
    app.include_router(question_paper_router, prefix="/api/question-papers", tags=["Question Papers"])
    app.include_router(pipeline_router, prefix="/api/process-complete", tags=["Complete Pipeline"])
    app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
    
    # Health check endpoint
    @app.get("/api/health", tags=["System"])
    async def health_check():
        """Application health check"""
        return {
            "status": "healthy",
            "message": "AI Evaluation Backend is running",
            "version": "2.0.0",
            "framework": "FastAPI"
        }
    
    # System information endpoint
    @app.get("/api/info", tags=["System"])
    async def system_info():
        """Get system information"""
        issues = config.validate_config()
        return {
            "application": "AI Evaluation Backend",
            "version": "2.0.0",
            "framework": "FastAPI",
            "environment": os.getenv('FLASK_ENV', 'development'),
            "database": "MongoDB Atlas",
            "configuration_issues": issues if issues else None
        }
    
    return app

# Create the application instance
app = create_app()

# Set up logging
logger = setup_logging()

if __name__ == "__main__":
    config = get_config()
    logger.info(f"Starting AI Evaluation Backend on {config.HOST}:{config.PORT}")
    logger.info(f"Debug mode: {config.DEBUG}")
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level=config.LOG_LEVEL.lower(),
        access_log=True
    ) 