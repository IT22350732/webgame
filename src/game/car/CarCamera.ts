import * as THREE from 'three';
import { CameraMode } from '../../types/game';
import { CarPhysics } from './CarPhysics';
import { CarModel } from './CarModel';
import { damp } from '../../utils/math';

export class CarCamera {
  public camera: THREE.PerspectiveCamera;
  private currentMode: CameraMode = 'CHASE';
  private targetPos = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private baseFov = 65;
  private cinematicAngle = 0;
  private trauma = 0; // 0 to 1 for collision shake
  private tempQuat = new THREE.Quaternion();
  private tempUp = new THREE.Vector3();
  private tempAxis = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.baseFov = camera.fov;
  }

  public setMode(mode: CameraMode) {
    this.currentMode = mode;
    if (mode === 'HOOD') {
      this.camera.near = 0.05;
      this.baseFov = 68;
      this.camera.fov = 68;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.near = 0.3;
      this.baseFov = 65;
      this.camera.fov = 65;
      this.camera.up.set(0, 1, 0);
      this.camera.updateProjectionMatrix();
    }
  }

  public getMode(): CameraMode {
    return this.currentMode;
  }

  public setBaseFov(fov: number) {
    this.baseFov = fov;
  }

  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public update(dt: number, physics: CarPhysics, model?: CarModel) {
    const carPos = physics.position;
    const carForward = physics.forward;
    const speed = physics.speedKmh;

    // Dynamic FOV increase at higher speeds for exhilarating sense of speed
    const speedFovBoost = THREE.MathUtils.clamp((Math.abs(speed) / 160) * 10, 0, 14);
    const targetFov = this.baseFov + speedFovBoost;
    this.camera.fov = damp(this.camera.fov, targetFov, 4, dt);
    this.camera.updateProjectionMatrix();

    if (this.currentMode === 'HOOD' && model) {
      // ==========================================
      // ADVANCED FIRST-PERSON DRIVER COCKPIT VIEW
      // ==========================================
      if (this.camera.near !== 0.05) {
        this.camera.near = 0.05;
        this.camera.updateProjectionMatrix();
      }

      model.bodyMesh.updateWorldMatrix(true, false);
      model.cockpitCameraMount.getWorldPosition(this.targetPos);
      model.cockpitCameraTarget.getWorldPosition(this.targetLookAt);

      // G-force head movement / acceleration inertia
      const forwardG = (physics.speedKmh / 180) * 0.025;
      const turnG = physics.bodyRoll * 0.05;

      this.targetPos.x += Math.sin(physics.headingAngle + Math.PI / 2) * turnG;
      this.targetPos.z -= carForward.z * forwardG;
      this.targetPos.y += Math.abs(turnG) * 0.1;

      // Direct, responsive cockpit eye tracking
      this.camera.position.x = damp(this.camera.position.x, this.targetPos.x, 38, dt);
      this.camera.position.y = damp(this.camera.position.y, this.targetPos.y, 38, dt);
      this.camera.position.z = damp(this.camera.position.z, this.targetPos.z, 38, dt);

      this.currentLookAt.x = damp(this.currentLookAt.x, this.targetLookAt.x, 32, dt);
      this.currentLookAt.y = damp(this.currentLookAt.y, this.targetLookAt.y, 32, dt);
      this.currentLookAt.z = damp(this.currentLookAt.z, this.targetLookAt.z, 32, dt);

      // Compute vehicle's local UP vector transformed to world coordinates
      model.bodyMesh.getWorldQuaternion(this.tempQuat);
      this.tempUp.set(0, 1, 0).applyQuaternion(this.tempQuat);

      // Subtle dynamic driver head flexion into turns (banks with car naturally)
      this.tempAxis.set(0, 0, 1).applyQuaternion(this.tempQuat);
      this.tempUp.applyAxisAngle(this.tempAxis, -physics.bodyRoll * 0.20);

      this.camera.up.copy(this.tempUp);
      this.camera.lookAt(this.currentLookAt);
    } else if (this.currentMode === 'CHASE') {
      if (this.camera.near !== 0.3) {
        this.camera.near = 0.3;
        this.camera.updateProjectionMatrix();
      }
      this.camera.up.set(0, 1, 0);

      // Third-person chase camera
      const followDist = 7.0 + (Math.abs(speed) / 180) * 1.5;
      const followHeight = 2.4;

      this.targetPos.set(
        carPos.x - carForward.x * followDist,
        carPos.y + followHeight,
        carPos.z - carForward.z * followDist
      );

      this.targetLookAt.set(
        carPos.x + carForward.x * 12,
        carPos.y + 1.2,
        carPos.z + carForward.z * 12
      );

      this.camera.position.x = damp(this.camera.position.x, this.targetPos.x, 8, dt);
      this.camera.position.y = damp(this.camera.position.y, this.targetPos.y, 6, dt);
      this.camera.position.z = damp(this.camera.position.z, this.targetPos.z, 8, dt);

      this.currentLookAt.x = damp(this.currentLookAt.x, this.targetLookAt.x, 10, dt);
      this.currentLookAt.y = damp(this.currentLookAt.y, this.targetLookAt.y, 8, dt);
      this.currentLookAt.z = damp(this.currentLookAt.z, this.targetLookAt.z, 10, dt);

      this.camera.lookAt(this.currentLookAt);
    } else if (this.currentMode === 'CLOSE') {
      if (this.camera.near !== 0.3) {
        this.camera.near = 0.3;
        this.camera.updateProjectionMatrix();
      }
      this.camera.up.set(0, 1, 0);

      // Close sports chase camera
      const followDist = 4.8;
      const followHeight = 1.6;

      this.targetPos.set(
        carPos.x - carForward.x * followDist,
        carPos.y + followHeight,
        carPos.z - carForward.z * followDist
      );

      this.targetLookAt.set(
        carPos.x + carForward.x * 10,
        carPos.y + 0.9,
        carPos.z + carForward.z * 10
      );

      this.camera.position.x = damp(this.camera.position.x, this.targetPos.x, 12, dt);
      this.camera.position.y = damp(this.camera.position.y, this.targetPos.y, 8, dt);
      this.camera.position.z = damp(this.camera.position.z, this.targetPos.z, 12, dt);

      this.currentLookAt.x = damp(this.currentLookAt.x, this.targetLookAt.x, 12, dt);
      this.currentLookAt.y = damp(this.currentLookAt.y, this.targetLookAt.y, 10, dt);
      this.currentLookAt.z = damp(this.currentLookAt.z, this.targetLookAt.z, 12, dt);

      this.camera.lookAt(this.currentLookAt);
    } else {
      if (this.camera.near !== 0.3) {
        this.camera.near = 0.3;
        this.camera.updateProjectionMatrix();
      }
      this.camera.up.set(0, 1, 0);

      // CINEMATIC camera
      this.cinematicAngle += dt * 0.2;
      const radius = 9.0;
      this.targetPos.set(
        carPos.x + Math.sin(this.cinematicAngle) * radius,
        carPos.y + 2.5 + Math.sin(this.cinematicAngle * 0.5) * 0.8,
        carPos.z + Math.cos(this.cinematicAngle) * radius
      );

      this.targetLookAt.set(carPos.x, carPos.y + 0.8, carPos.z);

      this.camera.position.x = damp(this.camera.position.x, this.targetPos.x, 5, dt);
      this.camera.position.y = damp(this.camera.position.y, this.targetPos.y, 5, dt);
      this.camera.position.z = damp(this.camera.position.z, this.targetPos.z, 5, dt);

      this.currentLookAt.x = damp(this.currentLookAt.x, this.targetLookAt.x, 8, dt);
      this.currentLookAt.y = damp(this.currentLookAt.y, this.targetLookAt.y, 8, dt);
      this.currentLookAt.z = damp(this.currentLookAt.z, this.targetLookAt.z, 8, dt);

      this.camera.lookAt(this.currentLookAt);
    }

    // Apply collision camera shake / trauma
    if (this.trauma > 0.001) {
      const shake = this.trauma * this.trauma;
      const ox = (Math.random() * 2 - 1) * 0.35 * shake;
      const oy = (Math.random() * 2 - 1) * 0.25 * shake;
      const oz = (Math.random() * 2 - 1) * 0.35 * shake;

      this.camera.position.x += ox;
      this.camera.position.y += oy;
      this.camera.position.z += oz;

      this.trauma = Math.max(0, this.trauma - dt * 2.5);
    }
  }

  public snapToCar(physics: CarPhysics, model?: CarModel) {
    if (this.currentMode === 'HOOD' && model) {
      if (this.camera.near !== 0.05) {
        this.camera.near = 0.05;
        this.camera.updateProjectionMatrix();
      }
      model.bodyMesh.updateWorldMatrix(true, false);
      model.cockpitCameraMount.getWorldPosition(this.targetPos);
      model.cockpitCameraTarget.getWorldPosition(this.targetLookAt);
      this.camera.position.copy(this.targetPos);
      this.currentLookAt.copy(this.targetLookAt);

      model.bodyMesh.getWorldQuaternion(this.tempQuat);
      this.tempUp.set(0, 1, 0).applyQuaternion(this.tempQuat);
      this.camera.up.copy(this.tempUp);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    this.camera.up.set(0, 1, 0);
    const carPos = physics.position;
    const carForward = physics.forward;
    this.targetPos.set(carPos.x - carForward.x * 7, carPos.y + 2.4, carPos.z - carForward.z * 7);
    this.targetLookAt.set(carPos.x + carForward.x * 12, carPos.y + 1.2, carPos.z + carForward.z * 12);
    this.camera.position.copy(this.targetPos);
    this.currentLookAt.copy(this.targetLookAt);
    this.camera.lookAt(this.currentLookAt);
  }
}
