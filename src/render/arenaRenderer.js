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

  loop = () => {
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
    } else {
      this.drawMadnessDais(ctx, centerX, centerY, rx, ry);
    }

    // 2. Parallax Ambient Particles
    this.renderParticles(ctx, w, h);

    // 3. Floating Damage Popups
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
