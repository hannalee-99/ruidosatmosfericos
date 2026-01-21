
import React, { useEffect } from 'react';
import { COLORS } from '../constants';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, isDarkMode }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div 
        className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest rounded border"
        style={{
          backgroundColor: isDarkMode ? COLORS.black : COLORS.white,
          color: isDarkMode ? COLORS.white : COLORS.black,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {message}
      </div>
    </div>
  );
};

export default Toast;
