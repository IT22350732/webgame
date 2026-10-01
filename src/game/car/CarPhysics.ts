import * as THREE from 'three';
import { CarConfig, TrafficSide } from '../../types/game';
import { RoadManager } from '../road/RoadManager';
import { clamp, damp } from '../../utils/math';

export interface CarInputs {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 to 1
  handbrake: boolean;
}

export class CarPhysics {
  public config: CarConfig;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public forward: THREE.Vector3;
  public up: THREE.Vector3;
  public headingAngle: number = 0; // Yaw angle in radians
  public speedKmh: number = 0;
  public currentSteerAngle: number = 0;
  public wheelSpinAngle: number = 0;
  public bodyRoll: number = 0;
  public bodyPitch: number = 0;
  public roadDistance: number = 0;
  public lateralOffset: number = 0;
  public isOnRoad: boolean = true;
  public isOffroad: boolean = false;
  public rpm: number = 1000;
  public currentGear: number = 1;

  constructor(config: CarConfig) {
    this.config = config;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.forward = new THREE.Vector3(0, 0, 1);
    this.up = new THREE.Vector3(0, 1, 0);
  }

  public initPositionOnRoad(roadManager: RoadManager, trafficSide: TrafficSide) {
    this.roadDistance = 15;
    const frame = roadManager.getRoadFrame(this.roadDistance);
    // Lane offset: Left traffic = -2.0m, Right traffic = +2.0m
    const laneOffset = trafficSide === 'LEFT' ? -2.0 : 2.0;

    this.position.copy(frame.position).addScaledVector(frame.binormal, laneOffset);
    this.position.y += 0.3; // resting on tires
    this.forward.copy(frame.tangent);
    this.headingAngle = Math.atan2(this.forward.x, this.forward.z);
    this.velocity.set(0, 0, 0);
    this.speedKmh = 0;
    this.lateralOffset = laneOffset;
    this.isOnRoad = true;
    this.isOffroad = false;
  }

  public resetToRoad(roadManager: RoadManager, trafficSide: TrafficSide) {
    this.initPositionOnRoad(roadManager, trafficSide);
  }

  public update(dt: number, inputs: CarInputs, roadManager: RoadManager) {
    // 1. Current speed
    const forwardSpeed = this.velocity.dot(this.forward);
    this.speedKmh = forwardSpeed * 3.6;

    // 2. Adaptive steering angle based on speed
    const speedFactor = clamp(Math.abs(this.speedKmh) / 120, 0, 1);
    const maxSteerAngle = THREE.MathUtils.lerp(0.55 * this.config.handling, 0.12 * this.config.handling, speedFactor);
    const targetSteerAngle = inputs.steer * maxSteerAngle;
    this.currentSteerAngle = damp(this.currentSteerAngle, targetSteerAngle, 12, dt);

    // 3. Acceleration & Braking Forces
    const maxSpeedMs = this.config.topSpeed / 3.6;
    let driveForce = 0;

    if (inputs.throttle > 0) {
      const powerCurve = Math.max(0, 1 - Math.max(0, forwardSpeed) / maxSpeedMs);
      driveForce = this.config.acceleration * inputs.throttle * powerCurve;
    }

    let brakeForce = 0;
    if (inputs.brake > 0) {
      if (forwardSpeed > 0.5) {
        brakeForce = this.config.braking * inputs.brake;
      } else {
        // Reverse
        driveForce = -this.config.acceleration * 0.4 * inputs.brake;
      }
    }

    if (inputs.handbrake) {
      brakeForce += this.config.braking * 1.5;
    }

    // 4. Resistance & Drag
    let rollingFriction = 0.8;
    const airDrag = 0.0022 * forwardSpeed * Math.abs(forwardSpeed);

    // Check if offroad
    const closestDist = roadManager.findClosestDistance(this.position, this.roadDistance);
    this.roadDistance = closestDist;
    const roadFrame = roadManager.getRoadFrame(this.roadDistance);

    // Lateral distance from road center
    const toCar = new THREE.Vector3().subVectors(this.position, roadFrame.position);
    this.lateralOffset = toCar.dot(roadFrame.binormal);
    const roadHalfWidth = 4.2;
    this.isOnRoad = Math.abs(this.lateralOffset) <= roadHalfWidth;
    this.isOffroad = !this.isOnRoad;

    if (this.isOffroad) {
      rollingFriction *= 3.8; // offroad drag
    }

    // Total net forward acceleration
    let netForwardAccel = driveForce - Math.sign(forwardSpeed) * brakeForce - Math.sign(forwardSpeed) * rollingFriction - airDrag;

    // Apply forward speed change
    let newForwardSpeed = forwardSpeed + netForwardAccel * dt;
    // Stop jitter at zero
    if (Math.abs(forwardSpeed) < 0.2 && inputs.throttle === 0 && inputs.brake === 0) {
      newForwardSpeed = 0;
    }

    // 5. Yaw Rotation (turning)
    const turnRate = (newForwardSpeed / Math.max(1, this.config.length)) * Math.tan(this.currentSteerAngle);
    this.headingAngle += turnRate * dt;

    this.forward.set(Math.sin(this.headingAngle), 0, Math.cos(this.headingAngle)).normalize();
    this.velocity.copy(this.forward).multiplyScalar(newForwardSpeed);

    // 6. Update position
    this.position.addScaledVector(this.velocity, dt);

    // 7. Ground height snapping & suspension
    let targetGroundY = roadFrame.position.y;
    if (this.isOffroad) {
      // Offroad natural slope
      targetGroundY = roadFrame.position.y - (Math.abs(this.lateralOffset) - roadHalfWidth) * 0.2;
    }

    const targetY = targetGroundY + this.config.wheelRadius;
    this.position.y = damp(this.position.y, targetY, 15, dt);

    // 8. Body Roll & Pitch
    const lateralG = (turnRate * newForwardSpeed) / 9.81;
    const targetRoll = clamp(lateralG * 0.12, -0.15, 0.15) - roadFrame.bankAngle * 0.7;
    this.bodyRoll = damp(this.bodyRoll, targetRoll, 8, dt);

    const accelG = netForwardAccel / 9.81;
    const targetPitch = clamp(-accelG * 0.05, -0.08, 0.08);
    this.bodyPitch = damp(this.bodyPitch, targetPitch, 8, dt);

    // 9. Wheel spin
    const wheelRotDelta = (newForwardSpeed * dt) / this.config.wheelRadius;
    this.wheelSpinAngle = (this.wheelSpinAngle + wheelRotDelta) % (Math.PI * 2);

    // 10. Engine RPM & Gear calculation
    const absKmh = Math.abs(this.speedKmh);
    if (absKmh < 30) this.currentGear = 1;
    else if (absKmh < 60) this.currentGear = 2;
    else if (absKmh < 95) this.currentGear = 3;
    else if (absKmh < 135) this.currentGear = 4;
    else this.currentGear = 5;

    const gearRatio = [1, 3.2, 2.1, 1.4, 1.0, 0.75][this.currentGear];
    const targetRpm = clamp(900 + (absKmh * 38 * gearRatio) + (inputs.throttle * 1200), 900, 7200);
    this.rpm = damp(this.rpm, targetRpm, 6, dt);
  }
}
