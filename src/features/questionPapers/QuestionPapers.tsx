import React, { useState, useEffect } from 'react';
import { FileText, Upload, Plus, Pencil, Trash2, X, Brain } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import QuestionPaperModal from './QuestionPaperModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Update API URL to point to Flask backend
const API_URL = 'http://localhost:5000/api';

const QuestionPapers = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionPaperTitle, setQuestionPaperTitle] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [creatingNewQP, setCreatingNewQP] = useState(false);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPaper, setCurrentPaper] = useState(null);
  const fileInputRef = React.useRef(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingPaper, setViewingPaper] = useState(null);
  const navigate = useNavigate();
  
  // Fetch question papers from API
  useEffect(() => {
    fetchQuestionPapers();
  }, []);
  
  const fetchQuestionPapers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/question-papers`);
      setQuestionPapers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching question papers:', err);
      setError('Failed to load question papers. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset states
    setSelectedFile(file);
    setFileName(file.name);
    setParsedQuestions([]);
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 10MB');
      return;
    }
    
    // Process text-based files (.txt, .md, .markdown)
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (['txt', 'md', 'markdown'].includes(fileExt)) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          const parsedData = parseQuestionPaper(content);
          
          if (parsedData.length > 0) {
            console.log(`Successfully parsed ${parsedData.length} questions`);
            // Set a default title based on filename if not already set
            if (!questionPaperTitle) {
              setQuestionPaperTitle(file.name.replace(/\.[^/.]+$/, ''));
            }
          } else {
            console.warn('No questions found in the file');
          }
        } catch (error) {
          console.error("Error parsing file:", error);
          alert("Failed to parse the file. Please check the format and try again.");
        }
      };
      
      reader.onerror = () => {
        console.error("File read error");
        alert("Error reading the file. Please try again.");
      };
      
      reader.readAsText(file);
    }
  };
  
  const parseQuestionPaper = (content) => {
    if (!content || typeof content !== 'string') {
      console.error('Invalid content for parsing');
      return [];
    }
    
    // Split content by lines and remove empty lines
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    const questions = [];
    let currentMainQuestion = null;
    let currentSubQuestion = null;
    let isOrAlternative = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip lines that only contain "or" (centered alternatives)
      if (/^\s*or\s*$/i.test(line)) {
        isOrAlternative = true;
        continue;
      }
      
      // Check for main question pattern: Q1), **Q1)**, etc.
      const mainQuestionRegex = /\*?\*?Q(\d+)\)?\*?\*?/i;
      const mainQuestionMatch = line.match(mainQuestionRegex);
      
      if (mainQuestionMatch) {
        // If we have a main question match, create a new question group
        const questionNumber = parseInt(mainQuestionMatch[1]);
        
        // If this is an "or" alternative to the previous question
        if (isOrAlternative && questions.length > 0) {
          // Mark the previous question as having an alternative
          const prevQuestion = questions[questions.length - 1];
          prevQuestion.hasAlternative = true;
          prevQuestion.alternativeNumber = questionNumber;
          
          // Store the alternative info
          currentMainQuestion = {
            id: questionNumber,
            text: line.replace(mainQuestionMatch[0], '').trim(),
            isAlternativeTo: prevQuestion.id,
            subQuestions: [],
            marks: 0 // Will be the sum of sub-question marks
          };
        } else {
          // Regular new question
          currentMainQuestion = {
            id: questionNumber,
            text: line.replace(mainQuestionMatch[0], '').trim(),
            subQuestions: [],
            marks: 0 // Will be the sum of sub-question marks
          };
        }
        
        questions.push(currentMainQuestion);
        isOrAlternative = false;
        continue;
      }
      
      // Check for sub-question pattern: a), b), etc.
      const subQuestionRegex = /^([a-z])\)(.*?)(?:\[(\d+)\])?$/i;
      const subQuestionMatch = line.match(subQuestionRegex);
      
      if (subQuestionMatch && currentMainQuestion) {
        const subQuestionLetter = subQuestionMatch[1].toLowerCase();
        let subQuestionText = subQuestionMatch[2].trim();
        const marks = subQuestionMatch[3] ? parseInt(subQuestionMatch[3]) : 0;
        
        currentSubQuestion = {
          id: subQuestionLetter,
          text: subQuestionText,
          marks: marks,
          options: []
        };
        
        // Add marks to main question total
        currentMainQuestion.marks += marks;
        
        // Add sub-question to current main question
        currentMainQuestion.subQuestions.push(currentSubQuestion);
        continue;
      }
      
      // Check for marks pattern at the end of a line [x]
      const marksRegex = /\[(\d+)\]$/;
      const marksMatch = line.match(marksRegex);
      
      if (marksMatch && currentSubQuestion) {
        const marks = parseInt(marksMatch[1]);
        // Update the sub-question's marks
        currentSubQuestion.marks = marks;
        
        // Update the main question's total marks
        currentMainQuestion.marks = currentMainQuestion.subQuestions.reduce(
          (total, sq) => total + (sq.marks || 0), 0
        );
        
        // Add text from this line (without the marks) to the sub-question
        const textPart = line.replace(marksRegex, '').trim();
        if (textPart && !currentSubQuestion.text.includes(textPart)) {
          currentSubQuestion.text += ' ' + textPart;
        }
        continue;
      }
      
      // Check for options with (or) pattern
      if (line.toLowerCase().includes('(or)') && currentSubQuestion) {
        const options = line.split(/\s*\(or\)\s*/).map(opt => opt.trim()).filter(Boolean);
        if (options.length > 0) {
          currentSubQuestion.options = options;
        }
        continue;
      }
      
      // If none of the above, append to the current sub-question if exists
      if (currentSubQuestion) {
        currentSubQuestion.text += ' ' + line;
      } 
      // Otherwise append to main question if exists
      else if (currentMainQuestion) {
        currentMainQuestion.text += ' ' + line;
      }
    }
    
    // Process the questions to make them compatible with the existing format
    const processedQuestions = [];
    questions.forEach(mainQ => {
      if (mainQ.subQuestions && mainQ.subQuestions.length > 0) {
        // Convert sub-questions to individual questions
        mainQ.subQuestions.forEach(subQ => {
          processedQuestions.push({
            id: `${mainQ.id}${subQ.id}`, // Format as "1a", "1b", etc.
            text: subQ.text,
            marks: subQ.marks,
            options: subQ.options || [],
            mainQuestionId: mainQ.id,
            isSubQuestion: true,
            hasAlternative: mainQ.hasAlternative,
            alternativeNumber: mainQ.alternativeNumber,
            isAlternativeTo: mainQ.isAlternativeTo
          });
        });
      } else {
        // If there are no sub-questions, add the main question as is
        processedQuestions.push({
          id: mainQ.id,
          text: mainQ.text,
          marks: mainQ.marks,
          options: [],
          hasAlternative: mainQ.hasAlternative,
          alternativeNumber: mainQ.alternativeNumber,
          isAlternativeTo: mainQ.isAlternativeTo
        });
      }
    });
    
    // Update state with parsed questions
    setParsedQuestions(processedQuestions);
    return processedQuestions;
  };

  const handleUploadQuestionPaper = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Use filename as title if not specified
      const title = questionPaperTitle || selectedFile.name.replace(/\.[^/.]+$/, '');
      formData.append('title', title);
      
      // Add parsed questions data if available
      if (parsedQuestions.length > 0) {
        formData.append('questions', JSON.stringify(parsedQuestions));
      }
      
      // Send the data to the server
      const response = await axios.post(`${API_URL}/question-papers`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh the question papers list
      await fetchQuestionPapers();
      
      // Determine what message to show based on file type and parsing results
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      const isParsableFile = ['txt', 'md', 'markdown'].includes(fileExt);
      
      if (isParsableFile && parsedQuestions.length > 0) {
        // If parsed successfully, open the editor
        setCurrentPaper(response.data);
        setQuestionPaperTitle(response.data.title);
        setShowCreateModal(true);
        setCreatingNewQP(false);
        alert(`Successfully parsed ${parsedQuestions.length} questions! You can now edit the question paper.`);
      } else if (isParsableFile && parsedQuestions.length === 0) {
        alert('No questions were found in the file, but it was uploaded successfully.');
      } else {
        alert('Question paper uploaded successfully!');
      }
      
      // Reset states
      setSelectedFile(null);
      setFileName('');
      
    } catch (error) {
      console.error('Error uploading question paper:', error);
      alert(`Failed to upload: ${error.response?.data?.message || 'Unknown error occurred'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSaveQuestionPaper = async (paperData) => {
    try {
      setIsProcessing(true);
      
      if (currentPaper && currentPaper._id) {
        // Update existing question paper
        await axios.patch(`${API_URL}/question-papers/${currentPaper._id}`, paperData);
        alert('Question paper updated successfully!');
      } else {
        // Create new question paper without file
        await axios.post(`${API_URL}/question-papers`, paperData);
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
      alert('Failed to save question paper. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteQuestionPaper = async (id) => {
    if (window.confirm('Are you sure you want to delete this question paper?')) {
      try {
        await axios.delete(`${API_URL}/question-papers/${id}`);
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
  
  // Filter question papers based on search term
  const filteredPapers = questionPapers.filter(paper => 
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
              variant="outline" 
              className="flex items-center w-full"
              disabled={isProcessing}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Question Paper
            </Button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.markdown,.pdf,.doc,.docx"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Supports .txt, .md, .pdf, .doc, .docx
            </p>
          </div>
        </div>
      </div>
      
      {fileName && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-800">{fileName}</span>
              {selectedFile && ['txt', 'md', 'markdown'].includes(selectedFile.name.split('.').pop().toLowerCase()) && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Auto-parsing enabled
                </span>
              )}
            </div>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleUploadQuestionPaper}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Upload File'}
            </Button>
          </div>
          
          {/* Show parsed questions preview for TXT and Markdown files */}
          {selectedFile && 
           ['txt', 'md', 'markdown'].includes(selectedFile.name.split('.').pop().toLowerCase()) && 
           parsedQuestions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {parsedQuestions.length} Questions Found:
              </h4>
              <div className="max-h-60 overflow-y-auto p-3 bg-white rounded border border-blue-100">
                {/* Group questions by main question ID */}
                {Array.from(new Set(parsedQuestions.map(q => 
                  q.mainQuestionId || q.id
                ))).map(mainId => {
                  const mainQuestions = parsedQuestions.filter(q => 
                    (q.mainQuestionId || q.id) === mainId && !q.isAlternativeTo
                  );
                  const altQuestions = parsedQuestions.filter(q => 
                    q.isAlternativeTo === mainId
                  );
                  
                  const totalMarks = mainQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
                  
                  return (
                    <div key={mainId} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
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
            </div>
          )}
          
          {/* Show helpful message when no questions found */}
          {selectedFile && 
           ['txt', 'md', 'markdown'].includes(selectedFile.name.split('.').pop().toLowerCase()) && 
           parsedQuestions.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 font-medium">
                No questions detected in this file. The system supports these question formats:
              </p>
              <div className="mt-2 text-xs text-yellow-700 space-y-2">
                <div className="p-2 bg-white rounded border border-yellow-100">
                  <p className="font-medium">Format 1: Simple numbered questions</p>
                  <pre className="whitespace-pre-wrap mt-1 text-xs">
1. What is the capital of France? [5]
Paris (or) Lyon (or) Nice

2. Explain Newton's Law of Motion. [10]
  </pre>
                </div>
                
                <div className="p-2 bg-white rounded border border-yellow-100">
                  <p className="font-medium">Format 2: Complex exam format with main questions and sub-questions</p>
                  <pre className="whitespace-pre-wrap mt-1 text-xs">
**Q1)**
a) Define object oriented programming. [4]
b) What is polymorphism? [5]

or

**Q2)**
a) Explain encapsulation. [4]
b) Write a class example. [5]
  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="mb-4 sm:mb-0">
          <p className="text-gray-600">Access past examination papers and practice tests.</p>
          <p className="text-gray-600 mt-1">
            <span className="font-medium">Auto-parsing</span>: Upload .txt or .md files to automatically extract questions and marks.
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
          <div className="absolute left-3 top-2.5 text-gray-400">
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
          {error}
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
                className="text-gray-400 hover:text-gray-600" 
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