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
import fitz  # PyMuPDF

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")

genai.configure(api_key=GEMINI_API_KEY)

generation_config = {
    "temperature": 0.2,
    "top_p": 0.95,
    "top_k": 32,
    "max_output_tokens": 4096,
}

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-thinking-exp-01-21",
    generation_config=generation_config,
)

# OCR prompt for Gemini Vision
OCR_PROMPT = """Extract ALL text EXACTLY as it appears in this image.
Keep the structure, layout, and alignment. Avoid skipping any content.
Ensure the final output is clear, coherent, and preserves the original intent.
Just return the plain text representation of this document as if you were reading it naturally.
Do not hallucinate.
If this is an answer sheet or exam, identify questions and answers separately."""

def safe_generate_content(prompt, retries=3, sleep_time=2):
    """
    Safely generate content with built-in retry logic.
    
    Args:
        prompt: The prompt to send to Gemini
        retries: Number of retry attempts
        sleep_time: Time to wait between retries in seconds
        
    Returns:
        Generated text or None if all attempts fail
    """
    for attempt in range(1, retries + 1):
        try:
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
            else:
                logger.warning(f"Received empty response on attempt {attempt}. Retrying...")
        except Exception as e:
            logger.error(f"Error on attempt {attempt}: {e}")

        if attempt < retries:
            time.sleep(sleep_time)

    return None

def extract_text_from_image(image_path_or_obj):
    """
    Extract text from an image using Gemini Vision API.
    
    Args:
        image_path_or_obj: Path to an image file or PIL Image object
        
    Returns:
        Extracted text as string
    """
    try:
        # Handle both PIL Image objects and image paths
        if isinstance(image_path_or_obj, str):
            # If image is a file path
            with open(image_path_or_obj, "rb") as img_file:
                img_data = img_file.read()
            image_format = "image/" + image_path_or_obj.split('.')[-1].lower()
        else:
            # If image is a PIL Image object
            img_buffer = io.BytesIO()
            image_path_or_obj.save(img_buffer, format="PNG")
            img_data = img_buffer.getvalue()
            img_buffer.close()
            image_format = "image/png"
        
        prompt = [
            OCR_PROMPT,
            {"mime_type": image_format, "data": img_data}
        ]

        text = safe_generate_content(prompt, retries=3, sleep_time=2)

        if text is None:
            return "ERROR: Unable to process image after multiple retries."
        
        return text
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return f"ERROR: {str(e)}"

def convert_pdf_to_images(pdf_path, dpi=300):
    """
    Convert PDF pages to images.
    
    Args:
        pdf_path: Path to the PDF file
        dpi: DPI for rendering (higher values produce better quality but larger images)
        
    Returns:
        List of PIL Image objects
    """
    try:
        doc = fitz.open(pdf_path)
        images = []
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(dpi/72, dpi/72))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            images.append(img)
            
        logger.info(f"Converted PDF to {len(images)} images")
        return images
    except Exception as e:
        logger.error(f"Error converting PDF to images: {e}")
        raise Exception(f"PDF conversion failed: {str(e)}")

def process_image(image_path):
    """
    Process a single image with OCR using Gemini.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Extracted text as string
    """
    start_time = time.time()
    logger.info(f"Processing image: {image_path}")
    
    extracted_text = extract_text_from_image(image_path)
    
    end_time = time.time()
    elapsed_time = round(end_time - start_time, 2)
    logger.info(f"Processed image in {elapsed_time} seconds")
    
    return extracted_text

def process_pdf(pdf_path):
    """
    Process a PDF document by converting to images and performing OCR on each page.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text as string
    """
    start_time = time.time()
    logger.info(f"Processing PDF: {pdf_path}")
    
    # Convert PDF to images
    images = convert_pdf_to_images(pdf_path)
    
    # Process each image
    combined_text = ""
    for i, img in enumerate(images):
        logger.info(f"Processing page {i+1} of {len(images)}")
        page_text = extract_text_from_image(img)
        combined_text += f"\n\n--- Page {i+1} ---\n\n{page_text}"
        
        # Small pause to avoid rate limits
        if i < len(images) - 1:
            time.sleep(1)
    
    end_time = time.time()
    elapsed_time = round(end_time - start_time, 2)
    logger.info(f"Processed {len(images)} PDF pages in {elapsed_time} seconds")
    
    return combined_text.strip()

def process_file(file_path):
    """
    Process a file based on its extension.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Extracted text as string
    """
    # Get file extension
    ext = file_path.split('.')[-1].lower()
    
    if ext in ['pdf']:
        return process_pdf(file_path)
    elif ext in ['png', 'jpg', 'jpeg']:
        return process_image(file_path)
    else:
        raise Exception(f"Unsupported file format: {ext}") 