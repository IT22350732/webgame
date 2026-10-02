import * as THREE from 'three';
import { CarConfig, TrafficSide } from '../../types/game';
import { CarModel } from './CarModel';
import { CarPhysics, CarInputs } from './CarPhysics';
import { CarCamera } from './CarCamera';
import { RoadManager } from '../road/RoadManager';
import { triggerHaptic } from '../../utils/haptics';

export class CarController {
  public config: CarConfig;
  public model: CarModel;
  public physics: CarPhysics;
  public cameraFollow: CarCamera;

  private keyStates: { [key: string]: boolean } = {};
  public touchInputs: CarInputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
  };

  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private onCycleCameraCallback?: () => void;
  private onTogglePauseCallback?: () => void;
  private onResetCarCallback?: () => void;

  constructor(
    config: CarConfig,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    roadManager: RoadManager,
    trafficSide: TrafficSide
  ) {
    this.config = config;
    this.model = new CarModel(config);
    this.physics = new CarPhysics(config);
    this.cameraFollow = new CarCamera(camera);

    scene.add(this.model.group);
    this.physics.initPositionOnRoad(roadManager, trafficSide);
    this.cameraFollow.snapToCar(this.physics, this.model);

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  public setCallbacks(callbacks: {
    onCycleCamera?: () => void;
    onTogglePause?: () => void;
    onResetCar?: () => void;
  }) {
    this.onCycleCameraCallback = callbacks.onCycleCamera;
    this.onTogglePauseCallback = callbacks.onTogglePause;
    this.onResetCarCallback = callbacks.onResetCar;
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Prevent default scroll behaviors for arrow keys and spacebar
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    this.keyStates[e.code] = true;
    this.keyStates[e.key] = true;

    if (e.code === 'KeyC') {
      this.cameraFollow.setMode(
        this.cameraFollow.getMode() === 'CHASE'
          ? 'CLOSE'
          : this.cameraFollow.getMode() === 'CLOSE'
          ? 'HOOD'
          : this.cameraFollow.getMode() === 'HOOD'
          ? 'CINEMATIC'
          : 'CHASE'
      );
      this.onCycleCameraCallback?.();
    }

    if (e.code === 'Escape') {
      this.onTogglePauseCallback?.();
    }

    if (e.code === 'KeyR') {
      this.onResetCarCallback?.();
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.keyStates[e.code] = false;
    this.keyStates[e.key] = false;
  }

  public getInputs(): CarInputs {
    let throttle = 0;
    let brake = 0;
    let steer = 0;
    let handbrake = false;

    // Full support for W/A/S/D and Arrow Keys (both code and key)
    if (
      this.keyStates['KeyW'] ||
      this.keyStates['ArrowUp'] ||
      this.keyStates['Up']
    ) {
      throttle += 1.0;
    }

    if (
      this.keyStates['KeyS'] ||
      this.keyStates['ArrowDown'] ||
      this.keyStates['Down']
    ) {
      brake += 1.0;
    }

    // Steer Left: A or ArrowLeft
    if (
      this.keyStates['KeyA'] ||
      this.keyStates['ArrowLeft'] ||
      this.keyStates['Left']
    ) {
      steer += 1.0; // Positive turnRate moves towards +X (screen Left)
    }

    // Steer Right: D or ArrowRight
    if (
      this.keyStates['KeyD'] ||
      this.keyStates['ArrowRight'] ||
      this.keyStates['Right']
    ) {
      steer -= 1.0; // Negative turnRate moves towards -X (screen Right)
    }

    if (this.keyStates['Space']) {
      handbrake = true;
    }

    // Combine with mobile touch inputs
    throttle = Math.max(throttle, this.touchInputs.throttle);
    brake = Math.max(brake, this.touchInputs.brake);
    if (Math.abs(this.touchInputs.steer) > 0.01) {
      steer = this.touchInputs.steer;
    }
    handbrake = handbrake || this.touchInputs.handbrake;

    return { throttle, brake, steer, handbrake };
  }

  public applyCollisionImpact(impactVelocity: THREE.Vector3, trauma: number = 0.6) {
    // Reduce speed and push car backward / sideways
    this.physics.velocity.add(impactVelocity);
    const forwardSpeed = this.physics.velocity.dot(this.physics.forward);
    this.physics.speedKmh = forwardSpeed * 3.6;

    // Physical jolt to pitch and roll
    this.physics.bodyPitch = (Math.random() - 0.5) * 0.15;
    this.physics.bodyRoll = (Math.random() - 0.5) * 0.2;

    // Shake camera
    this.cameraFollow.addTrauma(trauma);

    // Mobile tactile vibration on crash
    triggerHaptic([30, 25, 50]);
  }

  public update(dt: number, roadManager: RoadManager, isNight: boolean) {
    const inputs = this.getInputs();

    // Update vehicle physics
    this.physics.update(dt, inputs, roadManager);

    // Sync 3D model with physics
    this.model.group.position.copy(this.physics.position);
    this.model.group.rotation.set(0, this.physics.headingAngle, 0);

    // Update car visuals (wheels, roll, steering wheel, lights, digital cluster)
    this.model.updateVisuals(
      this.physics.wheelSpinAngle,
      this.physics.currentSteerAngle,
      this.physics.bodyRoll,
      this.physics.bodyPitch,
      inputs.brake > 0,
      isNight,
      dt,
      this.physics
    );

    // Update chase/interior camera
    this.cameraFollow.update(dt, this.physics, this.model);
  }

  public resetPosition(roadManager: RoadManager, trafficSide: TrafficSide) {
    this.physics.resetToRoad(roadManager, trafficSide);
    this.cameraFollow.snapToCar(this.physics, this.model);
  }

  public dispose(scene: THREE.Scene) {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    scene.remove(this.model.group);
    this.model.dispose();
  }
}
