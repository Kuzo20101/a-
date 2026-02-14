export interface Profile {
  id: number;
  name: string;
  emoji: string;
  theme?: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export type ClassColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface ClassSession {
  id: number;
  name: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM" 24h format
  endTime: string;   // "HH:MM" 24h format
  location?: string;
  teacher?: string;
  color: ClassColor;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}