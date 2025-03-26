import React, { useState, useEffect } from 'react';
import { Brain, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Textarea';
import EvaluationProcessing from './EvaluationProcessing';
import EvaluationResults from './EvaluationResults';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Evaluations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [additionalComments, setAdditionalComments] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [evaluationData, setEvaluationData] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [questionPapers, setQuestionPapers] = useState([]);
  const [selectedQuestionPaper, setSelectedQuestionPaper] = useState(null);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  
  // Clear error message when file changes
  useEffect(() => {
    if (selectedFile) {
      setErrorMessage('');
    }
  }, [selectedFile]);

  // Fetch question papers from API
  useEffect(() => {
    fetchQuestionPapers();
  }, []);
  
  // Check localStorage for selected question paper ID on component mount
  useEffect(() => {
    const selectedPaperId = localStorage.getItem('selectedQuestionPaperId');
    if (selectedPaperId) {
      // Look for the paper in the fetched question papers
      const paper = questionPapers.find(p => p._id === selectedPaperId);
      if (paper) {
        setSelectedQuestionPaper(paper);
      }
      // Clear the localStorage item after using it
      localStorage.removeItem('selectedQuestionPaperId');
    }
  }, [questionPapers]);
  
  const fetchQuestionPapers = async () => {
    try {
      setIsLoadingPapers(true);
      const response = await axios.get(`${API_BASE_URL}/question-papers`);
      setQuestionPapers(response.data);
    } catch (err) {
      console.error('Error fetching question papers:', err);
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size exceeds 10MB limit');
        return;
      }
      
      setSelectedFile(file);
      setFileName(file.name);
      setErrorMessage('');
    }
  };

  const handleQuestionPaperSelect = (e) => {
    const paperId = e.target.value;
    if (!paperId) {
      setSelectedQuestionPaper(null);
      return;
    }
    
    const paper = questionPapers.find(p => p._id === paperId);
    setSelectedQuestionPaper(paper);
  };

  const handleAgenticEvaluation = async () => {
    if (!selectedFile && !selectedQuestionPaper) {
      setErrorMessage('Please upload a file or select a question paper');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let qaData = null;
      
      // If question paper is selected, use its questions directly
      if (selectedQuestionPaper) {
        setProcessingStage('mapping');
        
        if (!selectedQuestionPaper.questions || selectedQuestionPaper.questions.length === 0) {
          throw new Error('Selected question paper has no questions');
        }
        
        // Process the student answer from uploaded file if both are provided
        if (selectedFile) {
          setProcessingStage('ocr');
          // Step 1: Process document with OCR to get student answers
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const ocrResponse = await axios.post(`${API_BASE_URL}/ocr`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (!ocrResponse.data.text) {
            throw new Error('OCR processing failed: No text extracted');
          }
          
          // Step 2: Map questions from paper to answers from OCR
          setProcessingStage('mapping');
          const mappingResponse = await axios.post(`${API_BASE_URL}/mapping`, {
            text: ocrResponse.data.text,
            questions: selectedQuestionPaper.questions
          });
          
          qaData = mappingResponse.data.qa_pairs;
        } else {
          // For demonstration, create empty answers if no file is uploaded
          // This allows viewing model question papers without student answers
          qaData = selectedQuestionPaper.questions.map(q => ({
            question: q.text,
            questionNumber: q.id,
            answer: '[No student answer provided]',
            maxMarks: q.marks || 0
          }));
        }
      } else {
        // Original flow when only file is provided (no question paper)
        setProcessingStage('ocr');
        // Step 1: Process document with OCR
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const ocrResponse = await axios.post(`${API_BASE_URL}/ocr`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (!ocrResponse.data.text) {
          throw new Error('OCR processing failed: No text extracted');
        }
        
        // Step 2: Map questions to answers
        setProcessingStage('mapping');
        const mappingResponse = await axios.post(`${API_BASE_URL}/mapping`, {
          text: ocrResponse.data.text
        });
        
        if (!mappingResponse.data.qa_pairs || mappingResponse.data.qa_pairs.length === 0) {
          throw new Error('Mapping failed: No Q&A pairs identified');
        }
        
        qaData = mappingResponse.data.qa_pairs;
      }
      
      if (!qaData || qaData.length === 0) {
        throw new Error('No question-answer pairs to evaluate');
      }
      
      // Step 3: Evaluate the Q&A pairs
      setProcessingStage('evaluation');
      const evaluationResponse = await axios.post(`${API_BASE_URL}/evaluate`, {
        qa_pairs: qaData,
        totalMarks: selectedQuestionPaper?.totalMarks || 100
      });
      
      // Store the evaluation report
      setEvaluationData({
        report: evaluationResponse.data.evaluation_report,
        format: evaluationResponse.data.format || 'markdown',
        fileName: fileName || (selectedQuestionPaper ? selectedQuestionPaper.title : 'Evaluation'),
        timestamp: new Date().toISOString(),
        questionPaper: selectedQuestionPaper
      });
      
      // Complete processing
      setIsProcessing(false);
      setShowResults(true);
    } catch (error) {
      console.error('Evaluation process error:', error);
      setErrorMessage(`Evaluation failed: ${error.response?.data?.error || error.message}`);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setSelectedFile(null);
    setFileName('');
    setSelectedQuestionPaper(null);
    setAdditionalComments('');
    setErrorMessage('');
    setEvaluationData(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {!showResults ? (
        <>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Evaluations</h2>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
              <h3 className="font-medium text-blue-800 mb-1">Submit your work for evaluation</h3>
              <p className="text-blue-600 text-sm">Upload your document and our AI agents will analyze and provide detailed feedback.</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Question Paper (Optional)</label>
              <div className="relative">
                <select 
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3"
                  onChange={handleQuestionPaperSelect}
                  value={selectedQuestionPaper?._id || ""}
                  disabled={isLoadingPapers}
                >
                  <option value="">-- Select a question paper --</option>
                  {questionPapers.map(paper => (
                    <option key={paper._id} value={paper._id}>
                      {paper.title} ({paper.questions?.length || 0} questions)
                    </option>
                  ))}
                </select>
                {selectedQuestionPaper && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center text-sm font-medium text-blue-800">
                      <FileText className="h-4 w-4 mr-2" />
                      {selectedQuestionPaper.title}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedQuestionPaper.questions?.length || 0} questions with a total of {
                        selectedQuestionPaper.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0
                      } marks
                    </p>
                  </div>
                )}
                {isLoadingPapers && (
                  <div className="absolute right-2 top-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select a question paper to use its questions for evaluation. 
                If you also upload an answer document, it will be mapped to the selected questions.
                If no file is uploaded, you will see the questions without student answers.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document {selectedQuestionPaper ? '(Optional with Question Paper)' : ''}</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex justify-center text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only" 
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG, TXT up to 10MB
                  </p>
                  {fileName && (
                    <p className="text-sm text-blue-600 font-medium mt-2">
                      Selected: {fileName}
                    </p>
                  )}
                </div>
              </div>
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600">
                  {errorMessage}
                </p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments</label>
              <Textarea 
                className="w-full h-24" 
                placeholder="Add any additional information about your submission..."
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                className="flex-1 flex items-center justify-center"
                onClick={handleAgenticEvaluation}
                disabled={!selectedFile && !selectedQuestionPaper}
              >
                <Upload className="mr-2 h-4 w-4" />
                Standard Evaluation
              </Button>
              
              <Button 
                className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                onClick={handleAgenticEvaluation}
                disabled={!selectedFile && !selectedQuestionPaper}
              >
                <Brain className="mr-2 h-4 w-4" />
                Agentic Evaluation
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EvaluationResults 
          fileName={fileName} 
          evaluationData={evaluationData}
          onReset={handleReset}
        />
      )}

      {isProcessing && (
        <EvaluationProcessing 
          setIsProcessing={setIsProcessing} 
          setShowResults={setShowResults}
          stage={processingStage}
        />
      )}
    </div>
  );
};

export default Evaluations; 