"""
OCR Processor Module
Handles image processing and text extraction exclusively using Gemini API
"""

import os
import logging
import io
import time
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
import json
import base64
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from typing import List, Tuple, Dict
from pdf2image import convert_from_path
from tenacity import retry, stop_after_attempt, wait_fixed, RetryError
from prompts import OCR_PROMPT

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    logger.info(f"Successfully initialized Gemini model: {MODEL_NAME}")
except Exception as e:
    logger.error(f"Error configuring Gemini API: {e}")
    model = None

# Rate limiting
MAX_QPS = 4
MAX_RETRIES = 3
_last_call = 0.0
_rl_lock = Lock()

def rate_limited_call(fn, *args, **kwargs):
    """Rate-limited function calls to respect API limits"""
    global _last_call
    with _rl_lock:
        gap = 1.0 / MAX_QPS
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
            dpi=300, 
            fmt="png", 
            poppler_path=poppler_path
        )
        
        image_paths = []
        pdf_name = Path(pdf_path).stem
        upload_dir = Path(pdf_path).parent
        
        for idx, img in enumerate(images, 1):
            img_path = upload_dir / f"{pdf_name}_page_{idx}.png"
            img.save(img_path, "PNG")
            image_paths.append(str(img_path))
            
        logger.info(f"Converted PDF to {len(images)} images")
        return image_paths
        
    except Exception as e:
        logger.error(f"Error converting PDF to images: {e}")
        raise

def img_to_b64(img_path: str) -> str:
    """Convert image to base64 string"""
    with open(img_path, "rb") as f:
        return base64.b64encode(f.read()).decode()

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(1), reraise=True)
def ocr_single_image(img_path: str) -> Tuple[str, Dict]:
    """OCR a single image with retry logic"""
    if not model:
        raise Exception("Gemini model not initialized")
    
    try:
        parts = [
            {"text": OCR_PROMPT},
            {
                "inline_data": {
                    "mime_type": "image/png",
                    "data": img_to_b64(img_path),
                }
            },
        ]
        
        response = rate_limited_call(model.generate_content, parts)
        
        # Extract usage statistics
        usage_stats = {
            "input_tokens": 0,
            "output_tokens": 0
        }
        
        try:
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage_stats["input_tokens"] = getattr(response.usage_metadata, 'prompt_token_count', 0)
                usage_stats["output_tokens"] = getattr(response.usage_metadata, 'candidates_token_count', 0)
        except Exception as e:
            logger.warning(f"Could not extract usage stats: {e}")
        
        return response.text.strip(), usage_stats
        
    except Exception as e:
        logger.warning(f"OCR failed for {img_path}: {e}")
        raise

def process_image(image_path: str) -> str:
    """Process a single image and extract text using Gemini OCR"""
    try:
        logger.info(f"Processing image: {image_path}")
        text, usage = ocr_single_image(image_path)
        logger.info(f"OCR completed. Input tokens: {usage['input_tokens']}, Output tokens: {usage['output_tokens']}")
        return text
    except Exception as e:
        logger.error(f"Error processing image {image_path}: {e}")
        raise

def process_pdf(pdf_path: str) -> str:
    """Process a PDF file by converting to images and OCR each page"""
    try:
        logger.info(f"Processing PDF: {pdf_path}")
        
        # Convert PDF to images
        image_paths = pdf_to_images(pdf_path)
        
        if not image_paths:
            raise Exception("No images extracted from PDF")
        
        # Process images with threading for better performance
        texts_ordered = [None] * len(image_paths)
        total_input_tokens = 0
        total_output_tokens = 0
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit OCR tasks
            future_to_index = {}
            for i, img_path in enumerate(image_paths):
                future = executor.submit(ocr_single_image, img_path)
                future_to_index[future] = i
            
            # Collect results in order
            for future in as_completed(future_to_index.keys()):
                index = future_to_index[future]
                try:
                    text, usage = future.result()
                    texts_ordered[index] = text
                    total_input_tokens += usage["input_tokens"]
                    total_output_tokens += usage["output_tokens"]
                    logger.info(f"Completed page {index + 1}/{len(image_paths)}")
                except Exception as e:
                    logger.error(f"Failed to process page {index + 1}: {e}")
                    texts_ordered[index] = f"[Error processing page {index + 1}: {str(e)}]"
        
        # Clean up image files
        for img_path in image_paths:
            try:
                os.remove(img_path)
            except Exception as e:
                logger.warning(f"Could not remove file {img_path}: {e}")
        
        # Combine all pages
        combined_text = ""
        for i, text in enumerate(texts_ordered, 1):
            if text:
                combined_text += f"## Page {i}\n\n{text}\n\n---\n\n"
        
        logger.info(f"PDF OCR completed. Total pages: {len(image_paths)}, "
                   f"Input tokens: {total_input_tokens}, Output tokens: {total_output_tokens}")
        
        return combined_text.strip()
        
    except Exception as e:
        logger.error(f"Error processing PDF {pdf_path}: {e}")
        raise

def process_document(file_path: str) -> str:
    """
    Main function to process any document (image or PDF)
    Returns extracted text
    """
    try:
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext == '.pdf':
            return process_pdf(file_path)
        elif file_ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
            return process_image(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
            
    except Exception as e:
        logger.error(f"Error processing document {file_path}: {e}")
        raise 