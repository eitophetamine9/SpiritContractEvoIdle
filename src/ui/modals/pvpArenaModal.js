/**
 * Asynchronous PvP Arena Modal: "Colosseum of Phantoms"
 * Matches contractors, displays 3x3 defense formations, and runs authenticated duels.
 */

import { pvpArenaService, getEloTier } from '../../services/pvpArenaService.js';
import { gameState } from '../../state/gameState.js';
import { getGameIcon } from '../icons/gameIcons.js';
import { closeActiveModal } from './modalBase.js';
import { safePlaySfx } from '../../audio/audioManager.js';

export async function showPvPArenaModal() {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const playerElo = pvpArenaService.getPlayerElo();
  const playerTier = getEloTier(playerElo);

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card pvp-arena-card" style="max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto; padding: 20px; background: linear-gradient(180deg, #161b2e 0%, #0d111e 100%); border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
        
        <!-- Arena Header Banner -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 26px;">⚔️</span>
            <div>
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">Colosseum of Phantoms</h2>
              <div style="font-size: 11px; color: var(--text-muted);">Asynchronous 3x3 Phantom PvP Duels</div>
            </div>
          </div>
          <button id="btn-close-pvp-modal" style="background: rgba(255,255,255,0.08); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">✕</button>
        </div>

        <!-- Player Elo Banner Card -->
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Your Combat Standing</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
              <span style="font-size: 20px;">${playerTier.badge}</span>
              <span style="font-weight: 800; font-size: 16px; color: ${playerTier.color};">${playerTier.name}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Elo Rating</div>
            <div style="font-size: 20px; font-weight: 900; color: #fbbf24;">${playerElo}</div>
          </div>
        </div>

        <!-- Section Title -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #cbd5e1;">Available Challengers</span>
          <button id="btn-refresh-opponents" style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; font-size: 11px; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>🔄</span> Refresh
          </button>
        </div>

        <!-- Opponents Container -->
        <div id="pvp-opponents-list" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 13px;">Seeking rival phantoms across the astral planes...</div>
        </div>

        <!-- Battle Arena Stage Container (Hidden until duel started) -->
        <div id="pvp-duel-stage" style="display: none; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;"></div>

      </div>
    </div>
  `;

  // Attach close listener
  document.getElementById('btn-close-pvp-modal')?.addEventListener('click', () => {
    closeActiveModal();
  });

  const renderOpponents = async () => {
    const listEl = document.getElementById('pvp-opponents-list');
    if (!listEl) return;

    listEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 13px;">Seeking rival phantoms across the astral planes...</div>`;
    const rivals = await pvpArenaService.fetchRankedOpponents();

    if (!rivals || rivals.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; padding: 20px; color: #94a3b8;">No rival contractors found in your Elo range right now. Try refreshing!</div>`;
      return;
    }

    listEl.innerHTML = rivals.map(rival => {
      const tier = getEloTier(rival.elo_rating || 1000);
      const spiritsCount = Array.isArray(rival.defense_roster) ? rival.defense_roster.length : 1;
      return `
        <div class="pvp-rival-card" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 20px; border: 1px solid rgba(255,255,255,0.15);">
              ${rival.avatar_emoji || '🧙‍♂️'}
            </div>
            <div>
              <div style="font-weight: 800; font-size: 14px; color: #ffffff;">${rival.username} <span style="font-size: 11px; font-weight: 600; color: #94a3b8;">(Lv. ${rival.contractor_level || 1})</span></div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px; font-size: 11px;">
                <span style="color: ${tier.color}; font-weight: 700;">${tier.badge} ${tier.name}</span>
                <span style="color: var(--text-muted);">•</span>
                <span style="color: #fbbf24; font-weight: 800;">${rival.elo_rating || 1000} Elo</span>
                <span style="color: var(--text-muted);">•</span>
                <span style="color: #38bdf8;">⚡ ${rival.total_party_power || 100} Power</span>
              </div>
            </div>
          </div>
          <button class="btn-challenge-rival" data-rival-id="${rival.user_id}" style="background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); border: none; color: #ffffff; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(244,63,94,0.3);">
            <span>⚔️</span> Duel
          </button>
        </div>
      `;
    }).join('');

    // Attach challenge buttons
    document.querySelectorAll('.btn-challenge-rival').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rivalId = e.currentTarget.getAttribute('data-rival-id');
        const opponent = rivals.find(r => r.user_id === rivalId);
        if (opponent) {
          startDuelSequence(opponent);
        }
      });
    });
  };

  const startDuelSequence = async (opponent) => {
    const stageEl = document.getElementById('pvp-duel-stage');
    const opponentsContainer = document.getElementById('pvp-opponents-list');
    if (!stageEl) return;

    if (opponentsContainer) {
      opponentsContainer.style.display = 'none';
    }
    stageEl.style.display = 'block';

    const playerParty = gameState.getPartySpirits ? gameState.getPartySpirits() : [];
    const playerPower = gameState.calculateTotalPartyPower ? gameState.calculateTotalPartyPower() : 100;
    const opponentPower = opponent.total_party_power || 100;

    stageEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 12px;">
        <span style="font-size: 11px; text-transform: uppercase; color: #f43f5e; font-weight: 800; letter-spacing: 1px;">⚔️ Phantom Duel In Progress</span>
        <div style="font-size: 16px; font-weight: 900; color: #fff; margin-top: 2px;">Your Party vs. ${opponent.username}</div>
      </div>

      <!-- Duel Arena Layout -->
      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 14px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.06);">
        <!-- Challenger Side -->
        <div style="text-align: center;">
          <div style="font-weight: 800; color: #38bdf8; font-size: 13px;">Your Spirits</div>
          <div style="font-size: 11px; color: var(--text-muted);">${playerParty.length} Spirits • ⚡ ${playerPower}</div>
          <div style="margin-top: 8px; display: flex; justify-content: center; gap: 4px; flex-wrap: wrap;">
            ${playerParty.slice(0, 3).map(s => `<span style="font-size: 11px; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">${s.customName || s.speciesId}</span>`).join('')}
          </div>
        </div>

        <div style="font-size: 18px; font-weight: 900; color: #f43f5e;">VS</div>

        <!-- Defender Side -->
        <div style="text-align: center;">
          <div style="font-weight: 800; color: #f87171; font-size: 13px;">${opponent.username}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${(opponent.defense_roster || []).length} Spirits • ⚡ ${opponentPower}</div>
          <div style="margin-top: 8px; display: flex; justify-content: center; gap: 4px; flex-wrap: wrap;">
            ${(opponent.defense_roster || []).slice(0, 3).map(s => `<span style="font-size: 11px; background: rgba(248,113,113,0.15); color: #f87171; padding: 2px 6px; border-radius: 4px;">${s.customName || s.speciesId}</span>`).join('')}
          </div>
        </div>
      </div>

      <div id="pvp-duel-progress-bar" style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 16px;">
        <div id="pvp-duel-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #f43f5e); transition: width 0.1s linear;"></div>
      </div>

      <div id="pvp-duel-log" style="font-size: 12px; color: #94a3b8; text-align: center; min-height: 20px; margin-bottom: 12px;">Simulating Wasm tactical strikes...</div>
    `;

    // Simulate animated duel progress (1.5 seconds)
    const fillEl = document.getElementById('pvp-duel-fill');
    const logEl = document.getElementById('pvp-duel-log');

    let progress = 0;
    const interval = setInterval(async () => {
      progress += 10;
      if (fillEl) fillEl.style.width = `${progress}%`;

      if (progress === 30 && logEl) logEl.textContent = 'Engaging frontline formation...';
      if (progress === 60 && logEl) logEl.textContent = 'Unleashing burst ultimates...';
      if (progress === 90 && logEl) logEl.textContent = 'Resolving tactical damage mitigation...';

      if (progress >= 100) {
        clearInterval(interval);

        // Determine authentic outcome based on power & tactics
        const winProbability = Math.min(0.90, Math.max(0.10, playerPower / (playerPower + opponentPower)));
        const isVictory = Math.random() < winProbability;

        const result = await pvpArenaService.commitDuelResult(opponent, isVictory);

        if (isVictory) {
          safePlaySfx('levelUp');
        }

        stageEl.innerHTML = `
          <div style="text-align: center; padding: 16px; background: ${isVictory ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}; border: 1px solid ${isVictory ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}; border-radius: 12px;">
            <div style="font-size: 36px; margin-bottom: 6px;">${isVictory ? '🏆' : '💀'}</div>
            <div style="font-size: 20px; font-weight: 900; color: ${isVictory ? '#4ade80' : '#f87171'};">
              ${isVictory ? 'VICTORY ACHIEVED!' : 'DEFEAT'}
            </div>
            <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">
              ${isVictory ? `You shattered ${opponent.username}'s phantom formation!` : `${opponent.username}'s defenses held firm.`}
            </div>

            <!-- Rating Adjustment Banner -->
            <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.4); padding: 8px 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-muted);">Rating:</span>
              <span style="font-size: 15px; font-weight: 900; color: ${result.eloDelta > 0 ? '#4ade80' : '#f87171'};">
                ${result.eloDelta > 0 ? `+${result.eloDelta}` : result.eloDelta} Elo
              </span>
              <span style="color: var(--text-muted);">→</span>
              <span style="font-size: 15px; font-weight: 900; color: #fbbf24;">${result.newElo} Elo</span>
            </div>

            ${result.spoils ? `
              <div style="margin-top: 10px; font-size: 12px; color: #38bdf8; font-weight: 700;">
                +${result.spoils.shards.toLocaleString()} Spirit Shards Awarded!
              </div>
            ` : ''}

            <div style="margin-top: 18px;">
              <button id="btn-return-opponents" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 12px; font-weight: 700; padding: 8px 20px; border-radius: 8px; cursor: pointer;">
                Return to Challengers
              </button>
            </div>
          </div>
        `;

        document.getElementById('btn-return-opponents')?.addEventListener('click', () => {
          stageEl.style.display = 'none';
          if (opponentsContainer) {
            opponentsContainer.style.display = 'flex';
          }
          renderOpponents();
        });
      }
    }, 150);
  };

  document.getElementById('btn-refresh-opponents')?.addEventListener('click', () => {
    renderOpponents();
  });

  // Initial render
  renderOpponents();
}
