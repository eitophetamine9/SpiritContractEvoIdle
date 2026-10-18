/**
 * Sprite Animation Controller
 * Handles frame stepping, animation state machines (idle, attack, hurt, cast),
 * and canvas rendering for modular 2D creature spritesheets.
 */

import { getGameIcon } from '../ui/icons/gameIcons.js';

// Embedded Manifest for instantaneous, offline-ready operation
export const ALL_54_SPIRIT_SPECIES = [
  'cat_spirit', 'dog_spirit', 'chicken_spirit', 'caterpillar_spirit', 'bull_spirit',
  'lizard_spirit', 'python_spirit', 'shark_spirit', 'bear_spirit', 'wisp_spirit',
  'fallen_warrior_spirit', 'furious_cat', 'elemental_cat', 'vitality_dog', 'guardian_dog',
  'battle_chicken', 'dino_genus_chicken', 'elegant_butterfly', 'mystical_butterfly',
  'raging_bull', 'elemental_bull', 'minotaur', 'multi_venom_lizard', 'komodo_dragon',
  'drake', 'highlord_python', 'huge_albino_anaconda', 'wyrm', 'great_white_shark',
  'megalodon', 'cosmic_oceanic_devourer', 'highlord_bear', 'bear_of_dreams',
  'cosmic_bear_ursalite', 'high_elf', 'sovereign_warrior', 'dreadlord_warrior',
  'solaris_lion_pride', 'solaris_the_one', 'gelda_ashes_empress', 'gelda_blood_sovereign',
  'astraea_valkyrie', 'astraea_celestial_queen', 'leviathan_behemoth',
  'leviathan_abyssal_primordial', 'baphomet_initiate', 'baphomet_voidbinder',
  'baphomet_archdemon_lord', 'chrono_hatchling', 'chrono_drake', 'ouroboros_time_sovereign',
  'dawn_herald', 'seraph_guardian', 'archangel_uriel'
];

export const SPRITE_MANIFEST = {
  defaultFrameWidth: 48,
  defaultFrameHeight: 48,
  speciesMapping: {
    // 1:1 direct species mappings for all 54 spirits
    cat_spirit: 'cat_spirit',
    dog_spirit: 'dog_spirit',
    chicken_spirit: 'chicken_spirit',
    caterpillar_spirit: 'caterpillar_spirit',
    bull_spirit: 'bull_spirit',
    lizard_spirit: 'lizard_spirit',
    python_spirit: 'python_spirit',
    shark_spirit: 'shark_spirit',
    bear_spirit: 'bear_spirit',
    wisp_spirit: 'wisp_spirit',
    fallen_warrior_spirit: 'fallen_warrior_spirit',
    furious_cat: 'furious_cat',
    elemental_cat: 'elemental_cat',
    vitality_dog: 'vitality_dog',
    guardian_dog: 'guardian_dog',
    battle_chicken: 'battle_chicken',
    dino_genus_chicken: 'dino_genus_chicken',
    elegant_butterfly: 'elegant_butterfly',
    mystical_butterfly: 'mystical_butterfly',
    raging_bull: 'raging_bull',
    elemental_bull: 'elemental_bull',
    minotaur: 'minotaur',
    multi_venom_lizard: 'multi_venom_lizard',
    komodo_dragon: 'komodo_dragon',
    drake: 'drake',
    highlord_python: 'highlord_python',
    huge_albino_anaconda: 'huge_albino_anaconda',
    wyrm: 'wyrm',
    great_white_shark: 'great_white_shark',
    megalodon: 'megalodon',
    cosmic_oceanic_devourer: 'cosmic_oceanic_devourer',
    highlord_bear: 'highlord_bear',
    bear_of_dreams: 'bear_of_dreams',
    cosmic_bear_ursalite: 'cosmic_bear_ursalite',
    high_elf: 'high_elf',
    sovereign_warrior: 'sovereign_warrior',
    dreadlord_warrior: 'dreadlord_warrior',
    solaris_lion_pride: 'solaris_lion_pride',
    solaris_the_one: 'solaris_the_one',
    gelda_ashes_empress: 'gelda_ashes_empress',
    gelda_blood_sovereign: 'gelda_blood_sovereign',
    astraea_valkyrie: 'astraea_valkyrie',
    astraea_celestial_queen: 'astraea_celestial_queen',
    leviathan_behemoth: 'leviathan_behemoth',
    leviathan_abyssal_primordial: 'leviathan_abyssal_primordial',
    baphomet_initiate: 'baphomet_initiate',
    baphomet_voidbinder: 'baphomet_voidbinder',
    baphomet_archdemon_lord: 'baphomet_archdemon_lord',
    chrono_hatchling: 'chrono_hatchling',
    chrono_drake: 'chrono_drake',
    ouroboros_time_sovereign: 'ouroboros_time_sovereign',
    dawn_herald: 'dawn_herald',
    seraph_guardian: 'seraph_guardian',
    archangel_uriel: 'archangel_uriel',

    // Legacy and variant aliases
    blazing_rooster: 'battle_chicken',
    phoenix_scion: 'dino_genus_chicken',
    chrysalis_spirit: 'caterpillar_spirit',
    iron_bull: 'raging_bull',
    albino_anaconda: 'huge_albino_anaconda',
    cosmic_devourer: 'cosmic_oceanic_devourer',
    ursalite: 'cosmic_bear_ursalite',
    fallen_warrior: 'fallen_warrior_spirit',
    solaris_lion_of_pride: 'solaris_lion_pride',
    gelda_thousand_ashes: 'gelda_ashes_empress',
    gelda_sanguine: 'gelda_blood_sovereign',
    leviathan_primordial: 'leviathan_abyssal_primordial',
    baphomet_archdemon: 'baphomet_archdemon_lord'
  },
  sheets: {
    feline_shadow: {
      path: '/assets/sprites/creatures/feline_shadow.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    canine_guardian: {
      path: '/assets/sprites/creatures/canine_guardian.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    avian_blaze: {
      path: '/assets/sprites/creatures/avian_blaze.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 6, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 12, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    bovine_earth: {
      path: '/assets/sprites/creatures/bovine_earth.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    insect_chrysalis: {
      path: '/assets/sprites/creatures/insect_chrysalis.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 6, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    draconic_leviathan: {
      path: '/assets/sprites/creatures/draconic_leviathan.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    celestial_sun: {
      path: '/assets/sprites/creatures/celestial_sun.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 6, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_shadow_behemoth: {
      path: '/assets/sprites/creatures/enemy_shadow_behemoth.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_corrupted_serpent: {
      path: '/assets/sprites/creatures/enemy_corrupted_serpent.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    baphomet_nether: {
      path: '/assets/sprites/creatures/baphomet_nether.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    chrono_drake: {
      path: '/assets/sprites/creatures/chrono_drake.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    seraph_valkyrie: {
      path: '/assets/sprites/creatures/seraph_valkyrie.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    spectral_undead: {
      path: '/assets/sprites/creatures/spectral_undead.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    celestial_angel: {
      path: '/assets/sprites/creatures/celestial_angel.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_void_wraith: {
      path: '/assets/sprites/creatures/enemy_void_wraith.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_infernal_demon: {
      path: '/assets/sprites/creatures/enemy_infernal_demon.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_colossus_titan: {
      path: '/assets/sprites/creatures/enemy_colossus_titan.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_frost_lich: {
      path: '/assets/sprites/creatures/enemy_frost_lich.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_kraken_overlord: {
      path: '/assets/sprites/creatures/enemy_kraken_overlord.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_hellfire_wyrm: {
      path: '/assets/sprites/creatures/enemy_hellfire_wyrm.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    enemy_blighted_chimera: {
      path: '/assets/sprites/creatures/enemy_blighted_chimera.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    avatar_olympian_god: {
      path: '/assets/sprites/creatures/avatar_olympian_god.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    forge_vulcan_automaton: {
      path: '/assets/sprites/creatures/forge_vulcan_automaton.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    victory_treasure_chest: {
      path: '/assets/sprites/relics/victory_treasure_chest.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 7], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_crown_zeus: {
      path: '/assets/sprites/relics/relic_crown_zeus.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_blade_ares: {
      path: '/assets/sprites/relics/relic_blade_ares.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_trident_poseidon: {
      path: '/assets/sprites/relics/relic_trident_poseidon.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_orb_arcane: {
      path: '/assets/sprites/relics/relic_orb_arcane.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_shield_athena: {
      path: '/assets/sprites/relics/relic_shield_athena.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_boots_hermes: {
      path: '/assets/sprites/relics/relic_boots_hermes.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_bow_artemis: {
      path: '/assets/sprites/relics/relic_bow_artemis.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_anvil_hephaestus: {
      path: '/assets/sprites/relics/relic_anvil_hephaestus.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    relic_pillar_atlas: {
      path: '/assets/sprites/relics/relic_pillar_atlas.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    divine_relic_scripture: {
      path: '/assets/sprites/relics/divine_relic_scripture.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 4, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 8, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    weapon_spectral_blade: {
      path: '/assets/sprites/weapons/weapon_spectral_blade.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    weapon_celestial_bow: {
      path: '/assets/sprites/weapons/weapon_celestial_bow.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    weapon_astral_staff: {
      path: '/assets/sprites/weapons/weapon_astral_staff.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    weapon_primordial_claws: {
      path: '/assets/sprites/weapons/weapon_primordial_claws.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    weapon_shadow_dagger: {
      path: '/assets/sprites/weapons/weapon_shadow_dagger.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    },
    weapon_titan_mallet: {
      path: '/assets/sprites/weapons/weapon_titan_mallet.svg',
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    }
  }
};

// Register all 54 unique spirit species sheets
for (const speciesId of ALL_54_SPIRIT_SPECIES) {
  if (!SPRITE_MANIFEST.sheets[speciesId]) {
    SPRITE_MANIFEST.sheets[speciesId] = {
      path: `/assets/sprites/creatures/${speciesId}.svg`,
      frameCount: 8,
      frameWidth: 48,
      frameHeight: 48,
      animations: {
        idle: { frames: [0, 1, 2, 3], fps: 5, loop: true },
        attack: { frames: [4, 5, 6, 4], fps: 10, loop: false },
        hurt: { frames: [7], fps: 6, loop: false }
      }
    };
  }
}

// Global Image Cache to avoid redundant network loads
const imageCache = new Map();

export function preloadSpriteSheet(sheetKey) {
  if (typeof window === 'undefined' || typeof Image === 'undefined') return null;
  if (imageCache.has(sheetKey)) return imageCache.get(sheetKey);

  const sheetDef = SPRITE_MANIFEST.sheets[sheetKey];
  if (!sheetDef) return null;

  const img = new Image();
  img.src = sheetDef.path;
  imageCache.set(sheetKey, img);
  return img;
}

export function getSheetKeyForSpecies(speciesOrId) {
  if (!speciesOrId) return 'cat_spirit';
  const id = typeof speciesOrId === 'object'
    ? (speciesOrId.speciesId || speciesOrId.id || speciesOrId.sheetKey)
    : speciesOrId;
  if (!id) return 'cat_spirit';
  if (SPRITE_MANIFEST.sheets[id]) return id;
  if (SPRITE_MANIFEST.speciesMapping[id] && SPRITE_MANIFEST.sheets[SPRITE_MANIFEST.speciesMapping[id]]) {
    return SPRITE_MANIFEST.speciesMapping[id];
  }
  return 'cat_spirit';
}

export function getSheetKeyForEnemy(enemy) {
  if (!enemy) return 'enemy_shadow_behemoth';
  if (enemy.sheetKey && SPRITE_MANIFEST.sheets[enemy.sheetKey]) {
    return enemy.sheetKey;
  }
  const name = (enemy.name || '').toLowerCase();
  const id = (enemy.id || enemy.speciesId || '').toLowerCase();
  const fullText = `${name} ${id}`;

  // Dedicated Overlord & Dungeon Boss Sprites
  if (fullText.includes('kraken') || fullText.includes('octopus') || fullText.includes('squid') || fullText.includes('benthic') || fullText.includes('abyssal') || fullText.includes('sunken')) {
    return 'enemy_kraken_overlord';
  }
  if (fullText.includes('hellfire') || fullText.includes('wyrm') || fullText.includes('caldera') || fullText.includes('magma wyrm') || fullText.includes('volcan')) {
    return 'enemy_hellfire_wyrm';
  }
  if (fullText.includes('chimera') || fullText.includes('blight') || fullText.includes('toxic') || fullText.includes('spore') || fullText.includes('venom beast')) {
    return 'enemy_blighted_chimera';
  }
  if (fullText.includes('vulcan') || fullText.includes('automaton') || fullText.includes('smelter') || fullText.includes('forge') || fullText.includes('clockwork')) {
    return 'forge_vulcan_automaton';
  }
  if (fullText.includes('avatar') || fullText.includes('olympian') || fullText.includes('pantheon') || fullText.includes('zeus') || fullText.includes('ares') || fullText.includes('poseidon') || fullText.includes('athena') || fullText.includes('apollo') || fullText.includes('artemis') || fullText.includes('hermes') || fullText.includes('atlas')) {
    return 'avatar_olympian_god';
  }

  // General Biome Enemies
  if (fullText.includes('void') || fullText.includes('wraith') || fullText.includes('madness') || fullText.includes('phantom')) {
    return 'enemy_void_wraith';
  }
  if (fullText.includes('infernal') || fullText.includes('demon') || fullText.includes('flame') || fullText.includes('fire') || fullText.includes('baphomet')) {
    return 'enemy_infernal_demon';
  }
  if (fullText.includes('frost') || fullText.includes('lich') || fullText.includes('ice') || fullText.includes('glacial') || fullText.includes('winter')) {
    return 'enemy_frost_lich';
  }
  if (fullText.includes('titan') || fullText.includes('colossus') || fullText.includes('golem') || fullText.includes('iron') || fullText.includes('earth') || fullText.includes('minotaur')) {
    return 'enemy_colossus_titan';
  }
  if (fullText.includes('serpent') || fullText.includes('snake') || fullText.includes('hydra') || fullText.includes('leviathan')) {
    return 'enemy_corrupted_serpent';
  }
  if (enemy.isBoss || fullText.includes('overlord') || fullText.includes('behemoth') || fullText.includes('hades')) {
    return 'enemy_shadow_behemoth';
  }
  if (fullText.includes('hound') || fullText.includes('wolf') || fullText.includes('cerberus')) {
    return 'canine_guardian';
  }
  // Alternating dynamic fallback
  return (name.length % 2 === 0) ? 'enemy_shadow_behemoth' : 'enemy_void_wraith';
}

export function getSheetKeyForRelic(relicOrSetId, slotType) {
  const godId = typeof relicOrSetId === 'object' ? (relicOrSetId?.setId || relicOrSetId?.godId) : relicOrSetId;
  const slot = typeof relicOrSetId === 'object' ? (relicOrSetId?.slotTypeId || relicOrSetId?.type) : slotType;

  if (godId === 'victory_treasure_chest' || godId === 'chest' || slot === 'chest') {
    return 'victory_treasure_chest';
  }
  if (godId === 'athena' || slot === 'totem' || slot === 'shield') {
    return 'relic_shield_athena';
  }
  if (godId === 'hermes' || slot === 'charm' || slot === 'boots') {
    return 'relic_boots_hermes';
  }
  if (godId === 'artemis' || slot === 'ring' || slot === 'bow') {
    return 'relic_bow_artemis';
  }
  if (godId === 'hephaestus' || slot === 'anvil' || slot === 'hammer') {
    return 'relic_anvil_hephaestus';
  }
  if (godId === 'atlas' || godId === 'celestial_pillar' || slot === 'pillar') {
    return 'relic_pillar_atlas';
  }
  if (godId === 'divine_scripture' || godId === 'scripture' || slot === 'scripture') {
    return 'divine_relic_scripture';
  }
  if (godId === 'zeus' || slot === 'headgear' || slot === 'crown') {
    return 'relic_crown_zeus';
  }
  if (godId === 'ares' || slot === 'weapon' || slot === 'sword') {
    return 'relic_blade_ares';
  }
  if (godId === 'poseidon' || slot === 'necklace' || slot === 'trident') {
    return 'relic_trident_poseidon';
  }
  if (godId === 'hades' || godId === 'apollo' || slot === 'orb') {
    return 'relic_orb_arcane';
  }
  return 'relic_crown_zeus';
}

/**
 * Generates HTML string for an animated creature/hero sprite
 */
export function createAnimatedSpriteHtml(speciesOrSheetKey, { isFlipped = false, extraClasses = '', glyph = '' } = {}) {
  let sheetKey = 'feline_shadow';
  if (typeof speciesOrSheetKey === 'string' && SPRITE_MANIFEST.sheets[speciesOrSheetKey]) {
    sheetKey = speciesOrSheetKey;
  } else {
    sheetKey = getSheetKeyForSpecies(speciesOrSheetKey);
  }
  const path = SPRITE_MANIFEST.sheets[sheetKey]?.path || `/assets/sprites/creatures/${sheetKey}.svg`;
  return `
    <div class="animated-pixel-sprite sprite-${sheetKey} ${isFlipped ? 'flipped-sprite' : ''} ${extraClasses}" style="--sprite-sheet: url('${path}');">
      <div class="sprite-frame-viewer"></div>
      <span class="core-glyph-fallback" style="display: none;">${glyph}</span>
    </div>
  `;
}

/**
 * Generates HTML string for an animated enemy sprite with optional boss styling
 */
export function createAnimatedEnemyHtml(enemy, { extraClasses = '' } = {}) {
  const sheetKey = getSheetKeyForEnemy(enemy);
  const path = SPRITE_MANIFEST.sheets[sheetKey]?.path || `/assets/sprites/creatures/${sheetKey}.svg`;
  const isBoss = enemy?.isBoss || false;
  return `
    <div class="animated-pixel-sprite sprite-enemy sprite-${sheetKey} ${isBoss ? 'boss-animated-sprite' : ''} ${extraClasses}" style="--sprite-sheet: url('${path}');">
      <div class="sprite-frame-viewer"></div>
      <span class="core-glyph-fallback" style="display: none;"></span>
    </div>
  `;
}

export function getSheetKeyForWeapon(weaponOrType) {
  if (!weaponOrType) return 'weapon_spectral_blade';
  const typeStr = typeof weaponOrType === 'object' 
    ? (weaponOrType.weaponType || weaponOrType.archetype || weaponOrType.subType || weaponOrType.id || weaponOrType.name || '')
    : weaponOrType;
  const str = String(typeStr).toLowerCase();

  if (str.includes('bow') || str.includes('arrow') || str.includes('archer')) {
    return 'weapon_celestial_bow';
  }
  if (str.includes('staff') || str.includes('scepter') || str.includes('wand') || str.includes('rod')) {
    return 'weapon_astral_staff';
  }
  if (str.includes('claw') || str.includes('fist') || str.includes('gauntlet')) {
    return 'weapon_primordial_claws';
  }
  if (str.includes('dagger') || str.includes('assassin') || str.includes('knife')) {
    return 'weapon_shadow_dagger';
  }
  if (str.includes('hammer') || str.includes('mallet') || str.includes('mace') || str.includes('titan')) {
    return 'weapon_titan_mallet';
  }
  return 'weapon_spectral_blade';
}

/**
 * Generates HTML string for an animated relic piece
 */
export function createAnimatedRelicHtml(relicOrSetId, slotType = 'headgear', { extraClasses = '' } = {}) {
  const sheetKey = getSheetKeyForRelic(relicOrSetId, slotType);
  const path = SPRITE_MANIFEST.sheets[sheetKey]?.path || `/assets/sprites/relics/${sheetKey}.svg`;
  return `
    <div class="animated-relic-sprite sprite-${sheetKey} ${extraClasses}" style="--sprite-sheet: url('${path}');">
      <div class="sprite-frame-viewer"></div>
    </div>
  `;
}

/**
 * Generates HTML string for an animated weapon piece
 */
export function createAnimatedWeaponHtml(weaponOrType, { extraClasses = '' } = {}) {
  const sheetKey = getSheetKeyForWeapon(weaponOrType);
  const path = SPRITE_MANIFEST.sheets[sheetKey]?.path || `/assets/sprites/weapons/${sheetKey}.svg`;
  return `
    <div class="animated-weapon-sprite sprite-${sheetKey} ${extraClasses}" style="--sprite-sheet: url('${path}');">
      <div class="sprite-frame-viewer"></div>
    </div>
  `;
}

/**
 * Generates HTML string for an animated victory treasure chest / relic cache
 */
export function createAnimatedChestHtml({ extraClasses = '' } = {}) {
  const path = '/assets/sprites/relics/victory_treasure_chest.svg';
  return `
    <div class="animated-treasure-chest ${extraClasses}" style="--sprite-sheet: url('${path}');">
      <div class="chest-frame-viewer"></div>
      <div class="chest-sparkles">${getGameIcon('sparkle', { size: 14, className: 'text-amber-300 animate-spin' })}</div>
    </div>
  `;
}


/**
 * Lightweight Sprite Animator instance
 */
export class SpriteAnimator {
  constructor(speciesOrSheetKey = 'feline_shadow') {
    this.sheetKey = SPRITE_MANIFEST.sheets[speciesOrSheetKey] 
      ? speciesOrSheetKey 
      : getSheetKeyForSpecies(speciesOrSheetKey);
    this.sheetDef = SPRITE_MANIFEST.sheets[this.sheetKey] || SPRITE_MANIFEST.sheets.feline_shadow;
    
    this.currentAnim = 'idle';
    this.frameIndex = 0;
    this.timeAccumulator = 0;
    this.isLooping = true;
    this.onCompleteCallback = null;
    this.image = preloadSpriteSheet(this.sheetKey);
    this.canvas = null;
    this.ctx = null;
    this.rafId = null;
    this.lastTimestamp = 0;
  }

  setSpecies(speciesId) {
    const newKey = getSheetKeyForSpecies(speciesId);
    if (newKey !== this.sheetKey) {
      this.sheetKey = newKey;
      this.sheetDef = SPRITE_MANIFEST.sheets[newKey] || SPRITE_MANIFEST.sheets.feline_shadow;
      this.image = preloadSpriteSheet(this.sheetKey);
      this.play('idle');
    }
  }

  play(animName = 'idle', { loop = true, onComplete = null } = {}) {
    if (!this.sheetDef.animations[animName]) {
      animName = 'idle';
    }
    this.currentAnim = animName;
    this.frameIndex = 0;
    this.timeAccumulator = 0;
    this.isLooping = loop;
    this.onCompleteCallback = onComplete;
  }

  triggerAttack(onComplete = null) {
    this.play('attack', {
      loop: false,
      onComplete: () => {
        this.play('idle');
        if (typeof onComplete === 'function') onComplete();
      }
    });
  }

  triggerHurt(onComplete = null) {
    this.play('hurt', {
      loop: false,
      onComplete: () => {
        this.play('idle');
        if (typeof onComplete === 'function') onComplete();
      }
    });
  }

  update(deltaSec) {
    const anim = this.sheetDef.animations[this.currentAnim] || this.sheetDef.animations.idle;
    if (!anim || !anim.frames || anim.frames.length === 0) return;

    const frameDuration = 1 / (anim.fps || 6);
    this.timeAccumulator += deltaSec;

    while (this.timeAccumulator >= frameDuration) {
      this.timeAccumulator -= frameDuration;
      if (this.frameIndex + 1 < anim.frames.length) {
        this.frameIndex++;
      } else {
        if (this.isLooping && anim.loop !== false) {
          this.frameIndex = 0;
        } else {
          if (typeof this.onCompleteCallback === 'function') {
            const cb = this.onCompleteCallback;
            this.onCompleteCallback = null;
            cb();
          }
          break;
        }
      }
    }
  }

  getCurrentFrame() {
    const anim = this.sheetDef.animations[this.currentAnim] || this.sheetDef.animations.idle;
    if (!anim || !anim.frames) return 0;
    return anim.frames[this.frameIndex] || 0;
  }

  render(ctx, dx, dy, dWidth = 48, dHeight = 48, { flipH = false } = {}) {
    if (!ctx) return;
    const frame = this.getCurrentFrame();
    const fw = this.sheetDef.frameWidth || 48;
    const fh = this.sheetDef.frameHeight || 48;
    const sx = frame * fw;
    const sy = 0;

    if (!this.image || !this.image.complete || this.image.naturalWidth === 0) {
      // Image still loading - subtle pulse silhouette fallback
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
      ctx.beginPath();
      ctx.roundRect(dx, dy, dWidth, dHeight, 8);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.save();
    if (flipH) {
      ctx.translate(dx + dWidth, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, sx, sy, fw, fh, 0, 0, dWidth, dHeight);
    } else {
      ctx.drawImage(this.image, sx, sy, fw, fh, dx, dy, dWidth, dHeight);
    }
    ctx.restore();
  }

  /**
   * Mounts an animated canvas player into a target DOM container
   */
  mount(containerEl, { width = 48, height = 48, flipH = false } = {}) {
    if (!containerEl || typeof document === 'undefined') return;

    this.destroy();

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.imageRendering = 'pixelated';
    this.canvas.style.display = 'block';
    this.canvas.className = 'animated-spirit-sprite';

    this.ctx = this.canvas.getContext('2d');
    containerEl.innerHTML = '';
    containerEl.appendChild(this.canvas);

    const loop = (timestamp) => {
      if (!this.canvas || !this.canvas.isConnected) {
        this.destroy();
        return;
      }
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const deltaSec = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
      this.lastTimestamp = timestamp;

      this.update(deltaSec);

      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.render(this.ctx, 0, 0, this.canvas.width, this.canvas.height, { flipH });
      }

      this.rafId = requestAnimationFrame(loop);
    };

    if (typeof requestAnimationFrame === 'function') {
      this.rafId = requestAnimationFrame(loop);
    }
  }

  destroy() {
    if (this.rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
    this.ctx = null;
  }
}
