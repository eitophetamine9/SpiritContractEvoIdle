import { gameState } from '../../../state/gameState.js';
import { audioManager } from '../../../audio/audioManager.js';
import { TRANSMUTATION_CONFIG } from '../../../data/astralRealmData.js';
import { getGameIcon } from '../../icons/gameIcons.js';

export function renderTransmutationSectionHtml(res, state) {
  const currentCount = state.transmutationsToday || 0;
  const maxQuota = TRANSMUTATION_CONFIG.dailyQuota || 5;
  const isCapped = currentCount >= maxQuota;
  const shardCost = TRANSMUTATION_CONFIG.shardCost + currentCount * 250;
  const godCost = TRANSMUTATION_CONFIG.godEssenceCost;
  const canTransmute = !isCapped && (res.spiritShards || 0) >= shardCost && (res.essencesOfTheGods || 0) >= godCost;

  return `
    <div class="flex flex-col gap-3">
      <!-- Transmutation Circle Banner -->
      <div class="rounded-xl border border-fuchsia-500/30 p-3.5 bg-gradient-to-b from-fuchsia-950/25 via-slate-900/90 to-slate-950 shadow-md flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center shrink-0">
              ${getGameIcon('alembic', { size: 24, color: '#f43f5e' })}
            </div>
            <div>
              <h3 class="text-xs sm:text-sm font-extrabold text-white">Astral Transmutation Circle</h3>
              <p class="text-[10px] sm:text-[11px] text-slate-400">Refine massive reserves of Spirit Shards & Essences of the Gods into pure Astral Essence.</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isCapped ? 'bg-red-500/20 border border-red-500/40 text-red-300' : 'bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300'}">
              Today: ${currentCount} / ${maxQuota} (Daily Cap)
            </span>
          </div>
        </div>

        <div class="text-[10px] text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-lg px-2.5 py-1 mt-1 flex items-center gap-1.5 flex-wrap">
          ${getGameIcon('shield', { size: 12 })} <strong>Anti-Oversaturation Economy Protocol:</strong> Hard limit of <strong>${maxQuota} transmutations per day</strong>. Base rate is 1,000 ${getGameIcon('spiritShards', { size: 10 })} + 10 ${getGameIcon('godsEssence', { size: 10 })}. Each transmutation completed today increases shard stabilization cost by <strong>+250 ${getGameIcon('spiritShards', { size: 10 })}</strong> (resets daily at midnight).
        </div>
      </div>

      <!-- Alchemical Converter Card -->
      <div class="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-md flex flex-col gap-4">
        
        <div class="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 text-center">
          <!-- Input Materials -->
          <div class="rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex flex-col gap-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Reagents</div>
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-900 border ${(res.spiritShards || 0) >= shardCost ? 'border-emerald-500/40 text-emerald-300' : 'border-red-500/40 text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('spiritShards', { size: 11 })} Shards:</span>
                <strong>${shardCost.toLocaleString()} (${(res.spiritShards || 0).toLocaleString()})</strong>
              </div>
              <div class="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-900 border ${(res.essencesOfTheGods || 0) >= godCost ? 'border-emerald-500/40 text-emerald-300' : 'border-red-500/40 text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('godsEssence', { size: 11 })} Gods:</span>
                <strong>${godCost} (${(res.essencesOfTheGods || 0)})</strong>
              </div>
            </div>
          </div>

          <!-- Conversion Catalyst Flow Arrow -->
          <div class="flex flex-col items-center justify-center gap-1">
            <span class="text-3xl text-fuchsia-400 animate-pulse">${getGameIcon('arrowRight', { size: 28, color: '#e879f9' })}</span>
            <span class="text-[10px] font-black text-fuchsia-300 uppercase tracking-widest">Crystallize</span>
          </div>

          <!-- Output Catalyst -->
          <div class="rounded-xl bg-gradient-to-b from-purple-950/30 to-slate-950/80 border border-purple-500/40 p-3 flex flex-col items-center justify-center gap-1">
            <div class="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Product</div>
            <div class="text-2xl">${getGameIcon('astralEssence', { size: 28 })}</div>
            <div class="text-sm font-black text-white">+1 Astral Essence</div>
            <div class="text-[10px] text-slate-400 inline-flex items-center gap-1">Current Stock: ${(res.soulEssence || 0).toLocaleString()} ${getGameIcon('astralEssence', { size: 10 })}</div>
          </div>
        </div>

        <!-- Action Button -->
        <button id="btn-transmute-shards" class="min-h-[44px] w-full py-2.5 px-4 rounded-xl font-extrabold text-xs text-slate-950 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${isCapped ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-fuchsia-400 via-purple-300 to-indigo-400 hover:brightness-110'} flex items-center justify-center gap-1.5" ${canTransmute ? '' : 'disabled'}>
          <span>${getGameIcon('alembic', { size: 14 })}</span>
          <span>${isCapped ? `Daily Limit Reached (${maxQuota}/${maxQuota}) — Resets Tomorrow` : canTransmute ? `Perform Transmutation (Cost: ${shardCost.toLocaleString()} Shards + ${godCost} Gods)` : `Insufficient Reagents (Need ${shardCost.toLocaleString()} Shards + ${godCost} Gods)`}</span>
        </button>

      </div>

    </div>
  `;
}


export function bindTransmutationEvents(container, callbacks = {}) {
  container.querySelector('#btn-transmute-shards')?.addEventListener('click', () => {
    try {
      gameState.transmuteShardsToAstralEssence();
      try { audioManager.playSfx('evolution'); } catch {}
      if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
    } catch (err) {
      alert(err.message);
    }
  });
}

