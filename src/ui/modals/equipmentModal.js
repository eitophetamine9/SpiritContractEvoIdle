import { gameState } from '../../state/gameState.js';
import {
  GREEK_GOD_SETS,
  RELIC_SLOT_TYPES,
  RELIC_SUBSTAT_TYPES,
  getWeaponEnhanceCost,
  MAX_WEAPON_LEVEL
} from '../../data/equipmentData.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { createAnimatedRelicHtml, createAnimatedWeaponHtml } from '../../render/spriteAnimator.js';
import { closeActiveModal } from './modalBase.js';
import { getGameIcon, getStatIcon, getSlotIcon, getGodIcon, getSubstatIcon } from '../icons/gameIcons.js';

export function showEquipmentSlotModal({ spiritId, slotType, onUpdate }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  function renderModal() {
    const spirit = gameState.state.spirits.find(s => s.id === spiritId);
    if (!spirit) {
      modalRoot.innerHTML = '';
      return;
    }

    const { weapon, relics } = gameState.getSpiritEquippedItems(spirit);
    const currentItem = slotType === 'weapon' ? weapon : (relics ? relics[slotType] : null);
    const slotInfo = slotType === 'weapon' 
      ? { id: 'weapon', name: 'Weapon', icon: 'sword', desc: 'Main weapon providing raw ATK Power & offensive multipliers' }
      : (RELIC_SLOT_TYPES.find(s => s.id === slotType) || { id: slotType, name: slotType, icon: 'sparkle', desc: 'Relic slot' });

    const allEquipment = (gameState.state.inventory && gameState.state.inventory.equipment) || [];
    const availableItems = allEquipment.filter(item => {
      if (slotType === 'weapon') return item.type === 'weapon';
      return item.type === 'relic' && item.slotTypeId === slotType;
    });

    const isCurrentEquipped = !!currentItem;
    const isRelic = currentItem && currentItem.type === 'relic';
    const isWeapon = currentItem && currentItem.type === 'weapon';
    const stars = isRelic ? (currentItem.stars || 3) : 3;
    const starColors = { 3: '#b2bec3', 4: '#00cec9', 5: '#ffd32a', 6: '#ff4757' };
    const starColor = starColors[stars] || '#ffd32a';

    let nextLevel = 0;
    let shardCost = 0;
    let essenceCost = 0;
    let canEnhance = false;
    let canAscend = false;

    if (isRelic) {
      nextLevel = (currentItem.level || 0) + 1;
      shardCost = Math.round(50 * nextLevel * (stars * 0.4));
      const isMilestone = (nextLevel % 3 === 0);
      essenceCost = isMilestone ? Math.round(stars * 2 + nextLevel * 0.5) : 0;
      canEnhance = (currentItem.level || 0) < 15;
      canAscend = stars === 5 && (currentItem.level || 0) >= 15;
    } else if (isWeapon) {
      nextLevel = (currentItem.level || 1) + 1;
      const wCost = getWeaponEnhanceCost(currentItem);
      if (wCost) {
        shardCost = wCost.shardCost;
        essenceCost = wCost.essenceCost;
        canEnhance = true;
      }
    }

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-card-equipment">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-flex; align-items: center;">${getSlotIcon(slotInfo.id, { size: 22 })}</span>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 15px;">Equip ${slotInfo.name}</h3>
                <span style="font-size: 11px; color: var(--text-muted);">${spirit.customName} • Lv. ${spirit.level}</span>
              </div>
            </div>
            <button id="btn-close-equip-modal" class="modal-btn-close" style="display: flex; align-items: center; justify-content: center;">${getGameIcon('close', { size: 14 })}</button>
          </div>

          <div style="font-size: 11px; color: var(--text-muted); margin: 6px 0 10px 0; line-height: 1.3;">
            ${slotInfo.desc}
          </div>

          <!-- Currently Equipped Item Section -->
          <div class="equip-section-title">CURRENTLY EQUIPPED</div>
          ${isCurrentEquipped ? `
            <div class="equipped-item-card" style="border-color: ${currentItem.color || '#4cd137'};">
              <div class="equip-card-left" style="width: 100%;">
                <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${isRelic 
                    ? createAnimatedRelicHtml(currentItem, currentItem.slotTypeId, { extraClasses: 'socket-animated-sprite' }) 
                    : createAnimatedWeaponHtml(currentItem, { extraClasses: 'socket-animated-sprite' })}
                </div>
                <div class="equip-card-info" style="flex: 1;">
                  <div class="equip-item-name" style="color: ${currentItem.color || '#fff'};">
                    <span>${currentItem.name}</span>
                    ${isRelic ? `
                      <span style="display: inline-flex; align-items: center; gap: 1px; vertical-align: middle;">
                        ${Array.from({ length: stars }, () => getGameIcon('star', { size: 11, color: starColor })).join('')}
                      </span>
                      <span style="font-size: 10px; font-weight: 800; color: #ffd32a; background: rgba(0,0,0,0.5); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,211,42,0.4);">
                        +${currentItem.level || 0}/15
                      </span>
                    ` : `
                      <span class="equip-rarity-pill" style="border-color: ${currentItem.color || '#fff'}; color: ${currentItem.color || '#fff'};">${currentItem.rarity}</span>
                      <span style="font-size: 10px; font-weight: 800; color: #ffd32a; background: rgba(0,0,0,0.5); padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,211,42,0.4);">
                        +${currentItem.level || 1}/15
                      </span>
                    `}
                  </div>
                  <div class="equip-item-stat" style="display: flex; align-items: center; gap: 4px;">
                    ${currentItem.type === 'weapon' ? `${getGameIcon('zap', { size: 11, color: '#ffd32a' })} +${currentItem.atkPower} ATK Power • +${currentItem.critRate}% Crit` : `${getGameIcon('zap', { size: 11, color: '#ffd32a' })} +${currentItem.mainStatValue} ${currentItem.mainStatName}`}
                  </div>
                  ${currentItem.setId && GREEK_GOD_SETS[currentItem.setId] ? `
                    <div class="equip-set-tag" style="color: ${GREEK_GOD_SETS[currentItem.setId].accentColor}; display: flex; align-items: center; gap: 4px;">
                      ${getGodIcon(currentItem.setId, { size: 11, color: GREEK_GOD_SETS[currentItem.setId].accentColor })} ${GREEK_GOD_SETS[currentItem.setId].name} (2pc/4pc Set)
                    </div>
                  ` : ''}
                  ${isRelic && currentItem.substats && currentItem.substats.length > 0 ? `
                    <div class="equip-card-substats-row" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                      ${currentItem.substats.map(sub => `
                        <span style="font-size: 9px; font-weight: 700; color: #a4b0be; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 3px; padding: 2px 5px; display: inline-flex; align-items: center; gap: 4px;">
                          ${sub.name} <strong style="color: #2ed573;">+${sub.value}${sub.isPercent ? '%' : ''}</strong>
                          ${sub.rolls && sub.rolls > 1 ? `<span class="substat-roll-badge">[${sub.rolls}x Rolls]</span>` : `<span class="substat-roll-badge-base">[1x Roll]</span>`}
                        </span>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Action Controls Row for Equipped Item -->
              <div class="equip-card-actions-row" style="display: flex; gap: 6px; align-items: center; justify-content: flex-end; margin-top: 6px; flex-wrap: wrap; width: 100%;">
                ${isRelic ? `
                  ${canEnhance ? `
                    <button class="btn-modal-enhance-slot" id="btn-modal-enhance" data-relic-uid="${currentItem.uid}">
                      <span style="display: inline-flex; align-items: center; gap: 4px;">${getGameIcon('zap', { size: 11 })} Enhance (+${nextLevel})</span>
                      <span class="enhance-cost-sub" style="display: inline-flex; align-items: center; gap: 3px;">${shardCost} ${getGameIcon('crystal', { size: 10, color: '#70a1ff' })}${essenceCost > 0 ? ` • ${essenceCost} ${getGameIcon('sparkle', { size: 10, color: '#ffd152' })}` : ''}</span>
                    </button>
                  ` : `
                    <div class="badge-max-enhance" style="display: inline-flex; align-items: center; gap: 3px;">
                      ${getGameIcon('check', { size: 11, color: '#2ed573' })} +15 MAX
                    </div>
                  `}
                  ${canAscend ? `
                    <button class="btn-modal-ascend-slot" id="btn-modal-ascend" data-relic-uid="${currentItem.uid}">
                      <span style="display: inline-flex; align-items: center; gap: 4px;">${getGameIcon('crown', { size: 11, color: '#ffd32a' })} Ascend to Tier 6</span>
                      <span class="enhance-cost-sub" style="display: inline-flex; align-items: center; gap: 3px;">100 ${getGameIcon('sparkle', { size: 10, color: '#ffd152' })} • 10 ${getGameIcon('astralEssence', { size: 10, color: '#c084fc' })}</span>
                    </button>
                  ` : ''}
                  <button class="btn-modal-reroll-slot" id="btn-modal-reroll" data-relic-uid="${currentItem.uid}" title="Reroll all substats for 5 Soul Essences" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${getGameIcon('astralEssence', { size: 11, color: '#c084fc' })} Reroll (5)
                  </button>
                  <button class="btn-modal-scripture-slot" id="btn-modal-scripture" data-relic-uid="${currentItem.uid}" title="Use Divine Relic Scripture to guarantee 2 substats" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${getGameIcon('scroll', { size: 11, color: '#ffd32a' })} Scripture (${gameState.state.resources.divineScriptures || 0})
                  </button>
                  <button class="btn-modal-inspect-slot" id="btn-modal-inspect-item" data-relic-uid="${currentItem.uid}" title="View Details, Lore & Reassign" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${getGameIcon('search', { size: 11 })} Details
                  </button>
                ` : isWeapon ? `
                  ${canEnhance ? `
                    <button class="btn-modal-enhance-slot" id="btn-modal-enhance-weapon" data-weapon-uid="${currentItem.uid}">
                      <span style="display: inline-flex; align-items: center; gap: 4px;">${getGameIcon('zap', { size: 11 })} Enhance (+${nextLevel})</span>
                      <span class="enhance-cost-sub" style="display: inline-flex; align-items: center; gap: 3px;">${shardCost} ${getGameIcon('crystal', { size: 10, color: '#70a1ff' })}${essenceCost > 0 ? ` • ${essenceCost} ${getGameIcon('sparkle', { size: 10, color: '#ffd152' })}` : ''}</span>
                    </button>
                  ` : `
                    <div class="badge-max-enhance" style="display: inline-flex; align-items: center; gap: 3px;">
                      ${getGameIcon('check', { size: 11, color: '#2ed573' })} +15 MAX
                    </div>
                  `}
                  <button class="btn-modal-inspect-slot" id="btn-modal-inspect-item" data-weapon-uid="${currentItem.uid}" title="View Details, Lore & Reassign" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${getGameIcon('search', { size: 11 })} Details
                  </button>
                ` : ''}
                <button class="btn-unequip-slot" id="btn-modal-unequip" data-slot="${slotType}">
                  Unequip
                </button>
              </div>
            </div>
          ` : `
            <div class="empty-slot-banner">
              <span>(No ${slotInfo.name} equipped on ${spirit.customName})</span>
            </div>
          `}

          <!-- Available Inventory Items -->
          <div class="equip-section-title" style="margin-top: 14px;">
            AVAILABLE IN BAG (${availableItems.length})
          </div>

          <div class="equip-inventory-scroll">
            ${availableItems.length === 0 ? `
              <div class="empty-bag-notice">
                <p>No other ${slotInfo.name} items in your equipment inventory.</p>
                <button id="btn-modal-goto-trials" class="btn-goto-dungeon-action" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                  ${getGameIcon('temple', { size: 14, color: '#ffd32a' })} Challenge Pantheon Trials
                </button>
              </div>
            ` : `
              <div class="equip-items-grid">
                ${availableItems.map(item => {
                  const isEquippedToThis = currentItem && currentItem.uid === item.uid;
                  const equippedToOther = item.equippedToSpiritId && item.equippedToSpiritId !== spirit.id
                    ? gameState.state.spirits.find(s => s.id === item.equippedToSpiritId)
                    : null;
                  const godSet = item.setId ? GREEK_GOD_SETS[item.setId] : null;

                  return `
                    <div class="inventory-equip-card ${isEquippedToThis ? 'item-active' : ''}" style="border-color: ${item.color || 'var(--border-color)'};">
                      <div class="equip-card-left">
                        <div class="equip-icon-box" style="display: flex; align-items: center; justify-content: center;">
                          ${item.type === 'weapon'
                            ? createAnimatedWeaponHtml(item, { extraClasses: 'socket-animated-sprite' })
                            : createAnimatedRelicHtml(item, item.slotTypeId, { extraClasses: 'socket-animated-sprite' })
                          }
                        </div>
                        <div class="equip-card-info">
                          <div class="equip-item-name" style="color: ${item.color || '#fff'};">
                            ${item.name}
                            ${item.type === 'relic' ? `<span style="font-size: 10px; font-weight: 800; color: #ffd32a;">+${item.level || 0}</span>` : ''}
                            <span class="equip-rarity-pill" style="border-color: ${item.color}; color: ${item.color}; font-size: 9px;">${item.rarity}</span>
                          </div>
                          <div class="equip-item-stat" style="display: flex; align-items: center; gap: 4px;">
                            ${item.type === 'weapon' ? `${getGameIcon('zap', { size: 11, color: '#ffd32a' })} +${item.atkPower} ATK Power • +${item.critRate}% Crit` : `${getGameIcon('zap', { size: 11, color: '#ffd32a' })} +${item.mainStatValue} ${item.mainStatName}`}
                          </div>
                          ${godSet ? `
                            <div class="equip-set-tag" style="color: ${godSet.accentColor}; font-size: 10px; display: flex; align-items: center; gap: 4px;">
                              ${getGodIcon(item.setId, { size: 11, color: godSet.accentColor })} ${godSet.name}
                            </div>
                          ` : ''}
                          ${equippedToOther ? `
                            <div style="font-size: 10px; color: #f39c12; font-style: italic;">
                              Equipped to ${equippedToOther.customName} (will transfer)
                            </div>
                          ` : ''}
                        </div>
                      </div>

                      <div class="equip-card-actions">
                        ${isEquippedToThis ? `
                          <span class="badge-equipped-tag">EQUIPPED</span>
                        ` : `
                          <button class="btn-action-equip" data-equip-uid="${item.uid}">
                            Equip
                          </button>
                          ${item.type === 'relic' ? `
                            <button class="btn-action-upgrade" data-inspect-uid="${item.uid}" title="Upgrade Artifact" style="display: flex; align-items: center; justify-content: center;">
                              ${getGameIcon('zap', { size: 12 })}
                            </button>
                          ` : ''}
                          ${!item.equippedToSpiritId ? `
                            <button class="btn-action-dismantle" data-dismantle-uid="${item.uid}" title="Dismantle for Spirit Shards" style="display: flex; align-items: center; justify-content: center;">
                              ${getGameIcon('recycle', { size: 12 })}
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

          <button id="btn-modal-done" class="modal-btn-confirm" style="margin-top: 12px;">
            Done
          </button>
        </div>
      </div>
    `;

    // Bind event listeners
    document.getElementById('btn-close-equip-modal')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    });

    document.getElementById('btn-modal-done')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    });

    document.getElementById('btn-modal-unequip')?.addEventListener('click', () => {
      try {
        gameState.unequipItem(spiritId, slotType);
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-modal-enhance')?.addEventListener('click', () => {
      try {
        const res = gameState.enhanceRelic(currentItem.uid);
        try { safePlaySfx('levelup'); } catch {}
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-modal-enhance-weapon')?.addEventListener('click', () => {
      try {
        const res = gameState.enhanceWeapon(currentItem.uid);
        try { safePlaySfx('levelup'); } catch {}
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-modal-ascend')?.addEventListener('click', () => {
      try {
        const res = gameState.ascendRelic(currentItem.uid);
        try { safePlaySfx('evolution'); } catch {}
        alert(`Ascended ${currentItem.name} to Tier 6! Unlocked 5th Substat slot!`);
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-modal-reroll')?.addEventListener('click', () => {
      const currentEssence = gameState.state.resources.soulEssence || 0;
      if (currentEssence < 5) {
        alert(`Insufficient Soul Essence! Need 5 Astral Essence (You have ${currentEssence}).`);
        return;
      }
      if (confirm('Spend 5 Soul Essences to reroll all substats on this Relic?')) {
        try {
          const res = gameState.rerollRelicSubstats(currentItem.uid);
          try { safePlaySfx('evolution'); } catch {}
          renderModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    modalRoot.querySelector('#btn-modal-scripture')?.addEventListener('click', () => {
      showDivineScriptureModal({
        relic: currentItem,
        onUpdate: () => {
          renderModal();
          if (onUpdate) onUpdate();
        }
      });
    });

    modalRoot.querySelector('#btn-modal-inspect-item')?.addEventListener('click', () => {
      showItemInspectModal({
        item: currentItem,
        onUpdate: () => {
          renderModal();
          if (onUpdate) onUpdate();
        }
      });
    });

    modalRoot.querySelectorAll('[data-inspect-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-inspect-uid');
        const itemToInspect = allEquipment.find(i => i.uid === uid);
        if (itemToInspect) {
          showItemInspectModal({
            item: itemToInspect,
            onUpdate: () => {
              renderModal();
              if (onUpdate) onUpdate();
            }
          });
        }
      });
    });

    modalRoot.querySelectorAll('[data-equip-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-equip-uid');
        try {
          gameState.equipItem(spiritId, uid);
          renderModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    modalRoot.querySelectorAll('[data-dismantle-uid]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.currentTarget.getAttribute('data-dismantle-uid');
        if (confirm('Dismantle this equipment item for Spirit Shards and Essences of the Gods?')) {
          try {
            const res = gameState.dismantleEquipment(uid);
            alert(`Dismantled equipment! Gained +${res.shardsGained} Spirit Shards${res.essencesGained > 0 ? ` and +${res.essencesGained} Essences of the Gods` : ''}.`);
            renderModal();
            if (onUpdate) onUpdate();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });

    document.getElementById('btn-modal-goto-trials')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      document.querySelector('[data-tab="trials"]')?.click();
    });
  }

  renderModal();
}

/**
 * Universal Item Inspection & Equip Modal for Vault
 */
/**
 * Universal Item Inspection, Enhance & Equip Modal for Vault
 */
export function showItemInspectModal({ item, onUpdate }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot || !item) return;

  function renderModal() {
    const currentItem = (gameState.state.inventory?.equipment || []).find(e => e.uid === item.uid) || item;
    const spirits = gameState.state.spirits || [];
    const partyIds = gameState.state.party || [];
    const partySpirits = spirits.filter(s => partyIds.includes(s.id));
    const equippedSpirit = spirits.find(s => s.id === currentItem.equippedToSpiritId);

    const isRelic = currentItem.type === 'relic';
    const isWeapon = currentItem.type === 'weapon';
    const stars = currentItem.stars || 3;
    const godSet = isRelic ? GREEK_GOD_SETS[currentItem.setId] : null;

    const starColors = {
      3: '#b2bec3',
      4: '#00cec9',
      5: '#ffd32a',
      6: '#ff4757'
    };
    const starLabel = isRelic ? Array.from({ length: stars }, () => getGameIcon('star', { size: 12, color: starColor })).join('') : '';
    const starColor = starColors[stars] || '#ffd32a';

    let nextLevel = 0;
    let shardCost = 0;
    let essenceCost = 0;
    let canEnhance = false;
    let canAscend = false;

    if (isRelic) {
      nextLevel = (currentItem.level || 0) + 1;
      shardCost = Math.round(50 * nextLevel * (stars * 0.4));
      const isMilestone = nextLevel % 3 === 0;
      essenceCost = isMilestone ? Math.round(stars * 2 + nextLevel * 0.5) : 0;
      canEnhance = (currentItem.level || 0) < 15;
      canAscend = stars === 5 && (currentItem.level || 0) >= 15;
    } else if (isWeapon) {
      nextLevel = (currentItem.level || 1) + 1;
      const wCost = getWeaponEnhanceCost(currentItem);
      if (wCost) {
        shardCost = wCost.shardCost;
        essenceCost = wCost.essenceCost;
        canEnhance = true;
      }
    }

    const dismantleEssences = isRelic ? (stars === 3 ? 5 : stars === 4 ? 15 : stars === 5 ? 40 : 100) : 0;
    const dismantleShards = isRelic
      ? Math.round(20 * (currentItem.level || 1) + stars * 10)
      : Math.round(25 * (currentItem.level || 1) + 15);

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card modal-card-equipment" style="max-width: 450px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${isRelic
                  ? createAnimatedRelicHtml(currentItem, currentItem.slotTypeId, { extraClasses: 'socket-animated-sprite' })
                  : createAnimatedWeaponHtml(currentItem, { extraClasses: 'socket-animated-sprite' })
                }
              </div>
              <div>
                <h3 class="modal-title" style="margin: 0; font-size: 16px; color: ${currentItem.color || '#ffd32a'};">
                  ${currentItem.name}
                </h3>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  ${isRelic ? `
                    <span style="display: inline-flex; align-items: center; gap: 1px; vertical-align: middle;">
                      ${starLabel}
                    </span>
                    <span style="font-size: 11px; color: var(--text-muted);">
                      • +${currentItem.level || 0}/15 • ${currentItem.slotName || 'Relic'}
                    </span>
                  ` : `
                    <span class="equip-rarity-pill" style="border-color: ${currentItem.color || '#fff'}; color: ${currentItem.color || '#fff'};">${currentItem.rarity}</span>
                    <span style="font-size: 11px; color: #ffd32a; font-weight: 800;">
                      +${currentItem.level || 1}/15 Weapon
                    </span>
                  `}
                </div>
              </div>
            </div>
            <button id="btn-close-item-inspect" class="modal-close-btn" style="display: flex; align-items: center; justify-content: center;">${getGameIcon('close', { size: 14 })}</button>
          </div>

          <div class="modal-body" style="padding: 14px 16px;">
            
            <!-- Primary Stats Section -->
            <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 12px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.08);">
              <div style="font-size: 11px; font-weight: 800; color: #ffd32a; margin-bottom: 6px;">PRIMARY ATTRIBUTES</div>
              ${isRelic ? `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 700; color: #fff;">${currentItem.mainStatName}</span>
                  <span style="font-size: 15px; font-weight: 900; color: #2ed573;">+${currentItem.mainStatValue}</span>
                </div>
              ` : `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 700; color: #fff;">ATK Power</span>
                  <span style="font-size: 15px; font-weight: 900; color: #ff4757;">+${currentItem.atkPower}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                  Crit Rate: +${currentItem.critRate || 5}% • Ult Amp: +${currentItem.ultAmp || 8}%
                </div>
              `}
            </div>

            <!-- Substats Section (For Relics) -->
            ${isRelic && currentItem.substats && currentItem.substats.length > 0 ? `
              <div style="background: rgba(0,0,0,0.4); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div style="font-size: 11px; font-weight: 800; color: #70a1ff;">
                    SUBSTATS (${currentItem.substats.length}/${stars === 6 ? 5 : stars === 5 ? 4 : stars === 4 ? 4 : 3})
                  </div>
                  <div style="display: flex; gap: 4px;">
                    <button id="btn-reroll-inspect-substats" class="btn-reroll-inspect-substats" data-relic-uid="${currentItem.uid}" title="Reroll all substats for 5 Soul Essences" style="display: inline-flex; align-items: center; gap: 4px;">
                      ${getGameIcon('astralEssence', { size: 11, color: '#c084fc' })} Reroll (5)
                    </button>
                    <button id="btn-inspect-scripture" class="btn-inspect-scripture" data-relic-uid="${currentItem.uid}" title="Use Divine Relic Scripture to guarantee 2 substats" style="display: inline-flex; align-items: center; gap: 4px;">
                      ${getGameIcon('scroll', { size: 11, color: '#ffd32a' })} Scripture (${gameState.state.resources.divineScriptures || 0})
                    </button>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  ${currentItem.substats.map(sub => `
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; padding: 3px 6px; background: rgba(255,255,255,0.04); border-radius: 4px;">
                      <span style="color: #dfe4ea;">• ${sub.name}</span>
                      <div style="display: flex; align-items: center; gap: 5px;">
                        ${sub.rolls && sub.rolls > 1 ? `<span class="substat-roll-badge">[${sub.rolls}x Rolls]</span>` : `<span class="substat-roll-badge-base">[1x Roll]</span>`}
                        <span style="font-weight: 800; color: #2ed573;">+${sub.value}${sub.isPercent ? '%' : ''}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Set Bonus Details if Relic -->
            ${godSet ? `
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 10px; border-left: 3px solid ${godSet.color};">
                <div style="font-size: 11px; font-weight: 800; color: ${godSet.accentColor}; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                  ${getGodIcon(currentItem.setId, { size: 12, color: godSet.accentColor })} ${godSet.name} (${godSet.god})
                </div>
                <div style="font-size: 11px; color: #ccc; margin-bottom: 3px;">
                  <strong>2-pc:</strong> ${godSet.bonus2pc.description}
                </div>
                <div style="font-size: 11px; color: #ccc;">
                  <strong>4-pc:</strong> ${godSet.bonus4pc.description}
                </div>
              </div>
            ` : ''}

            <!-- Equipment Enhancement & Ascension Buttons -->
            ${isRelic ? `
              <div style="display: flex; gap: 6px; margin-bottom: 12px;">
                ${canEnhance ? `
                  <button id="btn-enhance-relic" class="btn-drawer-action" style="flex: 1; background: linear-gradient(135deg, #f39c12, #d35400); color: #fff; font-weight: 800; min-height: 42px;">
                    <span style="display: inline-flex; align-items: center; gap: 4px;">${getGameIcon('zap', { size: 12 })} Enhance Relic (+${nextLevel})</span><br>
                    <span style="font-size: 10px; opacity: 0.9; display: inline-flex; align-items: center; gap: 3px;">${shardCost} ${getGameIcon('crystal', { size: 10, color: '#70a1ff' })}${essenceCost > 0 ? ` • ${essenceCost} ${getGameIcon('sparkle', { size: 10, color: '#ffd152' })}` : ''}</span>
                  </button>
                ` : `
                  <div style="flex: 1; text-align: center; font-size: 11px; font-weight: 800; color: #2ecc71; padding: 10px; background: rgba(46,204,113,0.1); border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                    ${getGameIcon('check', { size: 12, color: '#2ecc71' })} Max Enhancement (+15)
                  </div>
                `}

                ${canAscend ? `
                  <button id="btn-ascend-relic" class="btn-drawer-action" style="flex: 1; background: linear-gradient(135deg, #e74c3c, #8e44ad); color: #fff; font-weight: 900; min-height: 42px;">
                    <span style="display: inline-flex; align-items: center; gap: 4px;">${getGameIcon('crown', { size: 12, color: '#ffd32a' })} Ascend to Tier 6</span><br>
                    <span style="font-size: 10px; opacity: 0.9; display: inline-flex; align-items: center; gap: 3px;">100 ${getGameIcon('sparkle', { size: 10, color: '#ffd152' })} • 10 ${getGameIcon('astralEssence', { size: 10, color: '#c084fc' })}</span>
                  </button>
                ` : ''}
              </div>
            ` : isWeapon ? `
              <div style="display: flex; gap: 6px; margin-bottom: 12px;">
                ${canEnhance ? `
                  <button id="btn-enhance-weapon" class="btn-drawer-action" style="flex: 1; background: linear-gradient(135deg, #f39c12, #d35400); color: #fff; font-weight: 800; min-height: 42px;">
                    <span style="display: inline-flex; align-items: center; gap: 4px;">${getGameIcon('zap', { size: 12 })} Enhance Weapon (+${nextLevel})</span><br>
                    <span style="font-size: 10px; opacity: 0.9; display: inline-flex; align-items: center; gap: 3px;">${shardCost} ${getGameIcon('crystal', { size: 10, color: '#70a1ff' })}${essenceCost > 0 ? ` • ${essenceCost} ${getGameIcon('sparkle', { size: 10, color: '#ffd152' })}` : ''}</span>
                  </button>
                ` : `
                  <div style="flex: 1; text-align: center; font-size: 11px; font-weight: 800; color: #2ecc71; padding: 10px; background: rgba(46,204,113,0.1); border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                    ${getGameIcon('check', { size: 12, color: '#2ecc71' })} Max Enhancement (+15)
                  </div>
                `}
              </div>
            ` : ''}

            <!-- Equipped Status & Reassign to Spirit -->
            <div style="margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: 800; color: #fff; margin-bottom: 6px;">
                ${equippedSpirit ? `Equipped To: <span style="color: #2ecc71;">${equippedSpirit.customName}</span>` : 'Status: <span style="color: var(--text-muted);">In Vault (Unequipped)</span>'}
              </div>

              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">Quick Equip to Active Party Spirit:</div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${partySpirits.map(sp => {
                  const isEquippedHere = equippedSpirit && equippedSpirit.id === sp.id;
                  return `
                    <button class="btn-preset-sm btn-equip-to-spirit ${isEquippedHere ? 'active' : ''}" data-target-spirit="${sp.id}" style="${isEquippedHere ? 'background: #27ae60; color: #fff;' : ''}">
                      ${isEquippedHere ? `${getGameIcon('check', { size: 10, color: '#fff' })} ` : ''}${sp.customName}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Actions: Unequip / Dismantle -->
            <div style="display: flex; gap: 8px; margin-top: 14px;">
              ${equippedSpirit ? `
                <button id="btn-unequip-item" class="btn-drawer-action" style="flex: 1; background: rgba(241, 196, 15, 0.2); border-color: #f1c40f; color: #ffd32a;">
                  Unequip
                </button>
              ` : `
                <button id="btn-dismantle-item" class="btn-drawer-action" style="flex: 1; background: rgba(231, 76, 60, 0.2); border-color: #e74c3c; color: #ff7675; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                  Dismantle (+${dismantleShards} ${getGameIcon('crystal', { size: 10, color: '#70a1ff' })}${dismantleEssences > 0 ? ` +${dismantleEssences} ${getGameIcon('sparkle', { size: 10, color: '#ffd152' })}` : ''})
                </button>
              `}
              <button id="btn-close-item-done" class="btn-drawer-action" style="flex: 1; background: #34495e; color: #fff;">
                Done
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    const closeModal = () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    };

    modalRoot.querySelector('#btn-close-item-inspect')?.addEventListener('click', closeModal);
    modalRoot.querySelector('#btn-close-item-done')?.addEventListener('click', closeModal);

    // Enhance Weapon
    modalRoot.querySelector('#btn-enhance-weapon')?.addEventListener('click', () => {
      try {
        const res = gameState.enhanceWeapon(currentItem.uid);
        try { safePlaySfx('levelup'); } catch {}
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    // Enhance Relic
    modalRoot.querySelector('#btn-enhance-relic')?.addEventListener('click', () => {
      try {
        const res = gameState.enhanceRelic(currentItem.uid);
        try { safePlaySfx('levelup'); } catch {}
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    // Reroll Relic Substats
    modalRoot.querySelector('#btn-reroll-inspect-substats')?.addEventListener('click', () => {
      const currentEssence = gameState.state.resources.soulEssence || 0;
      if (currentEssence < 5) {
        alert(`Insufficient Soul Essence! Need 5 Astral Essence (You have ${currentEssence}).`);
        return;
      }
      if (confirm('Spend 5 Soul Essences to reroll all substats on this Relic?')) {
        try {
          const res = gameState.rerollRelicSubstats(currentItem.uid);
          try { safePlaySfx('evolution'); } catch {}
          renderModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Divine Scripture on Relic
    modalRoot.querySelector('#btn-inspect-scripture')?.addEventListener('click', () => {
      showDivineScriptureModal({
        relic: currentItem,
        onUpdate: () => {
          renderModal();
          if (onUpdate) onUpdate();
        }
      });
    });

    // Ascend Relic
    modalRoot.querySelector('#btn-ascend-relic')?.addEventListener('click', () => {
      try {
        const res = gameState.ascendRelic(currentItem.uid);
        try { safePlaySfx('evolution'); } catch {}
        alert(`Ascended ${currentItem.name} to Tier 6! Unlocked 5th Substat slot!`);
        renderModal();
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });

    // Equip to spirit buttons
    modalRoot.querySelectorAll('.btn-equip-to-spirit').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSpiritId = btn.getAttribute('data-target-spirit');
        try {
          gameState.equipItem(targetSpiritId, currentItem.uid);
          closeModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    // Unequip button
    modalRoot.querySelector('#btn-unequip-item')?.addEventListener('click', () => {
      if (equippedSpirit) {
        try {
          gameState.unequipItem(equippedSpirit.id, isRelic ? currentItem.slotTypeId : 'weapon');
          closeModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });

    // Dismantle button
    modalRoot.querySelector('#btn-dismantle-item')?.addEventListener('click', () => {
      if (confirm(`Dismantle ${currentItem.name}?\nYou will gain +${dismantleShards} Spirit Shards${dismantleEssences > 0 ? ` and +${dismantleEssences} Essences of the Gods` : ''}.`)) {
        try {
          const res = gameState.dismantleEquipment(currentItem.uid);
          alert(`Dismantled ${currentItem.name}!\nGained +${res.shardsGained} Shards${res.essencesGained ? ` and +${res.essencesGained} Essences of the Gods` : ''}.`);
          closeModal();
          if (onUpdate) onUpdate();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }

  renderModal();
}

/**
 * Universal Spirit Management Modal for Vault
 */

export function showDivineScriptureModal({ relic, onUpdate }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot || !relic) return;

  let selectedSubTypes = [];

  const renderScriptureModal = () => {
    const scriptureCount = gameState.state.resources.divineScriptures || 0;
    const mainStatName = relic.mainStatName || '';
    const godSet = relic.setId ? GREEK_GOD_SETS[relic.setId] : null;

    // Filter substats to avoid conflict with main stat
    const eligibleSubstats = RELIC_SUBSTAT_TYPES.filter(s => {
      if (mainStatName.includes('HP') && (s.id === 'flat_hp' || s.id === 'percent_hp')) return false;
      if (mainStatName.includes('ATK') && (s.id === 'flat_atk' || s.id === 'percent_atk')) return false;
      if (mainStatName.includes('Shield') && s.id === 'flat_shield') return false;
      if (mainStatName.includes('Mana') && s.id === 'mana_regen') return false;
      if (mainStatName.includes('Ult') && s.id === 'ult_amp') return false;
      if (mainStatName.includes('Evasion') && s.id === 'evasion') return false;
      return true;
    });

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card scripture-modal-card" style="max-width: 480px; width: 95%;">
          <div class="modal-header scripture-modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-flex; align-items: center;">${getGameIcon('scroll', { size: 24, color: '#ffd32a' })}</span>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #ffd32a; letter-spacing: 0.5px;">Divine Relic Scripture</h3>
                <span style="font-size: 10px; color: var(--text-muted);">Inscribe 2 Guaranteed Substats</span>
              </div>
            </div>
            <button id="btn-close-scripture-modal" class="modal-btn-close" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">${getGameIcon('close', { size: 14 })}</button>
          </div>

          <div class="scripture-relic-preview" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(0,0,0,0.4); border: 1px solid ${relic.color || 'rgba(255,255,255,0.1)'}; border-radius: 8px; margin-bottom: 14px;">
            <div style="width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
              ${createAnimatedRelicHtml(relic, relic.slotTypeId, { extraClasses: 'socket-animated-sprite' })}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 800; color: ${relic.color || '#fff'};">
                ${relic.name} <span style="font-size: 11px; color: #ffd32a;">+${relic.level || 0}</span>
              </div>
              <div style="font-size: 10px; color: #a4b0be; display: flex; align-items: center; gap: 4px;">
                Main: <strong style="color: #2ed573;">+${relic.mainStatValue} ${relic.mainStatName}</strong>
                ${godSet ? `<span style="display: inline-flex; align-items: center; gap: 3px;">• ${getGodIcon(relic.setId, { size: 11, color: godSet.accentColor })} ${godSet.name}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Scripture stock & Buy info -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 211, 42, 0.08); border: 1px solid rgba(255, 211, 42, 0.25); border-radius: 6px; padding: 8px 12px; margin-bottom: 14px;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #ffd32a; display: flex; align-items: center; gap: 4px;">
                ${getGameIcon('scroll', { size: 12, color: '#ffd32a' })} Owned Scriptures: <span style="font-size: 14px; color: #fff;">${scriptureCount}</span>
              </div>
              <div style="font-size: 9px; color: #ccc;">Consumes 1 Scripture per inscription</div>
            </div>
            <button id="btn-buy-scripture" class="btn-buy-scripture-action" style="background: linear-gradient(135deg, #8e44ad, #9b59b6); border: 1px solid #be2edd; color: #fff; font-size: 10px; font-weight: 800; padding: 6px 10px; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              ${getGameIcon('astralEssence', { size: 11, color: '#fff' })} Buy 1 (15 Astral)
            </button>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 800; color: #70a1ff; text-transform: uppercase;">
                Select 2 Guaranteed Substats:
              </span>
              <span style="font-size: 10px; font-weight: 800; color: ${selectedSubTypes.length === 2 ? '#2ed573' : '#e74c3c'};">
                ${selectedSubTypes.length}/2 Selected
              </span>
            </div>

            <div class="scripture-substats-picker-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; max-height: 220px; overflow-y: auto; padding-right: 4px;">
              ${eligibleSubstats.map(sub => {
                const isSelected = selectedSubTypes.includes(sub.id);
                return `
                  <div class="scripture-sub-choice ${isSelected ? 'selected' : ''}" data-sub-id="${sub.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: ${isSelected ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isSelected ? '#2ed573' : 'rgba(255,255,255,0.08)'}; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="display: inline-flex; align-items: center;">${getSubstatIcon(sub.id, { size: 13 })}</span>
                      <span style="font-size: 11px; font-weight: 700; color: ${isSelected ? '#fff' : '#dfe4ea'};">${sub.name}</span>
                    </div>
                    <span style="font-size: 11px; font-weight: 900; color: ${isSelected ? '#2ed573' : '#666'}; display: inline-flex; align-items: center;">
                      ${isSelected ? getGameIcon('check', { size: 11, color: '#2ed573' }) : '+'}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div style="font-size: 10px; color: var(--text-muted); line-height: 1.4; margin-bottom: 14px; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 6px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; vertical-align: middle;">${getGameIcon('bulb', { size: 12, color: '#70a1ff' })}</span> The 2 selected substats will be guaranteed on this relic. Remaining slots roll randomly, and all enhancement milestones will be redistributed across them!
          </div>

          <div style="display: flex; gap: 8px;">
            <button id="btn-apply-scripture" class="modal-btn-confirm" ${selectedSubTypes.length !== 2 || scriptureCount < 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed; flex: 1;"' : 'style="flex: 1; background: linear-gradient(135deg, #f1c40f, #e67e22); color: #000; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; gap: 6px;"'}>
              ${getGameIcon('scroll', { size: 13, color: '#000' })} Inscribe Relic (Use 1 Scripture)
            </button>
            <button id="btn-cancel-scripture" class="btn-drawer-action" style="background: #34495e; color: #fff; padding: 8px 16px;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    modalRoot.querySelector('#btn-close-scripture-modal')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    });

    modalRoot.querySelector('#btn-cancel-scripture')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onUpdate) onUpdate();
    });

    modalRoot.querySelectorAll('.scripture-sub-choice').forEach(choice => {
      choice.addEventListener('click', (e) => {
        const subId = choice.getAttribute('data-sub-id');
        if (selectedSubTypes.includes(subId)) {
          selectedSubTypes = selectedSubTypes.filter(id => id !== subId);
        } else {
          if (selectedSubTypes.length >= 2) {
            // Already 2 picked, drop first one
            selectedSubTypes.shift();
          }
          selectedSubTypes.push(subId);
        }
        renderScriptureModal();
      });
    });

    modalRoot.querySelector('#btn-buy-scripture')?.addEventListener('click', () => {
      try {
        const res = gameState.buyDivineScripture(1);
        try { safePlaySfx('evolution'); } catch {}
        renderScriptureModal();
      } catch (err) {
        alert(err.message);
      }
    });

    modalRoot.querySelector('#btn-apply-scripture')?.addEventListener('click', () => {
      if (selectedSubTypes.length !== 2) {
        alert('Please select exactly 2 guaranteed substats!');
        return;
      }
      try {
        const res = gameState.applyDivineScripture(relic.uid, selectedSubTypes[0], selectedSubTypes[1]);
        try { safePlaySfx('evolution'); } catch {}
        alert(`Successfully inscribed ${relic.name}! Guaranteed: ${selectedSubTypes.map(id => RELIC_SUBSTAT_TYPES.find(s => s.id === id)?.name).join(' & ')}!`);
        modalRoot.innerHTML = '';
        if (onUpdate) onUpdate();
      } catch (err) {
        alert(err.message);
      }
    });
  };

  renderScriptureModal();
}

/**
 * Detailed Attributes Breakdown Dossier Modal (16 Discrete Parameters)
 */
