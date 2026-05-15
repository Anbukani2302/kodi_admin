import React from 'react';
import { ShieldOff } from 'lucide-react';

interface PermissionDeniedProps {
  message?: string;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({ 
  message = "You do not have permission to access this page. Please contact your administrator." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
        <ShieldOff className="w-16 h-16 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Access Denied
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {message}
      </p>
    </div>
  );
};
