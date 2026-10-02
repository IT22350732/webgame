import { BiomeConfig, BiomeType } from '../../types/game';

export const BIOMES: Record<BiomeType, BiomeConfig> = {
  JUNGLE: {
    type: 'JUNGLE',
    name: 'Emerald Jungle & River',
    terrainColor: '#2d5a37', // rich tropical rainforest undergrowth
    terrainSecondaryColor: '#407c4b', // sunlit lush jungle canopy floor
    rockColor: '#526055', // weathered river moss boulders
    roadAsphaltColor: '#334155',
    foliageDensity: 1.8,
    treeTypes: ['jungle', 'palm', 'willow'],
    hillFrequency: 0.0036,
    mountainHeight: 24,
    fogColor: '#d8f3dc', // soft tropical humid morning haze
    fogDensity: 0.00082,
    hasOcean: false,
    hasRiver: true,
    riverColor: '#1d8a8a', // tranquil crystal emerald jungle river
  },
  COUNTRYSIDE: {
    type: 'COUNTRYSIDE',
    name: 'Meadowlands & River',
    terrainColor: '#4f772d', // calming organic meadow green
    terrainSecondaryColor: '#74a143', // warm sun-drenched pasture grass
    rockColor: '#8d8b82', // natural river sandstone
    roadAsphaltColor: '#374151',
    foliageDensity: 1.2,
    treeTypes: ['oak', 'willow', 'birch'],
    hillFrequency: 0.0028,
    mountainHeight: 16,
    fogColor: '#e6f0fa', // crisp clear rural atmospheric haze
    fogDensity: 0.00075,
    hasOcean: false,
    hasRiver: true,
    riverColor: '#2b8296', // peaceful sparkling blue-green river
  },
  FOREST: {
    type: 'FOREST',
    name: 'Pine Woods & Stream',
    terrainColor: '#2b4c37', // serene deep evergreen needle floor
    terrainSecondaryColor: '#3d694b', // fresh fern & moss highlights
    rockColor: '#6c757d', // slate riverbed stone
    roadAsphaltColor: '#374151',
    foliageDensity: 1.7,
    treeTypes: ['pine', 'birch', 'willow'],
    hillFrequency: 0.0035,
    mountainHeight: 26,
    fogColor: '#d5e5e8', // soft misty pine woodland air
    fogDensity: 0.00085,
    hasOcean: false,
    hasRiver: true,
    riverColor: '#287271', // clear mountain stream
  },
  MOUNTAINS: {
    type: 'MOUNTAINS',
    name: 'Highland Alpine Valley',
    terrainColor: '#595e63', // weathered alpine stone scree
    terrainSecondaryColor: '#7a8187', // granite quartz ledges
    rockColor: '#b8bec2', // sunlit mountain peaks
    roadAsphaltColor: '#374151',
    foliageDensity: 0.75,
    treeTypes: ['pine', 'birch'],
    hillFrequency: 0.0055,
    mountainHeight: 46,
    fogColor: '#eef2f6', // pure crisp high-altitude air
    fogDensity: 0.0007,
    hasOcean: false,
    hasRiver: true,
    riverColor: '#38bdf8', // glacial meltwater creek
  },
  COASTAL: {
    type: 'COASTAL',
    name: 'Pacific Shoreline',
    terrainColor: '#cbb484', // natural warm beach dune sand
    terrainSecondaryColor: '#dfce9d', // sun-kissed coastal bluffs
    rockColor: '#9a9183', // coastal granite cliffs
    roadAsphaltColor: '#475569',
    foliageDensity: 0.9,
    treeTypes: ['palm', 'jungle'],
    hillFrequency: 0.0032,
    mountainHeight: 22,
    fogColor: '#dcf0f7', // ocean sea spray haze
    fogDensity: 0.00072,
    hasOcean: true,
    hasRiver: false,
    riverColor: '#168aad',
  },
  DESERT: {
    type: 'DESERT',
    name: 'Sunset Canyon Oasis',
    terrainColor: '#b06d4e', // calming warm natural terracotta
    terrainSecondaryColor: '#c98d63', // golden evening canyon sand
    rockColor: '#8f4f34', // natural red rock canyon
    roadAsphaltColor: '#475569',
    foliageDensity: 0.45,
    treeTypes: ['dryBush', 'palm'],
    hillFrequency: 0.0042,
    mountainHeight: 34,
    fogColor: '#faebd7', // warm dusk atmosphere
    fogDensity: 0.0007,
    hasOcean: false,
    hasRiver: true,
    riverColor: '#2a9d8f', // oasis spring water
  },
  CITY_OUTSKIRTS: {
    type: 'CITY_OUTSKIRTS',
    name: 'Parkway & Canal',
    terrainColor: '#3d7042', // serene manicured lawn
    terrainSecondaryColor: '#5d9962', // sunlit parkway turf
    rockColor: '#9ca3af',
    roadAsphaltColor: '#374151',
    foliageDensity: 0.85,
    treeTypes: ['oak', 'willow', 'birch'],
    hillFrequency: 0.002,
    mountainHeight: 12,
    fogColor: '#f1f5f9',
    fogDensity: 0.00076,
    hasOcean: false,
    hasRiver: true,
    riverColor: '#338ba8',
  },
};

export const BIOME_SEQUENCE: BiomeType[] = [
  'JUNGLE',
  'COUNTRYSIDE',
  'FOREST',
  'MOUNTAINS',
  'COASTAL',
  'DESERT',
  'CITY_OUTSKIRTS',
];

export function getBiomeForDistance(distanceMeters: number): BiomeType {
  const biomeSpan = 2500;
  const index = Math.floor(Math.abs(distanceMeters) / biomeSpan) % BIOME_SEQUENCE.length;
  return BIOME_SEQUENCE[index];
}
