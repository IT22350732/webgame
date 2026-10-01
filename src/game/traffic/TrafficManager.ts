import * as THREE from 'three';
import { TrafficSide } from '../../types/game';
import { RoadManager } from '../road/RoadManager';
import { CarController } from '../car/CarController';
import { audioManager } from '../audio/AudioManager';

interface TrafficCar {
  id: number;
  roadDistance: number;
  speedKmh: number;
  laneOffset: number;
  mesh: THREE.Group;
  wheels: THREE.Mesh[];
  wheelSpin: number;
  wobbleAngle: number;
  collisionCooldown: number;
}

const TRAFFIC_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b', '#f8fafc'];

export class TrafficManager {
  public group: THREE.Group;
  private cars: Map<number, TrafficCar> = new Map();
  private nextCarId = 1;
  private density: 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  private trafficSide: TrafficSide = 'LEFT';
  private spawnCooldown = 0;

  // Impact Sparks System
  private sparkParticles: THREE.Points | null = null;
  private sparkVelocities: Float32Array | null = null;
  private sparkCount = 80;
  private sparkLife = 0;

  constructor(scene: THREE.Scene, trafficSide: TrafficSide = 'LEFT') {
    this.group = new THREE.Group();
    this.trafficSide = trafficSide;
    scene.add(this.group);
    this.initSparks(scene);
  }

  private initSparks(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sparkCount * 3);
    this.sparkVelocities = new Float32Array(this.sparkCount * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.28,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sparkParticles = new THREE.Points(geo, mat);
    scene.add(this.sparkParticles);
  }

  private triggerSparks(pos: THREE.Vector3) {
    if (!this.sparkParticles || !this.sparkVelocities) return;
    const positions = this.sparkParticles.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y + 0.5;
      positions[i * 3 + 2] = pos.z;

      this.sparkVelocities[i * 3] = (Math.random() - 0.5) * 14;
      this.sparkVelocities[i * 3 + 1] = Math.random() * 8 + 2;
      this.sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    (this.sparkParticles.material as THREE.PointsMaterial).opacity = 1.0;
    this.sparkLife = 0.5;
  }

  public setDensity(density: 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH') {
    this.density = density;
    if (density === 'OFF') {
      this.clear();
    }
  }

  public setTrafficSide(side: TrafficSide) {
    this.trafficSide = side;
  }

  private getMaxCars(): number {
    switch (this.density) {
      case 'OFF': return 0;
      case 'LOW': return 4;
      case 'MEDIUM': return 8;
      case 'HIGH': return 14;
    }
  }

  private createTrafficMesh(colorHex: string): { mesh: THREE.Group; wheels: THREE.Mesh[] } {
    const group = new THREE.Group();
    const wheels: THREE.Mesh[] = [];

    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.4,
      metalness: 0.3,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.7, 4.0);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    // Roof
    const roofGeo = new THREE.BoxGeometry(1.5, 0.55, 2.2);
    const roof = new THREE.Mesh(roofGeo, glassMat);
    roof.position.set(0, 1.1, -0.2);
    roof.castShadow = true;
    group.add(roof);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    const positions = [
      [-0.85, 0.32, 1.2],
      [0.85, 0.32, 1.2],
      [-0.85, 0.32, -1.2],
      [0.85, 0.32, -1.2],
    ];

    positions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);
    });

    return { mesh: group, wheels };
  }

  public update(
    dt: number,
    playerDist: number,
    roadManager: RoadManager,
    playerCarController?: CarController | null
  ) {
    // Update impact spark particles
    if (this.sparkParticles && this.sparkLife > 0 && this.sparkVelocities) {
      this.sparkLife -= dt;
      const positions = this.sparkParticles.geometry.attributes.position.array as Float32Array;
      const mat = this.sparkParticles.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, this.sparkLife / 0.5);

      for (let i = 0; i < this.sparkCount; i++) {
        positions[i * 3] += this.sparkVelocities[i * 3] * dt;
        positions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
        positions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * dt;
        this.sparkVelocities[i * 3 + 1] -= 9.8 * dt; // gravity
      }
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (this.density === 'OFF') return;

    const maxCars = this.getMaxCars();

    // 1. Spawning new traffic cars ahead or behind player
    this.spawnCooldown -= dt;
    if (this.cars.size < maxCars && this.spawnCooldown <= 0) {
      this.spawnCooldown = 2.0;

      // Spawn ahead between 140m and 350m
      const spawnAhead = Math.random() > 0.3;
      const distOffset = spawnAhead
        ? 140 + Math.random() * 220
        : -(80 + Math.random() * 100);

      const spawnDist = Math.max(20, playerDist + distOffset);

      // Determine lane:
      // In LEFT traffic: Player is in left lane (-2.0m).
      // Same-direction traffic in left lane (-2.0m), or oncoming in right lane (+2.0m).
      const isOncoming = Math.random() > 0.45;
      let laneOffset = this.trafficSide === 'LEFT' ? -2.0 : 2.0;
      let targetSpeed = 70 + Math.random() * 25; // 70 to 95 km/h

      if (isOncoming) {
        laneOffset = this.trafficSide === 'LEFT' ? 2.0 : -2.0;
        targetSpeed = -(65 + Math.random() * 20); // travelling opposite direction
      }

      const color = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
      const { mesh, wheels } = this.createTrafficMesh(color);

      const car: TrafficCar = {
        id: this.nextCarId++,
        roadDistance: spawnDist,
        speedKmh: targetSpeed,
        laneOffset,
        mesh,
        wheels,
        wheelSpin: 0,
        wobbleAngle: 0,
        collisionCooldown: 0,
      };

      this.cars.set(car.id, car);
      this.group.add(mesh);
    }

    const playerPos = playerCarController?.physics.position;
    const playerVel = playerCarController?.physics.velocity;

    // 2. Update existing cars and test collisions
    for (const [id, car] of this.cars.entries()) {
      if (car.collisionCooldown > 0) {
        car.collisionCooldown -= dt;
      }
      if (Math.abs(car.wobbleAngle) > 0.001) {
        car.wobbleAngle = THREE.MathUtils.lerp(car.wobbleAngle, 0, dt * 4.0);
      }

      const speedMs = car.speedKmh / 3.6;
      car.roadDistance += speedMs * dt;

      // Despawn if too far ahead (> 480m) or too far behind (< -180m)
      const relDist = car.roadDistance - playerDist;
      if (relDist < -180 || relDist > 480) {
        this.group.remove(car.mesh);
        this.cars.delete(id);
        continue;
      }

      // Position car on road
      const frame = roadManager.getRoadFrame(car.roadDistance);
      const carPos = new THREE.Vector3().copy(frame.position).addScaledVector(frame.binormal, car.laneOffset);
      car.mesh.position.copy(carPos);

      // Orientation (if oncoming, face backwards)
      const forwardDir = car.speedKmh >= 0 ? frame.tangent : frame.tangent.clone().negate();
      const yaw = Math.atan2(forwardDir.x, forwardDir.z) + car.wobbleAngle;
      car.mesh.rotation.set(0, yaw, 0);

      // Wheel spin
      const spinDelta = (Math.abs(speedMs) * dt) / 0.32;
      car.wheelSpin = (car.wheelSpin + spinDelta) % (Math.PI * 2);
      for (const w of car.wheels) {
        w.rotation.x = car.wheelSpin;
      }

      // 3. COLLISION DETECTION WITH PLAYER VEHICLE
      if (playerPos && playerVel && playerCarController && car.collisionCooldown <= 0) {
        const distToPlayer = carPos.distanceTo(playerPos);

        // Bounding collision envelope: ~3.2m center distance
        if (distToPlayer < 3.2) {
          car.collisionCooldown = 0.8; // Prevent repeated triggers

          // Collision normal pointing away from traffic car towards player
          const impactNormal = new THREE.Vector3().subVectors(playerPos, carPos).normalize();
          const relSpeed = playerVel.length() + Math.abs(speedMs);

          // Impact force calculation
          const impactIntensity = Math.min(1.0, relSpeed / 30);

          // 1. Play synthesized crash crunch & thud sound!
          audioManager.playCrash(impactIntensity);

          // 2. Spawn spark particles at collision point
          const contactPoint = new THREE.Vector3().addVectors(playerPos, carPos).multiplyScalar(0.5);
          this.triggerSparks(contactPoint);

          // 3. Apply physical bounce/deceleration to player car
          const bounceForce = impactNormal.clone().multiplyScalar(Math.max(12, relSpeed * 0.8));
          bounceForce.y = 1.5;
          playerCarController.applyCollisionImpact(bounceForce, 0.8 * impactIntensity);

          // 4. Traffic vehicle also reacts! Shove traffic car away and wobble
          car.wobbleAngle = (Math.random() - 0.5) * 0.45;
          car.speedKmh += (car.speedKmh >= 0 ? 15 : -15);
          car.laneOffset += impactNormal.x > 0 ? -0.8 : 0.8;
        }
      }
    }
  }

  public getActiveCount(): number {
    return this.cars.size;
  }

  public clear() {
    for (const [, car] of this.cars) {
      this.group.remove(car.mesh);
    }
    this.cars.clear();
  }
}
