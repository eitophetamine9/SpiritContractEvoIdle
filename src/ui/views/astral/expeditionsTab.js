import { gameState } from '../../../state/gameState.js';
import { audioManager } from '../../../audio/audioManager.js';
import { EXPEDITIONS_CONFIG } from '../../../data/astralRealmData.js';
import { SPIRIT_SPECIES } from '../../../data/spiritsData.js';
import { createSpiritPlaceholderBox } from '../../components/pixelBox.js';
import { closeActiveModal } from '../../modals/modalBase.js';

export function renderExpeditionsSectionHtml(state) {
  const expeditions = state.expeditions || {};
  const eligibleSpirits = gameState.getEligibleExpeditionSpirits();

  return `
    <div class="flex flex-col gap-3">
      <!-- Expedition Banner -->
      <div class="rounded-xl border border-indigo-500/30 p-3 bg-gradient-to-b from-indigo-950/20 via-slate-900/90 to-slate-950 shadow-md flex flex-col gap-1.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🧭</span>
            <div>
              <h3 class="text-xs sm:text-sm font-extrabold text-white">Astral Expeditions (Spirit Dispatch)</h3>
              <p class="text-[10px] sm:text-[11px] text-slate-400">Dispatch idle spirits into celestial fissures to gather rare 🔮 Astral Essences, 💠 God Essences, and Greek God Relics.</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              ${eligibleSpirits.length} Idle Spirits
            </span>
          </div>
        </div>
        <div class="text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-2.5 py-1">
          💡 <strong>Elemental Synergy:</strong> Dispatching at least 1 spirit matching the fissure's recommended element grants <strong>+25% bonus yield</strong> to all rewards!
        </div>
      </div>

      <!-- Fissure Cards -->
      <div class="flex flex-col gap-2.5">
        ${EXPEDITIONS_CONFIG.map(fissure => {
          const exp = expeditions[fissure.id];
          const isActive = exp && exp.active;
          let isComplete = false;
          let remainingSeconds = 0;
          let progressPct = 0;

          if (isActive) {
            const elapsed = (Date.now() - exp.startTime) / 1000;
            remainingSeconds = Math.max(0, exp.durationSec - elapsed);
            isComplete = remainingSeconds <= 0;
            progressPct = Math.min(100, Math.round((elapsed / exp.durationSec) * 100));
          }

          const hours = Math.floor(remainingSeconds / 3600);
          const mins = Math.floor((remainingSeconds % 3600) / 60);
          const secs = Math.floor(remainingSeconds % 60);
          const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs}s`;

          return `
            <div class="rounded-xl border ${isActive ? 'border-indigo-500/50 bg-indigo-950/15' : 'border-slate-800 bg-slate-900/80'} p-3 shadow-md flex flex-col gap-2.5">
              
              <!-- Fissure Header -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                    ${fissure.icon}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-xs sm:text-sm font-bold text-white">${fissure.name}</span>
                      <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        ${fissure.tier} • ⏱️ ${fissure.durationLabel}
                      </span>
                      <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        Req: ${fissure.recommendedElement} (+25%)
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400 truncate mt-0.5">${fissure.description}</div>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <span class="text-[10px] font-bold text-slate-400">Team:</span>
                  <strong class="text-xs text-white"> ${fissure.requiredSpirits} Spirits</strong>
                </div>
              </div>

              <!-- Rewards Preview Strip -->
              <div class="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2 flex items-center justify-between text-[11px] flex-wrap gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-purple-300 font-bold">🔮 ${fissure.rewards.minAstral}–${fissure.rewards.maxAstral} Astral</span>
                  <span class="text-cyan-300 font-bold">💠 ${fissure.rewards.minGods}–${fissure.rewards.maxGods} Gods</span>
                  <span class="text-emerald-300 font-bold">💎 ${fissure.rewards.shards} Shards</span>
                  ${fissure.rewards.dropRelicChance ? `<span class="text-amber-300 font-bold">🎁 ${(fissure.rewards.dropRelicChance * 100)}% Relic Chance</span>` : ''}
                </div>
              </div>

              <!-- Active Status or Dispatch Actions -->
              ${isActive ? `
                <div class="rounded-lg border border-indigo-500/30 bg-slate-950/60 p-2.5 flex flex-col gap-2">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-indigo-400 font-bold text-[11px]">Dispatched:</span>
                      <div class="flex items-center gap-1 flex-wrap">
                        ${exp.spiritIds.map(sId => {
                          const sp = state.spirits.find(s => s.id === sId);
                          const isMatch = sp && sp.element === fissure.recommendedElement;
                          return `
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 border ${isMatch ? 'border-amber-400 text-amber-300' : 'border-slate-700 text-slate-300'}" title="${sp?.customName || sId}">
                              ${isMatch ? '✨ ' : ''}${sp?.customName || (SPIRIT_SPECIES[sp?.speciesId]?.name) || sId}
                            </span>
                          `;
                        }).join('')}
                      </div>
                    </div>

                    <div>
                      ${isComplete ? `
                        <span class="text-emerald-400 font-black animate-pulse text-[11px]">🎉 Ready to Claim!</span>
                      ` : `
                        <span class="text-slate-400 text-[11px]">⏱️ ${timeLabel}</span>
                      `}
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-300" style="width: ${progressPct}%;"></div>
                  </div>

                  <!-- Action Buttons -->
                  <div>
                    ${isComplete ? `
                      <button class="btn-claim-expedition w-full py-2 rounded-lg font-black text-xs text-slate-950 transition-all cursor-pointer shadow bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:brightness-110" data-fissure-id="${fissure.id}">
                        🎁 Claim Expedition Spoils
                      </button>
                    ` : `
                      <button class="w-full py-1.5 rounded-lg font-bold text-xs bg-slate-800 text-slate-400 cursor-not-allowed opacity-80" disabled>
                        ⏳ Expedition in Progress (${timeLabel})
                      </button>
                    `}
                  </div>
                </div>
              ` : `
                <div class="flex items-center gap-2">
                  <button class="btn-quick-dispatch flex-1 py-2 px-3 rounded-lg font-bold text-xs text-slate-950 transition-all cursor-pointer shadow bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 hover:brightness-110 disabled:opacity-50" 
                          data-fissure-id="${fissure.id}" 
                          ${eligibleSpirits.length >= fissure.requiredSpirits ? '' : 'disabled'}>
                    ⚡ Quick Dispatch (Auto-Pick Best)
                  </button>
                  <button class="btn-open-dispatch-picker py-2 px-3 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50" 
                          data-fissure-id="${fissure.id}" 
                          ${eligibleSpirits.length >= fissure.requiredSpirits ? '' : 'disabled'}>
                    Select Spirits
                  </button>
                </div>
              `}

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}


export function bindExpeditionEvents(container, callbacks = {}) {
  container.querySelectorAll('.btn-claim-expedition').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fId = e.currentTarget.getAttribute('data-fissure-id');
      try {
        const loot = gameState.claimExpeditionRewards(fId);
        try { audioManager.playSfx('reward'); } catch {}
        alert(`🏆 Expedition Spoils Collected!\n+${loot.astralGained} 🔮 Astral Essences\n+${loot.godsGained} 💠 Essences of the Gods\n+${loot.shardsGained.toLocaleString()} 💎 Spirit Shards${loot.relicGained ? `\n🎁 BONUS RELIC: ${loot.relicGained.name} (${loot.relicGained.rarity})` : ''}${loot.hasElementMatch ? '\n✨ Elemental Synergy: +25% Bonus Applied!' : ''}`);
        if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
      } catch (err) {
        alert(err.message);
      }
    });
  });

  container.querySelectorAll('.btn-quick-dispatch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fId = e.currentTarget.getAttribute('data-fissure-id');
      const fissure = EXPEDITIONS_CONFIG.find(f => f.id === fId);
      if (!fissure) return;

      const eligible = gameState.getEligibleExpeditionSpirits();
      if (eligible.length < fissure.requiredSpirits) {
        alert(`Insufficient idle spirits! This fissure requires ${fissure.requiredSpirits} spirit(s).`);
        return;
      }

      // Sort eligible spirits: matching element first, then highest level
      const sorted = [...eligible].sort((a, b) => {
        const matchA = a.element === fissure.recommendedElement ? 1 : 0;
        const matchB = b.element === fissure.recommendedElement ? 1 : 0;
        if (matchA !== matchB) return matchB - matchA;
        return (b.level || 1) - (a.level || 1);
      });

      const chosenIds = sorted.slice(0, fissure.requiredSpirits).map(s => s.id);
      try {
        gameState.dispatchExpedition(fId, chosenIds);
        try { audioManager.playSfx('tap'); } catch {}
        if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
      } catch (err) {
        alert(err.message);
      }
    });
  });

  container.querySelectorAll('.btn-open-dispatch-picker').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fId = e.currentTarget.getAttribute('data-fissure-id');
      openExpeditionSpiritPickerModal(fId, container);
    });
  });
}


export function openExpeditionSpiritPickerModal(fissureId, container, callbacks = {}) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const fissure = EXPEDITIONS_CONFIG.find(f => f.id === fissureId);
  if (!fissure) return;

  const eligibleSpirits = gameState.getEligibleExpeditionSpirits();
  const selectedIds = new Set();

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card max-w-lg w-full bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl text-white flex flex-col gap-3">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${fissure.icon}</span>
            <div>
              <h3 class="text-sm font-extrabold text-white">Dispatch: ${fissure.name}</h3>
              <p class="text-[11px] text-slate-400">Select <strong class="text-amber-300">${fissure.requiredSpirits}</strong> idle spirit(s) • Recommended Element: <strong class="text-amber-400">${fissure.recommendedElement}</strong></p>
            </div>
          </div>
          <button id="btn-close-expedition-modal" class="text-slate-400 hover:text-white text-base cursor-pointer">✕</button>
        </div>

        <div id="expedition-picker-list" class="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
          ${eligibleSpirits.length > 0 ? eligibleSpirits.map(s => {
            const isMatch = s.element === fissure.recommendedElement;
            return `
              <div class="exp-spirit-select-row flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer" data-spirit-id="${s.id}">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0">${createSpiritPlaceholderBox(s)}</div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-extrabold text-xs text-white">${s.customName || (SPIRIT_SPECIES[s.speciesId]?.name) || s.id}</span>
                      ${isMatch ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">✨ +25% Synergy</span>' : ''}
                    </div>
                    <div class="text-[10px] text-slate-400">Lv. ${s.level} • ${s.element} • ⚡ ${s.power} PWR</div>
                  </div>
                </div>
                <input type="checkbox" class="exp-checkbox w-4 h-4 rounded accent-indigo-500 pointer-events-none" data-spirit-id="${s.id}">
              </div>
            `;
          }).join('') : '<div class="text-center py-4 text-xs text-slate-400">No idle spirits available! Retire spirits from your active combat party to dispatch them.</div>'}
        </div>

        <div class="flex items-center justify-between border-t border-slate-800 pt-2.5">
          <div class="text-xs text-slate-300">
            Selected: <strong id="selected-exp-count" class="text-indigo-400">0</strong> / ${fissure.requiredSpirits}
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-cancel-exp-modal" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer">
              Cancel
            </button>
            <button id="btn-confirm-exp-dispatch" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50" disabled>
              Dispatch Expedition
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const countEl = modalRoot.querySelector('#selected-exp-count');
  const confirmBtn = modalRoot.querySelector('#btn-confirm-exp-dispatch');

  const updateSelection = () => {
    if (countEl) countEl.textContent = selectedIds.size;
    if (confirmBtn) confirmBtn.disabled = selectedIds.size !== fissure.requiredSpirits;
  };

  modalRoot.querySelectorAll('.exp-spirit-select-row').forEach(row => {
    row.addEventListener('click', () => {
      const sId = row.getAttribute('data-spirit-id');
      const cb = row.querySelector('.exp-checkbox');
      if (selectedIds.has(sId)) {
        selectedIds.delete(sId);
        row.classList.remove('border-indigo-500', 'bg-indigo-950/30');
        if (cb) cb.checked = false;
      } else {
        if (selectedIds.size >= fissure.requiredSpirits) {
          alert(`You can only select up to ${fissure.requiredSpirits} spirits for this expedition.`);
          return;
        }
        selectedIds.add(sId);
        row.classList.add('border-indigo-500', 'bg-indigo-950/30');
        if (cb) cb.checked = true;
      }
      updateSelection();
    });
  });

  const closeModal = () => { modalRoot.innerHTML = ''; };
  modalRoot.querySelector('#btn-close-expedition-modal')?.addEventListener('click', closeModal);
  modalRoot.querySelector('#btn-cancel-exp-modal')?.addEventListener('click', closeModal);

  confirmBtn?.addEventListener('click', () => {
    try {
      gameState.dispatchExpedition(fissure.id, Array.from(selectedIds));
      try { audioManager.playSfx('tap'); } catch {}
      closeModal();
      if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
    } catch (err) {
      alert(err.message);
    }
  });
}

