import * as THREE from 'three';
import { RoadManager } from './road/RoadManager';
import { TerrainManager } from './environment/TerrainManager';
import { SkySystem } from './environment/SkySystem';
import { WeatherSystem } from './environment/WeatherSystem';
import { TrafficManager } from './traffic/TrafficManager';
import { CarController } from './car/CarController';
import { CAR_CONFIGS } from './car/carConfigs';
import { audioManager } from './audio/AudioManager';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { CarConfig } from '../types/game';

export class Game {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public roadManager: RoadManager;
  public terrainManager: TerrainManager;
  public skySystem: SkySystem;
  public weatherSystem: WeatherSystem;
  public trafficManager: TrafficManager;
  public carController: CarController | null = null;

  private isRunning = false;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private boundResize: () => void;

  // Performance debug counters
  private frameCount = 0;
  private fpsTimer = 0;
  private currentFps = 60;

  // Background camera for menu
  private menuCameraAngle = 0;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      65,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.5,
      2500
    );
    this.camera.position.set(0, 15, -30);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 3. Subsystems
    const initialSeed = useGameStore.getState().seed;
    const initialSettings = useSettingsStore.getState().settings;

    this.roadManager = new RoadManager(this.scene, initialSeed);
    this.terrainManager = new TerrainManager(this.scene, this.roadManager.curve, initialSeed);
    this.skySystem = new SkySystem(this.scene);
    this.weatherSystem = new WeatherSystem(this.scene);
    this.trafficManager = new TrafficManager(this.scene, initialSettings.trafficSide);

    // Apply settings
    this.trafficManager.setDensity(initialSettings.trafficDensity);
    this.skySystem.setTimeSetting(initialSettings.timeOfDay);
    this.weatherSystem.setWeatherSetting(initialSettings.weather);

    // 4. Initial World Generation (for main menu scenic preview)
    this.roadManager.update(100);
    this.terrainManager.update(100);

    // 5. Spawn Player Car
    const selectedCarId = useGameStore.getState().selectedCarId;
    this.initPlayerCar(selectedCarId);

    // Resize listener
    this.boundResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundResize);

    // Start loop
    this.start();
  }

  public initPlayerCar(carId: string) {
    if (this.carController) {
      this.carController.dispose(this.scene);
      this.carController = null;
    }

    const config: CarConfig =
      CAR_CONFIGS.find((c) => c.id === carId) || CAR_CONFIGS[0];

    const settings = useSettingsStore.getState().settings;
    this.carController = new CarController(
      config,
      this.camera,
      this.scene,
      this.roadManager,
      settings.trafficSide
    );

    this.carController.cameraFollow.setMode(settings.defaultCamera);
    this.carController.cameraFollow.setBaseFov(settings.fov);

    this.carController.setCallbacks({
      onCycleCamera: () => {
        if (this.carController) {
          useGameStore.getState().setCameraMode(this.carController.cameraFollow.getMode());
        }
      },
      onTogglePause: () => {
        const state = useGameStore.getState().gameState;
        if (state === 'PLAYING') {
          useGameStore.getState().setGameState('PAUSED');
        } else if (state === 'PAUSED') {
          useGameStore.getState().setGameState('PLAYING');
        }
      },
      onResetCar: () => {
        this.resetCarToRoad();
      },
    });
  }

  public resetCarToRoad() {
    if (!this.carController) return;
    const settings = useSettingsStore.getState().settings;
    this.carController.resetPosition(this.roadManager, settings.trafficSide);
    useGameStore.getState().setIsOffroad(false);
  }

  public restartDrive(seed?: number) {
    const currentSeed = seed ?? useGameStore.getState().seed;
    useGameStore.getState().setSeed(currentSeed);
    useGameStore.getState().resetDrive();

    this.roadManager.setSeed(currentSeed);
    this.terrainManager.setSeed(currentSeed, this.roadManager.curve);
    this.trafficManager.clear();

    const selectedCarId = useGameStore.getState().selectedCarId;
    this.initPlayerCar(selectedCarId);

    this.roadManager.update(20);
    this.terrainManager.update(20);
  }

  public setTouchInputs(inputs: { throttle: number; brake: number; steer: number; handbrake: boolean }) {
    if (this.carController) {
      this.carController.touchInputs = inputs;
    }
  }

  private handleResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private tick = (time: number) => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const rawDt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const dt = THREE.MathUtils.clamp(rawDt, 0.001, 0.1);

    // FPS Counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    const gameState = useGameStore.getState().gameState;

    if (gameState === 'PLAYING') {
      this.updatePlaying(dt);
    } else if (gameState === 'MAIN_MENU' || gameState === 'ABOUT') {
      this.updateMenuCinematic(dt);
    } else if (gameState === 'GARAGE') {
      this.updateGaragePreview(dt);
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    // Debug info update
    if (useGameStore.getState().isDebugOpen) {
      this.syncDebugInfo();
    }
  };

  private updatePlaying(dt: number) {
    if (!this.carController) return;

    const isNight = this.skySystem.isNight();

    // 1. Car Physics & Controls
    const prevPos = this.carController.physics.position.clone();
    this.carController.update(dt, this.roadManager, isNight);
    const currPos = this.carController.physics.position;

    const deltaDist = currPos.distanceTo(prevPos);
    const speedKmh = this.carController.physics.speedKmh;
    const playerRoadDist = this.carController.physics.roadDistance;

    // 2. Endless Chunk Streaming (Road & Terrain)
    this.roadManager.update(playerRoadDist);
    this.terrainManager.update(playerRoadDist);

    // 3. Traffic System with Physical Vehicle Collision
    this.trafficManager.update(dt, playerRoadDist, this.roadManager, this.carController);

    // 4. Sky & Weather
    this.skySystem.update(dt, currPos, this.scene);
    this.weatherSystem.update(dt, currPos, this.scene);
    const isRaining = this.weatherSystem.getCurrentWeather() === 'RAIN';
    this.roadManager.setWetness(isRaining ? 0.95 : 0.0);

    // 5. Audio
    const inputs = this.carController.getInputs();
    const isOffroad = this.carController.physics.isOffroad;
    audioManager.update(
      this.carController.physics.rpm,
      speedKmh,
      inputs.throttle,
      isRaining,
      isOffroad
    );

    // 6. Update Game Store / HUD
    const roadFrame = this.roadManager.getRoadFrame(playerRoadDist);
    useGameStore.getState().updateDrivingStats(speedKmh, deltaDist, dt);
    useGameStore.getState().setBiome(roadFrame.biome);
    useGameStore.getState().setWeather(this.weatherSystem.getCurrentWeather());
    useGameStore.getState().setTimeOfDay(this.skySystem.getCurrentTime());
    useGameStore.getState().setIsOffroad(isOffroad);
  }

  private updateMenuCinematic(dt: number) {
    // Slowly drive/orbit along road for stunning main menu dynamic background
    this.menuCameraAngle += dt * 0.08;
    const menuDist = (this.menuCameraAngle * 120) % 2000 + 50;

    this.roadManager.update(menuDist);
    this.terrainManager.update(menuDist);

    const frame = this.roadManager.getRoadFrame(menuDist);
    this.camera.position.set(
      frame.position.x - frame.tangent.x * 12 + Math.sin(this.menuCameraAngle) * 6,
      frame.position.y + 4.5,
      frame.position.z - frame.tangent.z * 12 + Math.cos(this.menuCameraAngle) * 6
    );
    this.camera.lookAt(
      frame.position.x + frame.tangent.x * 20,
      frame.position.y + 1.5,
      frame.position.z + frame.tangent.z * 20
    );

    this.skySystem.update(dt, frame.position, this.scene);
    this.weatherSystem.update(dt, frame.position, this.scene);
  }

  private updateGaragePreview(dt: number) {
    if (!this.carController) return;

    this.menuCameraAngle += dt * 0.4;
    const carPos = this.carController.physics.position;

    const radius = 6.2;
    this.camera.position.set(
      carPos.x + Math.sin(this.menuCameraAngle) * radius,
      carPos.y + 1.8,
      carPos.z + Math.cos(this.menuCameraAngle) * radius
    );
    this.camera.lookAt(carPos.x, carPos.y + 0.6, carPos.z);
    this.skySystem.update(dt, carPos, this.scene);
  }

  private syncDebugInfo() {
    const info = this.renderer.info;
    const pPos = this.carController?.physics.position;
    useGameStore.getState().setDebugInfo({
      fps: this.currentFps,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      position: pPos ? { x: Math.round(pPos.x), y: Math.round(pPos.y), z: Math.round(pPos.z) } : { x: 0, y: 0, z: 0 },
      speedKmh: Math.round(this.carController?.physics.speedKmh || 0),
      seed: useGameStore.getState().seed,
      activeChunks: this.terrainManager.getActiveChunkCount(),
      activeTraffic: this.trafficManager.getActiveCount(),
    });
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.boundResize);
    if (this.carController) {
      this.carController.dispose(this.scene);
    }
    this.roadManager.clear();
    this.terrainManager.clear();
    this.trafficManager.clear();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
