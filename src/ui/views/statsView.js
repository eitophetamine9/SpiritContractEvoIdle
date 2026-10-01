import { gameState } from '../../state/gameState.js';

export function renderStatsView(container) {
  const state = gameState.state;
  const stats = state.stats;

  const offlineHours = (stats.totalOfflineTimeSec / 3600).toFixed(1);

  container.innerHTML = `
    <div class="stats-container">
      
      <div class="stats-card">
        <h3 style="font-size: 15px; font-weight: 800; color: #70a1ff; margin-bottom: 6px;">
          📊 Contractor Record & Stats
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
          <span class="stat-value" style="color: #00d2ff;">${stats.shardsEarnedTotal.toLocaleString()} 💎</span>
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
        <button id="btn-manual-save" class="btn-save-manual">
          💾 Force Save Game (Local Storage)
        </button>

        <button id="btn-reset-save" class="btn-reset-danger">
          ⚠️ Reset Game Data (Fresh Start)
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
      const origText = btn.textContent;
      btn.textContent = '✅ Saved Successfully!';
      btn.style.background = '#2ed573';
      btn.style.color = '#000';
      setTimeout(() => {
        btn.textContent = origText;
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
