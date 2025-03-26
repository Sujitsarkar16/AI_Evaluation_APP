# AI Education Evaluation App

An AI-powered platform for education assessment and evaluation.

## Features

- **Document OCR**: Extract text from PDFs, images, and documents using AI
- **Question Paper Creation**: Create structured question papers with marks allocation
- **Agentic Evaluation**: Use AI agents to evaluate student answers against question papers
- **Normalized Scoring**: Supports mark normalization based on total marks
- **Detailed Reports**: Generate comprehensive evaluation reports

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Flask (Python)
- **AI**: Gemini API for OCR, question mapping, and evaluation
- **Database**: MongoDB for storing question papers and evaluations

## Setup

### Prerequisites
- Node.js and npm/yarn
- Python 3.8+
- MongoDB
- Google Gemini API key

### Environment Setup

1. Clone the repository
2. Install frontend dependencies:
   ```
   npm install
   ```
3. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the backend directory with:
   ```
   GOOGLE_API_KEY=<your_gemini_api_key>
   MONGODB_URI=<your_mongodb_connection_string>
   ```
5. Start the backend:
   ```
   python app.py
   ```
6. Start the frontend:
   ```
   npm run dev
   ```

## Usage

1. Create question papers with marks allocation
2. Upload student answers for evaluation
3. Run the evaluation process
4. View and download detailed reports

## AI Technology

This application uses **Google's Gemini API** exclusively for all AI functionality:

- **OCR**: Gemini Vision API processes images and PDFs to extract text
- **Question-Answer Mapping**: Gemini maps questions to student answers from extracted text
- **Evaluation**: Multi-agent system with different "professor" personas evaluates student work

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- Python 3.9 or later
- MongoDB (v4.4 or later)
- Google Gemini API key (required)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/ai-educraft-portal.git
cd ai-educraft-portal
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd backend
pip install -r requirements.txt
```

4. **Configure the environment**

Create a `.env` file in the backend directory based on `.env.example`:

```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/
```

**IMPORTANT: A Gemini API key is REQUIRED for the application to function.**

## Running the Application

1. **Start MongoDB** (make sure MongoDB is installed and running)

2. **Start the Flask backend**

```bash
cd backend
python app.py
```

3. **Start the React frontend** (in a separate terminal)

```bash
npm run dev
```

4. **Access the application**

Open your browser and navigate to:
```
http://localhost:3000
```

## Evaluation Process

The system uses a multi-agent approach for evaluation:

1. **OCR Processing**: Gemini Vision extracts text from documents
2. **Question-Answer Mapping**: Gemini maps questions to student answers
3. **Multi-Agent Evaluation**: 
   - **Theoretical Evaluator**: Assesses theoretical understanding
   - **Practical Evaluator**: Assesses practical application
   - **Holistic Evaluator**: Provides overall assessment
   - **Consensus Evaluator**: Creates final evaluation with consensus grade

All evaluations are designed to be supportive and focus on student strengths.

## Question Paper Format

When uploading a .txt file for question parsing, format your questions as follows:

```
1. What is the capital of France? [5]
Paris (or) Lyon (or) Nice

2. Calculate the derivative of f(x) = x^2 + 3x + 2. [10]
f'(x) = 2x + 3
```

Each question should:
- Start with a number followed by a period
- Have optional mark values in square brackets [X]
- Optional choices can be separated with the "(or)" keyword

## API Endpoints

- `/api/ocr`: Process images and PDFs with OCR
- `/api/mapping`: Map questions to answers from extracted text
- `/api/evaluate`: Evaluate question-answer pairs
- `/api/question-papers`: CRUD operations for question papers
- `/api/health`: Check system health status

## Troubleshooting

- If OCR or evaluation fails, check your Gemini API key and quota limits
- For optimal results, use clear images and well-formatted documents
- The system works best with structured question formats

## License

MIT
