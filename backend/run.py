#!/usr/bin/env python3
"""
Development run script for AI Evaluation Backend
Quick way to start the FastAPI server
"""

import uvicorn
from config import get_config

if __name__ == "__main__":
    config = get_config()
    
    print("🚀 Starting AI Evaluation Backend (FastAPI)")
    print(f"📍 Server: http://{config.HOST}:{config.PORT}")
    print(f"📚 API Docs: http://{config.HOST}:{config.PORT}/docs")
    print(f"🔧 Debug Mode: {config.DEBUG}")
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level=config.LOG_LEVEL.lower(),
        access_log=True
    ) 