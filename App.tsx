import React, { useState, useEffect, useMemo } from 'react';
import { ProfileSelection } from './components/ProfileSelection';
import { ScheduleView } from './components/ScheduleView';
import { ProfileModal } from './components/ProfileModal';
import { ClassModal } from './components/ClassModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import { Profile, ClassSession, ToastMessage, DayOfWeek, ClassColor } from './types';
import { MAX_PROFILES, COLORS } from './constants';

// Storage Keys
const PROFILES_KEY = 'netflix_profiles';
const getScheduleKey = (profileId: number) => `schedule_profile_${profileId}`;
const SETTINGS_THEME_KEY = 'app_theme';
const SETTINGS_LANG_KEY = 'app_language';

const App: React.FC = () => {
  // --- State ---
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  
  // Classes are specific to the current profile
  const [currentClasses, setCurrentClasses] = useState<ClassSession[]>([]);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Settings
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(SETTINGS_THEME_KEY);
    return (saved as 'dark' | 'light') || 'dark';
  });
  
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_LANG_KEY);
    if (saved) return saved;
    
    // Auto-detect browser language
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      const supported = ['en', 'es', 'fr', 'de', 'ja'];
      return supported.includes(browserLang) ? browserLang : 'en';
    }
    return 'en';
  });

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- Initial Load ---
  useEffect(() => {
    // Load profiles
    const savedProfiles = localStorage.getItem(PROFILES_KEY);
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (e) {
        console.error("Failed to parse profiles", e);
        const defaultProfile: Profile = { id: Date.now(), name: 'Student', emoji: '👤', theme: 'classic' };
        setProfiles([defaultProfile]);
      }
    } else {
      const defaultProfile: Profile = { id: Date.now(), name: 'Student', emoji: '👤', theme: 'classic' };
      setProfiles([defaultProfile]);
      localStorage.setItem(PROFILES_KEY, JSON.stringify([defaultProfile]));
    }
  }, []);

  // --- Theme Effect ---
  useEffect(() => {
    if (theme === 'light') {
      document.body.style.backgroundColor = '#f3f4f6';
      document.body.style.color = '#111827';
    } else {
      document.body.style.backgroundColor = '#141414';
      document.body.style.color = 'white';
    }
  }, [theme]);

  // --- Settings Logic ---
  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem(SETTINGS_THEME_KEY, newTheme);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem(SETTINGS_LANG_KEY, newLang);
  };

  // --- Profile Logic ---

  const handleProfileSelect = (profile: Profile) => {
    setCurrentProfile(profile);
    const savedClasses = localStorage.getItem(getScheduleKey(profile.id));
    setCurrentClasses(savedClasses ? JSON.parse(savedClasses) : []);
  };

  const handleSaveProfile = (profileData: Omit<Profile, 'id'>, id?: number) => {
    // Check limit for new profiles
    if (!id && profiles.length >= MAX_PROFILES) {
      showToast(`Maximum of ${MAX_PROFILES} profiles allowed`, 'error');
      return;
    }

    let updatedProfiles: Profile[];
    let message = '';

    if (id) {
      // Edit existing
      updatedProfiles = profiles.map(p => p.id === id ? { ...p, ...profileData } : p);
      message = 'Profile updated';
    } else {
      // Create new
      const newProfile = { ...profileData, id: Date.now() };
      updatedProfiles = [...profiles, newProfile];
      message = 'Profile created';
    }

    // Update State and Storage - ensuring this triggers a re-render
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    
    // Close Modal and Show Toast
    setIsProfileModalOpen(false);
    setEditingProfile(null);
    showToast(message, 'success');
  };

  const handleDeleteProfile = (id: number) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    localStorage.removeItem(getScheduleKey(id));
    
    setIsProfileModalOpen(false);
    setEditingProfile(null);
    showToast('Profile deleted', 'info');
  };

  const openAddProfile = () => {
    if (profiles.length >= MAX_PROFILES) {
      showToast(`Maximum limit of ${MAX_PROFILES} profiles reached`, 'error');
      return;
    }
    setEditingProfile(null);
    setIsProfileModalOpen(true);
  };

  const openManageProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setIsProfileModalOpen(true);
  };

  // --- Class Logic ---

  // Calculate default start time and day based on the last added class (by ID/timestamp)
  const lastCreatedClass = useMemo(() => {
    if (currentClasses.length === 0) return null;
    return currentClasses.reduce((prev, current) => (prev.id > current.id) ? prev : current);
  }, [currentClasses]);

  const defaultStartTime = lastCreatedClass?.endTime || '09:00';
  const defaultDay = lastCreatedClass?.day || 'monday';

  // Calculate a random default color, prioritizing colors not used in the last 3 creations
  const defaultColor = useMemo((): ClassColor => {
    const allColors = Object.keys(COLORS) as ClassColor[];
    
    if (currentClasses.length === 0) {
      return allColors[Math.floor(Math.random() * allColors.length)];
    }

    // Sort by creation time (newest first) to determine history
    // We use ID because it's a timestamp
    const sortedByCreated = [...currentClasses].sort((a, b) => b.id - a.id);
    
    // Collect up to 3 most recently used unique colors
    const recentColors = new Set<ClassColor>();
    for (const cls of sortedByCreated) {
      recentColors.add(cls.color);
      if (recentColors.size >= 3) break;
    }
    
    // Filter out these recent colors from the available pool
    const freshColors = allColors.filter(c => !recentColors.has(c));
    
    // If we have "fresh" colors that haven't been used recently, pick one randomly
    if (freshColors.length > 0) {
      return freshColors[Math.floor(Math.random() * freshColors.length)];
    }
    
    // Fallback: If for some reason we exhausted options (unlikely with 6 colors and buffer of 3),
    // just ensure we don't pick the immediate last one.
    const lastColor = sortedByCreated[0].color;
    const fallbackColors = allColors.filter(c => c !== lastColor);
    return fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
  }, [currentClasses]);

  const handleSaveClass = (classData: Omit<ClassSession, 'id'>, id?: number) => {
    if (!currentProfile) return;

    let newClasses = [...currentClasses];
    let message = '';

    if (id) {
      // Edit
      newClasses = newClasses.map(c => c.id === id ? { ...c, ...classData } : c);
      message = 'Class updated';
    } else {
      // Add
      newClasses.push({ ...classData, id: Date.now() });
      message = 'Class added to schedule';
    }

    setCurrentClasses(newClasses);
    localStorage.setItem(getScheduleKey(currentProfile.id), JSON.stringify(newClasses));
    
    setIsClassModalOpen(false);
    setEditingClass(null);
    showToast(message, 'success');
  };

  // Handle Drag and Drop Rescheduling
  const handleMoveClass = (classId: number, newDay: DayOfWeek, newStartTime: string, newEndTime: string) => {
    if (!currentProfile) return;

    const newClasses = currentClasses.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          day: newDay,
          startTime: newStartTime,
          endTime: newEndTime
        };
      }
      return c;
    });

    // Update state and persistence immediately
    setCurrentClasses(newClasses);
    localStorage.setItem(getScheduleKey(currentProfile.id), JSON.stringify(newClasses));
  };

  const handleDeleteClass = (id: number) => {
    if (!currentProfile) return;
    
    const newClasses = currentClasses.filter(c => c.id !== id);
    setCurrentClasses(newClasses);
    localStorage.setItem(getScheduleKey(currentProfile.id), JSON.stringify(newClasses));

    setIsClassModalOpen(false);
    setEditingClass(null);
    showToast('Class deleted', 'info');
  };

  const openAddClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const openEditClass = (cls: ClassSession) => {
    setEditingClass(cls);
    setIsClassModalOpen(true);
  };

  // --- Toast Logic ---
  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Render ---

  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main Content */}
      {!currentProfile ? (
        <ProfileSelection
          profiles={profiles}
          onSelectProfile={handleProfileSelect}
          onManageProfile={openManageProfile}
          onAddProfile={openAddProfile}
          onSettings={() => setIsSettingsModalOpen(true)}
          theme={theme}
        />
      ) : (
        <ScheduleView
          profile={currentProfile}
          classes={currentClasses}
          onBack={() => setCurrentProfile(null)}
          onAddClass={openAddClass}
          onEditClass={openEditClass}
          onMoveClass={handleMoveClass}
          theme={theme}
        />
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        onDelete={handleDeleteProfile}
        editingProfile={editingProfile}
        canDelete={true}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        onDelete={handleDeleteClass}
        editingClass={editingClass}
        defaultStartTime={defaultStartTime}
        defaultDay={defaultDay}
        defaultColor={defaultColor}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentTheme={theme}
        currentLanguage={language}
        onThemeChange={handleThemeChange}
        onLanguageChange={handleLanguageChange}
      />
    </>
  );
};

export default App;