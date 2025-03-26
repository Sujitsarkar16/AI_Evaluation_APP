"""
Q&A Mapping Module
Maps questions to answers in extracted text using Gemini API
"""

import os
import logging
import re
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize the model at module level
model = None

# Load environment variables
load_dotenv()

def get_gemini_model():
    """Initialize and return the Gemini model."""
    global model
    
    try:
        if model is not None:
            return model
        
        # Get API key from environment - check multiple possible environment variable names
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("API key not found in environment variables (checked GOOGLE_API_KEY, GEMINI_API_KEY)")
            raise ValueError("API key environment variable not set")
            
        # Configure the API
        genai.configure(api_key=api_key)
        
        # Use the specified model name
        gemini_model_name = "gemini-2.0-flash-thinking-exp-01-21"
        
        # Initialize the model
        model = genai.GenerativeModel(gemini_model_name)
        logger.info(f"Gemini model successfully initialized with model: {gemini_model_name}")
        
        return model
        
    except Exception as e:
        logger.error(f"Error initializing Gemini model: {e}")
        raise Exception(f"Failed to initialize Gemini model: {e}")

def extract_json_from_text(text):
    """
    Extract a JSON object or array from a text that might contain other content.
    
    Args:
        text (str): Text potentially containing JSON
        
    Returns:
        dict/list: Parsed JSON data or None if extraction fails
    """
    if not text:
        return None
        
    try:
        # First try direct JSON parsing
        return json.loads(text)
    except:
        pass
    
    try:
        # Look for JSON within code blocks
        code_block_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
        matches = re.findall(code_block_pattern, text)
        
        for match in matches:
            try:
                return json.loads(match)
            except:
                continue
                
        # Look for arrays within the text
        array_pattern = r'\[\s*{[\s\S]*}\s*\]'
        array_matches = re.findall(array_pattern, text)
        
        for match in array_matches:
            try:
                return json.loads(match)
            except:
                continue
                
        # Look for any JSON-like structure
        json_pattern = r'({[\s\S]*}|\[[\s\S]*\])'
        json_matches = re.findall(json_pattern, text)
        
        for match in json_matches:
            try:
                return json.loads(match)
            except:
                continue
                
        return None
    except Exception as e:
        logger.error(f"Error extracting JSON: {e}")
        return None

def map_questions_to_answers(text, predefined_questions=None):
    """
    Maps questions to answers in a text using Gemini API.
    
    Args:
        text (str): The text containing questions and answers to be mapped
        predefined_questions (list, optional): List of predefined questions with their IDs and marks
        
    Returns:
        list: A list of dictionaries, each containing a question-answer pair
    """
    # Validate input
    if not text or not isinstance(text, str):
        logger.error("Invalid input: text must be a non-empty string")
        return []
    
    # Try to get Gemini model
    try:
        gemini_model = get_gemini_model()
        if not gemini_model:
            raise ValueError("Failed to initialize Gemini model")
    except Exception as e:
        logger.error(f"Error initializing Gemini model: {e}")
        raise

    # Different prompts based on whether predefined questions are provided
    if predefined_questions:
        # Format the predefined questions for the prompt
        formatted_questions = "\n\n".join([
            f"Question {q.get('id', i+1)}{' [' + str(q.get('marks', 0)) + ' marks]' if q.get('marks') else ''}: {q.get('text', '')}"
            for i, q in enumerate(predefined_questions)
        ])
        
        prompt = f"""
        You are mapping student answers to predefined questions in an examination.

        PREDEFINED QUESTIONS:
        {formatted_questions}

        STUDENT ANSWER TEXT:
        {text}

        TASK:
        For each predefined question above:
        1. Identify and extract the student's answer from the text
        2. Handle missing answers appropriately
        3. For any answer you can't find, indicate it as "No answer provided"
        
        INSTRUCTIONS:
        - Be flexible in matching answers - students might not use the exact same wording or structure
        - Consider that the text may contain noise or scanning artifacts
        - Some answers may span multiple paragraphs
        - Focus on identifying the most relevant content for each question
        
        FORMAT YOUR RESPONSE AS A JSON ARRAY of objects with these fields:
        - "questionNumber": The ID of the question (use the ID from the predefined question)
        - "question": The full text of the question
        - "answer": The extracted answer text
        - "maxMarks": The maximum marks for the question (if available)

        RESPONSE:
        """
    else:
        # Original prompt for extracting both questions and answers from text
        prompt = f"""
        You are analyzing an educational document containing questions and answers.

        DOCUMENT TEXT:
        {text}

        TASK:
        Identify all question-answer pairs in this document.

        INSTRUCTIONS:
        1. Look for clear questions followed by their corresponding answers
        2. Each question might have a number/identifier (like "Q1." or "Question 1:")
        3. Questions may have marks indicated (e.g., "[5 marks]")
        4. Extract both the question and its answer
        5. Assign a question number from the document, or create one if missing

        FORMAT YOUR RESPONSE AS A JSON ARRAY of objects with these fields:
        - "questionNumber": The question number or identifier
        - "question": The full text of the question
        - "answer": The extracted answer text
        - "maxMarks": The maximum marks for the question (if available, otherwise use 0)

        RESPONSE:
        """

    # Function to make API call with exponential backoff
    def safe_generate_content(prompt, max_retries=3):
        retries = 0
        while retries < max_retries:
            try:
                response = gemini_model.generate_content(prompt)
                return response
            except Exception as e:
                retries += 1
                logger.warning(f"API call failed (attempt {retries}): {e}")
                if retries < max_retries:
                    # Exponential backoff
                    sleep_time = 2 ** retries
                    logger.info(f"Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                else:
                    logger.error(f"All {max_retries} attempts failed")
                    raise

    # Make API call with retry mechanism
    try:
        logger.info("Calling Gemini API to map questions to answers")
        response = safe_generate_content(prompt)
        response_text = response.text if hasattr(response, 'text') else str(response)
        
        # Extract JSON from response
        # Look for JSON array pattern
        json_match = re.search(r'\[\s*\{.*\}\s*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            qa_pairs = json.loads(json_str)
            
            # Validate and clean up the data
            result = []
            for pair in qa_pairs:
                # Ensure all required fields are present
                cleaned_pair = {
                    "questionNumber": pair.get("questionNumber", ""),
                    "question": pair.get("question", ""),
                    "answer": pair.get("answer", "No answer provided"),
                    "maxMarks": int(pair.get("maxMarks", 0))
                }
                result.append(cleaned_pair)
                
            logger.info(f"Successfully mapped {len(result)} question-answer pairs")
            return result
        else:
            logger.error("Failed to extract JSON from Gemini response")
            return []
            
    except Exception as e:
        logger.error(f"Error mapping questions to answers: {e}")
        raise 