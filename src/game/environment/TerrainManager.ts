import * as THREE from 'three';
import { RoadCurve } from '../road/RoadCurve';
import { TerrainNoise } from '../../utils/noise';
import { TerrainChunk } from './TerrainChunk';
import { createFoliageAssets, FoliageAssetCollection } from './foliageAssets';

const CHUNK_LENGTH = 80;
const LOOKAHEAD_DIST = 640;
const BEHIND_DESPAWN_DIST = 160;

export class TerrainManager {
  public group: THREE.Group;
  private chunks: Map<number, TerrainChunk> = new Map();
  private curve: RoadCurve;
  private noise: TerrainNoise;
  private foliage: FoliageAssetCollection;

  constructor(scene: THREE.Scene, curve: RoadCurve, seed: number = 42) {
    this.group = new THREE.Group();
    this.curve = curve;
    this.noise = new TerrainNoise(seed + 999);
    this.foliage = createFoliageAssets();
    scene.add(this.group);
  }

  public setSeed(seed: number, curve: RoadCurve) {
    this.clear();
    this.curve = curve;
    this.noise.setSeed(seed + 999);
  }

  public update(playerRoadDistance: number) {
    const minNeededDist = Math.max(0, playerRoadDistance - BEHIND_DESPAWN_DIST);
    const maxNeededDist = playerRoadDistance + LOOKAHEAD_DIST;

    const startChunkId = Math.floor(minNeededDist / CHUNK_LENGTH);
    const endChunkId = Math.ceil(maxNeededDist / CHUNK_LENGTH);

    // 1. Spawn missing chunks
    for (let id = startChunkId; id <= endChunkId; id++) {
      if (!this.chunks.has(id)) {
        const segStart = id * CHUNK_LENGTH;
        const segEnd = (id + 1) * CHUNK_LENGTH;
        const chunk = new TerrainChunk(
          id,
          segStart,
          segEnd,
          this.curve,
          this.noise,
          this.foliage.treeGeos,
          this.foliage.rockGeoMat,
          this.foliage.flowerGeoMat
        );
        this.chunks.set(id, chunk);
        this.group.add(chunk.group);
      }
    }

    // 2. Despawn obsolete chunks
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.endDist < playerRoadDistance - BEHIND_DESPAWN_DIST) {
        chunk.dispose();
        this.group.remove(chunk.group);
        this.chunks.delete(id);
      }
    }
  }

  public getActiveChunkCount(): number {
    return this.chunks.size;
  }

  public clear() {
    for (const [, chunk] of this.chunks) {
      chunk.dispose();
      this.group.remove(chunk.group);
    }
    this.chunks.clear();
  }
}
