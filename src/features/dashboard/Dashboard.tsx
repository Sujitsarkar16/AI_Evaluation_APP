import React, { useState, useEffect } from 'react';
import { 
  Brain, Calendar, FileText, Home, LogOut, 
  Settings, User, Users, Bell, Book, 
  BarChart3, 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import DashboardContent from './DashboardContent';
import { Outlet } from 'react-router-dom';

const Dashboard = () => {
  const userData = {
    name: "Alex Johnson",
    role: "Computer Science Student"
  };
  
  const sidebarItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard", active: true },
    { icon: FileText, label: "Classes", path: "/dashboard/classes" },
    { icon: User, label: "Evaluations", path: "/dashboard/evaluations" },
    { icon: Users, label: "Agents", path: "/dashboard/agents" },
    { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
    { icon: Book, label: "Question Papers", path: "/dashboard/question-papers" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    { icon: LogOut, label: "Log Out", path: "/login" }
  ];
  
  const [activePage, setActivePage] = useState('dashboard');
  
  // Get the current route and set active page accordingly
  useEffect(() => {
    const path = window.location.pathname;
    const page = path.split('/').pop();
    if (page) {
      setActivePage(page);
    }
  }, []);
  
  const handleNavigation = (path) => {
    const page = path.split('/').pop();
    setActivePage(page);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white p-4 shadow-lg h-screen overflow-y-auto">
        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-3 overflow-hidden">
            <img src="/lovable-uploads/3fbe7276-adea-47ae-a582-f65b777fa7da.png" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-lg font-semibold">{userData.name}</h2>
          <p className="text-blue-200 text-sm">{userData.role}</p>
        </div>
        
        <nav className="mt-8">
          <ul className="space-y-2">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path} 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active || activePage === item.path.split('/').pop()
                      ? 'bg-white/20 text-white' 
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full md:w-96">
            <Input 
              type="text" 
              placeholder="Search anything" 
              className="pl-10 pr-4 py-2 bg-white rounded-full border border-blue-100 shadow-sm focus:border-blue-300"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link to="/settings" className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
              <img src="/lovable-uploads/3fbe7276-adea-47ae-a582-f65b777fa7da.png" alt="Profile" className="w-full h-full object-cover" />
            </Link>
          </div>
        </div>
        
        {activePage === 'dashboard' ? (
          <DashboardContent />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};

export default Dashboard; 