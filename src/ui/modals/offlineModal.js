import { closeActiveModal } from './modalBase.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { getGameIcon } from '../icons/gameIcons.js';

export function showOfflineModal(report, onClaim) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const hours = Math.floor(report.elapsedSeconds / 3600);
  const minutes = Math.floor((report.elapsedSeconds % 3600) / 60);
  const seconds = report.elapsedSeconds % 60;
  const timeParts = [];
  if (hours > 0) timeParts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) timeParts.push(`${minutes}m`);
  timeParts.push(`${seconds}s`);
  const timeStr = timeParts.join(' ');

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
            <span style="color: #00d2ff; display: inline-flex; align-items: center; gap: 4px;">+${report.offlineShards.toLocaleString()} <span class="game-icon-wrap" style="color: #38bdf8;">${getGameIcon('spiritShards', { size: 14 })}</span></span>
          </div>

          ${report.offlineEssence > 0 ? `
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Soul Essence Extracted:</span>
            <span style="color: #e056fd; display: inline-flex; align-items: center; gap: 4px;">+${report.offlineEssence} <span class="game-icon-wrap" style="color: #c084fc;">${getGameIcon('astralEssence', { size: 14 })}</span></span>
          </div>` : ''}
          ${(report.offlinePurified && report.offlinePurified > 0) ? `
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Purified Soul Essence:</span>
            <span style="color: #c084fc; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">+${report.offlinePurified} <span class="game-icon-wrap" style="color: #d8b4fe;">${getGameIcon('purifiedSoul', { size: 14 })}</span></span>
          </div>` : ''}

          ${report.energyGained > 0 ? `
          <div class="offline-loot-row">
            <span style="color: var(--text-muted);">Madness Energy Restored:</span>
            <span style="color: #f1c40f;">+${report.energyGained} ⚡</span>
          </div>` : ''}

          ${levelUpsHtml}
          ${evoHtml}
        </div>

        ${(report.elapsedSeconds >= 3600 || report.canClaim) ? `
        <button id="btn-claim-offline" class="modal-btn-confirm" style="background: linear-gradient(135deg, #00d2ff, #70a1ff); font-weight: 800; cursor: pointer;">
          ✨ Claim Idle Spoils (${timeStr})
        </button>
        ` : `
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; width: 100%;">
          <button id="btn-claim-offline" class="modal-btn-confirm" disabled style="opacity: 0.55; cursor: not-allowed; background: #2f3542; border: 1px solid #57606f;">
            ⏳ 1 Hour Minimum Required to Claim (${timeStr} / 1h)
          </button>
          <button id="btn-dismiss-offline" style="background: transparent; border: none; color: var(--text-muted); font-size: 12px; cursor: pointer; text-decoration: underline;">
            Dismiss & Continue Meditating
          </button>
        </div>
        `}
      </div>
    </div>
  `;

  const canClaim = report.elapsedSeconds >= 3600 || report.canClaim;
  if (canClaim) {
    document.getElementById('btn-claim-offline')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (onClaim) onClaim();
    });
  } else {
    document.getElementById('btn-dismiss-offline')?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });
  }
}

