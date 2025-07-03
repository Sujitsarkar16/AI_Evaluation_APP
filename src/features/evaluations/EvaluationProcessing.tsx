import React from 'react';

interface EvaluationProcessingProps {
  setIsProcessing?: (isProcessing: boolean) => void;
  setShowResults?: (showResults: boolean) => void;
  stage?: string;
  fileName?: string;
  onCancel?: () => void;
}

const EvaluationProcessing: React.FC<EvaluationProcessingProps> = ({ 
  setIsProcessing, 
  setShowResults,
  stage = '',
  fileName,
  onCancel
}) => {
  // Define stage-specific messages
  const stageMessages = {
    ocr: "Extracting text from your document...",
    mapping: "Identifying questions and answers...",
    evaluation: "Evaluating responses using AI agents...",
    "": "Processing your evaluation..."
  };

  // Determine progress bar width based on stage
  const getProgressWidth = () => {
    switch(stage) {
      case 'ocr': return 'w-1/3';
      case 'mapping': return 'w-2/3';
      case 'evaluation': return 'w-full';
      default: return 'w-1/2';
    }
  };

  // Get current stage message
  const stageMessage = stageMessages[stage] || stageMessages[""];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md">
        <div className="flex justify-center mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Processing Your Evaluation</h2>
        <p className="text-gray-600 mb-6">Our AI agents are analyzing your submission. This may take a few minutes...</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div className={`bg-blue-600 h-2.5 rounded-full ${getProgressWidth()} transition-all duration-300`}></div>
        </div>
        <p className="text-sm text-gray-500">{stageMessage}</p>
        {stage === 'evaluation' && (
          <p className="text-xs text-gray-400 mt-2">Almost there! This final step might take a minute or two...</p>
        )}
      </div>
    </div>
  );
};

export default EvaluationProcessing; 