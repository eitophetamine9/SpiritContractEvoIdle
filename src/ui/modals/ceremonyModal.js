import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { getRarityInfo } from '../../data/spiritsData.js';
import { createAnimatedRelicHtml } from '../../render/spriteAnimator.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { closeActiveModal } from './modalBase.js';
import { getGameIcon } from '../icons/gameIcons.js';

export function showEvolutionCeremonyModal(evoResult, onDone) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const isRare = evoResult.isRare;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card" style="border-color: ${isRare ? '#ffd700' : '#70a1ff'};">
        <h2 class="modal-title" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${getGameIcon('zap', { size: 18, color: isRare ? '#ffd700' : '#70a1ff' })} SPIRIT EVOLUTION!
        </h2>

        <div class="evolution-display-box">
          <div class="evolution-cards-comparison">
            <div class="evolution-card-frame">
              ${createSpiritPlaceholderBox(evoResult.oldSpecies)}
            </div>

            <div class="evolution-arrow">${getGameIcon('arrowRight', { size: 16 })}</div>

            <div class="evolution-card-frame">
              ${createSpiritPlaceholderBox(evoResult.spirit, { isCapped: false })}
            </div>
          </div>

          <div class="variant-announcement ${isRare ? 'rare' : 'common'}" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ${isRare ? `${getGameIcon('sparkle', { size: 12, color: '#facc15' })} ` + evoResult.variantName.toUpperCase() + ' (LUCKY ROLL!)' : `${getGameIcon('sparkle', { size: 12, color: '#38bdf8' })} ` + evoResult.variantName.toUpperCase()}
          </div>

          <div style="font-size: 16px; font-weight: 800; color: #ffffff;">
            ${evoResult.newSpecies.name}
          </div>

          <p style="font-size: 12px; color: var(--text-muted); max-width: 320px;">
            ${evoResult.newSpecies.description}
          </p>

          <div class="evo-power-surge" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
            Power: ${evoResult.oldPower} ${getGameIcon('arrowRight', { size: 11 })} ${evoResult.newPower} 
            (+${Math.round((evoResult.newPower / Math.max(1, evoResult.oldPower) - 1) * 100)}%)
          </div>

          <div style="font-size: 11px; color: var(--text-muted);">
            Tier ${evoResult.newSpecies.tier} Level Cap unlocked: Lv. ${evoResult.newSpecies.levelCap}
          </div>
        </div>

        <button id="btn-close-evo" class="modal-btn-confirm" style="background: ${isRare ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'linear-gradient(135deg, #2ed573, #26af5f)'}">
          Acknowledge Ascension
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-evo')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
    if (onDone) onDone();
  });
}

export function showSummonRevealModal(spirits, options = {}) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const onDone = typeof options === 'function' ? options : options.onDone;
  const skipAnimation = typeof options === 'object' ? Boolean(options.skipAnimation) : false;

  const count = spirits.length;

  const renderRevealScreen = () => {
    safePlaySfx('contract_summon', 0.6);
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width: 460px;">
          <h2 class="modal-title" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${getGameIcon('scroll', { size: 18, color: '#f59e0b' })} Spirit Contract Complete!
          </h2>
          
          <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
            ${count === 1 ? '1 Spirit summoned from the astral realm:' : `${count} Spirits bound by ancient contract:`}
          </div>

          <div style="display: grid; grid-template-columns: ${count > 1 ? 'repeat(auto-fill, minmax(80px, 1fr))' : '1fr'}; gap: 10px; max-height: 52vh; overflow-y: auto; padding: 4px;">
            ${spirits.map((s, idx) => `
              <div class="summon-card-animated" style="display: flex; flex-direction: column; align-items: center; gap: 4px; animation-delay: ${idx * 60}ms;">
                <div style="width: 76px; height: 76px;">
                  ${createSpiritPlaceholderBox(s)}
                </div>
                <div style="font-size: 11px; font-weight: 800; text-align: center; color: #fff;">
                  ${s.customName}
                </div>
                <div style="font-size: 10px; font-family: var(--font-mono); color: #2ed573; display: inline-flex; align-items: center; gap: 3px;">
                  ${getGameIcon('zap', { size: 10, color: '#2ed573' })} ${s.power} PWR
                </div>
              </div>
            `).join('')}
          </div>

          <button id="btn-close-summon" class="modal-btn-confirm">
            Collect to Vault
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-close-summon')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onDone) onDone();
    });
  };

  // If player chose Skip Animation, immediately show reveal
  if (skipAnimation) {
    renderRevealScreen();
    return;
  }

  // Otherwise, play Celestial Summoning Vortex sequence
  safePlaySfx('contract_summon', 0.8);

  modalRoot.innerHTML = `
    <div class="summon-vortex-screen">
      <button id="btn-skip-summon-now" class="summon-skip-btn">
        <span>${getGameIcon('zap', { size: 12, color: '#facc15' })}</span>
        <span>Skip Animation</span>
      </button>

      <div class="summon-magic-circle-wrap">
        <div class="summon-outer-rune"></div>
        <div class="summon-inner-rune"></div>
        <div class="summon-core-orb"></div>
      </div>

      <div class="summon-vortex-title">
        Invoking Celestial Spirit Contract...
      </div>
      <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px; text-shadow: 0 0 8px rgba(255,255,255,0.4);">
        Channeling astral mana into ${count} spirit contract(s)...
      </div>
    </div>
  `;

  let animTimeout = null;
  let isSkipped = false;

  const triggerReveal = () => {
    if (isSkipped) return;
    isSkipped = true;
    if (animTimeout) clearTimeout(animTimeout);
    renderRevealScreen();
  };

  modalRoot.querySelector('#btn-skip-summon-now')?.addEventListener('click', triggerReveal);

  animTimeout = setTimeout(triggerReveal, 1600);
}
