import * as THREE from 'three';

export interface FoliageAssetCollection {
  treeGeos: { [key: string]: { geo: THREE.BufferGeometry; mat: THREE.Material } };
  rockGeoMat: { geo: THREE.BufferGeometry; mat: THREE.Material };
  flowerGeoMat: { geo: THREE.BufferGeometry; mat: THREE.Material };
}

// Utility to merge sub-geometries with distinct vertex colors cleanly
function mergeGeometriesWithColors(
  geos: { geo: THREE.BufferGeometry; offset: THREE.Vector3; scale?: THREE.Vector3; color: THREE.Color }[]
): THREE.BufferGeometry {
  let totalPositions = 0;
  let totalNormals = 0;
  let totalIndices = 0;

  for (const item of geos) {
    totalPositions += item.geo.attributes.position.count * 3;
    totalNormals += item.geo.attributes.normal.count * 3;
    if (item.geo.index) totalIndices += item.geo.index.count;
  }

  const mergedPos = new Float32Array(totalPositions);
  const mergedNorm = new Float32Array(totalNormals);
  const mergedColors = new Float32Array(totalPositions);
  const mergedIndices = new Uint32Array(totalIndices);

  let pOffset = 0;
  let iOffset = 0;
  let vertBase = 0;

  for (const item of geos) {
    const pos = item.geo.attributes.position.array as Float32Array;
    const norm = item.geo.attributes.normal.array as Float32Array;
    const s = item.scale || new THREE.Vector3(1, 1, 1);
    const col = item.color;

    for (let i = 0; i < pos.length; i += 3) {
      mergedPos[pOffset + i] = pos[i] * s.x + item.offset.x;
      mergedPos[pOffset + i + 1] = pos[i + 1] * s.y + item.offset.y;
      mergedPos[pOffset + i + 2] = pos[i + 2] * s.z + item.offset.z;

      mergedNorm[pOffset + i] = norm[i];
      mergedNorm[pOffset + i + 1] = norm[i + 1];
      mergedNorm[pOffset + i + 2] = norm[i + 2];

      mergedColors[pOffset + i] = col.r;
      mergedColors[pOffset + i + 1] = col.g;
      mergedColors[pOffset + i + 2] = col.b;
    }

    if (item.geo.index) {
      const idx = item.geo.index.array as Uint32Array;
      for (let i = 0; i < idx.length; i++) {
        mergedIndices[iOffset + i] = idx[i] + vertBase;
      }
      iOffset += idx.length;
    }

    vertBase += item.geo.attributes.position.count;
    pOffset += pos.length;
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  result.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
  result.setAttribute('color', new THREE.BufferAttribute(mergedColors, 3));
  result.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
  result.computeVertexNormals();
  return result;
}

export function createFoliageAssets(): FoliageAssetCollection {
  // Shared Natural Foliage Material
  const naturalFoliageMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.76,
    metalness: 0.04,
    flatShading: false,
  });

  const barkBrown = new THREE.Color('#423023');
  const lightBark = new THREE.Color('#524032');
  const birchWhite = new THREE.Color('#d1d5db');
  const palmWood = new THREE.Color('#4d3c2b');

  // 1. Realistic Multi-Tiered Mountain Spruce / Pine Tree
  const pineTrunk = new THREE.CylinderGeometry(0.22, 0.38, 3.4, 8);
  const pineBough1 = new THREE.ConeGeometry(2.4, 2.7, 8);
  const pineBough2 = new THREE.ConeGeometry(2.0, 2.4, 8);
  const pineBough3 = new THREE.ConeGeometry(1.5, 2.1, 8);
  const pineBough4 = new THREE.ConeGeometry(1.0, 1.8, 8);

  const pineGeo = mergeGeometriesWithColors([
    { geo: pineTrunk, offset: new THREE.Vector3(0, 1.7, 0), color: barkBrown },
    { geo: pineBough1, offset: new THREE.Vector3(0, 3.2, 0), color: new THREE.Color('#1e4d2b') },
    { geo: pineBough2, offset: new THREE.Vector3(0, 4.5, 0), color: new THREE.Color('#2d6a4f') },
    { geo: pineBough3, offset: new THREE.Vector3(0, 5.7, 0), color: new THREE.Color('#40916c') },
    { geo: pineBough4, offset: new THREE.Vector3(0, 6.7, 0), color: new THREE.Color('#52b788') },
  ]);

  // 2. Realistic Organic Deciduous Oak
  const oakTrunk = new THREE.CylinderGeometry(0.36, 0.58, 3.8, 8);
  const oakCanopy1 = new THREE.DodecahedronGeometry(2.4, 1);
  const oakCanopy2 = new THREE.DodecahedronGeometry(1.9, 1);
  const oakCanopy3 = new THREE.DodecahedronGeometry(1.7, 1);
  const oakCanopy4 = new THREE.DodecahedronGeometry(1.6, 1);

  const oakGeo = mergeGeometriesWithColors([
    { geo: oakTrunk, offset: new THREE.Vector3(0, 1.9, 0), color: barkBrown },
    { geo: oakCanopy1, offset: new THREE.Vector3(0, 4.6, 0), color: new THREE.Color('#4a7c36') },
    { geo: oakCanopy2, offset: new THREE.Vector3(-1.0, 4.0, 0.8), color: new THREE.Color('#5d8f43') },
    { geo: oakCanopy3, offset: new THREE.Vector3(1.0, 4.2, -0.7), color: new THREE.Color('#6ea450') },
    { geo: oakCanopy4, offset: new THREE.Vector3(0, 5.8, 0), color: new THREE.Color('#7cb342') },
  ]);

  // 3. Tropical Rainforest Jungle Tree / Canopy Palm
  const jungleTrunk = new THREE.CylinderGeometry(0.38, 0.65, 4.2, 8);
  const jungleCanopyCenter = new THREE.DodecahedronGeometry(2.8, 1);
  const jungleFrond1 = new THREE.ConeGeometry(3.2, 1.2, 7);
  const jungleFrond2 = new THREE.ConeGeometry(2.6, 1.0, 7);
  const jungleUnderstory = new THREE.DodecahedronGeometry(1.6, 1);

  const jungleGeo = mergeGeometriesWithColors([
    { geo: jungleTrunk, offset: new THREE.Vector3(0, 2.1, 0), color: new THREE.Color('#38281e') },
    { geo: jungleCanopyCenter, offset: new THREE.Vector3(0, 5.2, 0), color: new THREE.Color('#1b4332') },
    { geo: jungleFrond1, offset: new THREE.Vector3(0, 5.0, 0), scale: new THREE.Vector3(1.3, 0.5, 1.3), color: new THREE.Color('#2d6a4f') },
    { geo: jungleFrond2, offset: new THREE.Vector3(0, 5.8, 0), scale: new THREE.Vector3(1.1, 0.5, 1.1), color: new THREE.Color('#40916c') },
    { geo: jungleUnderstory, offset: new THREE.Vector3(0.8, 4.0, 0.9), color: new THREE.Color('#52b788') },
  ]);

  // 4. Weeping River Willow (Graceful riverside tree with pendulous branches)
  const willowTrunk = new THREE.CylinderGeometry(0.32, 0.48, 3.6, 7);
  const willowMain = new THREE.DodecahedronGeometry(2.2, 1);
  const willowDrape1 = new THREE.ConeGeometry(2.4, 2.8, 7);
  const willowDrape2 = new THREE.ConeGeometry(2.8, 2.5, 7);

  const willowGeo = mergeGeometriesWithColors([
    { geo: willowTrunk, offset: new THREE.Vector3(0, 1.8, 0), color: lightBark },
    { geo: willowMain, offset: new THREE.Vector3(0, 4.5, 0), color: new THREE.Color('#4f772d') },
    { geo: willowDrape1, offset: new THREE.Vector3(0, 3.8, 0), scale: new THREE.Vector3(1.2, -0.9, 1.2), color: new THREE.Color('#60993e') },
    { geo: willowDrape2, offset: new THREE.Vector3(0, 3.4, 0), scale: new THREE.Vector3(1.35, -0.8, 1.35), color: new THREE.Color('#74a143') },
  ]);

  // 5. Coastal / Oasis Coconut Palm
  const palmTrunkLower = new THREE.CylinderGeometry(0.24, 0.34, 2.8, 7);
  const palmTrunkUpper = new THREE.CylinderGeometry(0.18, 0.24, 2.8, 7);
  const palmFrond1 = new THREE.ConeGeometry(2.8, 0.8, 7);
  const palmFrond2 = new THREE.ConeGeometry(2.3, 0.7, 7);
  const coconuts = new THREE.DodecahedronGeometry(0.5, 0);

  const palmGeo = mergeGeometriesWithColors([
    { geo: palmTrunkLower, offset: new THREE.Vector3(0, 1.4, 0), color: palmWood },
    { geo: palmTrunkUpper, offset: new THREE.Vector3(0.28, 3.9, 0), color: palmWood },
    { geo: coconuts, offset: new THREE.Vector3(0.35, 5.0, 0), color: new THREE.Color('#5c3d1e') },
    { geo: palmFrond1, offset: new THREE.Vector3(0.42, 5.2, 0), scale: new THREE.Vector3(1.3, 0.45, 1.3), color: new THREE.Color('#16a34a') },
    { geo: palmFrond2, offset: new THREE.Vector3(0.42, 4.8, 0), scale: new THREE.Vector3(1.5, 0.45, 1.5), color: new THREE.Color('#22c55e') },
  ]);

  // 6. Silver Birch
  const birchTrunk = new THREE.CylinderGeometry(0.18, 0.28, 4.4, 7);
  const birchFoliage1 = new THREE.ConeGeometry(1.6, 3.4, 7);
  const birchFoliage2 = new THREE.ConeGeometry(1.2, 2.6, 7);

  const birchGeo = mergeGeometriesWithColors([
    { geo: birchTrunk, offset: new THREE.Vector3(0, 2.2, 0), color: birchWhite },
    { geo: birchFoliage1, offset: new THREE.Vector3(0, 4.2, 0), color: new THREE.Color('#65a30d') },
    { geo: birchFoliage2, offset: new THREE.Vector3(0, 5.6, 0), color: new THREE.Color('#84cc16') },
  ]);

  // 7. Desert Joshua / Arid Scrub
  const bush1 = new THREE.DodecahedronGeometry(1.3, 0);
  const bush2 = new THREE.DodecahedronGeometry(0.9, 0);
  const dryBushGeo = mergeGeometriesWithColors([
    { geo: bush1, offset: new THREE.Vector3(0, 1.0, 0), color: new THREE.Color('#92400e') },
    { geo: bush2, offset: new THREE.Vector3(0.6, 0.7, 0.4), color: new THREE.Color('#b45309') },
  ]);

  // 8. Natural River Stone & Geological Granite Boulders
  const rock1 = new THREE.DodecahedronGeometry(1.4, 1);
  const rock2 = new THREE.DodecahedronGeometry(0.95, 1);
  const rockMoss = new THREE.DodecahedronGeometry(0.7, 0);

  const rockGeo = mergeGeometriesWithColors([
    { geo: rock1, offset: new THREE.Vector3(0, 0.8, 0), scale: new THREE.Vector3(1.2, 0.8, 1.1), color: new THREE.Color('#78716c') },
    { geo: rock2, offset: new THREE.Vector3(0.9, 0.5, 0.6), color: new THREE.Color('#8a8580') },
    { geo: rockMoss, offset: new THREE.Vector3(-0.3, 1.3, 0.2), scale: new THREE.Vector3(0.9, 0.4, 0.9), color: new THREE.Color('#4d7c38') },
  ]);

  // 9. Lush Wildflowers & River Reeds
  const stem = new THREE.CylinderGeometry(0.04, 0.06, 0.9, 5);
  const petalYellow = new THREE.DodecahedronGeometry(0.32, 0);
  const petalViolet = new THREE.DodecahedronGeometry(0.28, 0);

  const flowerGeo = mergeGeometriesWithColors([
    { geo: stem, offset: new THREE.Vector3(0, 0.45, 0), color: new THREE.Color('#3f6212') },
    { geo: petalYellow, offset: new THREE.Vector3(0, 0.9, 0), color: new THREE.Color('#facc15') },
    { geo: petalViolet, offset: new THREE.Vector3(0.35, 0.75, 0.15), color: new THREE.Color('#c084fc') },
  ]);

  return {
    treeGeos: {
      pine: { geo: pineGeo, mat: naturalFoliageMat },
      oak: { geo: oakGeo, mat: naturalFoliageMat },
      jungle: { geo: jungleGeo, mat: naturalFoliageMat },
      willow: { geo: willowGeo, mat: naturalFoliageMat },
      palm: { geo: palmGeo, mat: naturalFoliageMat },
      birch: { geo: birchGeo, mat: naturalFoliageMat },
      dryBush: { geo: dryBushGeo, mat: naturalFoliageMat },
    },
    rockGeoMat: { geo: rockGeo, mat: naturalFoliageMat },
    flowerGeoMat: { geo: flowerGeo, mat: naturalFoliageMat },
  };
}
