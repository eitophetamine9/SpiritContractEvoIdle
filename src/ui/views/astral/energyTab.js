import { gameState } from '../../../state/gameState.js';
import { audioManager } from '../../../audio/audioManager.js';
import { getGameIcon } from '../../icons/gameIcons.js';

export function renderEnergySectionHtml(currentMax, isCapped, costEssence, costSoul, canAfford) {
  const percent = Math.min(100, Math.round(((currentMax - 60) / (500 - 60)) * 100));

  return `
    <div class="rounded-xl border border-amber-500/30 p-3.5 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950 shadow-md flex flex-col gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
          ${getGameIcon('energy', { size: 24, color: '#facc15' })}
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-amber-300">Energy Reservoir Expansion</h3>
          <p class="text-[11px] text-slate-400">Permanently expand maximum Energy capacity up to 500.</p>
        </div>
      </div>

      <!-- Energy Gauge Meter -->
      <div class="rounded-lg bg-slate-950/80 border border-slate-800 p-3 flex flex-col gap-1.5">
        <div class="flex justify-between text-[11px] font-bold">
          <span class="text-slate-400 inline-flex items-center gap-0.5">Base: 60 ${getGameIcon('energy', { size: 11, color: '#facc15' })}</span>
          <span class="text-amber-300 font-extrabold inline-flex items-center gap-0.5">Current: ${currentMax} / 500 ${getGameIcon('energy', { size: 11, color: '#facc15' })}</span>
          <span class="text-slate-400 inline-flex items-center gap-0.5">Cap: 500 ${getGameIcon('energy', { size: 11, color: '#facc15' })}</span>
        </div>
        <div class="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
          <div class="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 rounded-full transition-all duration-500" style="width: ${percent}%;"></div>
        </div>
        <div class="text-[10px] text-slate-400 text-center mt-0.5">
          ${isCapped ? `${getGameIcon('sparkle', { size: 11, color: '#facc15' })} Maximum 500 Energy capacity reached!` : `${500 - currentMax} Energy remaining to max capacity.`}
        </div>
      </div>

      ${!isCapped ? `
        <div class="rounded-lg border border-amber-500/30 bg-slate-900/60 p-3 flex items-center justify-between gap-2">
          <div>
            <div class="text-xs font-bold text-white">
              Expand to <strong class="text-amber-300 inline-flex items-center gap-0.5">${currentMax + 20} ${getGameIcon('energy', { size: 11, color: '#facc15' })}</strong> (+20)
            </div>
            <div class="text-[10px] text-slate-400">
              Cost: <span class="text-cyan-300 font-bold inline-flex items-center gap-0.5">${costEssence} ${getGameIcon('godsEssence', { size: 11 })}</span> ${costSoul > 0 ? `+ <span class="text-purple-300 font-bold inline-flex items-center gap-0.5">${costSoul} ${getGameIcon('astralEssence', { size: 11 })}</span>` : ''}
            </div>
          </div>
          <button id="btn-upgrade-energy-cap" class="min-h-[38px] px-3.5 py-1.5 rounded-lg font-bold text-xs text-slate-950 transition-all cursor-pointer shadow disabled:opacity-50 bg-gradient-to-r from-amber-400 to-yellow-300 inline-flex items-center gap-1" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? `${getGameIcon('energy', { size: 12, color: '#0f172a' })} Expand (+20)` : 'Insufficient'}
          </button>
        </div>
      ` : `
        <div class="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-center text-xs font-bold text-amber-300 inline-flex items-center justify-center gap-1.5">
          ${getGameIcon('trophy', { size: 13, color: '#facc15' })} Fully awakened at maximum 500 Energy!
        </div>
      `}
    </div>
  `;
}


export function bindEnergyEvents(container, callbacks = {}) {
  container.querySelector('#btn-upgrade-energy-cap')?.addEventListener('click', () => {
    try {
      gameState.upgradeEnergyCapacity();
      if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
    } catch (err) {
      alert(err.message);
    }
  });
}

