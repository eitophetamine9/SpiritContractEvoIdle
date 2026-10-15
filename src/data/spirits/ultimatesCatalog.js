import { ELEMENTS } from './elementsAndRoles.js';

export const SPIRIT_ULTIMATES = {
  // Cat Spirit line
  'cat_spirit': {
    name: 'Feline Claw Storm',
    description: 'Unleashes a flurry of rapid slashes dealing 3.5x damage across enemy ranks.',
    multiplier: 3.5,
    type: 'AOE_DAMAGE'
  },
  'furious_cat': {
    name: 'Berserk Cat Scratch',
    description: 'Enraged assault dealing 4.2x critical damage across all enemies.',
    multiplier: 4.2,
    type: 'AOE_DAMAGE'
  },
  'elemental_cat': {
    name: 'Tempest Astral Claws',
    description: 'Summons an elemental tempest dealing 5.2x AOE damage.',
    multiplier: 5.2,
    type: 'AOE_DAMAGE'
  },

  // Dog Spirit line
  'dog_spirit': {
    name: 'Howl of the Aegis',
    description: 'Barks with ancient vigor, healing all allies for 20% Max HP and granting 15% shield.',
    multiplier: 2.0,
    healPercent: 20,
    shieldPercent: 15,
    type: 'SUPPORT'
  },
  'vitality_dog': {
    name: 'Pack Rejuvenation',
    description: 'Emits a soothing pulse of life, restoring 30% Max HP to all party members.',
    multiplier: 2.2,
    healPercent: 30,
    type: 'HEAL'
  },
  'guardian_dog': {
    name: 'Divine Bastion Howl',
    description: 'Bestows a 35% shield to the team and restores 40% Max HP to the lowest ally.',
    multiplier: 2.5,
    healPercent: 40,
    shieldPercent: 35,
    type: 'SUPPORT'
  },

  // Chicken Spirit line
  'chicken_spirit': {
    name: 'Frenzy Peck Surge',
    description: 'Furious pecks dealing 3.8x concentrated damage to the lead enemy.',
    multiplier: 3.8,
    type: 'DAMAGE'
  },
  'battle_chicken': {
    name: 'Skyward Talon Dive',
    description: 'Airborne strike dealing 4.8x crushing damage to the front enemy.',
    multiplier: 4.8,
    type: 'DAMAGE'
  },
  'dino_genus_chicken': {
    name: 'Prehistoric Meteor Peck',
    description: 'Crashes like an extinction meteor dealing 6.5x devastating single-target damage.',
    multiplier: 6.5,
    type: 'DAMAGE'
  },

  // Caterpillar / Butterfly line
  'caterpillar_spirit': {
    name: 'Silk Cocoon Aegis',
    description: 'Wraps allies in defensive silk, restoring 22% Max HP.',
    multiplier: 1.5,
    healPercent: 22,
    type: 'HEAL'
  },
  'elegant_butterfly': {
    name: 'Prismatic Pollen Shower',
    description: 'Showers glowing pollen, restoring 32% Max HP to all allies.',
    multiplier: 2.0,
    healPercent: 32,
    type: 'HEAL'
  },
  'mystical_butterfly': {
    name: 'Astral Psyche Bloom',
    description: 'Radiant burst healing all party members for 40% Max HP and dealing 3.8x AOE damage.',
    multiplier: 3.8,
    healPercent: 40,
    type: 'AOE_DAMAGE_AND_HEAL'
  },

  // Bull Spirit line
  'bull_spirit': {
    name: 'Stampede Breaker',
    description: 'Charges forward dealing 3.6x damage to all enemies in the swarm.',
    multiplier: 3.6,
    type: 'AOE_DAMAGE'
  },
  'raging_bull': {
    name: 'Colossal Horn Gore',
    description: 'Brutal charge dealing 4.8x damage across enemy lines.',
    multiplier: 4.8,
    type: 'AOE_DAMAGE'
  },
  'elemental_bull': {
    name: 'Earthshaker Cataclysm',
    description: 'Slams the earth dealing 5.6x AOE earth damage.',
    multiplier: 5.6,
    type: 'AOE_DAMAGE'
  },
  'minotaur': {
    name: 'Labyrinthian Execution',
    description: 'Mythical execution dealing 7.2x damage to the strongest enemy.',
    multiplier: 7.2,
    type: 'EXECUTE'
  },

  // Lizard Spirit line
  'lizard_spirit': {
    name: 'Venom Spurt',
    description: 'Sprays toxic bile dealing 3.5x damage across enemies.',
    multiplier: 3.5,
    type: 'AOE_DAMAGE'
  },
  'multi_venom_lizard': {
    name: 'Corrosive Toxin Cloud',
    description: 'Envelops all enemies in corrosive gas dealing 4.6x AOE damage.',
    multiplier: 4.6,
    type: 'AOE_DAMAGE'
  },
  'komodo_dragon': {
    name: 'Draconic Toxic Maw',
    description: 'Vicious venomous bite dealing 5.6x damage.',
    multiplier: 5.6,
    type: 'DAMAGE'
  },
  'drake': {
    name: 'Primordial Dragon Breath',
    description: 'Roaring torrent of dragonflame incinerating the swarm for 7.2x AOE damage.',
    multiplier: 7.2,
    type: 'AOE_DAMAGE'
  },

  // Python Spirit line
  'python_spirit': {
    name: 'Constrictor Coil',
    description: 'Crushes enemies in an ancient serpent grip for 3.8x damage.',
    multiplier: 3.8,
    type: 'DAMAGE'
  },
  'highlord_python': {
    name: 'Venomous Serpent Gaze',
    description: 'Strikes through the shadows dealing 4.8x damage.',
    multiplier: 4.8,
    type: 'DAMAGE'
  },
  'huge_albino_anaconda': {
    name: 'Titan Boa Constriction',
    description: 'Titan coils that crush the entire enemy line for 5.8x AOE damage.',
    multiplier: 5.8,
    type: 'AOE_DAMAGE'
  },
  'wyrm': {
    name: 'Abyssal Wyrm Maelstrom',
    description: 'Mythical serpentine tempest dealing 7.5x AOE damage.',
    multiplier: 7.5,
    type: 'AOE_DAMAGE'
  },

  // Shark Spirit line
  'shark_spirit': {
    name: 'Tidal Chomp',
    description: 'Ferocious aquatic bite dealing 4.0x damage.',
    multiplier: 4.0,
    type: 'DAMAGE'
  },
  'great_white_shark': {
    name: 'Blood Frenzy Chomp',
    description: 'Blood-crazed assault dealing 5.5x critical damage.',
    multiplier: 5.5,
    type: 'DAMAGE'
  },
  'megalodon': {
    name: 'Ancient Leviathan Maw',
    description: 'Legendary prehistoric bite dealing 7.5x damage.',
    multiplier: 7.5,
    type: 'DAMAGE'
  },
  'cosmic_oceanic_devourer': {
    name: 'Cosmic Singularity Devour',
    description: 'Transcendent black hole that swallows all foes dealing 9.5x AOE damage.',
    multiplier: 9.5,
    type: 'AOE_DAMAGE'
  },

  // Bear Spirit line
  'bear_spirit': {
    name: 'Grizzly Maul',
    description: 'Heavy claw smash dealing 4.0x damage.',
    multiplier: 4.0,
    type: 'DAMAGE'
  },
  'highlord_bear': {
    name: 'Avalanche Paw Slam',
    description: 'Crushing slam dealing 5.5x AOE damage.',
    multiplier: 5.5,
    type: 'AOE_DAMAGE'
  },
  'bear_of_dreams': {
    name: 'Astral Nightmare Slumber',
    description: 'Heals the party for 35% Max HP and strikes foes for 6.8x AOE damage.',
    multiplier: 6.8,
    healPercent: 35,
    type: 'AOE_DAMAGE_AND_HEAL'
  },
  'cosmic_bear_ursalite': {
    name: 'Ursa Major Supernova',
    description: 'Transcendent stellar detonation dealing 9.5x AOE damage.',
    multiplier: 9.5,
    type: 'AOE_DAMAGE'
  },

  // Wisp Spirit line
  'wisp_spirit': {
    name: 'Ethereal Starbeam',
    description: 'Fires penetrating astral light dealing 4.5x damage.',
    multiplier: 4.5,
    type: 'DAMAGE'
  },
  'high_elf': {
    name: 'Sanctum Judgment Ray',
    description: 'Mythical holy laser piercing all foes for 7.8x AOE damage and healing allies for 25%.',
    multiplier: 7.8,
    healPercent: 25,
    type: 'AOE_DAMAGE_AND_HEAL'
  },

  // Fallen Warrior line
  'fallen_warrior_spirit': {
    name: 'Cursed Blade Flurry',
    description: 'Whirlwind of spectral steel dealing 5.2x AOE damage.',
    multiplier: 5.2,
    type: 'AOE_DAMAGE'
  },
  'sovereign_warrior': {
    name: 'Emperor Blade Cleave',
    description: 'Royal phantom cleave slicing all foes for 7.8x AOE damage.',
    multiplier: 7.8,
    type: 'AOE_DAMAGE'
  },
  'dreadlord_warrior': {
    name: 'Oblivion Cataclysm Slice',
    description: 'Transcendent abyssal blade that shatters the battlefield for 10.5x AOE damage.',
    multiplier: 10.5,
    type: 'AOE_DAMAGE'
  },

  // Celestial Roster Ultimates
  'solaris_lion_pride': {
    name: 'Cruel Sun: Flare Immolation',
    description: 'Manifests a miniature blazing star dealing 6.5x AOE solar fire damage.',
    multiplier: 6.5,
    type: 'AOE_DAMAGE'
  },
  'solaris_the_one': {
    name: 'The One: Divine Slash Escanor',
    description: 'Invincible zenith slash that cleaves all dimensions for 12.0x devastating AOE damage.',
    multiplier: 12.0,
    type: 'AOE_DAMAGE'
  },
  'gelda_ashes_empress': {
    name: 'Thousand Ashes Crimson Gale',
    description: 'Unleashes an incinerating whirlwind of dark ash dealing 5.8x AOE damage with 25% lifesteal.',
    multiplier: 5.8,
    healPercent: 25,
    type: 'AOE_DAMAGE_AND_HEAL'
  },
  'gelda_blood_sovereign': {
    name: 'Sanguine Eclipse Dominion',
    description: 'Awakens primordial blood moon dealing 10.0x AOE damage and restoring party HP by 35%.',
    multiplier: 10.0,
    healPercent: 35,
    type: 'AOE_DAMAGE_AND_HEAL'
  },
  'astraea_valkyrie': {
    name: 'Starfall Gale Lance',
    description: 'Rains astral javelins across enemy lines dealing 4.8x AOE damage.',
    multiplier: 4.8,
    type: 'AOE_DAMAGE'
  },
  'astraea_celestial_queen': {
    name: 'Supernova Aurora Constellation',
    description: 'Cascades shimmering nebulae dealing 8.2x AOE damage and shielding all allies for 20%.',
    multiplier: 8.2,
    shieldPercent: 20,
    type: 'AOE_DAMAGE'
  },
  'leviathan_behemoth': {
    name: 'Cataclysmic Tidal Surge',
    description: 'Submerges the arena under abyssal tides dealing 4.5x AOE damage and granting 25% shield.',
    multiplier: 4.5,
    shieldPercent: 25,
    type: 'AOE_DAMAGE'
  },
  'leviathan_abyssal_primordial': {
    name: 'Primordial Sunken Abyss',
    description: 'Crushes enemy ranks with trench pressure dealing 8.0x AOE damage and granting 30% shield.',
    multiplier: 8.0,
    shieldPercent: 30,
    type: 'AOE_DAMAGE'
  },
  'baphomet_voidbinder': {
    name: 'Nether Sigil Hex',
    description: 'Channels abyssal occult runes dealing 4.0x damage.',
    multiplier: 4.0,
    type: 'DAMAGE'
  },
  'baphomet_archdemon_lord': {
    name: 'Obsidian Annihilation Rift',
    description: 'Opens a nether rift that tears enemy swarms apart for 6.2x AOE damage.',
    multiplier: 6.2,
    type: 'AOE_DAMAGE'
  },
  'baphomet_initiate': {
    name: 'Occult Rune Flare',
    description: 'Strikes the target with concentrated nether embers dealing 3.4x damage.',
    multiplier: 3.4,
    type: 'DAMAGE'
  },
  'chrono_hatchling': {
    name: 'Temporal Needle',
    description: 'Pierces through space-time dealing 3.5x damage.',
    multiplier: 3.5,
    type: 'DAMAGE'
  },
  'chrono_drake': {
    name: 'Paradox Chrono Breath',
    description: 'Exhales an accelerated time continuum for 4.8x AOE damage.',
    multiplier: 4.8,
    type: 'AOE_DAMAGE'
  },
  'ouroboros_time_sovereign': {
    name: 'Infinite Epoch Collapse',
    description: 'Collapses all alternate realities into one strike dealing 10.5x AOE damage.',
    multiplier: 10.5,
    type: 'AOE_DAMAGE'
  },
  'dawn_herald': {
    name: 'Morning Radiance',
    description: 'Calls down warm dawn rays dealing 3.2x damage and restoring 15% team HP.',
    multiplier: 3.2,
    healPercent: 15,
    type: 'AOE_DAMAGE_AND_HEAL'
  },
  'seraph_guardian': {
    name: 'Six-Wing Sanctuary',
    description: 'Unfurls holy wings dealing 4.5x damage and granting a 25% team shield.',
    multiplier: 4.5,
    shieldPercent: 25,
    type: 'AOE_DAMAGE'
  },
  'archangel_uriel': {
    name: 'Sunfire Judgement of Uriel',
    description: 'Descends with the sacred pillar of heaven dealing 9.0x AOE damage and shielding all allies for 30%.',
    multiplier: 9.0,
    shieldPercent: 30,
    type: 'AOE_DAMAGE'
  }
};

export function getSpiritUltimate(speciesId) {
  return SPIRIT_ULTIMATES[speciesId] || {
    name: 'Astral Surge',
    description: 'Releases pent-up astral energy dealing 3.2x damage.',
    multiplier: 3.2,
    type: 'DAMAGE'
  };
}

