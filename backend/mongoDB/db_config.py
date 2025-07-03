"""
MongoDB Database Configuration for LMS_DATA
Handles connection to MongoDB Atlas and database operations
"""

import os
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from datetime import datetime
from bson.objectid import ObjectId
from config import Config

# Configure logging
logger = logging.getLogger(__name__)

class MongoDB:
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDB, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.initialized = True
            self.connect()
    
    def connect(self):
        """Connect to MongoDB Atlas with the provided connection string"""
        try:
            # Get MongoDB configuration
            config = Config()
            
            # Create MongoDB client
            self._client = MongoClient(
                config.MONGODB_URI,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=10000,         # 10 second connection timeout
                socketTimeoutMS=10000,          # 10 second socket timeout
                maxPoolSize=10,                 # Maximum number of connections
                retryWrites=True               # Enable retryable writes
            )
            
            # Test the connection
            self._client.admin.command('ping')
            
            # Connect to configured database
            self._db = self._client[config.DATABASE_NAME]
            
            logger.info("Successfully connected to MongoDB Atlas - LMS_DATA database")
            
            # Initialize collections
            self._init_collections()
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise Exception(f"MongoDB connection failed: {e}")
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
            raise Exception(f"Database connection error: {e}")
    
    def _init_collections(self):
        """Initialize database collections with indexes"""
        try:
            # Create collections if they don't exist
            collections = [
                'users',
                'question_papers',
                'evaluations',
                'courses',
                'classes',
                'assignments',
                'notifications',
                'analytics',
                'upload_queue'
            ]
            
            existing_collections = self._db.list_collection_names()
            
            for collection_name in collections:
                if collection_name not in existing_collections:
                    self._db.create_collection(collection_name)
                    logger.info(f"Created collection: {collection_name}")
            
            # Create indexes for better performance
            self._create_indexes()
            
        except Exception as e:
            logger.error(f"Error initializing collections: {e}")
    
    def _create_indexes(self):
        """Create database indexes for better query performance"""
        try:
            # Question papers indexes
            self._db.question_papers.create_index([("createdAt", -1)])
            self._db.question_papers.create_index([("title", "text")])
            self._db.question_papers.create_index([("type", 1)])
            
            # Evaluations indexes
            self._db.evaluations.create_index([("createdAt", -1)])
            self._db.evaluations.create_index([("studentId", 1)])
            self._db.evaluations.create_index([("questionPaperId", 1)])
            
            # Users indexes
            self._db.users.create_index([("email", 1)], unique=True)
            self._db.users.create_index([("username", 1)], unique=True)
            
            # Upload queue indexes
            self._db.upload_queue.create_index([("user_id", 1)])
            self._db.upload_queue.create_index([("status", 1)])
            self._db.upload_queue.create_index([("created_at", -1)])
            self._db.upload_queue.create_index([("user_id", 1), ("status", 1)])
            
            # Courses indexes
            self._db.courses.create_index([("courseCode", 1)], unique=True)
            self._db.courses.create_index([("createdAt", -1)])
            
            # Classes indexes
            self._db.classes.create_index([("courseId", 1)])
            self._db.classes.create_index([("semester", 1)])
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    @property
    def db(self):
        """Get the database instance"""
        if self._db is None:
            self.connect()
        return self._db
    
    @property
    def client(self):
        """Get the MongoDB client instance"""
        if self._client is None:
            self.connect()
        return self._client
    
    def get_collection(self, collection_name):
        """Get a specific collection"""
        return self.db[collection_name]
    
    def close_connection(self):
        """Close the MongoDB connection"""
        if self._client:
            self._client.close()
            logger.info("MongoDB connection closed")

# Singleton instance
mongo_db = MongoDB()

# Collection shortcuts
def get_db():
    """Get database instance"""
    return mongo_db.db

def get_collection(name):
    """Get collection by name"""
    return mongo_db.get_collection(name)

# Specific collections
users_collection = mongo_db.get_collection('users')
question_papers_collection = mongo_db.get_collection('question_papers')
evaluations_collection = mongo_db.get_collection('evaluations')
courses_collection = mongo_db.get_collection('courses')
classes_collection = mongo_db.get_collection('classes')
assignments_collection = mongo_db.get_collection('assignments')
notifications_collection = mongo_db.get_collection('notifications')
analytics_collection = mongo_db.get_collection('analytics')
upload_queue_collection = mongo_db.get_collection('upload_queue')

# Helper functions
def parse_json(data):
    """Convert MongoDB documents to JSON serializable format"""
    import json
    return json.loads(json.dumps(data, default=str))

def create_object_id(id_string=None):
    """Create ObjectId from string or generate new one"""
    if id_string:
        return ObjectId(id_string)
    return ObjectId()

def validate_object_id(id_string):
    """Validate if string is a valid ObjectId"""
    try:
        ObjectId(id_string)
        return True
    except:
        return False 