#!/usr/bin/env python3
"""
Simple Local API Server for Evaluations
Serves evaluation data with proper CORS headers on port 5001
"""

import json
import os
import sys
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pymongo import MongoClient

def get_evaluations_data():
    """Fetch evaluations from MongoDB and return as JSON"""
    try:
        # MongoDB connection
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb+srv://sarkarsujit9052:Amazing1@productioncluster.gbf9m.mongodb.net/')
        database_name = os.getenv('DATABASE_NAME', 'LMS_DATA')
        
        client = MongoClient(mongodb_uri)
        db = client[database_name]
        evaluations_collection = db['evaluations']
        
        # Fetch evaluations
        cursor = evaluations_collection.find({}).sort('created_at', -1).limit(100)
        evaluations = list(cursor)
        
        # Convert ObjectId and datetime to string for JSON serialization
        def serialize_doc(doc):
            if isinstance(doc, dict):
                for key, value in doc.items():
                    if hasattr(value, '__str__') and 'ObjectId' in str(type(value)):
                        doc[key] = str(value)
                    elif isinstance(value, datetime):
                        doc[key] = value.isoformat()
                    elif isinstance(value, dict):
                        doc[key] = serialize_doc(value)
                    elif isinstance(value, list):
                        doc[key] = [serialize_doc(item) if isinstance(item, dict) else item for item in value]
            return doc
        
        # Serialize all evaluations
        serialized_evaluations = [serialize_doc(doc) for doc in evaluations]
        
        # Create API response format
        api_response = {
            "success": True,
            "evaluations": serialized_evaluations,
            "pagination": {
                "total": len(serialized_evaluations),
                "skip": 0,
                "limit": 100,
                "has_more": False
            }
        }
        
        return api_response
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "evaluations": [],
            "pagination": {"total": 0, "skip": 0, "limit": 100, "has_more": False}
        }

class CORSRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        # Parse URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        if path == '/api/evaluate':
            # Get evaluations
            response_data = get_evaluations_data()
            self.wfile.write(json.dumps(response_data, indent=2).encode())
        
        elif path == '/api/health':
            # Health check
            health_response = {
                "status": "healthy",
                "message": "Local API server is running",
                "version": "1.0.0"
            }
            self.wfile.write(json.dumps(health_response, indent=2).encode())
        
        else:
            # 404 for other paths
            self.send_response(404)
            self.end_headers()
            error_response = {"error": "Not found"}
            self.wfile.write(json.dumps(error_response).encode())

    def log_message(self, format, *args):
        """Custom logging"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def main():
    """Start the local API server"""
    port = 5001
    server_address = ('', port)
    
    print("🚀 LOCAL EVALUATION API SERVER")
    print("=" * 50)
    print(f"📍 Server: http://localhost:{port}")
    print(f"🔗 Evaluations API: http://localhost:{port}/api/evaluate")
    print(f"❤️  Health Check: http://localhost:{port}/api/health")
    print(f"🌐 CORS: Enabled for all origins")
    print("=" * 50)
    
    try:
        httpd = HTTPServer(server_address, CORSRequestHandler)
        print(f"✅ Server started successfully on port {port}")
        print("🔄 Press Ctrl+C to stop the server")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main() 