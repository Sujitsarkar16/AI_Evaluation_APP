import React from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

const Settings = () => {
  const userData = {
    name: "Alex Johnson",
    role: "Computer Science Student",
    email: "alex.johnson@example.com",
    studentId: "STU20231234"
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h2>
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Profile Settings</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4 sm:mb-0 sm:mr-6 overflow-hidden">
                <img src="/lovable-uploads/3fbe7276-adea-47ae-a582-f65b777fa7da.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="text-xl font-medium text-gray-800">{userData.name}</h4>
                <p className="text-gray-600">{userData.role}</p>
                <Button variant="outline" className="mt-2">
                  Change Profile Photo
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input 
                  type="text" 
                  defaultValue="Alex" 
                  className="w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input 
                  type="text" 
                  defaultValue="Johnson" 
                  className="w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input 
                  type="email" 
                  defaultValue={userData.email} 
                  className="w-full" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student ID
                </label>
                <Input 
                  type="text" 
                  defaultValue={userData.studentId} 
                  className="w-full" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Settings</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="divide-y">
              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive email updates about your courses</p>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                  <input type="checkbox" id="email-toggle" className="sr-only" defaultChecked />
                  <span className="absolute inset-0 rounded-full transition duration-200 ease-in-out bg-blue-600"></span>
                  <span className="absolute inset-y-0 left-0 w-6 h-6 bg-white rounded-full shadow transform transition duration-200 ease-in-out translate-x-6"></span>
                </div>
              </div>
              
              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive text messages for urgent updates</p>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                  <input type="checkbox" id="sms-toggle" className="sr-only" />
                  <span className="absolute inset-0 rounded-full transition duration-200 ease-in-out"></span>
                  <span className="absolute inset-y-0 left-0 w-6 h-6 bg-white rounded-full shadow transform transition duration-200 ease-in-out"></span>
                </div>
              </div>
              
              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">Assignment Reminders</p>
                  <p className="text-sm text-gray-500">Get notified about upcoming due dates</p>
                </div>
                <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                  <input type="checkbox" id="assignment-toggle" className="sr-only" defaultChecked />
                  <span className="absolute inset-0 rounded-full transition duration-200 ease-in-out bg-blue-600"></span>
                  <span className="absolute inset-y-0 left-0 w-6 h-6 bg-white rounded-full shadow transform transition duration-200 ease-in-out translate-x-6"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Security Settings</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="mb-6">
              <Button variant="outline" className="w-full sm:w-auto">
                Change Password
              </Button>
            </div>
            
            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                <input type="checkbox" id="tfa-toggle" className="sr-only" />
                <span className="absolute inset-0 rounded-full transition duration-200 ease-in-out"></span>
                <span className="absolute inset-y-0 left-0 w-6 h-6 bg-white rounded-full shadow transform transition duration-200 ease-in-out"></span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" className="mr-4">
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 