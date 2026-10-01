import * as THREE from 'three';
import { RoadCurve } from '../road/RoadCurve';
import { TerrainNoise } from '../../utils/noise';
import { BIOMES } from '../world/biomeConfigs';
import { BiomeType } from '../../types/game';

const CHUNK_WIDTH = 320; // 160m left, 160m right of road
const WIDTH_SEGMENTS = 36;
const LENGTH_SEGMENTS = 24;

export class TerrainChunk {
  public id: number;
  public startDist: number;
  public endDist: number;
  public biome: BiomeType;
  public group: THREE.Group;
  private terrainMesh: THREE.Mesh | null = null;
  private oceanMesh: THREE.Mesh | null = null;
  private instancedTrees: THREE.InstancedMesh[] = [];
  private instancedRocks: THREE.InstancedMesh | null = null;
  private instancedFlowers: THREE.InstancedMesh | null = null;

  constructor(
    id: number,
    startDist: number,
    endDist: number,
    curve: RoadCurve,
    noise: TerrainNoise,
    treeGeos: { [key: string]: { geo: THREE.BufferGeometry; mat: THREE.Material } },
    rockGeoMat: { geo: THREE.BufferGeometry; mat: THREE.Material },
    flowerGeoMat?: { geo: THREE.BufferGeometry; mat: THREE.Material }
  ) {
    this.id = id;
    this.startDist = startDist;
    this.endDist = endDist;
    this.group = new THREE.Group();

    const midFrame = curve.getRoadFrame((startDist + endDist) * 0.5);
    this.biome = midFrame.biome;

    this.buildTerrain(curve, noise);
    this.buildFoliage(curve, noise, treeGeos, rockGeoMat, flowerGeoMat);
  }

  private buildTerrain(curve: RoadCurve, noise: TerrainNoise) {
    const biomeConfig = BIOMES[this.biome];
    const vertCols = WIDTH_SEGMENTS + 1;
    const vertRows = LENGTH_SEGMENTS + 1;
    const totalVerts = vertCols * vertRows;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);

    const baseColor = new THREE.Color(biomeConfig.terrainColor);
    const secColor = new THREE.Color(biomeConfig.terrainSecondaryColor);
    const rockColor = new THREE.Color(biomeConfig.rockColor);
    const cliffColor = new THREE.Color('#3f3f46');
    const sandColor = new THREE.Color('#eab308');

    let vIdx = 0;
    let uvIdx = 0;

    const length = this.endDist - this.startDist;

    for (let r = 0; r <= LENGTH_SEGMENTS; r++) {
      const fracL = r / LENGTH_SEGMENTS;
      const dist = this.startDist + fracL * length;
      const frame = curve.getRoadFrame(dist);

      for (let c = 0; c <= WIDTH_SEGMENTS; c++) {
        const fracW = c / WIDTH_SEGMENTS;
        const u = (fracW - 0.5) * CHUNK_WIDTH;

        const worldX = frame.position.x + frame.binormal.x * u;
        const worldZ = frame.position.z + frame.binormal.z * u;

        // Multi-octave natural elevation
        const n1 = noise.fbm2D(worldX * biomeConfig.hillFrequency, worldZ * biomeConfig.hillFrequency, 4);
        const detailNoise = noise.sample2D(worldX * 0.02, worldZ * 0.02) * 1.5;
        let naturalY = frame.position.y + n1 * biomeConfig.mountainHeight + detailNoise;

        // Coastal beach & ocean slope
        if (this.biome === 'COASTAL' && u > 22) {
          const oceanDrop = Math.min(1.0, (u - 22) / 40);
          naturalY = THREE.MathUtils.lerp(naturalY, -1.8, oceanDrop);
        }

        // Embankment blending near road
        const absU = Math.abs(u);
        let finalY = naturalY;
        if (absU < 4.8) {
          finalY = frame.position.y;
        } else if (absU < 15.0) {
          const blend = THREE.MathUtils.smoothstep(absU, 4.8, 15.0);
          finalY = THREE.MathUtils.lerp(frame.position.y, naturalY, blend);
        }

        positions[vIdx] = worldX;
        positions[vIdx + 1] = finalY;
        positions[vIdx + 2] = worldZ;
        vIdx += 3;

        uvs[uvIdx] = fracW;
        uvs[uvIdx + 1] = fracL * 4.0;
        uvIdx += 2;
      }
    }

    // Build grid indices
    const indicesCount = WIDTH_SEGMENTS * LENGTH_SEGMENTS * 6;
    const indices = new Uint32Array(indicesCount);
    let iIdx = 0;

    for (let r = 0; r < LENGTH_SEGMENTS; r++) {
      for (let c = 0; c < WIDTH_SEGMENTS; c++) {
        const i0 = r * vertCols + c;
        const i1 = i0 + 1;
        const i2 = (r + 1) * vertCols + c;
        const i3 = i2 + 1;

        indices[iIdx++] = i0;
        indices[iIdx++] = i2;
        indices[iIdx++] = i1;

        indices[iIdx++] = i1;
        indices[iIdx++] = i2;
        indices[iIdx++] = i3;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();

    // Slope-based and elevation-based vertex coloring
    const normAttr = geo.attributes.normal.array as Float32Array;
    let cIdx = 0;

    for (let i = 0; i < totalVerts; i++) {
      const wx = positions[i * 3];
      const wy = positions[i * 3 + 1];
      const wz = positions[i * 3 + 2];
      const ny = normAttr[i * 3 + 1]; // vertical normal component

      const vertexColor = baseColor.clone();
      const nMix = (noise.sample2D(wx * 0.04, wz * 0.04) + 1) * 0.5;
      vertexColor.lerp(secColor, nMix);

      // Steep cliff detection: if slope is steep (ny < 0.72), blend exposed rock strata
      if (ny < 0.72) {
        const cliffMix = THREE.MathUtils.smoothstep(ny, 0.72, 0.45);
        vertexColor.lerp(cliffColor, cliffMix * 0.85);
      }

      // High mountain snow/granite peaks
      if (wy > 28) {
        const rockMix = THREE.MathUtils.clamp((wy - 28) / 20, 0, 1);
        vertexColor.lerp(rockColor, rockMix * 0.7);
      }

      // Coastal beach sand
      if (this.biome === 'COASTAL' && wy < 0.5) {
        vertexColor.lerp(sandColor, 0.9);
      }

      colors[cIdx] = vertexColor.r;
      colors[cIdx + 1] = vertexColor.g;
      colors[cIdx + 2] = vertexColor.b;
      cIdx += 3;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);

    // Realistic Coastal Water with Wave Shader
    if (this.biome === 'COASTAL') {
      const oceanGeo = new THREE.PlaneGeometry(180, length + 20, 16, 16);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.15,
        metalness: 0.4,
        transparent: true,
        opacity: 0.88,
      });
      const ocean = new THREE.Mesh(oceanGeo, oceanMat);
      ocean.rotation.x = -Math.PI / 2;
      const midFrame = curve.getRoadFrame((this.startDist + this.endDist) * 0.5);
      ocean.position.set(
        midFrame.position.x + midFrame.binormal.x * 75,
        -1.3,
        midFrame.position.z + midFrame.binormal.z * 75
      );
      this.group.add(ocean);
      this.oceanMesh = ocean;
    }
  }

  private buildFoliage(
    curve: RoadCurve,
    noise: TerrainNoise,
    treeGeos: { [key: string]: { geo: THREE.BufferGeometry; mat: THREE.Material } },
    rockGeoMat: { geo: THREE.BufferGeometry; mat: THREE.Material },
    flowerGeoMat?: { geo: THREE.BufferGeometry; mat: THREE.Material }
  ) {
    const biomeConfig = BIOMES[this.biome];
    const treeType = biomeConfig.treeTypes[0] || 'pine';
    const treeAsset = treeGeos[treeType] || treeGeos['pine'];

    const numTrees = Math.floor(22 * biomeConfig.foliageDensity);
    const numRocks = 7;
    const numFlowers = 12;

    const dummy = new THREE.Object3D();
    const length = this.endDist - this.startDist;

    // 1. Instanced Trees
    if (treeAsset && numTrees > 0) {
      const treeMesh = new THREE.InstancedMesh(treeAsset.geo, treeAsset.mat, numTrees);
      treeMesh.castShadow = true;
      treeMesh.receiveShadow = true;

      let validCount = 0;
      for (let i = 0; i < numTrees; i++) {
        const frac = (i + 0.5) / numTrees;
        const dist = this.startDist + frac * length;
        const frame = curve.getRoadFrame(dist);

        const side = i % 2 === 0 ? 1 : -1;
        const offsetDist = 8.8 + (noise.sample2D(dist * 0.1, i * 4.1) + 1) * 38;
        const u = side * offsetDist;

        if (this.biome === 'COASTAL' && u > 32) continue; // Don't plant inside water

        const wx = frame.position.x + frame.binormal.x * u;
        const wz = frame.position.z + frame.binormal.z * u;
        const wy = frame.position.y + noise.fbm2D(wx * biomeConfig.hillFrequency, wz * biomeConfig.hillFrequency, 3) * biomeConfig.mountainHeight;

        const scale = 0.85 + ((i * 19) % 7) * 0.08;
        dummy.position.set(wx, wy, wz);
        dummy.rotation.set(0, (i * 1.47) % (Math.PI * 2), 0);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        treeMesh.setMatrixAt(validCount++, dummy.matrix);
      }
      treeMesh.count = validCount;
      treeMesh.instanceMatrix.needsUpdate = true;
      this.group.add(treeMesh);
      this.instancedTrees.push(treeMesh);
    }

    // 2. Instanced Rocks
    if (rockGeoMat && numRocks > 0) {
      const rockMesh = new THREE.InstancedMesh(rockGeoMat.geo, rockGeoMat.mat, numRocks);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;

      let validRocks = 0;
      for (let i = 0; i < numRocks; i++) {
        const dist = this.startDist + (i / numRocks) * length + 4;
        const frame = curve.getRoadFrame(dist);
        const side = (i % 2 === 0 ? 1 : -1);
        const u = side * (6.5 + (i * 5) % 18);

        const wx = frame.position.x + frame.binormal.x * u;
        const wz = frame.position.z + frame.binormal.z * u;
        const wy = frame.position.y - 0.2;

        const s = 0.75 + (i % 3) * 0.45;
        dummy.position.set(wx, wy, wz);
        dummy.rotation.set((i * 0.8) % 3, (i * 1.6) % 3, 0);
        dummy.scale.set(s, s * 0.85, s);
        dummy.updateMatrix();

        rockMesh.setMatrixAt(validRocks++, dummy.matrix);
      }
      rockMesh.count = validRocks;
      rockMesh.instanceMatrix.needsUpdate = true;
      this.group.add(rockMesh);
      this.instancedRocks = rockMesh;
    }

    // 3. Instanced Roadside Wildflowers & Grass Clumps
    if (flowerGeoMat && numFlowers > 0 && this.biome !== 'DESERT') {
      const flowerMesh = new THREE.InstancedMesh(flowerGeoMat.geo, flowerGeoMat.mat, numFlowers);
      let validFlowers = 0;

      for (let i = 0; i < numFlowers; i++) {
        const dist = this.startDist + (i / numFlowers) * length + 2;
        const frame = curve.getRoadFrame(dist);
        const side = i % 2 === 0 ? 1 : -1;
        const u = side * (5.0 + (i % 4) * 0.8); // along the verge

        const wx = frame.position.x + frame.binormal.x * u;
        const wz = frame.position.z + frame.binormal.z * u;
        const wy = frame.position.y + 0.1;

        dummy.position.set(wx, wy, wz);
        dummy.rotation.set(0, (i * 1.2) % (Math.PI * 2), 0);
        dummy.scale.set(0.8, 0.8, 0.8);
        dummy.updateMatrix();

        flowerMesh.setMatrixAt(validFlowers++, dummy.matrix);
      }
      flowerMesh.count = validFlowers;
      flowerMesh.instanceMatrix.needsUpdate = true;
      this.group.add(flowerMesh);
      this.instancedFlowers = flowerMesh;
    }
  }

  public dispose() {
    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      this.group.remove(this.terrainMesh);
    }
    if (this.oceanMesh) {
      this.oceanMesh.geometry.dispose();
      this.group.remove(this.oceanMesh);
    }
    for (const tree of this.instancedTrees) {
      this.group.remove(tree);
      tree.dispose();
    }
    this.instancedTrees = [];
    if (this.instancedRocks) {
      this.group.remove(this.instancedRocks);
      this.instancedRocks.dispose();
    }
    if (this.instancedFlowers) {
      this.group.remove(this.instancedFlowers);
      this.instancedFlowers.dispose();
    }
  }
}
