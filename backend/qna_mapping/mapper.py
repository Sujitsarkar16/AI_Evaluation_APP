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
from tenacity import retry, stop_after_attempt, wait_fixed, RetryError
from prompts import MAPPING_PROMPT

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize the model at module level
model = None

# Load environment variables
load_dotenv()

# Configure Gemini API
try:
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("No Gemini API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
    genai.configure(api_key=api_key)
    MODEL_NAME = 'gemini-2.5-flash-preview-04-17'
    model = genai.GenerativeModel(model_name=MODEL_NAME)
    logger.info(f"Successfully initialized Gemini model for mapping: {MODEL_NAME}")
except Exception as e:
    logger.error(f"Error configuring Gemini API for mapping: {e}")
    model = None

# Global counters for tracking usage
total_input_tokens = 0
total_output_tokens = 0
total_api_requests = 0

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
        gemini_model_name = "gemini-2.5-flash-preview-04-17"
        
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

def generate_mapping_prompt(question_paper_json, answer_sheet_text):
    """Constructs the prompt for Gemini to perform the mapping."""
    return MAPPING_PROMPT.format(
        question_paper_json=json.dumps(question_paper_json, indent=2),
        answer_sheet_text=answer_sheet_text
    )

@retry(stop=stop_after_attempt(3), wait=wait_fixed(1), reraise=True)
def make_gemini_call_with_retry(prompt_text):
    """
    Makes a Gemini API call with retry logic and tracks token usage.
    """
    global total_api_requests, total_input_tokens, total_output_tokens

    if not model:
        raise Exception("Gemini model not initialized")

    total_api_requests += 1

    response = model.generate_content(prompt_text)

    # Track token usage
    if hasattr(response, 'usage_metadata') and response.usage_metadata:
        if hasattr(response.usage_metadata, 'prompt_token_count'):
            total_input_tokens += response.usage_metadata.prompt_token_count
        if hasattr(response.usage_metadata, 'candidates_token_count'):
            total_output_tokens += response.usage_metadata.candidates_token_count

    # Validate response
    if not response.candidates:
        raise ValueError("Gemini API returned no candidates in response.")
    if not response.candidates[0].content.parts:
        raise ValueError("Gemini API returned no content parts in first candidate.")

    full_response_text = ""
    for part in response.candidates[0].content.parts:
        if hasattr(part, 'text'):
            full_response_text += part.text
        else:
            raise ValueError(f"Gemini API returned non-text content part: {type(part)}")

    # Extract JSON from response
    json_start_index = full_response_text.find('{')
    json_end_index = full_response_text.rfind('}')

    if json_start_index == -1 or json_end_index == -1:
        raise ValueError("No complete JSON object found in Gemini response text.")

    json_string = full_response_text[json_start_index : json_end_index + 1]
    mapped_data = json.loads(json_string)

    return mapped_data, full_response_text

def map_questions_to_answers(text, questions=None):
    """
    Enhanced Q&A mapping that can work with or without a question paper.
    
    Args:
        text: The OCR extracted text from student answer sheet
        questions: Optional list of questions from question paper
        
    Returns:
        List of mapped Q&A pairs
    """
    try:
        logger.info("Starting Q&A mapping process")
        
        if not questions or len(questions) == 0:
            raise ValueError("Question paper is required for Q&A mapping. Cannot proceed without questions.")
            
        # Use advanced mapping with question paper
        logger.info(f"Using question paper with {len(questions)} questions for mapping")
        return map_with_question_paper(text, questions)
            
    except Exception as e:
        logger.error(f"Error in Q&A mapping: {e}")
        raise

def map_with_question_paper(answer_sheet_text, questions):
    """
    Advanced mapping using the question paper structure.
    """
    try:
        # Create question paper JSON structure
        question_paper_json = {
            "questions": questions,
            "total_questions": len(questions)
        }
        
        # Generate mapping prompt
        prompt = generate_mapping_prompt(question_paper_json, answer_sheet_text)
        
        # Make API call with retry logic
        mapped_data, full_response = make_gemini_call_with_retry(prompt)
        
        logger.info(f"Mapping completed successfully. Found {len(mapped_data.get('mapped_answers', []))} Q&A pairs")
        
        # Convert to the expected format
        qa_pairs = []
        for item in mapped_data.get('mapped_answers', []):
            qa_pairs.append({
                "questionNumber": item.get('question_id', 'Unknown'),
                "questionText": item.get('question_text', ''),
                "answer": item.get('student_answer_extracted', ''),
                "maxMarks": get_max_marks_for_question(item.get('question_id', ''), questions)
            })
        
        return qa_pairs
        
    except RetryError as e:
        logger.error(f"Failed to get valid mapping response after retries: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Could not parse JSON response: {e}")
        raise
    except Exception as e:
        logger.error(f"Error in advanced mapping: {e}")
        raise



def get_max_marks_for_question(question_id, questions):
    """
    Helper function to get max marks for a question from the question paper.
    """
    try:
        for q in questions:
            if q.get('id') == question_id or q.get('questionNumber') == question_id:
                return q.get('marks', 10)
        return 10  # Default marks
    except:
        return 10

def get_mapping_stats():
    """
    Returns mapping statistics for monitoring.
    """
    return {
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "total_api_requests": total_api_requests
    } 