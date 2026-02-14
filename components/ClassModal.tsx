import React, { useState, useEffect } from 'react';
import { ClassSession, DayOfWeek, ClassColor } from '../types';
import { COLORS, DAYS } from '../constants';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cls: Omit<ClassSession, 'id'>, id?: number) => void;
  onDelete: (id: number) => void;
  editingClass: ClassSession | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingClass,
}) => {
  const [name, setName] = useState('');
  const [day, setDay] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [teacher, setTeacher] = useState('');
  const [color, setColor] = useState<ClassColor>('blue');

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
    } else {
      setName('');
      setDay('monday');
      setStartTime('09:00');
      setEndTime('10:30');
      setLocation('');
      setTeacher('');
      setColor('blue');
    }
  }, [editingClass, isOpen]);

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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-800">
        <h2 className="text-3xl font-light mb-6 text-white">
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
                onClick={() => onDelete(editingClass.id)}
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
      </div>
    </div>
  );
};