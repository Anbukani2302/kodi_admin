import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface PermissionGrantedProps {
  message?: string;
}

export const PermissionGranted: React.FC<PermissionGrantedProps> = ({ 
  message = "Access granted. You have permission to access this page." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-full mb-6">
        <ShieldCheck className="w-16 h-16 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Access Granted
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        {message}
      </p>
    </div>
  );
};
