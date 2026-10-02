import * as THREE from 'three';

export type GameState =
  | 'MAIN_MENU'
  | 'GARAGE'
  | 'LOADING'
  | 'PLAYING'
  | 'PAUSED'
  | 'SETTINGS'
  | 'ABOUT';

export type CameraMode = 'CHASE' | 'CLOSE' | 'HOOD' | 'CINEMATIC';

export type TrafficSide = 'LEFT' | 'RIGHT';

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export type WeatherType = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'FOG';

export type TimeOfDay = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';

export type BiomeType =
  | 'COUNTRYSIDE'
  | 'FOREST'
  | 'MOUNTAINS'
  | 'COASTAL'
  | 'DESERT'
  | 'CITY_OUTSKIRTS';

export interface CarConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  topSpeed: number; // km/h
  acceleration: number; // m/s^2 equivalent
  handling: number; // 0.0 - 1.0
  braking: number;
  bodyColor: string;
  accentColor: string;
  wheelColor: string;
  length: number;
  width: number;
  height: number;
  wheelRadius: number;
}

export type ControlScheme = 'TILT' | 'TOUCH';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  trafficDensity: 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH';
  weather: 'DYNAMIC' | WeatherType;
  timeOfDay: 'DYNAMIC' | TimeOfDay;
  trafficSide: TrafficSide;
  defaultCamera: CameraMode;
  masterVolume: number;
  engineVolume: number;
  ambientVolume: number;
  fov: number;
  showFps: boolean;
  // Mobile & Tilt Settings
  controlScheme: ControlScheme;
  tiltSensitivity: number; // 0.5 to 2.5
  tiltDeadzone: number;    // degrees (0 to 8)
  tiltInvert: boolean;     // invert tilt direction
  autoAccelerate: boolean; // auto gas pedal
  hapticFeedback: boolean; // mobile vibration
}

export interface RoadPoint {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  distance: number;
  elevation: number;
  curvature: number;
  bankAngle: number;
  biome: BiomeType;
  hasGuardRail: boolean;
  hasStreetLights: boolean;
  hasBridge: boolean;
  hasTunnel: boolean;
}

export interface RoadSegmentData {
  id: number;
  startDistance: number;
  endDistance: number;
  points: RoadPoint[];
  biome: BiomeType;
  mesh?: THREE.Mesh;
}

export interface BiomeConfig {
  type: BiomeType;
  name: string;
  terrainColor: string;
  terrainSecondaryColor: string;
  rockColor: string;
  roadAsphaltColor: string;
  foliageDensity: number;
  treeTypes: ('pine' | 'oak' | 'palm' | 'dryBush' | 'birch')[];
  hillFrequency: number;
  mountainHeight: number;
  fogColor: string;
  fogDensity: number;
  hasOcean: boolean;
}

export interface TrafficCarState {
  id: number;
  distanceOnRoad: number;
  laneOffset: number; // e.g. -2 for left lane, +2 for right lane
  speed: number; // km/h
  targetSpeed: number;
  color: string;
  mesh?: THREE.Group;
  modelType: number;
}

export interface PlayerCarPhysicsState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  angularVelocity: number;
  speedKmh: number;
  steeringAngle: number;
  rpm: number;
  gear: number;
  isOnRoad: boolean;
  isOffroad: boolean;
  roadDistance: number;
  lateralOffset: number;
  wheelRotation: number;
  bodyRoll: number;
  bodyPitch: number;
}

export interface DebugInfo {
  fps: number;
  drawCalls: number;
  triangles: number;
  position: { x: number; y: number; z: number };
  speedKmh: number;
  biome: BiomeType;
  seed: number;
  activeChunks: number;
  activeTraffic: number;
}
