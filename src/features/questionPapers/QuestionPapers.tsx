import React, { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Trash2, X, Brain, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import QuestionPaperModal from './QuestionPaperModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Update API URL to point to Flask backend
const API_URL = 'http://localhost:5000/api';

// Configure axios with timeout and auth
const getAxiosConfig = () => {
  const token = localStorage.getItem('authToken');
  const config: any = {
    timeout: 10000, // 10 seconds timeout
  };
  
  if (token) {
    config.headers = {
      'Authorization': `Bearer ${token}`
    };
  }
  
  return config;
};

const axiosConfig = getAxiosConfig();

const QuestionPapers = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionPaperTitle, setQuestionPaperTitle] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [creatingNewQP, setCreatingNewQP] = useState(false);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPaper, setCurrentPaper] = useState(null);
  const aiParseInputRef = React.useRef(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPaper, setViewingPaper] = useState(null);
  const [aiParseResult, setAiParseResult] = useState(null);
  const [showParsePreview, setShowParsePreview] = useState(false);
  const navigate = useNavigate();
  
  // Fetch question papers from API
  useEffect(() => {
    fetchQuestionPapers();
  }, []);
  
  const fetchQuestionPapers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/question-papers`, getAxiosConfig());
      
      // Extract question_papers array from the response
      if (response.data && response.data.success && Array.isArray(response.data.question_papers)) {
        setQuestionPapers(response.data.question_papers);
      } else {
        setQuestionPapers([]);
      }
    } catch (err) {
      console.error('Error fetching question papers:', err);
      let errorMessage = 'Failed to load question papers. ';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please check if the backend server is running.';
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage += 'Backend server is not available. Please start the backend server using: cd backend ; python app.py';
      } else if (err.response) {
        errorMessage += `Server error: ${err.response.status} ${err.response.statusText}`;
      } else {
        errorMessage += 'Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetry = () => {
    fetchQuestionPapers();
  };
  
  const handleSaveQuestionPaper = async (paperData) => {
    try {
      setIsProcessing(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Authentication required. Please log in to save question papers.');
        return;
      }
      
      // Log the data being sent for debugging
      console.log('Sending question paper data:', paperData);
      console.log('Auth config:', getAxiosConfig());
      
      if (currentPaper && currentPaper._id) {
        // Update existing question paper
        console.log('Updating existing question paper:', currentPaper._id);
        const response = await axios.patch(`${API_URL}/question-papers/${currentPaper._id}`, paperData, getAxiosConfig());
        console.log('Update response:', response.data);
        alert('Question paper updated successfully!');
      } else {
        // Create new question paper without file
        console.log('Creating new question paper');
        const response = await axios.post(`${API_URL}/question-papers`, paperData, getAxiosConfig());
        console.log('Create response:', response.data);
        alert('Question paper created successfully!');
      }
      
      // Refresh the question papers list
      await fetchQuestionPapers();
      
      // Reset state
      setShowCreateModal(false);
      setCreatingNewQP(false);
      setCurrentPaper(null);
      setQuestionPaperTitle('');
      setParsedQuestions([]);
    } catch (err) {
      console.error('Error saving question paper:', err);
      
      // Detailed error reporting
      let errorMessage = 'Failed to save question paper. ';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please check if the backend server is running.';
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        errorMessage += 'Backend server is not available. Please start the backend server using: cd backend && python main.py';
      } else if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.detail || err.response.data?.message || err.response.statusText;
        
        if (status === 401) {
          errorMessage += 'Authentication required. Please log in first.';
        } else if (status === 403) {
          errorMessage += 'Permission denied. You may need to log in or have insufficient permissions.';
        } else if (status === 422) {
          errorMessage += `Invalid data: ${message}`;
        } else if (status === 500) {
          errorMessage += `Server error: ${message}`;
        } else {
          errorMessage += `Server error (${status}): ${message}`;
        }
      } else {
        errorMessage += `Error: ${err.message || 'Unknown error occurred'}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteQuestionPaper = async (id) => {
    if (window.confirm('Are you sure you want to delete this question paper?')) {
      try {
        await axios.delete(`${API_URL}/question-papers/${id}`, getAxiosConfig());
        alert('Question paper deleted successfully!');
        await fetchQuestionPapers();
      } catch (err) {
        console.error('Error deleting question paper:', err);
        alert('Failed to delete question paper. Please try again.');
      }
    }
  };
  
  const handleEditQuestionPaper = (paper) => {
    setCurrentPaper(paper);
    setQuestionPaperTitle(paper.title);
    setParsedQuestions(paper.questions || []);
    setShowCreateModal(true);
    setCreatingNewQP(false);
  };
  
  const handleViewQuestionPaper = (paper) => {
    setViewingPaper(paper);
    setViewModalOpen(true);
  };
  
  const handleUseForEvaluation = (paper) => {
    // Store the selected paper ID in localStorage
    localStorage.setItem('selectedQuestionPaperId', paper._id);
    // Navigate to the evaluations page
    navigate('/dashboard/evaluations');
  };

  const handleAiParseFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 16MB');
      return;
    }
    
    // Check file format (PDF or image)
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'bmp'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      alert('Please select a PDF or image file (PNG, JPG, JPEG, TIFF, BMP)');
      return;
    }
    
    handleAiParsing(file);
  };

  const handleAiParsing = async (file) => {
    if (!file) return;
    
    setIsProcessing(true);
    setAiParseResult(null);
    setShowParsePreview(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/question-papers/parse`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for file upload
      });
      
      if (response.data.success) {
        setAiParseResult(response.data);
        setShowParsePreview(true);
        setQuestionPaperTitle(file.name.replace(/\.[^/.]+$/, ''));
        
        // Convert parsed questions to the format expected by the UI
        const convertedQuestions = convertAiParsedQuestions(response.data.questions);
        setParsedQuestions(convertedQuestions);
      } else {
        alert('Failed to parse question paper: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error parsing question paper:', error);
      alert('Error parsing question paper: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const convertAiParsedQuestions = (aiQuestions) => {
    // Convert AI parsed questions to the format expected by the existing UI
    const converted = [];
    
    aiQuestions.forEach((q, index) => {
      converted.push({
        id: q.id || `Q${index + 1}`,
        text: q.text || '',
        marks: q.marks || 0,
        isSubQuestion: false,
        mainQuestionId: q.parent_id || null,
        options: [],
        choice: q.choice,
        part: q.part
      });
    });
    
    return converted;
  };

  const handleSaveAiParsedQuestions = async () => {
    if (!aiParseResult || !questionPaperTitle.trim()) {
      alert('Please provide a title for the question paper');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const paperData = {
        title: questionPaperTitle.trim(),
        description: `AI-parsed question paper from ${aiParseResult.filename || 'uploaded file'}`,
        questions: aiParseResult.questions,
        subject: aiParseResult.metadata?.subject || "",
        topic: aiParseResult.metadata?.topic || "",
        difficulty: aiParseResult.metadata?.difficulty || "medium",
        duration: aiParseResult.metadata?.duration || 120,
        metadata: aiParseResult.metadata || {},
        validation: aiParseResult.validation || {},
        source: 'ai_parsed'
      };
      
      await handleSaveQuestionPaper(paperData);
      
      // Reset states
      setAiParseResult(null);
      setShowParsePreview(false);
      setParsedQuestions([]);
      setQuestionPaperTitle('');
      
      alert('Question paper saved successfully!');
    } catch (error) {
      console.error('Error saving AI parsed questions:', error);
      alert('Error saving question paper: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Filter question papers based on search term
  const filteredPapers = (Array.isArray(questionPapers) ? questionPapers : []).filter(paper => 
    paper.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Question Papers</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setCurrentPaper(null);
              setQuestionPaperTitle('');
              setParsedQuestions([]);
              setShowCreateModal(true);
              setCreatingNewQP(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>

          <div className="cursor-pointer">
            <Button 
              className="flex items-center w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isProcessing}
              onClick={() => aiParseInputRef.current && aiParseInputRef.current.click()}
            >
              <Brain className="mr-2 h-4 w-4" />
              {isProcessing ? 'Parsing...' : 'AI Parse PDF/Image'}
            </Button>
            <input 
              type="file" 
              className="hidden" 
              ref={aiParseInputRef}
              onChange={handleAiParseFile}
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              AI parses PDF/Image question papers
            </p>
          </div>
        </div>
      </div>
      


      {/* AI Parse Preview */}
      {showParsePreview && aiParseResult && (
        <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Parsed Question Paper</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>📄 {aiParseResult.filename}</span>
                <span>🔢 {aiParseResult.metadata.total_questions} questions</span>
                <span>📝 {aiParseResult.metadata.total_marks} marks</span>
                <span>📖 {aiParseResult.metadata.pages_processed} pages</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowParsePreview(false);
                setAiParseResult(null);
                setParsedQuestions([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Validation Status */}
          {aiParseResult.validation && (
            <div className="mb-4">
              {aiParseResult.validation.valid ? (
                <div className="flex items-center text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                  <span className="mr-2">✅</span>
                  Parsing successful! All questions validated.
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <p className="font-medium text-yellow-800 mb-2">⚠️ Parsing Issues Found:</p>
                  {aiParseResult.validation.issues.map((issue, idx) => (
                    <p key={idx} className="text-sm text-yellow-700">• {issue}</p>
                  ))}
                  {aiParseResult.validation.warnings.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-yellow-700">Warnings:</p>
                      {aiParseResult.validation.warnings.map((warning, idx) => (
                        <p key={idx} className="text-sm text-yellow-600">• {warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Question Paper Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Paper Title
            </label>
            <Input
              value={questionPaperTitle}
              onChange={(e) => setQuestionPaperTitle(e.target.value)}
              placeholder="Enter question paper title..."
              className="w-full"
            />
          </div>

          {/* Parsed Questions Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Parsed Questions:</h4>
            <div className="max-h-80 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4">
              {aiParseResult.questions.map((question, idx) => (
                <div key={idx} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        <span className="text-purple-700">{question.id}</span>
                        {question.part && <span className="text-purple-600">{question.part}</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{question.text}</p>
                      {question.choice && question.choice !== question.id && (
                        <p className="text-xs text-blue-600 mt-1">Choice: {question.choice}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-purple-600 ml-4">
                      [{question.marks} marks]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSaveAiParsedQuestions}
              disabled={isProcessing || !questionPaperTitle.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? 'Saving...' : 'Save Question Paper'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowParsePreview(false);
                setAiParseResult(null);
                setParsedQuestions([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0">
          <p className="text-gray-600">Access past examination papers and practice tests.</p>
          <p className="text-gray-600 mt-1">
            <span className="font-medium">AI Parsing</span>: Upload PDF or image files to automatically extract questions using AI.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Input 
            type="text" 
            placeholder="Search papers..." 
            className="pl-10 pr-4 py-2 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
                      <div className="absolute left-3 top-2.5 text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-600 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium mb-2">Connection Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="ml-4 text-red-600 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200">
          {filteredPapers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No question papers found. Upload a new paper or create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPapers.map((paper) => (
                    <tr key={paper._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 mr-3 bg-red-100 rounded-lg">
                            <FileText className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{paper.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 uppercase">{paper.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{paper.size}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{paper.date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right flex flex-wrap justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditQuestionPaper(paper)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleViewQuestionPaper(paper)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUseForEvaluation(paper)}
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          Evaluate
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteQuestionPaper(paper._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Create/Edit Question Paper Modal */}
      {showCreateModal && (
        <QuestionPaperModal 
          showModal={showCreateModal}
          setShowModal={setShowCreateModal}
          creatingNewQP={creatingNewQP}
          setCreatingNewQP={setCreatingNewQP}
          questionPaperTitle={questionPaperTitle}
          setQuestionPaperTitle={setQuestionPaperTitle}
          parsedQuestions={parsedQuestions}
          currentPaper={currentPaper}
          onSave={handleSaveQuestionPaper}
          isProcessing={isProcessing}
        />
      )}
      
      {/* View Question Paper Modal */}
      {viewModalOpen && viewingPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {viewingPaper.title}
              </h3>
              <button 
                                  className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" 
                onClick={() => setViewModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Paper metadata */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                  Type: {viewingPaper.type}
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                  Date: {viewingPaper.date}
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                  Total Marks: {viewingPaper.totalMarks || 100}
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                  Questions: {viewingPaper.questions?.length || 0}
                </div>
                {viewingPaper.fileUrl && (
                  <a 
                    href={viewingPaper.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-700 hover:bg-blue-200"
                  >
                    Open Original File
                  </a>
                )}
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-blue-800 font-medium">Paper Summary</div>
                  {viewingPaper.totalMarks && (
                    <div className="text-sm text-blue-600">
                      Total marks set to {viewingPaper.totalMarks} (out of 100)
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white p-2 rounded-md text-sm border border-blue-100">
                    <span className="font-medium">Question Count:</span> {viewingPaper.questions?.length || 0}
                  </div>
                  <div className="bg-white p-2 rounded-md text-sm border border-blue-100">
                    <span className="font-medium">Sum of Question Marks:</span> {
                      viewingPaper.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0
                    }
                  </div>
                </div>
              </div>
              
              {/* Question list */}
              {(!viewingPaper.questions || viewingPaper.questions.length === 0) ? (
                <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700">
                  No questions available in this paper.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Questions:</h4>
                  {Array.from(new Set(viewingPaper.questions.map(q => 
                    q.mainQuestionId || q.id
                  ))).map(mainId => {
                    const mainQuestions = viewingPaper.questions.filter(q => 
                      (q.mainQuestionId || q.id) === mainId && !q.isAlternativeTo
                    );
                    const altQuestions = viewingPaper.questions.filter(q => 
                      q.isAlternativeTo === mainId
                    );
                    
                    const totalMarks = mainQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
                    
                    return (
                      <div key={String(mainId)} className="p-4 border border-gray-200 rounded-lg">
                        {/* Main question header */}
                        <div className="font-medium text-gray-800 mb-2">
                          <span className="text-blue-700">Q{String(mainId)})</span> 
                          {mainQuestions[0] && !mainQuestions[0].isSubQuestion && mainQuestions[0].text}
                          <span className="float-right text-blue-600">[{totalMarks} marks]</span>
                        </div>
                        
                        {/* Sub-questions */}
                        {mainQuestions.filter(q => q.isSubQuestion).length > 0 && (
                          <div className="space-y-2 ml-4">
                            {mainQuestions.filter(q => q.isSubQuestion).map((subQ, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{subQ.id.slice(-1)})</span> {subQ.text}
                                <span className="ml-2 text-blue-600 font-medium">[{subQ.marks} marks]</span>
                                
                                {subQ.options.length > 0 && (
                                  <div className="mt-1 ml-4 text-xs text-gray-600">
                                    Options: {subQ.options.join(' (or) ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Alternative questions (OR option) */}
                        {altQuestions.length > 0 && (
                          <>
                            <div className="my-2 text-center text-sm text-gray-500">OR</div>
                            
                            <div className="font-medium text-gray-800 mb-2">
                              <span className="text-blue-700">Q{altQuestions[0].id.split(/[a-z]/i)[0]})</span>
                              {!altQuestions[0].isSubQuestion && altQuestions[0].text}
                              <span className="float-right text-blue-600">
                                [{altQuestions.reduce((sum, q) => sum + (q.marks || 0), 0)} marks]
                              </span>
                            </div>
                            
                            {/* Alternative sub-questions */}
                            <div className="space-y-2 ml-4">
                              {altQuestions.filter(q => q.isSubQuestion).map((subQ, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{subQ.id.slice(-1)})</span> {subQ.text}
                                  <span className="ml-2 text-blue-600 font-medium">[{subQ.marks} marks]</span>
                                  
                                  {subQ.options.length > 0 && (
                                    <div className="mt-1 ml-4 text-xs text-gray-600">
                                      Options: {subQ.options.join(' (or) ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="border-t p-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPapers; 