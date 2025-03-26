import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, ArrowUp, ArrowDown, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';

interface Question {
  id: number;
  text: string;
  marks: number;
  options: string[];
}

interface QuestionPaper {
  _id?: string;
  title: string;
  totalMarks: number;
  questions: Question[];
}

interface QuestionPaperModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  creatingNewQP: boolean;
  setCreatingNewQP: (creating: boolean) => void;
  questionPaperTitle: string;
  setQuestionPaperTitle: (title: string) => void;
  parsedQuestions: Question[];
  currentPaper: any;
  onSave: (paperData: QuestionPaper) => void;
  isProcessing: boolean;
}

const QuestionPaperModal: React.FC<QuestionPaperModalProps> = ({ 
  showModal, 
  setShowModal, 
  creatingNewQP, 
  setCreatingNewQP, 
  questionPaperTitle, 
  setQuestionPaperTitle, 
  parsedQuestions,
  currentPaper,
  onSave,
  isProcessing
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editQuestionIndex, setEditQuestionIndex] = useState<number>(-1);
  const [questionText, setQuestionText] = useState<string>('');
  const [questionMarks, setQuestionMarks] = useState<number>(0);
  const [questionOptions, setQuestionOptions] = useState<string[]>([]);
  const [editOption, setEditOption] = useState<string>('');
  const [totalMarks, setTotalMarks] = useState<number>(currentPaper?.totalMarks || 100);
  
  // Initialize questions from parsedQuestions or edited paper
  useEffect(() => {
    if (parsedQuestions && parsedQuestions.length > 0) {
      setQuestions(parsedQuestions);
    } else if (currentPaper && currentPaper.questions) {
      setQuestions(currentPaper.questions);
    }
  }, [parsedQuestions, currentPaper]);
  
  const handleOptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editOption.trim() !== '') {
      handleAddOption();
    }
  };
  
  const handleAddOption = () => {
    if (editOption.trim() !== '') {
      setQuestionOptions([...questionOptions, editOption.trim()]);
      setEditOption('');
    }
  };
  
  const handleRemoveOption = (index: number) => {
    const newOptions = [...questionOptions];
    newOptions.splice(index, 1);
    setQuestionOptions(newOptions);
  };
  
  const handleAddQuestion = () => {
    if (questionText.trim() === '') return;
    
    const newQuestion: Question = {
      id: editQuestionIndex >= 0 ? questions[editQuestionIndex].id : questions.length + 1,
      text: questionText.trim(),
      marks: questionMarks,
      options: [...questionOptions]
    };
    
    if (editQuestionIndex >= 0) {
      // Edit existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editQuestionIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, newQuestion]);
    }
    
    // Reset form
    setQuestionText('');
    setQuestionMarks(0);
    setQuestionOptions([]);
    setEditQuestionIndex(-1);
  };
  
  const handleEditQuestion = (index: number) => {
    const question = questions[index];
    setQuestionText(question.text);
    setQuestionMarks(question.marks);
    setQuestionOptions(question.options || []);
    setEditQuestionIndex(index);
  };
  
  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    
    // Renumber questions
    newQuestions.forEach((q, i) => {
      q.id = i + 1;
    });
    
    setQuestions(newQuestions);
    
    // If editing the question that was removed, reset the form
    if (editQuestionIndex === index) {
      setQuestionText('');
      setQuestionMarks(0);
      setQuestionOptions([]);
      setEditQuestionIndex(-1);
    } else if (editQuestionIndex > index) {
      // Adjust edit index if removing a question before it
      setEditQuestionIndex(editQuestionIndex - 1);
    }
  };
  
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === questions.length - 1)) {
      return;
    }
    
    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap questions
    [newQuestions[index], newQuestions[targetIndex]] = 
    [newQuestions[targetIndex], newQuestions[index]];
    
    // Renumber questions
    newQuestions.forEach((q, i) => {
      q.id = i + 1;
    });
    
    setQuestions(newQuestions);
    
    // Update edit index if moving the question being edited
    if (editQuestionIndex === index) {
      setEditQuestionIndex(targetIndex);
    } else if (editQuestionIndex === targetIndex) {
      setEditQuestionIndex(index);
    }
  };
  
  const handleSaveQuestionPaper = () => {
    if (!questionPaperTitle.trim()) {
      alert('Please enter a title for the question paper');
      return;
    }
    
    // Prepare the data to save
    const paperData: QuestionPaper = {
      title: questionPaperTitle,
      totalMarks: totalMarks,
      questions: questions
    };
    
    // If editing, include the existing ID
    if (currentPaper && currentPaper._id) {
      paperData._id = currentPaper._id;
    }
    
    // Call the onSave handler passed from parent
    onSave(paperData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            {creatingNewQP ? 'Create New Question Paper' : 'Edit Question Paper'}
          </h3>
          <button 
            className="text-gray-400 hover:text-gray-600" 
            onClick={() => setShowModal(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Paper Title
            </label>
            <Input 
              type="text" 
              value={questionPaperTitle} 
              onChange={(e) => setQuestionPaperTitle(e.target.value)}
              placeholder="Enter question paper title"
              className="w-full"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Marks (out of 100)
            </label>
            <Input 
              type="number" 
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              placeholder="Enter total marks (default: 100)"
              className="w-full"
              min={1}
              max={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to normalize the evaluation scores. Individual question marks will add up to this total.
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium text-gray-800">
                {editQuestionIndex >= 0 
                  ? `Edit Question #${editQuestionIndex + 1}` 
                  : 'Add New Question'}
              </h4>
              {editQuestionIndex >= 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setQuestionText('');
                    setQuestionMarks(0);
                    setQuestionOptions([]);
                    setEditQuestionIndex(-1);
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <Textarea 
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Enter question text"
                className="w-full"
                rows={3}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marks
              </label>
              <Input 
                type="number" 
                value={questionMarks}
                onChange={(e) => setQuestionMarks(Number(e.target.value))}
                placeholder="Enter marks for this question"
                className="w-full"
                min={0}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options (for multiple choice questions)
              </label>
              <div className="flex">
                <Input 
                  type="text"
                  value={editOption}
                  onChange={(e) => setEditOption(e.target.value)}
                  onKeyDown={handleOptionKeyDown}
                  placeholder="Add an option"
                  className="w-full mr-2"
                />
                <Button onClick={handleAddOption}>
                  <Plus size={16} />
                </Button>
              </div>
              
              {questionOptions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {questionOptions.map((option, index) => (
                    <div key={index} className="flex items-center bg-gray-50 p-2 rounded">
                      <span className="flex-1">{option}</span>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleAddQuestion}
            >
              {editQuestionIndex >= 0 ? 'Update Question' : 'Add Question'}
            </Button>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">
              Questions ({questions.length})
            </h4>
            
            {questions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No questions added yet. Add questions using the form above.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">
                            {question.id}. {question.text}
                          </span>
                          <span className="text-blue-600 font-medium">
                            [{question.marks} marks]
                          </span>
                        </div>
                        
                        {question.options && question.options.length > 0 && (
                          <div className="pl-4 text-sm text-gray-600 mt-1">
                            Options: {question.options.join(' (or) ')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-start ml-4 space-x-1">
                        <button 
                          className="text-gray-500 p-1 hover:bg-gray-200 rounded"
                          onClick={() => handleMoveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp size={16} className={index === 0 ? 'opacity-30' : ''} />
                        </button>
                        <button 
                          className="text-gray-500 p-1 hover:bg-gray-200 rounded"
                          onClick={() => handleMoveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                        >
                          <ArrowDown size={16} className={index === questions.length - 1 ? 'opacity-30' : ''} />
                        </button>
                        <button 
                          className="text-blue-500 p-1 hover:bg-blue-100 rounded"
                          onClick={() => handleEditQuestion(index)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="text-red-500 p-1 hover:bg-red-100 rounded"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button 
            variant="outline" 
            className="mr-2"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 flex items-center"
            onClick={handleSaveQuestionPaper}
            disabled={isProcessing || questions.length === 0}
          >
            <Save size={16} className="mr-2" />
            {isProcessing ? 'Saving...' : 'Save Question Paper'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperModal; 