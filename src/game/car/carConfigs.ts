import { CarConfig } from '../../types/game';

export const CAR_CONFIGS: CarConfig[] = [
  {
    id: 'compact',
    name: 'Aero Sprint',
    category: 'Compact Hatchback',
    description: 'Nimble, agile, and wonderfully light. Perfect for winding mountain roads and relaxed countryside cruising.',
    topSpeed: 145, // km/h
    acceleration: 28, // responsive
    handling: 0.88, // sharp steering response
    braking: 35,
    bodyColor: '#38bdf8', // Vibrant Sky Blue
    accentColor: '#0f172a',
    wheelColor: '#334155',
    length: 3.8,
    width: 1.8,
    height: 1.35,
    wheelRadius: 0.34
  },
  {
    id: 'sedan',
    name: 'Grand Tourer',
    category: 'Executive Sedan',
    description: 'A smooth, heavy, ultra-stable cruiser with soft suspension and effortless highway manners.',
    topSpeed: 165,
    acceleration: 24,
    handling: 0.72,
    braking: 30,
    bodyColor: '#10b981', // Emerald Green
    accentColor: '#1e293b',
    wheelColor: '#475569',
    length: 4.5,
    width: 1.9,
    height: 1.4,
    wheelRadius: 0.36
  },
  {
    id: 'sport',
    name: 'Apex GT',
    category: 'Performance Coupe',
    description: 'Low-slung, aerodynamic, and fast. Built for high-speed coastal sweeps and responsive cornering.',
    topSpeed: 195,
    acceleration: 36,
    handling: 0.95,
    braking: 45,
    bodyColor: '#f43f5e', // Crimson Red
    accentColor: '#09090b',
    wheelColor: '#27272a',
    length: 4.3,
    width: 1.95,
    height: 1.2,
    wheelRadius: 0.37
  }
];

export const DEFAULT_CAR_ID = 'compact';
