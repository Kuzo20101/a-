import React from 'react';
import { Profile, ClassSession } from '../types';
import { ArrowLeft, Plus } from 'lucide-react';
import { DAYS, TIME_SLOTS, COLORS, PROFILE_THEMES } from '../constants';

interface ScheduleViewProps {
  profile: Profile;
  classes: ClassSession[];
  onBack: () => void;
  onAddClass: () => void;
  onEditClass: (cls: ClassSession) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ 
  profile, 
  classes, 
  onBack, 
  onAddClass,
  onEditClass 
}) => {
  
  // Helper to calculate position percentages
  const getPositionStyles = (startTime: string, endTime: string) => {
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const dayStartMinutes = 8 * 60; // 8:00 AM
    const totalMinutes = 14 * 60;   // 14 hours range

    const left = ((startMinutes - dayStartMinutes) / totalMinutes) * 100;
    const width = ((endMinutes - startMinutes) / totalMinutes) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  const themeGradient = PROFILE_THEMES[profile.theme || 'classic'];

  return (
    <div className="min-h-screen bg-white text-black animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-[#141414] text-white px-4 md:px-10 py-5 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="hover:scale-110 transition-transform p-2 -ml-2 rounded-full hover:bg-white/10"
            title="Switch Profile"
          >
            <ArrowLeft size={28} />
          </button>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded flex items-center justify-center text-xl"
              style={{ background: themeGradient }}
            >
              {profile.emoji}
            </div>
            <span className="text-xl font-medium hidden sm:inline">{profile.name}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div 
        className="text-white px-4 md:px-10 py-12 transition-all duration-500"
        style={{ background: themeGradient }}
      >
        <h1 className="text-4xl font-bold mb-2">📚 Class Schedule</h1>
        <p className="opacity-90">Your weekly timetable at a glance</p>
      </div>

      {/* Grid Container */}
      <div className="p-4 md:p-6 overflow-x-auto">
        <div className="min-w-[1400px]">
          {/* Time Header */}
          <div className="grid grid-cols-[100px_1fr] border-b border-gray-200 pb-2 mb-2 sticky left-0">
            <div></div>
            <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] text-xs font-semibold text-gray-500">
              {TIME_SLOTS.map((time, i) => (
                <div key={i} className="px-1 border-l border-gray-200 h-full flex items-end pb-2 relative">
                  <span className="translate-x-[-50%] pl-2">{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Days */}
          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayClasses = classes.filter(c => c.day === day);
              
              return (
                <div key={day} className="grid grid-cols-[100px_1fr] min-h-[120px]">
                  {/* Day Label */}
                  <div className="flex items-center justify-end pr-6 font-bold text-gray-700 bg-gray-50 rounded-l-lg text-lg capitalize border-y border-l border-gray-100">
                    {day}
                  </div>

                  {/* Timeline */}
                  <div className="relative bg-white border border-gray-200 rounded-r-lg">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-[repeat(14,minmax(0,1fr))] pointer-events-none">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="border-l border-gray-100 h-full"></div>
                      ))}
                    </div>

                    {/* Class Blocks */}
                    {dayClasses.map((cls) => {
                      const style = getPositionStyles(cls.startTime, cls.endTime);
                      
                      return (
                        <div
                          key={cls.id}
                          onClick={() => onEditClass(cls)}
                          className="absolute top-1 bottom-1 p-2 rounded-md shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md hover:z-20 transition-all overflow-hidden flex flex-col justify-center text-white z-10 animate-in fade-in zoom-in-95 duration-300"
                          style={{ 
                            ...style, 
                            background: COLORS[cls.color],
                            color: ['yellow', 'green', 'orange', 'purple'].includes(cls.color) ? 'black' : 'white'
                          }}
                        >
                          <div className="font-bold text-sm leading-tight truncate">{cls.name}</div>
                          <div className="text-[10px] opacity-90 truncate font-medium">
                            {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                          </div>
                          {cls.location && <div className="text-[10px] opacity-80 truncate">📍 {cls.location}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={onAddClass}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg shadow-indigo-500/40 text-white flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all z-40"
        style={{ background: themeGradient }}
      >
        <Plus />
      </button>
    </div>
  );
};