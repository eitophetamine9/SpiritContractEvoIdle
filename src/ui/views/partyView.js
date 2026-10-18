import { gameState } from '../../state/gameState.js';
import { 
  SPIRIT_SPECIES, 
  getXpRequiredForLevel, 
  getRarityInfo,
  getRoleInfo,
  getSpiritRole,
  calculateSpiritStats,
  FORMATION_SLOTS,
  FORMATION_COLUMNS
} from '../../data/spiritsData.js';
import { RELIC_SLOT_TYPES, GREEK_GOD_SETS } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { showEvolutionCeremonyModal, showEquipmentSlotModal, showItemInspectModal } from '../components/modals.js';
import { audioManager } from '../../audio/audioManager.js';
import { createAnimatedRelicHtml, createAnimatedWeaponHtml, createAnimatedSpriteHtml } from '../../render/spriteAnimator.js';
import { showGameToast } from '../components/toast.js';
import { getGameIcon } from '../icons/gameIcons.js';

let activeViewMode = 'showcase'; // 'showcase', 'formation', or 'roster'
let selectedPartyIndex = 0;
let equipmentDrawerFilter = 'all'; // 'all', 'weapon', 'relic'
let selectedSlotForSwap = null;

export function renderPartyView(container) {
  const partySpirits = gameState.getPartySpirits();
  const xpRate = gameState.getXpGainRate();
  const totalPartyPower = gameState.getTotalPartyPower();
  const allEquipment = (gameState.state.inventory && gameState.state.inventory.equipment) || [];
  const bagCount = allEquipment.length;

  // Clamp selected index
  if (selectedPartyIndex >= partySpirits.length && partySpirits.length > 0) {
    selectedPartyIndex = partySpirits.length - 1;
  }

  const isFormationUnlocked = gameState.isFeatureUnlocked('FORMATION_3X3');
  if (!isFormationUnlocked && activeViewMode === 'formation') {
    activeViewMode = 'showcase';
  }

  const selectedSpirit = partySpirits[selectedPartyIndex] || partySpirits[0] || null;

  container.innerHTML = `
    <div class="party-container">
      
      <!-- AFK Training Status Banner -->
      <div class="afk-training-banner">
        <div class="afk-banner-left">
          <div class="afk-title">
            <span>${getGameIcon('torii', { size: '15px' })} AFK Training Chamber</span>
          </div>
          <div class="afk-subtitle">
            Equipped Spirits continuously gain XP (even while offline)
          </div>
        </div>

        <div class="afk-rate-pill">
          +${xpRate.toFixed(1)} XP/s
        </div>
      </div>

      <!-- Mode Switcher & Party Summary Strip -->
      <div class="party-top-controls-bar">
        <div class="party-mode-pills">
          <button id="btn-mode-formation" class="party-mode-pill ${activeViewMode === 'formation' ? 'active' : ''} ${!isFormationUnlocked ? 'feature-locked' : ''}">
            ${isFormationUnlocked ? `${getGameIcon('sword', { size: '13px' })} 3×3 Formation` : `${getGameIcon('lock', { size: '13px' })} 3×3 Grid (Lv. 3)`}
          </button>
          <button id="btn-mode-showcase" class="party-mode-pill ${activeViewMode === 'showcase' ? 'active' : ''}">
            ${getGameIcon('crown', { size: '13px', color: '#ffd152' })} Hero Pedestal
          </button>
          <button id="btn-mode-roster" class="party-mode-pill ${activeViewMode === 'roster' ? 'active' : ''}">
            ${getGameIcon('scroll', { size: '13px' })} Party Roster
          </button>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="bag-count-pill" title="Total weapons & relics in your equipment inventory">${getGameIcon('vault', { size: '12px' })} ${bagCount} Relics</span>
          <button id="btn-party-sanctum-link" class="trials-link-pill sanctum-link-pill" title="Open Dedicated Spirit Sanctum Hub">
            ${getGameIcon('sanctum', { size: '12px', color: '#ffd152' })} Sanctum
          </button>
          <button id="btn-party-trials-link" class="trials-link-pill" title="Jump to Pantheon Trials">
            ${getGameIcon('trials', { size: '12px', color: '#38bdf8' })} Trials
          </button>
        </div>
      </div>

      ${activeViewMode === 'formation' 
        ? renderFormationModeHtml(partySpirits) 
        : (activeViewMode === 'showcase' 
            ? renderShowcaseModeHtml(partySpirits, selectedSpirit, allEquipment) 
            : renderRosterModeHtml(partySpirits))}

    </div>
  `;

  attachEventListeners(container);
}

/**
 * 3x3 Tactical Squad Formation Mode (Phase 2 & 5 Implementation)
 */
function renderFormationModeHtml(partySpirits) {
  const formationData = gameState.getPartyFormation();
  const { slots, counts, isValid, validationError } = formationData;

  return `
    <div class="formation-view-container">
      
      <!-- Formation Status & Header -->
      <div class="formation-header-card">
        <div class="formation-title-group">
          <div class="formation-main-title">
            <span class="text-glow">${getGameIcon('sword', { size: '15px' })} 3×3 Tactical Squad Formation</span>
            <span class="formation-validity-badge ${isValid ? 'valid' : 'invalid'}">
              ${isValid ? `${getGameIcon('check', { size: '12px', color: '#2ecc71' })} Valid Formation` : `${getGameIcon('alert', { size: '12px', color: '#ff4757' })} ${validationError}`}
            </span>
          </div>
          <div class="formation-subtitle">
            Position spirits on the 3×3 tactical battlefield: <strong>1 Backline</strong> (Sanctuary Anchor), <strong>2–3 Midline</strong> (Flank Cadence), and <strong>1–2 Frontline</strong> (Vanguard Tanks).
          </div>
        </div>

        <div class="formation-actions-row">
          <div class="formation-quota-chips">
            <span class="quota-chip ${counts.back === 1 ? 'met' : ''}" title="Backline: Exactly 1 spirit">
              ${getGameIcon('target', { size: '11px' })} Back: ${counts.back}/1
            </span>
            <span class="quota-chip ${counts.mid >= 2 && counts.mid <= 3 ? 'met' : ''}" title="Midline: 2 or 3 spirits">
              ${getGameIcon('statPower', { size: '11px', color: '#ffd152' })} Mid: ${counts.mid}/3
            </span>
            <span class="quota-chip ${counts.front >= 1 && counts.front <= 2 ? 'met' : ''}" title="Frontline: 1 or 2 spirits">
              ${getGameIcon('roleTank', { size: '11px', color: '#1e90ff' })} Front: ${counts.front}/2
            </span>
            <span class="quota-chip ${counts.total === 5 ? 'met' : ''}" title="Total active squad size">
              ${getGameIcon('torii', { size: '11px', color: '#ff4757' })} Squad: ${counts.total}/5
            </span>
          </div>

          <button id="btn-auto-align-formation" class="btn-auto-align" title="Automatically arrange squad into optimal role positions">
            ${getGameIcon('sparkle', { size: '12px' })} Auto-Align Formation
          </button>
        </div>
      </div>

      <!-- 3x3 Tactical Battle Grid: 3 Columns -->
      <div class="tactical-battle-grid">
        
        <!-- Column 0: Backline -->
        <div class="grid-column backline-column">
          <div class="column-header">
            <div class="column-title">
              <span>${getGameIcon('target', { size: '13px' })} BACKLINE</span>
              <span class="col-count-pill">${counts.back}/1</span>
            </div>
            <div class="column-perk-tag" title="Perk: +15% ATK & Heal potency, -50% threat footprint">
              ${getGameIcon('sparkle', { size: '11px', color: '#ffd152' })} Sanctuary (+15% ATK/Heal, -50% Aggro)
            </div>
          </div>

          <div class="column-tiles-stack">
            ${['b1', 'b2', 'b3'].map(slotId => renderTileSlotHtml(slots[slotId], slotId)).join('')}
          </div>
        </div>

        <!-- Column 1: Midline -->
        <div class="grid-column midline-column">
          <div class="column-header">
            <div class="column-title">
              <span>${getGameIcon('statPower', { size: '13px', color: '#ffd152' })} MIDLINE</span>
              <span class="col-count-pill">${counts.mid}/3</span>
            </div>
            <div class="column-perk-tag" title="Perk: Balanced attack cadence & flexible synergy">
              ${getGameIcon('sword', { size: '11px' })} Flank Cadence (1.0x Threat)
            </div>
          </div>

          <div class="column-tiles-stack">
            ${['m1', 'm2', 'm3'].map(slotId => renderTileSlotHtml(slots[slotId], slotId)).join('')}
          </div>
        </div>

        <!-- Column 2: Frontline -->
        <div class="grid-column frontline-column">
          <div class="column-header">
            <div class="column-title">
              <span>${getGameIcon('roleTank', { size: '13px', color: '#1e90ff' })} FRONTLINE</span>
              <span class="col-count-pill">${counts.front}/2</span>
            </div>
            <div class="column-perk-tag" title="Perk: +15% Armor/DEF, 2.0x innate threat aggro draw">
              ${getGameIcon('roleTank', { size: '11px', color: '#1e90ff' })} Vanguard (+15% DEF, 2.0x Taunt/Aggro)
            </div>
          </div>

          <div class="column-tiles-stack">
            ${['f1', 'f2', 'f3'].map(slotId => renderTileSlotHtml(slots[slotId], slotId)).join('')}
          </div>
        </div>

      </div>

      <!-- Tactical Interaction Hint -->
      <div class="formation-instruction-bar">
        <span>${getGameIcon('info', { size: '13px', color: '#ffd152' })} ${selectedSlotForSwap ? `Selected [${selectedSlotForSwap.toUpperCase()}]. Tap another tile to swap positions, or tap again to cancel.` : 'Tap any hero or tile to select and swap positions. Tanks naturally draw enemy focus to shield back/midline allies!'}</span>
      </div>

    </div>
  `;
}

function compactNumber(num) {
  if (typeof num !== 'number') return num;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 10000) return (num / 1000).toFixed(0) + 'k';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
}

function renderTileSlotHtml(slotData, slotId) {
  const spirit = slotData?.spirit;
  const isSelected = selectedSlotForSwap === slotId;

  if (!spirit) {
    return `
      <div class="grid-tile-card tile-empty ${isSelected ? 'tile-selected' : ''}" 
           data-formation-slot="${slotId}" 
           title="Empty Slot ${slotId.toUpperCase()} (${slotData.label})">
        <div class="tile-empty-header">
          <span class="tile-code">[${slotId.toUpperCase()}]</span>
          <span class="tile-rec-role">Pref: ${slotData.defaultRole}</span>
        </div>
        <div class="tile-empty-body">
          <span class="tile-plus-icon">+</span>
          <span class="tile-empty-label">${isSelected ? 'Tap to Move' : 'Empty Tile'}</span>
        </div>
      </div>
    `;
  }

  const species = SPIRIT_SPECIES[spirit.speciesId];
  const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));
  const roleKey = spirit.role || (species ? species.role : 'MAIN_DPS') || 'MAIN_DPS';
  const roleInfo = getRoleInfo(roleKey);
  const stats = calculateSpiritStats(spirit, spirit.level, spirit.rarity, spirit.ascensionLevel) || {};
  const totalPower = gameState.getSpiritTotalPower(spirit);

  return `
    <div class="grid-tile-card tile-occupied ${isSelected ? 'tile-selected' : ''}" 
         data-formation-slot="${slotId}" 
         style="border-color: ${isSelected ? '#ffd32a' : rarity.color}66;">
      
      <!-- Tile Header -->
      <div class="tile-card-header">
        <span class="tile-code">[${slotId.toUpperCase()}]</span>
        <span class="tile-role-badge" style="background: ${roleInfo.bg}; color: ${roleInfo.color}; border: 1px solid ${roleInfo.border};">
          ${roleInfo.icon} ${roleInfo.name}
        </span>
      </div>

      <!-- Tile Avatar & Identity -->
      <div class="tile-spirit-row">
        <div class="tile-avatar-box">
          ${createAnimatedSpriteHtml(spirit, { extraClasses: 'formation-tile-animated-sprite' })}
        </div>
        <div class="tile-spirit-info">
          <div class="tile-spirit-name" title="${spirit.customName}">${spirit.customName}</div>
          <div class="tile-level-tag">Lv.${spirit.level} • <span style="color: ${rarity.color}; font-weight: 700;">${rarity.name}</span></div>
          <div class="tile-pwr-tag">${getGameIcon('statPower', { size: '10px', color: '#ffd152' })} ${compactNumber(totalPower)} PWR</div>
        </div>
      </div>

      <!-- Tactical Combat Attributes Matrix -->
      <div class="tile-stat-strip">
        <span title="Hit Points (Max HP): ${(stats.maxHp || spirit.maxHp).toLocaleString()}">${getGameIcon('statHp', { size: '10px', color: '#2ed573' })} ${compactNumber(stats.maxHp || spirit.maxHp)}</span>
        <span title="Armor / DEF: ${(stats.def || 10).toLocaleString()}">${getGameIcon('statDef', { size: '10px', color: '#1e90ff' })} ${compactNumber(stats.def || 10)}</span>
        <span title="Attack Power: ${(stats.atk || spirit.power).toLocaleString()}">${getGameIcon('statAtk', { size: '10px', color: '#ff4757' })} ${compactNumber(stats.atk || spirit.power)}</span>
        <span title="Threat / Aggro Score: ${stats.threat || roleInfo.baseThreat}">${getGameIcon('target', { size: '10px', color: '#ffd152' })} ${stats.threat || roleInfo.baseThreat}</span>
      </div>
    </div>
  `;
}

/**
 * Hero Pedestal Showcase Mode (Reference 3 Aesthetic)
 */
function renderShowcaseModeHtml(partySpirits, spirit, allEquipment) {
  if (!spirit) {
    return `
      <div class="empty-showcase-card">
        <p style="font-size: 14px; color: var(--text-muted);">No spirits equipped in your party.</p>
        <button id="btn-go-vault-empty" class="btn-goto-dungeon-action">
          ${getGameIcon('vault', { size: '14px' })} Go to Vault & Equip Spirits
        </button>
      </div>
    `;
  }

  const species = SPIRIT_SPECIES[spirit.speciesId];
  const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));
  const roleKey = spirit.role || (species ? species.role : 'MAIN_DPS') || 'MAIN_DPS';
  const roleInfo = getRoleInfo(roleKey);
  const detailedStats = calculateSpiritStats(spirit, spirit.level, spirit.rarity, spirit.ascensionLevel) || {};
  const currentSlotId = gameState.getSpiritFormationSlot(spirit.id);
  const slotDef = currentSlotId ? FORMATION_SLOTS[currentSlotId] : null;
  const colDef = slotDef ? FORMATION_COLUMNS[slotDef.col] : null;

  const reqXp = getXpRequiredForLevel(spirit.level);
  const isCapped = spirit.level >= (species ? species.levelCap : 99);
  const xpPercent = isCapped ? 100 : Math.min(100, Math.floor((spirit.xp / reqXp) * 100));

  const { weapon, relics } = gameState.getSpiritEquippedItems(spirit);
  const activeSets = gameState.getSpiritActiveSetBonuses(spirit);
  const totalSpiritPower = gameState.getSpiritTotalPower(spirit);
  const bonusPower = totalSpiritPower - spirit.power;
  const spiritHp = detailedStats.maxHp || spirit.maxHp || 100;
  const spiritMp = spirit.currentMp || 0;

  // Filter bag equipment
  const filteredBag = allEquipment.filter(item => {
    if (equipmentDrawerFilter === 'weapon') return item.type === 'weapon';
    if (equipmentDrawerFilter === 'relic') return item.type === 'relic';
    return true;
  });

  return `
    <div class="hero-showcase-view">
      
      <!-- Top Pedestal Showcase Area: Left Tokens, Center Pedestal, Right Stats -->
      <div class="pedestal-showcase-grid">
        
        <!-- Left Column: Team Switcher Tokens -->
        <div class="team-switcher-col">
          <div class="team-switcher-label">TEAM</div>
          ${Array.from({ length: 5 }).map((_, idx) => {
            const member = partySpirits[idx];
            const isSelected = member && member.id === spirit.id;
            if (!member) {
              return `
                <button class="team-token-btn token-empty" data-action="go-vault" title="Empty Slot (Tap to equip from Vault)">
                  <span>+</span>
                </button>
              `;
            }
            const memSpecies = SPIRIT_SPECIES[member.speciesId];
            const memRarity = getRarityInfo(member.rarity || (memSpecies ? memSpecies.baseRarity : 'COMMON'));

            return `
              <button class="team-token-btn ${isSelected ? 'token-active' : ''} ${member.canEvolve ? 'token-evolvable' : ''}" 
                      data-action="select-member" 
                      data-index="${idx}"
                      style="border-color: ${isSelected ? '#ffd32a' : memRarity.color};"
                      title="${member.customName} (Lv. ${member.level})">
                <span class="token-sprite-box">
                  ${createAnimatedSpriteHtml(member, { extraClasses: 'token-hero-animated-sprite' })}
                </span>
                <span class="token-level-tag">Lv.${member.level}</span>
                ${member.canEvolve ? `<span class="token-evo-pip">${getGameIcon('sparkle', { size: '10px', color: '#ffd152' })}</span>` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Center Column: 3D Isometric Glowing Pedestal Stage -->
        <div class="pedestal-center-stage">
          <div class="pedestal-halo-glow"></div>
          <div class="pedestal-rays"></div>

          <!-- Featured Spirit Sprite on Stage -->
          <div class="featured-spirit-wrapper ${spirit.canEvolve ? 'pedestal-pulse-evo' : ''}">
            <div class="pedestal-hero-sprite-container">
              ${createAnimatedSpriteHtml(spirit, { extraClasses: 'pedestal-hero-animated-sprite' })}
            </div>
          </div>

          <!-- 3D Pedestal Base with Glowing Rune Ring -->
          <div class="pedestal-base">
            <div class="pedestal-rune-ring"></div>
            <div class="pedestal-platform-surface"></div>
            <div class="pedestal-platform-rim"></div>
          </div>
        </div>

        <!-- Right Column: Spirit Dossier & Segmented Attributes -->
        <div class="hero-dossier-col">
          <div class="hero-title-header">
            <div class="hero-name-row">
              <span class="hero-custom-name">${spirit.customName}</span>
              <span class="hero-role-badge" style="background: ${roleInfo.bg}; color: ${roleInfo.color}; border: 1px solid ${roleInfo.border};">
                ${roleInfo.icon} ${roleInfo.name.toUpperCase()}
              </span>
              <span class="hero-rarity-badge" style="border-color: ${rarity.color}; color: ${rarity.color}; background: rgba(0,0,0,0.5);">
                ${rarity.name.toUpperCase()}
              </span>
            </div>
            <div class="hero-species-sub">
              ${species ? species.name : 'Unknown Species'} • Lv. ${spirit.level}/${species ? species.levelCap : '??'} ${isCapped ? '[CAP]' : ''}
            </div>
            <div class="hero-formation-pos-banner">
              ${getGameIcon('target', { size: '12px', color: '#00d2d3' })} <strong>${slotDef ? slotDef.label : 'Midline Center (M2)'}</strong> • <span style="color: #00d2d3;">${colDef ? colDef.perkName : 'Flank Perk'}</span> (${colDef ? colDef.perkDesc : 'Balanced cadence'})
            </div>
          </div>

          <!-- Total Power Banner -->
          <div class="hero-power-card">
            <span class="hero-power-title">TOTAL POWER</span>
            <div class="hero-power-num">
              ${getGameIcon('statPower', { size: '13px', color: '#ffd152' })} ${totalSpiritPower.toLocaleString()} <span style="font-size: 11px; color: var(--text-muted);">PWR</span>
            </div>
            ${bonusPower > 0 ? `
              <div class="hero-power-breakdown">
                Base: ${spirit.power.toLocaleString()} | Relics: +${bonusPower.toLocaleString()}
              </div>
            ` : ''}
          </div>

          <!-- Tactical Attributes Grid -->
          <div class="hero-attributes-stack">
            <!-- ATK Power -->
            <div class="attribute-row">
              <div class="attr-label-row">
                <span>${getGameIcon('statAtk', { size: '13px', color: '#ff4757' })} ATK Power</span>
                <span class="attr-val">${detailedStats.atk || (spirit.power + (weapon ? weapon.atkPower : 0))}</span>
              </div>
              <div class="segmented-gauge">
                ${renderSegmentedGauge(Math.min(10, Math.ceil(totalSpiritPower / 100)))}
              </div>
            </div>

            <!-- Armor / DEF -->
            <div class="attribute-row">
              <div class="attr-label-row">
                <span>${getGameIcon('statDef', { size: '13px', color: '#1e90ff' })} Armor (DEF)</span>
                <span class="attr-val">${detailedStats.def || 10}</span>
              </div>
              <div class="segmented-gauge def-gauge">
                ${renderSegmentedGauge(Math.min(10, Math.ceil((detailedStats.def || 10) / 15)))}
              </div>
            </div>

            <!-- Health Points -->
            <div class="attribute-row">
              <div class="attr-label-row">
                <span>${getGameIcon('statHp', { size: '13px', color: '#2ed573' })} Health (HP)</span>
                <span class="attr-val">${spiritHp} HP</span>
              </div>
              <div class="segmented-gauge hp-gauge">
                ${renderSegmentedGauge(8)}
              </div>
            </div>

            <!-- Speed & Crit & Threat Row -->
            <div class="hero-tactical-stats-strip">
              <div class="sub-stat-pill" title="Action Cadence">${getGameIcon('statSpd', { size: '11px', color: '#eccc68' })} SPD: ${detailedStats.spd || 1.0}s</div>
              <div class="sub-stat-pill" title="Critical Chance">${getGameIcon('statCrit', { size: '11px', color: '#ff6b81' })} Crit: ${detailedStats.critRate || 5}% (${detailedStats.critDmg || 150}%)</div>
              <div class="sub-stat-pill" title="Innate Aggro / Threat Weight">${getGameIcon('target', { size: '11px', color: '#ffd152' })} Threat: ${detailedStats.threat || roleInfo.baseThreat}</div>
            </div>

            <!-- Mana / Ult Readiness -->
            <div class="attribute-row">
              <div class="attr-label-row">
                <span>${getGameIcon('statMana', { size: '13px', color: '#00d2ff' })} Mana (MP)</span>
                <span class="attr-val">${spiritMp} / 100 MP</span>
              </div>
              <div class="segmented-gauge mp-gauge">
                ${renderSegmentedGauge(Math.ceil((spiritMp / 100) * 10))}
              </div>
            </div>
          </div>

          <!-- Action Button: Evolve or Unequip -->
          <div class="hero-primary-action">
            ${spirit.canEvolve ? `
              <button class="btn-hero-evolve" data-action="evolve" data-id="${spirit.id}">
                ${getGameIcon('sparkle', { size: '13px', color: '#ffd152' })} EVOLVE (RNG CEREMONY)
              </button>
            ` : `
              <button class="btn-hero-unequip" data-action="unequip" data-id="${spirit.id}">
                Unequip from Party
              </button>
            `}
          </div>

        </div>

      </div>

      <!-- Lower Section: 1 Weapon + 6 Relics Matrix & Active Set Bonuses -->
      <div class="pedestal-equipment-rack">
        <div class="equipment-section-header">
          <div>
            <span class="equip-rack-title">${getGameIcon('sword', { size: '14px' })} Divine Arsenal & 6 Relics</span>
            <span class="equip-rack-sub">Tap any socket to upgrade artifacts (+1 to +15) or swap gear</span>
          </div>
          <button class="btn-quick-equip" data-action="quick-equip" data-spirit-id="${spirit.id}" title="Equip highest-stat available weapon & relics">
            ${getGameIcon('sparkle', { size: '12px' })} Quick Equip Best
          </button>
        </div>

        <div class="equipment-sockets-row">
          <!-- Weapon Socket -->
          <button class="equip-socket-btn weapon-socket ${weapon ? 'socket-equipped' : 'socket-empty'}"
                  data-action="open-equip"
                  data-spirit-id="${spirit.id}"
                  data-slot="weapon"
                  style="${weapon ? `border-color: ${weapon.color || '#f1c40f'};` : ''}"
                  title="${weapon ? `${weapon.name} (+${weapon.level || 1}) (${weapon.rarity})\n+${weapon.atkPower} ATK Power\nTap to Upgrade or Swap` : 'Weapon Socket (Tap to equip)'}">
            ${weapon 
              ? createAnimatedWeaponHtml(weapon, { extraClasses: 'socket-animated-sprite' }) 
              : `<span class="socket-icon">${getGameIcon('sword', { size: '16px' })}</span>`}
            <span class="socket-tag" style="${weapon ? `color: ${weapon.color};` : ''}">${weapon ? `WPN +${weapon.level || 1}` : '+WPN'}</span>
            ${weapon ? `
              <span class="socket-level-pill ${weapon.level >= 15 ? 'pill-max' : ''}">
                +${weapon.level || 1}
              </span>
            ` : ''}
          </button>

          <!-- 6 Relic Sockets -->
          ${RELIC_SLOT_TYPES.map(slot => {
            const relic = relics && relics[slot.id];
            return `
              <button class="equip-socket-btn relic-socket ${relic ? 'socket-equipped' : 'socket-empty'}"
                      data-action="open-equip"
                      data-spirit-id="${spirit.id}"
                      data-slot="${slot.id}"
                      style="${relic ? `border-color: ${relic.color || 'var(--primary-color)'};` : ''}"
                      title="${relic ? `${relic.name} (+${relic.level || 0})\n+${relic.mainStatValue} ${relic.mainStatName}\nSet: ${relic.setName}\nTap to Upgrade or Swap` : `Empty ${slot.name} (Tap to equip)`}">
                ${relic 
                  ? createAnimatedRelicHtml(relic, slot.id, { extraClasses: 'socket-animated-sprite' }) 
                  : `<span class="socket-icon">${slot.icon}</span>`}
                <span class="socket-tag" style="${relic ? `color: ${relic.accentColor || relic.color};` : ''}">
                  ${relic ? `${relic.setId.slice(0, 3).toUpperCase()} +${relic.level || 0}` : slot.name.slice(0, 3).toUpperCase()}
                </span>
                ${relic ? `
                  <span class="socket-level-pill ${relic.level >= 15 ? 'pill-max' : ''}">
                    +${relic.level || 0}
                  </span>
                ` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Active Set Bonuses -->
        ${activeSets.length > 0 ? `
          <div class="active-set-bonuses-strip">
            ${activeSets.map(sb => `
              <div class="set-bonus-badge-chip" style="border-color: ${sb.color}; color: ${sb.color}; background: rgba(0, 0, 0, 0.4);" title="${sb.description}">
                <span class="sb-god-tag">${sb.icon} ${sb.godName} [${sb.tier}]</span>
                <span class="sb-desc-tag">${sb.description}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="no-sets-active-note">
            <span>Equip 2pc or 4pc matching Greek God relics to awaken set bonuses</span>
          </div>
        `}
      </div>

      <!-- Rapid Equipment Inventory Drawer (Reference 3 Bottom Panel) -->
      <div class="rapid-equipment-drawer">
        <div class="drawer-header-row">
          <div class="drawer-title">
            <span>${getGameIcon('vault', { size: '13px' })} Equipment Inventory (${allEquipment.length})</span>
          </div>
          <div class="drawer-filters">
            <button class="drawer-filter-btn ${equipmentDrawerFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="drawer-filter-btn ${equipmentDrawerFilter === 'weapon' ? 'active' : ''}" data-filter="weapon">Weapons</button>
            <button class="drawer-filter-btn ${equipmentDrawerFilter === 'relic' ? 'active' : ''}" data-filter="relic">Relics</button>
          </div>
        </div>

        <div class="drawer-grid-container">
          ${filteredBag.length === 0 ? `
            <div class="empty-drawer-note">
              <span>No items matching filter in your bag. Challenge the Pantheon Trials to forge gear!</span>
            </div>
          ` : `
            <div class="drawer-items-scroll">
              ${filteredBag.slice(0, 16).map(item => {
                const isEquippedToCurrent = item.equippedToSpiritId === spirit.id;
                const godSet = item.setId ? GREEK_GOD_SETS[item.setId] : null;

                return `
                  <div class="drawer-item-card ${isEquippedToCurrent ? 'card-current-equipped' : ''}" style="border-color: ${item.color || 'var(--border-color)'};">
                    <div class="drawer-card-top">
                      <div class="drawer-item-icon-wrap" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${item.type === 'weapon'
                          ? createAnimatedWeaponHtml(item, { extraClasses: 'socket-animated-sprite' })
                          : createAnimatedRelicHtml(item, item.slotTypeId, { extraClasses: 'socket-animated-sprite' })
                        }
                      </div>
                      <div class="drawer-item-texts">
                        <span class="drawer-item-name" style="color: ${item.color || '#fff'};">
                          ${item.name} <span style="font-size: 10px; font-weight: 800; color: #ffd32a;">+${item.level || (item.type === 'weapon' ? 1 : 0)}</span>
                        </span>
                        <span class="drawer-item-stat">
                          ${item.type === 'weapon' ? `+${item.atkPower} ATK` : `+${item.mainStatValue} ${item.mainStatName}`}
                        </span>
                      </div>
                    </div>

                    <div class="drawer-card-actions">
                      <button class="btn-drawer-action upgrade-action" data-drawer-upgrade="${item.uid}" title="Upgrade this ${item.type === 'weapon' ? 'weapon' : 'artifact'} (+${(item.level || (item.type === 'weapon' ? 1 : 0)) + 1})">
                        ${getGameIcon('sparkle', { size: '12px' })} Upgrade
                      </button>
                      ${isEquippedToCurrent ? `
                        <button class="btn-drawer-action unequip-action" data-drawer-unequip data-slot="${item.type === 'weapon' ? 'weapon' : item.slotTypeId}">
                          Unequip
                        </button>
                      ` : `
                        <button class="btn-drawer-action equip-action" data-drawer-equip="${item.uid}">
                          Equip
                        </button>
                        ${!item.equippedToSpiritId ? `
                          <button class="btn-drawer-dismantle" data-drawer-dismantle="${item.uid}" title="Dismantle for Shards">
                            ${getGameIcon('refresh', { size: '12px' })}
                          </button>
                        ` : ''}
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>

    </div>
  `;
}

/**
 * Full Party Roster Mode (5-Card List)
 */
function renderRosterModeHtml(partySpirits) {
  return `
    <div class="party-slots-list">
      ${Array.from({ length: 5 }).map((_, index) => {
        const spirit = partySpirits[index];
        if (!spirit) {
          return `
            <div class="empty-party-card">
              <span>+ Empty Slot ${index + 1} (Equip from Vault)</span>
            </div>
          `;
        }

        const species = SPIRIT_SPECIES[spirit.speciesId];
        const rarity = getRarityInfo(spirit.rarity || (species ? species.baseRarity : 'COMMON'));
        const reqXp = getXpRequiredForLevel(spirit.level);
        const isCapped = spirit.level >= (species ? species.levelCap : 99);
        const xpPercent = isCapped ? 100 : Math.min(100, Math.floor((spirit.xp / reqXp) * 100));

        const { weapon, relics } = gameState.getSpiritEquippedItems(spirit);
        const activeSets = gameState.getSpiritActiveSetBonuses(spirit);
        const totalSpiritPower = gameState.getSpiritTotalPower(spirit);
        const equipBonusPower = totalSpiritPower - spirit.power;

        return `
          <div class="party-card-expanded ${spirit.canEvolve ? 'evolvable' : ''}" id="party-card-${spirit.id}">
            
            <div class="party-card-main-row">
              <div class="spirit-thumb-box roster-thumb-sprite-box">
                ${createAnimatedSpriteHtml(spirit, { extraClasses: 'roster-card-animated-sprite' })}
              </div>

              <div class="party-card-info">
                <div class="party-card-name-row">
                  <span class="party-card-name">${spirit.customName}</span>
                  <span class="party-card-level-badge">
                    Lv. ${spirit.level}/${species ? species.levelCap : '??'} ${isCapped ? '[CAP]' : ''}
                  </span>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                  <span style="color: ${rarity.color}; font-weight: 800; font-size: 11px;">[${rarity.name.toUpperCase()}]</span>
                  <span class="party-card-power" title="Base: ${spirit.power.toLocaleString()} | Relics: +${equipBonusPower.toLocaleString()}">
                    ${getGameIcon('statPower', { size: '11px', color: '#ffd152' })} ${totalSpiritPower.toLocaleString()} PWR ${equipBonusPower > 0 ? `<span style="font-size: 10px; color: #7bed9f;">(+${equipBonusPower})</span>` : ''}
                  </span>
                </div>

                <div class="xp-bar-track">
                  <div class="xp-bar-fill" style="width: ${xpPercent}%;"></div>
                  <div class="xp-bar-text">
                    ${isCapped ? 'LEVEL CAP REACHED' : `${Math.floor(spirit.xp)} / ${reqXp} XP (${xpPercent}%)`}
                  </div>
                </div>
              </div>

              <div class="party-card-actions">
                <button class="btn-quick-equip-card" data-action="quick-equip" data-spirit-id="${spirit.id}" title="Equip highest-stat gear">
                  ${getGameIcon('sparkle', { size: '12px' })} Auto Equip
                </button>
                ${spirit.canEvolve ? `
                  <button class="btn-evolve" data-action="evolve" data-id="${spirit.id}">
                    ${getGameIcon('sparkle', { size: '12px', color: '#ffd152' })} EVOLVE (RNG)
                  </button>
                ` : `
                  <button class="btn-unequip" data-action="unequip" data-id="${spirit.id}">
                    Unequip
                  </button>
                `}
              </div>
            </div>

            <!-- Lower Row: 1 Weapon + 6 Greek God Relics Rack -->
            <div class="spirit-equipment-section">
              <div class="equipment-section-header">
                <span class="equip-rack-title">${getGameIcon('sword', { size: '14px' })} Divine Arsenal & 6 Relics</span>
                <span class="equip-rack-sub">Tap any socket to upgrade artifacts (+1 to +15) or swap gear</span>
              </div>

              <div class="equipment-sockets-row">
                <button class="equip-socket-btn weapon-socket ${weapon ? 'socket-equipped' : 'socket-empty'}"
                        data-action="open-equip"
                        data-spirit-id="${spirit.id}"
                        data-slot="weapon"
                        style="${weapon ? `border-color: ${weapon.color || '#f1c40f'};` : ''}"
                        title="${weapon ? `${weapon.name} (+${weapon.level || 1}) (${weapon.rarity})\n+${weapon.atkPower} ATK Power\nTap to Upgrade or Swap` : 'Weapon Socket'}">
                  ${weapon 
                    ? createAnimatedWeaponHtml(weapon, { extraClasses: 'socket-animated-sprite' }) 
                    : `<span class="socket-icon">${getGameIcon('sword', { size: '16px' })}</span>`}
                  <span class="socket-tag" style="${weapon ? `color: ${weapon.color};` : ''}">${weapon ? `WPN +${weapon.level || 1}` : '+WPN'}</span>
                  ${weapon ? `
                    <span class="socket-level-pill ${weapon.level >= 15 ? 'pill-max' : ''}">
                      +${weapon.level || 1}
                    </span>
                  ` : ''}
                  <span class="socket-tag" style="${weapon ? `color: ${weapon.color};` : ''}">${weapon ? `WPN +${weapon.level || 1}` : '+WPN'}</span>
                  ${weapon ? `
                    <span class="socket-level-pill ${weapon.level >= 15 ? 'pill-max' : ''}">
                      +${weapon.level || 1}
                    </span>
                  ` : ''}
                </button>

                ${RELIC_SLOT_TYPES.map(slot => {
                  const relic = relics && relics[slot.id];
                  return `
                    <button class="equip-socket-btn relic-socket ${relic ? 'socket-equipped' : 'socket-empty'}"
                            data-action="open-equip"
                            data-spirit-id="${spirit.id}"
                            data-slot="${slot.id}"
                            style="${relic ? `border-color: ${relic.color || 'var(--primary-color)'};` : ''}"
                            title="${relic ? `${relic.name} (+${relic.level || 0})\n+${relic.mainStatValue} ${relic.mainStatName}\nTap to Upgrade/Equip` : `Empty ${slot.name}`}">
                      ${relic 
                        ? createAnimatedRelicHtml(relic, slot.id, { extraClasses: 'socket-animated-sprite' }) 
                        : `<span class="socket-icon">${slot.icon}</span>`}
                      <span class="socket-tag" style="${relic ? `color: ${relic.accentColor || relic.color};` : ''}">
                        ${relic ? `${relic.setId.slice(0, 3).toUpperCase()} +${relic.level || 0}` : slot.name.slice(0, 3).toUpperCase()}
                      </span>
                      ${relic ? `
                        <span class="socket-level-pill ${relic.level >= 15 ? 'pill-max' : ''}">
                          +${relic.level || 0}
                        </span>
                      ` : ''}
                    </button>
                  `;
                }).join('')}
              </div>

              ${activeSets.length > 0 ? `
                <div class="active-set-bonuses-strip">
                  ${activeSets.map(sb => `
                    <div class="set-bonus-badge-chip" style="border-color: ${sb.color}; color: ${sb.color}; background: rgba(0, 0, 0, 0.4);" title="${sb.description}">
                      <span class="sb-god-tag">${sb.icon} ${sb.godName} [${sb.tier}]</span>
                      <span class="sb-desc-tag">${sb.description}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="no-sets-active-note">
                  <span>Equip 2pc or 4pc matching Greek God relics to awaken set bonuses</span>
                </div>
              `}
            </div>

          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderSegmentedGauge(activeSegments = 5, totalSegments = 10) {
  return Array.from({ length: totalSegments }).map((_, i) => {
    return `<div class="gauge-seg ${i < activeSegments ? 'seg-filled' : ''}"></div>`;
  }).join('');
}

function attachEventListeners(container) {
  // Mode switcher
  document.getElementById('btn-mode-formation')?.addEventListener('click', () => {
    if (!gameState.isFeatureUnlocked('FORMATION_3X3')) {
      showGameToast('3×3 Tactical Grid unlocks at Contractor Level 2! Advance in the Madness Zone to level up.', 'lock');
      return;
    }
    activeViewMode = 'formation';
    renderPartyView(container);
  });

  document.getElementById('btn-mode-showcase')?.addEventListener('click', () => {
    activeViewMode = 'showcase';
    renderPartyView(container);
  });

  document.getElementById('btn-mode-roster')?.addEventListener('click', () => {
    activeViewMode = 'roster';
    renderPartyView(container);
  });

  // Auto-align formation action
  document.getElementById('btn-auto-align-formation')?.addEventListener('click', () => {
    try {
      gameState.autoFormatParty();
      audioManager.playSfx('success');
      renderPartyView(container);
    } catch (err) {
      alert(err.message);
    }
  });

  // Tap-to-move/swap 3x3 formation grid tiles
  container.querySelectorAll('[data-formation-slot]').forEach(tile => {
    tile.addEventListener('click', (e) => {
      const slotId = e.currentTarget.getAttribute('data-formation-slot');
      if (!selectedSlotForSwap) {
        // Select this slot as source
        selectedSlotForSwap = slotId;
        audioManager.playSfx('tap');
        renderPartyView(container);
      } else if (selectedSlotForSwap === slotId) {
        // Deselect on tap again
        selectedSlotForSwap = null;
        renderPartyView(container);
      } else {
        // Attempt swap/move
        const sourceSlot = selectedSlotForSwap;
        selectedSlotForSwap = null;
        try {
          gameState.swapFormationSlots(sourceSlot, slotId);
          audioManager.playSfx('equip');
        } catch (err) {
          alert(err.message);
        }
        renderPartyView(container);
      }
    });
  });

  // Switch selected team member
  container.querySelectorAll('[data-action="select-member"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      selectedPartyIndex = idx;
      audioManager.playSfx('tap');
      renderPartyView(container);
    });
  });

  // Quick Equip Best Gear
  container.querySelectorAll('[data-action="quick-equip"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-spirit-id');
      try {
        const res = gameState.quickEquipBest(spiritId);
        audioManager.playSfx('equip');
        renderPartyView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Evolve action
  container.querySelectorAll('[data-action="evolve"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-id');
      try {
        const result = gameState.evolveSpirit(spiritId);
        showEvolutionCeremonyModal(result, () => {
          renderPartyView(container);
        });
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Unequip spirit action
  container.querySelectorAll('[data-action="unequip"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-id');
      try {
        gameState.unequipSpirit(spiritId);
        renderPartyView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  // Open Equipment Slot Modal
  container.querySelectorAll('[data-action="open-equip"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-spirit-id');
      const slotType = e.currentTarget.getAttribute('data-slot');
      showEquipmentSlotModal({
        spiritId,
        slotType,
        onUpdate: () => renderPartyView(container)
      });
    });
  });

  // Drawer filter pills
  container.querySelectorAll('.drawer-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      equipmentDrawerFilter = e.currentTarget.getAttribute('data-filter');
      audioManager.playSfx('tap');
      renderPartyView(container);
    });
  });

  // Rapid drawer equip
  container.querySelectorAll('[data-drawer-equip]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemUid = e.currentTarget.getAttribute('data-drawer-equip');
      const partySpirits = gameState.getPartySpirits();
      const currentSpirit = partySpirits[selectedPartyIndex] || partySpirits[0];
      if (currentSpirit) {
        try {
          gameState.equipItem(currentSpirit.id, itemUid);
          renderPartyView(container);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // Rapid drawer upgrade
  container.querySelectorAll('[data-drawer-upgrade]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemUid = e.currentTarget.getAttribute('data-drawer-upgrade');
      const item = allEquipment.find(it => it.uid === itemUid);
      if (item) {
        showItemInspectModal({
          item,
          onUpdate: () => renderPartyView(container)
        });
      }
    });
  });

  // Rapid drawer unequip
  container.querySelectorAll('[data-drawer-unequip]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const slotType = e.currentTarget.getAttribute('data-slot');
      const partySpirits = gameState.getPartySpirits();
      const currentSpirit = partySpirits[selectedPartyIndex] || partySpirits[0];
      if (currentSpirit) {
        try {
          gameState.unequipItem(currentSpirit.id, slotType);
          renderPartyView(container);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // Rapid drawer dismantle
  container.querySelectorAll('[data-drawer-dismantle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemUid = e.currentTarget.getAttribute('data-drawer-dismantle');
      if (confirm('Dismantle this equipment item for Spirit Shards and Essences of the Gods?')) {
        try {
          const res = gameState.dismantleEquipment(itemUid);
          alert(`Dismantled equipment! Gained +${res.shardsGained} Spirit Shards${res.essencesGained > 0 ? ` and +${res.essencesGained} Essences of the Gods` : ''}.`);
          renderPartyView(container);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  });

  // Go to Vault links
  container.querySelectorAll('[data-action="go-vault"], #btn-go-vault-empty').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('[data-tab="vault"]')?.click();
    });
  });

  // Jump to Trials tab button
  document.getElementById('btn-party-trials-link')?.addEventListener('click', () => {
    document.querySelector('[data-tab="trials"]')?.click();
  });

  // Jump to Sanctum Hub button
  document.getElementById('btn-party-sanctum-link')?.addEventListener('click', () => {
    document.querySelector('[data-tab="sanctum"]')?.click();
  });
}
