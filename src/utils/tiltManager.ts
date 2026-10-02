import { useSettingsStore } from '../store/settingsStore';

export type MotionPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface TiltState {
  rawAngle: number;       // Raw tilt angle in degrees (-90 to +90)
  calibratedAngle: number;// Angle minus neutral calibration offset
  steer: number;          // Normalized steer (-1.0 to +1.0) for car physics
  neutralOffset: number;  // Current calibrated zero angle
  screenAngle: number;    // Current device orientation angle (0, 90, 180, 270)
  isActive: boolean;      // True if receiving live gyro updates
}

type TiltListener = (state: TiltState) => void;

class TiltManager {
  private permissionState: MotionPermissionState = 'prompt';
  private listeners = new Set<TiltListener>();

  private neutralOffset = 0;
  private currentRawAngle = 0;
  private currentCalibratedAngle = 0;
  private currentSteer = 0;
  private screenAngle = 0;
  private isListening = false;
  private hasReceivedFirstSample = false;
  private lastUpdateTimestamp = 0;

  // Smoothing parameter (alpha for exponential moving average)
  private readonly SMOOTHING_ALPHA = 0.22;
  // Maximum tilt angle (in degrees) for 100% steering lock
  private readonly MAX_TILT_DEG = 28;

  constructor() {
    this.updateScreenAngle();
    this.initPermissionState();

    if (typeof window !== 'undefined') {
      window.addEventListener('orientationchange', () => this.updateScreenAngle());
      if (window.screen?.orientation) {
        window.screen.orientation.addEventListener('change', () => this.updateScreenAngle());
      }
    }
  }

  private initPermissionState() {
    if (typeof window === 'undefined') {
      this.permissionState = 'unsupported';
      return;
    }

    const hasOrientation = 'DeviceOrientationEvent' in window;
    const hasMotion = 'DeviceMotionEvent' in window;

    if (!hasOrientation && !hasMotion) {
      this.permissionState = 'unsupported';
      return;
    }

    const orientationEvent = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof orientationEvent?.requestPermission === 'function') {
      // iOS 13+ permission required
      this.permissionState = 'prompt';
    } else {
      // Android and standard desktop/mobile browsers do not require explicit prompt
      this.permissionState = 'granted';
    }
  }

  public getPermissionState(): MotionPermissionState {
    return this.permissionState;
  }

  public isSupported(): boolean {
    return this.permissionState !== 'unsupported';
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const orientationEvent = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof orientationEvent?.requestPermission === 'function') {
        const res = await orientationEvent.requestPermission();
        if (res === 'granted') {
          this.permissionState = 'granted';
          this.startListening();
          return true;
        } else {
          this.permissionState = 'denied';
          return false;
        }
      }

      const motionEvent = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof motionEvent?.requestPermission === 'function') {
        await motionEvent.requestPermission().catch(() => {});
      }

      this.permissionState = 'granted';
      this.startListening();
      return true;
    } catch (e) {
      console.warn('Error requesting motion permission:', e);
      this.permissionState = 'denied';
      return false;
    }
  }

  private updateScreenAngle() {
    if (typeof window === 'undefined') return;

    if (window.screen?.orientation && typeof window.screen.orientation.angle === 'number') {
      this.screenAngle = window.screen.orientation.angle;
    } else if (typeof window.orientation === 'number') {
      this.screenAngle = window.orientation;
    } else {
      // Fallback based on aspect ratio
      this.screenAngle = window.innerWidth > window.innerHeight ? 90 : 0;
    }
  }

  public startListening() {
    if (this.isListening || typeof window === 'undefined') return;

    this.updateScreenAngle();
    window.addEventListener('deviceorientation', this.handleDeviceOrientation, true);
    window.addEventListener('devicemotion', this.handleDeviceMotion, true);
    this.isListening = true;
  }

  public stopListening() {
    if (!this.isListening || typeof window === 'undefined') return;

    window.removeEventListener('deviceorientation', this.handleDeviceOrientation, true);
    window.removeEventListener('devicemotion', this.handleDeviceMotion, true);
    this.isListening = false;
    this.currentSteer = 0;
    this.notify();
  }

  public calibrate() {
    // Set current raw angle as new zero reference
    this.neutralOffset = this.currentRawAngle;
    this.processAngle(this.currentRawAngle);
  }

  public resetCalibration() {
    this.neutralOffset = 0;
    this.processAngle(this.currentRawAngle);
  }

  private handleDeviceOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta === null && e.gamma === null) return;
    this.lastUpdateTimestamp = performance.now();

    this.updateScreenAngle();
    const beta = e.beta ?? 0;   // [-180, 180] Pitch
    const gamma = e.gamma ?? 0; // [-90, 90] Roll

    let calculatedRawAngle = 0;

    // Adapt calculation to device orientation
    if (this.screenAngle === 90) {
      // Landscape Primary (top of phone on left, home button on right)
      // Tilting left side down tilts top of phone down -> negative beta change
      calculatedRawAngle = -beta;
    } else if (this.screenAngle === 270 || this.screenAngle === -90) {
      // Landscape Secondary (top of phone on right)
      calculatedRawAngle = beta;
    } else if (this.screenAngle === 180) {
      // Portrait Upside Down
      calculatedRawAngle = gamma;
    } else {
      // Portrait Normal (0 deg)
      calculatedRawAngle = -gamma;
    }

    if (!this.hasReceivedFirstSample) {
      // Auto-calibrate on first valid sample to avoid initial steering jerk
      this.neutralOffset = calculatedRawAngle;
      this.hasReceivedFirstSample = true;
    }

    this.processAngle(calculatedRawAngle);
  };

  private handleDeviceMotion = (e: DeviceMotionEvent) => {
    // Fallback if deviceorientation events are not supplying values
    const timeSinceLastOrient = performance.now() - this.lastUpdateTimestamp;
    if (timeSinceLastOrient < 200) return; // Orientation event is active and preferred

    const grav = e.accelerationIncludingGravity;
    if (!grav || grav.x === null || grav.y === null) return;

    this.updateScreenAngle();
    let calculatedRawAngle = 0;

    if (this.screenAngle === 90) {
      // In landscape 90, tilting left drops top -> gravity pulls towards +Y
      const normalizedY = Math.max(-1, Math.min(1, (grav.y || 0) / 9.8));
      calculatedRawAngle = (Math.asin(normalizedY) * 180) / Math.PI;
    } else if (this.screenAngle === 270 || this.screenAngle === -90) {
      const normalizedY = Math.max(-1, Math.min(1, -(grav.y || 0) / 9.8));
      calculatedRawAngle = (Math.asin(normalizedY) * 180) / Math.PI;
    } else {
      // Portrait: gravity on X
      const normalizedX = Math.max(-1, Math.min(1, (grav.x || 0) / 9.8));
      calculatedRawAngle = (Math.asin(normalizedX) * 180) / Math.PI;
    }

    if (!this.hasReceivedFirstSample) {
      this.neutralOffset = calculatedRawAngle;
      this.hasReceivedFirstSample = true;
    }

    this.processAngle(calculatedRawAngle);
  };

  private processAngle(rawAngle: number) {
    // 1. Exponential low-pass filter to remove sensor jitter
    this.currentRawAngle =
      this.currentRawAngle * (1 - this.SMOOTHING_ALPHA) + rawAngle * this.SMOOTHING_ALPHA;

    // 2. Relative to calibrated zero
    const delta = this.currentRawAngle - this.neutralOffset;
    this.currentCalibratedAngle = delta;

    // 3. Retrieve settings
    const settings = useSettingsStore.getState().settings;
    const deadzone = settings.tiltDeadzone ?? 2.5;
    const sensitivity = settings.tiltSensitivity ?? 1.2;
    const invert = settings.tiltInvert ? -1 : 1;

    // 4. Deadzone filter
    const absDelta = Math.abs(delta);
    if (absDelta <= deadzone) {
      this.currentSteer = 0;
      this.notify();
      return;
    }

    // 5. Normalized response curve
    const effectiveAngle = absDelta - deadzone;
    const maxEffective = Math.max(1, this.MAX_TILT_DEG - deadzone);
    const normalizedProgress = Math.min(1, effectiveAngle / maxEffective);

    // Mild cubic curve (x^1.3) gives smooth precision around zero and full responsiveness at turn-in
    const curvedProgress = Math.pow(normalizedProgress, 1.25);
    const sign = Math.sign(delta);

    // Steer mapping: in this game, steer > 0 is LEFT, steer < 0 is RIGHT
    let steerValue = sign * curvedProgress * sensitivity * invert;
    steerValue = Math.max(-1.0, Math.min(1.0, steerValue));

    this.currentSteer = steerValue;
    this.notify();
  }

  public getSteer(): number {
    return this.currentSteer;
  }

  public getState(): TiltState {
    const isRecentlyUpdated = performance.now() - this.lastUpdateTimestamp < 400;
    return {
      rawAngle: Math.round(this.currentRawAngle * 10) / 10,
      calibratedAngle: Math.round(this.currentCalibratedAngle * 10) / 10,
      steer: this.currentSteer,
      neutralOffset: Math.round(this.neutralOffset * 10) / 10,
      screenAngle: this.screenAngle,
      isActive: this.isListening && isRecentlyUpdated,
    };
  }

  public subscribe(listener: TiltListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.listeners.size === 0) return;
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }
}

export const tiltManager = new TiltManager();
