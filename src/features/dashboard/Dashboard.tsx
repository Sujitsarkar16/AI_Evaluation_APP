import React, { useState, useEffect } from 'react';
import { 
  BarChart3, FileText, Settings, LogOut, 
  Users, Bell, BookOpen, User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Outlet } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const userData = {
    name: "Sujit Sarkar",
    role: "Educator"
  };
  
  const sidebarItems = [
    { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
    { icon: FileText, label: "Evaluation", path: "/dashboard/evaluations" },
    { icon: BookOpen, label: "Question Paper", path: "/dashboard/question-papers" },
    { icon: Users, label: "Assessment Management", path: "/dashboard/access" },
    { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" }
  ];
  
  const [activePage, setActivePage] = useState('analytics');
  
  // Redirect to analytics if on dashboard root
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') {
      navigate('/dashboard/analytics', { replace: true });
      setActivePage('analytics');
    } else {
      const page = path.split('/').pop();
      if (page) {
        setActivePage(page);
      }
    }
  }, [navigate]);
  
  const handleNavigation = (path) => {
    const page = path.split('/').pop();
    setActivePage(page);
  };

  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('selectedQuestionPaperId');
    localStorage.removeItem('defaultEvaluationType');
    
    // Show success message
    toast({
      title: "Logged out successfully",
      description: "You have been safely logged out of your account.",
    });
    
    // Redirect to home page
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 bg-white border-r border-gray-200 p-6 shadow-sm h-screen overflow-y-auto z-10">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-gray-900">LMS Platform</h1>
          <p className="text-sm text-gray-500">Educator Dashboard</p>
        </div>
        
        <nav className="space-y-1 flex-1">
          {sidebarItems.map((item, index) => (
            <Link 
              key={index}
              to={item.path} 
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                activePage === item.path.split('/').pop()
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar with User Profile */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-5">
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{userData.name}</h3>
                <p className="text-xs text-gray-500">{userData.role}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 