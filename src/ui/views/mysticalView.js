/**
 * The Mystical Realm View
 * Dedicated Sanctum for:
 * 1) Sanctuary of the Gods (3-Wave Essence Dungeon farming with 2.5D Arena Viewport)
 * 2) Energy Reservoir Expansion (Scales with 500 hard cap)
 * 3) Grand Astral EXP Potions (Direct spirit leveling)
 * 4) Primordial God Blessings (1-hour timed active buffs with responsive touch feedback)
 * 5) Mobile-first proportional typography & Tailwind glassmorphism
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { ESSENCE_CHAMBERS, ESSENCE_DIFFICULTY_TIERS } from '../../data/essenceDungeonData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES } from '../../data/spiritsData.js';
import { arenaRenderer } from '../../render/arenaRenderer.js';

let selectedEssenceChamberId = 'olympian_nexus';
let selectedEssenceTierNum = 1;
let activeRealmSection = 'dungeon'; // 'dungeon' | 'energy' | 'potions' | 'blessings'

export function renderMysticalView(container) {
  const battle = gameState.state.activeDungeonBattle;

  // If in active essence dungeon battle, render the combat arena
  if (battle && battle.dungeonType === 'essence') {
    renderEssenceBattleArena(container, battle);
    return;
  }

  renderMysticalSanctumScreen(container);
}

function renderMysticalSanctumScreen(container) {
  const state = gameState.state;
  const res = state.resources;
  const partyPower = gameState.getTotalPartyPower();
  const chamber = ESSENCE_CHAMBERS.find(c => c.id === selectedEssenceChamberId) || ESSENCE_CHAMBERS[0];
  const tier = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === selectedEssenceTierNum) || ESSENCE_DIFFICULTY_TIERS[0];

  const canAffordDungeon = res.energy >= tier.energyCost;
  const currentMaxEnergy = res.maxEnergy || 60;
  const energyIsCapped = currentMaxEnergy >= 500;
  const tierIndex = Math.floor((currentMaxEnergy - 60) / 20);
  const nextEnergyCostEssence = Math.round(15 * Math.pow(1.18, tierIndex));
  const nextEnergyCostSoul = tierIndex >= 5 ? Math.round(2 + tierIndex * 0.5) : 0;
  const canAffordEnergy = !energyIsCapped && (res.essencesOfTheGods || 0) >= nextEnergyCostEssence && (res.soulEssence || 0) >= nextEnergyCostSoul;

  const activeBlessings = gameState.getActiveBlessings();
  const partySpirits = gameState.getPartySpirits();

  container.innerHTML = `
    <div class="mystical-realm-container flex flex-col gap-3 p-2 text-white">
      
      <!-- Top Realm Hero Banner: Clean Proportional Typography -->
      <div class="mystical-hero-banner relative overflow-hidden rounded-xl bg-gradient-to-b from-cyan-950/60 via-slate-900/90 to-slate-950 border border-cyan-500/30 p-3 shadow-lg backdrop-blur-md">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              ✨ SANCTUM OF THE DIVINE
            </div>

            <!-- Currency Badges -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-[11px]" title="Essences of the Gods">
                <span class="text-cyan-400 font-bold">💠 Gods:</span>
                <strong class="text-cyan-200 font-black">${(res.essencesOfTheGods || 0).toLocaleString()}</strong>
              </div>
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-purple-500/30 text-[11px]" title="Soul Essence">
                <span class="text-purple-400 font-bold">🔮 Soul:</span>
                <strong class="text-purple-200 font-black">${(res.soulEssence || 0).toLocaleString()}</strong>
              </div>
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-amber-500/30 text-[11px]" title="Energy Capacity">
                <span class="text-amber-400 font-bold">⚡</span>
                <strong class="text-amber-300 font-black">${res.energy}/${currentMaxEnergy}</strong>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <span>🌌</span> The Mystical Realm
            </h2>
            <p class="text-[11px] text-slate-400 leading-snug mt-0.5">
              Channel Essences of the Gods, expand Energy Vault, brew EXP Elixirs, and invoke divine blessings.
            </p>
          </div>
        </div>
      </div>

      <!-- Realm Navigation Section Tabs: 4-Column Balanced Dock -->
      <div class="grid grid-cols-4 gap-1.5">
        <button class="realm-tab-btn flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'dungeon' ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="dungeon">
          <span class="text-sm pointer-events-none">🏛️</span>
          <span class="truncate pointer-events-none">Sanctuary</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'energy' ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="energy">
          <span class="text-sm pointer-events-none">⚡</span>
          <span class="truncate pointer-events-none">Vault (${currentMaxEnergy})</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'potions' ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="potions">
          <span class="text-sm pointer-events-none">🧪</span>
          <span class="truncate pointer-events-none">EXP Pots</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'blessings' ? 'bg-purple-500/25 text-purple-200 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="blessings">
          <span class="text-sm pointer-events-none">✨</span>
          <span class="truncate pointer-events-none">Blessings</span>
        </button>
      </div>

      <!-- Active Section Content Container -->
      <div class="realm-section-content">
        ${activeRealmSection === 'dungeon' ? renderDungeonSectionHtml(chamber, tier, canAffordDungeon, partyPower) : ''}
        ${activeRealmSection === 'energy' ? renderEnergySectionHtml(currentMaxEnergy, energyIsCapped, nextEnergyCostEssence, nextEnergyCostSoul, canAffordEnergy) : ''}
        ${activeRealmSection === 'potions' ? renderPotionsSectionHtml(res, partySpirits) : ''}
        ${activeRealmSection === 'blessings' ? renderBlessingsSectionHtml(res, activeBlessings) : ''}
      </div>

    </div>
  `;

  // Bind realm tab switching with event delegation
  container.querySelectorAll('.realm-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-realm-tab]') || e.currentTarget;
      const tabVal = tabBtn.getAttribute('data-realm-tab');
      if (tabVal) {
        activeRealmSection = tabVal;
        renderMysticalView(container);
      }
    });
  });

  // Bind specific section listeners
  if (activeRealmSection === 'dungeon') {
    bindDungeonEvents(container);
  } else if (activeRealmSection === 'energy') {
    bindEnergyEvents(container);
  } else if (activeRealmSection === 'potions') {
    bindPotionEvents(container);
  } else if (activeRealmSection === 'blessings') {
    bindBlessingEvents(container);
  }
}

function renderDungeonSectionHtml(chamber, tier, canAfford, partyPower) {
  return `
    <div class="flex flex-col gap-3">
      
      <!-- Chamber Selection Cards -->
      <div class="grid grid-cols-2 gap-2">
        ${ESSENCE_CHAMBERS.map(c => {
          const isSelected = c.id === selectedEssenceChamberId;
          return `
            <button class="essence-chamber-card relative overflow-hidden rounded-xl p-2.5 flex items-center gap-2.5 text-left transition-all border cursor-pointer ${isSelected ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-slate-900/60 border-slate-800'}" 
                    data-chamber-id="${c.id}"
                    style="--ch-color: ${c.color};">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm" style="background: ${c.color}22; border: 1px solid ${c.color};">
                ${c.icon}
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-white truncate">${c.name}</div>
                <div class="text-[10px] font-semibold truncate" style="color: ${c.accentColor};">${c.domain}</div>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Selected Chamber Detail Stage -->
      <div class="rounded-xl border p-3.5 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/95 shadow-md" style="border-color: ${chamber.color}66;">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-md shrink-0" style="background: ${chamber.color}25; border: 1.5px solid ${chamber.color};">
            ${chamber.icon}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <h3 class="text-sm font-extrabold text-white">${chamber.name}</h3>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider" style="background: ${chamber.color}33; color: ${chamber.accentColor}; border: 1px solid ${chamber.color}66;">
                ${chamber.domain}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2">${chamber.desc}</p>
          </div>
        </div>

        <!-- Tier Selection Pills -->
        <div class="mb-3">
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sanctuary Difficulty:</div>
          <div class="grid grid-cols-4 gap-1.5">
            ${ESSENCE_DIFFICULTY_TIERS.map(t => {
              const isActive = t.tier === selectedEssenceTierNum;
              return `
                <button class="essence-tier-btn p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer min-h-[38px] ${isActive ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-950/60 border-slate-800'}" data-tier="${t.tier}">
                  <span class="text-[11px] font-extrabold text-white">Tier ${t.tier}</span>
                  <span class="text-[9px] font-bold text-amber-400 mt-0.5">⚡ ${t.energyCost}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Power & Launch Strip -->
        <div class="flex flex-col gap-2 pt-2.5 border-t border-slate-800">
          <div class="text-[11px] flex justify-between items-center text-slate-300">
            <span>Rec: <strong class="text-white">⚡ ${tier.recommendedPower.toLocaleString()}</strong></span>
            <span>Yield: <strong class="text-cyan-300">💠 ${tier.minGodEssences}–${tier.maxGodEssences}</strong></span>
          </div>

          <button id="btn-start-essence-trial" class="min-h-[42px] w-full py-2 px-4 rounded-xl font-extrabold text-xs text-slate-950 transition-all cursor-pointer shadow-md disabled:opacity-50" style="background: linear-gradient(135deg, ${chamber.color}, ${chamber.accentColor});" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? `⚔️ Challenge 3-Wave Trial (⚡ ${tier.energyCost})` : `⚠️ Need ⚡ ${tier.energyCost} Energy`}
          </button>
        </div>
      </div>

    </div>
  `;
}

function renderEnergySectionHtml(currentMax, isCapped, costEssence, costSoul, canAfford) {
  const percent = Math.min(100, Math.round(((currentMax - 60) / (500 - 60)) * 100));

  return `
    <div class="rounded-xl border border-amber-500/30 p-3.5 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950 shadow-md flex flex-col gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
          ⚡
        </div>
        <div>
          <h3 class="text-sm font-extrabold text-amber-300">Energy Reservoir Expansion</h3>
          <p class="text-[11px] text-slate-400">Permanently expand maximum Energy capacity up to 500 ⚡.</p>
        </div>
      </div>

      <!-- Energy Gauge Meter -->
      <div class="rounded-lg bg-slate-950/80 border border-slate-800 p-3 flex flex-col gap-1.5">
        <div class="flex justify-between text-[11px] font-bold">
          <span class="text-slate-400">Base: 60 ⚡</span>
          <span class="text-amber-300 font-extrabold">Current: ${currentMax} / 500 ⚡</span>
          <span class="text-slate-400">Cap: 500 ⚡</span>
        </div>
        <div class="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
          <div class="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 rounded-full transition-all duration-500" style="width: ${percent}%;"></div>
        </div>
        <div class="text-[10px] text-slate-400 text-center mt-0.5">
          ${isCapped ? '🌟 Maximum 500 ⚡ capacity reached!' : `${500 - currentMax} ⚡ remaining to max capacity.`}
        </div>
      </div>

      ${!isCapped ? `
        <div class="rounded-lg border border-amber-500/30 bg-slate-900/60 p-3 flex items-center justify-between gap-2">
          <div>
            <div class="text-xs font-bold text-white">
              Expand to <strong class="text-amber-300">${currentMax + 20} ⚡</strong> (+20)
            </div>
            <div class="text-[10px] text-slate-400">
              Cost: <span class="text-cyan-300 font-bold">${costEssence} 💠</span> ${costSoul > 0 ? `+ <span class="text-purple-300 font-bold">${costSoul} 🔮</span>` : ''}
            </div>
          </div>
          <button id="btn-upgrade-energy-cap" class="min-h-[38px] px-3.5 py-1.5 rounded-lg font-bold text-xs text-slate-950 transition-all cursor-pointer shadow disabled:opacity-50 bg-gradient-to-r from-amber-400 to-yellow-300" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? '⚡ Expand (+20)' : 'Insufficient'}
          </button>
        </div>
      ` : `
        <div class="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-center text-xs font-bold text-amber-300">
          🏆 Fully awakened at maximum 500 ⚡!
        </div>
      `}
    </div>
  `;
}

function renderPotionsSectionHtml(res, spirits) {
  const POTIONS = [
    { id: 'lesser_elixir', name: 'Lesser Astral Elixir', icon: '🧪', xp: 10000, shardCost: 50, essenceGodCost: 2, desc: 'Brewed elixir granting +10,000 Spirit XP.' },
    { id: 'grand_elixir', name: 'Grand Astral Elixir', icon: '⚗️', xp: 50000, shardCost: 200, essenceGodCost: 8, desc: 'Concentrated starlight granting +50,000 Spirit XP.' },
    { id: 'divine_ambrosia', name: 'Divine Ambrosia', icon: '🏺', xp: 250000, shardCost: 800, essenceGodCost: 25, soulCost: 2, desc: 'Nectar of the gods granting +250,000 Spirit XP.' }
  ];

  return `
    <div class="flex flex-col gap-2">
      <div class="text-[11px] text-slate-400">
        Feed concentrated astral potions to rapidly elevate spirit levels:
      </div>

      <div class="flex flex-col gap-2">
        ${POTIONS.map(pot => {
          const canBuy = res.spiritShards >= pot.shardCost && 
            (res.essencesOfTheGods || 0) >= pot.essenceGodCost &&
            (!pot.soulCost || (res.soulEssence || 0) >= pot.soulCost);

          return `
            <div class="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-3 flex items-center justify-between gap-2.5 shadow-sm">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                  ${pot.icon}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-white truncate">${pot.name}</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      +${pot.xp.toLocaleString()} XP
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    Cost: 💎 ${pot.shardCost} • <span class="text-cyan-300 font-bold">💠 ${pot.essenceGodCost}</span> ${pot.soulCost ? `• <span class="text-purple-300 font-bold">🔮 ${pot.soulCost}</span>` : ''}
                  </div>
                </div>
              </div>

              <button class="btn-use-potion min-h-[38px] px-3.5 py-1.5 rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer shadow disabled:opacity-50 ${canBuy ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700'}" 
                      data-potion-id="${pot.id}" 
                      ${canBuy ? '' : 'disabled'}>
                ${canBuy ? 'Feed Potion' : 'Need Mats'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderBlessingsSectionHtml(res, activeBlessings) {
  const BLESSINGS = [
    { id: 'ares_blessing', name: 'Blessing of Ares', icon: '⚔️', stat: 'ATK Power +25%', cost: 10, desc: '+25% all party damage for 1 hour.' },
    { id: 'athena_blessing', name: 'Blessing of Athena', icon: '🛡️', stat: 'Max HP +30%', cost: 10, desc: '+30% party maximum health for 1 hour.' },
    { id: 'zeus_blessing', name: 'Blessing of Zeus', icon: '⚡', stat: 'Crit Rate +20%', cost: 15, desc: '+20% Critical Hit Chance for 1 hour.' },
    { id: 'poseidon_blessing', name: 'Blessing of Poseidon', icon: '🌊', stat: 'Shard Yield +35%', cost: 15, desc: '+35% bonus Spirit Shards for 1 hour.' }
  ];

  return `
    <div class="flex flex-col gap-2">
      <div class="text-[11px] text-slate-400">
        Invoke 1-hour divine boons from the Greek Gods to supercharge party combat:
      </div>

      <div class="flex flex-col gap-2">
        ${BLESSINGS.map(b => {
          const active = activeBlessings.find(ab => ab.id === b.id);
          const canAfford = (res.essencesOfTheGods || 0) >= b.cost;
          const minsRemaining = active ? Math.ceil((active.expiresAt - Date.now()) / (60 * 1000)) : 0;

          return `
            <div class="rounded-xl border p-3 flex items-center justify-between gap-2.5 shadow-sm transition-all ${active ? 'bg-purple-950/30 border-purple-400/60' : 'bg-slate-900/80 border-slate-800'}">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl shrink-0">
                  ${b.icon}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-bold text-white truncate">${b.name}</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      ${b.stat}
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5 truncate">${b.desc}</div>
                </div>
              </div>

              <div class="shrink-0 flex items-center">
                ${active ? `
                  <div class="text-[11px] font-bold text-emerald-400 flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/50 border border-emerald-500/30">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ${minsRemaining}m left
                  </div>
                ` : `
                  <button class="btn-invoke-blessing min-h-[38px] px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow ${canAfford ? 'bg-gradient-to-r from-purple-400 to-pink-300 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}" 
                          data-blessing-id="${b.id}"
                          data-cost="${b.cost}"
                          data-name="${b.name}">
                    ${canAfford ? 'Invoke Boon' : `Need ${b.cost} 💠`}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function bindDungeonEvents(container) {
  container.querySelectorAll('.essence-chamber-card').forEach(card => {
    card.addEventListener('click', (e) => {
      selectedEssenceChamberId = e.currentTarget.getAttribute('data-chamber-id');
      renderMysticalView(container);
    });
  });

  container.querySelectorAll('.essence-tier-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedEssenceTierNum = parseInt(e.currentTarget.getAttribute('data-tier'), 10);
      renderMysticalView(container);
    });
  });

  container.querySelector('#btn-start-essence-trial')?.addEventListener('click', () => {
    try {
      gameState.startDungeonTrial('essence', selectedEssenceChamberId, selectedEssenceTierNum);
      renderMysticalView(container);
    } catch (err) {
      alert(err.message);
    }
  });
}

function bindEnergyEvents(container) {
  container.querySelector('#btn-upgrade-energy-cap')?.addEventListener('click', () => {
    try {
      gameState.upgradeEnergyCapacity();
      renderMysticalView(container);
    } catch (err) {
      alert(err.message);
    }
  });
}

function bindPotionEvents(container) {
  container.querySelectorAll('.btn-use-potion').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const potionId = e.currentTarget.getAttribute('data-potion-id');
      openPotionSpiritSelector(potionId, container);
    });
  });
}

function bindBlessingEvents(container) {
  container.querySelectorAll('.btn-invoke-blessing').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bBtn = e.target.closest('.btn-invoke-blessing') || e.currentTarget;
      const blessingId = bBtn.getAttribute('data-blessing-id');
      const cost = parseInt(bBtn.getAttribute('data-cost') || '10', 10);
      const name = bBtn.getAttribute('data-name') || 'Blessing';
      const userEssences = gameState.state.resources.essencesOfTheGods || 0;

      if (userEssences < cost) {
        alert(`⚠️ Insufficient Essences of the Gods!\nYou need ${cost} Essences to invoke ${name} (You have ${userEssences}).\n\nFarm Sanctuary Trials or dismantle 3★+ Relics in your Vault to earn more!`);
        return;
      }

      try {
        gameState.applyTemporaryBlessing(blessingId);
        renderMysticalView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function openPotionSpiritSelector(potionId, container) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const partySpirits = gameState.getPartySpirits();

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-white">
        <h3 class="text-sm font-extrabold text-emerald-300 flex items-center gap-1.5">
          🧪 Feed Astral Elixir
        </h3>
        <p class="text-[11px] text-slate-400 mt-0.5 mb-2.5">Choose an active party member to receive the XP surge:</p>
        
        <div class="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
          ${partySpirits.map(s => `
            <div class="select-spirit-potion-row flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer" data-spirit-id="${s.id}">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0">${createSpiritPlaceholderBox(s)}</div>
                <div>
                  <div class="font-extrabold text-xs text-white">${s.customName}</div>
                  <div class="text-[10px] text-slate-400">Lv. ${s.level} • ⚡ ${s.power} PWR</div>
                </div>
              </div>
              <button class="btn-feed-confirm px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all cursor-pointer min-h-[34px]">
                Feed
              </button>
            </div>
          `).join('')}
        </div>

        <button id="btn-cancel-potion-modal" class="min-h-[40px] w-full mt-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('.select-spirit-potion-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-spirit-id');
      try {
        gameState.buyExpPotion(potionId, spiritId);
        modalRoot.innerHTML = '';
        renderMysticalView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.getElementById('btn-cancel-potion-modal')?.addEventListener('click', () => {
    modalRoot.innerHTML = '';
  });
}

function renderEssenceBattleArena(container, battle) {
  const chamber = ESSENCE_CHAMBERS.find(c => c.id === battle.chamberId) || ESSENCE_CHAMBERS[0];
  const tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === battle.tier) || ESSENCE_DIFFICULTY_TIERS[0];
  const party = gameState.getPartySpirits();
  const partyPower = gameState.getTotalPartyPower();
  const swarm = battle.currentSwarm || [];
  const livingEnemies = swarm.filter(e => !e.isDefeated && e.hp > 0);

  container.innerHTML = `
    <div class="trial-battle-container flex flex-col gap-2.5 min-h-full text-white">
      
      <!-- Top Combat HUD Header -->
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 shadow-md backdrop-blur-md" style="border-color: ${chamber.color}66;">
        <div class="flex items-center gap-2">
          <span class="text-xl">${chamber.icon}</span>
          <div>
            <div class="text-[9px] font-black uppercase tracking-wider" style="color: ${chamber.accentColor};">${chamber.name}</div>
            <div class="text-xs font-black text-white">${tierObj.name} • Wave ${battle.currentWave}/3</div>
          </div>
        </div>

        <button id="btn-leave-essence-battle" class="min-h-[36px] px-3 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-[11px] font-bold transition-all cursor-pointer" title="Forfeit Battle">
          ✕ Forfeit
        </button>
      </div>

      <!-- Dynamic 2.5D Isometric Battlefield Area -->
      <div class="isometric-battlefield pantheon-battlefield relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-950 shadow-xl min-h-[280px] flex items-center justify-between p-3" style="border-color: ${chamber.color}44;">
        
        <!-- 2.5D Isometric Canvas Viewport Layer -->
        <div id="arena-viewport-25d" class="arena-viewport-25d absolute inset-0 pointer-events-none z-0 rounded-xl overflow-hidden"></div>

        <!-- Left Side: Staggered Allied Spirit Formation -->
        <div class="allied-formation-column relative z-10 flex flex-col gap-1.5">
          <div class="text-[9px] font-black uppercase tracking-widest text-cyan-400">Allied Lineup</div>
          <div class="flex flex-col gap-1.5">
            ${party.map((spirit, idx) => {
              const maxHp = spirit.maxHp || 100;
              const curHp = typeof spirit.currentHp === 'number' ? Math.max(0, spirit.currentHp) : maxHp;
              const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
              const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
              const isUltReady = mpPct >= 100;
              const isFallen = spirit.isFallen || curHp <= 0;

              return `
                <div class="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/80 border border-slate-800 ${isUltReady ? 'border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]' : ''} ${isFallen ? 'opacity-40' : ''}">
                  <div class="w-8 h-8 rounded-md overflow-hidden shrink-0">${createSpiritPlaceholderBox(spirit)}</div>
                  <div class="flex flex-col gap-0.5 w-16">
                    <div class="text-[9px] font-bold truncate text-white">${spirit.customName}</div>
                    <div class="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-400 rounded-full" style="width: ${hpPct}%;"></div>
                    </div>
                    <div class="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden">
                      <div class="h-full bg-cyan-400 rounded-full" style="width: ${mpPct}%;"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Center Combat Clash Point -->
        <div class="relative z-10 text-xl animate-pulse">
          ⚔️
        </div>

        <!-- Right Side: Wave Enemies -->
        <div class="enemy-formation-column relative z-10 flex flex-col gap-1.5 items-end">
          <div class="text-[9px] font-black uppercase tracking-widest text-red-400">
            ${battle.currentWave === 3 ? '👑 Boss Avatar' : `Guardians (${livingEnemies.length}/${swarm.length})`}
          </div>
          <div class="flex flex-col gap-1.5">
            ${swarm.map(em => {
              const isDead = em.isDefeated || em.hp <= 0;
              const maxHp = em.maxHp || 100;
              const curHp = typeof em.hp === 'number' ? Math.max(0, em.hp) : maxHp;
              const emHpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

              return `
                <div class="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/80 border border-slate-800 ${em.isBoss ? 'border-amber-500' : ''} ${isDead ? 'opacity-30' : ''}">
                  <div class="flex flex-col gap-0.5 w-16 items-end">
                    <div class="text-[9px] font-bold truncate text-white" style="color: ${chamber.color};">${em.name}</div>
                    <div class="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div class="h-full bg-red-400 rounded-full" style="width: ${emHpPct}%;"></div>
                    </div>
                  </div>
                  <div class="w-8 h-8 rounded-md overflow-hidden shrink-0">${createEnemyPlaceholderBox(em)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Victory / Defeat Banners -->
      ${battle.status === 'victory' && battle.loot ? `
        <div class="rounded-xl border border-amber-400/60 bg-slate-900 p-3 shadow-xl flex flex-col items-center text-center gap-1.5">
          <div class="text-xs font-black text-amber-300">🏆 SANCTUM TRIAL CLEARED!</div>
          <div class="text-[11px] text-slate-300">
            Earned: <strong class="text-cyan-300">+${battle.loot.godEssencesGained} Essences</strong>, 
            <strong class="text-emerald-300">+${battle.loot.shardsGained} Shards</strong>
          </div>
          <button id="btn-collect-essence-loot" class="min-h-[38px] w-full py-1.5 rounded-lg font-bold text-xs text-slate-950 cursor-pointer shadow bg-gradient-to-r from-cyan-400 to-emerald-300">
            Collect Spoils to Sanctum
          </button>
        </div>
      ` : ''}

      ${battle.status === 'defeat' ? `
        <div class="rounded-xl border border-red-500/40 bg-slate-900 p-3 flex flex-col items-center text-center gap-1.5">
          <div class="text-xs font-black text-red-400">☠️ TRIAL FAILED</div>
          <button id="btn-leave-essence-battle" class="min-h-[38px] w-full py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer">
            Return to Sanctum
          </button>
        </div>
      ` : ''}

      <!-- Attack Strike Footer -->
      ${battle.status === 'active' ? `
        <div class="combat-action-footer">
          <button id="btn-essence-strike" class="btn-main-attack min-h-[44px] w-full py-2.5 rounded-xl font-extrabold text-xs text-slate-950 transition-all cursor-pointer shadow-lg bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 flex flex-col items-center justify-center">
            <span>⚔️ Divine Strike (Party Attack • Charges +10 MP)</span>
            <span class="text-[9px] font-bold opacity-80">Wave ${battle.currentWave}/3 • ⚡ ${partyPower.toLocaleString()} PWR</span>
          </button>
        </div>
      ` : ''}

    </div>
  `;

  // Initialize 2.5D Isometric Arena Viewport Engine
  const viewportEl = container.querySelector('#arena-viewport-25d');
  if (viewportEl) {
    arenaRenderer.init(viewportEl, { mode: 'sanctuary', element: 'WATER', chamberId: battle.chamberId });
  }

  // Event Listeners
  container.querySelector('#btn-essence-strike')?.addEventListener('click', () => {
    gameState.manualDungeonStrike();
    arenaRenderer.spawnDamagePopup(null, null, Math.round(partyPower * 0.45));
    renderMysticalView(container);
  });

  container.querySelector('#btn-leave-essence-battle')?.addEventListener('click', () => {
    gameState.exitDungeonBattle();
    renderMysticalView(container);
  });

  container.querySelector('#btn-collect-essence-loot')?.addEventListener('click', () => {
    gameState.exitDungeonBattle();
    renderMysticalView(container);
  });
}
