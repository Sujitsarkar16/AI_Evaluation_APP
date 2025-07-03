import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, RefreshCw, Download, FileText, Calendar, User, Award } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Evaluation {
  _id: string;
  student_id: string;
  student_name?: string;
  question_paper_id: string;
  evaluations: any[];
  summary: {
    grade: string;
    overallPercentage: number;
    totalObtained: number;
    totalMaxMarks: number;
    questionsEvaluated: number;
  };
  evaluation_type: string;
  status: string;
  created_at: string;
  original_filename?: string;
  ocr_text?: string;
}

const AccessManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterGrade, setFilterGrade] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/evaluate`, {
        params: { limit: 100, skip: 0 }
      });
      
      if (response.data.success) {
        setEvaluations(response.data.evaluations || []);
      } else {
        throw new Error('Failed to fetch evaluations');
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      setError('Failed to load evaluations. Please try again.');
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm('Are you sure you want to delete this evaluation? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/evaluate/${evaluationId}`);
      setEvaluations(prev => prev.filter(evaluation => evaluation._id !== evaluationId));
      
      if (selectedEvaluation?._id === evaluationId) {
        setSelectedEvaluation(null);
        setShowDetails(false);
      }
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      alert('Failed to delete evaluation. Please try again.');
    }
  };

  const handleViewEvaluation = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowDetails(true);
  };

  const handleReEvaluate = (evaluation: Evaluation) => {
    if (evaluation.question_paper_id && evaluation.question_paper_id !== 'manual') {
      localStorage.setItem('selectedQuestionPaperId', evaluation.question_paper_id);
    }
    window.location.href = '/dashboard/evaluations';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100';
      case 'B':
        return 'text-blue-600 bg-blue-100';
      case 'C':
        return 'text-yellow-600 bg-yellow-100';
      case 'D':
        return 'text-orange-600 bg-orange-100';
      case 'F':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = evaluation.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = filterGrade === 'all' || evaluation.summary?.grade === filterGrade;
    
    const now = new Date();
    const evalDate = new Date(evaluation.created_at);
    const daysDiff = Math.floor((now.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (activeTab === 'recent') return matchesSearch && matchesGrade && daysDiff <= 7;
    if (activeTab === 'high-scores') return matchesSearch && matchesGrade && evaluation.summary?.overallPercentage >= 80;
    if (activeTab === 'needs-review') return matchesSearch && matchesGrade && evaluation.summary?.overallPercentage < 60;
    
    return matchesSearch && matchesGrade;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'highest-score':
        return (b.summary?.overallPercentage || 0) - (a.summary?.overallPercentage || 0);
      case 'lowest-score':
        return (a.summary?.overallPercentage || 0) - (b.summary?.overallPercentage || 0);
      case 'student-name':
        return (a.student_name || 'Anonymous').localeCompare(b.student_name || 'Anonymous');
      default:
        return 0;
    }
  });

  const downloadEvaluationReport = (evaluation: Evaluation) => {
    const reportContent = [
      '# ASSESSMENT REPORT',
      '',
      `**Student:** ${evaluation.student_name || 'Anonymous'}`,
      `**Evaluation ID:** ${evaluation._id}`,
      `**Date:** ${formatDate(evaluation.created_at)}`,
      `**Document:** ${evaluation.original_filename || 'N/A'}`,
      '',
      '## PERFORMANCE SUMMARY',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| **Overall Grade** | ${evaluation.summary?.grade || 'N/A'} |`,
      `| **Total Score** | ${evaluation.summary?.totalObtained || 0}/${evaluation.summary?.totalMaxMarks || 0} (${evaluation.summary?.overallPercentage?.toFixed(1) || 0}%) |`,
      `| **Questions Evaluated** | ${evaluation.summary?.questionsEvaluated || 0} |`,
      '',
      '## DETAILED EVALUATION',
      ''
    ];

    if (evaluation.evaluations && evaluation.evaluations.length > 0) {
      evaluation.evaluations.forEach((evalItem, index) => {
        reportContent.push(`### Question ${evalItem.questionNumber || index + 1}`);
        reportContent.push('');
        reportContent.push('| Field | Details |');
        reportContent.push('|-------|---------|');
        reportContent.push(`| **Question** | ${evalItem.questionText || 'N/A'} |`);
        reportContent.push(`| **Student Answer** | ${evalItem.studentAnswer || 'No answer provided'} |`);
        reportContent.push(`| **Score** | ${evalItem.obtainedMarks || 0}/${evalItem.maxMarks || 0} (${evalItem.percentage || 0}%) |`);
        reportContent.push(`| **Feedback** | ${evalItem.feedback || 'No feedback available'} |`);
        reportContent.push('');
        reportContent.push('---');
        reportContent.push('');
      });
    } else {
      reportContent.push('No detailed evaluation data available.');
    }

    const blob = new Blob([reportContent.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Assessment_Report_${evaluation._id.slice(-6)}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (showDetails && selectedEvaluation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Assessment Details</h1>
          <Button
            variant="outline"
            onClick={() => setShowDetails(false)}
            className="flex items-center"
          >
            ← Back to List
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Assessment Report</h2>
                <p className="text-sm text-gray-500">Detailed evaluation results</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGradeColor(selectedEvaluation.summary?.grade || 'N/A')}`}>
                  Grade: {selectedEvaluation.summary?.grade || 'N/A'}
                </span>
                <Button
                  onClick={() => downloadEvaluationReport(selectedEvaluation)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              <div>
                <span className="font-medium text-gray-700">Student:</span>
                <p className="text-gray-600">{selectedEvaluation.student_name || 'Anonymous'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <p className="text-gray-600">{formatDate(selectedEvaluation.created_at)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Document:</span>
                <p className="text-gray-600">{selectedEvaluation.original_filename || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Score:</span>
                <p className="text-gray-600">{selectedEvaluation.summary?.overallPercentage?.toFixed(1) || 0}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-sm font-medium text-gray-700 mb-1">Grade</h3>
                <p className="text-2xl font-bold text-blue-600">{selectedEvaluation.summary?.grade || 'N/A'}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Score</h3>
                <p className="text-2xl font-bold text-green-600">{selectedEvaluation.summary?.overallPercentage?.toFixed(1) || 0}%</p>
                <p className="text-xs text-gray-500">{selectedEvaluation.summary?.totalObtained || 0}/{selectedEvaluation.summary?.totalMaxMarks || 0} marks</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Questions</h3>
                <p className="text-2xl font-bold text-purple-600">{selectedEvaluation.summary?.questionsEvaluated || 0}</p>
              </div>
            </div>

            {selectedEvaluation.evaluations && selectedEvaluation.evaluations.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Q#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedEvaluation.evaluations.map((evaluation, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {evaluation.questionNumber || index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="max-w-md">
                            <p className="line-clamp-2">{evaluation.questionText || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center">
                            <span className="font-medium text-blue-600">
                              {evaluation.obtainedMarks || 0}/{evaluation.maxMarks || 0}
                            </span>
                            <span className="ml-2 text-gray-500">({evaluation.percentage || 0}%)</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="max-w-sm">
                            <p className="line-clamp-2">{evaluation.feedback || 'No feedback'}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Management</h1>
          <p className="text-gray-600">View, manage, and analyze completed evaluations</p>
        </div>
        <Button 
          onClick={fetchEvaluations}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Assessments</h3>
          <p className="text-2xl font-bold text-gray-900">{evaluations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">High Performers (≥80%)</h3>
          <p className="text-2xl font-bold text-green-600">
            {evaluations.filter(e => (e.summary?.overallPercentage || 0) >= 80).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Need Review (&lt;60%)</h3>
          <p className="text-2xl font-bold text-red-600">
            {evaluations.filter(e => (e.summary?.overallPercentage || 0) < 60).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">This Week</h3>
          <p className="text-2xl font-bold text-blue-600">
            {evaluations.filter(e => {
              const now = new Date();
              const evalDate = new Date(e.created_at);
              const daysDiff = Math.floor((now.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24));
              return daysDiff <= 7;
            }).length}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'All Assessments' },
            { id: 'recent', label: 'Recent (7 days)' },
            { id: 'high-scores', label: 'High Scores (≥80%)' },
            { id: 'needs-review', label: 'Needs Review (&lt;60%)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by student name, file name, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select 
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Grades</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest-score">Highest Score</option>
            <option value="lowest-score">Lowest Score</option>
            <option value="student-name">Student Name</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assessments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchEvaluations} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : filteredEvaluations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student & Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade & Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvaluations.map((evaluation) => (
                  <tr key={evaluation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {evaluation.student_name || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {evaluation.original_filename || 'Unknown file'}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {evaluation._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(evaluation.summary?.grade || 'N/A')}`}>
                          {evaluation.summary?.grade || 'N/A'}
                        </span>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {evaluation.summary?.overallPercentage?.toFixed(1) || 0}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {evaluation.summary?.totalObtained || 0}/{evaluation.summary?.totalMaxMarks || 0}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                        {formatDate(evaluation.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
                        {evaluation.summary?.questionsEvaluated || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewEvaluation(evaluation)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => downloadEvaluationReport(evaluation)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleReEvaluate(evaluation)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteEvaluation(evaluation._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 
                'No assessments match your search criteria. Try adjusting your filters.' :
                'No evaluations have been completed yet.'
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/evaluations'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start New Evaluation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessManagement; 