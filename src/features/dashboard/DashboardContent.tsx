import React from 'react';
import { Activity, Award, CheckCircle, Bell, PlusCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import StatCard from '@/components/StatCard';

const DashboardContent = () => {
  const userData = {
    name: "Alex Johnson",
    role: "Computer Science Student"
  };
  
  const statistics = {
    attendance: 90,
    tasks: 70,
    quiz: 85,
    gradesCompleted: 75
  };
  
  const todoItems = [
    { id: 1, text: "Complete AI assignment", date: "Tuesday, 15 June 2023", completed: true },
    { id: 2, text: "Submit project proposal", date: "Monday, 20 June 2023", completed: false },
    { id: 3, text: "Prepare for final exam", date: "Friday, 25 June 2023", completed: false }
  ];
  
  const notifications = [
    { id: 1, type: "success", text: "Quiz submission successful!", details: "Yesterday", icon: CheckCircle },
    { id: 2, type: "error", text: "Assignment overdue by 2 days", details: "23 June 2023", icon: AlertCircle },
    { id: 3, type: "info", text: "New course materials available", details: "28 May 2023", icon: PlusCircle }
  ];
  
  const courses = [
    { id: 1, name: "Web Programming", progress: 75, score: "8/10", instructor: "Dr. Emily Chen" },
    { id: 2, name: "Data Structures", progress: 65, score: "7/10", instructor: "Prof. Robert Kim" },
    { id: 3, name: "Artificial Intelligence", progress: 40, score: "6/10", instructor: "Dr. Sarah Johnson" },
    { id: 4, name: "Database Systems", progress: 90, score: "9/10", instructor: "Prof. Michael Lee" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Welcome Card */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome back, {userData.name}!</h1>
            <p className="text-gray-600 mt-2">Here's what's happening with your courses today.</p>
          </div>
          <Button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700">View Calendar</Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Attendance</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{statistics.attendance}%</p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="text-green-600" size={24} />
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${statistics.attendance}%` }}
          ></div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Tasks Completed</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{statistics.tasks}%</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full" 
            style={{ width: `${statistics.tasks}%` }}
          ></div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Quiz Performance</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">{statistics.quiz}%</p>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Award className="text-purple-600" size={24} />
          </div>
        </div>
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-500 h-2 rounded-full" 
            style={{ width: `${statistics.quiz}%` }}
          ></div>
        </div>
      </div>
      
      {/* Course Progress */}
      <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Course Progress</h2>
          <Link to="/dashboard/classes" className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="space-y-6">
          {courses.slice(0, 3).map((course) => (
            <div key={course.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-gray-800">{course.name}</h3>
                <span className="text-sm font-medium text-blue-600">{course.score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">Instructor: {course.instructor}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Notifications */}
      <div className="col-span-1 bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
          <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full">New</span>
        </div>
        <div className="divide-y">
          {notifications.map((notification) => (
            <div key={notification.id} className="py-3 flex items-start">
              <div className={`p-1.5 rounded-lg mr-3 ${
                notification.type === 'success' ? 'bg-green-100' : 
                notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <notification.icon size={16} className={`${
                  notification.type === 'success' ? 'text-green-600' : 
                  notification.type === 'error' ? 'text-red-600' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{notification.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{notification.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent; 