import * as THREE from 'three';

export interface FoliageAssetCollection {
  treeGeos: { [key: string]: { geo: THREE.BufferGeometry; mat: THREE.Material } };
  rockGeoMat: { geo: THREE.BufferGeometry; mat: THREE.Material };
  flowerGeoMat: { geo: THREE.BufferGeometry; mat: THREE.Material };
}

// Utility to merge geometries cleanly
function mergeGeometries(geos: { geo: THREE.BufferGeometry; offset: THREE.Vector3; scale?: THREE.Vector3 }[]): THREE.BufferGeometry {
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
  const mergedIndices = new Uint32Array(totalIndices);

  let pOffset = 0;
  let iOffset = 0;
  let vertBase = 0;

  for (const item of geos) {
    const pos = item.geo.attributes.position.array as Float32Array;
    const norm = item.geo.attributes.normal.array as Float32Array;
    const s = item.scale || new THREE.Vector3(1, 1, 1);

    for (let i = 0; i < pos.length; i += 3) {
      mergedPos[pOffset + i] = pos[i] * s.x + item.offset.x;
      mergedPos[pOffset + i + 1] = pos[i + 1] * s.y + item.offset.y;
      mergedPos[pOffset + i + 2] = pos[i + 2] * s.z + item.offset.z;

      mergedNorm[pOffset + i] = norm[i];
      mergedNorm[pOffset + i + 1] = norm[i + 1];
      mergedNorm[pOffset + i + 2] = norm[i + 2];
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
  result.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
  result.computeVertexNormals();
  return result;
}

export function createFoliageAssets(): FoliageAssetCollection {
  // 1. Realistic Multi-Tiered Pine Tree (Spruce / Douglas Fir)
  const pineTrunk = new THREE.CylinderGeometry(0.24, 0.4, 3.2, 7);
  const pineBough1 = new THREE.ConeGeometry(2.4, 2.8, 7);
  const pineBough2 = new THREE.ConeGeometry(2.0, 2.5, 7);
  const pineBough3 = new THREE.ConeGeometry(1.5, 2.2, 7);
  const pineBough4 = new THREE.ConeGeometry(1.0, 1.8, 7);

  const pineGeo = mergeGeometries([
    { geo: pineTrunk, offset: new THREE.Vector3(0, 1.6, 0) },
    { geo: pineBough1, offset: new THREE.Vector3(0, 3.2, 0) },
    { geo: pineBough2, offset: new THREE.Vector3(0, 4.6, 0) },
    { geo: pineBough3, offset: new THREE.Vector3(0, 5.8, 0) },
    { geo: pineBough4, offset: new THREE.Vector3(0, 6.8, 0) },
  ]);

  const pineMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a, // vibrant evergreen pine needles (was dark 0x144222)
    roughness: 0.65,
    metalness: 0.05,
    flatShading: true,
  });

  // 2. Realistic Organic Deciduous Oak Tree
  const oakTrunk = new THREE.CylinderGeometry(0.35, 0.55, 3.6, 7);
  const oakCanopy1 = new THREE.DodecahedronGeometry(2.4, 1);
  const oakCanopy2 = new THREE.DodecahedronGeometry(1.8, 1);
  const oakCanopy3 = new THREE.DodecahedronGeometry(1.7, 1);

  const oakGeo = mergeGeometries([
    { geo: oakTrunk, offset: new THREE.Vector3(0, 1.8, 0) },
    { geo: oakCanopy1, offset: new THREE.Vector3(0, 4.4, 0) },
    { geo: oakCanopy2, offset: new THREE.Vector3(-0.9, 3.8, 0.7) },
    { geo: oakCanopy3, offset: new THREE.Vector3(0.9, 4.1, -0.6) },
  ]);

  const oakMat = new THREE.MeshStandardMaterial({
    color: 0x65a30d, // sunlit lush green oak foliage (was dark 0x365314)
    roughness: 0.7,
    metalness: 0.02,
    flatShading: true,
  });

  // 3. Coastal Palm Tree
  const palmTrunkLower = new THREE.CylinderGeometry(0.24, 0.32, 2.5, 6);
  const palmTrunkUpper = new THREE.CylinderGeometry(0.18, 0.24, 2.5, 6);
  const palmFrond1 = new THREE.ConeGeometry(2.6, 0.8, 6);
  const palmFrond2 = new THREE.ConeGeometry(2.1, 0.7, 6);

  const palmGeo = mergeGeometries([
    { geo: palmTrunkLower, offset: new THREE.Vector3(0, 1.25, 0) },
    { geo: palmTrunkUpper, offset: new THREE.Vector3(0.25, 3.6, 0) },
    { geo: palmFrond1, offset: new THREE.Vector3(0.4, 4.8, 0), scale: new THREE.Vector3(1.2, 0.5, 1.2) },
    { geo: palmFrond2, offset: new THREE.Vector3(0.4, 4.4, 0), scale: new THREE.Vector3(1.4, 0.5, 1.4) },
  ]);

  const palmMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e, // bright tropical palm fronds
    roughness: 0.65,
    metalness: 0.05,
    flatShading: true,
  });

  // 4. Arid Desert Joshua / Scrub Bush
  const bush1 = new THREE.DodecahedronGeometry(1.2, 0);
  const bush2 = new THREE.DodecahedronGeometry(0.8, 0);
  const dryBushGeo = mergeGeometries([
    { geo: bush1, offset: new THREE.Vector3(0, 0.9, 0) },
    { geo: bush2, offset: new THREE.Vector3(0.6, 0.7, 0.4) },
  ]);
  const dryBushMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // warm bright desert amber scrub
    roughness: 0.8,
    flatShading: true,
  });

  // 5. Alpine Birch
  const birchTrunk = new THREE.CylinderGeometry(0.18, 0.28, 4.2, 6);
  const birchFoliage1 = new THREE.ConeGeometry(1.6, 3.4, 6);
  const birchFoliage2 = new THREE.ConeGeometry(1.2, 2.6, 6);

  const birchGeo = mergeGeometries([
    { geo: birchTrunk, offset: new THREE.Vector3(0, 2.1, 0) },
    { geo: birchFoliage1, offset: new THREE.Vector3(0, 4.0, 0) },
    { geo: birchFoliage2, offset: new THREE.Vector3(0, 5.4, 0) },
  ]);

  const birchMat = new THREE.MeshStandardMaterial({
    color: 0x84cc16, // luminous lime spring birch foliage
    roughness: 0.7,
    metalness: 0.04,
    flatShading: true,
  });

  // 6. Faceted Granite Geological Boulders
  const rock1 = new THREE.DodecahedronGeometry(1.4, 1);
  const rock2 = new THREE.DodecahedronGeometry(0.9, 0);
  const rockGeo = mergeGeometries([
    { geo: rock1, offset: new THREE.Vector3(0, 0.8, 0), scale: new THREE.Vector3(1.2, 0.8, 1.1) },
    { geo: rock2, offset: new THREE.Vector3(0.9, 0.5, 0.6) },
  ]);

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // clear, light granite stone (was dark 0x64748b)
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true,
  });

  // 7. Wild roadside flowers / grass tufts
  const flowerGeo = new THREE.ConeGeometry(0.4, 0.8, 5);
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xfde047, // bright glowing yellow flowers
    roughness: 0.7,
    flatShading: true,
  });

  return {
    treeGeos: {
      pine: { geo: pineGeo, mat: pineMat },
      oak: { geo: oakGeo, mat: oakMat },
      palm: { geo: palmGeo, mat: palmMat },
      dryBush: { geo: dryBushGeo, mat: dryBushMat },
      birch: { geo: birchGeo, mat: birchMat },
    },
    rockGeoMat: { geo: rockGeo, mat: rockMat },
    flowerGeoMat: { geo: flowerGeo, mat: flowerMat },
  };
}
