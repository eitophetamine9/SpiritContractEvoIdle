/**
 * Sprite Animation Controller
 * Handles frame stepping, animation state machines (idle, attack, hurt, cast),
 * and canvas rendering for modular 2D creature spritesheets.
 */

// Embedded Manifest for instantaneous, offline-ready operation
export const SPRITE_MANIFEST = {
  defaultFrameWidth: 48,
  defaultFrameHeight: 48,
  speciesMapping: {
    cat_spirit: 'feline_shadow',
    furious_cat: 'feline_shadow',
    elemental_cat: 'feline_shadow',
    dog_spirit: 'canine_guardian',
    vitality_dog: 'canine_guardian',
    guardian_dog: 'canine_guardian',
    chicken_spirit: 'avian_blaze',
    blazing_rooster: 'avian_blaze',
    phoenix_scion: 'avian_blaze',
    bull_spirit: 'bovine_earth',
    iron_bull: 'bovine_earth',
    minotaur: 'bovine_earth',
    caterpillar_spirit: 'insect_chrysalis',
    chrysalis_spirit: 'insect_chrysalis',
    mystical_butterfly: 'insect_chrysalis',
    lizard_spirit: 'feline_shadow',
    multi_venom_lizard: 'feline_shadow',
    komodo_dragon: 'bovine_earth',
    drake: 'draconic_leviathan',
    python_spirit: 'draconic_leviathan',
    highlord_python: 'draconic_leviathan',
    albino_anaconda: 'draconic_leviathan',
    wyrm: 'draconic_leviathan',
    shark_spirit: 'draconic_leviathan',
    great_white_shark: 'draconic_leviathan',
    megalodon: 'draconic_leviathan',
    cosmic_devourer: 'draconic_leviathan',
    bear_spirit: 'bovine_earth',
    highlord_bear: 'bovine_earth',
    bear_of_dreams: 'bovine_earth',
    ursalite: 'bovine_earth',
    high_elf: 'celestial_sun',
    fallen_warrior: 'feline_shadow',
    sovereign_warrior: 'bovine_earth',
    dreadlord_warrior: 'bovine_earth',
    solaris_lion_of_pride: 'celestial_sun',
    solaris_the_one: 'celestial_sun',
    gelda_thousand_ashes: 'feline_shadow',
    gelda_sanguine: 'feline_shadow',
    astraea_valkyrie: 'celestial_sun',
    astraea_celestial_queen: 'celestial_sun',
    leviathan_behemoth: 'draconic_leviathan',
    leviathan_primordial: 'draconic_leviathan',
    baphomet_initiate: 'baphomet_nether',
    baphomet_voidbinder: 'baphomet_nether',
    baphomet_archdemon_lord: 'baphomet_nether',
    baphomet_archdemon: 'baphomet_nether',
    chrono_hatchling: 'chrono_drake',
    chrono_drake: 'chrono_drake',
    ouroboros_time_sovereign: 'chrono_drake',
    dawn_herald: 'seraph_valkyrie',
    seraph_guardian: 'seraph_valkyrie',
    archangel_uriel: 'seraph_valkyrie',
    wisp_spirit: 'celestial_sun'
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
  if (!speciesOrId) return 'feline_shadow';
  const id = typeof speciesOrId === 'object'
    ? (speciesOrId.speciesId || speciesOrId.id || speciesOrId.sheetKey)
    : speciesOrId;
  if (!id) return 'feline_shadow';
  if (SPRITE_MANIFEST.sheets[id]) return id;
  return SPRITE_MANIFEST.speciesMapping[id] || 'feline_shadow';
}

export function getSheetKeyForEnemy(enemy) {
  if (!enemy) return 'enemy_shadow_behemoth';
  const name = (enemy.name || '').toLowerCase();
  const id = (enemy.id || enemy.speciesId || '').toLowerCase();
  
  if (enemy.isBoss || name.includes('overlord') || name.includes('behemoth') || name.includes('titan') || name.includes('avatar') || name.includes('hades')) {
    return 'enemy_shadow_behemoth';
  }
  if (name.includes('serpent') || name.includes('wyrm') || name.includes('snake') || name.includes('hydra') || name.includes('abyss') || name.includes('leviathan')) {
    return 'enemy_corrupted_serpent';
  }
  if (name.includes('blaze') || name.includes('fire') || name.includes('phoenix') || name.includes('avian')) {
    return 'avian_blaze';
  }
  if (name.includes('bull') || name.includes('minotaur') || name.includes('golem') || name.includes('earth')) {
    return 'bovine_earth';
  }
  if (name.includes('hound') || name.includes('wolf') || name.includes('cerberus')) {
    return 'canine_guardian';
  }
  // Default alternating based on name length
  return (name.length % 2 === 0) ? 'enemy_shadow_behemoth' : 'enemy_corrupted_serpent';
}

export function getSheetKeyForRelic(relicOrSetId, slotType) {
  const godId = typeof relicOrSetId === 'object' ? (relicOrSetId?.setId || relicOrSetId?.godId) : relicOrSetId;
  const slot = typeof relicOrSetId === 'object' ? (relicOrSetId?.slotTypeId || relicOrSetId?.type) : slotType;

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
export function createAnimatedSpriteHtml(speciesOrSheetKey, { isFlipped = false, extraClasses = '', glyph = '✨' } = {}) {
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
      <span class="core-glyph-fallback" style="display: none;">👾</span>
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
