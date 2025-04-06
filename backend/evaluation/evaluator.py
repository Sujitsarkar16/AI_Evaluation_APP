"""
Evaluation Module
Evaluates QA pairs using Gemini's multi-agent system for a comprehensive assessment
"""

import os
import logging
import json
import time
import re
import markdown
import google.generativeai as genai
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize the model at module level
model = None

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
        gemini_model_name = "gemini-2.0-flash-thinking-exp-01-21"
        
        # Initialize the model
        model = genai.GenerativeModel(gemini_model_name)
        logger.info(f"Gemini model successfully initialized with model: {gemini_model_name}")
        
        return model
        
    except Exception as e:
        logger.error(f"Error initializing Gemini model: {e}")
        raise Exception(f"Failed to initialize Gemini model: {e}")

def get_professors():
    """
    Return a dictionary of professor personas for multi-agent evaluation.
    Each professor has a specific role in the evaluation process.
    
    Returns:
        dict: Dictionary containing professor personas with their system messages.
    """
    return {
        "Theoretical_Evaluator": {
            "name": "Theoretical_Evaluator",
            "system_message": """You are Professor Sharma, a supportive Assistant Professor in Computer Science with 10 years of expertise, acting as a Theoretical Evaluator.

Your evaluation priorities:
- Recognizing ATTEMPTS at addressing theoretical concepts, even if imperfect
- Giving benefit of doubt when core ideas are present but details are missing
- Awarding partial credit generously for honest attempts
- Finding conceptual understanding beneath imprecise language
- Encouraging further development rather than penalizing gaps

You have LENIENT grading standards for theoretical aspects. When evaluating, first identify the key theoretical points required by the question, then award credit for ANY points the student attempts to address, even partially. Be generous with marks where the student shows effort or partial understanding. Always award grace marks (at least 70% of allocated marks) for genuine attempts."""
        },
        "Practical_Evaluator": {
            "name": "Practical_Evaluator",
            "system_message": """You are Professor Sharma, a supportive Assistant Professor in Computer Science with 10 years of expertise, acting as a Practical Evaluator.

Your evaluation priorities:
- Recognizing ATTEMPTS at practical application, even if the execution is flawed
- Giving credit for directionally correct examples, even if not perfectly implemented
- Valuing creative attempts to connect theory to practice
- Acknowledging problem-solving approaches, even if not optimal
- Finding merit in implementation attempts, even with errors

You are VERY LENIENT on practical evaluation. When evaluating, identify any practical applications attempted by the student and award generous credit for effort and partial understanding. Be quick to award grace marks (at least 70% of allocated marks) for genuine attempts, even if the execution has flaws."""
        },
        "Holistic_Evaluator": {
            "name": "Holistic_Evaluator",
            "system_message": """You are Professor Sharma, a supportive Assistant Professor in Computer Science with 10 years of expertise, acting as a Holistic Evaluator.

Your evaluation priorities:
- Appreciating the OVERALL EFFORT demonstrated in the answer
- Recognizing attempts to integrate multiple concepts, even if connections are imperfect
- Valuing clarity of expression, even if technical precision is lacking
- Acknowledging attempts at critical thinking, even if analysis is incomplete
- Finding the educational value in each answer

You are EXTREMELY LENIENT in your holistic assessment. When evaluating, look primarily for evidence of effort and engagement with the material. Award grace marks generously (at least 70% of allocated marks) for any sincere attempt that shows the student has engaged with the subject, regardless of technical accuracy."""
        },
        "Consensus_Evaluator": {
            "name": "Consensus_Evaluator",
            "system_message": """You are Professor Sharma, a supportive Assistant Professor in Computer Science with 10 years of expertise, responsible for facilitating the final consensus after all three evaluators have provided their perspectives.

Your task is to:
1. Review the evaluations from the Theoretical, Practical, and Holistic perspectives
2. Identify areas where the student deserves the benefit of the doubt
3. Always choose the MOST GENEROUS interpretation of the student's work
4. Determine a final consensus grade that leans toward the HIGHEST proposed grade
5. Provide structured feedback that:
   - Emphasizes strengths and potential in the answer
   - Frames areas needing improvement as opportunities for growth
   - Clearly explains how grace marks were applied
   - Recognizes effort and engagement above technical perfection

In cases of doubt or disagreement between evaluators, ALWAYS default to the more generous interpretation. Ensure that any student who has made a genuine attempt receives at least 70% of the available marks. Your final evaluation should be encouraging and supportive, focusing on future improvement rather than current deficiencies."""
        }
    }

def evaluate_qa_pairs(qa_pairs, totalMarks=100):
    """
    Evaluate a set of question-answer pairs using multi-agent evaluation.
    
    Args:
        qa_pairs (list): List of question-answer pairs to evaluate
        totalMarks (int): Total marks for the exam (default: 100)
        
    Returns:
        dict: Evaluation results
    """
    start_time = time.time()
    logger.info(f"Starting evaluation of {len(qa_pairs)} Q&A pairs")
    
    gemini_model = get_gemini_model()
    
    # Initialize professor personas
    professors = get_professors()
    
    total_score = 0
    max_total_score = 0
    evaluations = []
    
    # Process each Q&A pair with the multi-agent system
    for item in qa_pairs:
        question_num = item.get('questionNumber', 0)
        question_text = item.get('questionText', '')
        max_marks = item.get('maxMarks', 10)
        answer = item.get('answer', '')
        
        if not answer:
            # Skip empty answers with zero score
            evaluations.append({
                'questionNumber': question_num,
                'questionText': question_text,
                'score': 0,
                'maxMarks': max_marks,
                'rationale': "No answer provided.",
                'studentAnswer': answer
            })
            max_total_score += max_marks
            continue
        
        max_total_score += max_marks
        
        logger.info(f"Evaluating question {question_num}")
        
        # Step 1: Individual Evaluations from different professor personas
        evaluation_results = {}
        
        for evaluator_key in ["Theoretical_Evaluator", "Practical_Evaluator", "Holistic_Evaluator"]:
            evaluator = professors[evaluator_key]
            
            # Create evaluation prompt for this persona
            eval_prompt = f"""
            You are {evaluator['name']}, evaluating a student's answer.
            
            QUESTION {question_num} [{max_marks} marks]:
            {question_text}
            
            STUDENT'S ANSWER:
            {answer}
            
            EVALUATION INSTRUCTIONS:
            1. Identify the key points required by the question from your evaluator perspective.
            2. List which of these points are addressed in the student's answer.
            3. Provide your evaluation with a proposed grade (out of {max_marks}) and clear rationale.
            
            Format your response as:
            
            ## {evaluator['name']} Evaluation
            
            **Key Points Required:**
            - [list key points]
            
            **Points Addressed:**
            - [list addressed points]
            
            **Evaluation:**
            [your evaluation with rationale]
            
            **Proposed Grade:** [X] out of {max_marks}
            """
            
            try:
                response = gemini_model.generate_content(eval_prompt)
                evaluation_results[evaluator_key] = response.text if hasattr(response, 'text') else ""
                logger.info(f"Completed {evaluator_key} evaluation for question {question_num}")
                
                # Add a pause to prevent rate limiting
                time.sleep(1)
            except Exception as e:
                logger.error(f"Error in {evaluator_key} evaluation: {e}")
                evaluation_results[evaluator_key] = f"## {evaluator['name']} Evaluation\n\n**Error:** {str(e)}\n\n**Proposed Grade:** 0 out of {max_marks}"
        
        # Step 2: Consensus Evaluation
        consensus_evaluator = professors["Consensus_Evaluator"]
        
        # Extract proposed scores for reference
        theoretical_score_match = re.search(r"\*\*Proposed Grade:\*\* (\d+(?:\.\d+)?)", evaluation_results["Theoretical_Evaluator"])
        practical_score_match = re.search(r"\*\*Proposed Grade:\*\* (\d+(?:\.\d+)?)", evaluation_results["Practical_Evaluator"])
        holistic_score_match = re.search(r"\*\*Proposed Grade:\*\* (\d+(?:\.\d+)?)", evaluation_results["Holistic_Evaluator"])
        
        theoretical_score = theoretical_score_match.group(1) if theoretical_score_match else "N/A"
        practical_score = practical_score_match.group(1) if practical_score_match else "N/A"
        holistic_score = holistic_score_match.group(1) if holistic_score_match else "N/A"
        
        consensus_prompt = f"""
        You are {consensus_evaluator['name']}, facilitating a final consensus evaluation.
        
        QUESTION {question_num} [{max_marks} marks]:
        {question_text}
        
        STUDENT'S ANSWER:
        {answer}
        
        EVALUATIONS FROM DIFFERENT PERSPECTIVES:
        
        {evaluation_results["Theoretical_Evaluator"]}
        
        {evaluation_results["Practical_Evaluator"]}
        
        {evaluation_results["Holistic_Evaluator"]}
        
        CONSENSUS INSTRUCTIONS:
        1. Review all three evaluations
        2. Identify areas of agreement and disagreement
        3. Determine a final consensus grade that is generous toward the student
        4. Provide a clear rationale for your assessment directly related to the student's answer
        5. Focus on what the student did well and what could be improved
        
        Format your response as:
        
        ## Question {question_num}:
        
        **Score:** [X] out of {max_marks}
        
        **Individual Scores:**
        - Theoretical: {theoretical_score}/{max_marks}
        - Practical: {practical_score}/{max_marks}
        - Holistic: {holistic_score}/{max_marks}
        
        **Consensus Rationale:**
        [your consensus rationale, be generous and supportive, directly addressing the student's answer]
        
        **Strengths:**
        - [strength 1 directly from the student's answer]
        - [strength 2 directly from the student's answer]
        
        **Improvement Opportunities:**
        - [specific improvement 1 related to the student's answer]
        - [specific improvement 2 related to the student's answer]
        """
        
        try:
            consensus_response = gemini_model.generate_content(consensus_prompt)
            consensus_text = consensus_response.text if hasattr(consensus_response, 'text') else ""
            
            # Extract the final score
            score_match = re.search(r"\*\*Score:\*\* (\d+(?:\.\d+)?)", consensus_text)
            if score_match:
                try:
                    score = float(score_match.group(1))
                except ValueError:
                    score = 0
            else:
                score = 0
            
            total_score += score
            
            # Extract the rationale
            rationale_match = re.search(r"\*\*Consensus Rationale:\*\*([\s\S]*?)(?:\*\*Strengths:|$)", consensus_text)
            rationale = rationale_match.group(1).strip() if rationale_match else "Assessment completed."
            
            evaluations.append({
                'questionNumber': question_num,
                'questionText': question_text,
                'studentAnswer': answer,
                'score': score,
                'maxMarks': max_marks,
                'rationale': rationale,
                'evaluation': consensus_text
            })
            
            logger.info(f"Completed consensus evaluation for question {question_num}, score: {score}/{max_marks}")
            
            # Add a pause to prevent rate limiting
            time.sleep(1)
        except Exception as e:
            logger.error(f"Error in consensus evaluation: {e}")
            evaluations.append({
                'questionNumber': question_num,
                'questionText': question_text,
                'score': 0,
                'maxMarks': max_marks,
                'rationale': f"Error in evaluation: {str(e)}",
                'evaluation': "Evaluation failed due to an error.",
                'studentAnswer': answer
            })
    
    # Calculate overall percentage and grade
    percentage = round((total_score / max_total_score) * 100) if max_total_score > 0 else 0
    
    # Determine grade based on percentage
    if percentage >= 90:
        grade = "A+"
    elif percentage >= 80:
        grade = "A"
    elif percentage >= 70:
        grade = "B+"
    elif percentage >= 60:
        grade = "B"
    elif percentage >= 50:
        grade = "C"
    else:
        grade = "F"
    
    # Normalize the total score to the specified totalMarks
    normalized_score = int((total_score / max_total_score * totalMarks) if max_total_score > 0 else 0)
    
    evaluation_result = {
        'evaluations': evaluations,
        'totalScore': int(total_score),
        'maxTotalScore': int(max_total_score),
        'percentage': int((total_score / max_total_score * 100) if max_total_score > 0 else 0),
        'normalizedScore': normalized_score,
        'totalMarks': totalMarks,
        'grade': grade
    }
    
    elapsed_time = time.time() - start_time
    logger.info(f"Completed evaluation in {elapsed_time:.2f} seconds, overall score: {total_score}/{max_total_score} ({percentage}%, {grade})")
    
    return evaluation_result

def generate_evaluation_report(evaluation_result):
    """
    Generate a detailed markdown report from the evaluation results.
    
    Args:
        evaluation_result (dict): Evaluation results dictionary
        
    Returns:
        str: Markdown formatted evaluation report
    """
    total_score = evaluation_result.get('totalScore', 0)
    max_total_score = evaluation_result.get('maxTotalScore', 0)
    percentage = evaluation_result.get('percentage', 0)
    grade = evaluation_result.get('grade', 'F')
    normalized_score = evaluation_result.get('normalizedScore', 0)
    total_marks = evaluation_result.get('totalMarks', 100)
    evaluations = evaluation_result.get('evaluations', [])
    
    md = "# Evaluation Report\n\n"
    
    # Overall summary
    md += "## Overall Summary\n\n"
    md += f"**Raw Score:** {total_score}/{max_total_score}\n\n"
    md += f"**Normalized Score:** {normalized_score}/{total_marks}\n\n"
    md += f"**Percentage:** {percentage}%\n\n"
    md += f"**Grade:** {grade}\n\n"
    
    # Individual question evaluations
    md += "## Detailed Assessments\n\n"
    
    for eval_item in evaluations:
        q_num = eval_item.get('questionNumber', 0)
        q_text = eval_item.get('questionText', '')
        student_answer = eval_item.get('studentAnswer', '')
        score = eval_item.get('score', 0)
        max_marks = eval_item.get('maxMarks', 0)
        rationale = eval_item.get('rationale', '')
        full_evaluation = eval_item.get('evaluation', '')
        
        # Question text and number with marks
        md += f"### Question {q_num}: {q_text} [{max_marks} marks]\n\n"
        
        # Student's answer - format based on content
        md += "**Student's Answer:**\n\n"
        
        # If the answer is empty or "No answer provided"
        if not student_answer or student_answer.strip() == "No answer provided":
            md += "_No answer provided_\n\n"
        # If the answer appears to be code, format it as code
        elif any(marker in student_answer.lower() for marker in ['class ', 'int ', 'void ', 'function', 'def ', '#include']):
            md += f"```cpp\n{student_answer}\n```\n\n"
        # Otherwise, format it as regular text
        else:
            md += f"{student_answer}\n\n"
        
        # Score
        md += f"**Score:** {score}/{max_marks}\n\n"
        
        if full_evaluation:
            # Use the full consensus evaluation if available
            # Remove the question header and score as we already added it
            clean_eval = re.sub(r'^## Question \d+:.+?$', '', full_evaluation, flags=re.MULTILINE).strip()
            clean_eval = re.sub(r'^\*\*Score:\*\*.*$', '', clean_eval, flags=re.MULTILINE).strip()
            md += f"{clean_eval}\n\n"
        else:
            # Fallback to simple rationale
            md += f"**Rationale:** {rationale}\n\n"
        
        md += "---\n\n"
    
    return md

def evaluate_and_generate_report(qa_pairs, totalMarks=100):
    """
    Evaluate Q&A pairs and generate a comprehensive report.
    
    Args:
        qa_pairs (list): List of Q&A pairs to evaluate
        totalMarks (int): Total marks for the exam (default: 100)
        
    Returns:
        str: Markdown formatted evaluation report
    """
    # Evaluate the Q&A pairs
    evaluation_result = evaluate_qa_pairs(qa_pairs, totalMarks)
    
    # Generate the report
    report = generate_evaluation_report(evaluation_result)
    
    return report 