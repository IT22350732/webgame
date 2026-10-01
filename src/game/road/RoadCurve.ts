import * as THREE from 'three';
import { SeededRandom } from '../../utils/random';
import { TerrainNoise } from '../../utils/noise';
import { BiomeType } from '../../types/game';
import { getBiomeForDistance } from '../world/biomeConfigs';

export interface RoadAnchor {
  index: number;
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  bankAngle: number;
  biome: BiomeType;
  hasGuardRail: boolean;
  isBridge: boolean;
}

export class RoadCurve {
  public seed: number;
  private rng: SeededRandom;
  private noise: TerrainNoise;
  private anchors: RoadAnchor[] = [];
  public readonly nodeSpacing = 60; // meters between control anchors

  constructor(seed: number = 42) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    this.noise = new TerrainNoise(seed + 101);
    this.initFirstAnchors();
  }

  public setSeed(seed: number) {
    this.seed = seed;
    this.rng.setSeed(seed);
    this.noise.setSeed(seed + 101);
    this.anchors = [];
    this.initFirstAnchors();
  }

  private initFirstAnchors() {
    // Start at origin, pointing straight ahead (+Z direction)
    const initialPos = new THREE.Vector3(0, 0, 0);
    const initialDir = new THREE.Vector3(0, 0, 1);

    this.anchors.push({
      index: 0,
      position: initialPos.clone(),
      tangent: initialDir.clone(),
      bankAngle: 0,
      biome: getBiomeForDistance(0),
      hasGuardRail: false,
      isBridge: false,
    });

    // Generate initial stretch of 25 anchors (~1500m ahead)
    for (let i = 1; i <= 25; i++) {
      this.generateNextAnchor();
    }
  }

  public ensureGeneratedUpTo(targetDistance: number) {
    const neededIndex = Math.ceil(targetDistance / this.nodeSpacing) + 10;
    while (this.anchors.length <= neededIndex) {
      this.generateNextAnchor();
    }
  }

  private generateNextAnchor() {
    const prev = this.anchors[this.anchors.length - 1];
    const index = prev.index + 1;
    const dist = index * this.nodeSpacing;
    const biome = getBiomeForDistance(dist);

    // Continuous smooth directional turn using low-frequency noise
    // Gives long sweeping highways with occasional tighter mountain turns
    const freq = biome === 'MOUNTAINS' ? 0.012 : 0.005;
    const curveNoise = this.noise.sample2D(dist * freq, 13.37);
    const elevationNoise = this.noise.fbm2D(dist * 0.004, 77.1, 3);

    // Calculate heading angle
    const prevAngle = Math.atan2(prev.tangent.x, prev.tangent.z);
    // Limit delta turn so road never bends unrealistically
    const maxDeltaTurn = biome === 'MOUNTAINS' ? 0.28 : 0.14;
    const deltaTurn = curveNoise * maxDeltaTurn;
    const nextAngle = prevAngle + deltaTurn;

    const dir = new THREE.Vector3(Math.sin(nextAngle), 0, Math.cos(nextAngle)).normalize();

    // Elevation changes
    let targetY = 0;
    if (biome === 'MOUNTAINS') {
      targetY = elevationNoise * 45;
    } else if (biome === 'COUNTRYSIDE') {
      targetY = elevationNoise * 14;
    } else if (biome === 'FOREST') {
      targetY = elevationNoise * 18;
    } else if (biome === 'COASTAL') {
      targetY = Math.max(2, elevationNoise * 10);
    } else if (biome === 'DESERT') {
      targetY = elevationNoise * 22;
    } else {
      targetY = elevationNoise * 8;
    }

    // Smooth elevation change from previous node
    const maxStepY = 5.0;
    const clampedY = THREE.MathUtils.clamp(targetY, prev.position.y - maxStepY, prev.position.y + maxStepY);

    const nextPos = new THREE.Vector3(
      prev.position.x + dir.x * this.nodeSpacing,
      clampedY,
      prev.position.z + dir.z * this.nodeSpacing
    );

    // Banking angle on curves for realistic feel
    const bankAngle = THREE.MathUtils.clamp(-deltaTurn * 0.6, -0.15, 0.15);

    // Bridges occur when traversing deep valleys or coastal inlets
    const isBridge = biome === 'COASTAL' && Math.abs(curveNoise) > 0.65;
    const hasGuardRail = biome === 'MOUNTAINS' || isBridge || Math.abs(deltaTurn) > 0.15;

    this.anchors.push({
      index,
      position: nextPos,
      tangent: dir,
      bankAngle,
      biome,
      hasGuardRail,
      isBridge,
    });
  }

  // Evaluates smooth position, tangent, and bank angle at distance along road
  public getRoadFrame(distance: number): {
    position: THREE.Vector3;
    tangent: THREE.Vector3;
    normal: THREE.Vector3;
    binormal: THREE.Vector3;
    bankAngle: number;
    biome: BiomeType;
    hasGuardRail: boolean;
    isBridge: boolean;
  } {
    this.ensureGeneratedUpTo(distance + this.nodeSpacing * 2);

    const d = Math.max(0, distance);
    const rawIdx = d / this.nodeSpacing;
    const i = Math.floor(rawIdx);
    const t = rawIdx - i;

    const p0 = (this.anchors[Math.max(0, i - 1)] || this.anchors[0]).position;
    const p1 = (this.anchors[i] || this.anchors[0]).position;
    const p2 = (this.anchors[i + 1] || this.anchors[this.anchors.length - 1]).position;
    const p3 = (this.anchors[Math.min(this.anchors.length - 1, i + 2)] || p2).position;

    // Catmull-Rom position
    const pos = this.evalCatmullRom(p0, p1, p2, p3, t);

    // Tangent via numerical derivative
    const epsilon = 0.01;
    const tNext = Math.min(1, t + epsilon);
    const posNext = this.evalCatmullRom(p0, p1, p2, p3, tNext);
    const tangent = new THREE.Vector3().subVectors(posNext, pos).normalize();

    // Bank angle interpolation
    const b1 = (this.anchors[i] || this.anchors[0]).bankAngle;
    const b2 = (this.anchors[i + 1] || this.anchors[this.anchors.length - 1]).bankAngle;
    const bankAngle = THREE.MathUtils.lerp(b1, b2, t);

    // Standard up vector tilted by bankAngle
    const standardUp = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, standardUp).normalize();
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    // Apply banking
    if (Math.abs(bankAngle) > 0.001) {
      binormal.applyAxisAngle(tangent, bankAngle);
      normal.crossVectors(binormal, tangent).normalize();
    }

    const currAnchor = this.anchors[i] || this.anchors[0];

    return {
      position: pos,
      tangent,
      normal,
      binormal,
      bankAngle,
      biome: currAnchor.biome,
      hasGuardRail: currAnchor.hasGuardRail,
      isBridge: currAnchor.isBridge,
    };
  }

  // Find closest road distance for any arbitrary 3D world position
  public findClosestDistance(worldPos: THREE.Vector3, hintDistance: number = 0): number {
    let bestDist = hintDistance;
    let minSq = Infinity;

    // Search around hint distance in increments
    const searchRange = 120;
    const step = 4;
    const start = Math.max(0, hintDistance - searchRange);
    const end = hintDistance + searchRange;

    for (let d = start; d <= end; d += step) {
      const frame = this.getRoadFrame(d);
      const distSq = frame.position.distanceToSquared(worldPos);
      if (distSq < minSq) {
        minSq = distSq;
        bestDist = d;
      }
    }

    // Fine refinement pass
    for (let d = bestDist - step; d <= bestDist + step; d += 0.5) {
      if (d < 0) continue;
      const frame = this.getRoadFrame(d);
      const distSq = frame.position.distanceToSquared(worldPos);
      if (distSq < minSq) {
        minSq = distSq;
        bestDist = d;
      }
    }

    return bestDist;
  }

  private evalCatmullRom(
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3,
    t: number
  ): THREE.Vector3 {
    const t2 = t * t;
    const t3 = t2 * t;

    const f0 = -0.5 * t3 + t2 - 0.5 * t;
    const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
    const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
    const f3 = 0.5 * t3 - 0.5 * t2;

    return new THREE.Vector3(
      p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
      p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3,
      p0.z * f0 + p1.z * f1 + p2.z * f2 + p3.z * f3
    );
  }
}
