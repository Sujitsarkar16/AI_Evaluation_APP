import React from 'react';
import { FileText, CheckCircle, ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '@/components/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface EvaluationResultsProps {
  fileName: string;
  evaluationData: {
    report: string;
    format: string;
    fileName: string;
    timestamp: string;
    questionPaper?: any;
  } | null;
  onReset: () => void;
}

const EvaluationResults: React.FC<EvaluationResultsProps> = ({ 
  fileName, 
  evaluationData,
  onReset
}) => {
  if (!evaluationData) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-xl font-medium text-gray-700">No evaluation data available</h3>
        <Button onClick={onReset} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Evaluation
        </Button>
      </div>
    );
  }

  // Format the timestamp
  const formattedDate = new Date(evaluationData.timestamp).toLocaleString();
  
  // Extract basic information from the report if possible
  let grade = "N/A";
  let percentage = "N/A";
  
  // Try to extract grade information from markdown
  const gradeMatch = evaluationData.report.match(/\*\*Grade:\*\*\s*([A-F][+-]?)/);
  if (gradeMatch && gradeMatch[1]) {
    grade = gradeMatch[1];
  }
  
  // Try to extract percentage information from markdown
  const percentageMatch = evaluationData.report.match(/\*\*Percentage:\*\*\s*(\d+)%/);
  if (percentageMatch && percentageMatch[1]) {
    percentage = `${percentageMatch[1]}%`;
  }

  // Extract the normalized score from the report
  // Try to extract normalized score information from markdown
  const normalizedScoreMatch = evaluationData.report.match(/\*\*Normalized Score:\*\*\s*(\d+)\/(\d+)/);
  let normalizedScore = "N/A";
  let normalizedMaxScore = 100;

  if (normalizedScoreMatch && normalizedScoreMatch[1] && normalizedScoreMatch[2]) {
    normalizedScore = normalizedScoreMatch[1];
    normalizedMaxScore = parseInt(normalizedScoreMatch[2]);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-semibold text-gray-800">Evaluation Results</h2>
          <span className="ml-3 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Complete</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReset}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          New Evaluation
        </Button>
      </div>
      
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
            Submission ID: ED-{new Date().getFullYear()}-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
            Submitted: {formattedDate}
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
            Document: {fileName}
          </div>
          {evaluationData.questionPaper && (
            <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-700 flex items-center">
              <FileQuestion className="mr-1 h-3 w-3" />
              Question Paper: {evaluationData.questionPaper.title}
            </div>
          )}
        </div>
        
        {evaluationData.questionPaper && (
          <div className="mt-4 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <FileQuestion className="mr-2 h-4 w-4" />
              Question Paper Details
            </h4>
            <div className="flex flex-wrap gap-2">
              <div className="bg-white px-3 py-1 rounded-md text-xs border border-blue-100">
                Questions: {evaluationData.questionPaper.questions?.length || 0}
              </div>
              <div className="bg-white px-3 py-1 rounded-md text-xs border border-blue-100">
                Total Marks: {evaluationData.questionPaper.questions?.reduce(
                  (sum, q) => sum + (q.marks || 0), 0
                ) || 0}
              </div>
              <div className="bg-white px-3 py-1 rounded-md text-xs border border-blue-100">
                Type: {evaluationData.questionPaper.type || 'N/A'}
              </div>
              <div className="bg-white px-3 py-1 rounded-md text-xs border border-blue-100">
                Date: {evaluationData.questionPaper.date || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Grade</h3>
          <p className="text-4xl font-bold text-blue-600">{grade}</p>
        </div>
        
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Score</h3>
          <p className="text-4xl font-bold text-blue-600">{percentage}</p>
          {normalizedScore !== "N/A" && (
            <p className="text-sm text-gray-600 mt-1">
              {normalizedScore}/{normalizedMaxScore} marks
            </p>
          )}
        </div>
        
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-2">Status</h3>
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            <p className="text-xl font-medium text-green-600">Completed</p>
          </div>
        </div>
      </div>
      
      {/* Evaluation Report */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Evaluation Report</h3>
        <div className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {evaluationData.report}
          </ReactMarkdown>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            // Create a Blob from the report text
            const blob = new Blob([evaluationData.report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Create a link and trigger a download
            const a = document.createElement('a');
            a.href = url;
            a.download = `Evaluation_Report_${new Date().toISOString().split('T')[0]}.md`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>
    </>
  );
};

export default EvaluationResults; 