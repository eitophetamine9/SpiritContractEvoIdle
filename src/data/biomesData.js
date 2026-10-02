/**
 * Biomes Data & Stage Progression Engine
 * Defines Tower settings for floors 1 to 100 and infinite repeating "Enchanted" cycles.
 */

export const BASE_BIOMES = [
  {
    id: 'mystical_swamp',
    name: 'Mystical Swamp',
    floorMin: 1,
    floorMax: 10,
    themeClass: 'biome-swamp',
    bgImage: '/theme/moonlit_swamp.png',
    badgeColor: '#2ecc71',
    accentColor: '#d4e478',
    description: 'Ancient murky waters and mossy ruins veiled in moonlit mist.',
    enemyPrefixes: ['Blighted', 'Murkborn', 'Frenzied', 'Dread', 'Toxic'],
    bossTitle: 'Swamp Behemoth'
  },
  {
    id: 'mystical_winterland',
    name: 'Mystical Winterland',
    floorMin: 11,
    floorMax: 20,
    themeClass: 'biome-winterland',
    bgImage: '/theme/gothic_spire.jpg',
    badgeColor: '#00d2d3',
    accentColor: '#70a1ff',
    description: 'Frozen tundra and crystalline spires whispering ancient frost prophecies.',
    enemyPrefixes: ['Glacial', 'Frostbitten', 'Shivering', 'Icebound', 'Permafrost'],
    bossTitle: 'Glacial Colossus'
  },
  {
    id: 'dark_castle',
    name: 'Dark Castle',
    floorMin: 21,
    floorMax: 40,
    themeClass: 'biome-dark-castle',
    bgImage: '/theme/gothic_spire.jpg',
    badgeColor: '#9b59b6',
    accentColor: '#e056fd',
    description: 'Towering gothic battlements shrouded in spectral fog and crimson moonlight.',
    enemyPrefixes: ['Spectral', 'Graveborn', 'Vampiric', 'Cursed', 'Shadowbound'],
    bossTitle: 'Gothic Archon'
  },
  {
    id: 'abyssal_depths',
    name: 'Abyssal Sunken Depths',
    floorMin: 41,
    floorMax: 60,
    themeClass: 'biome-abyssal',
    bgImage: '/theme/moonlit_swamp.png',
    badgeColor: '#3498db',
    accentColor: '#0984e3',
    description: 'Crushing deep oceanic trenches illuminated by sinister bioluminescent flora.',
    enemyPrefixes: ['Abyssal', 'Tidal', 'Drowned', 'Leviathan', 'Voidsea'],
    bossTitle: 'Deepsea Leviathan'
  },
  {
    id: 'volcanic_caldera',
    name: 'Volcanic Hellfire Caldera',
    floorMin: 61,
    floorMax: 80,
    themeClass: 'biome-volcanic',
    bgImage: '/theme/gothic_spire.jpg',
    badgeColor: '#e74c3c',
    accentColor: '#ff7675',
    description: 'Churning rivers of molten magma and obsidian crags radiating blistering heat.',
    enemyPrefixes: ['Ashen', 'Magma-infused', 'Infernal', 'Ignited', 'Pyreborn'],
    bossTitle: 'Hellfire Drake'
  },
  {
    id: 'primordial_sanctum',
    name: 'Celestial Primordial Sanctum',
    floorMin: 81,
    floorMax: 100,
    themeClass: 'biome-sanctum',
    bgImage: '/theme/spirit_tree.png',
    badgeColor: '#f1c40f',
    accentColor: '#ffd152',
    description: 'Floating golden astral shrines where primeval spirits converse with the cosmos.',
    enemyPrefixes: ['Eldritch', 'Astral', 'Corrupted Celestial', 'Voidtouched', 'Starfallen'],
    bossTitle: 'Primordial Overlord'
  }
];

/**
 * Returns biome metadata for any stage, supporting infinite repeating 100-floor cycles
 * prefixed with "Enchanted" starting on Floor 101+.
 */
export function getBiomeForStage(stage) {
  const safeStage = Math.max(1, stage || 1);
  const cycleIndex = Math.floor((safeStage - 1) / 100);
  const floorInCycle = ((safeStage - 1) % 100) + 1;

  let baseBiome = BASE_BIOMES[0];
  for (const biome of BASE_BIOMES) {
    if (floorInCycle >= biome.floorMin && floorInCycle <= biome.floorMax) {
      baseBiome = biome;
      break;
    }
  }

  const isEnchanted = cycleIndex > 0;
  const cycleSuffix = cycleIndex > 1 ? ` (Cycle ${cycleIndex + 1})` : '';
  const finalName = isEnchanted 
    ? `Enchanted ${baseBiome.name}${cycleSuffix}` 
    : baseBiome.name;

  return {
    ...baseBiome,
    stage: safeStage,
    floorInCycle,
    cycleIndex,
    isEnchanted,
    name: finalName,
    rangeLabel: `Floors ${baseBiome.floorMin + cycleIndex * 100} - ${baseBiome.floorMax + cycleIndex * 100}`
  };
}
