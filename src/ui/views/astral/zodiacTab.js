import { gameState } from '../../../state/gameState.js';
import { audioManager } from '../../../audio/audioManager.js';
import { CONSTELLATIONS_CONFIG } from '../../../data/astralRealmData.js';
import { createAnimatedRelicHtml } from '../../../render/spriteAnimator.js';
import { getGameIcon } from '../../icons/gameIcons.js';

export function renderConstellationsSectionHtml(res, selectedConstellationId = "draco", isCosmicBoonsOpen = false) {
  const constellations = gameState.state.constellations || { draco: 0, phoenix: 0, pegasus: 0 };
  const bonuses = gameState.getConstellationBonuses();

  const activeBonusLabels = [];
  if (bonuses.partyAtkPercent) activeBonusLabels.push(`+${bonuses.partyAtkPercent}% ATK Power`);
  if (bonuses.critRate) activeBonusLabels.push(`+${bonuses.critRate}% Crit Rate`);
  if (bonuses.critDamage) activeBonusLabels.push(`+${bonuses.critDamage}% Crit DMG`);
  if (bonuses.ultAmp) activeBonusLabels.push(`+${bonuses.ultAmp}% Ult Amp`);
  if (bonuses.partyHpPercent) activeBonusLabels.push(`+${bonuses.partyHpPercent}% Max HP`);
  if (bonuses.initialShieldPercent) activeBonusLabels.push(`+${bonuses.initialShieldPercent}% Start Shield`);
  if (bonuses.healingReceivedPercent) activeBonusLabels.push(`+${bonuses.healingReceivedPercent}% Heal & Regen`);
  if (bonuses.damageMitigationPercent) activeBonusLabels.push(`+${bonuses.damageMitigationPercent}% Mitigation`);
  if (bonuses.energyRegenBonus) activeBonusLabels.push(`+${bonuses.energyRegenBonus}% Energy Regen`);
  if (bonuses.maxEnergyBonus) activeBonusLabels.push(`+${bonuses.maxEnergyBonus} Max Energy`);
  if (bonuses.bonusAstralDropChance) activeBonusLabels.push(`+${bonuses.bonusAstralDropChance}% Boss Astral Drops`);
  if (bonuses.afkXpBonus) activeBonusLabels.push(`+${bonuses.afkXpBonus}% AFK XP`);
  if (bonuses.bonusGodEssencesPercent) activeBonusLabels.push(`+${bonuses.bonusGodEssencesPercent}% Trial Gods`);
  if (bonuses.bossDmgPercent) activeBonusLabels.push(`+${bonuses.bossDmgPercent}% Boss DMG`);
  if (bonuses.executionerDmgPercent) activeBonusLabels.push(`+${bonuses.executionerDmgPercent}% Executioner`);
  if (bonuses.tankThreatPercent) activeBonusLabels.push(`+${bonuses.tankThreatPercent}% Tank Aggro`);
  if (bonuses.frontlineMitigationPercent) activeBonusLabels.push(`+${bonuses.frontlineMitigationPercent}% Frontline Def`);
  if (bonuses.armorPiercePercent) activeBonusLabels.push(`+${bonuses.armorPiercePercent}% Armor Pierce`);
  if (bonuses.dotAmpPercent) activeBonusLabels.push(`+${bonuses.dotAmpPercent}% DoT Amp`);
  if (bonuses.lifeStealPercent) activeBonusLabels.push(`+${bonuses.lifeStealPercent}% Life Steal`);
  if (bonuses.combatMpRegenPercent) activeBonusLabels.push(`+${bonuses.combatMpRegenPercent}% MP Regen`);
  if (bonuses.startingMpBonus) activeBonusLabels.push(`+${bonuses.startingMpBonus} Start MP`);
  if (bonuses.relicCooldownReductionPercent) activeBonusLabels.push(`-${bonuses.relicCooldownReductionPercent}% Relic CD`);
  if (bonuses.atkSpdBonusPercent) activeBonusLabels.push(`+${bonuses.atkSpdBonusPercent}% Atk Speed`);
  if (bonuses.doubleStrikeChance) activeBonusLabels.push(`+${bonuses.doubleStrikeChance}% Double Strike`);

  const constList = Object.values(CONSTELLATIONS_CONFIG);
  const activeConst = CONSTELLATIONS_CONFIG[selectedConstellationId] || constList[0];
  const curLevel = constellations[activeConst.id] || 0;
  const nextNode = curLevel + 1;
  const completionPct = Math.round((curLevel / 5) * 100);

  return `
    <div class="flex flex-col gap-3">
      
      <!-- Top Overview & Balance -->
      <div class="rounded-xl border border-rose-500/30 p-3 bg-gradient-to-b from-rose-950/20 via-slate-900/90 to-slate-950 shadow-md flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          ${getGameIcon('realm', { size: 24, color: '#c084fc' })}
          <div>
            <h3 class="text-xs sm:text-sm font-extrabold text-white">Celestial Constellations (Zodiac Star-Chart)</h3>
            <p class="text-[10px] sm:text-[11px] text-slate-400">Select a constellation below to view its celestial star-chart and awaken permanent party passives.</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-400/40 text-purple-300 inline-flex items-center gap-1">
            ${getGameIcon('astralEssence', { size: 12 })} ${(res.soulEssence || 0).toLocaleString()} Astral
          </span>
        </div>
      </div>

      <!-- Single-Focus Constellation Selector: Horizontal Chip Bar -->
      <div class="constellation-chips-scroll">
        ${constList.map(c => {
          const lvl = constellations[c.id] || 0;
          const isSelected = c.id === activeConst.id;
          const isMaxed = lvl >= 5;
          return `
            <button class="constellation-chip-btn ${isSelected ? 'active' : ''}" 
                    data-constellation-id="${c.id}" 
                    style="--const-color: ${c.themeColor}; --const-glow: ${c.themeColor}55;">
              <span class="text-base pointer-events-none inline-flex items-center justify-center">${getGameIcon('star', { size: 14, color: c.themeColor })}</span>
              <span class="pointer-events-none">${c.name}</span>
              <span class="constellation-star-progress-pill pointer-events-none" style="${isMaxed ? 'background: #f1c40f33; color: #f1c40f; border-color: #f1c40f55;' : (lvl > 0 ? `background: ${c.themeColor}33; color: ${c.accentColor};` : 'color: #94a3b8;')}">
                ${isMaxed ? 'MAX' : `${lvl}/5`}
              </span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Star-Chart Viewer (The Single-Focus Showcase Arena) -->
      <div class="constellation-showcase-stage" style="border-left: 4px solid ${activeConst.themeColor};">
        
        <!-- Showcase Header -->
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-800 flex-wrap">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0" 
                 style="background: ${activeConst.themeColor}22; border: 1.5px solid ${activeConst.themeColor}66;">
              ${getGameIcon('realm', { size: 26, color: activeConst.themeColor })}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm sm:text-base font-black text-white">${activeConst.name}</h4>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background: ${activeConst.themeColor}25; color: ${activeConst.accentColor}; border: 1px solid ${activeConst.themeColor}40;">
                  ${activeConst.title}
                </span>
              </div>
              <p class="text-[11px] text-slate-300 leading-snug mt-0.5">${activeConst.description}</p>
            </div>
          </div>

          <div class="flex flex-col items-end shrink-0">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-black" style="color: ${activeConst.accentColor};">
                ${curLevel}/5 Stars Illuminated
              </span>
              ${curLevel >= 5 ? `<span class="text-xs">${getGameIcon('sparkle', { size: 12, color: '#facc15' })}</span>` : ''}
            </div>
            <div class="w-24 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-1">
              <div class="h-full rounded-full transition-all duration-300" style="width: ${completionPct}%; background-color: ${activeConst.themeColor};"></div>
            </div>
          </div>
        </div>

        <!-- 5-Node Stellar Pathway Grid -->
        <div class="constellation-star-grid">
          ${activeConst.stars.map(star => {
            const isUnlocked = star.node <= curLevel;
            const isAvailable = star.node === nextNode;
            const canAfford = (res.soulEssence || 0) >= star.cost;

            let cardStateClass = 'locked';
            let statusMarkup = `<span class="text-[9px] text-slate-500 font-bold inline-flex items-center gap-1">${getGameIcon('lock', { size: 10 })} Requires Star ${star.node - 1}</span>`;

            if (isUnlocked) {
              cardStateClass = 'illuminated';
              statusMarkup = `<span class="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">${getGameIcon('star', { size: 10, color: '#34d399' })} Illuminated</span>`;
            } else if (isAvailable) {
              cardStateClass = 'available';
              statusMarkup = `
                <button class="btn-unlock-star w-full py-1.5 px-2 rounded-lg font-black text-[10px] transition-all cursor-pointer shadow-md flex items-center justify-center gap-1 ${canAfford ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 hover:brightness-110 shadow-amber-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}" 
                        data-constellation-id="${activeConst.id}" 
                        data-node="${star.node}" 
                        ${canAfford ? '' : 'disabled'}>
                  <span>${canAfford ? `Unlock (${star.cost} Astral)` : `Need ${star.cost} Astral`}</span>
                </button>
              `;
            }

            return `
              <div class="constellation-node-card ${cardStateClass}">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center justify-between text-[11px] gap-1">
                    <span class="font-extrabold text-white truncate">${star.node}. ${star.name}</span>
                    <span class="text-[10px] text-purple-300 font-bold px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-500/30 shrink-0 inline-flex items-center gap-0.5">${star.cost} ${getGameIcon('astralEssence', { size: 9 })}</span>
                  </div>
                  <div class="text-[10px] text-cyan-300 font-semibold leading-snug">${star.desc}</div>
                </div>
                <div class="pt-1 mt-auto">
                  ${statusMarkup}
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>

      <!-- Collapsible Global Cosmic Boons Drawer -->
      <div class="cosmic-boons-drawer">
        <button id="btn-toggle-cosmic-boons" class="cosmic-boons-toggle-btn">
          <div class="flex items-center gap-2">
            ${getGameIcon('sparkle', { size: 13, color: '#facc15' })}
            <span>Illuminated Cosmic Boons (${activeBonusLabels.length} Active Passives)</span>
          </div>
          <span class="text-xs text-slate-400 font-black">${isCosmicBoonsOpen ? '▲ Hide' : '▼ View All'}</span>
        </button>

        ${isCosmicBoonsOpen ? `
          <div class="p-3 pt-0 border-t border-slate-800/60">
            <div class="flex flex-wrap gap-1.5 pt-2">
              ${activeBonusLabels.length > 0 ? activeBonusLabels.map(b => `
                <span class="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shadow-sm flex items-center gap-1">
                  ${getGameIcon('sparkle', { size: 9, color: '#22d3ee' })} ${b}
                </span>
              `).join('') : '<span class="text-[10px] text-slate-500 italic p-1">No celestial stars illuminated yet. Spend Astral Essences above to awaken your party!</span>'}
            </div>
          </div>
        ` : ''}
      </div>

    </div>
  `;
}

export function bindConstellationEvents(container, stateObj = {}, callbacks = {}) {
  // 1. Constellation chip selection
  container.querySelectorAll('.constellation-chip-btn').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const cId = e.currentTarget.getAttribute('data-constellation-id');
      if (cId) { if (callbacks.onSelectConstellation) callbacks.onSelectConstellation(cId);
        
        if (callbacks.onRefresh) callbacks.onRefresh();
      }
    });
  });

  // 2. Cosmic Boons drawer toggle
  const btnToggleBoons = container.querySelector('#btn-toggle-cosmic-boons');
  if (btnToggleBoons) {
    btnToggleBoons.addEventListener('click', () => {
      if (callbacks.onToggleBoons) callbacks.onToggleBoons();
      if (callbacks.onRefresh) callbacks.onRefresh();
    });
  }

  // 3. Star Unlock button
  container.querySelectorAll('.btn-unlock-star').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cId = e.currentTarget.getAttribute('data-constellation-id');
      try {
        gameState.unlockConstellationStar(cId);
        try { audioManager.playSfx('evolution'); } catch {}
        if (callbacks.onRefresh) callbacks.onRefresh();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

