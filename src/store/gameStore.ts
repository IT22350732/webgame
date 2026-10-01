import { create } from 'zustand';
import {
  BiomeType,
  CameraMode,
  DebugInfo,
  GameState,
  TimeOfDay,
  WeatherType,
} from '../types/game';
import { DEFAULT_CAR_ID } from '../game/car/carConfigs';

const SAVE_KEY = 'roadscape_save_v1';

interface StoredGameSave {
  selectedCarId: string;
  bestDistance: number;
  totalDistance: number;
}

function loadSave(): StoredGameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load save data:', e);
  }
  return {
    selectedCarId: DEFAULT_CAR_ID,
    bestDistance: 0,
    totalDistance: 0,
  };
}

function persistSave(save: StoredGameSave) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (e) {
    console.error('Failed to write save:', e);
  }
}

interface GameStoreState {
  gameState: GameState;
  selectedCarId: string;
  seed: number;
  distance: number; // in meters
  speedKmh: number;
  topSpeedRecorded: number;
  bestDistance: number; // in meters
  totalDistance: number; // in meters
  drivingTimeSec: number;
  currentBiome: BiomeType;
  currentWeather: WeatherType;
  currentTimeOfDay: TimeOfDay;
  cameraMode: CameraMode;
  isOffroad: boolean;
  isDebugOpen: boolean;
  debugInfo: DebugInfo;

  // Actions
  setGameState: (state: GameState) => void;
  setSelectedCarId: (id: string) => void;
  setSeed: (seed: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  cycleCameraMode: () => void;
  setWeather: (weather: WeatherType) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setBiome: (biome: BiomeType) => void;
  setIsOffroad: (offroad: boolean) => void;
  updateDrivingStats: (speedKmh: number, deltaDistance: number, dt: number) => void;
  setDebugInfo: (info: Partial<DebugInfo>) => void;
  toggleDebug: () => void;
  resetDrive: () => void;
}

const initialSave = loadSave();

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: 'MAIN_MENU',
  selectedCarId: initialSave.selectedCarId,
  seed: Math.floor(Math.random() * 900000 + 100000), // e.g. 827491
  distance: 0,
  speedKmh: 0,
  topSpeedRecorded: 0,
  bestDistance: initialSave.bestDistance,
  totalDistance: initialSave.totalDistance,
  drivingTimeSec: 0,
  currentBiome: 'COUNTRYSIDE',
  currentWeather: 'CLEAR',
  currentTimeOfDay: 'DAY',
  cameraMode: 'CHASE',
  isOffroad: false,
  isDebugOpen: false,
  debugInfo: {
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    position: { x: 0, y: 0, z: 0 },
    speedKmh: 0,
    biome: 'COUNTRYSIDE',
    seed: 827491,
    activeChunks: 0,
    activeTraffic: 0,
  },

  setGameState: (gameState) => set({ gameState }),

  setSelectedCarId: (selectedCarId) => {
    set({ selectedCarId });
    persistSave({
      selectedCarId,
      bestDistance: get().bestDistance,
      totalDistance: get().totalDistance,
    });
  },

  setSeed: (seed) => set({ seed }),

  setCameraMode: (cameraMode) => set({ cameraMode }),

  cycleCameraMode: () => {
    const modes: CameraMode[] = ['CHASE', 'CLOSE', 'HOOD', 'CINEMATIC'];
    const current = get().cameraMode;
    const nextIdx = (modes.indexOf(current) + 1) % modes.length;
    set({ cameraMode: modes[nextIdx] });
  },

  setWeather: (currentWeather) => set({ currentWeather }),

  setTimeOfDay: (currentTimeOfDay) => set({ currentTimeOfDay }),

  setBiome: (currentBiome) => set({ currentBiome }),

  setIsOffroad: (isOffroad) => set({ isOffroad }),

  updateDrivingStats: (speedKmh, deltaDistance, dt) => {
    set((state) => {
      const nextDistance = state.distance + deltaDistance;
      const nextTotal = state.totalDistance + deltaDistance;
      const nextBest = Math.max(state.bestDistance, nextDistance);
      const nextTopSpeed = Math.max(state.topSpeedRecorded, speedKmh);
      const nextDrivingTime = state.drivingTimeSec + dt;

      // Periodically persist best and total distance (every 500m or when stopping)
      if (Math.floor(nextDistance / 500) > Math.floor(state.distance / 500)) {
        persistSave({
          selectedCarId: state.selectedCarId,
          bestDistance: nextBest,
          totalDistance: nextTotal,
        });
      }

      return {
        distance: nextDistance,
        speedKmh,
        topSpeedRecorded: nextTopSpeed,
        bestDistance: nextBest,
        totalDistance: nextTotal,
        drivingTimeSec: nextDrivingTime,
      };
    });
  },

  setDebugInfo: (info) =>
    set((state) => ({ debugInfo: { ...state.debugInfo, ...info } })),

  toggleDebug: () => set((state) => ({ isDebugOpen: !state.isDebugOpen })),

  resetDrive: () =>
    set((state) => {
      persistSave({
        selectedCarId: state.selectedCarId,
        bestDistance: state.bestDistance,
        totalDistance: state.totalDistance,
      });
      return {
        distance: 0,
        speedKmh: 0,
        drivingTimeSec: 0,
        isOffroad: false,
      };
    }),
}));
