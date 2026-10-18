import { gameState } from '../../state/gameState.js';
import { getGameIcon } from '../icons/gameIcons.js';

export function renderStatsView(container) {
  const state = gameState.state;
  const stats = state.stats;

  const offlineHours = (stats.totalOfflineTimeSec / 3600).toFixed(1);

  container.innerHTML = `
    <div class="stats-container">
      
      <div class="stats-card">
        <h3 style="font-size: 15px; font-weight: 800; color: #70a1ff; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          ${getGameIcon('trophy', { size: '15px', color: '#70a1ff' })} Contractor Record & Stats
        </h3>

        <div class="stat-row">
          <span class="stat-key">Spirits Contracted:</span>
          <span class="stat-value">${stats.totalSpiritsContracted.toLocaleString()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-key">Total RNG Evolutions:</span>
          <span class="stat-value" style="color: #ffd700;">${stats.totalEvolutions.toLocaleString()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-key">Madness Horrors Defeated:</span>
          <span class="stat-value" style="color: #ff6b81;">${stats.totalEnemiesDefeated.toLocaleString()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-key">Highest Zone Cleared:</span>
          <span class="stat-value">Zone ${state.madnessZone.highestStageCleared}</span>
        </div>

        <div class="stat-row">
          <span class="stat-key">Total Shards Harvested:</span>
          <span class="stat-value" style="color: #00d2ff; display: inline-flex; align-items: center; gap: 4px;">${stats.shardsEarnedTotal.toLocaleString()} ${getGameIcon('spiritShards', { size: '13px' })}</span>
        </div>

        <div class="stat-row">
          <span class="stat-key">Total Offline Time Calculated:</span>
          <span class="stat-value">${offlineHours} hours</span>
        </div>

        <div class="stat-row">
          <span class="stat-key">Last Auto-Save:</span>
          <span class="stat-value" style="font-size: 11px;">${new Date(state.last_saved).toLocaleTimeString()}</span>
        </div>
      </div>

      <!-- System Actions (Buttons min 48px) -->
      <div class="system-actions">
        <button id="btn-manual-save" class="btn-save-manual" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
          ${getGameIcon('save', { size: '14px' })} Force Save Game (Local Storage)
        </button>

        <button id="btn-reset-save" class="btn-reset-danger" style="display: flex; align-items: center; justify-content: center; gap: 6px;">
          ${getGameIcon('alert', { size: '14px', color: '#ff4757' })} Reset Game Data (Fresh Start)
        </button>
      </div>

      <div style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 10px;">
        Spirit Contract Evo | Idle v1.0.0 (MVP)<br/>
        Automatic LocalStorage saving every 5 seconds.
      </div>

    </div>
  `;

  document.getElementById('btn-manual-save')?.addEventListener('click', () => {
    gameState.save();
    const btn = document.getElementById('btn-manual-save');
    if (btn) {
      const origHtml = btn.innerHTML;
      btn.innerHTML = `${getGameIcon('check', { size: '14px', color: '#000' })} Saved Successfully!`;
      btn.style.background = '#2ed573';
      btn.style.color = '#000';
      setTimeout(() => {
        btn.innerHTML = origHtml;
        btn.style.background = '#3742fa';
        btn.style.color = '#fff';
      }, 1500);
    }
  });

  document.getElementById('btn-reset-save')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      gameState.resetAllProgress();
      window.location.reload();
    }
  });
}
