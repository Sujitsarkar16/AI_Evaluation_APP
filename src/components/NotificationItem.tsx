
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NotificationItemProps {
  type: 'success' | 'error' | 'info';
  text: string;
  details: string;
  icon: LucideIcon;
}

const NotificationItem = ({ type, text, details, icon: Icon }: NotificationItemProps) => {
  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-100';
      case 'error': return 'bg-red-100';
      case 'info': 
      default: return 'bg-blue-100';
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'info':
      default: return 'text-blue-600';
    }
  };
  
  return (
    <div className="py-3 flex items-start">
      <div className={`p-1.5 rounded-lg mr-3 ${getBgColor()}`}>
        <Icon size={16} className={getTextColor()} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{text}</p>
        <p className="text-xs text-gray-500 mt-0.5">{details}</p>
      </div>
    </div>
  );
};

export default NotificationItem;
