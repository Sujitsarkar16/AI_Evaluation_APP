# AI Evaluation Backend

Clean, well-organized Flask backend for the AI Evaluation Application with modular architecture, proper configuration management, and comprehensive documentation.

## 🏗️ Architecture Overview

### **Organized Structure**
```
backend/
├── app.py                     # Main application entry point
├── config.py                  # Centralized configuration management
├── requirements.txt           # Python dependencies
├── routes/                    # Organized route modules
│   ├── __init__.py
│   ├── auth_routes.py        # Authentication & user management
│   └── upload_routes.py      # File upload & queue management
├── mongoDB/                   # Database layer
│   ├── __init__.py
│   ├── db_config.py          # Database configuration & connection
│   ├── auth.py               # Authentication logic
│   ├── models.py             # Data models
│   └── init_db.py            # Database initialization
├── ocr/                      # OCR processing module
├── qna_mapping/              # Question-Answer mapping
├── evaluation/               # AI evaluation engine
├── question_paper/           # Question paper parsing
├── uploads/                  # File storage directory
└── backup/                   # Backup & archived files
```

## 🚀 Quick Start

### **1. Environment Setup**
```bash
# Install dependencies
pip install -r requirements.txt

# Create environment file
cp ../env-template.txt .env

# Configure your environment variables (see env-template.txt)
# Replace with your actual values
```

### **2. Start the Application**
```bash
python app.py
```

The server will start on `http://localhost:5000`

## 📋 API Endpoints

### **Authentication (`/api/auth`)**
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password
- `POST /upload-avatar` - Upload profile picture
- `GET /users` - Get all users (admin only)


### **Upload Queue (`/api/uploads`)**
- `POST /batch` - Upload multiple PDFs (max 10 files)
- `GET /` - List uploaded files with filtering
- `GET /:id` - Get specific upload details
- `DELETE /:id` - Delete uploaded file
- `POST /:id/evaluate` - Start evaluation process
- `GET /stats` - Upload statistics

### **System**
- `GET /api/health` - Health check
- `GET /api/info` - System information
- `GET /uploads/:filename` - Serve uploaded files

## 🛠️ Configuration

### **Environment Variables**
```bash
# Flask Configuration
SECRET_KEY=your-secret-key
DEBUG=False
HOST=0.0.0.0
PORT=5000

# Database
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=LMS_DATA

# API Keys
GOOGLE_API_KEY=your-gemini-api-key
GEMINI_API_KEY=alternative-gemini-key

# JWT
JWT_SECRET=jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# File Upload
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216  # 16MB

# CORS
CORS_ORIGINS=*

# Logging
LOG_LEVEL=INFO
```

## 💾 Database

### **MongoDB Collections**
- `users` - User accounts and profiles
- `upload_queue` - File upload queue
- `evaluations` - AI evaluation results
- `question_papers` - Question paper templates
- `courses` - Course information
- `classes` - Class management
- `assignments` - Assignment data
- `notifications` - User notifications
- `analytics` - Analytics data

## 🔐 Security Features

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (admin, student, teacher)
- Password hashing with bcrypt
- Token expiration and refresh

### **File Security**
- File type validation (PDF only for evaluations)
- File size limits (16MB max)
- Secure filename generation
- Isolated file storage

## 🧩 Core Modules

### **OCR Processing**
- Google Gemini Vision API integration
- PDF and image text extraction
- Handwriting recognition
- Multi-language support

### **Q&A Mapping**
- Intelligent question-answer pairing
- Context-aware mapping algorithms
- Confidence scoring
- Manual correction support

### **AI Evaluation**
- Rubric-based assessment
- Natural language evaluation
- Scoring algorithms
- Detailed feedback generation

## 📊 Features

### **Upload Queue Management**
- Batch PDF upload (up to 10 files)
- Real-time status tracking
- File validation and security
- Queue statistics and monitoring

### **User Management**
- Registration and authentication
- Profile management with avatars
- Role-based permissions

## 🔧 Development

### **Code Organization**
- Modular route handlers
- Centralized configuration
- Clean separation of concerns
- Comprehensive error handling

### **Clean Architecture**
- Application factory pattern
- Blueprint-based routes
- Configuration management
- Proper logging setup

---

## 📞 Support

For issues, questions, or contributions, please refer to the main project documentation.

**Version**: 1.0.0  
**Last Updated**: December 2024 