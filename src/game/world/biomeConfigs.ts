import { BiomeConfig, BiomeType } from '../../types/game';

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  COUNTRYSIDE: {
    type: 'COUNTRYSIDE',
    name: 'Rolling Meadows',
    terrainColor: '#65a30d', // bright lush meadow green
    terrainSecondaryColor: '#84cc16', // sunlit lime-green grass
    rockColor: '#a8a29e', // light sandstone
    roadAsphaltColor: '#374151', // clear gray asphalt
    foliageDensity: 1.0,
    treeTypes: ['oak', 'birch'],
    hillFrequency: 0.003,
    mountainHeight: 18,
    fogColor: '#e0f2fe',
    fogDensity: 0.0008,
    hasOcean: false,
  },
  FOREST: {
    type: 'FOREST',
    name: 'Pine Woodland',
    terrainColor: '#15803d', // vibrant lush evergreen moss
    terrainSecondaryColor: '#22c55e', // bright sunlit canopy highlights
    rockColor: '#94a3b8', // light granite
    roadAsphaltColor: '#374151',
    foliageDensity: 1.6,
    treeTypes: ['pine', 'oak'],
    hillFrequency: 0.004,
    mountainHeight: 25,
    fogColor: '#cffafe',
    fogDensity: 0.0009,
    hasOcean: false,
  },
  MOUNTAINS: {
    type: 'MOUNTAINS',
    name: 'Highland Ridge',
    terrainColor: '#78716c', // bright sunlit alpine scree
    terrainSecondaryColor: '#a8a29e', // light quartz/granite
    rockColor: '#d6d3d1', // sunlit stone
    roadAsphaltColor: '#374151',
    foliageDensity: 0.6,
    treeTypes: ['pine'],
    hillFrequency: 0.006,
    mountainHeight: 52,
    fogColor: '#f1f5f9',
    fogDensity: 0.00075,
    hasOcean: false,
  },
  COASTAL: {
    type: 'COASTAL',
    name: 'Pacific Shoreline',
    terrainColor: '#eab308', // glowing golden sand
    terrainSecondaryColor: '#fde047', // bright sunlit dunes
    rockColor: '#d6d3d1',
    roadAsphaltColor: '#475569',
    foliageDensity: 0.8,
    treeTypes: ['palm'],
    hillFrequency: 0.0035,
    mountainHeight: 22,
    fogColor: '#e0f2fe',
    fogDensity: 0.0007,
    hasOcean: true,
  },
  DESERT: {
    type: 'DESERT',
    name: 'Canyon Badlands',
    terrainColor: '#ea580c', // glowing warm terracotta
    terrainSecondaryColor: '#f59e0b', // golden sunlit canyon sand
    rockColor: '#c2410c',
    roadAsphaltColor: '#475569',
    foliageDensity: 0.35,
    treeTypes: ['dryBush'],
    hillFrequency: 0.0045,
    mountainHeight: 38,
    fogColor: '#ffedd5',
    fogDensity: 0.0007,
    hasOcean: false,
  },
  CITY_OUTSKIRTS: {
    type: 'CITY_OUTSKIRTS',
    name: 'Metro Perimeter',
    terrainColor: '#4ade80', // clean parkway lawn green
    terrainSecondaryColor: '#86efac',
    rockColor: '#cbd5e1',
    roadAsphaltColor: '#374151',
    foliageDensity: 0.5,
    treeTypes: ['oak'],
    hillFrequency: 0.002,
    mountainHeight: 12,
    fogColor: '#f8fafc',
    fogDensity: 0.0008,
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
