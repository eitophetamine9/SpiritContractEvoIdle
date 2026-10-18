import { gameState } from '../../../state/gameState.js';
import { audioManager } from '../../../audio/audioManager.js';
import { createAnimatedSpriteHtml, createAnimatedRelicHtml } from '../../../render/spriteAnimator.js';
import { getGameIcon } from '../../icons/gameIcons.js';

export function renderDwarvenForgeSectionHtml(res, state) {
  // Ensure weekly reset logic is executed
  gameState.checkDwarvenForgeWeekReset();
  const forge = state.dwarvenForge || { scripturesPurchasedThisWeek: 0, reshapersPurchasedThisWeek: 0 };
  const scripturePurchased = forge.scripturesPurchasedThisWeek || 0;
  const reshaperPurchased = forge.reshapersPurchasedThisWeek || 0;

  const scriptureLimit = 3;
  const reshaperLimit = 12;

  const scriptureCost = { shards: 5000, gods: 40, soul: 15 };
  const reshaperCost = { shards: 1500, gods: 12, soul: 4 };

  const canAffordScripture = (res.spiritShards || 0) >= scriptureCost.shards &&
    (res.essencesOfTheGods || 0) >= scriptureCost.gods &&
    (res.soulEssence || 0) >= scriptureCost.soul;
  const isScriptureCapped = scripturePurchased >= scriptureLimit;

  const canAffordReshaper = (res.spiritShards || 0) >= reshaperCost.shards &&
    (res.essencesOfTheGods || 0) >= reshaperCost.gods &&
    (res.soulEssence || 0) >= reshaperCost.soul;
  const isReshaperCapped = reshaperPurchased >= reshaperLimit;

  return `
    <div class="flex flex-col gap-3">
      <!-- Dwarven Forge Banner -->
      <div class="rounded-xl border border-amber-500/30 p-3.5 bg-gradient-to-b from-amber-950/25 via-slate-900/90 to-slate-950 shadow-md flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              ${createAnimatedSpriteHtml('forge_vulcan_automaton', { extraClasses: 'dwarven-master-sprite scale-90' })}
            </div>
            <div>
              <h3 class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                Dwarven's Forge
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  Mythic Relic Workshop
                </span>
              </h3>
              <p class="text-[10px] sm:text-[11px] text-slate-400">Sacred celestial smithy of the master craftsmen. Trade tri-currency reserves for Divine Scriptures and Relic Reshapers.</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 border border-slate-700 text-slate-300 inline-flex items-center gap-1">
              ${getGameIcon('calendar', { size: 12 })} Resets Mondays 00:00 UTC
            </span>
          </div>
        </div>

        <div class="text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2.5 py-1 mt-0.5 flex items-center gap-1.5 flex-wrap">
          ${getGameIcon('balance', { size: 12 })} <strong>Dwarven Trading Quota:</strong> Master dwarven smiths strictly ration their rare catalysts each week. Purchases consume Spirit Shards ${getGameIcon('spiritShards', { size: 11 })}, Essences of the Gods ${getGameIcon('godsEssence', { size: 11 })}, and Soul Essences ${getGameIcon('astralEssence', { size: 11 })}.
        </div>
      </div>

      <!-- Inventory Stock Overview -->
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${getGameIcon('scroll', { size: 16, color: '#f59e0b' })}
            <span class="text-slate-300 text-[11px] font-bold">Divine Scriptures Owned</span>
          </div>
          <strong class="text-amber-400 font-extrabold">${(res.divineScriptures || 0).toLocaleString()}</strong>
        </div>
        <div class="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${getGameIcon('vortex', { size: 16, color: '#06b6d4' })}
            <span class="text-slate-300 text-[11px] font-bold">Relic Reshapers Owned</span>
          </div>
          <strong class="text-cyan-400 font-extrabold">${(res.relicReshapers || 0).toLocaleString()}</strong>
        </div>
      </div>

      <!-- Dwarven Catalog Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">

        <!-- Card 1: Divine Relic Scripture -->
        <div class="rounded-xl border border-amber-500/30 bg-slate-900/85 p-3.5 flex flex-col justify-between gap-3 shadow-md hover:border-amber-500/50 transition-all">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="item-icon-frame flex items-center justify-center p-1 rounded-xl bg-amber-500/20 border border-amber-400/40 shrink-0">
                  ${createAnimatedRelicHtml('divine_scripture', 'scripture', { extraClasses: 'loot-sprite-icon' })}
                </div>
                <div>
                  <h4 class="text-xs font-black text-white">Divine Relic Scripture</h4>
                  <p class="text-[10px] text-amber-400/90 font-semibold">Relic Crafting Catalyst</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isScriptureCapped ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'}">
                ${scripturePurchased} / ${scriptureLimit} This Week
              </span>
            </div>

            <p class="text-[11px] text-slate-300 leading-relaxed">
              Consumable sacred blueprint used in the <strong>Relic Smithy</strong> to forge a pristine Divine Relic with <span class="text-amber-300 font-semibold">2 player-selected guaranteed substats</span>.
            </p>

            <!-- Price Breakdown -->
            <div class="rounded-lg bg-slate-950/80 border border-slate-800 p-2 flex flex-col gap-1 text-[11px]">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Required Materials:</div>
              <div class="flex items-center justify-between px-1.5 py-0.5 rounded ${(res.spiritShards || 0) >= scriptureCost.shards ? 'text-emerald-300' : 'text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('spiritShards', { size: 11 })} Spirit Shards:</span>
                <strong>${scriptureCost.shards.toLocaleString()} (${(res.spiritShards || 0).toLocaleString()})</strong>
              </div>
              <div class="flex items-center justify-between px-1.5 py-0.5 rounded ${(res.essencesOfTheGods || 0) >= scriptureCost.gods ? 'text-emerald-300' : 'text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('godsEssence', { size: 11 })} Essences of Gods:</span>
                <strong>${scriptureCost.gods} (${res.essencesOfTheGods || 0})</strong>
              </div>
              <div class="flex items-center justify-between px-1.5 py-0.5 rounded ${(res.soulEssence || 0) >= scriptureCost.soul ? 'text-emerald-300' : 'text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('astralEssence', { size: 11 })} Soul Essence:</span>
                <strong>${scriptureCost.soul} (${res.soulEssence || 0})</strong>
              </div>
            </div>
          </div>

          <button id="btn-buy-dwarven-scripture" 
                  class="min-h-[42px] w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50 ${isScriptureCapped ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed' : canAffordScripture ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}"
                  ${(!canAffordScripture || isScriptureCapped) ? 'disabled' : ''}>
            ${isScriptureCapped ? 'Weekly Limit Reached (3/3)' : canAffordScripture ? 'Forge Divine Scripture (1x)' : 'Insufficient Reagents'}
          </button>
        </div>

        <!-- Card 2: Relic Reshaper -->
        <div class="rounded-xl border border-cyan-500/30 bg-slate-900/85 p-3.5 flex flex-col justify-between gap-3 shadow-md hover:border-cyan-500/50 transition-all">
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="item-icon-frame flex items-center justify-center p-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 shrink-0">
                  ${createAnimatedRelicHtml('hephaestus', 'anvil', { extraClasses: 'loot-sprite-icon' })}
                </div>
                <div>
                  <h4 class="text-xs font-black text-white">Relic Reshaper</h4>
                  <p class="text-[10px] text-cyan-400 font-semibold">Substat Reforging Stone</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isReshaperCapped ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'}">
                ${reshaperPurchased} / ${reshaperLimit} This Week
              </span>
            </div>

            <p class="text-[11px] text-slate-300 leading-relaxed">
              Celestial alchemical stone consumed in the <strong>Character Hub</strong> to reroll all non-locked substats on any relic to optimize power and stat rolls.
            </p>

            <!-- Price Breakdown -->
            <div class="rounded-lg bg-slate-950/80 border border-slate-800 p-2 flex flex-col gap-1 text-[11px]">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Required Materials:</div>
              <div class="flex items-center justify-between px-1.5 py-0.5 rounded ${(res.spiritShards || 0) >= reshaperCost.shards ? 'text-emerald-300' : 'text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('spiritShards', { size: 11 })} Spirit Shards:</span>
                <strong>${reshaperCost.shards.toLocaleString()} (${(res.spiritShards || 0).toLocaleString()})</strong>
              </div>
              <div class="flex items-center justify-between px-1.5 py-0.5 rounded ${(res.essencesOfTheGods || 0) >= reshaperCost.gods ? 'text-emerald-300' : 'text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('godsEssence', { size: 11 })} Essences of Gods:</span>
                <strong>${reshaperCost.gods} (${res.essencesOfTheGods || 0})</strong>
              </div>
              <div class="flex items-center justify-between px-1.5 py-0.5 rounded ${(res.soulEssence || 0) >= reshaperCost.soul ? 'text-emerald-300' : 'text-red-300'}">
                <span class="inline-flex items-center gap-1">${getGameIcon('astralEssence', { size: 11 })} Soul Essence:</span>
                <strong>${reshaperCost.soul} (${res.soulEssence || 0})</strong>
              </div>
            </div>
          </div>

          <button id="btn-buy-dwarven-reshaper" 
                  class="min-h-[42px] w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-lg disabled:opacity-50 ${isReshaperCapped ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed' : canAffordReshaper ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 text-slate-950 hover:brightness-110 shadow-cyan-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}"
                  ${(!canAffordReshaper || isReshaperCapped) ? 'disabled' : ''}>
            ${isReshaperCapped ? 'Weekly Limit Reached (12/12)' : canAffordReshaper ? 'Reforge Relic Reshaper (1x)' : 'Insufficient Reagents'}
          </button>
        </div>

      </div>
    </div>
  `;
}


export function bindDwarvenForgeEvents(container, callbacks = {}) {
  container.querySelector('#btn-buy-dwarven-scripture')?.addEventListener('click', () => {
    try {
      gameState.buyDivineScriptureFromDwarvenForge(1);
      try { audioManager.playSfx('evolution'); } catch {}
      if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
    } catch (err) {
      alert(err.message);
    }
  });

  container.querySelector('#btn-buy-dwarven-reshaper')?.addEventListener('click', () => {
    try {
      gameState.buyRelicReshaper(1);
      try { audioManager.playSfx('reward'); } catch {}
      if (callbacks && callbacks.onRefresh) callbacks.onRefresh();;
    } catch (err) {
      alert(err.message);
    }
  });
}

