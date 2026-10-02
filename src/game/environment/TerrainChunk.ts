import * as THREE from 'three';
import { RoadCurve } from '../road/RoadCurve';
import { TerrainNoise } from '../../utils/noise';
import { BIOMES } from '../world/biomeConfigs';
import { BiomeType } from '../../types/game';

const CHUNK_WIDTH = 320; // 160m left, 160m right of road
const WIDTH_SEGMENTS = 40;
const LENGTH_SEGMENTS = 26;

export class TerrainChunk {
  public id: number;
  public startDist: number;
  public endDist: number;
  public biome: BiomeType;
  public group: THREE.Group;
  private terrainMesh: THREE.Mesh | null = null;
  private oceanMesh: THREE.Mesh | null = null;
  private riverMesh: THREE.Mesh | null = null;
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
    const biomeConfig = BIOMES[this.biome] || BIOMES.COUNTRYSIDE;
    const vertCols = WIDTH_SEGMENTS + 1;
    const vertRows = LENGTH_SEGMENTS + 1;
    const totalVerts = vertCols * vertRows;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);

    const baseColor = new THREE.Color(biomeConfig.terrainColor);
    const secColor = new THREE.Color(biomeConfig.terrainSecondaryColor);
    const rockColor = new THREE.Color(biomeConfig.rockColor);
    const cliffColor = new THREE.Color('#6b7280'); // natural granite cliff strata
    const sandColor = new THREE.Color('#d4be92'); // warm natural beach & bank sand
    const riverbedColor = new THREE.Color('#475569'); // wet river pebbles & silt

    const hasRiver = !!biomeConfig.hasRiver;
    const hasOcean = !!biomeConfig.hasOcean;
    const length = this.endDist - this.startDist;

    let vIdx = 0;
    let uvIdx = 0;

    for (let r = 0; r <= LENGTH_SEGMENTS; r++) {
      const fracL = r / LENGTH_SEGMENTS;
      const dist = this.startDist + fracL * length;
      const frame = curve.getRoadFrame(dist);

      // Natural meandering river on the right side of the road
      const riverCenterU = 34 + noise.sample2D(dist * 0.007, 73.1) * 8;
      const riverHalfW = 9.5;

      for (let c = 0; c <= WIDTH_SEGMENTS; c++) {
        const fracW = c / WIDTH_SEGMENTS;
        const u = (fracW - 0.5) * CHUNK_WIDTH;

        const worldX = frame.position.x + frame.binormal.x * u;
        const worldZ = frame.position.z + frame.binormal.z * u;

        // Multi-octave natural rolling hills & mountains
        const n1 = noise.fbm2D(worldX * biomeConfig.hillFrequency, worldZ * biomeConfig.hillFrequency, 4);
        const detailNoise = noise.sample2D(worldX * 0.02, worldZ * 0.02) * 1.4;
        let naturalY = frame.position.y + n1 * biomeConfig.mountainHeight + detailNoise;

        // Carve river channel into terrain when biome has river
        if (hasRiver) {
          const distToRiver = Math.abs(u - riverCenterU);
          if (distToRiver < riverHalfW + 7.0) {
            const dropBlend = THREE.MathUtils.smoothstep(distToRiver, riverHalfW + 7.0, riverHalfW * 0.35);
            const riverBedY = frame.position.y - 3.2;
            naturalY = THREE.MathUtils.lerp(naturalY, riverBedY, dropBlend);
          }
        }

        // Coastal beach & ocean slope
        if (hasOcean && u > 22) {
          const oceanDrop = Math.min(1.0, (u - 22) / 38);
          naturalY = THREE.MathUtils.lerp(naturalY, -1.8, oceanDrop);
        }

        // Smooth embankment blending near road
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

    // Natural slope-based and moisture-based vertex coloring
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

      // Riverbed sand and shoreline reeds
      if (hasRiver) {
        const midDist = (this.startDist + this.endDist) * 0.5;
        const frame = curve.getRoadFrame(midDist);
        const u = (wx - frame.position.x) * frame.binormal.x + (wz - frame.position.z) * frame.binormal.z;
        const riverCenterU = 34 + noise.sample2D(midDist * 0.007, 73.1) * 8;
        const distToRiver = Math.abs(u - riverCenterU);

        if (distToRiver < 8.5) {
          vertexColor.lerp(riverbedColor, 0.88);
        } else if (distToRiver < 13.0) {
          const bankBlend = 1.0 - (distToRiver - 8.5) / 4.5;
          vertexColor.lerp(new THREE.Color('#15803d'), bankBlend * 0.75);
        }
      }

      // Steep cliff detection: if slope is steep (ny < 0.72), blend exposed rock strata
      if (ny < 0.72) {
        const cliffMix = THREE.MathUtils.smoothstep(ny, 0.72, 0.45);
        vertexColor.lerp(cliffColor, cliffMix * 0.85);
      }

      // High mountain peaks
      if (wy > 28) {
        const rockMix = THREE.MathUtils.clamp((wy - 28) / 20, 0, 1);
        vertexColor.lerp(rockColor, rockMix * 0.7);
      }

      // Coastal beach sand
      if (hasOcean && wy < 0.5) {
        vertexColor.lerp(sandColor, 0.9);
      }

      colors[cIdx] = vertexColor.r;
      colors[cIdx + 1] = vertexColor.g;
      colors[cIdx + 2] = vertexColor.b;
      cIdx += 3;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Realistic Smooth-Shaded Natural Terrain
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.84,
      metalness: 0.03,
      flatShading: false,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);

    // 1. Serene Winding River (crystal clear sparkling stream)
    if (hasRiver) {
      const riverGeo = new THREE.PlaneGeometry(24, length + 8, 12, 12);
      const riverMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(biomeConfig.riverColor || '#1d8a8a'),
        roughness: 0.06,
        metalness: 0.35,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const river = new THREE.Mesh(riverGeo, riverMat);
      river.rotation.x = -Math.PI / 2;
      const midDist = (this.startDist + this.endDist) * 0.5;
      const midFrame = curve.getRoadFrame(midDist);
      const midRiverU = 34 + noise.sample2D(midDist * 0.007, 73.1) * 8;
      river.position.set(
        midFrame.position.x + midFrame.binormal.x * midRiverU,
        midFrame.position.y - 1.4,
        midFrame.position.z + midFrame.binormal.z * midRiverU
      );
      this.group.add(river);
      this.riverMesh = river;
    }

    // 2. Realistic Coastal Ocean
    if (hasOcean) {
      const oceanGeo = new THREE.PlaneGeometry(180, length + 20, 16, 16);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(biomeConfig.riverColor || '#168aad'),
        roughness: 0.08,
        metalness: 0.32,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
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
    const biomeConfig = BIOMES[this.biome] || BIOMES.COUNTRYSIDE;
    const treeTypes = biomeConfig.treeTypes || ['oak'];
    const dummy = new THREE.Object3D();
    const length = this.endDist - this.startDist;
    const hasRiver = !!biomeConfig.hasRiver;
    const hasOcean = !!biomeConfig.hasOcean;

    const baseTreeCount = Math.floor(28 * biomeConfig.foliageDensity);
    const numRocks = 9;
    const numFlowers = 24;

    // 1. Instanced Multi-Species Trees & Palms
    if (treeTypes.length > 0 && baseTreeCount > 0) {
      const treesPerType = Math.ceil(baseTreeCount / treeTypes.length);

      for (let tIdx = 0; tIdx < treeTypes.length; tIdx++) {
        const typeName = treeTypes[tIdx];
        const treeAsset = treeGeos[typeName] || treeGeos['oak'] || treeGeos['pine'];
        if (!treeAsset) continue;

        const treeMesh = new THREE.InstancedMesh(treeAsset.geo, treeAsset.mat, treesPerType);
        treeMesh.castShadow = true;
        treeMesh.receiveShadow = true;

        let validCount = 0;
        for (let i = 0; i < treesPerType; i++) {
          const frac = (i + tIdx * 0.3) / treesPerType;
          const dist = this.startDist + ((frac * length) % length);
          const frame = curve.getRoadFrame(dist);

          const side = (i + tIdx) % 2 === 0 ? 1 : -1;
          const offsetDist = 8.5 + (noise.sample2D(dist * 0.08, (i + tIdx * 10) * 3.7) + 1) * 42;
          const u = side * offsetDist;

          const riverCenterU = 34 + noise.sample2D(dist * 0.007, 73.1) * 8;

          // Don't plant inside river or ocean water
          if (hasRiver && Math.abs(u - riverCenterU) < 11.0) continue;
          if (hasOcean && u > 24) continue;

          const wx = frame.position.x + frame.binormal.x * u;
          const wz = frame.position.z + frame.binormal.z * u;
          const wy =
            frame.position.y +
            noise.fbm2D(wx * biomeConfig.hillFrequency, wz * biomeConfig.hillFrequency, 3) *
              biomeConfig.mountainHeight;

          const scale = 0.85 + ((i * 17 + tIdx * 7) % 6) * 0.09;
          dummy.position.set(wx, wy, wz);
          dummy.rotation.set(0, (i * 1.5 + tIdx * 2.1) % (Math.PI * 2), 0);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();

          treeMesh.setMatrixAt(validCount++, dummy.matrix);
        }

        treeMesh.count = validCount;
        treeMesh.instanceMatrix.needsUpdate = true;
        this.group.add(treeMesh);
        this.instancedTrees.push(treeMesh);
      }
    }

    // 2. Instanced Geological Rocks & Riverbed Boulders
    if (rockGeoMat && numRocks > 0) {
      const rockMesh = new THREE.InstancedMesh(rockGeoMat.geo, rockGeoMat.mat, numRocks);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;

      let validRocks = 0;
      for (let i = 0; i < numRocks; i++) {
        const dist = this.startDist + (i / numRocks) * length + 3;
        const frame = curve.getRoadFrame(dist);
        // Distribute some along the roadside verge, and some along the riverbank
        const placeAtRiver = hasRiver && i % 2 === 0;
        const riverCenterU = 34 + noise.sample2D(dist * 0.007, 73.1) * 8;
        const u = placeAtRiver ? riverCenterU + ((i % 2 === 0 ? 1 : -1) * 11.5) : (i % 2 === 0 ? 1 : -1) * (6.5 + (i * 4) % 16);

        const wx = frame.position.x + frame.binormal.x * u;
        const wz = frame.position.z + frame.binormal.z * u;
        const wy = frame.position.y - (placeAtRiver ? 1.0 : 0.2);

        const s = 0.75 + (i % 4) * 0.35;
        dummy.position.set(wx, wy, wz);
        dummy.rotation.set((i * 0.7) % 3, (i * 1.4) % 3, 0);
        dummy.scale.set(s, s * 0.85, s);
        dummy.updateMatrix();

        rockMesh.setMatrixAt(validRocks++, dummy.matrix);
      }
      rockMesh.count = validRocks;
      rockMesh.instanceMatrix.needsUpdate = true;
      this.group.add(rockMesh);
      this.instancedRocks = rockMesh;
    }

    // 3. Instanced Roadside Wildflowers, Grass & River Reeds
    if (flowerGeoMat && numFlowers > 0 && this.biome !== 'DESERT') {
      const flowerMesh = new THREE.InstancedMesh(flowerGeoMat.geo, flowerGeoMat.mat, numFlowers);
      let validFlowers = 0;

      for (let i = 0; i < numFlowers; i++) {
        const dist = this.startDist + (i / numFlowers) * length + 1.5;
        const frame = curve.getRoadFrame(dist);
        const placeAtRiver = hasRiver && i % 3 === 0;
        const riverCenterU = 34 + noise.sample2D(dist * 0.007, 73.1) * 8;
        const u = placeAtRiver ? riverCenterU + ((i % 2 === 0 ? 1 : -1) * 10.8) : (i % 2 === 0 ? 1 : -1) * (5.2 + (i % 5) * 0.85);

        const wx = frame.position.x + frame.binormal.x * u;
        const wz = frame.position.z + frame.binormal.z * u;
        const wy = frame.position.y - (placeAtRiver ? 0.8 : 0.05);

        dummy.position.set(wx, wy, wz);
        dummy.rotation.set(0, (i * 1.8) % 6.28, 0);
        const s = 0.85 + (i % 3) * 0.3;
        dummy.scale.set(s, s, s);
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
    if (this.riverMesh) {
      this.riverMesh.geometry.dispose();
      this.group.remove(this.riverMesh);
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
