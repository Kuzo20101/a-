import React, { useEffect, useState, useRef } from 'react';
import { ToastMessage } from '../types';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismissRef.current(), 200); 
    }, 4000); // Increased duration to 4s for better readability

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismissRef.current();
    }, 200);
  };

  return (
    <div
      className={`
        flex items-center gap-4 min-w-[300px] max-w-[400px] pl-4 pr-2 py-3 mb-3 rounded-lg 
        bg-[#1f1f1f] text-white shadow-xl border border-white/5
        transform transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) font-roboto
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
      `}
      role="alert"
    >
      <div className="flex-1 text-[14px] font-normal tracking-wide text-gray-100">
        {toast.message}
      </div>
      
      {/* Google style often uses capitalized colored text for action, here we just use dismiss X or Type indicator if needed */}
      <div className="flex items-center border-l border-white/10 pl-2 ml-2">
         <button 
          onClick={handleDismiss} 
          className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};