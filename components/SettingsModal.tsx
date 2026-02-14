import React, { useState, useRef, useEffect } from 'react';
import { X, Moon, Sun, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: 'dark' | 'light';
  currentLanguage: string;
  onThemeChange: (theme: 'dark' | 'light') => void;
  onLanguageChange: (language: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  currentLanguage,
  onThemeChange,
  onLanguageChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startDragXRef = useRef<number>(0);
  const isClickRef = useRef<boolean>(true);
  
  const isLight = currentTheme === 'light';
  
  // Max travel distance calculation:
  // Track Width (64px) - Borders (2px) - Padding (4px * 2) - Knob (24px) = 30px
  // Using 30px ensures symmetric 4px padding on both sides.
  const MAX_DRAG = 30;

  // Determine visual state based on drag position or actual theme
  const effectiveIsLight = isDragging ? dragX > MAX_DRAG / 2 : isLight;

  // Sync dragX with theme when not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragX(isLight ? MAX_DRAG : 0);
    }
  }, [isLight, isDragging, MAX_DRAG]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    isClickRef.current = true;
    startXRef.current = e.clientX;
    startDragXRef.current = dragX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      // If moved more than 2px, treat as drag, not click
      if (Math.abs(e.clientX - startXRef.current) > 2) {
        isClickRef.current = false;
      }
      
      const delta = e.clientX - startXRef.current;
      const newPos = startDragXRef.current + delta;
      const clamped = Math.max(0, Math.min(MAX_DRAG, newPos));
      setDragX(clamped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      
      if (isClickRef.current) {
        // Simple click toggle
        onThemeChange(isLight ? 'dark' : 'light');
      } else {
        // Drag release snap
        if (dragX > MAX_DRAG / 2) {
          onThemeChange('light');
        } else {
          onThemeChange('dark');
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative border border-gray-800 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          {/* Appearance Slider */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
               Appearance
            </label>
            
            <div 
              className="flex items-center justify-between bg-[#2a2a2a] p-4 rounded-lg hover:bg-[#333] transition-colors"
            >
                <span 
                    className="text-white font-medium cursor-pointer"
                    onClick={() => onThemeChange(isLight ? 'dark' : 'light')}
                >
                    {isLight ? 'Light Mode' : 'Dark Mode'}
                </span>

                <div
                    ref={trackRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className={`
                        relative w-16 h-8 rounded-full transition-colors duration-300 ease-in-out cursor-pointer touch-none
                        ${effectiveIsLight ? 'bg-sky-200' : 'bg-indigo-900/60'}
                        border ${effectiveIsLight ? 'border-sky-300' : 'border-indigo-500/50'}
                    `}
                >
                    <div
                        className="absolute top-1/2 left-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-none"
                        style={{
                            transform: `translateY(-50%) translateX(${dragX}px)`,
                            transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                    >
                         <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                            <Sun 
                                size={14} 
                                className={`absolute transition-all duration-500 text-amber-500 ${
                                    effectiveIsLight ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                                }`} 
                            />
                            <Moon 
                                size={14} 
                                className={`absolute transition-all duration-500 text-indigo-600 ${
                                    !effectiveIsLight ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
                                }`} 
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              <Globe size={16} /> Language
            </label>
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-transparent text-white rounded-lg p-3 focus:border-white focus:outline-none transition-colors appearance-none cursor-pointer hover:bg-[#333]"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Globe size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors"
          >
             Done
          </button>
        </div>
      </div>
    </div>
  );
};