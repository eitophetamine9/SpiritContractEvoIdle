import { RARITIES, getRarityInfo, SPIRIT_SPECIES } from '../../data/spiritsData.js';

/**
 * Creates a distinctly styled CSS placeholder box for a Spirit.
 * Strict Rarity-First design (Common, Uncommon, Rare, Epic, Legendary, Mythical, Transcendent).
 * Standardized aspect ratio and slot for easy manual image/pixel-art drop-in.
 */
export function createSpiritPlaceholderBox(spiritOrSpecies, options = {}) {
  const species = spiritOrSpecies.speciesId 
    ? SPIRIT_SPECIES[spiritOrSpecies.speciesId] 
    : spiritOrSpecies;

  if (!species) return `<div class="pixel-box">Unknown</div>`;

  const tier = species.tier || 1;
  const stars = '★'.repeat(tier);
  const rarityName = (spiritOrSpecies.rarity || species.baseRarity || 'COMMON').toUpperCase();
  const rarityInfo = getRarityInfo(rarityName);
  const rarityLower = rarityName.toLowerCase();
  const boxClass = options.boxClass || '';
  const isCapped = options.isCapped || false;

  const glyph = species.avatarEmoji || '✨';

  return `
    <div class="pixel-box rarity-${rarityLower} ${boxClass} ${isCapped ? 'capped-pulse' : ''}" 
         data-species="${species.id}" 
         data-tier="${tier}"
         data-rarity="${rarityLower}"
         title="${species.name} [${rarityInfo.name}]">
      
      <div class="tier-tag">${stars} T${tier}</div>
      <div class="rarity-badge-mini" style="color: ${rarityInfo.color}; border-color: ${rarityInfo.border};">
        ${rarityInfo.name[0]}
      </div>

      <div class="pixel-art-slot" data-art-target="spirit-${species.id}">
        <!-- Manual Pixel Art / Sprite Image drop-in point -->
        <div class="placeholder-creature-sprite">
          <span class="core-glyph">${glyph}</span>
        </div>
      </div>

      <div class="rarity-ribbon ${rarityLower}">${rarityInfo.name.toUpperCase()}</div>
    </div>
  `;
}

/**
 * Creates a mysterious silhouette placeholder box for undiscovered spirits in the Compendium.
 */
export function createUnknownSpiritPlaceholderBox(species, options = {}) {
  const tier = species ? species.tier || 1 : 1;
  const stars = '★'.repeat(tier);
  const boxClass = options.boxClass || '';

  return `
    <div class="pixel-box rarity-unknown ${boxClass}" title="Unknown Spirit (Undiscovered)">
      <div class="tier-tag">${stars} T${tier}</div>
      <div class="rarity-badge-mini" style="color: #636e72; border-color: #636e72;">?</div>

      <div class="pixel-art-slot">
        <div class="placeholder-creature-sprite unknown-silhouette">
          <span class="core-glyph" style="filter: brightness(0) opacity(0.35);">❓</span>
        </div>
      </div>

      <div class="rarity-ribbon unknown">UNKNOWN</div>
    </div>
  `;
}

/**
 * Creates a distinct corrupted CSS placeholder box for Madness Zone enemies.
 */
export function createEnemyPlaceholderBox(enemy) {
  if (!enemy) return '';
  const enemyName = enemy.name || 'Corrupted Spirit';
  const enemyPower = typeof enemy.power === 'number' ? enemy.power : 0;
  const isBoss = !!enemy.isBoss;

  return `
    <div class="pixel-box enemy-box ${isBoss ? 'boss-box' : ''}" 
         data-enemy-boss="${isBoss}"
         title="${enemyName}">
      
      <div class="tier-tag" style="color: #ff4757; border-color: #ff4757;">
        ${isBoss ? '☠️ BOSS' : '👾 FOE'}
      </div>

      <div class="pixel-art-slot" data-art-target="enemy-${enemyName.toLowerCase().replace(/\s+/g, '-')}">
        <div class="placeholder-creature-sprite">
          <span class="core-glyph">${isBoss ? '👹' : '👿'}</span>
        </div>
      </div>

      <div class="rarity-ribbon" style="background: rgba(255, 0, 85, 0.75); color: #fff;">
        PWR ${enemyPower.toLocaleString()}
      </div>
    </div>
  `;
}
