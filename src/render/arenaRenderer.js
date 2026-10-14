/**
 * 2.5D Isometric Arena Viewport Engine
 * Inspired by Seven Deadly Sins Idle & AFK Arena visual stages:
 * - Floating isometric battle dais with layered 3D depth and mode-specific architectures:
 *   1) 'pantheon': Olympian white marble dais, golden meander runes, lightning & divine beams.
 *   2) 'forge': Vulcan obsidian anvil dais, molten magma fissures, rising embers & fire sparks.
 *   3) 'sanctuary': Astral crystalline dais, rotating celestial rune circles, nebula aurora & stardust.
 *   4) 'madness': Corrupted void dais with elemental biome resonances.
 * - Parallax celestial ambient particles (matching Biome/God elemental alignment)
 * - Floating combat numbers & ultimate skill VFX waves
 * - Graceful fallback in non-browser/test environments
 */

import { gsap } from 'gsap';

export class ArenaRenderer25D {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.particles = [];
    this.popups = [];
    this.clashSparks = [];
    this.width = 460;
    this.height = 240;
    this.stageElement = 'EARTH';
    this.mode = 'madness'; // 'madness' | 'pantheon' | 'forge' | 'sanctuary'
    this.chamberId = null;
    this.isInitialized = false;
    this.time = 0;
  }

  init(containerEl, { mode = 'madness', element = 'EARTH', chamberId = null } = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    if (!containerEl) return;

    this.destroy();
    this.container = containerEl;
    this.mode = mode || 'madness';
    this.stageElement = (element || 'EARTH').toUpperCase();
    this.chamberId = chamberId;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'arena-canvas-25d';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.borderRadius = '14px';

    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', this.onResize);
    }
    this.initParticles();
    this.isInitialized = true;
    if (typeof requestAnimationFrame === 'function') {
      this.loop();
    }
  }

  onResize = () => {
    this.resize();
  };

  resize() {
    if (!this.canvas || !this.container) return;
    const rect = typeof this.container.getBoundingClientRect === 'function' 
      ? this.container.getBoundingClientRect() 
      : { width: 460, height: 240 };
    this.width = Math.max(320, rect.width || 460);
    this.height = Math.max(180, rect.height || 240);
    this.canvas.width = this.width * (window.devicePixelRatio || 1);
    this.canvas.height = this.height * (window.devicePixelRatio || 1);
    if (this.ctx && typeof this.ctx.scale === 'function') {
      this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
  }

  initParticles() {
    this.particles = [];
    const count = this.mode === 'forge' ? 45 : 35;

    // Palette selection based on mode and element
    let palette;
    if (this.mode === 'forge') {
      palette = ['#ff4757', '#ffa502', '#ff6b81', '#ff7f50', '#ffd32a'];
    } else if (this.mode === 'pantheon') {
      palette = ['#ffd700', '#f1c40f', '#ffffff', '#e0e0e0', '#00d2d3'];
    } else if (this.mode === 'sanctuary') {
      palette = ['#00ffff', '#70a1ff', '#a55eea', '#2ed573', '#ffd700'];
    } else if (this.mode === 'vault') {
      palette = ['#70a1ff', '#a55eea', '#ffd700', '#2ed573', '#00ffff', '#ffffff'];
    } else {
      const ELEMENT_COLORS = {
        FIRE: ['#ff4757', '#ffa502', '#ff6b81'],
        WATER: ['#00d2d3', '#54a0ff', '#2e86de'],
        EARTH: ['#2ed573', '#7bed9f', '#10ac84'],
        WIND: ['#ffd32a', '#eccc68', '#f1c40f'],
        DARK: ['#a55eea', '#8854d0', '#5f27cd'],
        LIGHT: ['#ffd700', '#ffeaa7', '#ffffff']
      };
      palette = ELEMENT_COLORS[this.stageElement] || ELEMENT_COLORS.EARTH;
    }

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: (this.mode === 'forge' ? 1.0 : 1.5) + Math.random() * 2.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        speedX: -0.4 + Math.random() * 0.8,
        speedY: (this.mode === 'forge' ? -0.8 : -0.4) - Math.random() * 0.8,
        alpha: 0.2 + Math.random() * 0.6,
        pulseSpeed: 0.02 + Math.random() * 0.03
      });
    }
  }

  setMode(mode, element = 'EARTH') {
    this.mode = mode || 'madness';
    this.stageElement = (element || 'EARTH').toUpperCase();
    this.initParticles();
  }

  setElement(element) {
    this.stageElement = (element || 'EARTH').toUpperCase();
    this.initParticles();
  }

  spawnDamagePopup(x, y, damage, isCrit = false) {
    if (!this.isInitialized) return;
    const popup = {
      text: isCrit ? `CRIT! -${damage}` : `-${damage}`,
      x: x || this.width * 0.7,
      y: y || this.height * 0.5,
      alpha: 1.0,
      scale: isCrit ? 1.4 : 1.0,
      color: isCrit ? '#ff4757' : (this.mode === 'forge' ? '#ff7f50' : '#ffd32a'),
      vy: -1.5
    };
    this.popups.push(popup);

    gsap.to(popup, {
      y: popup.y - 35,
      alpha: 0,
      scale: popup.scale * 1.2,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        const idx = this.popups.indexOf(popup);
        if (idx !== -1) this.popups.splice(idx, 1);
      }
    });
  }

  triggerUltimatePulse(color = '#ffd700') {
    if (!this.canvas || !this.container) return;
    const flashEl = document.createElement('div');
    flashEl.style.position = 'absolute';
    flashEl.style.inset = '0';
    flashEl.style.background = `radial-gradient(circle, ${color}66 0%, transparent 75%)`;
    flashEl.style.pointerEvents = 'none';
    flashEl.style.zIndex = '5';
    this.container.appendChild(flashEl);

    gsap.fromTo(flashEl, { opacity: 1, scale: 0.8 }, {
      opacity: 0,
      scale: 1.3,
      duration: 0.7,
      ease: 'power2.out',
      onComplete: () => {
        if (flashEl.parentNode) flashEl.parentNode.removeChild(flashEl);
      }
    });
  }

  triggerClashImpact(x, y, isCrit = false) {
    if (!this.canvas) return;
    const originX = typeof x === 'number' ? x : this.width * 0.5;
    const originY = typeof y === 'number' ? y : this.height * 0.58;
    const sparkCount = isCrit ? 24 : 14;
    const colors = isCrit 
      ? ['#ff0055', '#ffcc00', '#ffffff', '#ff4757', '#00f2fe'] 
      : ['#ffd32a', '#ffa502', '#ffffff', '#ff6b81'];

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 4 + 2) * (isCrit ? 1.5 : 1.0);
      const spark = {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 2),
        size: Math.random() * 3 + (isCrit ? 2 : 1),
        alpha: 1.0,
        decay: Math.random() * 0.04 + 0.03,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      this.clashSparks.push(spark);
    }
  }

  loop = () => {
    if (!this.canvas || !this.canvas.isConnected) {
      this.destroy();
      return;
    }
    if (typeof document !== 'undefined' && document.hidden) {
      this.animId = requestAnimationFrame(this.loop);
      return;
    }
    this.time += 0.03;
    this.render();
    this.animId = requestAnimationFrame(this.loop);
  };

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // 1. Draw 2.5D Isometric Floating Stone Platform (Battle Dais)
    const centerX = w * 0.5;
    const centerY = h * 0.62;
    const rx = w * 0.44; // horizontal radius
    const ry = h * 0.28; // vertical perspective compression

    if (this.mode === 'pantheon') {
      this.drawPantheonDais(ctx, centerX, centerY, rx, ry);
    } else if (this.mode === 'forge') {
      this.drawForgeDais(ctx, centerX, centerY, rx, ry);
    } else if (this.mode === 'sanctuary') {
      this.drawSanctuaryDais(ctx, centerX, centerY, rx, ry);
    } else if (this.mode === 'vault') {
      this.drawVaultDais(ctx, centerX, centerY, rx, ry);
    } else {
      this.drawMadnessDais(ctx, centerX, centerY, rx, ry);
    }

    // 2. Parallax Ambient Particles
    this.renderParticles(ctx, w, h);

    // 3. Dynamic Clash Impact Sparks
    this.renderClashSparks(ctx);

    // 4. Floating Damage Popups
    this.renderPopups(ctx);
  }

  // --- DAIS RENDERING PER MODE ---

  drawPantheonDais(ctx, cx, cy, rx, ry) {
    // Olympian White/Gold Marble Dais
    // Lower 3D Extrusion
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = '#1c1b18';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Surface Marble
    const surfaceGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx);
    surfaceGrad.addColorStop(0, '#36342d');
    surfaceGrad.addColorStop(0.7, '#24221c');
    surfaceGrad.addColorStop(1, '#151411');

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = surfaceGrad;
    ctx.fill();

    // Golden Meander Outer Rim
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner Sacred Olympian Circle
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2);
    ctx.strokeStyle = `rgba(241, 196, 15, ${0.25 + 0.25 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.75, ry * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Central Greek Cross Inscription
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.5, cy);
    ctx.lineTo(cx + rx * 0.5, cy);
    ctx.moveTo(cx, cy - ry * 0.5);
    ctx.lineTo(cx, cy + ry * 0.5);
    ctx.stroke();

    // Flanking Animated Olympian Marble Pillars
    this.drawOlympianPillar(ctx, cx - rx * 0.78, cy - ry * 0.18, 18, 54);
    this.drawOlympianPillar(ctx, cx + rx * 0.78, cy - ry * 0.18, 18, 54);
  }

  drawForgeDais(ctx, cx, cy, rx, ry) {
    // Vulcan Obsidian Anvil Dais with Molten Magma Fissures
    // Lower 3D Extrusion (Molten glow at base)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = '#1f0d06';
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Surface Obsidian
    const surfaceGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx);
    surfaceGrad.addColorStop(0, '#2d150b');
    surfaceGrad.addColorStop(0.65, '#190d07');
    surfaceGrad.addColorStop(1, '#0e0604');

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = surfaceGrad;
    ctx.fill();

    // Molten Rim Glow
    const pulse = 0.6 + 0.4 * Math.sin(this.time * 3);
    ctx.strokeStyle = '#ff793f';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#ff523d';
    ctx.shadowBlur = 12 * pulse;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing Lava Fissure Cracks across Dais
    ctx.save();
    ctx.strokeStyle = `rgba(255, 121, 63, ${0.4 + 0.3 * pulse})`;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#ff523d';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    // Left fissure
    ctx.moveTo(cx - rx * 0.6, cy + ry * 0.2);
    ctx.lineTo(cx - rx * 0.2, cy - ry * 0.1);
    ctx.lineTo(cx + rx * 0.1, cy + ry * 0.3);
    ctx.lineTo(cx + rx * 0.65, cy - ry * 0.2);
    // Transverse crack
    ctx.moveTo(cx - rx * 0.1, cy - ry * 0.5);
    ctx.lineTo(cx + rx * 0.05, cy);
    ctx.lineTo(cx - rx * 0.15, cy + ry * 0.5);
    ctx.stroke();
    ctx.restore();

    // Animated Vulcan Molten Anvil Basin & Spire
    this.drawVulcanForgeBasin(ctx, cx, cy - ry * 0.42, 64, 28);
  }

  drawSanctuaryDais(ctx, cx, cy, rx, ry) {
    // Astral Crystalline Dais with Celestial Rune Ring
    // Lower 3D Extrusion
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = '#0a141d';
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Surface Celestial Crystal
    const surfaceGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx);
    surfaceGrad.addColorStop(0, '#102e3b');
    surfaceGrad.addColorStop(0.65, '#0b1d28');
    surfaceGrad.addColorStop(1, '#050d13');

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = surfaceGrad;
    ctx.fill();

    // Astral Cyan Rim Glow
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.2);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00d2d3';
    ctx.shadowBlur = 10 * pulse;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rotating Astral Rune Circle
    const angle = this.time * 0.25;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx); // Apply perspective compression to rotating runes
    ctx.rotate(angle);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Cardinal Star Nodes
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const px = Math.cos(a) * (rx * 0.65);
      const py = Math.sin(a) * (rx * 0.65);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.restore();

    // Animated Aetherial Core Pulsar hovering over dais center
    this.drawAetherialCorePulsar(ctx, cx, cy - ry * 0.38);
  }

  drawVaultDais(ctx, cx, cy, rx, ry) {
    // Arcane Holographic Card Deck Dais
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = '#0c1020';
    ctx.fill();
    ctx.strokeStyle = '#5f27cd';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Prismatic / Holographic Surface Gradient
    const surfaceGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx);
    surfaceGrad.addColorStop(0, '#1a1d36');
    surfaceGrad.addColorStop(0.6, '#0f1224');
    surfaceGrad.addColorStop(1, '#080a14');

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = surfaceGrad;
    ctx.fill();

    // Prismatic Iridescent Rim Glow
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.5);
    ctx.strokeStyle = '#70a1ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#5352ed';
    ctx.shadowBlur = 12 * pulse;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Holographic Foil Inscriptions
    const angle = this.time * 0.15;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.rotate(angle);

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // 6 Elemental Card Nodes around rim
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * (rx * 0.55);
      const py = Math.sin(a) * (rx * 0.55);
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd32a';
      ctx.shadowColor = '#ffd32a';
      ctx.shadowBlur = 5;
      ctx.fill();
    }
    ctx.restore();
  }

  drawMadnessDais(ctx, cx, cy, rx, ry) {
    // Default Biome / Madness Stone Platform
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = '#101712';
    ctx.fill();
    ctx.strokeStyle = '#1b2a20';
    ctx.lineWidth = 2;
    ctx.stroke();

    const surfaceGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rx);
    surfaceGrad.addColorStop(0, '#1c2820');
    surfaceGrad.addColorStop(0.7, '#131e17');
    surfaceGrad.addColorStop(1, '#0b130e');

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = surfaceGrad;
    ctx.fill();

    const ELEMENT_ACCENTS = {
      FIRE: '#ff4757',
      WATER: '#00cec9',
      EARTH: '#2ed573',
      WIND: '#ffd32a',
      DARK: '#9b59b6',
      LIGHT: '#f1c40f'
    };
    const rimColor = ELEMENT_ACCENTS[this.stageElement] || '#2ed573';
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = rimColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.7, cy);
    ctx.lineTo(cx + rx * 0.7, cy);
    ctx.moveTo(cx, cy - ry * 0.7);
    ctx.lineTo(cx, cy + ry * 0.7);
    ctx.stroke();

    // Animated Biome Focal Monolith / Altar
    this.drawBiomeMonolith(ctx, cx, cy, rx, ry);
  }

  renderClashSparks(ctx) {
    if (!this.clashSparks || this.clashSparks.length === 0) return;
    for (let i = this.clashSparks.length - 1; i >= 0; i--) {
      const sp = this.clashSparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.alpha -= sp.decay;
      if (sp.alpha <= 0) {
        this.clashSparks.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(0.5, sp.size * sp.alpha), 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = Math.max(0, sp.alpha);
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }

  drawOlympianPillar(ctx, px, py, pw, ph) {
    ctx.save();
    // Marble column shadow
    ctx.beginPath();
    ctx.ellipse(px, py + ph, pw * 0.8, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();

    // Pillar Shaft
    const shaftGrad = ctx.createLinearGradient(px - pw / 2, py, px + pw / 2, py);
    shaftGrad.addColorStop(0, '#2e2b24');
    shaftGrad.addColorStop(0.5, '#686252');
    shaftGrad.addColorStop(1, '#1a1814');

    ctx.fillStyle = shaftGrad;
    ctx.fillRect(px - pw / 2, py, pw, ph);

    // Fluting ridges
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(px + (i * pw * 0.28), py + 2);
      ctx.lineTo(px + (i * pw * 0.28), py + ph - 2);
      ctx.stroke();
    }

    // Capital & Base (Golden Ionic Trims)
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(px - pw * 0.65, py - 4, pw * 1.3, 5);
    ctx.fillRect(px - pw * 0.65, py + ph - 2, pw * 1.3, 5);

    // Crackling lightning spark at capital
    const sparkPulse = Math.sin(this.time * 6 + px);
    if (sparkPulse > 0.6) {
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + (Math.sin(this.time * 12) * 8), py - 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawVulcanForgeBasin(ctx, bx, by, bw, bh) {
    ctx.save();
    // Heavy Obsidian Basin Pedestal
    ctx.beginPath();
    ctx.ellipse(bx, by + bh, bw * 0.5, bh * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#140a06';
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Molten Magma Surface
    const magmaPulse = 0.6 + 0.4 * Math.sin(this.time * 3);
    const magmaGrad = ctx.createRadialGradient(bx, by + bh * 0.6, 2, bx, by + bh * 0.6, bw * 0.4);
    magmaGrad.addColorStop(0, '#fde047');
    magmaGrad.addColorStop(0.5, '#ea580c');
    magmaGrad.addColorStop(1, '#7c2d12');

    ctx.beginPath();
    ctx.ellipse(bx, by + bh * 0.6, bw * 0.42, bh * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = magmaGrad;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 10 * magmaPulse;
    ctx.fill();

    // Floating Vulcan Hammer Sigil
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#ffd32a';
    ctx.shadowBlur = 6;
    ctx.fillRect(bx - 3, by + 4 + Math.sin(this.time * 2.5) * 3, 6, 12);
    ctx.fillRect(bx - 10, by + 2 + Math.sin(this.time * 2.5) * 3, 20, 6);
    ctx.restore();
  }

  drawAetherialCorePulsar(ctx, cx, cy) {
    ctx.save();
    const floatY = cy + Math.sin(this.time * 2) * 5;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 3);

    // Singularity Glow Core
    const coreGrad = ctx.createRadialGradient(cx, floatY, 2, cx, floatY, 22);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#00ffff');
    coreGrad.addColorStop(0.7, '#7c3aed');
    coreGrad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(cx, floatY, 22, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Orbiting Prismatic Shards
    for (let i = 0; i < 3; i++) {
      const angle = this.time * 1.5 + (i * Math.PI * 2 / 3);
      const sx = cx + Math.cos(angle) * 20;
      const sy = floatY + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3, 6, angle, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffd5';
      ctx.shadowColor = '#00ffd5';
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();
  }

  drawBiomeMonolith(ctx, cx, cy, rx, ry) {
    ctx.save();
    const elem = this.stageElement;
    const mx = cx + rx * 0.68;
    const my = cy - ry * 0.28;

    if (elem === 'FIRE') {
      // Volcanic Magma Vent Fumarole
      ctx.beginPath();
      ctx.ellipse(mx, my + 14, 18, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fill();

      // Vent Rock Cone
      ctx.beginPath();
      ctx.moveTo(mx - 14, my + 14);
      ctx.lineTo(mx - 6, my);
      ctx.lineTo(mx + 6, my);
      ctx.lineTo(mx + 14, my + 14);
      ctx.closePath();
      ctx.fillStyle = '#26120b';
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Magma Vent Flame Plume
      const flameH = 10 + Math.sin(this.time * 7) * 4;
      ctx.beginPath();
      ctx.ellipse(mx, my, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(mx - 4, my);
      ctx.quadraticCurveTo(mx, my - flameH, mx + 4, my);
      ctx.fillStyle = '#ff4757';
      ctx.shadowColor = '#ff6b81';
      ctx.shadowBlur = 10;
      ctx.fill();

    } else if (elem === 'WATER') {
      // Abyssal Benthic Coral Monolith with Shimmering Pearl
      ctx.beginPath();
      ctx.ellipse(mx, my + 22, 16, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // Coral Spire
      ctx.beginPath();
      ctx.moveTo(mx - 8, my + 22);
      ctx.lineTo(mx - 2, my + 4);
      ctx.lineTo(mx + 2, my + 4);
      ctx.lineTo(mx + 8, my + 22);
      ctx.closePath();
      ctx.fillStyle = '#0f2f3d';
      ctx.fill();
      ctx.strokeStyle = '#00cec9';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Luminous Oceanic Pearl
      const pearlPulse = 0.6 + 0.4 * Math.sin(this.time * 2.8);
      ctx.beginPath();
      ctx.arc(mx, my + 2, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e0f7fa';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12 * pearlPulse;
      ctx.fill();

    } else if (elem === 'DARK') {
      // Gargoyle / Shadow Void Obelisk
      ctx.beginPath();
      ctx.ellipse(mx, my + 26, 16, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();

      // Stone Obelisk
      ctx.fillStyle = '#181124';
      ctx.fillRect(mx - 7, my, 14, 26);
      ctx.strokeStyle = '#6b21a8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(mx - 7, my, 14, 26);

      // Pyramidion Cap
      ctx.beginPath();
      ctx.moveTo(mx - 7, my);
      ctx.lineTo(mx, my - 9);
      ctx.lineTo(mx + 7, my);
      ctx.closePath();
      ctx.fillStyle = '#2e1065';
      ctx.fill();
      ctx.stroke();

      // Glowing Ruby Eyes of Gargoyle
      const eyePulse = 0.5 + 0.5 * Math.sin(this.time * 4);
      ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + 0.6 * eyePulse})`;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.fillRect(mx - 4, my + 6, 2.5, 2);
      ctx.fillRect(mx + 1.5, my + 6, 2.5, 2);

    } else {
      // Swamp / Toxic Spore Monolith (EARTH / NATURE)
      ctx.beginPath();
      ctx.ellipse(mx, my + 24, 16, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fill();

      // Spore Spire
      ctx.beginPath();
      ctx.moveTo(mx - 8, my + 24);
      ctx.quadraticCurveTo(mx - 10, my + 10, mx - 3, my);
      ctx.quadraticCurveTo(mx + 10, my + 10, mx + 8, my + 24);
      ctx.closePath();
      ctx.fillStyle = '#14281a';
      ctx.fill();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Pulsing Toxic Lichen Nodules
      const sporePulse = 0.5 + 0.5 * Math.sin(this.time * 3);
      ctx.beginPath();
      ctx.arc(mx - 2, my + 12, 3, 0, Math.PI * 2);
      ctx.arc(mx + 3, my + 6, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#a3e635';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8 * sporePulse;
      ctx.fill();
    }
    ctx.restore();
  }

  renderParticles(ctx, w, h) {
    this.particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.y < 0) {
        p.y = h;
        p.x = Math.random() * w;
      }
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;

      const alphaPulse = Math.abs(Math.sin(this.time * 2 + p.x));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * (0.5 + 0.5 * alphaPulse);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }

  renderPopups(ctx) {
    this.popups.forEach(pop => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, pop.alpha));
      ctx.font = `bold ${Math.round(14 * pop.scale)}px sans-serif`;
      ctx.fillStyle = pop.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });
  }

  destroy() {
    this.isInitialized = false;
    if (this.animId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('resize', this.onResize);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.popups = [];
  }
}

export const arenaRenderer = new ArenaRenderer25D();
