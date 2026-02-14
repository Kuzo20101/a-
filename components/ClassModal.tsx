import React, { useState, useEffect } from 'react';
import { ClassSession, DayOfWeek, ClassColor } from '../types';
import { COLORS, DAYS } from '../constants';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cls: Omit<ClassSession, 'id'>, id?: number) => void;
  onDelete: (id: number) => void;
  editingClass: ClassSession | null;
  defaultStartTime?: string;
  defaultDay?: DayOfWeek;
  defaultColor?: ClassColor;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingClass,
  defaultStartTime,
  defaultDay,
  defaultColor
}) => {
  const [name, setName] = useState('');
  const [day, setDay] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [teacher, setTeacher] = useState('');
  const [color, setColor] = useState<ClassColor>('blue');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Validate time range
  const isTimeValid = (() => {
    if (!startTime || !endTime) return false;
    const start = parseInt(startTime.replace(':', ''), 10);
    const end = parseInt(endTime.replace(':', ''), 10);
    return end > start;
  })();

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setDay(editingClass.day);
      setStartTime(editingClass.startTime);
      setEndTime(editingClass.endTime);
      setLocation(editingClass.location || '');
      setTeacher(editingClass.teacher || '');
      setColor(editingClass.color);
      setShowDeleteConfirm(false);
    } else {
      // New Class Logic
      setName('');
      setDay(defaultDay || 'monday');
      
      const start = defaultStartTime || '09:00';
      setStartTime(start);
      
      // Auto-calculate end time (start + 60 mins)
      const [h, m] = start.split(':').map(Number);
      // Simple hour wrap around logic
      const endH = (h + 1) % 24;
      // Format as HH:MM
      const endStr = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      setEndTime(endStr);
      
      setLocation('');
      setTeacher('');
      setColor(defaultColor || 'blue');
      setShowDeleteConfirm(false);
    }
  }, [editingClass, isOpen, defaultStartTime, defaultDay, defaultColor]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Prevent saving if time is invalid
    if (!isTimeValid) return;

    onSave({
      name: name.trim(),
      day,
      startTime,
      endTime,
      location: location.trim(),
      teacher: teacher.trim(),
      color
    }, editingClass?.id);
  };

  const handleConfirmDelete = () => {
    if (editingClass) {
      onDelete(editingClass.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] rounded-lg p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {showDeleteConfirm ? (
          <div className="flex flex-col items-center text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 text-3xl">
              !
            </div>
            <h3 className="text-2xl font-light mb-2 text-white">Delete Class?</h3>
            <p className="text-gray-400 mb-8 max-w-[280px]">
              Are you sure you want to delete this class?
            </p>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-[#333] text-white font-bold rounded hover:bg-[#454545] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-light mb-6 text-white">
              {editingClass ? 'Edit Class' : 'Add Class'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Class Name *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#333] border border-[#555] rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="e.g. Calculus II"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Day *</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as DayOfWeek)}
                  className="w-full bg-[#333] border border-[#555] rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Start Time *</label>
                    <input
                      required
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#333] border border-[#555] rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">End Time *</label>
                    <input
                      required
                      type="time"
                      min={startTime}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`w-full bg-[#333] border rounded px-4 py-3 text-white focus:outline-none transition-colors ${
                        !isTimeValid 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-[#555] focus:border-white'
                      }`}
                    />
                  </div>
                </div>
                {!isTimeValid && (
                  <p className="text-red-500 text-xs">End time must be after start time</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#333] border border-[#555] rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="Room 101"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Teacher</label>
                  <input
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    className="w-full bg-[#333] border border-[#555] rounded px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                    placeholder="Dr. Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {(Object.keys(COLORS) as ClassColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`
                        w-full aspect-square rounded-md transition-all duration-200 border-2
                        ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}
                      `}
                      style={{ background: COLORS[c] }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-[#333] text-white font-bold rounded hover:bg-[#454545] transition-colors"
                >
                  Cancel
                </button>
                {editingClass && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!isTimeValid}
                  className={`flex-1 px-4 py-3 bg-white text-black font-bold rounded transition-colors ${
                    !isTimeValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                  }`}
                >
                  Save
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};