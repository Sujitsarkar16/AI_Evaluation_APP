import React, { useState, useEffect } from 'react';
import { Brain, Upload, FileText, Settings } from 'lucide-react';
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
  const [defaultEvaluationType, setDefaultEvaluationType] = useState('rubric');
  const [studentName, setStudentName] = useState('');
  const [useCompletePipeline, setUseCompletePipeline] = useState(true);
  
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

  // Load default evaluation type from localStorage
  useEffect(() => {
    const savedEvaluationType = localStorage.getItem('defaultEvaluationType');
    if (savedEvaluationType) {
      setDefaultEvaluationType(savedEvaluationType);
    }
  }, []);
  
  // Check localStorage for selected question paper ID on component mount
  useEffect(() => {
    const selectedPaperId = localStorage.getItem('selectedQuestionPaperId');
    if (selectedPaperId) {
      // Look for the paper in the fetched question papers
      const paper = (Array.isArray(questionPapers) ? questionPapers : []).find(p => p._id === selectedPaperId);
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
      
      // Extract question_papers array from the response
      if (response.data && response.data.success && Array.isArray(response.data.question_papers)) {
        setQuestionPapers(response.data.question_papers);
      } else {
        setQuestionPapers([]);
      }
    } catch (err) {
      console.error('Error fetching question papers:', err);
      setQuestionPapers([]); // Set empty array on error
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 16MB to match backend limit)
      if (file.size > 16 * 1024 * 1024) {
        setErrorMessage('File size exceeds 16MB limit');
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Only PDF and image files (PNG, JPEG) are allowed');
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
    
    const paper = (Array.isArray(questionPapers) ? questionPapers : []).find(p => p._id === paperId);
    setSelectedQuestionPaper(paper);
  };

  const handleEvaluation = async () => {
    if (!selectedFile) {
      setErrorMessage('Please upload a student answer sheet');
      return;
    }
    
    setIsProcessing(true);
    setProcessingStage('starting');
    
    try {
      if (useCompletePipeline) {
        // Use the complete pipeline endpoint
        await handleCompletePipeline();
      } else {
        // Use the step-by-step approach
        await handleStepByStepEvaluation();
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      setErrorMessage(error.response?.data?.error || error.message || 'Evaluation failed');
      setIsProcessing(false);
    }
  };

  const handleCompletePipeline = async () => {
    setProcessingStage('processing');
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('studentName', studentName || 'Anonymous');
    formData.append('evaluationType', defaultEvaluationType);
    
    if (selectedQuestionPaper) {
      formData.append('questionPaperId', selectedQuestionPaper._id);
    }
    
    const response = await axios.post(`${API_BASE_URL}/process-complete`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000 // 5 minutes timeout for complete pipeline
    });
    
    if (response.data.success) {
      setEvaluationData({
        evaluationId: response.data.evaluationId,
        result: response.data.result,
        ocrText: response.data.ocrText,
        questions: response.data.questions,
        stats: response.data.stats,
        fileName: fileName,
        studentName: studentName || 'Anonymous',
        timestamp: new Date().toISOString(),
        questionPaper: selectedQuestionPaper,
        evaluationType: defaultEvaluationType
      });
      
      setShowResults(true);
      setIsProcessing(false);
    } else {
      throw new Error('Pipeline processing failed');
    }
  };

  const handleStepByStepEvaluation = async () => {
    let qaData = null;
    
    // Step 1: OCR Processing
    setProcessingStage('ocr');
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const ocrResponse = await axios.post(`${API_BASE_URL}/ocr`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (!ocrResponse.data.success || !ocrResponse.data.text) {
      throw new Error('OCR processing failed: No text extracted');
    }
    
    // Step 2: Q&A Mapping
    setProcessingStage('mapping');
    const mappingResponse = await axios.post(`${API_BASE_URL}/mapping`, {
      text: ocrResponse.data.text,
      questionPaperId: selectedQuestionPaper?._id
    });
    
    if (!mappingResponse.data.success || !mappingResponse.data.questions || mappingResponse.data.questions.length === 0) {
      throw new Error('Mapping failed: No Q&A pairs identified');
    }
    
    qaData = mappingResponse.data.questions;
    
    // Step 3: Evaluation
    setProcessingStage('evaluation');
    const evaluationResponse = await axios.post(`${API_BASE_URL}/evaluate`, {
      questions: qaData,
      evaluationType: defaultEvaluationType,
      studentName: studentName || 'Anonymous'
    });
    
    if (!evaluationResponse.data.success) {
      throw new Error('Evaluation failed');
    }
    
    // Store the evaluation results
    setEvaluationData({
      evaluationId: evaluationResponse.data.evaluationId,
      result: evaluationResponse.data.result,
      ocrText: ocrResponse.data.text,
      questions: qaData,
      stats: {
        mapping: mappingResponse.data.stats,
        evaluation: evaluationResponse.data.stats
      },
      fileName: fileName,
      studentName: studentName || 'Anonymous',
      timestamp: new Date().toISOString(),
      questionPaper: selectedQuestionPaper,
      evaluationType: defaultEvaluationType
    });
    
    setShowResults(true);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileName('');
    setShowResults(false);
    setEvaluationData(null);
    setErrorMessage('');
    setAdditionalComments('');
    setProcessingStage('');
    setStudentName('');
  };

  const getEvaluationTypeDescription = (type) => {
    switch (type) {
      case 'rubric':
        return 'Structured rubric-based evaluation with clear scoring criteria and detailed feedback';
      default:
        return 'Rubric-based evaluation';
    }
  };

  if (showResults && evaluationData) {
    return (
      <EvaluationResults 
        fileName={fileName}
        evaluationData={evaluationData}
        onBack={() => setShowResults(false)}
        onReset={handleReset}
      />
    );
  }

  if (isProcessing) {
    return (
      <EvaluationProcessing 
        stage={processingStage}
        fileName={fileName}
        onCancel={() => {
          setIsProcessing(false);
          setProcessingStage('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Evaluation</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload student answer sheets and get comprehensive AI evaluations using advanced OCR, 
            intelligent Q&A mapping, and multi-criteria assessment.
          </p>
        </div>

        {/* Current Evaluation Type Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 capitalize">
                Current Evaluation Type: {defaultEvaluationType}
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                {getEvaluationTypeDescription(defaultEvaluationType)}
              </p>
            </div>
            <a 
              href="/settings" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Settings className="h-4 w-4 mr-1" />
              Change
            </a>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Student Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name (Optional)
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Question Paper Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Paper (Optional)
            </label>
            <select 
              value={selectedQuestionPaper?._id || ''}
              onChange={handleQuestionPaperSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingPapers}
            >
              <option value="">No question paper (auto-detect questions)</option>
              {(Array.isArray(questionPapers) ? questionPapers : []).map((paper) => (
                <option key={paper._id} value={paper._id}>
                  {paper.title} ({paper.questions?.length || 0} questions)
                </option>
              ))}
            </select>
            {selectedQuestionPaper && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {selectedQuestionPaper.title} - {selectedQuestionPaper.questions?.length || 0} questions
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Student Answer Sheet *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, PNG, JPEG up to 16MB
                </p>
              </label>
            </div>
            {fileName && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {fileName}
              </p>
            )}
          </div>

          {/* Processing Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="processing-mode"
                  checked={useCompletePipeline}
                  onChange={() => setUseCompletePipeline(true)}
                  className="mr-2"
                />
                <span className="text-sm">Complete Pipeline (Recommended) - Faster, single-step processing</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="processing-mode"
                  checked={!useCompletePipeline}
                  onChange={() => setUseCompletePipeline(false)}
                  className="mr-2"
                />
                <span className="text-sm">Step-by-step Processing - Detailed progress tracking</span>
              </label>
            </div>
          </div>

          {/* Additional Comments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <Textarea
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              placeholder="Any specific instructions or context for the evaluation..."
              rows={3}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-800 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleEvaluation}
            disabled={!selectedFile || isProcessing}
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            Submit for Evaluation
          </Button>
        </div>

        {/* Pipeline Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Evaluation Pipeline</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">1. OCR Processing</h4>
              <p className="text-sm text-gray-600">
                Extract text from handwritten answer sheets using advanced AI
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">2. Q&A Mapping</h4>
              <p className="text-sm text-gray-600">
                Intelligently map questions to answers with semantic understanding
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">3. AI Evaluation</h4>
              <p className="text-sm text-gray-600">
                Comprehensive assessment with detailed feedback and scoring
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Evaluations; 