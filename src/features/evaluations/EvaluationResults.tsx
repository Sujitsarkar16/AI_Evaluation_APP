import React from 'react';
import { FileText, CheckCircle, ArrowLeft, FileQuestion, Award, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/Button';

interface EvaluationResultsProps {
  fileName?: string;
  evaluationData: {
    result?: any;
    report?: string;
    format?: string;
    fileName?: string;
    timestamp: string;
    questionPaper?: any;
    studentName?: string;
    evaluationId?: string;
  } | null;
  onReset: () => void;
  onBack?: () => void;
}

const EvaluationResults: React.FC<EvaluationResultsProps> = ({ 
  fileName, 
  evaluationData,
  onReset,
  onBack
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
  
  // Extract evaluation data from the structured result
  const result = evaluationData.result;
  const summary = result?.summary || {};
  const evaluations = result?.evaluations || [];
  
  // Debug logging to see what data we're receiving
  console.log('🔍 EvaluationResults Debug Data:');
  console.log('Full evaluationData:', evaluationData);
  console.log('Result structure:', result);
  console.log('Summary data:', summary);
  console.log('Evaluations array:', evaluations);
  
  // Get the main evaluation metrics
  const grade = summary.grade || "N/A";
  const percentage = summary.overallPercentage ? `${summary.overallPercentage.toFixed(1)}%` : "N/A";
  const totalObtained = summary.totalObtained || 0;
  const totalMaxMarks = summary.totalMaxMarks || 0;
  const questionsEvaluated = summary.questionsEvaluated || 0;

  // Get file name
  const displayFileName = fileName || evaluationData.fileName || "Unknown file";

  // Generate detailed report content from structured data
  const generateDetailedReport = () => {
    if (!evaluations || evaluations.length === 0) {
      return "No detailed evaluation data available.";
    }

    let reportContent = `# EVALUATION REPORT\n\n`;
    reportContent += `**Student:** ${evaluationData.studentName || 'Anonymous'}\n`;
    reportContent += `**Document:** ${displayFileName}\n`;
    reportContent += `**Date:** ${formattedDate}\n`;
    reportContent += `**Submission ID:** ED-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}\n\n`;
    
    reportContent += `---\n\n## PERFORMANCE SUMMARY\n\n`;
    reportContent += `| Metric | Value |\n`;
    reportContent += `|--------|-------|\n`;
    reportContent += `| **Overall Grade** | ${grade} |\n`;
    reportContent += `| **Total Score** | ${totalObtained}/${totalMaxMarks} (${percentage}) |\n`;
    reportContent += `| **Questions Evaluated** | ${questionsEvaluated} |\n`;
    reportContent += `| **Questions Above 80%** | ${summary.questionsAbove80 || 0} |\n`;
    reportContent += `| **Questions Below 50%** | ${summary.questionsBelow50 || 0} |\n\n`;

    reportContent += `---\n\n## DETAILED EVALUATION\n\n`;

    evaluations.forEach((evaluation, index) => {
      reportContent += `### Question ${evaluation.questionNumber || index + 1}\n\n`;
      reportContent += `| Field | Details |\n`;
      reportContent += `|-------|--------|\n`;
      reportContent += `| **Question** | ${evaluation.questionText || 'N/A'} |\n`;
      reportContent += `| **Student Answer** | ${evaluation.studentAnswer || 'No answer provided'} |\n`;
      reportContent += `| **Score** | ${evaluation.obtainedMarks || 0}/${evaluation.maxMarks || 0} (${evaluation.percentage || 0}%) |\n`;
      reportContent += `| **Feedback** | ${evaluation.feedback || 'No feedback available'} |\n`;
      
      if (evaluation.rubricScores && Object.keys(evaluation.rubricScores).length > 0) {
        reportContent += `\n**Rubric Breakdown:**\n\n`;
        reportContent += `| Criterion | Score | Justification |\n`;
        reportContent += `|-----------|-------|---------------|\n`;
        Object.entries(evaluation.rubricScores).forEach(([criterion, data]: [string, any]) => {
          reportContent += `| ${criterion} | ${data.score || 0}/${data.max_score || 0} | ${data.justification || 'No justification'} |\n`;
        });
      }
      
      reportContent += `\n---\n\n`;
    });

    return reportContent;
  };

  const detailedReport = generateDetailedReport();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Evaluation Report</h1>
              <p className="text-sm text-gray-500 mt-1">AI-Powered Academic Assessment</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                Completed
              </span>
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
          </div>
        </div>

        {/* Submission Details */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Submission ID:</span>
              <p className="text-gray-600">ED-{new Date().getFullYear()}-{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date:</span>
              <p className="text-gray-600">{formattedDate}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Document:</span>
              <p className="text-gray-600">{displayFileName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Student:</span>
              <p className="text-gray-600">{evaluationData.studentName || 'Anonymous'}</p>
            </div>
          </div>

          {evaluationData.questionPaper && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-center mb-2">
                <FileQuestion className="mr-2 h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Question Paper: {evaluationData.questionPaper.title}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
                <span>Questions: {evaluationData.questionPaper.questions?.length || 0}</span>
                <span>Total Marks: {evaluationData.questionPaper.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0}</span>
                <span>Type: {evaluationData.questionPaper.type || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <div className="flex justify-center mb-3">
            <Award className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Overall Grade</h3>
          <p className="text-3xl font-bold text-blue-600">{grade}</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <div className="flex justify-center mb-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Total Score</h3>
          <p className="text-3xl font-bold text-green-600">{percentage}</p>
          <p className="text-xs text-gray-500 mt-1">{totalObtained}/{totalMaxMarks} marks</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Questions Evaluated</h3>
          <p className="text-3xl font-bold text-purple-600">{questionsEvaluated}</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Performance</h3>
          <div className="flex justify-center space-x-4 mt-2">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{summary.questionsAbove80 || 0}</p>
              <p className="text-xs text-gray-500">Above 80%</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{summary.questionsBelow50 || 0}</p>
              <p className="text-xs text-gray-500">Below 50%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      {evaluations && evaluations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Question Analysis</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Q#
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question Text
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Answer (Full)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluations.map((evaluation, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {evaluation.questionNumber || index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-md">
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                          <p className="whitespace-pre-wrap break-words leading-relaxed font-medium">{evaluation.questionText || 'Question text not available'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="max-w-lg">
                        <div className="bg-gray-50 p-3 rounded-md border">
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{evaluation.studentAnswer || 'No answer provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-center">
                        <span className="text-lg font-bold text-blue-600">
                          {evaluation.obtainedMarks || 0}
                        </span>
                        <span className="text-gray-400">/{evaluation.maxMarks || 0}</span>
                        <div className="text-xs text-gray-500">
                          ({evaluation.percentage || 0}%)
                        </div>
                        {/* Score bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${
                              (evaluation.percentage || 0) >= 80 ? 'bg-green-500' :
                              (evaluation.percentage || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(evaluation.percentage || 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="max-w-md">
                        <p className="line-clamp-3">{evaluation.feedback || 'No feedback available'}</p>
                        
                        {/* Rubric breakdown */}
                        {evaluation.rubricScores && Object.keys(evaluation.rubricScores).length > 0 && (
                          <div className="mt-2">
                            <details className="group">
                              <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                                View Rubric Details
                              </summary>
                              <div className="mt-2 space-y-1">
                                {Object.entries(evaluation.rubricScores).map(([criterion, data]: [string, any]) => (
                                  <div key={criterion} className="text-xs bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{criterion}:</span> {data.score || 0}/{data.max_score || 0}
                                    <p className="text-gray-600 mt-1">{data.justification || 'No justification'}</p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Download Report */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
            <p className="text-sm text-gray-600 mt-1">Download a comprehensive evaluation report</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 flex items-center"
            onClick={() => {
              const blob = new Blob([detailedReport], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Evaluation_Report_${new Date().toISOString().split('T')[0]}.md`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationResults; 