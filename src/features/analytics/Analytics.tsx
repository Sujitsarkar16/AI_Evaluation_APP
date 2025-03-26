import React from 'react';
import { 
  Award, BookOpenCheck, Clock, TrendingUp, 
  LineChart, BarChart3, Wallet, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/Button';
import StatCard from '@/components/StatCard';

const Analytics = () => {
  // Analytics data for the Analytics page
  const gradeAnalytics = {
    semesterPerformance: [
      { semester: 'Fall 2021', gpa: 3.4 },
      { semester: 'Spring 2022', gpa: 3.6 },
      { semester: 'Fall 2022', gpa: 3.65 },
      { semester: 'Spring 2023', gpa: 3.8 },
      { semester: 'Fall 2023', gpa: 3.75 },
    ],
    subjectPerformance: [
      { subject: 'Computer Science', score: 90 },
      { subject: 'Mathematics', score: 85 },
      { subject: 'Physics', score: 78 },
      { subject: 'Data Structures', score: 92 },
      { subject: 'Algorithms', score: 88 },
    ],
    improvements: [
      { area: 'Consistency', percentage: 85 },
      { area: 'Participation', percentage: 72 },
      { area: 'Assignment Quality', percentage: 90 },
      { area: 'Test Performance', percentage: 82 },
    ]
  };

  // Current semester grades
  const grades = [
    { id: 1, course: "Web Programming", grade: "A", percentage: 92, comment: "Excellent work on the final project", instructor: "Dr. Emily Chen" },
    { id: 2, course: "Data Structures", grade: "B+", percentage: 87, comment: "Good understanding of complex algorithms", instructor: "Prof. Robert Kim" },
    { id: 3, course: "Artificial Intelligence", grade: "B", percentage: 83, comment: "Needs improvement in neural networks", instructor: "Dr. Sarah Johnson" }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Academic Performance Analytics</h2>
      
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Overall GPA" 
            value="3.75" 
            icon={Award} 
            iconColor="text-yellow-600" 
            iconBgColor="bg-yellow-100"
            trend="up"
            subtitle="+0.05 from last semester"
          />
          <StatCard 
            title="Completed Credits" 
            value="18" 
            icon={BookOpenCheck} 
            iconColor="text-blue-600" 
            iconBgColor="bg-blue-100"
            subtitle="Credit Hours"
          />
          <StatCard 
            title="In Progress Credits" 
            value="12" 
            icon={Clock} 
            iconColor="text-purple-600" 
            iconBgColor="bg-purple-100"
            subtitle="Credit Hours"
          />
          <StatCard 
            title="Overall Standing" 
            value="A-" 
            icon={TrendingUp} 
            iconColor="text-green-600" 
            iconBgColor="bg-green-100"
            trend="up"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">GPA Trend</h3>
              <div className="text-sm text-blue-600 flex items-center">
                <LineChart size={16} className="mr-1" /> 
                <span>Semester Performance</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between">
              {gradeAnalytics.semesterPerformance.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-16 mb-2 text-center">
                    <div 
                      className="bg-blue-500 rounded-t-lg mx-auto" 
                      style={{ 
                        height: `${(item.gpa / 4) * 200}px`, 
                        width: '30px'
                      }}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-gray-600">{item.semester}</div>
                  <div className="text-sm font-bold text-blue-600">{item.gpa}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Subject Performance</h3>
              <div className="text-sm text-purple-600 flex items-center">
                <BarChart3 size={16} className="mr-1" /> 
                <span>Subject Analysis</span>
              </div>
            </div>
            <div className="space-y-4">
              {gradeAnalytics.subjectPerformance.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                    <span className="text-sm font-medium text-gray-700">{subject.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        subject.score >= 90 ? 'bg-green-500' :
                        subject.score >= 80 ? 'bg-blue-500' :
                        subject.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${subject.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Current Semester Grades</h3>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Wallet className="mr-1 h-4 w-4" />
                See Transcript
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{grade.course}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${grade.grade === 'A' ? 'bg-green-100 text-green-800' :
                          grade.grade === 'B+' ? 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'}`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                            <div className={`h-2 rounded-full 
                              ${grade.percentage >= 90 ? 'bg-green-500' :
                              grade.percentage >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`} 
                              style={{width: `${grade.percentage}%`}}>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{grade.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{grade.instructor}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{grade.comment}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Improvement Areas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Areas for Growth</h4>
            {gradeAnalytics.improvements.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.area}</span>
                  <span className="text-sm font-medium text-gray-700">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-4">Recommendations</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="text-green-600 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Focus on neural network concepts in AI course to improve understanding.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-600 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Schedule weekly tutoring sessions for Data Structures to improve grade from B+ to A.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-600 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Continue excellent work in Web Programming course.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-green-600 mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Consider joining the AI student group for additional practice and networking.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 