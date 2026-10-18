import { closeActiveModal } from './modals.js';
import { safePlaySfx } from '../../audio/audioManager.js';
import { getGameIcon } from '../icons/gameIcons.js';

/**
 * Renders a celebratory Contractor Level Up Ascension modal
 * @param {Object} options
 * @param {number} options.level - New contractor level reached
 * @param {Array} options.newFeatures - Array of feature configs unlocked at this level
 * @param {Object} options.rewards - { shards: number, energy: number }
 * @param {Function} options.onClaim - Callback when player closes modal
 */
export function showLevelUpModal({ level, newFeatures = [], rewards = { shards: 100, energy: 20 }, onClaim }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  // Sound effect
  safePlaySfx('contract_summon', 0.6);

  modalRoot.innerHTML = `
    <div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div class="relative w-full max-w-md sm:max-w-lg bg-slate-900 border border-amber-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-white flex flex-col items-center text-center gap-5 sm:gap-6 overflow-hidden"
           style="box-shadow: 0 0 50px rgba(245, 158, 11, 0.35), inset 0 0 20px rgba(93, 63, 211, 0.3);">

        <!-- Radiant Aura Rings with Ambient Breathing -->
        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 flex items-center justify-center text-4xl sm:text-5xl shadow-xl shadow-amber-500/40 border-2 border-white/60 ambient-breath">
          ${getGameIcon('crown', { size: '42px', color: '#fff' })}
        </div>

        <div class="flex flex-col items-center gap-1.5 px-2">
          <span class="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-amber-300 drop-shadow">
            Contractor Ascension
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
            Level ${level} Reached!
          </h2>
          <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm leading-relaxed">
            Your celestial authority expands. The astral realm responds to your rising power!
          </p>
        </div>

        <!-- Unlocked Features Section (if any unlocked at this level) -->
        ${newFeatures && newFeatures.length > 0 ? `
          <div class="w-full flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-950/85 border border-cyan-400/50 shadow-inner">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center justify-center gap-1.5">
              <span class="inline-flex items-center">${getGameIcon('unlock', { size: '14px', color: '#67e8f9' })}</span>
              <span>New System Unlocked!</span>
            </span>

            ${newFeatures.map(feat => `
              <div class="flex items-center gap-3.5 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-left">
                <span class="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 shrink-0 ambient-float inline-flex items-center justify-center">
                  ${feat.iconKey ? getGameIcon(feat.iconKey, { size: '24px' }) : getGameIcon('sparkle', { size: '24px', color: '#38bdf8' })}
                </span>
                <div class="flex flex-col gap-0.5">
                  <h4 class="text-xs sm:text-sm font-black text-white">${feat.name}</h4>
                  <p class="text-[11px] sm:text-xs text-slate-300 leading-relaxed">${feat.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Ascension Spoils -->
        <div class="w-full p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-around text-xs sm:text-sm">
          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center">${getGameIcon('crystal', { size: '24px', color: '#38bdf8' })}</span>
            <div class="flex flex-col text-left">
              <span class="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider">Ascension Reward</span>
              <strong class="text-cyan-300 font-extrabold text-xs sm:text-sm">+${rewards.shards || 100} Shards</strong>
            </div>
          </div>

          <div class="w-[1px] h-8 bg-slate-800"></div>

          <div class="flex items-center gap-2.5">
            <span class="inline-flex items-center">${getGameIcon('energy', { size: '24px', color: '#facc15' })}</span>
            <div class="flex flex-col text-left">
              <span class="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider">Energy Refill</span>
              <strong class="text-amber-300 font-extrabold text-xs sm:text-sm">+${rewards.energy || 20} Energy</strong>
            </div>
          </div>
        </div>

        <!-- Claim CTA Button -->
        <button id="btn-claim-levelup" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2">
          <span>Claim Spoils & Ascend</span>
          ${getGameIcon('arrowRight', { size: '14px', color: '#020617' })}
        </button>

      </div>
    </div>
  `;

  modalRoot.querySelector('#btn-claim-levelup')?.addEventListener('click', () => {
    closeActiveModal();
    if (onClaim) onClaim();
  });
}
