import { create } from 'zustand';
import { GameSettings } from '../types/game';

const SETTINGS_STORAGE_KEY = 'roadscape_settings_v1';

const defaultSettings: GameSettings = {
  graphicsQuality: 'HIGH',
  trafficDensity: 'MEDIUM',
  environment: 'COUNTRYSIDE',
  weather: 'CLEAR',
  timeOfDay: 'DAY',
  trafficSide: 'LEFT', // Default left-hand traffic as per specifications
  defaultCamera: 'CHASE',
  masterVolume: 0.8,
  engineVolume: 0.7,
  ambientVolume: 0.6,
  fov: 65,
  showFps: false,
  controlScheme: 'TILT',
  tiltSensitivity: 1.2,
  tiltDeadzone: 2.5,
  tiltInvert: false,
  autoAccelerate: false,
  hapticFeedback: true,
};

function loadStoredSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.weather === 'DYNAMIC') parsed.weather = 'CLEAR';
      if (parsed.timeOfDay === 'DYNAMIC') parsed.timeOfDay = 'DAY';
      if (!parsed.environment) parsed.environment = 'COUNTRYSIDE';
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse stored settings:', e);
  }
  return defaultSettings;
}

interface SettingsStoreState {
  settings: GameSettings;
  updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: loadStoredSettings(),

  updateSetting: (key, value) => {
    set((state) => {
      const nextSettings = { ...state.settings, [key]: value };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
      return { settings: nextSettings };
    });
  },

  resetSettings: () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(defaultSettings));
    } catch (e) {
      console.error(e);
    }
    set({ settings: defaultSettings });
  },
}));
