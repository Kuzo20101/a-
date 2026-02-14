import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Profile, ClassSession, DayOfWeek, ClassColor } from '../types';
import { ArrowLeft, Plus, MapPin, User, Clock, Calendar, Edit, X, ExternalLink } from 'lucide-react';
import { DAYS, TIME_SLOTS, COLORS, PROFILE_THEMES } from '../constants';

interface ScheduleViewProps {
  profile: Profile;
  classes: ClassSession[];
  onBack: () => void;
  onAddClass: () => void;
  onEditClass: (cls: ClassSession) => void;
  onMoveClass: (id: number, day: DayOfWeek, startTime: string, endTime: string) => void;
  theme: 'dark' | 'light';
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ 
  profile, 
  classes, 
  onBack, 
  onAddClass,
  onEditClass,
  onMoveClass,
  theme
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    data: ClassSession;
    x: number;
    y: number;
  } | null>(null);

  // Drag State (Move)
  const [dragState, setDragState] = useState<{
    id: number;
    originalClass: ClassSession;
    offsetMinutes: number; // Offset of mouse from start of block in minutes
  } | null>(null);

  const [dragPreview, setDragPreview] = useState<{
    day: DayOfWeek;
    startTime: string; // HH:MM
  } | null>(null);

  // Resize State
  const [resizingClass, setResizingClass] = useState<{
    id: number;
    edge: 'start' | 'end';
    startMinutes: number;
    endMinutes: number;
  } | null>(null);

  // Refs for resizing (to avoid stale closures in event listeners)
  const resizingRef = useRef<{
    id: number;
    edge: 'start' | 'end';
    initialX: number;
    initialStart: number;
    initialEnd: number;
    pixelsPerMinute: number;
  } | null>(null);

  // Ref to ignore click immediately after resize
  const justResizedRef = useRef(false);

  const onMoveClassRef = useRef(onMoveClass);
  useEffect(() => { onMoveClassRef.current = onMoveClass; }, [onMoveClass]);

  const isDark = theme === 'dark';
  
  useEffect(() => {
    // Set formatted date on mount
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  // Time conversion helper
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Helper to calculate position percentages
  const getPositionStyles = (startTime: string, endTime: string) => {
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
  
  // Compact formatter for tight spaces
  const formatTimeCompact = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'p' : 'a';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m}${ampm}`;
  };

  // Improved Logic to handle overlapping classes with clustering
  const getOverlapData = (dayClasses: ClassSession[]) => {
    // 1. Sort by start time, then duration (longer first to optimize packing)
    const sorted = [...dayClasses].sort((a, b) => {
        if (a.startTime === b.startTime) {
             return b.endTime.localeCompare(a.endTime);
        }
        return a.startTime.localeCompare(b.startTime);
    });

    const layoutMap = new Map<number, { index: number, total: number }>();
    if (sorted.length === 0) return layoutMap;

    // 2. Group overlapping intervals (clusters)
    const clusters: ClassSession[][] = [];
    let currentCluster: ClassSession[] = [sorted[0]];
    let clusterEnd = sorted[0].endTime;

    for (let i = 1; i < sorted.length; i++) {
        const cls = sorted[i];
        if (cls.startTime < clusterEnd) {
            // Overlaps with current cluster logic (basic start time overlap)
            currentCluster.push(cls);
            // Extend cluster end time if this class ends later
            if (cls.endTime > clusterEnd) clusterEnd = cls.endTime;
        } else {
            // Disjoint, start new cluster
            clusters.push(currentCluster);
            currentCluster = [cls];
            clusterEnd = cls.endTime;
        }
    }
    clusters.push(currentCluster);

    // 3. Assign lanes within each cluster
    clusters.forEach(cluster => {
        const lanes: ClassSession[][] = [];
        
        cluster.forEach(cls => {
            let placed = false;
            // First-fit strategy: find first lane where it fits
            for (let i = 0; i < lanes.length; i++) {
                const lastInLane = lanes[i][lanes[i].length - 1];
                if (cls.startTime >= lastInLane.endTime) {
                    lanes[i].push(cls);
                    layoutMap.set(cls.id, { index: i, total: 0 }); 
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                lanes.push([cls]);
                layoutMap.set(cls.id, { index: lanes.length - 1, total: 0 });
            }
        });

        // Set total lanes for this cluster so items know how to divide height
        const clusterLanes = lanes.length;
        cluster.forEach(cls => {
            const entry = layoutMap.get(cls.id);
            if (entry) entry.total = clusterLanes;
        });
    });

    return layoutMap;
  };

  const themeGradient = PROFILE_THEMES[profile.theme || 'classic'];

  const handleEditClick = () => {
    if (selectedClass) {
      onEditClass(selectedClass);
      setSelectedClass(null);
    }
  };

  // Handle scroll to remove tooltip
  const handleScroll = () => {
    if (hoveredTooltip) setHoveredTooltip(null);
  };

  // --- Resize Handlers ---

  const handleResizeStart = (e: React.MouseEvent, cls: ClassSession, edge: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();

    // Mark as resizing to prevent click events
    justResizedRef.current = true;

    // Find the timeline container to measure width relative to minutes
    const container = e.currentTarget.closest('.group\\/timeline'); 
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const totalMinutes = 14 * 60; // 8am to 10pm
    const pixelsPerMinute = rect.width / totalMinutes;

    resizingRef.current = {
        id: cls.id,
        edge,
        initialX: e.clientX,
        initialStart: timeToMinutes(cls.startTime),
        initialEnd: timeToMinutes(cls.endTime),
        pixelsPerMinute
    };
    
    setResizingClass({
        id: cls.id,
        edge,
        startMinutes: timeToMinutes(cls.startTime),
        endMinutes: timeToMinutes(cls.endTime)
    });
    
    setHoveredTooltip(null);

    // Add listeners
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeUp);
  };

  const handleResizeMove = (e: MouseEvent) => {
     if (!resizingRef.current) return;
     const { initialX, initialStart, initialEnd, pixelsPerMinute, edge } = resizingRef.current;
     
     const deltaPixels = e.clientX - initialX;
     const deltaMinutes = Math.round(deltaPixels / pixelsPerMinute / 5) * 5; // Snap to 5m

     if (edge === 'start') {
         let newStart = initialStart + deltaMinutes;
         // Constraint: Start cannot be >= End - 15
         newStart = Math.min(newStart, initialEnd - 15);
         // Constraint: Start cannot be < 8:00 AM (480 mins)
         newStart = Math.max(newStart, 8 * 60);

         setResizingClass(prev => prev ? { ...prev, startMinutes: newStart } : null);
     } else {
         let newEnd = initialEnd + deltaMinutes;
         // Constraint: End cannot be <= Start + 15
         newEnd = Math.max(newEnd, initialStart + 15);
         // Constraint: End cannot be > 10:00 PM (22 * 60)
         newEnd = Math.min(newEnd, 22 * 60);

         setResizingClass(prev => prev ? { ...prev, endMinutes: newEnd } : null);
     }
  };

  const handleResizeUp = (e: MouseEvent) => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeUp);

      if (resizingRef.current) {
          const { id, initialX, initialStart, initialEnd, pixelsPerMinute, edge } = resizingRef.current;
          
          const deltaPixels = e.clientX - initialX;
          const deltaMinutes = Math.round(deltaPixels / pixelsPerMinute / 5) * 5; // Snap to 5m
          
          let finalStart = initialStart;
          let finalEnd = initialEnd;

          if (edge === 'start') {
             finalStart = Math.min(Math.max(initialStart + deltaMinutes, 8*60), initialEnd - 15);
          } else {
             finalEnd = Math.min(Math.max(initialEnd + deltaMinutes, initialStart + 15), 22*60);
          }
          
          // Find original class for day info
          const cls = classes.find(c => c.id === id);
          if (cls) {
              onMoveClassRef.current(id, cls.day, minutesToTime(finalStart), minutesToTime(finalEnd));
          }
      }

      // Reset ignore click after a short delay
      setTimeout(() => {
        justResizedRef.current = false;
      }, 50);

      resizingRef.current = null;
      setResizingClass(null);
  };


  // --- Drag (Move) Handlers ---
  const handleDragStart = (e: React.DragEvent, cls: ClassSession) => {
    // Hide default drag image to use our custom preview
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const duration = timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime);
    
    // Calculate how many minutes into the block we clicked
    // Ratio of click X to total width * duration in minutes
    const offsetMinutes = (offsetX / rect.width) * duration;

    setDragState({
        id: cls.id,
        originalClass: cls,
        offsetMinutes
    });
    setDragPreview({
        day: cls.day,
        startTime: cls.startTime
    });
    setHoveredTooltip(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: DayOfWeek) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';

    if (!dragState) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;

    // Constants
    const dayStartMinutes = 8 * 60; // 8:00 AM
    const totalMinutes = 14 * 60;   // 14 hours range
    
    // Calculate mouse position in minutes relative to start of day
    const percent = Math.max(0, Math.min(1, offsetX / width));
    const mouseMinutes = dayStartMinutes + (percent * totalMinutes);
    
    // Determine start time by subtracting the initial click offset
    const targetStartMinutes = mouseMinutes - dragState.offsetMinutes;
    
    // Snap to nearest 15 minutes
    let snappedMinutes = Math.round(targetStartMinutes / 15) * 15;

    // Constraint: Check bounds (cannot start before 8am or end after 10pm)
    const duration = timeToMinutes(dragState.originalClass.endTime) - timeToMinutes(dragState.originalClass.startTime);
    const maxStart = (22 * 60) - duration; // 10 PM - duration
    snappedMinutes = Math.max(dayStartMinutes, Math.min(maxStart, snappedMinutes));
    
    const newStartTime = minutesToTime(snappedMinutes);

    // Only update state if changed to avoid render thrashing
    if (!dragPreview || dragPreview.day !== day || dragPreview.startTime !== newStartTime) {
        setDragPreview({
            day,
            startTime: newStartTime
        });
    }
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDragPreview(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragState || !dragPreview) return;
    
    const duration = timeToMinutes(dragState.originalClass.endTime) - timeToMinutes(dragState.originalClass.startTime);
    const endTimeMinutes = timeToMinutes(dragPreview.startTime) + duration;
    const newEndTime = minutesToTime(endTimeMinutes);
    
    onMoveClass(dragState.id, dragPreview.day, dragPreview.startTime, newEndTime);
    
    setDragState(null);
    setDragPreview(null);
  };

  // Theme based classes
  const bgMain = isDark ? 'bg-[#141414] text-white' : 'bg-white text-black';
  const gridBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const dayLabelBg = isDark ? 'bg-[#1f1f1f] text-gray-300 border-gray-800' : 'bg-gray-50 text-gray-700 border-gray-100';
  const timelineBg = isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200';
  const gridLineColor = isDark ? 'border-gray-800' : 'border-gray-100';
  const timeText = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bgMain} animate-in fade-in duration-500 relative font-roboto`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-[#141414] border-b border-gray-800' : 'bg-[#141414]'} text-white px-4 md:px-10 py-5 flex justify-between items-center shadow-lg sticky top-0 z-40`}>
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
              className="w-10 h-10 rounded flex items-center justify-center text-xl shadow-inner"
              style={{ background: themeGradient }}
            >
              {profile.emoji}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-medium hidden sm:inline leading-none tracking-wide">{profile.name}</span>
              <span className="text-xs text-gray-400 mt-1 sm:hidden">{currentDate}</span>
            </div>
          </div>
        </div>
        
        {/* Date Display */}
        <div className="hidden sm:block text-sm font-light text-gray-400">
          {currentDate}
        </div>
      </div>

      {/* Hero */}
      <div 
        className="text-white px-4 md:px-10 py-12 transition-all duration-500 shadow-xl"
        style={{ background: themeGradient }}
      >
        <h1 className="text-4xl font-bold mb-2 tracking-tight">📚 Class Schedule</h1>
        <p className="opacity-90 font-light">Your weekly timetable at a glance</p>
      </div>

      {/* Grid Container */}
      <div className="p-4 md:p-6 overflow-x-auto" onScroll={handleScroll}>
        <div className="min-w-[1400px]">
          {/* Time Header */}
          <div className={`grid grid-cols-[130px_1fr] border-b ${gridBorder} pb-2 mb-2 sticky left-0`}>
            <div></div>
            <div className={`grid grid-cols-[repeat(14,minmax(0,1fr))] text-xs font-semibold uppercase tracking-wider ${timeText}`}>
              {TIME_SLOTS.map((time, i) => (
                <div key={i} className={`px-1 border-l ${gridBorder} h-full flex items-end pb-2 relative`}>
                  <span className="translate-x-[-50%] pl-2">{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Days */}
          <div className="space-y-4">
            {DAYS.map((day) => {
              // Prepare classes for this day
              // 1. Exclude the original dragged class (from any day) if dragging
              let displayClasses = classes.filter(c => c.id !== dragState?.id);
              
              // 2. Insert the drag preview class if dragging on this day
              if (dragState && dragPreview && dragPreview.day === day) {
                  const duration = timeToMinutes(dragState.originalClass.endTime) - timeToMinutes(dragState.originalClass.startTime);
                  const startMins = timeToMinutes(dragPreview.startTime);
                  const endMins = startMins + duration;
                  
                  const previewClass: ClassSession = {
                      ...dragState.originalClass,
                      day: day,
                      startTime: dragPreview.startTime,
                      endTime: minutesToTime(endMins),
                  };
                  displayClasses.push(previewClass);
              }

              // 3. Apply Resize Preview if resizing
              if (resizingClass) {
                 const targetIndex = displayClasses.findIndex(c => c.id === resizingClass.id);
                 if (targetIndex !== -1) {
                     displayClasses[targetIndex] = {
                         ...displayClasses[targetIndex],
                         startTime: minutesToTime(resizingClass.startMinutes),
                         endTime: minutesToTime(resizingClass.endMinutes)
                     };
                 }
              }

              const dayClasses = displayClasses.filter(c => c.day === day);
              const overlapData = getOverlapData(dayClasses);
              
              return (
                <div key={day} className="grid grid-cols-[130px_1fr] min-h-[120px]">
                  {/* Day Label */}
                  <div className={`flex items-center justify-end pr-6 font-bold rounded-l-lg text-lg capitalize border-y border-l ${dayLabelBg}`}>
                    {day}
                  </div>

                  {/* Timeline */}
                  <div 
                    className={`relative border rounded-r-lg ${timelineBg} group/timeline`}
                    onDragOver={(e) => handleDragOver(e, day as DayOfWeek)}
                    onDrop={handleDrop}
                  >
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-[repeat(14,minmax(0,1fr))] pointer-events-none">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className={`border-l ${gridLineColor} h-full`}></div>
                      ))}
                    </div>

                    {/* Class Blocks */}
                    {dayClasses.map((cls) => {
                      const pos = getPositionStyles(cls.startTime, cls.endTime);
                      const layout = overlapData.get(cls.id) || { index: 0, total: 1 };
                      const heightPercent = 100 / layout.total;
                      const topPercent = layout.index * heightPercent;
                      
                      const isPreview = dragState?.id === cls.id;
                      const isResizing = resizingClass?.id === cls.id;
                      
                      const duration = timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime);
                      const isOverlapped = layout.total > 1;
                      const isHighlyOverlapped = layout.total > 2;
                      
                      const isNarrow = duration < 90; 
                      const isVeryNarrow = duration < 50;
                      const isShortVertical = layout.total > 2 || (layout.total > 1 && duration < 60);
                      const isVeryShortVertical = layout.total > 3;

                      const nameSize = isVeryShortVertical 
                          ? 'text-[9px] leading-tight' 
                          : (isShortVertical ? 'text-[10px] leading-3' : 'text-xs md:text-sm leading-tight');
                          
                      const timeSize = isVeryShortVertical 
                          ? 'text-[8px] leading-tight' 
                          : (isShortVertical ? 'text-[9px] leading-none' : 'text-[10px] md:text-xs leading-tight');

                      const paddingClass = isHighlyOverlapped || isVeryShortVertical
                          ? 'px-1 py-0.5' 
                          : (isOverlapped || duration < 45 ? 'px-1.5 py-1' : 'p-2');

                      const showLocation = !isShortVertical && !isNarrow && !isOverlapped && !!cls.location;

                      return (
                        <div
                          key={cls.id}
                          draggable={!isResizing}
                          onDragStart={(e) => handleDragStart(e, cls)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            if (justResizedRef.current) {
                                e.stopPropagation();
                                return;
                            }
                            if (!isPreview && !isResizing) setSelectedClass(cls);
                          }}
                          onMouseEnter={(e) => {
                            if (isPreview || isResizing) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredTooltip({
                                data: cls,
                                x: rect.left + rect.width / 2,
                                y: rect.top
                            });
                          }}
                          onMouseLeave={() => setHoveredTooltip(null)}
                          className={`
                            absolute rounded-md 
                            flex flex-col text-white z-10 
                            animate-in fade-in zoom-in-95 group/card
                            border border-black/5 hover:border-white/40
                            transition-all duration-200 ease-out
                            ${!isResizing ? 'cursor-grab active:cursor-grabbing' : ''}
                            ${isOverlapped
                                ? 'shadow-inner ring-1 ring-black/10 hover:shadow-xl' 
                                : 'shadow-sm hover:shadow-xl'
                            }
                            ${paddingClass}
                            ${isPreview 
                                ? 'z-50 shadow-2xl ring-2 ring-white ring-dashed opacity-90' 
                                : isResizing ? 'z-50 shadow-2xl scale-[1.01]' : 'hover:z-50'
                            }
                          `}
                          style={{ 
                            left: pos.left,
                            width: pos.width,
                            top: `calc(${topPercent}% + 1px)`,
                            height: `calc(${heightPercent}% - 2px)`,
                            background: COLORS[cls.color],
                            color: ['yellow', 'green', 'orange', 'purple'].includes(cls.color) ? 'black' : 'white'
                          }}
                        >
                          {/* Resize Handles */}
                          {!isPreview && (
                              <>
                                <div 
                                    className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize z-20 hover:bg-white/30 rounded-l-sm transition-colors"
                                    onMouseDown={(e) => handleResizeStart(e, cls, 'start')}
                                />
                                <div 
                                    className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-ew-resize z-20 hover:bg-white/30 rounded-r-sm transition-colors"
                                    onMouseDown={(e) => handleResizeStart(e, cls, 'end')}
                                />
                              </>
                          )}

                          {/* Inner content wrapper with overflow handling */}
                          <div className="flex flex-col w-full h-full justify-center overflow-hidden pointer-events-none">
                              <div className={`font-bold truncate ${nameSize} mb-0.5`}>
                                {cls.name}
                              </div>
                              
                              <div className={`${timeSize} opacity-90 font-medium`}>
                                 {(isShortVertical || isVeryNarrow) ? (
                                     <div className="truncate">
                                         {formatTimeCompact(cls.startTime)}-{formatTimeCompact(cls.endTime)}
                                     </div>
                                 ) : isNarrow ? (
                                     <div className="flex flex-col leading-tight">
                                         <span>{formatTime(cls.startTime)}</span>
                                         <span className="opacity-75">{formatTime(cls.endTime)}</span>
                                     </div>
                                 ) : (
                                     <div className="truncate">
                                         {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                     </div>
                                 )}
                              </div>
                              
                              {showLocation && (
                                  <div className={`truncate opacity-80 mt-1 flex items-center gap-1 ${timeSize}`}>
                                      <MapPin size={8} /> {cls.location}
                                  </div>
                              )}
                          </div>

                          {/* Hover Overlay */}
                          <div className={`absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors pointer-events-none flex items-center justify-center opacity-0 group-hover/card:opacity-100 rounded-md ${isPreview || isResizing ? 'hidden' : ''}`}>
                             <div className="bg-black/50 text-white rounded-full p-2 backdrop-blur-sm transform scale-90 group-hover/card:scale-100 transition-transform">
                                <ExternalLink size={20} />
                             </div>
                          </div>
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

      {/* Tooltip Layer */}
      {hoveredTooltip && !dragState && !resizingClass && (
        <div 
            className="fixed z-[100] pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
            style={{ 
                left: hoveredTooltip.x, 
                top: hoveredTooltip.y,
                transform: 'translate(-50%, -100%) translateY(-12px)'
            }}
        >
            <div className="bg-[#1a1a1a] text-white text-xs rounded-lg shadow-2xl p-3 border border-gray-700 min-w-[180px]">
                <div className="font-bold text-sm mb-1">{hoveredTooltip.data.name}</div>
                
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Clock size={12} />
                        <span>{formatTime(hoveredTooltip.data.startTime)} - {formatTime(hoveredTooltip.data.endTime)}</span>
                    </div>
                    
                    {(hoveredTooltip.data.location) && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <MapPin size={12} className="text-emerald-400" />
                            <span>{hoveredTooltip.data.location}</span>
                        </div>
                    )}

                    {(hoveredTooltip.data.teacher) && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <User size={12} className="text-orange-400" />
                            <span>{hoveredTooltip.data.teacher}</span>
                        </div>
                    )}
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1a1a1a] border-b-0"></div>
            </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={onAddClass}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg shadow-indigo-500/40 text-white flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all z-40"
        style={{ background: themeGradient }}
      >
        <Plus />
      </button>

      {/* Quick View / Detail Modal */}
      {selectedClass && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedClass(null)}
        >
          <div 
            className="bg-[#181818] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative mx-4 border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Banner */}
            <div 
              className="h-32 relative flex items-end p-6"
              style={{ background: COLORS[selectedClass.color] }}
            >
              <button 
                onClick={() => setSelectedClass(null)}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md"
              >
                <X size={20} />
              </button>
              <div className="w-full">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${['yellow', 'green', 'orange', 'purple'].includes(selectedClass.color) ? 'bg-black/10 text-black' : 'bg-white/20 text-white'}`}>
                    Class Details
                </span>
                <h2 className={`text-3xl font-bold leading-tight ${['yellow', 'green', 'orange', 'purple'].includes(selectedClass.color) ? 'text-black' : 'text-white'}`}>
                    {selectedClass.name}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-gray-300">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        <Calendar size={12} /> Day
                    </p>
                    <p className="text-white capitalize font-medium text-lg">{selectedClass.day}</p>
                </div>
                
                <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                        <Clock size={12} /> Time
                    </p>
                    <p className="text-white font-medium text-lg">
                        {formatTime(selectedClass.startTime)}
                    </p>
                    <p className="text-sm text-gray-500">to {formatTime(selectedClass.endTime)}</p>
                </div>
              </div>

              <div className="h-px bg-gray-800 w-full" />

              <div className="space-y-4">
                {(selectedClass.location) && (
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-[#222]">
                    <div className="mt-1">
                        <MapPin size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Location</p>
                        <p className="text-white font-medium">{selectedClass.location}</p>
                    </div>
                    </div>
                )}

                {(selectedClass.teacher) && (
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-[#222]">
                    <div className="mt-1">
                        <User size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Instructor</p>
                        <p className="text-white font-medium">{selectedClass.teacher}</p>
                    </div>
                    </div>
                )}
              </div>

              <button
                onClick={handleEditClick}
                className="w-full mt-4 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5"
              >
                <Edit size={18} />
                Edit Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};