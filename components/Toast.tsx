import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';
import { X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`
        flex items-center gap-4 min-w-[320px] max-w-[400px] px-6 py-4 mb-4 rounded bg-[#323232] text-white shadow-2xl
        transform transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}
      `}
      role="alert"
    >
      <span className="flex-1 text-[15px] tracking-wide font-normal">{toast.message}</span>
      <button 
        onClick={handleDismiss} 
        className="text-[#a8a8a8] hover:text-white transition-colors p-1 -mr-2 rounded-full hover:bg-white/10"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-0 left-6 z-[100] flex flex-col-reverse items-start pointer-events-none pb-6">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};