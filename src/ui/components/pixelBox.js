import { ELEMENTS, SPIRIT_SPECIES } from '../../data/spiritsData.js';

/**
 * Creates a brightly colored, distinct CSS placeholder box for a Spirit.
 * Designed specifically for manual pixel art drop-in integration.
 */
export function createSpiritPlaceholderBox(spiritOrSpecies, options = {}) {
  const species = spiritOrSpecies.speciesId 
    ? SPIRIT_SPECIES[spiritOrSpecies.speciesId] 
    : spiritOrSpecies;

  if (!species) return `<div class="pixel-box">Unknown</div>`;

  const elem = ELEMENTS[species.element] || ELEMENTS.FIRE;
  const tier = species.tier || 1;
  const stars = '★'.repeat(tier);
  const rarity = (spiritOrSpecies.rarity || species.baseRarity || 'common').toLowerCase();
  const boxClass = options.boxClass || '';
  const isCapped = options.isCapped || false;

  // Use the species specific emoji icon if available, otherwise elemental glyph
  const elementalGlyphs = {
    FIRE: '🔥',
    WATER: '💧',
    EARTH: '🌿',
    WIND: '🌪️',
    DARK: '🔮',
    LIGHT: '✨'
  };

  const glyph = species.avatarEmoji || elementalGlyphs[species.element] || '✨';

  return `
    <div class="pixel-box elem-${species.element} rarity-${rarity} ${boxClass} ${isCapped ? 'capped-pulse' : ''}" 
         data-species="${species.id}" 
         data-tier="${tier}"
         data-rarity="${rarity}"
         data-element="${species.element}"
         title="${species.name} (${elem.name})">
      
      <div class="tier-tag">${stars} T${tier}</div>
      <div class="element-tag">${elem.symbol}</div>

      <div class="pixel-art-slot" data-art-target="spirit-${species.id}">
        <!-- Manual Pixel Art Image drop-in point: <img class="pixel-art" src="..." alt="${species.name}" /> -->
        <div class="placeholder-creature-sprite">
          <span class="core-glyph">${glyph}</span>
        </div>
      </div>

      <div class="rarity-ribbon ${rarity}">${rarity.toUpperCase()}</div>
    </div>
  `;
}

/**
 * Creates a distinct corrupted CSS placeholder box for Madness Zone enemies.
 */
export function createEnemyPlaceholderBox(enemy) {
  return `
    <div class="pixel-box enemy-box" 
         data-enemy-boss="${enemy.isBoss}"
         title="${enemy.name}">
      
      <div class="tier-tag" style="color: #ff4757; border-color: #ff4757;">
        ${enemy.isBoss ? '☠️ BOSS' : '👾 CORRUPTED'}
      </div>

      <div class="pixel-art-slot" data-art-target="enemy-${enemy.name.toLowerCase().replace(/\s+/g, '-')}">
        <div class="placeholder-creature-sprite">
          <span class="core-glyph">${enemy.isBoss ? '👹' : '👿'}</span>
        </div>
      </div>

      <div class="rarity-ribbon" style="background: rgba(255, 0, 85, 0.7); color: #fff;">
        PWR ${enemy.power}
      </div>
    </div>
  `;
}
