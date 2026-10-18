import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const creaturesDir = path.join(projectRoot, 'public', 'assets', 'sprites', 'creatures');

// Import all 54 species
import { SPIRIT_SPECIES } from '../src/data/spiritsData.js';

if (!fs.existsSync(creaturesDir)) {
  fs.mkdirSync(creaturesDir, { recursive: true });
}

/**
 * Visual styling and archetype parameters for each spirit species
 */
const SPECIES_VISUALS = {
  // --- Feline Family ---
  cat_spirit: {
    shape: 'quad_feline',
    colors: { dark: '#78350f', body: '#d97706', lite: '#fbbf24', eye: '#38bdf8', aura: '#fef08a', fx: '#f59e0b' },
    details: { ears: 'pointed', tail: 'curl', claws: true }
  },
  furious_cat: {
    shape: 'quad_feline',
    colors: { dark: '#450a0a', body: '#dc2626', lite: '#f87171', eye: '#fef08a', aura: '#ef4444', fx: '#b91c1c' },
    details: { ears: 'pointed', tail: 'flame', armor: true, claws: true }
  },
  elemental_cat: {
    shape: 'quad_feline',
    colors: { dark: '#312e81', body: '#6366f1', lite: '#a5b4fc', eye: '#ec4899', aura: '#c084fc', fx: '#818cf8' },
    details: { ears: 'pointed', tail: 'triple', mysticOrb: true, claws: true }
  },

  // --- Canine Family ---
  dog_spirit: {
    shape: 'quad_canine',
    colors: { dark: '#451a03', body: '#92400e', lite: '#d97706', eye: '#34d399', aura: '#fed7aa', fx: '#b45309' },
    details: { ears: 'floppy', tail: 'wag', collar: true }
  },
  vitality_dog: {
    shape: 'quad_canine',
    colors: { dark: '#064e3b', body: '#059669', lite: '#34d399', eye: '#facc15', aura: '#6ee7b7', fx: '#10b981' },
    details: { ears: 'erect', tail: 'bushy', crest: 'leaf', armor: true }
  },
  guardian_dog: {
    shape: 'quad_canine',
    colors: { dark: '#1e293b', body: '#475569', lite: '#cbd5e1', eye: '#38bdf8', aura: '#67e8f9', fx: '#0ea5e9' },
    details: { ears: 'helm', tail: 'plated', shieldCrest: true, armor: true }
  },

  // --- Avian Family ---
  chicken_spirit: {
    shape: 'biped_avian',
    colors: { dark: '#7f1d1d', body: '#ef4444', lite: '#fca5a5', eye: '#fef08a', aura: '#fee2e2', fx: '#dc2626' },
    details: { crest: 'comb', beak: 'yellow', wings: 'short' }
  },
  battle_chicken: {
    shape: 'biped_avian',
    colors: { dark: '#3f1d0b', body: '#b45309', lite: '#f59e0b', eye: '#ef4444', aura: '#fde68a', fx: '#d97706' },
    details: { crest: 'warcomb', beak: 'bronze', spurs: true, armor: true }
  },
  dino_genus_chicken: {
    shape: 'theropod_raptor',
    colors: { dark: '#1c1917', body: '#44403c', lite: '#78716c', eye: '#f59e0b', aura: '#ef4444', fx: '#b91c1c' },
    details: { jaws: 'serrated', talons: 'scythe', dorsal: 'spined' }
  },

  // --- Insect / Lepidoptera Family ---
  caterpillar_spirit: {
    shape: 'segmented_crawler',
    colors: { dark: '#14532d', body: '#16a34a', lite: '#4ade80', eye: '#38bdf8', aura: '#bbf7d0', fx: '#22c55e' },
    details: { antennae: true, segments: 4, dewdrops: true }
  },
  elegant_butterfly: {
    shape: 'winged_lepidoptera',
    colors: { dark: '#3b0764', body: '#7e22ce', lite: '#c084fc', eye: '#38bdf8', aura: '#e9d5ff', fx: '#a855f7' },
    details: { wings: 'swallowtail', proboscis: true, shimmer: true }
  },
  mystical_butterfly: {
    shape: 'winged_lepidoptera',
    colors: { dark: '#172554', body: '#2563eb', lite: '#60a5fa', eye: '#f43f5e', aura: '#38bdf8', fx: '#00ffff' },
    details: { wings: 'nebula', antennae: true, stardust: true }
  },

  // --- Bovine Family ---
  bull_spirit: {
    shape: 'quad_bovine',
    colors: { dark: '#3f2212', body: '#78350f', lite: '#b45309', eye: '#fbbf24', aura: '#fed7aa', fx: '#92400e' },
    details: { horns: 'curved', muzzle: 'ringed', hooves: true }
  },
  raging_bull: {
    shape: 'quad_bovine',
    colors: { dark: '#18181b', body: '#27272a', lite: '#71717a', eye: '#ef4444', aura: '#f87171', fx: '#dc2626' },
    details: { horns: 'magma', fissures: true, steam: true }
  },
  elemental_bull: {
    shape: 'quad_bovine',
    colors: { dark: '#064e3b', body: '#047857', lite: '#10b981', eye: '#fef08a', aura: '#34d399', fx: '#059669' },
    details: { horns: 'crystal', crystalBack: true, armor: true }
  },
  minotaur: {
    shape: 'biped_minotaur',
    colors: { dark: '#1f1305', body: '#451a03', lite: '#78350f', eye: '#dc2626', aura: '#f59e0b', fx: '#b91c1c' },
    details: { horns: 'massive', axe: true, hooves: true }
  },

  // --- Reptile / Lizard Family ---
  lizard_spirit: {
    shape: 'quad_reptile',
    colors: { dark: '#14532d', body: '#15803d', lite: '#22c55e', eye: '#facc15', aura: '#86efac', fx: '#16a34a' },
    details: { tail: 'long', tongue: true, crest: 'ridge' }
  },
  multi_venom_lizard: {
    shape: 'quad_reptile',
    colors: { dark: '#581c87', body: '#9333ea', lite: '#c084fc', eye: '#22c55e', aura: '#d8b4fe', fx: '#a855f7' },
    details: { tail: 'dual', toxicPores: true, crest: 'frilled' }
  },
  komodo_dragon: {
    shape: 'quad_reptile',
    colors: { dark: '#1c1917', body: '#292524', lite: '#57534e', eye: '#ef4444', aura: '#a8a29e', fx: '#44403c' },
    details: { tail: 'heavy', armoredJaw: true, claws: true }
  },
  drake: {
    shape: 'winged_drake',
    colors: { dark: '#7f1d1d', body: '#b91c1c', lite: '#ef4444', eye: '#facc15', aura: '#fca5a5', fx: '#dc2626' },
    details: { wings: 'leather', horns: 'backward', flameBreath: true }
  },

  // --- Serpent Family ---
  python_spirit: {
    shape: 'coiled_serpent',
    colors: { dark: '#064e3b', body: '#059669', lite: '#10b981', eye: '#facc15', aura: '#a7f3d0', fx: '#047857' },
    details: { hood: false, patterns: 'rings' }
  },
  highlord_python: {
    shape: 'coiled_serpent',
    colors: { dark: '#3b0764', body: '#6b21a8', lite: '#9333ea', eye: '#fde047', aura: '#e9d5ff', fx: '#7e22ce' },
    details: { hood: true, crown: true, patterns: 'diamonds' }
  },
  huge_albino_anaconda: {
    shape: 'coiled_serpent',
    colors: { dark: '#cbd5e1', body: '#f1f5f9', lite: '#ffffff', eye: '#dc2626', aura: '#fda4af', fx: '#e2e8f0' },
    details: { hood: false, massive: true, rubyEyes: true }
  },
  wyrm: {
    shape: 'coiled_serpent',
    colors: { dark: '#1e1b4b', body: '#3730a3', lite: '#4f46e5', eye: '#06b6d4', aura: '#a5b4fc', fx: '#00ffff' },
    details: { fins: 'dorsal', thunderHorns: true, floating: true }
  },

  // --- Oceanic / Shark Family ---
  shark_spirit: {
    shape: 'swimming_piscine',
    colors: { dark: '#082f49', body: '#0284c7', lite: '#38bdf8', eye: '#ffffff', aura: '#bae6fd', fx: '#0369a1' },
    details: { dorsal: true, gills: 3, tail: 'crescent' }
  },
  great_white_shark: {
    shape: 'swimming_piscine',
    colors: { dark: '#1e293b', body: '#334155', lite: '#94a3b8', eye: '#000000', aura: '#cbd5e1', fx: '#475569' },
    details: { dorsal: true, teeth: 'serrated', battleScars: true }
  },
  megalodon: {
    shape: 'swimming_piscine',
    colors: { dark: '#0f172a', body: '#1e293b', lite: '#475569', eye: '#00ffff', aura: '#38bdf8', fx: '#0284c7' },
    details: { dorsal: 'plated', armorPlates: true, massiveJaw: true }
  },
  cosmic_oceanic_devourer: {
    shape: 'swimming_piscine',
    colors: { dark: '#09090b', body: '#1e1b4b', lite: '#4338ca', eye: '#f43f5e', aura: '#c084fc', fx: '#818cf8' },
    details: { voidVortex: true, constellationStar: true, astralFins: true }
  },

  // --- Ursine / Bear Family ---
  bear_spirit: {
    shape: 'quad_ursine',
    colors: { dark: '#27170e', body: '#5c381f', lite: '#85532f', eye: '#facc15', aura: '#d6b797', fx: '#78350f' },
    details: { ears: 'round', muzzle: 'broad', paws: 'heavy' }
  },
  highlord_bear: {
    shape: 'quad_ursine',
    colors: { dark: '#18181b', body: '#3f3f46', lite: '#71717a', eye: '#38bdf8', aura: '#a1a1aa', fx: '#d4af37' },
    details: { armor: true, pauldron: true, battleHelm: true }
  },
  bear_of_dreams: {
    shape: 'quad_ursine',
    colors: { dark: '#1e1b4b', body: '#312e81', lite: '#6366f1', eye: '#a5b4fc', aura: '#c084fc', fx: '#e0e7ff' },
    details: { auroraMist: true, astralFur: true, starEyes: true }
  },
  cosmic_bear_ursalite: {
    shape: 'quad_ursine',
    colors: { dark: '#090d16', body: '#0f172a', lite: '#38bdf8', eye: '#ffd700', aura: '#67e8f9', fx: '#00ffff' },
    details: { ursaMajorConstellation: true, starAura: true, titanHorns: false }
  },

  // --- Undead & Knight Family ---
  fallen_warrior_spirit: {
    shape: 'biped_knight',
    colors: { dark: '#0f172a', body: '#334155', lite: '#64748b', eye: '#38bdf8', aura: '#94a3b8', fx: '#06b6d4' },
    details: { sword: true, tatteredCloak: true, glowingVisor: true }
  },
  sovereign_warrior: {
    shape: 'biped_knight',
    colors: { dark: '#1e1b4b', body: '#4338ca', lite: '#818cf8', eye: '#fbbf24', aura: '#c7d2fe', fx: '#6366f1' },
    details: { broadsword: true, plateArmor: true, royalCape: true }
  },
  dreadlord_warrior: {
    shape: 'biped_knight',
    colors: { dark: '#09090b', body: '#18181b', lite: '#3f3f46', eye: '#dc2626', aura: '#9333ea', fx: '#a855f7' },
    details: { skullHelm: true, necroticFlames: true, zweihander: true }
  },
  high_elf: {
    shape: 'biped_knight',
    colors: { dark: '#064e3b', body: '#047857', lite: '#10b981', eye: '#fde047', aura: '#ffd700', fx: '#a7f3d0' },
    details: { pointedEars: true, circlet: true, rapier: true }
  },

  // --- Solaris Lions ---
  solaris_lion_pride: {
    shape: 'quad_lion',
    colors: { dark: '#78350f', body: '#d97706', lite: '#f59e0b', eye: '#fef08a', aura: '#fde68a', fx: '#ea580c' },
    details: { mane: 'solar', tailTuft: true, claws: true }
  },
  solaris_the_one: {
    shape: 'quad_lion',
    colors: { dark: '#451a03', body: '#b45309', lite: '#fbbf24', eye: '#ffffff', aura: '#ffd700', fx: '#ffedd5' },
    details: { sunDisc: true, coronaMane: true, divinityWings: true }
  },

  // --- Gelda Blood Empresses ---
  gelda_ashes_empress: {
    shape: 'biped_vampire',
    colors: { dark: '#18181b', body: '#450a0a', lite: '#991b1b', eye: '#f87171', aura: '#fca5a5', fx: '#dc2626' },
    details: { batWings: true, gothicGown: true, bloodChalice: true }
  },
  gelda_blood_sovereign: {
    shape: 'biped_vampire',
    colors: { dark: '#09090b', body: '#7f1d1d', lite: '#dc2626', eye: '#ffffff', aura: '#ef4444', fx: '#f43f5e' },
    details: { demonicCrown: true, bloodCrystals: true, shadowVeil: true }
  },

  // --- Astraea Valkyries ---
  astraea_valkyrie: {
    shape: 'biped_valkyrie',
    colors: { dark: '#0f172a', body: '#1e293b', lite: '#94a3b8', eye: '#38bdf8', aura: '#ffd700', fx: '#e2e8f0' },
    details: { wings: 'feathered', spear: true, shield: true, wingedHelm: true }
  },
  astraea_celestial_queen: {
    shape: 'biped_valkyrie',
    colors: { dark: '#1e1b4b', body: '#312e81', lite: '#818cf8', eye: '#ffffff', aura: '#ffd700', fx: '#c084fc' },
    details: { wings: 'six', judgmentBlade: true, halo: true, starMantle: true }
  },

  // --- Leviathans ---
  leviathan_behemoth: {
    shape: 'abyssal_leviathan',
    colors: { dark: '#082f49', body: '#075985', lite: '#0ea5e9', eye: '#38bdf8', aura: '#7dd3fc', fx: '#0284c7' },
    details: { tidalFins: true, armoredSpikes: true, hornPlate: true }
  },
  leviathan_abyssal_primordial: {
    shape: 'abyssal_leviathan',
    colors: { dark: '#020617', body: '#0f172a', lite: '#0369a1', eye: '#00ffff', aura: '#38bdf8', fx: '#06b6d4' },
    details: { trenchSpines: true, biolumLamps: true, whirlpoolAura: true }
  },

  // --- Baphomets ---
  baphomet_initiate: {
    shape: 'biped_baphomet',
    colors: { dark: '#3b0764', body: '#6b21a8', lite: '#9333ea', eye: '#facc15', aura: '#d8b4fe', fx: '#a855f7' },
    details: { ramHorns: true, hooves: true, netherClaws: true }
  },
  baphomet_voidbinder: {
    shape: 'biped_baphomet',
    colors: { dark: '#1e1b4b', body: '#312e81', lite: '#4f46e5', eye: '#ec4899', aura: '#a5b4fc', fx: '#6366f1' },
    details: { staff: true, voidTentacles: true, pentagramSigil: true }
  },
  baphomet_archdemon_lord: {
    shape: 'biped_baphomet',
    colors: { dark: '#18181b', body: '#27272a', lite: '#52525b', eye: '#ef4444', aura: '#f43f5e', fx: '#dc2626' },
    details: { colossalWings: true, magmaHorns: true, archblade: true }
  },

  // --- Chrono Dragons ---
  chrono_hatchling: {
    shape: 'winged_chrono',
    colors: { dark: '#451a03', body: '#92400e', lite: '#d97706', eye: '#38bdf8', aura: '#fef08a', fx: '#f59e0b' },
    details: { hourglassWings: true, clockTail: true, gearHorns: true }
  },
  chrono_drake: {
    shape: 'winged_chrono',
    colors: { dark: '#1c1917', body: '#78350f', lite: '#b45309', eye: '#00ffff', aura: '#fde047', fx: '#d4af37' },
    details: { dialHalo: true, chronoPlates: true, temporalTail: true }
  },
  ouroboros_time_sovereign: {
    shape: 'infinity_ouroboros',
    colors: { dark: '#090d16', body: '#1e293b', lite: '#38bdf8', eye: '#ffd700', aura: '#67e8f9', fx: '#d4af37' },
    details: { infinityCoil: true, eternityStars: true, goldenRunes: true }
  },

  // --- Celestials & Archangels ---
  wisp_spirit: {
    shape: 'floating_wisp',
    colors: { dark: '#713f12', body: '#ca8a04', lite: '#facc15', eye: '#ffffff', aura: '#fef08a', fx: '#eab308' },
    details: { orbGlow: true, trailingSparks: true, coreRays: true }
  },
  dawn_herald: {
    shape: 'biped_angel',
    colors: { dark: '#78350f', body: '#d97706', lite: '#fbbf24', eye: '#38bdf8', aura: '#fef08a', fx: '#f59e0b' },
    details: { wings: 'dual', goldenTrumpet: true, sunRays: true }
  },
  seraph_guardian: {
    shape: 'biped_angel',
    colors: { dark: '#1e293b', body: '#3b82f6', lite: '#60a5fa', eye: '#ffffff', aura: '#ffd700', fx: '#93c5fd' },
    details: { wings: 'four', holyShield: true, sacredBlade: true }
  },
  archangel_uriel: {
    shape: 'biped_angel',
    colors: { dark: '#450a0a', body: '#b91c1c', lite: '#f59e0b', eye: '#ffffff', aura: '#ffd700', fx: '#ef4444' },
    details: { wings: 'six', flamingSword: true, archangelHalo: true }
  }
};

/**
 * Generates an SVG 8-frame sprite sheet (384x48 px, 48x48 per frame)
 */
function generateSpriteSheetSvg(speciesId, info) {
  const c = info.colors;
  const d = info.details;
  const shape = info.shape;

  // Frame generator helper
  function renderFrame(frameIdx) {
    const xOffset = frameIdx * 48;
    const isIdle = frameIdx >= 0 && frameIdx <= 3;
    const isAttack = frameIdx >= 4 && frameIdx <= 6;
    const isHurt = frameIdx === 7;

    // Bobbing / breathing animation delta offsets
    let yBob = 0;
    let xBob = 0;
    let scaleX = 1;
    let scaleY = 1;
    let rotateDeg = 0;

    if (frameIdx === 0) { yBob = 0; }
    else if (frameIdx === 1) { yBob = 1.5; scaleX = 1.04; scaleY = 0.96; }
    else if (frameIdx === 2) { yBob = -1.5; scaleX = 0.96; scaleY = 1.04; }
    else if (frameIdx === 3) { yBob = -0.5; }
    else if (frameIdx === 4) { xBob = -3; yBob = 1; rotateDeg = -6; } // Windup
    else if (frameIdx === 5) { xBob = 6; yBob = -2; rotateDeg = 8; }  // Lunge strike
    else if (frameIdx === 6) { xBob = 3; yBob = 0; rotateDeg = 3; }   // Impact follow-through
    else if (frameIdx === 7) { xBob = -5; yBob = 3; rotateDeg = -14; scaleX = 0.9; } // Hurt

    let frameContent = '';

    // Ground Shadow
    const shadowRx = Math.max(6, 14 * scaleX);
    frameContent += `<ellipse cx="24" cy="42" rx="${shadowRx}" ry="4" fill="rgba(0,0,0,0.3)"/>\n`;

    // Creature Body Group with animation transforms
    frameContent += `<g transform="translate(${24 + xBob}, ${24 + yBob}) rotate(${rotateDeg}) scale(${scaleX}, ${scaleY}) translate(-24, -24)">\n`;

    // Render Shape based on archetype
    if (shape.startsWith('quad_')) {
      // Quadruped Beast
      frameContent += `
        <!-- Tail -->
        <path d="M14 30 C8 ${26 + (isIdle ? frameIdx * 2 : 0)}, 6 18, 12 16" stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- Torso -->
        <rect x="14" y="22" width="20" height="13" rx="4" fill="${c.body}"/>
        <rect x="16" y="24" width="16" height="9" rx="2" fill="${c.lite}"/>
        <!-- Legs / Paws -->
        <rect x="14" y="34" width="4" height="6" rx="1" fill="${c.dark}"/>
        <rect x="20" y="34" width="4" height="6" rx="1" fill="${c.dark}"/>
        <rect x="26" y="34" width="4" height="6" rx="1" fill="${c.dark}"/>
        <rect x="30" y="34" width="4" height="6" rx="1" fill="${c.dark}"/>
        <!-- Head -->
        <rect x="22" y="12" width="14" height="12" rx="3" fill="${c.body}"/>
        <rect x="24" y="14" width="10" height="8" rx="2" fill="${c.lite}"/>
        <!-- Eyes -->
        <rect x="28" y="16" width="3" height="3" fill="${isHurt ? '#ef4444' : c.eye}"/>
      `;

      if (d.ears === 'pointed') {
        frameContent += `
          <polygon points="23,12 21,5 27,11" fill="${c.dark}"/>
          <polygon points="33,12 37,5 31,11" fill="${c.dark}"/>
        `;
      } else if (d.ears === 'floppy') {
        frameContent += `
          <path d="M22 13 C20 18, 19 24, 22 25" stroke="${c.dark}" stroke-width="3" fill="none"/>
        `;
      } else if (d.horns) {
        frameContent += `
          <path d="M24 12 C22 4, 16 6, 18 10" stroke="${c.dark}" stroke-width="3" fill="none"/>
          <path d="M32 12 C34 4, 40 6, 38 10" stroke="${c.dark}" stroke-width="3" fill="none"/>
        `;
      }
      if (d.mane) {
        frameContent += `<circle cx="27" cy="18" r="9" fill="none" stroke="${c.aura}" stroke-width="3" stroke-dasharray="3,2"/>`;
      }
    } else if (shape.startsWith('biped_')) {
      // Bipedal Hero / Knight / Valkyrie / Demon / Angel
      frameContent += `
        <!-- Cape / Aura -->
        <path d="M18 20 C14 30, 16 38, 20 40 L28 40 C32 38, 34 30, 30 20 Z" fill="${c.dark}"/>
        <!-- Legs -->
        <rect x="18" y="33" width="4" height="8" rx="1" fill="${c.dark}"/>
        <rect x="26" y="33" width="4" height="8" rx="1" fill="${c.dark}"/>
        <!-- Torso & Armor -->
        <rect x="17" y="18" width="14" height="16" rx="3" fill="${c.body}"/>
        <polygon points="24,19 19,25 29,25" fill="${c.lite}"/>
        <!-- Head / Helm -->
        <circle cx="24" cy="13" r="6" fill="${c.body}"/>
        <circle cx="24" cy="13" r="4" fill="${c.lite}"/>
        <rect x="23" y="12" width="4" height="2" fill="${isHurt ? '#ef4444' : c.eye}"/>
      `;

      if (d.wings) {
        const wingFlap = isIdle ? (frameIdx % 2 === 0 ? 0 : 2) : (isAttack ? -3 : 0);
        frameContent += `
          <path d="M17 18 C10 ${10 + wingFlap}, 6 ${22 + wingFlap}, 16 26 Z" fill="${c.lite}" opacity="0.85"/>
          <path d="M31 18 C38 ${10 + wingFlap}, 42 ${22 + wingFlap}, 32 26 Z" fill="${c.lite}" opacity="0.85"/>
        `;
      }
      if (d.sword || d.broadsword || d.spear || d.flamingSword) {
        const wAngle = isAttack ? (frameIdx === 5 ? 45 : -15) : 10;
        frameContent += `
          <g transform="translate(32, 22) rotate(${wAngle})">
            <line x1="0" y1="0" x2="0" y2="-16" stroke="${c.fx}" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="-3" y1="-3" x2="3" y2="-3" stroke="${c.aura}" stroke-width="2"/>
          </g>
        `;
      }
      if (d.shield || d.holyShield) {
        frameContent += `<path d="M14 20 L18 20 L18 28 L16 31 L14 28 Z" fill="${c.dark}" stroke="${c.aura}" stroke-width="1"/>`;
      }
      if (d.halo || d.archangelHalo) {
        frameContent += `<ellipse cx="24" cy="5" rx="7" ry="2" fill="none" stroke="${c.aura}" stroke-width="1.5"/>`;
      }
      if (d.ramHorns || d.magmaHorns) {
        frameContent += `
          <path d="M20 10 C15 6, 14 14, 18 16" stroke="${c.dark}" stroke-width="2.5" fill="none"/>
          <path d="M28 10 C33 6, 34 14, 30 16" stroke="${c.dark}" stroke-width="2.5" fill="none"/>
        `;
      }
    } else if (shape === 'swimming_piscine' || shape === 'abyssal_leviathan') {
      // Oceanic Shark / Leviathan
      const wave = isIdle ? Math.sin(frameIdx) * 2 : 0;
      frameContent += `
        <!-- Tail Fin -->
        <polygon points="8,24 2,${16 + wave} 2,${32 + wave}" fill="${c.dark}"/>
        <!-- Main Shark Body -->
        <ellipse cx="24" cy="24" rx="16" ry="9" fill="${c.body}"/>
        <path d="M12 24 C16 30, 32 30, 38 24 Z" fill="${c.lite}"/>
        <!-- Dorsal Fin -->
        <polygon points="22,15 26,7 28,15" fill="${c.dark}"/>
        <!-- Pectoral Fin -->
        <polygon points="26,27 28,35 34,27" fill="${c.dark}"/>
        <!-- Eye & Gills -->
        <circle cx="34" cy="22" r="1.5" fill="${isHurt ? '#ef4444' : c.eye}"/>
        <line x1="28" y1="20" x2="28" y2="24" stroke="${c.dark}" stroke-width="1"/>
        <line x1="30" y1="20" x2="30" y2="24" stroke="${c.dark}" stroke-width="1"/>
      `;
    } else if (shape === 'coiled_serpent' || shape === 'infinity_ouroboros') {
      // Serpent / Dragon Coils
      frameContent += `
        <!-- Coiled Loops -->
        <circle cx="24" cy="28" r="10" fill="none" stroke="${c.body}" stroke-width="6"/>
        <circle cx="24" cy="28" r="10" fill="none" stroke="${c.lite}" stroke-width="3" stroke-dasharray="4,2"/>
        <!-- Neck and Head -->
        <path d="M22 24 C20 16, 26 12, 32 14" stroke="${c.body}" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="32" cy="14" r="5" fill="${c.body}"/>
        <circle cx="33" cy="13" r="1.5" fill="${isHurt ? '#ef4444' : c.eye}"/>
        <!-- Forked Tongue -->
        <path d="M37 14 L41 12 M37 14 L41 16" stroke="#ef4444" stroke-width="1.5"/>
      `;
    } else if (shape === 'segmented_crawler') {
      // Caterpillar Crawler
      for (let s = 0; s < 4; s++) {
        const segX = 14 + s * 6;
        frameContent += `<circle cx="${segX}" cy="30" r="5" fill="${s % 2 === 0 ? c.body : c.lite}"/>`;
        frameContent += `<rect x="${segX - 1}" y="34" width="2" height="3" fill="${c.dark}"/>`;
      }
      // Head
      frameContent += `
        <circle cx="34" cy="26" r="6" fill="${c.body}"/>
        <circle cx="35" cy="25" r="1.5" fill="${c.eye}"/>
        <line x1="34" y1="21" x2="33" y2="15" stroke="${c.dark}" stroke-width="1.5"/>
        <line x1="37" y1="22" x2="40" y2="16" stroke="${c.dark}" stroke-width="1.5"/>
      `;
    } else if (shape === 'winged_lepidoptera') {
      // Butterfly
      const wingY = isIdle ? (frameIdx % 2 === 0 ? -1 : 1) : 0;
      frameContent += `
        <!-- Wings Top -->
        <ellipse cx="16" cy="${16 + wingY}" rx="9" ry="12" fill="${c.body}" transform="rotate(-20 16 16)"/>
        <ellipse cx="16" cy="${16 + wingY}" rx="6" ry="8" fill="${c.lite}" transform="rotate(-20 16 16)"/>
        <ellipse cx="32" cy="${16 + wingY}" rx="9" ry="12" fill="${c.body}" transform="rotate(20 32 16)"/>
        <ellipse cx="32" cy="${16 + wingY}" rx="6" ry="8" fill="${c.lite}" transform="rotate(20 32 16)"/>
        <!-- Wings Bottom -->
        <circle cx="17" cy="${28 + wingY}" r="6" fill="${c.lite}"/>
        <circle cx="31" cy="${28 + wingY}" r="6" fill="${c.lite}"/>
        <!-- Body -->
        <rect x="22" y="14" width="4" height="18" rx="2" fill="${c.dark}"/>
        <line x1="23" y1="14" x2="20" y2="8" stroke="${c.dark}" stroke-width="1.5"/>
        <line x1="25" y1="14" x2="28" y2="8" stroke="${c.dark}" stroke-width="1.5"/>
      `;
    } else if (shape === 'floating_wisp') {
      // Ethereal Wisp
      const wPulse = isIdle ? 1 + frameIdx * 0.08 : 1;
      frameContent += `
        <!-- Outer Aura -->
        <circle cx="24" cy="22" r="${14 * wPulse}" fill="${c.aura}" opacity="0.3"/>
        <circle cx="24" cy="22" r="${10 * wPulse}" fill="${c.lite}" opacity="0.6"/>
        <!-- Core -->
        <circle cx="24" cy="22" r="6" fill="${c.eye}"/>
        <circle cx="24" cy="22" r="3" fill="#ffffff"/>
        <!-- Trail -->
        <path d="M24 28 C20 34, 28 38, 24 42" stroke="${c.lite}" stroke-width="3" fill="none" stroke-linecap="round"/>
      `;
    } else {
      // Universal Mythical Creature Fallback Shape
      frameContent += `
        <rect x="14" y="18" width="20" height="18" rx="4" fill="${c.body}"/>
        <rect x="16" y="20" width="16" height="14" rx="2" fill="${c.lite}"/>
        <circle cx="24" cy="14" r="7" fill="${c.body}"/>
        <circle cx="26" cy="14" r="2" fill="${isHurt ? '#ef4444' : c.eye}"/>
      `;
    }

    // Attack Visual Effects on Frame 5 & 6
    if (frameIdx === 5) {
      frameContent += `
        <!-- Attack Flash Slash -->
        <path d="M34 10 L46 22 L36 34" stroke="${c.fx}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="44" cy="22" r="4" fill="${c.aura}"/>
      `;
    } else if (frameIdx === 6) {
      frameContent += `
        <!-- Impact Spark Burst -->
        <polygon points="42,16 46,22 42,28 40,22" fill="${c.fx}"/>
        <circle cx="43" cy="22" r="2" fill="#ffffff"/>
      `;
    }

    frameContent += `</g>\n`; // Close transformed body group

    return `  <!-- Frame ${frameIdx}: ${isIdle ? 'Idle' : isAttack ? 'Attack' : 'Hurt'} [x: ${xOffset}..${xOffset + 48}] -->\n  <g transform="translate(${xOffset}, 0)">\n${frameContent}  </g>\n`;
  }

  // Construct complete SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 48" width="384" height="48" shape-rendering="crispEdges">\n`;
  svg += `  <defs>\n    <style>.bg{fill:transparent;}</style>\n  </defs>\n\n`;

  for (let f = 0; f < 8; f++) {
    svg += renderFrame(f);
  }

  svg += `</svg>\n`;
  return svg;
}

// Generate all 54 SVGs
console.log('Generating 54 unique animated SVG spirit sprite sheets...');
let count = 0;

for (const speciesId of Object.keys(SPIRIT_SPECIES)) {
  const visualInfo = SPECIES_VISUALS[speciesId] || {
    shape: 'quad_feline',
    colors: { dark: '#1e1b4b', body: '#4338ca', lite: '#818cf8', eye: '#38bdf8', aura: '#c084fc', fx: '#f43f5e' },
    details: {}
  };

  const svgContent = generateSpriteSheetSvg(speciesId, visualInfo);
  const targetPath = path.join(creaturesDir, `${speciesId}.svg`);
  fs.writeFileSync(targetPath, svgContent, 'utf8');
  count++;
}

console.log(`[SUCCESS] Generated ${count} distinct animated spirit SVG sprite sheets in: ${creaturesDir}`);
