import * as THREE from 'three';
import { RoadCurve } from './RoadCurve';
import { getRoadTexture } from './RoadTexture';
import { BiomeType } from '../../types/game';

const ROAD_WIDTH = 8.6; // Two lanes + shoulders
const SEGMENT_STEP = 2.5; // Sampling interval along spline (meters)

export class RoadSegment {
  public id: number;
  public startDist: number;
  public endDist: number;
  public biome: BiomeType;
  public group: THREE.Group;
  public roadMaterial: THREE.MeshStandardMaterial;
  private roadMesh: THREE.Mesh | null = null;
  private guardRailMesh: THREE.Mesh | null = null;
  private bridgePillarsMesh: THREE.Mesh | null = null;

  constructor(id: number, startDist: number, endDist: number, curve: RoadCurve) {
    this.id = id;
    this.startDist = startDist;
    this.endDist = endDist;
    this.group = new THREE.Group();

    const sample = curve.getRoadFrame((startDist + endDist) * 0.5);
    this.biome = sample.biome;

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: getRoadTexture(),
      roughness: 0.78,
      metalness: 0.12,
      flatShading: false,
    });

    this.buildGeometry(curve);
  }

  public setWetness(wetFraction: number) {
    // Smoothly transition between dry asphalt and glistening wet asphalt
    this.roadMaterial.roughness = THREE.MathUtils.lerp(0.78, 0.16, wetFraction);
    this.roadMaterial.metalness = THREE.MathUtils.lerp(0.12, 0.45, wetFraction);
  }

  private buildGeometry(curve: RoadCurve) {
    const length = this.endDist - this.startDist;
    const steps = Math.ceil(length / SEGMENT_STEP);
    const vertCount = (steps + 1) * 2;
    const indicesCount = steps * 6;

    const positions = new Float32Array(vertCount * 3);
    const normals = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = new Uint32Array(indicesCount);

    const halfW = ROAD_WIDTH * 0.5;

    let pIdx = 0;
    let nIdx = 0;
    let uvIdx = 0;

    let hasGuardRail = false;
    let isBridge = false;

    for (let i = 0; i <= steps; i++) {
      const dist = this.startDist + i * SEGMENT_STEP;
      const frame = curve.getRoadFrame(dist);

      if (frame.hasGuardRail) hasGuardRail = true;
      if (frame.isBridge) isBridge = true;

      // Left vertex
      const leftPos = new THREE.Vector3().copy(frame.position).addScaledVector(frame.binormal, -halfW);
      // Right vertex
      const rightPos = new THREE.Vector3().copy(frame.position).addScaledVector(frame.binormal, halfW);

      // Positions
      positions[pIdx] = leftPos.x;
      positions[pIdx + 1] = leftPos.y + 0.05;
      positions[pIdx + 2] = leftPos.z;

      positions[pIdx + 3] = rightPos.x;
      positions[pIdx + 4] = rightPos.y + 0.05;
      positions[pIdx + 5] = rightPos.z;
      pIdx += 6;

      // Normals
      normals[nIdx] = frame.normal.x;
      normals[nIdx + 1] = frame.normal.y;
      normals[nIdx + 2] = frame.normal.z;

      normals[nIdx + 3] = frame.normal.x;
      normals[nIdx + 4] = frame.normal.y;
      normals[nIdx + 5] = frame.normal.z;
      nIdx += 6;

      // UVs: U spans 0 to 1 across road, V repeats every 24 meters
      const v = dist / 24.0;
      uvs[uvIdx] = 0;
      uvs[uvIdx + 1] = v;

      uvs[uvIdx + 2] = 1;
      uvs[uvIdx + 3] = v;
      uvIdx += 4;
    }

    // Build indices
    let idx = 0;
    for (let i = 0; i < steps; i++) {
      const row1 = i * 2;
      const row2 = (i + 1) * 2;

      // Triangle 1
      indices[idx++] = row1;
      indices[idx++] = row1 + 1;
      indices[idx++] = row2;

      // Triangle 2
      indices[idx++] = row1 + 1;
      indices[idx++] = row2 + 1;
      indices[idx++] = row2;
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    roadGeo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    roadGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    roadGeo.setIndex(new THREE.BufferAttribute(indices, 1));
    roadGeo.computeVertexNormals();

    this.roadMesh = new THREE.Mesh(roadGeo, this.roadMaterial);
    this.roadMesh.receiveShadow = true;
    this.group.add(this.roadMesh);

    // 3D Metallic Guardrails & Reflective Guide Posts
    if (hasGuardRail) {
      this.buildGuardRails(curve, steps);
    } else {
      this.buildGuidePosts(curve, steps);
    }

    // Bridge parapets & concrete pillars
    if (isBridge) {
      this.buildBridgePillars(curve);
    }
  }

  private buildGuardRails(curve: RoadCurve, steps: number) {
    const postGeo = new THREE.BoxGeometry(0.12, 0.85, 0.12);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const reflectorMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });

    const railPositions: number[] = [];
    const halfW = ROAD_WIDTH * 0.5 + 0.15;
    const railHeight = 0.65;

    for (let i = 0; i <= steps; i += 2) {
      const dist = this.startDist + i * SEGMENT_STEP;
      const frame = curve.getRoadFrame(dist);

      // Left post
      const leftBase = new THREE.Vector3().copy(frame.position).addScaledVector(frame.binormal, -halfW);
      const postL = new THREE.Mesh(postGeo, postMat);
      postL.position.set(leftBase.x, leftBase.y + 0.4, leftBase.z);
      this.group.add(postL);

      // Right post
      const rightBase = new THREE.Vector3().copy(frame.position).addScaledVector(frame.binormal, halfW);
      const postR = new THREE.Mesh(postGeo, postMat);
      postR.position.set(rightBase.x, rightBase.y + 0.4, rightBase.z);
      this.group.add(postR);

      // Reflectors on posts every 10m
      if (i % 4 === 0) {
        const refL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), reflectorMat);
        refL.position.set(leftBase.x, leftBase.y + 0.75, leftBase.z);
        this.group.add(refL);

        const refR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), reflectorMat);
        refR.position.set(rightBase.x, rightBase.y + 0.75, rightBase.z);
        this.group.add(refR);
      }

      // Connecting horizontal beam lines
      if (i < steps) {
        const nextDist = this.startDist + (i + 2) * SEGMENT_STEP;
        const nextFrame = curve.getRoadFrame(nextDist);
        const nextLeft = new THREE.Vector3().copy(nextFrame.position).addScaledVector(nextFrame.binormal, -halfW);
        const nextRight = new THREE.Vector3().copy(nextFrame.position).addScaledVector(nextFrame.binormal, halfW);

        railPositions.push(
          leftBase.x, leftBase.y + railHeight, leftBase.z,
          nextLeft.x, nextLeft.y + railHeight, nextLeft.z,
          rightBase.x, rightBase.y + railHeight, rightBase.z,
          nextRight.x, nextRight.y + railHeight, nextRight.z
        );
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPositions, 3));
    const railMat = new THREE.LineBasicMaterial({ color: 0xcfd8dc, linewidth: 3 });
    const rails = new THREE.LineSegments(lineGeo, railMat);
    this.group.add(rails);
  }

  private buildGuidePosts(curve: RoadCurve, steps: number) {
    const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const amberRefMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.9 });
    const whiteRefMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9 });

    const halfW = ROAD_WIDTH * 0.5 + 0.4;

    for (let i = 0; i <= steps; i += 8) {
      const dist = this.startDist + i * SEGMENT_STEP;
      const frame = curve.getRoadFrame(dist);

      // Left delineator (white reflector)
      const leftBase = new THREE.Vector3().copy(frame.position).addScaledVector(frame.binormal, -halfW);
      const postL = new THREE.Mesh(postGeo, postMat);
      postL.position.set(leftBase.x, leftBase.y + 0.45, leftBase.z);
      this.group.add(postL);

      const refL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), whiteRefMat);
      refL.position.set(leftBase.x, leftBase.y + 0.8, leftBase.z);
      this.group.add(refL);

      // Right delineator (amber reflector)
      const rightBase = new THREE.Vector3().copy(frame.position).addScaledVector(frame.binormal, halfW);
      const postR = new THREE.Mesh(postGeo, postMat);
      postR.position.set(rightBase.x, rightBase.y + 0.45, rightBase.z);
      this.group.add(postR);

      const refR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05), amberRefMat);
      refR.position.set(rightBase.x, rightBase.y + 0.8, rightBase.z);
      this.group.add(refR);
    }
  }

  private buildBridgePillars(curve: RoadCurve) {
    const midDist = (this.startDist + this.endDist) * 0.5;
    const frame = curve.getRoadFrame(midDist);

    if (frame.position.y > 5) {
      const pillarGeo = new THREE.CylinderGeometry(1.4, 1.8, frame.position.y + 6, 12);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.85,
        metalness: 0.1,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(frame.position.x, (frame.position.y - 3) * 0.5, frame.position.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);
      this.bridgePillarsMesh = pillar;

      // Concrete side parapet walls along bridge
      const parapetGeo = new THREE.BoxGeometry(0.35, 0.9, this.endDist - this.startDist);
      const parapetMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

      const halfW = ROAD_WIDTH * 0.5 + 0.1;
      const parapetL = new THREE.Mesh(parapetGeo, parapetMat);
      parapetL.position.set(frame.position.x - frame.binormal.x * halfW, frame.position.y + 0.45, frame.position.z - frame.binormal.z * halfW);
      parapetL.rotation.y = Math.atan2(frame.tangent.x, frame.tangent.z);
      this.group.add(parapetL);

      const parapetR = new THREE.Mesh(parapetGeo, parapetMat);
      parapetR.position.set(frame.position.x + frame.binormal.x * halfW, frame.position.y + 0.45, frame.position.z + frame.binormal.z * halfW);
      parapetR.rotation.y = Math.atan2(frame.tangent.x, frame.tangent.z);
      this.group.add(parapetR);
    }
  }

  public dispose() {
    if (this.roadMesh) {
      this.roadMesh.geometry.dispose();
      this.group.remove(this.roadMesh);
    }
    if (this.guardRailMesh) {
      this.guardRailMesh.geometry.dispose();
      this.group.remove(this.guardRailMesh);
    }
    if (this.bridgePillarsMesh) {
      this.bridgePillarsMesh.geometry.dispose();
      this.group.remove(this.bridgePillarsMesh);
    }
    while (this.group.children.length > 0) {
      const child = this.group.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.group.remove(child);
    }
  }
}
