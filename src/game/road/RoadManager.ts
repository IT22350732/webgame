import * as THREE from 'three';
import { RoadCurve } from './RoadCurve';
import { RoadSegment } from './RoadSegment';

const SEGMENT_LENGTH = 80; // 80 meters per segment
const LOOKAHEAD_DIST = 720; // Generate up to 720m ahead
const BEHIND_DESPAWN_DIST = 160; // Remove segments 160m behind player

export class RoadManager {
  public curve: RoadCurve;
  public group: THREE.Group;
  private segments: Map<number, RoadSegment> = new Map();
  private maxSpawnedSegmentId = -1;

  constructor(scene: THREE.Scene, seed: number = 42) {
    this.curve = new RoadCurve(seed);
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  public setSeed(seed: number) {
    this.clear();
    this.curve.setSeed(seed);
    this.maxSpawnedSegmentId = -1;
  }

  public update(playerRoadDistance: number) {
    const minNeededDist = Math.max(0, playerRoadDistance - BEHIND_DESPAWN_DIST);
    const maxNeededDist = playerRoadDistance + LOOKAHEAD_DIST;

    const startSegId = Math.floor(minNeededDist / SEGMENT_LENGTH);
    const endSegId = Math.ceil(maxNeededDist / SEGMENT_LENGTH);

    // 1. Spawn missing segments
    for (let id = startSegId; id <= endSegId; id++) {
      if (!this.segments.has(id)) {
        const segStart = id * SEGMENT_LENGTH;
        const segEnd = (id + 1) * SEGMENT_LENGTH;
        const segment = new RoadSegment(id, segStart, segEnd, this.curve);
        this.segments.set(id, segment);
        this.group.add(segment.group);
        if (id > this.maxSpawnedSegmentId) {
          this.maxSpawnedSegmentId = id;
        }
      }
    }

    // 2. Despawn obsolete segments behind player
    for (const [id, segment] of this.segments.entries()) {
      if (segment.endDist < playerRoadDistance - BEHIND_DESPAWN_DIST) {
        segment.dispose();
        this.group.remove(segment.group);
        this.segments.delete(id);
      }
    }
  }

  public setWetness(amount: number) {
    for (const [, segment] of this.segments) {
      segment.setWetness(amount);
    }
  }

  public getRoadFrame(distance: number) {
    return this.curve.getRoadFrame(distance);
  }

  public findClosestDistance(worldPos: THREE.Vector3, hintDistance: number = 0) {
    return this.curve.findClosestDistance(worldPos, hintDistance);
  }

  public getActiveSegmentCount(): number {
    return this.segments.size;
  }

  public clear() {
    for (const [, seg] of this.segments) {
      seg.dispose();
      this.group.remove(seg.group);
    }
    this.segments.clear();
    this.maxSpawnedSegmentId = -1;
  }
}
