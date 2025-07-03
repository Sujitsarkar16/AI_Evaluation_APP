import os
import json
import logging
import re
import time
import itertools
from pathlib import Path
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_fixed, RetryError
from pdf2image import convert_from_path
from PIL import Image
import io
from dotenv import load_dotenv
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from prompts import QUESTION_PARSING_PROMPT

logger = logging.getLogger(__name__)

# Configure Gemini API for question parsing
try:
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("No Gemini API key found. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
    genai.configure(api_key=api_key)
    MODEL_NAME = 'gemini-2.5-flash-preview-04-17'
    model = genai.GenerativeModel(model_name=MODEL_NAME)
    logger.info(f"Successfully initialized Gemini model for question parsing: {MODEL_NAME}")
except Exception as e:
    logger.error(f"Error configuring Gemini API for question parsing: {e}")
    model = None

# Configuration
MAX_RETRIES = 5
TEMPERATURE = 0.1
DPI = 300

# Rate limiting
_last_call = 0.0
_rl_lock = Lock()

def rate_limited_call(fn, *args, **kwargs):
    """Rate-limited function calls to respect API limits"""
    global _last_call
    with _rl_lock:
        gap = 1.0 / 4  # 4 QPS limit
        wait = (_last_call + gap) - time.time()
        if wait > 0:
            time.sleep(wait)
        _last_call = time.time()
    return fn(*args, **kwargs)

def pdf_to_images(pdf_path: str) -> List[str]:
    """Convert PDF to images and return image paths"""
    try:
        # Try to find poppler in common locations
        poppler_path = None
        possible_paths = [
            r"C:\poppler-24.08.0\Library\bin",
            r"C:\Program Files\poppler\bin",
            "/usr/bin",
            "/usr/local/bin"
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                poppler_path = path
                break
        
        images = convert_from_path(
            pdf_path, 
            dpi=DPI, 
            fmt="png", 
            poppler_path=poppler_path
        )
        
        image_paths = []
        pdf_name = Path(pdf_path).stem
        upload_dir = Path(pdf_path).parent
        
        for idx, img in enumerate(images, 1):
            img_path = upload_dir / f"{pdf_name}_qp_page_{idx}.png"
            img.save(img_path, "PNG")
            image_paths.append(str(img_path))
            
        logger.info(f"Converted question paper PDF to {len(images)} images")
        return image_paths
        
    except Exception as e:
        logger.error(f"Error converting question paper PDF to images: {e}")
        raise

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(1), reraise=True)
def parse_page_questions(img_path: str, page_num: int) -> List[Dict[str, Any]]:
    """Parse questions from a single page image"""
    if not model:
        raise Exception("Gemini model not initialized")
    
    try:
        logger.info(f"Processing question paper page {page_num}...")
        
        # Read and encode image
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        
        # Prepare message parts for Gemini
        msg_parts = [
            {"text": QUESTION_PARSING_PROMPT.strip()},
            {"mime_type": "image/png", "data": img_bytes}
        ]
        
        # Make API call with rate limiting
        response = rate_limited_call(
            model.generate_content,
            contents=[{"role": "user", "parts": msg_parts}],
            generation_config=genai.GenerationConfig(
                temperature=TEMPERATURE,
                max_output_tokens=6024
            )
        )
        
        # Validate response
        if not response or not response.candidates:
            feedback = response.prompt_feedback if response and response.prompt_feedback else "No feedback available"
            raise RuntimeError(f"API returned no candidates for page {page_num}. Feedback: {feedback}")
        
        # Extract text
        try:
            json_str = response.text
        except Exception as e:
            raise RuntimeError(f"Failed to extract text from API response for page {page_num}") from e
        
        if not json_str or not json_str.strip():
            raise RuntimeError(f"Received empty text response for page {page_num}")
        
        # Clean up potential markdown fences
        json_str = re.sub(r"^```json\s*|\s*```$", "", json_str, flags=re.MULTILINE)
        json_str = json_str.strip()
        
        # Parse JSON
        try:
            extracted_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed for page {page_num}: {e}\nRaw text:\n{json_str}")
            raise RuntimeError(f"Failed to parse JSON from page {page_num}") from e
        
        # Validate schema
        if not isinstance(extracted_data, list):
            logger.warning(f"Extracted data is not a list for page {page_num}")
            raise RuntimeError(f"Extracted data for page {page_num} did not match expected list schema")
        
        logger.info(f"Successfully processed question paper page {page_num}")
        return extracted_data
        
    except Exception as e:
        logger.error(f"Error parsing questions from page {page_num}: {e}")
        raise

def merge_page_questions(pages: List[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """Merge and deduplicate question blocks from multiple pages"""
    merged: List[Dict[str, Any]] = []
    seen_keys: set[str] = set()
    
    for page_blocks in itertools.chain.from_iterable(pages):
        # Create a stable representation for comparison
        block_key = json.dumps(page_blocks, sort_keys=True)
        
        if block_key not in seen_keys:
            merged.append(page_blocks)
            seen_keys.add(block_key)
    
    return merged

def convert_to_simple_format(parsed_questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert the complex nested format to simpler format for storage"""
    simple_questions = []
    question_counter = 1
    
    for block in parsed_questions:
        choice = block.get("choice", "")
        options = block.get("options", [])
        
        for option in options:
            question_id = option.get("id", f"Q{question_counter}")
            parts = option.get("parts", [])
            
            if parts:
                # Multi-part question
                for part in parts:
                    part_id = part.get("part_id", "")
                    question_text = part.get("question_text", "")
                    marks = part.get("marks", 0)
                    
                    simple_questions.append({
                        "id": f"{question_id}{part_id}" if part_id else question_id,
                        "text": question_text,
                        "marks": marks,
                        "choice": choice if choice != question_id else None,
                        "parent_id": question_id,
                        "part": part_id
                    })
            else:
                # Single question (no parts)
                simple_questions.append({
                    "id": question_id,
                    "text": option.get("question_text", ""),
                    "marks": option.get("marks", 0),
                    "choice": choice if choice != question_id else None,
                    "parent_id": None,
                    "part": None
                })
            
            question_counter += 1
    
    return simple_questions

def parse_question_paper(file_path: str) -> Dict[str, Any]:
    """
    Main function to parse a question paper from PDF or image
    Returns parsed questions and metadata
    """
    try:
        file_ext = Path(file_path).suffix.lower()
        logger.info(f"Starting question paper parsing for: {file_path}")
        
        # Handle different file types
        if file_ext == '.pdf':
            # Convert PDF to images
            image_paths = pdf_to_images(file_path)
        elif file_ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
            # Single image
            image_paths = [file_path]
        else:
            raise ValueError(f"Unsupported file format for question paper: {file_ext}")
        
        if not image_paths:
            raise Exception("No images to process")
        
        # Parse questions from each page
        all_page_questions = []
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_to_page = {}
            
            for i, img_path in enumerate(image_paths):
                future = executor.submit(parse_page_questions, img_path, i + 1)
                future_to_page[future] = i + 1
            
            for future in as_completed(future_to_page.keys()):
                page_num = future_to_page[future]
                try:
                    page_questions = future.result()
                    all_page_questions.append(page_questions)
                    logger.info(f"Successfully parsed page {page_num}")
                except Exception as e:
                    logger.error(f"Failed to parse page {page_num}: {e}")
                    # Continue with other pages
        
        # Clean up image files (only for PDF conversion)
        if file_ext == '.pdf':
            for img_path in image_paths:
                try:
                    os.remove(img_path)
                except Exception as e:
                    logger.warning(f"Could not remove file {img_path}: {e}")
        
        # Merge questions from all pages
        merged_questions = merge_page_questions(all_page_questions)
        
        # Convert to simple format for compatibility
        simple_questions = convert_to_simple_format(merged_questions)
        
        # Calculate total marks
        total_marks = sum(q.get('marks', 0) for q in simple_questions)
        
        logger.info(f"Question paper parsing completed. Found {len(simple_questions)} questions with total {total_marks} marks")
        
        return {
            "success": True,
            "message": f"Successfully parsed {len(simple_questions)} questions from {len(image_paths)} pages",
            "questions": simple_questions,
            "raw_structure": merged_questions,
            "metadata": {
                "total_questions": len(simple_questions),
                "total_marks": total_marks,
                "pages_processed": len(image_paths),
                "filename": Path(file_path).name
            },
            "total_questions": len(simple_questions),
            "total_marks": total_marks,
            "pages_processed": len(image_paths)
        }
        
    except Exception as e:
        logger.error(f"Error parsing question paper {file_path}: {e}")
        return {
            "success": False,
            "message": f"Failed to parse question paper: {str(e)}",
            "questions": [],
            "metadata": {},
            "total_questions": 0,
            "total_marks": 0,
            "pages_processed": 0
        }

def validate_parsed_questions(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate the parsed questions and return validation results"""
    issues = []
    warnings = []
    
    for i, q in enumerate(questions):
        question_id = q.get('id', f'Question {i+1}')
        
        # Check required fields
        if not q.get('text', '').strip():
            issues.append(f"{question_id}: Missing question text")
        
        if not isinstance(q.get('marks'), (int, float)) or q.get('marks', 0) <= 0:
            warnings.append(f"{question_id}: Invalid or missing marks")
        
        # Check text length
        if len(q.get('text', '')) < 10:
            warnings.append(f"{question_id}: Question text seems too short")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "total_questions": len(questions),
        "questions_with_marks": len([q for q in questions if q.get('marks', 0) > 0])
    } 