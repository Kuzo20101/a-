import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { EMOJIS, PROFILE_THEMES } from '../constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Omit<Profile, 'id'>, id?: number) => void;
  onDelete: (id: number) => void;
  editingProfile: Profile | null;
  canDelete: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  editingProfile,
  canDelete 
}) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name);
      setSelectedEmoji(editingProfile.emoji);
      setSelectedTheme(editingProfile.theme || 'classic');
      setShowDeleteConfirm(false);
    } else {
      setName('');
      setSelectedEmoji(EMOJIS[0]);
      setSelectedTheme('classic');
      setShowDeleteConfirm(false);
    }
  }, [editingProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji: selectedEmoji, theme: selectedTheme }, editingProfile?.id);
  };

  const handleConfirmDelete = () => {
    if (editingProfile) {
      onDelete(editingProfile.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181818] rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-800 max-h-[85vh] overflow-y-auto custom-scrollbar">
        
        {showDeleteConfirm ? (
          <div className="flex flex-col items-center text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 text-3xl">
              !
            </div>
            <h3 className="text-2xl font-light mb-2 text-white">Delete Profile?</h3>
            <p className="text-gray-400 mb-8 max-w-[280px]">
              Are you sure you want to delete this profile? This action cannot be undone.
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
            <h2 className="text-3xl font-light mb-8 text-white">
              {editingProfile ? 'Edit Profile' : 'Add Profile'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#333] border border-[#555] rounded px-4 py-3 text-white focus:outline-none focus:border-white focus:bg-[#454545] transition-colors"
                  placeholder="Enter name"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Avatar</label>
                <div className="grid grid-cols-6 gap-3">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`
                        w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                        transition-all duration-200 border-2
                        ${selectedEmoji === emoji 
                          ? 'bg-[#454545] border-white scale-110' 
                          : 'bg-[#333] border-transparent hover:bg-[#454545] hover:scale-105'
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-gray-400 text-sm mb-2">Theme</label>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(PROFILE_THEMES).map(([key, gradient]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTheme(key)}
                      className={`
                        w-full aspect-square rounded-lg
                        transition-all duration-200 border-2
                        ${selectedTheme === key 
                          ? 'border-white scale-110 shadow-lg' 
                          : 'border-transparent hover:scale-105 hover:border-gray-500'
                        }
                      `}
                      style={{ background: gradient }}
                      title={key}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-[#333] text-white font-bold rounded hover:bg-[#454545] transition-colors"
                >
                  Cancel
                </button>
                {editingProfile && canDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 px-6 py-3 bg-white text-black font-bold rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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