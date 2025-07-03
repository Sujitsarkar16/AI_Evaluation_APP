
import os
import logging
import json
import time
import re
import markdown
import google.generativeai as genai
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_fixed, RetryError
from concurrent.futures import ThreadPoolExecutor, as_completed
# EVALUATION_PROMPT import removed - using only rubric-based evaluation

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
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
    logger.info(f"Successfully initialized Gemini model for evaluation: {MODEL_NAME}")
except Exception as e:
    logger.error(f"Error configuring Gemini API for evaluation: {e}")
    model = None

# Global metrics
overall_run_input_tokens = 0
overall_run_output_tokens = 0
overall_run_api_requests = 0
overall_run_sheets_evaluated = 0

def get_gemini_model():
    """Initialize and return the Gemini model."""
    global model
    
    try:
        if model is not None:
            return model
        
        # Get API key from environment
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

# Professor prompts removed - using only rubric-based evaluation as requested

# generate_evaluation_prompt function removed - using only rubric-based evaluation

@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(1),
    reraise=True
)
def make_gemini_call_with_retry(prompt_text, q_id="Unknown"):
    """
    Makes a Gemini API call with retry logic and tracks token usage.
    """
    global overall_run_api_requests, overall_run_input_tokens, overall_run_output_tokens

    if not model:
        raise Exception("Gemini model not initialized")

    overall_run_api_requests += 1

    try:
        response = model.generate_content(prompt_text)

        # Track token usage
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            if hasattr(response.usage_metadata, 'prompt_token_count'):
                overall_run_input_tokens += response.usage_metadata.prompt_token_count
            if hasattr(response.usage_metadata, 'candidates_token_count'):
                overall_run_output_tokens += response.usage_metadata.candidates_token_count

        # Validate response
        if not response.candidates:
            raise ValueError("Gemini API returned no candidates")
        if not response.candidates[0].content.parts:
            raise ValueError("Gemini API returned no content parts")

        full_response_text = ""
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'text'):
                full_response_text += part.text
            else:
                raise ValueError(f"Non-text content part: {type(part)}")

        # Extract JSON from response
        json_start_index = full_response_text.find('{')
        json_end_index = full_response_text.rfind('}')

        if json_start_index == -1 or json_end_index == -1:
            raise ValueError("No complete JSON object found in response")

        json_string = full_response_text[json_start_index : json_end_index + 1]
        evaluation_data = json.loads(json_string)

        logger.info(f"Successfully evaluated question {q_id}")
        return evaluation_data

    except Exception as e:
        logger.error(f"Error evaluating question {q_id}: {e}")
        raise

def evaluate_single_question(question_data, evaluation_type="rubric"):
    """
    Evaluates a single question-answer pair using rubric-based evaluation.
    
    Args:
        question_data: Dictionary containing question info and student answer
        evaluation_type: Type of evaluation (defaults to "rubric" - only rubric-based evaluation supported)
    
    Returns:
        Dictionary containing evaluation results
    """
    try:
        question_text = question_data.get('questionText', question_data.get('question', ''))
        student_answer = question_data.get('answer', '')
        max_marks = question_data.get('maxMarks', 10)
        question_id = question_data.get('questionNumber', 'Unknown')

        if not question_text or not student_answer:
            logger.warning(f"Missing data for question {question_id}")
            return create_default_evaluation(question_data)

        # Use only rubric-based evaluation as requested
        prompt = generate_rubric_evaluation_prompt(question_text, student_answer, max_marks)

        # Make API call
        evaluation_result = make_gemini_call_with_retry(prompt, question_id)
        
        # Process and return result
        return process_evaluation_result(evaluation_result, question_data)

    except Exception as e:
        logger.error(f"Error evaluating question {question_data.get('questionNumber', 'Unknown')}: {e}")
        return create_error_evaluation(question_data, str(e))

# BIGGEN evaluation removed - using only rubric-based evaluation as requested

def generate_rubric_evaluation_prompt(question_text, student_answer_text, max_marks):
    """Generate rubric-based evaluation prompt"""
    # Calculate maximum scores for each criterion
    accuracy_max = round(max_marks * 0.4)
    completeness_max = round(max_marks * 0.3) 
    clarity_max = round(max_marks * 0.2)
    depth_max = max_marks - accuracy_max - completeness_max - clarity_max  # Ensure total equals max_marks
    
    return f"""You are evaluating using a structured rubric-based approach.
Use clear criteria and scoring levels for consistent evaluation.

**Question ({max_marks} marks):**
{question_text}

**Student Answer:**
{student_answer_text}

**Rubric Levels:**
- Excellent (90-100%): Exceeds expectations
- Good (75-89%): Meets expectations with minor gaps
- Satisfactory (60-74%): Meets basic expectations
- Needs Improvement (40-59%): Below expectations
- Unsatisfactory (0-39%): Far below expectations

**Evaluation Criteria:**
1. **Accuracy** (Max: {accuracy_max} marks): Correctness of information
2. **Completeness** (Max: {completeness_max} marks): Coverage of all aspects
3. **Clarity** (Max: {clarity_max} marks): Clear communication
4. **Depth** (Max: {depth_max} marks): Level of detail and insight

Provide your evaluation in the following JSON format. Do NOT include any text outside the JSON block:

{{
    "evaluation": {{
        "max_marks": {max_marks},
        "rubric_scores": {{
            "accuracy": {{"score": 0, "max_score": {accuracy_max}, "level": "Excellent/Good/Satisfactory/Needs Improvement/Unsatisfactory", "justification": "Detailed explanation of scoring"}},
            "completeness": {{"score": 0, "max_score": {completeness_max}, "level": "Excellent/Good/Satisfactory/Needs Improvement/Unsatisfactory", "justification": "Detailed explanation of scoring"}},
            "clarity": {{"score": 0, "max_score": {clarity_max}, "level": "Excellent/Good/Satisfactory/Needs Improvement/Unsatisfactory", "justification": "Detailed explanation of scoring"}},
            "depth": {{"score": 0, "max_score": {depth_max}, "level": "Excellent/Good/Satisfactory/Needs Improvement/Unsatisfactory", "justification": "Detailed explanation of scoring"}}
        }},
        "total_score": 0,
        "percentage": 0,
        "overall_level": "Overall performance level",
        "evaluation_type": "Rubric-Based",
        "feedback": "Comprehensive feedback highlighting strengths and areas for improvement"
    }}
}}"""

def process_evaluation_result(evaluation_result, question_data):
    """Process and standardize evaluation result"""
    try:
        eval_data = evaluation_result.get('evaluation', evaluation_result)
        
        # Extract scores based on evaluation type
        total_score = eval_data.get('total_score', eval_data.get('overall_score', 0))
        percentage = eval_data.get('percentage', 0)
        max_marks = eval_data.get('max_marks', question_data.get('maxMarks', 10))
        
        # Calculate total score from rubric scores if not provided
        if not total_score and eval_data.get('rubric_scores'):
            rubric_scores = eval_data.get('rubric_scores', {})
            total_score = sum(score_data.get('score', 0) for score_data in rubric_scores.values() if isinstance(score_data, dict))
        
        # Calculate percentage if not provided
        if not percentage and total_score and max_marks:
            percentage = round((total_score / max_marks) * 100, 2)
        
        # Build comprehensive feedback from rubric if available
        feedback = eval_data.get('feedback', 'No feedback provided')
        rubric_scores = eval_data.get('rubric_scores', {})
        
        if rubric_scores and isinstance(rubric_scores, dict):
            feedback_parts = [feedback]
            feedback_parts.append("\n\nDetailed Rubric Breakdown:")
            for criterion, data in rubric_scores.items():
                if isinstance(data, dict):
                    score = data.get('score', 0)
                    max_score = data.get('max_score', 0)
                    level = data.get('level', 'N/A')
                    justification = data.get('justification', 'No justification provided')
                    feedback_parts.append(f"• {criterion.title()}: {score}/{max_score} ({level}) - {justification}")
            feedback = "\n".join(feedback_parts)

        return {
            "questionNumber": question_data.get('questionNumber', 'Unknown'),
            "questionText": question_data.get('questionText', question_data.get('question', '')),
            "studentAnswer": question_data.get('answer', ''),
            "maxMarks": max_marks,
            "obtainedMarks": total_score,
            "percentage": percentage,
            "feedback": feedback,
            "rubricScores": rubric_scores,
            "evaluationType": eval_data.get('evaluation_type', 'Rubric-Based'),
            "evaluationDetails": eval_data
        }

    except Exception as e:
        logger.error(f"Error processing evaluation result: {e}")
        logger.error(f"Evaluation result data: {evaluation_result}")
        return create_error_evaluation(question_data, str(e))

def create_default_evaluation(question_data):
    """Create default evaluation for missing data"""
    return {
        "questionNumber": question_data.get('questionNumber', 'Unknown'),
        "questionText": question_data.get('questionText', question_data.get('question', '')),
        "studentAnswer": question_data.get('answer', ''),
        "maxMarks": question_data.get('maxMarks', 10),
        "obtainedMarks": 0,
        "percentage": 0,
        "feedback": "Unable to evaluate: Missing question or answer data",
        "rubricScores": {},
        "evaluationType": "Default",
        "evaluationDetails": {}
    }

def create_error_evaluation(question_data, error_msg):
    """Create error evaluation"""
    return {
        "questionNumber": question_data.get('questionNumber', 'Unknown'),
        "questionText": question_data.get('questionText', question_data.get('question', '')),
        "studentAnswer": question_data.get('answer', ''),
        "maxMarks": question_data.get('maxMarks', 10),
        "obtainedMarks": 0,
        "percentage": 0,
        "feedback": f"Evaluation error: {error_msg}",
        "rubricScores": {},
        "evaluationType": "Error",
        "evaluationDetails": {"error": error_msg}
    }

def evaluate_and_generate_report(qa_pairs, evaluation_type="rubric"):
    """
    Main function to evaluate all Q&A pairs and generate a comprehensive report.
    
    Args:
        qa_pairs: List of question-answer pairs
        evaluation_type: Type of evaluation to perform
    
    Returns:
        Dictionary containing evaluation results and summary
    """
    global overall_run_sheets_evaluated
    
    try:
        logger.info(f"Starting evaluation of {len(qa_pairs)} questions using {evaluation_type} evaluation")
        
        if not qa_pairs:
            logger.warning("No Q&A pairs provided for evaluation")
            return create_empty_report()

        overall_run_sheets_evaluated += 1
        
        # Evaluate questions in parallel for better performance
        results = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_question = {
                executor.submit(evaluate_single_question, qa_data, evaluation_type): qa_data
                for qa_data in qa_pairs
            }
            
            for future in as_completed(future_to_question.keys()):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    question_data = future_to_question[future]
                    logger.error(f"Failed to evaluate question {question_data.get('questionNumber', 'Unknown')}: {e}")
                    results.append(create_error_evaluation(question_data, str(e)))
        
        # Sort results by question number
        results.sort(key=lambda x: str(x.get('questionNumber', '')))
        
        # Generate summary statistics
        summary = generate_evaluation_summary(results, evaluation_type)
        
        logger.info(f"Evaluation completed. Total score: {summary['totalObtained']}/{summary['totalMaxMarks']} ({summary['overallPercentage']:.1f}%)")
        
        return {
            "evaluations": results,
            "summary": summary,
            "evaluationType": evaluation_type,
            "totalQuestions": len(results),
            "processingStats": {
                "input_tokens": overall_run_input_tokens,
                "output_tokens": overall_run_output_tokens,
                "api_requests": overall_run_api_requests
            }
        }

    except Exception as e:
        logger.error(f"Error in evaluation process: {e}")
        raise

def generate_evaluation_summary(results, evaluation_type):
    """Generate summary statistics from evaluation results"""
    try:
        total_max_marks = sum(r.get('maxMarks', 0) for r in results)
        total_obtained = sum(r.get('obtainedMarks', 0) for r in results)
        overall_percentage = (total_obtained / total_max_marks * 100) if total_max_marks > 0 else 0
        
        # Grade calculation
        if overall_percentage >= 90:
            grade = "A+"
        elif overall_percentage >= 80:
            grade = "A"
        elif overall_percentage >= 70:
            grade = "B"
        elif overall_percentage >= 60:
            grade = "C"
        elif overall_percentage >= 50:
            grade = "D"
        else:
            grade = "F"
        
        # Question-wise performance
        questions_above_80 = len([r for r in results if r.get('percentage', 0) >= 80])
        questions_below_50 = len([r for r in results if r.get('percentage', 0) < 50])
        
        return {
            "totalMaxMarks": total_max_marks,
            "totalObtained": round(total_obtained, 2),
            "overallPercentage": round(overall_percentage, 2),
            "grade": grade,
            "questionsEvaluated": len(results),
            "questionsAbove80": questions_above_80,
            "questionsBelow50": questions_below_50,
            "evaluationType": evaluation_type,
            "averageScore": round(total_obtained / len(results), 2) if results else 0
        }
        
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return {
            "totalMaxMarks": 0,
            "totalObtained": 0,
            "overallPercentage": 0,
            "grade": "N/A",
            "questionsEvaluated": 0,
            "questionsAbove80": 0,
            "questionsBelow50": 0,
            "evaluationType": evaluation_type,
            "averageScore": 0
        }

def create_empty_report():
    """Create empty report when no data is provided"""
    return {
        "evaluations": [],
        "summary": {
            "totalMaxMarks": 0,
            "totalObtained": 0,
            "overallPercentage": 0,
            "grade": "N/A",
            "questionsEvaluated": 0,
            "questionsAbove80": 0,
            "questionsBelow50": 0,
            "evaluationType": "None",
            "averageScore": 0
        },
        "evaluationType": "None",
        "totalQuestions": 0,
        "processingStats": {
            "input_tokens": 0,
            "output_tokens": 0,
            "api_requests": 0
        }
    }

def get_evaluation_stats():
    """Get global evaluation statistics"""
    return {
        "total_input_tokens": overall_run_input_tokens,
        "total_output_tokens": overall_run_output_tokens,
        "total_api_requests": overall_run_api_requests,
        "sheets_evaluated": overall_run_sheets_evaluated
    } 