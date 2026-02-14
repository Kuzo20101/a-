import { ClassColor } from './types';

export const EMOJIS = ['👤', '😊', '🎓', '📚', '🎯', '⭐', '🚀', '💡', '🎨', '🎵', '⚡', '🌟'];

export const COLORS: { [key in ClassColor]: string } = {
  red: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  green: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  yellow: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  purple: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  orange: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
};

// Map gradient to a solid border/text color for UI elements
export const COLOR_BORDERS: { [key in ClassColor]: string } = {
    red: '#f5576c',
    blue: '#4facfe',
    green: '#43e97b',
    yellow: '#fee140',
    purple: '#a8edea',
    orange: '#ff9a56',
};

export const PROFILE_THEMES: Record<string, string> = {
  'classic': 'linear-gradient(to bottom right, #667eea, #764ba2)',
  'ocean': 'linear-gradient(to bottom right, #2E3192, #1BFFFF)',
  'sunset': 'linear-gradient(to bottom right, #FF512F, #DD2476)',
  'forest': 'linear-gradient(to bottom right, #11998e, #38ef7d)',
  'berry': 'linear-gradient(to bottom right, #834d9b, #d04ed6)',
  'dark': 'linear-gradient(to bottom right, #232526, #414345)',
  'gold': 'linear-gradient(to bottom right, #F7971E, #FFD200)',
  'fire': 'linear-gradient(to bottom right, #f12711, #f5af19)'
};

export const MAX_PROFILES = 5;

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export const TIME_SLOTS = [
  '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', 
  '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', 
  '6 PM', '7 PM', '8 PM', '9 PM'
];