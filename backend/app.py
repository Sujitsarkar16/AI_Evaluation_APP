import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from ocr.ocr_processor import process_image, process_pdf
from qna_mapping.mapper import map_questions_to_answers
from evaluation.evaluator import evaluate_and_generate_report
from pymongo import MongoClient
from bson.objectid import ObjectId
import json
import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'txt', 'doc', 'docx', 'md', 'markdown'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Connect to MongoDB
mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(mongo_uri)
db = client['ai_educraft_portal']
question_papers = db.question_papers

# Check for Gemini API key
if not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"):
    logger.warning("Gemini API key not found in environment. Set either GOOGLE_API_KEY or GEMINI_API_KEY.")

# Helper function to convert MongoDB documents to JSON
def parse_json(data):
    return json.loads(json.dumps(data, default=str))

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/question-papers', methods=['GET'])
def get_question_papers():
    papers = list(question_papers.find().sort('createdAt', -1))
    return jsonify(parse_json(papers))

@app.route('/api/question-papers/<id>', methods=['GET'])
def get_question_paper(id):
    paper = question_papers.find_one({'_id': ObjectId(id)})
    if not paper:
        return jsonify({'message': 'Question paper not found'}), 404
    return jsonify(parse_json(paper))

@app.route('/api/question-papers', methods=['POST'])
def create_question_paper():
    # Check if the post request has the file part
    if 'file' in request.files:
        file = request.files['file']
        if file.filename:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Create file data
            file_ext = os.path.splitext(file.filename)[1].replace('.', '').upper()
            file_size = os.path.getsize(filepath) / 1024  # Convert to KB
            
            # Get form data
            title = request.form.get('title', file.filename)
            
            # Parse questions if they exist in form data
            questions = []
            if 'questions' in request.form:
                questions = json.loads(request.form.get('questions'))
            
            # Create document
            now = datetime.datetime.now()
            month_names = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December']
            
            paper = {
                'title': title,
                'type': file_ext,
                'size': f"{file_size:.1f} KB",
                'date': f"{month_names[now.month - 1]}, {now.year}",
                'fileUrl': f"/uploads/{filename}",
                'questions': questions,
                'createdAt': now
            }
            
            result = question_papers.insert_one(paper)
            paper['_id'] = str(result.inserted_id)
            
            return jsonify(paper), 201
    else:
        # Create question paper without file
        data = request.json
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        now = datetime.datetime.now()
        month_names = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
        
        paper = {
            'title': data.get('title', 'Untitled'),
            'type': 'TXT',
            'size': '0 KB',
            'date': f"{month_names[now.month - 1]}, {now.year}",
            'questions': data.get('questions', []),
            'createdAt': now
        }
        
        result = question_papers.insert_one(paper)
        paper['_id'] = str(result.inserted_id)
        
        return jsonify(paper), 201

@app.route('/api/question-papers/<id>', methods=['PATCH'])
def update_question_paper(id):
    updates = request.json
    if not updates:
        return jsonify({'message': 'No data provided'}), 400
    
    # Update the document
    question_papers.update_one({'_id': ObjectId(id)}, {'$set': updates})
    
    # Get the updated document
    paper = question_papers.find_one({'_id': ObjectId(id)})
    if not paper:
        return jsonify({'message': 'Question paper not found'}), 404
    
    return jsonify(parse_json(paper))

@app.route('/api/question-papers/<id>', methods=['DELETE'])
def delete_question_paper(id):
    paper = question_papers.find_one({'_id': ObjectId(id)})
    if not paper:
        return jsonify({'message': 'Question paper not found'}), 404
    
    # Delete the file if it exists
    if 'fileUrl' in paper:
        file_path = paper['fileUrl'].replace('/uploads/', '')
        full_path = os.path.join(app.config['UPLOAD_FOLDER'], file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
    
    # Delete the document
    question_papers.delete_one({'_id': ObjectId(id)})
    
    return jsonify({'message': 'Question paper deleted'})

def allowed_file(filename):
    """Check if the file is an allowed type"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/ocr', methods=['POST'])
def ocr_endpoint():
    """
    Endpoint for OCR processing
    Accepts image/PDF uploads, processes with Gemini OCR, and returns extracted text
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # Check file extension for appropriate processing
            file_ext = os.path.splitext(filename)[1].lower()
            
            if file_ext == '.pdf':
                logger.info(f"Processing PDF file: {filename}")
                extracted_text = process_pdf(file_path)
            else:
                logger.info(f"Processing image file: {filename}")
                extracted_text = process_image(file_path)
                
            return jsonify({'text': extracted_text})
        except Exception as e:
            logger.error(f"Error in OCR processing: {str(e)}")
            return jsonify({'error': f"OCR processing failed: {str(e)}"}), 500
    
    return jsonify({'error': 'Invalid file format'}), 400

@app.route('/api/mapping', methods=['POST'])
def mapping_endpoint():
    """
    Endpoint for Q&A mapping
    Accepts OCR text and identifies questions with their matching answers using Gemini
    Can optionally receive predefined questions for more accurate mapping
    """
    data = request.json
    
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    try:
        logger.info("Starting Q&A mapping")
        
        # Check if questions are provided from a question paper
        if 'questions' in data and data['questions']:
            logger.info(f"Using {len(data['questions'])} predefined questions for mapping")
            # Map predefined questions to answers in the text
            qa_pairs = map_questions_to_answers(data['text'], data['questions'])
        else:
            # Traditional approach - extract both questions and answers from text
            qa_pairs = map_questions_to_answers(data['text'])
            
        logger.info(f"Mapping completed, found {len(qa_pairs)} Q&A pairs")
        return jsonify({'qa_pairs': qa_pairs})
    except Exception as e:
        logger.error(f"Error in Q&A mapping: {str(e)}")
        return jsonify({'error': f"Q&A mapping failed: {str(e)}"}), 500

@app.route('/api/evaluate', methods=['POST'])
def evaluate_endpoint():
    """
    Endpoint for agentic evaluation
    Accepts Q&A pairs and returns multi-agent evaluation report
    Optional totalMarks parameter for score normalization
    """
    data = request.json
    
    if not data or 'qa_pairs' not in data:
        return jsonify({'error': 'No Q&A pairs provided'}), 400
    
    try:
        logger.info(f"Starting evaluation of {len(data['qa_pairs'])} Q&A pairs")
        
        # Get totalMarks parameter if provided, default to 100
        total_marks = data.get('totalMarks', 100)
        logger.info(f"Using total marks: {total_marks}")
        
        # Generate comprehensive evaluation report using multi-agent approach
        evaluation_report = evaluate_and_generate_report(data['qa_pairs'], total_marks)
        logger.info("Evaluation completed successfully")
        
        return jsonify({
            'evaluation_report': evaluation_report,
            'format': 'markdown'
        })
    except Exception as e:
        logger.error(f"Error in evaluation: {str(e)}")
        return jsonify({'error': f"Evaluation failed: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    # Check if Gemini API key is available
    api_key_available = bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
    
    # Check MongoDB connection
    mongo_available = True
    try:
        # Ping MongoDB with a timeout
        client.admin.command('ping')
    except:
        mongo_available = False
    
    health_status = {
        'status': 'healthy' if api_key_available and mongo_available else 'unhealthy',
        'api_key_available': api_key_available,
        'mongo_available': mongo_available,
        'timestamp': datetime.datetime.now()
    }
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return jsonify(health_status), status_code

if __name__ == '__main__':
    app.run(debug=True, port=5000) 