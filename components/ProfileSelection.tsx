import React, { useState } from 'react';
import { Profile } from '../types';
import { Plus, Edit2, Settings } from 'lucide-react';
import { MAX_PROFILES, PROFILE_THEMES } from '../constants';

interface ProfileSelectionProps {
  profiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  onManageProfile: (profile: Profile) => void;
  onAddProfile: () => void;
  onSettings: () => void;
  theme: 'dark' | 'light';
}

export const ProfileSelection: React.FC<ProfileSelectionProps> = ({ 
  profiles, 
  onSelectProfile, 
  onManageProfile,
  onAddProfile,
  onSettings,
  theme
}) => {
  const [isManageMode, setIsManageMode] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 overflow-y-auto relative">
      <button 
        onClick={onSettings}
        className={`absolute top-4 right-4 md:top-8 md:right-8 p-2 transition-colors rounded-full ${
          isDark 
            ? 'text-gray-400 hover:text-white hover:bg-white/10' 
            : 'text-gray-500 hover:text-black hover:bg-black/10'
        }`}
        aria-label="Settings"
      >
        <Settings size={24} />
      </button>

      <div className="text-center mb-8 md:mb-12 mt-4 md:mt-0">
        <h1 className={`text-3xl md:text-5xl font-normal mb-3 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Who's studying?
        </h1>
        <p className={`text-lg font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {isManageMode ? 'Manage your profiles' : 'Select your profile'}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 max-w-5xl w-full mb-10 md:mb-14 px-4">
        {profiles.map((profile) => (
          <div 
            key={profile.id}
            onClick={() => isManageMode ? onManageProfile(profile) : onSelectProfile(profile)}
            className="group flex flex-col items-center cursor-pointer w-24 md:w-32 lg:w-40"
          >
            <div className={`relative w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-md overflow-hidden mb-3 border-2 transition-all duration-300 ${
              isDark 
                ? 'border-transparent group-hover:border-white' 
                : 'border-transparent group-hover:border-black shadow-sm group-hover:shadow-md'
            }`}>
               <div 
                  className="w-full h-full flex items-center justify-center text-4xl md:text-6xl"
                  style={{ background: PROFILE_THEMES[profile.theme || 'classic'] }}
               >
                 {profile.emoji}
               </div>
               {isManageMode && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                   <Edit2 className="text-white w-8 h-8 md:w-10 md:h-10" />
                 </div>
               )}
            </div>
            <span className={`text-sm md:text-lg text-center truncate w-full transition-colors duration-300 ${
              isDark 
                ? 'text-gray-400 group-hover:text-white' 
                : 'text-gray-600 group-hover:text-black font-medium'
            }`}>
              {profile.name}
            </span>
          </div>
        ))}

        {/* Show Add Profile button ONLY in manage mode, as requested */}
        {isManageMode && profiles.length < MAX_PROFILES && (
          <div 
            onClick={onAddProfile}
            className="group flex flex-col items-center cursor-pointer w-24 md:w-32 lg:w-40"
          >
            <div className={`w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-md mb-3 border-2 border-transparent transition-all duration-300 flex items-center justify-center ${
              isDark
                ? 'bg-[#2a2a2a] group-hover:bg-white'
                : 'bg-gray-200 group-hover:bg-black'
            }`}>
              <Plus className={`w-10 h-10 md:w-16 md:h-16 transition-colors ${
                isDark 
                    ? 'text-gray-400 group-hover:text-black' 
                    : 'text-gray-500 group-hover:text-white'
              }`} />
            </div>
            <span className={`text-sm md:text-lg transition-colors duration-300 ${
              isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-black'
            }`}>
              Add Profile
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={() => setIsManageMode(!isManageMode)}
          className={`px-6 py-2 md:px-8 md:py-3 bg-transparent border text-sm md:text-lg tracking-widest transition-all duration-300 uppercase ${
            isDark
              ? 'border-gray-500 text-gray-500 hover:border-white hover:text-white'
              : 'border-gray-400 text-gray-600 hover:border-black hover:text-black hover:bg-gray-100'
          }`}
        >
          {isManageMode ? 'Done' : 'Manage Profiles'}
        </button>
      </div>
    </div>
  );
};