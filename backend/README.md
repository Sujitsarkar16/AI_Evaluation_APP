# AI EduCraft Portal Backend

This is the Flask backend for the AI EduCraft Portal, a learning management system application that includes:

1. OCR processing for extracting text from images
2. Q&A mapping to identify questions and match them with answers
3. Evaluation of the mapped Q&A pairs

## Setup Instructions

### 1. Create a virtual environment (recommended)

```bash
# For Windows
python -m venv venv
venv\Scripts\activate

# For macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up environment variables

Create a `.env` file in the backend directory with the following variables:

```
# Required for optional Gemini AI integration
GEMINI_API_KEY=your_gemini_api_key

# Optional MongoDB connection settings if using database
MONGO_URI=your_mongodb_connection_string
```

### 4. Run the application

```bash
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

The backend exposes the following endpoints:

### 1. OCR Processing

**Endpoint:** `/api/ocr`
**Method:** POST
**Description:** Extracts text from uploaded images using OCR

**Request:**
- Form data with a file upload (supported formats: PNG, JPG, JPEG, PDF)

**Response:**
```json
{
  "text": "Extracted text from the image"
}
```

### 2. Q&A Mapping

**Endpoint:** `/api/mapping`
**Method:** POST
**Description:** Maps questions to their corresponding answers in the extracted text

**Request:**
```json
{
  "text": "Extracted text containing questions and answers",
  "question_paper": "Optional question paper text for better matching"
}
```

**Response:**
```json
{
  "qa_pairs": [
    {
      "questionNumber": 1,
      "questionText": "What is...",
      "maxMarks": 10,
      "answer": "The answer is..."
    },
    ...
  ]
}
```

### 3. Evaluation

**Endpoint:** `/api/evaluate`
**Method:** POST
**Description:** Evaluates the quality of the mapped Q&A pairs

**Request:**
```json
{
  "qa_pairs": [
    {
      "questionNumber": 1,
      "questionText": "What is...",
      "maxMarks": 10,
      "answer": "The answer is..."
    },
    ...
  ]
}
```

**Response:**
```json
{
  "evaluation": {
    "evaluations": [
      {
        "questionNumber": 1,
        "questionText": "What is...",
        "score": 8,
        "maxMarks": 10,
        "rationale": "Substantial answer provided with good detail."
      },
      ...
    ],
    "totalScore": 25,
    "maxTotalScore": 30,
    "percentage": 83,
    "grade": "A",
    "markdownReport": "# Evaluation Report\n\n..."
  }
}
```

## Additional Notes

- The OCR functionality uses Tesseract OCR as a fallback, but will first attempt to use Google's Gemini API if available.
- For the Gemini API to work, you need to provide a valid API key in the `.env` file.
- The backend includes robust error handling and will automatically fall back to simpler methods if advanced AI capabilities are not available. 