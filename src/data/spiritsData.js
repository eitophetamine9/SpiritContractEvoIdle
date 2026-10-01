/**
 * Spirit Species Catalog, Evolution RNG Trees, and Base Stats
 */

export const ELEMENTS = {
  FIRE: { name: 'Fire', color: '#ff4438', bg: '#2b0d0c', border: '#ff6b5c', symbol: '🔥' },
  WATER: { name: 'Water', color: '#00c3ff', bg: '#081f2f', border: '#42d4ff', symbol: '💧' },
  EARTH: { name: 'Earth', color: '#2ecc71', bg: '#0b2413', border: '#58d68d', symbol: '🌿' },
  WIND: { name: 'Wind', color: '#e0c93c', bg: '#29250a', border: '#f7dc6f', symbol: '🌪️' },
  DARK: { name: 'Void', color: '#b342ff', bg: '#210c30', border: '#c766ff', symbol: '🔮' },
  LIGHT: { name: 'Solar', color: '#ffb300', bg: '#2f2005', border: '#ffc107', symbol: '✨' },
};

export const SPIRIT_SPECIES = {
  // === TIER 1 BASE SPIRITS (Level Cap 10) ===
  'ignis_wisp': {
    id: 'ignis_wisp',
    name: 'Ignis Wisp',
    element: 'FIRE',
    tier: 1,
    levelCap: 10,
    basePower: 12,
    growthRate: 0.18,
    avatarKey: 'fire_wisp',
    accentColor: '#ff4500',
    description: 'A flickering ember spirit born from an ancient volcanic fissure.',
    evolutions: [
      { targetSpeciesId: 'inferno_hound', weight: 80, variant: 'Common Variant', powerMult: 2.3 },
      { targetSpeciesId: 'solar_drake', weight: 20, variant: 'Rare Variant', powerMult: 3.4 }
    ]
  },
  'aqua_sprout': {
    id: 'aqua_sprout',
    name: 'Aqua Sprout',
    element: 'WATER',
    tier: 1,
    levelCap: 10,
    basePower: 11,
    growthRate: 0.19,
    avatarKey: 'water_sprout',
    accentColor: '#00d2ff',
    description: 'A lively droplet creature that purifies corrupted currents.',
    evolutions: [
      { targetSpeciesId: 'tide_serpent', weight: 80, variant: 'Common Variant', powerMult: 2.3 },
      { targetSpeciesId: 'abyssal_naga', weight: 20, variant: 'Rare Variant', powerMult: 3.4 }
    ]
  },
  'terra_golem': {
    id: 'terra_golem',
    name: 'Terra Pebble',
    element: 'EARTH',
    tier: 1,
    levelCap: 10,
    basePower: 14,
    growthRate: 0.16,
    avatarKey: 'earth_pebble',
    accentColor: '#27ae60',
    description: 'A dense clump of mossy sediment with astonishing resilience.',
    evolutions: [
      { targetSpeciesId: 'granite_gargoyle', weight: 80, variant: 'Common Variant', powerMult: 2.2 },
      { targetSpeciesId: 'crystal_colossus', weight: 20, variant: 'Rare Variant', powerMult: 3.5 }
    ]
  },
  'zephyr_bird': {
    id: 'zephyr_bird',
    name: 'Zephyr Finch',
    element: 'WIND',
    tier: 1,
    levelCap: 10,
    basePower: 13,
    growthRate: 0.17,
    avatarKey: 'wind_finch',
    accentColor: '#f1c40f',
    description: 'A swift avian spirit riding miniature thermal drafts.',
    evolutions: [
      { targetSpeciesId: 'tempest_falcon', weight: 80, variant: 'Common Variant', powerMult: 2.3 },
      { targetSpeciesId: 'celestial_roc', weight: 20, variant: 'Rare Variant', powerMult: 3.3 }
    ]
  },
  'umbra_shade': {
    id: 'umbra_shade',
    name: 'Umbra Shade',
    element: 'DARK',
    tier: 1,
    levelCap: 10,
    basePower: 15,
    growthRate: 0.20,
    avatarKey: 'void_shade',
    accentColor: '#9b59b6',
    description: 'A silent phantom that feeds on chaotic psychic echoes.',
    evolutions: [
      { targetSpeciesId: 'nightmare_stalker', weight: 80, variant: 'Common Variant', powerMult: 2.4 },
      { targetSpeciesId: 'void_harbinger', weight: 20, variant: 'Rare Variant', powerMult: 3.6 }
    ]
  },
  'lux_sprite': {
    id: 'lux_sprite',
    name: 'Lux Sprite',
    element: 'LIGHT',
    tier: 1,
    levelCap: 10,
    basePower: 13,
    growthRate: 0.19,
    avatarKey: 'light_sprite',
    accentColor: '#ffa502',
    description: 'A sparkling mote of dawn light capable of piercing madness.',
    evolutions: [
      { targetSpeciesId: 'radiant_seraph', weight: 80, variant: 'Common Variant', powerMult: 2.3 },
      { targetSpeciesId: 'aurora_sovereign', weight: 20, variant: 'Rare Variant', powerMult: 3.5 }
    ]
  },

  // === TIER 2 COMMON & RARE EVOLUTIONS (Level Cap 25) ===
  'inferno_hound': {
    id: 'inferno_hound',
    name: 'Inferno Hound',
    element: 'FIRE',
    tier: 2,
    levelCap: 25,
    basePower: 35,
    growthRate: 0.22,
    avatarKey: 'fire_hound',
    accentColor: '#ff2a00',
    description: 'A relentless hound clothed in living magma.',
    evolutions: [
      { targetSpeciesId: 'hellfire_cerberus', weight: 85, variant: 'Common Apex', powerMult: 2.8 },
      { targetSpeciesId: 'volcanic_titan', weight: 15, variant: 'Mythic Ascendant', powerMult: 4.2 }
    ]
  },
  'solar_drake': {
    id: 'solar_drake',
    name: 'Solar Drake [RARE]',
    element: 'FIRE',
    tier: 2,
    levelCap: 25,
    basePower: 52,
    growthRate: 0.26,
    avatarKey: 'fire_drake',
    accentColor: '#ff7700',
    description: 'A rare celestial reptile radiating blinding thermonuclear heat.',
    evolutions: [
      { targetSpeciesId: 'supernova_phoenix', weight: 75, variant: 'Stellar Variant', powerMult: 3.0 },
      { targetSpeciesId: 'sun_emperor_dragon', weight: 25, variant: 'Solar Supreme', powerMult: 4.5 }
    ]
  },

  'tide_serpent': {
    id: 'tide_serpent',
    name: 'Tide Serpent',
    element: 'WATER',
    tier: 2,
    levelCap: 25,
    basePower: 34,
    growthRate: 0.22,
    avatarKey: 'water_serpent',
    accentColor: '#00b4d8',
    description: 'A muscular water serpent that commands whirlpools.',
    evolutions: [
      { targetSpeciesId: 'maelstrom_hydra', weight: 85, variant: 'Common Apex', powerMult: 2.8 },
      { targetSpeciesId: 'abyssal_leviathan', weight: 15, variant: 'Mythic Ascendant', powerMult: 4.2 }
    ]
  },
  'abyssal_naga': {
    id: 'abyssal_naga',
    name: 'Abyssal Naga [RARE]',
    element: 'WATER',
    tier: 2,
    levelCap: 25,
    basePower: 50,
    growthRate: 0.25,
    avatarKey: 'water_naga',
    accentColor: '#0077b6',
    description: 'A rare trench sovereign wielding crushing oceanic depth magic.',
    evolutions: [
      { targetSpeciesId: 'oceanic_demigod', weight: 75, variant: 'Tidal Lord', powerMult: 3.0 },
      { targetSpeciesId: 'primordial_ocean_queen', weight: 25, variant: 'Deep Supreme', powerMult: 4.5 }
    ]
  },

  'granite_gargoyle': {
    id: 'granite_gargoyle',
    name: 'Granite Gargoyle',
    element: 'EARTH',
    tier: 2,
    levelCap: 25,
    basePower: 36,
    growthRate: 0.21,
    avatarKey: 'earth_gargoyle',
    accentColor: '#2e7d32',
    description: 'An impenetrable guardian carved from petrified mountain peaks.',
    evolutions: [
      { targetSpeciesId: 'tectonic_behemoth', weight: 85, variant: 'Common Apex', powerMult: 2.8 },
      { targetSpeciesId: 'crystal_colossus_apex', weight: 15, variant: 'Mythic Ascendant', powerMult: 4.2 }
    ]
  },
  'crystal_colossus': {
    id: 'crystal_colossus',
    name: 'Crystal Colossus [RARE]',
    element: 'EARTH',
    tier: 2,
    levelCap: 25,
    basePower: 54,
    growthRate: 0.25,
    avatarKey: 'earth_colossus',
    accentColor: '#00e676',
    description: 'Refracts pure geothermal energy through crystalline armor.',
    evolutions: [
      { targetSpeciesId: 'diamond_dreadnought', weight: 70, variant: 'Prism Overlord', powerMult: 3.1 },
      { targetSpeciesId: 'gaia_world_breaker', weight: 30, variant: 'Terran Supreme', powerMult: 4.6 }
    ]
  },

  'tempest_falcon': {
    id: 'tempest_falcon',
    name: 'Tempest Falcon',
    element: 'WIND',
    tier: 2,
    levelCap: 25,
    basePower: 35,
    growthRate: 0.23,
    avatarKey: 'wind_falcon',
    accentColor: '#f9a825',
    description: 'Cuts through gale force winds with razor-sharp gale plumage.',
    evolutions: [
      { targetSpeciesId: 'cyclone_griffin', weight: 85, variant: 'Common Apex', powerMult: 2.8 },
      { targetSpeciesId: 'typhoon_valkyrie', weight: 15, variant: 'Mythic Ascendant', powerMult: 4.2 }
    ]
  },
  'celestial_roc': {
    id: 'celestial_roc',
    name: 'Celestial Roc [RARE]',
    element: 'WIND',
    tier: 2,
    levelCap: 25,
    basePower: 51,
    growthRate: 0.26,
    avatarKey: 'wind_roc',
    accentColor: '#ffee58',
    description: 'A rare celestial bird whose wingbeats cause stratosphere rifts.',
    evolutions: [
      { targetSpeciesId: 'storm_emperor_eagle', weight: 75, variant: 'Sky Monarch', powerMult: 3.0 },
      { targetSpeciesId: 'sky_rending_sovereign', weight: 25, variant: 'Aether Supreme', powerMult: 4.5 }
    ]
  },

  'nightmare_stalker': {
    id: 'nightmare_stalker',
    name: 'Nightmare Stalker',
    element: 'DARK',
    tier: 2,
    levelCap: 25,
    basePower: 38,
    growthRate: 0.24,
    avatarKey: 'void_stalker',
    accentColor: '#8e24aa',
    description: 'Prowls unseen in the madness frequencies of the dark realm.',
    evolutions: [
      { targetSpeciesId: 'void_reaper', weight: 85, variant: 'Common Apex', powerMult: 2.8 },
      { targetSpeciesId: 'abyssal_oblivion', weight: 15, variant: 'Mythic Ascendant', powerMult: 4.3 }
    ]
  },
  'void_harbinger': {
    id: 'void_harbinger',
    name: 'Void Harbinger [RARE]',
    element: 'DARK',
    tier: 2,
    levelCap: 25,
    basePower: 56,
    growthRate: 0.27,
    avatarKey: 'void_harbinger',
    accentColor: '#ba68c8',
    description: 'A terrifying riftwalker wrapped in dark singularity threads.',
    evolutions: [
      { targetSpeciesId: 'blackhole_emperor', weight: 70, variant: 'Entropy Prince', powerMult: 3.2 },
      { targetSpeciesId: 'chaos_godhead', weight: 30, variant: 'Void Supreme', powerMult: 4.8 }
    ]
  },

  'radiant_seraph': {
    id: 'radiant_seraph',
    name: 'Radiant Seraph',
    element: 'LIGHT',
    tier: 2,
    levelCap: 25,
    basePower: 35,
    growthRate: 0.23,
    avatarKey: 'light_seraph',
    accentColor: '#ff9800',
    description: 'Shines with the unwavering dawn to banish madness.',
    evolutions: [
      { targetSpeciesId: 'archangel_aegis', weight: 85, variant: 'Common Apex', powerMult: 2.8 },
      { targetSpeciesId: 'dawn_empress', weight: 15, variant: 'Mythic Ascendant', powerMult: 4.2 }
    ]
  },
  'aurora_sovereign': {
    id: 'aurora_sovereign',
    name: 'Aurora Sovereign [RARE]',
    element: 'LIGHT',
    tier: 2,
    levelCap: 25,
    basePower: 53,
    growthRate: 0.26,
    avatarKey: 'light_sovereign',
    accentColor: '#ffe082',
    description: 'Weaves kaleidoscopic solar beams that blind corrupted horrors.',
    evolutions: [
      { targetSpeciesId: 'supernal_avatar', weight: 70, variant: 'Luminous Deity', powerMult: 3.1 },
      { targetSpeciesId: 'cosmic_divinity', weight: 30, variant: 'Sun Supreme', powerMult: 4.7 }
    ]
  },

  // === TIER 3 FINAL APEX FORMS (Level Cap 50) ===
  'hellfire_cerberus': {
    id: 'hellfire_cerberus',
    name: 'Hellfire Cerberus',
    element: 'FIRE',
    tier: 3,
    levelCap: 50,
    basePower: 120,
    growthRate: 0.32,
    avatarKey: 'fire_cerberus',
    accentColor: '#d50000',
    description: 'A three-headed guardian unleashing eternal volcanic ruin.',
    evolutions: []
  },
  'volcanic_titan': {
    id: 'volcanic_titan',
    name: 'Volcanic Titan [MYTHIC]',
    element: 'FIRE',
    tier: 3,
    levelCap: 50,
    basePower: 185,
    growthRate: 0.38,
    avatarKey: 'fire_titan',
    accentColor: '#ff1744',
    description: 'The incarnation of tectonic brimstone, an unstoppable apex deity.',
    evolutions: []
  },
  'supernova_phoenix': {
    id: 'supernova_phoenix',
    name: 'Supernova Phoenix',
    element: 'FIRE',
    tier: 3,
    levelCap: 50,
    basePower: 160,
    growthRate: 0.35,
    avatarKey: 'fire_phoenix',
    accentColor: '#ff6d00',
    description: 'Burns at core temperature, resurrecting in explosive radiant flares.',
    evolutions: []
  },
  'sun_emperor_dragon': {
    id: 'sun_emperor_dragon',
    name: 'Sun Emperor Dragon [SUPREME]',
    element: 'FIRE',
    tier: 3,
    levelCap: 50,
    basePower: 220,
    growthRate: 0.42,
    avatarKey: 'fire_dragon_supreme',
    accentColor: '#ff9100',
    description: 'Lord of every flame that ever burned across the cosmos.',
    evolutions: []
  },

  'maelstrom_hydra': {
    id: 'maelstrom_hydra',
    name: 'Maelstrom Hydra',
    element: 'WATER',
    tier: 3,
    levelCap: 50,
    basePower: 118,
    growthRate: 0.32,
    avatarKey: 'water_hydra',
    accentColor: '#0091ea',
    description: 'Multi-headed abyssal predator crushing everything into vortexes.',
    evolutions: []
  },
  'abyssal_leviathan': {
    id: 'abyssal_leviathan',
    name: 'Abyssal Leviathan [MYTHIC]',
    element: 'WATER',
    tier: 3,
    levelCap: 50,
    basePower: 180,
    growthRate: 0.38,
    avatarKey: 'water_leviathan',
    accentColor: '#00b0ff',
    description: 'Ancient titan of the deepest trench that swallows continents.',
    evolutions: []
  },
  'oceanic_demigod': {
    id: 'oceanic_demigod',
    name: 'Oceanic Demigod',
    element: 'WATER',
    tier: 3,
    levelCap: 50,
    basePower: 155,
    growthRate: 0.35,
    avatarKey: 'water_demigod',
    accentColor: '#00e5ff',
    description: 'Commands tidal forces with effortless celestial grace.',
    evolutions: []
  },
  'primordial_ocean_queen': {
    id: 'primordial_ocean_queen',
    name: 'Ocean Queen [SUPREME]',
    element: 'WATER',
    tier: 3,
    levelCap: 50,
    basePower: 225,
    growthRate: 0.42,
    avatarKey: 'water_queen_supreme',
    accentColor: '#18ffff',
    description: 'Ruler of the primordial waters before the creation of land.',
    evolutions: []
  },

  'tectonic_behemoth': {
    id: 'tectonic_behemoth',
    name: 'Tectonic Behemoth',
    element: 'EARTH',
    tier: 3,
    levelCap: 50,
    basePower: 122,
    growthRate: 0.31,
    avatarKey: 'earth_behemoth',
    accentColor: '#1b5e20',
    description: 'Carries mountain ridges on its shell, shifting tectonic plates.',
    evolutions: []
  },
  'crystal_colossus_apex': {
    id: 'crystal_colossus_apex',
    name: 'Prismatic Colossus [MYTHIC]',
    element: 'EARTH',
    tier: 3,
    levelCap: 50,
    basePower: 190,
    growthRate: 0.39,
    avatarKey: 'earth_colossus_apex',
    accentColor: '#00c853',
    description: 'Radiates impenetrable diamond shields that deflect all malice.',
    evolutions: []
  },
  'diamond_dreadnought': {
    id: 'diamond_dreadnought',
    name: 'Diamond Dreadnought',
    element: 'EARTH',
    tier: 3,
    levelCap: 50,
    basePower: 165,
    growthRate: 0.36,
    avatarKey: 'earth_dreadnought',
    accentColor: '#69f0ae',
    description: 'A floating crystalline fortress that pulverizes enemy frontlines.',
    evolutions: []
  },
  'gaia_world_breaker': {
    id: 'gaia_world_breaker',
    name: 'Gaia World Breaker [SUPREME]',
    element: 'EARTH',
    tier: 3,
    levelCap: 50,
    basePower: 230,
    growthRate: 0.43,
    avatarKey: 'earth_world_breaker',
    accentColor: '#b9f6ca',
    description: 'Commands the planetary crust itself; earthquakes obey its call.',
    evolutions: []
  },

  'cyclone_griffin': {
    id: 'cyclone_griffin',
    name: 'Cyclone Griffin',
    element: 'WIND',
    tier: 3,
    levelCap: 50,
    basePower: 119,
    growthRate: 0.33,
    avatarKey: 'wind_griffin',
    accentColor: '#e65100',
    description: 'Blends lion ferocity with hurricane velocity.',
    evolutions: []
  },
  'typhoon_valkyrie': {
    id: 'typhoon_valkyrie',
    name: 'Typhoon Valkyrie [MYTHIC]',
    element: 'WIND',
    tier: 3,
    levelCap: 50,
    basePower: 182,
    growthRate: 0.38,
    avatarKey: 'wind_valkyrie',
    accentColor: '#ffd600',
    description: 'Descends from jetstreams to cleanly dissect corrupted forces.',
    evolutions: []
  },
  'storm_emperor_eagle': {
    id: 'storm_emperor_eagle',
    name: 'Storm Emperor Eagle',
    element: 'WIND',
    tier: 3,
    levelCap: 50,
    basePower: 158,
    growthRate: 0.35,
    avatarKey: 'wind_eagle',
    accentColor: '#ffea00',
    description: 'Its cries bring thunderstorms; its wings shroud whole kingdoms.',
    evolutions: []
  },
  'sky_rending_sovereign': {
    id: 'sky_rending_sovereign',
    name: 'Aether Sovereign [SUPREME]',
    element: 'WIND',
    tier: 3,
    levelCap: 50,
    basePower: 222,
    growthRate: 0.42,
    avatarKey: 'wind_sovereign_supreme',
    accentColor: '#ffff00',
    description: 'Sovereign of the endless atmosphere that bends storms to its will.',
    evolutions: []
  },

  'void_reaper': {
    id: 'void_reaper',
    name: 'Void Reaper',
    element: 'DARK',
    tier: 3,
    levelCap: 50,
    basePower: 125,
    growthRate: 0.34,
    avatarKey: 'void_reaper',
    accentColor: '#4a148c',
    description: 'A shadowy executioner harvest souls unperturbed by madness.',
    evolutions: []
  },
  'abyssal_oblivion': {
    id: 'abyssal_oblivion',
    name: 'Abyssal Oblivion [MYTHIC]',
    element: 'DARK',
    tier: 3,
    levelCap: 50,
    basePower: 195,
    growthRate: 0.40,
    avatarKey: 'void_oblivion',
    accentColor: '#aa00ff',
    description: 'A walking event horizon dissolving physical matter into void.',
    evolutions: []
  },
  'blackhole_emperor': {
    id: 'blackhole_emperor',
    name: 'Blackhole Emperor',
    element: 'DARK',
    tier: 3,
    levelCap: 50,
    basePower: 170,
    growthRate: 0.36,
    avatarKey: 'void_emperor',
    accentColor: '#d500f9',
    description: 'Rules over the gravitational singularities of collapsed dimensions.',
    evolutions: []
  },
  'chaos_godhead': {
    id: 'chaos_godhead',
    name: 'Chaos Godhead [SUPREME]',
    element: 'DARK',
    tier: 3,
    levelCap: 50,
    basePower: 240,
    growthRate: 0.45,
    avatarKey: 'void_godhead',
    accentColor: '#ea80fc',
    description: 'The ancient will of primordial chaos; all madness bows to it.',
    evolutions: []
  },

  'archangel_aegis': {
    id: 'archangel_aegis',
    name: 'Archangel Aegis',
    element: 'LIGHT',
    tier: 3,
    levelCap: 50,
    basePower: 120,
    growthRate: 0.33,
    avatarKey: 'light_archangel',
    accentColor: '#ff6f00',
    description: 'A six-winged bastion whose holy shield cleanses all corruption.',
    evolutions: []
  },
  'dawn_empress': {
    id: 'dawn_empress',
    name: 'Dawn Empress [MYTHIC]',
    element: 'LIGHT',
    tier: 3,
    levelCap: 50,
    basePower: 188,
    growthRate: 0.39,
    avatarKey: 'light_empress',
    accentColor: '#ffab00',
    description: 'Channels first morning light to obliterate shadows unconditionally.',
    evolutions: []
  },
  'supernal_avatar': {
    id: 'supernal_avatar',
    name: 'Supernal Avatar',
    element: 'LIGHT',
    tier: 3,
    levelCap: 50,
    basePower: 162,
    growthRate: 0.35,
    avatarKey: 'light_avatar',
    accentColor: '#ffd740',
    description: 'A towering embodiment of purity that transmutes madness into peace.',
    evolutions: []
  },
  'cosmic_divinity': {
    id: 'cosmic_divinity',
    name: 'Cosmic Divinity [SUPREME]',
    element: 'LIGHT',
    tier: 3,
    levelCap: 50,
    basePower: 235,
    growthRate: 0.44,
    avatarKey: 'light_divinity_supreme',
    accentColor: '#ffe57f',
    description: 'Sits at the heart of the galaxy, bathing all existence in celestial vigor.',
    evolutions: []
  }
};

/**
 * Base Tier 1 Species IDs available through the Spirit Contract altar
 */
export const CONTRACT_BASE_POOL = [
  'ignis_wisp',
  'aqua_sprout',
  'terra_golem',
  'zephyr_bird',
  'umbra_shade',
  'lux_sprite'
];

/**
 * Formula to calculate XP required to level up
 */
export function getXpRequiredForLevel(level) {
  return Math.floor(30 * Math.pow(level, 1.65));
}

/**
 * Formula to calculate Spirit combat power
 */
export function calculateSpiritPower(species, level, rarity = 'common') {
  const rarityMult = rarity === 'mythic' ? 1.5 : (rarity === 'rare' ? 1.25 : 1.0);
  const lvlMult = 1 + (level - 1) * species.growthRate;
  return Math.max(1, Math.round(species.basePower * lvlMult * rarityMult));
}
