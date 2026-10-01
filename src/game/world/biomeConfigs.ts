import { BiomeConfig, BiomeType } from '../../types/game';

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  COUNTRYSIDE: {
    type: 'COUNTRYSIDE',
    name: 'Rolling Meadows',
    terrainColor: '#4d7c0f', // lush meadow green
    terrainSecondaryColor: '#65a30d',
    rockColor: '#78716c',
    roadAsphaltColor: '#2b2d30',
    foliageDensity: 1.0,
    treeTypes: ['oak', 'birch'],
    hillFrequency: 0.003,
    mountainHeight: 18,
    fogColor: '#c7d2fe',
    fogDensity: 0.0025,
    hasOcean: false,
  },
  FOREST: {
    type: 'FOREST',
    name: 'Pine Woodland',
    terrainColor: '#166534', // deep forest green
    terrainSecondaryColor: '#14532d',
    rockColor: '#57534e',
    roadAsphaltColor: '#1f2421',
    foliageDensity: 1.8,
    treeTypes: ['pine', 'oak'],
    hillFrequency: 0.004,
    mountainHeight: 25,
    fogColor: '#99f6e4',
    fogDensity: 0.004,
    hasOcean: false,
  },
  MOUNTAINS: {
    type: 'MOUNTAINS',
    name: 'Highland Ridge',
    terrainColor: '#57534e', // alpine stone & tundra
    terrainSecondaryColor: '#3f3f46',
    rockColor: '#292524',
    roadAsphaltColor: '#262626',
    foliageDensity: 0.6,
    treeTypes: ['pine'],
    hillFrequency: 0.006,
    mountainHeight: 55,
    fogColor: '#cbd5e1',
    fogDensity: 0.003,
    hasOcean: false,
  },
  COASTAL: {
    type: 'COASTAL',
    name: 'Pacific Shoreline',
    terrainColor: '#ca8a04', // golden sand & coastal scrub
    terrainSecondaryColor: '#eab308',
    rockColor: '#a8a29e',
    roadAsphaltColor: '#334155',
    foliageDensity: 0.8,
    treeTypes: ['palm'],
    hillFrequency: 0.0035,
    mountainHeight: 22,
    fogColor: '#bae6fd',
    fogDensity: 0.002,
    hasOcean: true,
  },
  DESERT: {
    type: 'DESERT',
    name: 'Canyon Badlands',
    terrainColor: '#b45309', // terracotta & sandstone
    terrainSecondaryColor: '#d97706',
    rockColor: '#9a3412',
    roadAsphaltColor: '#3f3f46',
    foliageDensity: 0.35,
    treeTypes: ['dryBush'],
    hillFrequency: 0.0045,
    mountainHeight: 40,
    fogColor: '#fed7aa',
    fogDensity: 0.002,
    hasOcean: false,
  },
  CITY_OUTSKIRTS: {
    type: 'CITY_OUTSKIRTS',
    name: 'Metro Perimeter',
    terrainColor: '#334155', // industrial verge & highway greenery
    terrainSecondaryColor: '#475569',
    rockColor: '#64748b',
    roadAsphaltColor: '#18181b',
    foliageDensity: 0.5,
    treeTypes: ['oak'],
    hillFrequency: 0.002,
    mountainHeight: 12,
    fogColor: '#cbd5e1',
    fogDensity: 0.0035,
    hasOcean: false,
  },
};

export const BIOME_SEQUENCE: BiomeType[] = [
  'COUNTRYSIDE',
  'FOREST',
  'MOUNTAINS',
  'COASTAL',
  'DESERT',
  'CITY_OUTSKIRTS',
];

export function getBiomeForDistance(distanceMeters: number): BiomeType {
  // Each biome spans ~2500 meters (2.5 km) for nice progression
  const biomeSpan = 2500;
  const index = Math.floor(Math.abs(distanceMeters) / biomeSpan) % BIOME_SEQUENCE.length;
  return BIOME_SEQUENCE[index];
}
