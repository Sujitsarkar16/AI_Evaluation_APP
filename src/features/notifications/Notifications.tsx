import React from 'react';
import { CheckCircle, AlertCircle, PlusCircle, Bell } from 'lucide-react';
import { Button } from '@/components/Button';

const Notifications = () => {
  const notifications = [
    { id: 1, type: "success", text: "Quiz submission successful!", details: "Yesterday", icon: CheckCircle },
    { id: 2, type: "error", text: "Assignment overdue by 2 days", details: "23 June 2023", icon: AlertCircle },
    { id: 3, type: "info", text: "New course materials available", details: "28 May 2023", icon: PlusCircle },
    { id: 4, type: "success", text: "Grade updated in Data Structures", details: "15 May 2023", icon: CheckCircle },
    { id: 5, type: "info", text: "New announcement from Prof. Robert Kim", details: "10 May 2023", icon: PlusCircle },
    { id: 6, type: "error", text: "Missing attendance for Web Programming", details: "5 May 2023", icon: AlertCircle },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>
        <Button variant="outline" size="sm" className="flex items-center">
          <Bell className="mr-2 h-4 w-4" />
          Mark All as Read
        </Button>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
        <p className="text-blue-600">You have {notifications.filter(n => n.type === "error").length} unread important notifications</p>
      </div>
      
      <div className="divide-y">
        {notifications.map((notification) => (
          <div key={notification.id} className="py-4 flex items-start">
            <div className={`p-2 rounded-lg mr-4 ${
              notification.type === 'success' ? 'bg-green-100' : 
              notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <notification.icon size={20} className={`${
                notification.type === 'success' ? 'text-green-600' : 
                notification.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium text-gray-800">{notification.text}</p>
                <p className="text-sm text-gray-500">{notification.details}</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {notification.type === 'error' && "Action required: Please address this as soon as possible."}
                {notification.type === 'success' && "No action needed: This notification is for your information."}
                {notification.type === 'info' && "Optional: You can check this when convenient."}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button variant="outline">
          Load More
        </Button>
      </div>
    </div>
  );
};

export default Notifications; 