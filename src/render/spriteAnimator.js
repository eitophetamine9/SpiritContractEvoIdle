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
    baphomet_voidbinder: 'draconic_leviathan',
    baphomet_archdemon: 'draconic_leviathan',
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

export function getSheetKeyForSpecies(speciesId) {
  if (!speciesId) return 'feline_shadow';
  return SPRITE_MANIFEST.speciesMapping[speciesId] || 'feline_shadow';
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
