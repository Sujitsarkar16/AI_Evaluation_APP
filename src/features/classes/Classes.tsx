import React from 'react';
import { Button } from '@/components/Button';

const Classes = () => {
  const courses = [
    { id: 1, name: "Web Programming", progress: 75, score: "8/10", instructor: "Dr. Emily Chen" },
    { id: 2, name: "Data Structures", progress: 65, score: "7/10", instructor: "Prof. Robert Kim" },
    { id: 3, name: "Artificial Intelligence", progress: 40, score: "6/10", instructor: "Dr. Sarah Johnson" },
    { id: 4, name: "Database Systems", progress: 90, score: "9/10", instructor: "Prof. Michael Lee" }
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Classes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-gray-50 rounded-xl shadow-sm p-6 transition-transform hover:scale-105">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{course.name}</h3>
              <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
                {course.score}
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">Instructor: {course.instructor}</p>
            
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{course.progress}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
            
            <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
              View Class
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classes; 