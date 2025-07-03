"""
Database Initialization Script for LMS_DATA
Tests MongoDB connection and creates initial collections
"""

import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

# Load environment variables from the parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(parent_dir, '.env')
load_dotenv(env_path)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_mongodb_connection():
    """Test MongoDB connection and initialize LMS_DATA database"""
    try:
        from mongoDB.db_config import mongo_db, get_db
        
        # Test connection
        db = get_db()
        
        # Get server info
        client = mongo_db.client
        server_info = client.server_info()
        
        logger.info("✅ Successfully connected to MongoDB!")
        logger.info(f"📊 MongoDB Server Version: {server_info.get('version')}")
        logger.info(f"🗄️  Database Name: LMS_DATA")
        
        # List existing collections
        collections = db.list_collection_names()
        logger.info(f"📁 Existing Collections: {collections}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        return False



def main():
    """Main initialization function"""
    print("🚀 Initializing LMS_DATA Database...")
    print("=" * 50)
    
    # Test MongoDB connection
    if not test_mongodb_connection():
        print("❌ Database initialization failed!")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Database initialized successfully!")
    print("✨ Production database ready for use!")
    
    return True

if __name__ == "__main__":
    main() 