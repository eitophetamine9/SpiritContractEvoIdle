import { gameState } from '../../state/gameState.js';
import { SPIRIT_SPECIES, getXpRequiredForLevel, getRarityInfo } from '../../data/spiritsData.js';
import { RELIC_SLOT_TYPES, GREEK_GOD_SETS } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { showEvolutionCeremonyModal, showEquipmentSlotModal, showItemInspectModal } from '../components/modals.js';
import { audioManager } from '../../audio/audioManager.js';

let activeViewMode = 'showcase'; // 'showcase' or 'roster'
let selectedPartyIndex = 0;
let equipmentDrawerFilter = 'all'; // 'all', 'weapon', 'relic'

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

  const selectedSpirit = partySpirits[selectedPartyIndex] || partySpirits[0] || null;

  container.innerHTML = `
    <div class="party-container">
      
      <!-- AFK Training Status Banner -->
      <div class="afk-training-banner">
        <div class="afk-banner-left">
          <div class="afk-title">
            <span>⛩️ AFK Training Chamber</span>
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
          <button id="btn-mode-showcase" class="party-mode-pill ${activeViewMode === 'showcase' ? 'active' : ''}">
            👑 Hero Pedestal
          </button>
          <button id="btn-mode-roster" class="party-mode-pill ${activeViewMode === 'roster' ? 'active' : ''}">
            📜 Party Roster
          </button>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="bag-count-pill" title="Total weapons & relics in your equipment inventory">🎒 ${bagCount} Relics</span>
          <button id="btn-party-trials-link" class="trials-link-pill" title="Jump to Pantheon Trials">
            🏛️ Trials
          </button>
        </div>
      </div>

      ${activeViewMode === 'showcase' ? renderShowcaseModeHtml(partySpirits, selectedSpirit, allEquipment) : renderRosterModeHtml(partySpirits)}

    </div>
  `;

  attachEventListeners(container);
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
          ⛩️ Go to Vault & Equip Spirits
        </button>
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
  const bonusPower = totalSpiritPower - spirit.power;
  const spiritHp = spirit.maxHp || 100;
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
                  ${createSpiritPlaceholderBox(member, { width: '32px', height: '32px' })}
                </span>
                <span class="token-level-tag">Lv.${member.level}</span>
                ${member.canEvolve ? '<span class="token-evo-pip">⚡</span>' : ''}
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
            ${createSpiritPlaceholderBox(spirit, { width: '130px', height: '130px', isCapped: spirit.canEvolve })}
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
              <span class="hero-rarity-badge" style="border-color: ${rarity.color}; color: ${rarity.color}; background: rgba(0,0,0,0.5);">
                ${rarity.name.toUpperCase()}
              </span>
            </div>
            <div class="hero-species-sub">
              ${species ? species.name : 'Unknown Species'} • Lv. ${spirit.level}/${species ? species.levelCap : '??'} ${isCapped ? '[CAP]' : ''}
            </div>
          </div>

          <!-- Total Power Banner -->
          <div class="hero-power-card">
            <span class="hero-power-title">TOTAL POWER</span>
            <div class="hero-power-num">
              ⚡ ${totalSpiritPower.toLocaleString()} <span style="font-size: 11px; color: var(--text-muted);">PWR</span>
            </div>
            ${bonusPower > 0 ? `
              <div class="hero-power-breakdown">
                Base: ${spirit.power.toLocaleString()} | Relics: +${bonusPower.toLocaleString()}
              </div>
            ` : ''}
          </div>

          <!-- Segmented Attribute Gauges -->
          <div class="hero-attributes-stack">
            <!-- ATK Power -->
            <div class="attribute-row">
              <div class="attr-label-row">
                <span>⚔️ ATK Power</span>
                <span class="attr-val">${spirit.power + (weapon ? weapon.atkPower : 0)}</span>
              </div>
              <div class="segmented-gauge">
                ${renderSegmentedGauge(Math.min(10, Math.ceil(totalSpiritPower / 100)))}
              </div>
            </div>

            <!-- Health Points -->
            <div class="attribute-row">
              <div class="attr-label-row">
                <span>❤️ Health (HP)</span>
                <span class="attr-val">${spiritHp} HP</span>
              </div>
              <div class="segmented-gauge hp-gauge">
                ${renderSegmentedGauge(8)}
              </div>
            </div>

            <!-- Mana / Ult Readiness -->
            <div class="attribute-row">
              <div class="attr-label-row">
                <span>💧 Mana (MP)</span>
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
                ⚡ EVOLVE (RNG CEREMONY)
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
          <span class="equip-rack-title">⚔️ Divine Arsenal & 6 Relics</span>
          <span class="equip-rack-sub">Tap any socket to upgrade artifacts (+1 to +15) or swap gear</span>
        </div>

        <div class="equipment-sockets-row">
          <!-- Weapon Socket -->
          <button class="equip-socket-btn weapon-socket ${weapon ? 'socket-equipped' : 'socket-empty'}"
                  data-action="open-equip"
                  data-spirit-id="${spirit.id}"
                  data-slot="weapon"
                  style="${weapon ? `border-color: ${weapon.color || '#f1c40f'};` : ''}"
                  title="${weapon ? `${weapon.name} (+${weapon.level || 1}) (${weapon.rarity})\n+${weapon.atkPower} ATK Power\nTap to Upgrade or Swap` : 'Weapon Socket (Tap to equip)'}">
            <span class="socket-icon">${weapon ? weapon.icon : '⚔️'}</span>
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
                <span class="socket-icon">${relic ? relic.icon : slot.icon}</span>
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
            <span>🎒 Equipment Inventory (${allEquipment.length})</span>
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
                      <span class="drawer-item-icon">${item.icon}</span>
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
                        ⚡ Upgrade
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
                            ♻️
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
              <div class="spirit-thumb-box">
                ${createSpiritPlaceholderBox(spirit, { isCapped: spirit.canEvolve })}
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
                    ⚡ ${totalSpiritPower.toLocaleString()} PWR ${equipBonusPower > 0 ? `<span style="font-size: 10px; color: #7bed9f;">(+${equipBonusPower})</span>` : ''}
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
                ${spirit.canEvolve ? `
                  <button class="btn-evolve" data-action="evolve" data-id="${spirit.id}">
                    ⚡ EVOLVE (RNG)
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
                <span class="equip-rack-title">⚔️ Divine Arsenal & 6 Relics</span>
                <span class="equip-rack-sub">Tap any socket to upgrade artifacts (+1 to +15) or swap gear</span>
              </div>

              <div class="equipment-sockets-row">
                <button class="equip-socket-btn weapon-socket ${weapon ? 'socket-equipped' : 'socket-empty'}"
                        data-action="open-equip"
                        data-spirit-id="${spirit.id}"
                        data-slot="weapon"
                        style="${weapon ? `border-color: ${weapon.color || '#f1c40f'};` : ''}"
                        title="${weapon ? `${weapon.name} (+${weapon.level || 1}) (${weapon.rarity})\n+${weapon.atkPower} ATK Power\nTap to Upgrade or Swap` : 'Weapon Socket'}">
                  <span class="socket-icon">${weapon ? weapon.icon : '⚔️'}</span>
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
                      <span class="socket-icon">${relic ? relic.icon : slot.icon}</span>
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
  document.getElementById('btn-mode-showcase')?.addEventListener('click', () => {
    activeViewMode = 'showcase';
    renderPartyView(container);
  });

  document.getElementById('btn-mode-roster')?.addEventListener('click', () => {
    activeViewMode = 'roster';
    renderPartyView(container);
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
      if (confirm('Dismantle this equipment item for Spirit Shards?')) {
        try {
          const res = gameState.dismantleEquipment(itemUid);
          alert(`Dismantled equipment! Gained +${res.shardsGained} Spirit Shards.`);
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
}
