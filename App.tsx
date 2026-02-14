import React, { useState, useEffect } from 'react';
import { ProfileSelection } from './components/ProfileSelection';
import { ScheduleView } from './components/ScheduleView';
import { ProfileModal } from './components/ProfileModal';
import { ClassModal } from './components/ClassModal';
import { ToastContainer } from './components/Toast';
import { Profile, ClassSession, ToastMessage } from './types';
import { MAX_PROFILES } from './constants';

// Storage Keys
const PROFILES_KEY = 'netflix_profiles';
const getScheduleKey = (profileId: number) => `schedule_profile_${profileId}`;

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

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- Initial Load ---
  useEffect(() => {
    const savedProfiles = localStorage.getItem(PROFILES_KEY);
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (e) {
        console.error("Failed to parse profiles", e);
        // Fallback
        const defaultProfile: Profile = { id: Date.now(), name: 'Student', emoji: '👤', theme: 'classic' };
        setProfiles([defaultProfile]);
      }
    } else {
      // Default initial profile
      const defaultProfile: Profile = { id: Date.now(), name: 'Student', emoji: '👤', theme: 'classic' };
      setProfiles([defaultProfile]);
      localStorage.setItem(PROFILES_KEY, JSON.stringify([defaultProfile]));
    }
  }, []);

  // --- Profile Logic ---

  const handleProfileSelect = (profile: Profile) => {
    setCurrentProfile(profile);
    const savedClasses = localStorage.getItem(getScheduleKey(profile.id));
    setCurrentClasses(savedClasses ? JSON.parse(savedClasses) : []);
  };

  const handleSaveProfile = (profileData: Omit<Profile, 'id'>, id?: number) => {
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

    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    
    setIsProfileModalOpen(false);
    setEditingProfile(null);
    showToast(message, 'success');
  };

  const handleDeleteProfile = (id: number) => {
    if (profiles.length <= 1) {
      showToast('Cannot delete the last profile', 'error');
      return;
    }
    
    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    localStorage.removeItem(getScheduleKey(id)); // Cleanup profile data
    
    setIsProfileModalOpen(false);
    setEditingProfile(null);
    showToast('Profile deleted', 'info');
  };

  const openAddProfile = () => {
    if (profiles.length >= MAX_PROFILES) {
      showToast('Profile limit reached', 'error');
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
    const id = Date.now();
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
        />
      ) : (
        <ScheduleView
          profile={currentProfile}
          classes={currentClasses}
          onBack={() => setCurrentProfile(null)}
          onAddClass={openAddClass}
          onEditClass={openEditClass}
        />
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        onDelete={handleDeleteProfile}
        editingProfile={editingProfile}
        canDelete={profiles.length > 1}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        onDelete={handleDeleteClass}
        editingClass={editingClass}
      />
    </>
  );
};

export default App;