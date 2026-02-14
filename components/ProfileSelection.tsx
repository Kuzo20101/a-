import React, { useState } from 'react';
import { Profile } from '../types';
import { Plus, Edit2 } from 'lucide-react';
import { MAX_PROFILES, PROFILE_THEMES } from '../constants';

interface ProfileSelectionProps {
  profiles: Profile[];
  onSelectProfile: (profile: Profile) => void;
  onManageProfile: (profile: Profile) => void;
  onAddProfile: () => void;
}

export const ProfileSelection: React.FC<ProfileSelectionProps> = ({ 
  profiles, 
  onSelectProfile, 
  onManageProfile,
  onAddProfile 
}) => {
  const [isManageMode, setIsManageMode] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-normal mb-4 tracking-tight">Who's studying?</h1>
        <p className="text-xl text-gray-400 font-light">
          {isManageMode ? 'Manage your profiles' : 'Select your profile'}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-8 max-w-2xl w-full mb-12">
        {profiles.map((profile) => (
          <div 
            key={profile.id}
            onClick={() => isManageMode ? onManageProfile(profile) : onSelectProfile(profile)}
            className="group flex flex-col items-center cursor-pointer w-32 md:w-40"
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden mb-4 border-4 border-transparent group-hover:border-white transition-all duration-300">
               <div 
                  className="w-full h-full flex items-center justify-center text-6xl md:text-7xl"
                  style={{ background: PROFILE_THEMES[profile.theme || 'classic'] }}
               >
                 {profile.emoji}
               </div>
               {isManageMode && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                   <Edit2 className="text-white w-10 h-10" />
                 </div>
               )}
            </div>
            <span className="text-xl text-gray-400 group-hover:text-white transition-colors duration-300 text-center truncate w-full">
              {profile.name}
            </span>
          </div>
        ))}

        {profiles.length < MAX_PROFILES && (
          <div 
            onClick={onAddProfile}
            className="group flex flex-col items-center cursor-pointer w-32 md:w-40"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg mb-4 border-4 border-transparent group-hover:border-white bg-[#2a2a2a] flex items-center justify-center transition-all duration-300">
              <Plus className="w-16 h-16 text-gray-400 group-hover:text-white" />
            </div>
            <span className="text-xl text-gray-400 group-hover:text-white transition-colors duration-300">
              Add Profile
            </span>
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsManageMode(!isManageMode)}
        className="px-8 py-3 bg-transparent border border-gray-500 text-gray-500 text-lg tracking-widest hover:border-white hover:text-white transition-all duration-300 uppercase"
      >
        {isManageMode ? 'Done' : 'Manage Profiles'}
      </button>

      {profiles.length >= MAX_PROFILES && !isManageMode && (
          <p className="mt-8 text-sm text-gray-600">Max {MAX_PROFILES} profiles reached</p>
      )}
    </div>
  );
};