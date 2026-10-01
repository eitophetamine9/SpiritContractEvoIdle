import { createSpiritPlaceholderBox } from './pixelBox.js';
import { SPIRIT_SPECIES } from '../../data/spiritsData.js';

export function showOfflineModal(report, onClaim) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const hours = Math.floor(report.elapsedSeconds / 3600);
  const minutes = Math.floor((report.elapsedSeconds % 3600) / 60);
  const seconds = report.elapsedSeconds % 60;
  const timeStr = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;

  let levelUpsHtml = '';
  if (report.levelUps.length > 0) {
    levelUpsHtml = `
      <div style="font-size: 12px; color: #70a1ff; font-weight: 700; margin-top: 4px;">
        ⬆️ Level Ups:
        ${report.levelUps.map(l => `<div>• ${l.name}: Lv. ${l.oldLevel} ➔ Lv. ${l.newLevel}</div>`).join('')}
      </div>
    `;
  }

  let evoHtml = '';
  if (report.readyToEvolve.length > 0) {
    evoHtml = `
      <div style="font-size: 12px; color: #ffd700; font-weight: 800; margin-top: 4px; padding: 6px; background: rgba(255,215,0,0.1); border-radius: 6px;">
        ⚡ Ready to Evolve (${report.readyToEvolve.length}):
        ${report.readyToEvolve.map(s => `<div>🌟 ${s.customName} hit Level Cap!</div>`).join('')}
      </div>
    `;
  }

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">⛩️ Welcome Back, Contractor!</h2>
        
        <div style="text-align: center; font-size: 13px; color: var(--text-muted);">
          While you were away for <strong style="color: #ffffff;">${timeStr}</strong>, your ${report.partyCount} equipped Spirit(s) trained tirelessly in the astral plane:
        </div>

        <div class="offline-gains-box">
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">AFK Training XP / Spirit:</span>
            <span style="color: #70a1ff;">+${report.xpGainedPerSpirit.toLocaleString()} XP</span>
          </div>

          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Madness Shards Gathered:</span>
            <span style="color: #00d2ff;">+${report.offlineShards.toLocaleString()} 💎</span>
          </div>

          ${report.offlineEssence > 0 ? `
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Soul Essence Extracted:</span>
            <span style="color: #e056fd;">+${report.offlineEssence} 🔮</span>
          </div>` : ''}

          ${levelUpsHtml}
          ${evoHtml}
        </div>

        <button id="btn-claim-offline" class="modal-btn-confirm">
          Claim Idle Spoils
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-claim-offline')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
    if (onClaim) onClaim();
  });
}

export function showEvolutionCeremonyModal(evoResult, onDone) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const isRare = evoResult.isRare;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card" style="border-color: ${isRare ? '#ffd700' : '#70a1ff'};">
        <h2 class="modal-title">⚡ SPIRIT EVOLUTION!</h2>

        <div class="evolution-display-box">
          <div class="evolution-cards-comparison">
            <div class="evolution-card-frame">
              ${createSpiritPlaceholderBox(evoResult.oldSpecies)}
            </div>

            <div class="evolution-arrow">➔</div>

            <div class="evolution-card-frame">
              ${createSpiritPlaceholderBox(evoResult.spirit, { isCapped: false })}
            </div>
          </div>

          <div class="variant-announcement ${isRare ? 'rare' : 'common'}">
            ${isRare ? '🎉 ' + evoResult.variantName.toUpperCase() + ' (LUCKY ROLL!)' : '✨ ' + evoResult.variantName.toUpperCase()}
          </div>

          <div style="font-size: 16px; font-weight: 800; color: #ffffff;">
            ${evoResult.newSpecies.name}
          </div>

          <p style="font-size: 12px; color: var(--text-muted); max-width: 320px;">
            ${evoResult.newSpecies.description}
          </p>

          <div class="evo-power-surge">
            Power: ${evoResult.oldPower} ➔ ${evoResult.newPower} 
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

export function showSummonRevealModal(spirits, onDone) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const count = spirits.length;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">📜 Spirit Contract Complete!</h2>
        
        <div style="font-size: 12px; color: var(--text-muted); text-align: center;">
          ${count === 1 ? '1 Spirit summoned from the astral realm:' : `${count} Spirits bound by ancient contract:`}
        </div>

        <div style="display: grid; grid-template-columns: ${count > 1 ? 'repeat(auto-fill, minmax(80px, 1fr))' : '1fr'}; gap: 10px; max-height: 50vh; overflow-y: auto; padding: 4px;">
          ${spirits.map(s => `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 76px; height: 76px;">
                ${createSpiritPlaceholderBox(s)}
              </div>
              <div style="font-size: 11px; font-weight: 800; text-align: center; color: #fff;">
                ${s.customName}
              </div>
              <div style="font-size: 10px; font-family: var(--font-mono); color: #2ed573;">
                ⚡ ${s.power} PWR
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
}
