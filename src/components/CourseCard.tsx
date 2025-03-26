
import React from 'react';
import { Button } from '@/components/Button';

interface CourseCardProps {
  name: string;
  score: string;
  progress: number;
  instructor: string;
}

const CourseCard = ({ name, score, progress, instructor }: CourseCardProps) => {
  return (
    <div className="bg-gray-50 rounded-xl shadow-sm p-6 transition-transform hover:scale-105">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
        <div className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
          {score}
        </div>
      </div>
      
      <p className="text-gray-600 mb-4">Instructor: {instructor}</p>
      
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-gray-600">Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <Button className="w-full mt-2 bg-blue-600 hover:bg-blue-700">
        View Class
      </Button>
    </div>
  );
};

export default CourseCard;
