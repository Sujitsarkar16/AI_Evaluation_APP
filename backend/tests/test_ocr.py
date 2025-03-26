"""
Unit tests for the OCR module
"""

import os
import unittest
from unittest.mock import patch, MagicMock
import sys
import io

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ocr.ocr_processor import process_image_with_tesseract, process_file

class TestOCRProcessor(unittest.TestCase):
    """Test cases for OCR processing functions"""

    @patch('ocr.ocr_processor.pytesseract.image_to_string')
    @patch('ocr.ocr_processor.Image.open')
    def test_process_image_with_tesseract(self, mock_open, mock_image_to_string):
        """Test tesseract OCR processing"""
        # Mock image and OCR response
        mock_image = MagicMock()
        mock_open.return_value = mock_image
        mock_image_to_string.return_value = "Sample extracted text"
        
        # Call the function with a mock image path
        result = process_image_with_tesseract("fake_image.jpg")
        
        # Assert expected behavior
        mock_open.assert_called_once_with("fake_image.jpg")
        mock_image_to_string.assert_called_once_with(mock_image)
        self.assertEqual(result, "Sample extracted text")

    def test_process_file_with_unsupported_format(self):
        """Test that unsupported file formats raise exception"""
        with self.assertRaises(Exception) as context:
            process_file("test.txt")
        
        self.assertTrue("Unsupported file format" in str(context.exception))
    
    @patch('ocr.ocr_processor.process_image')
    def test_process_file_with_image(self, mock_process_image):
        """Test processing image file formats"""
        # Set up mock
        mock_process_image.return_value = "Image text content"
        
        # Test different image formats
        for ext in ['png', 'jpg', 'jpeg']:
            with self.subTest(ext=ext):
                filename = f"test.{ext}"
                result = process_file(filename)
                self.assertEqual(result, "Image text content")
                mock_process_image.assert_called_with(filename)

    @patch('ocr.ocr_processor.process_pdf')
    def test_process_file_with_pdf(self, mock_process_pdf):
        """Test processing PDF file"""
        # Set up mock
        mock_process_pdf.return_value = "PDF text content"
        
        # Test PDF processing
        result = process_file("test.pdf")
        self.assertEqual(result, "PDF text content")
        mock_process_pdf.assert_called_once_with("test.pdf")

if __name__ == '__main__':
    unittest.main() 