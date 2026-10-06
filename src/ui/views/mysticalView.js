/**
 * The Mystical Realm View
 * Dedicated Sanctum for:
 * 1) Sanctuary of the Gods (3-Wave Essence Dungeon farming with 2.5D Pixi.js/Canvas Arena)
 * 2) Energy Reservoir Expansion (Scales with 500 hard cap)
 * 3) Grand Astral EXP Potions (Direct spirit leveling)
 * 4) Primordial God Blessings (1-hour timed active buffs)
 * 5) Tailwind CSS glassmorphic aesthetic & glowing astral motifs
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
    <div class="mystical-realm-container flex flex-col gap-4 p-2 sm:p-4 text-white">
      
      <!-- Top Realm Hero Banner with Tailwind Glassmorphism -->
      <div class="mystical-hero-banner relative overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-950/50 via-slate-900/90 to-slate-950 border border-cyan-500/30 p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="mystical-header-info">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              ✨ SANCTUM OF THE DIVINE
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-300 to-amber-200 mt-1">
              🌌 The Mystical Realm
            </h2>
            <p class="text-xs text-slate-400 max-w-lg mt-0.5">
              Channel Essences of the Gods, expand the primordial Energy Vault, brew Grand Astral Elixirs, and invoke divine blessings.
            </p>
          </div>

          <!-- Currency Strip with glowing capsules -->
          <div class="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 shadow-inner" title="Essences of the Gods">
              <span class="text-xs text-cyan-400 font-bold">💠 Gods:</span>
              <strong class="text-xs text-cyan-300 font-black">${(res.essencesOfTheGods || 0).toLocaleString()}</strong>
            </div>
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-purple-500/30 shadow-inner" title="Soul Essence">
              <span class="text-xs text-purple-400 font-bold">🔮 Soul:</span>
              <strong class="text-xs text-purple-300 font-black">${(res.soulEssence || 0).toLocaleString()}</strong>
            </div>
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/30 shadow-inner" title="Energy Capacity">
              <span class="text-xs text-amber-400 font-bold">⚡ Energy:</span>
              <strong class="text-xs text-amber-300 font-black">${res.energy} / ${currentMaxEnergy}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Realm Navigation Section Tabs -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button class="realm-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${activeRealmSection === 'dungeon' ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'}" data-realm-tab="dungeon">
          <span>🏛️</span> Sanctuary Trials
        </button>
        <button class="realm-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${activeRealmSection === 'energy' ? 'bg-amber-500/20 text-amber-200 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'}" data-realm-tab="energy">
          <span>⚡</span> Vault (${currentMaxEnergy}/500)
        </button>
        <button class="realm-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${activeRealmSection === 'potions' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'}" data-realm-tab="potions">
          <span>🧪</span> Grand EXP Pots
        </button>
        <button class="realm-tab-btn flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 border cursor-pointer ${activeRealmSection === 'blessings' ? 'bg-purple-500/20 text-purple-200 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'}" data-realm-tab="blessings">
          <span>✨</span> Timed Blessings
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

  // Bind realm tab switching
  container.querySelectorAll('.realm-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeRealmSection = e.currentTarget.getAttribute('data-realm-tab');
      renderMysticalView(container);
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
    <div class="flex flex-col gap-4">
      
      <!-- Chamber Selection Carousel Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        ${ESSENCE_CHAMBERS.map(c => {
          const isSelected = c.id === selectedEssenceChamberId;
          return `
            <button class="essence-chamber-card relative overflow-hidden rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 border cursor-pointer ${isSelected ? 'bg-slate-800/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}" 
                    data-chamber-id="${c.id}"
                    style="--ch-color: ${c.color};">
              <div class="w-11 h-11 rounded-full flex items-center justify-center text-2xl mb-1.5 shadow-md" style="background: ${c.color}22; border: 1.5px solid ${c.color};">
                ${c.icon}
              </div>
              <span class="text-xs font-black text-white leading-tight">${c.name}</span>
              <span class="text-[10px] font-bold text-slate-400 mt-0.5" style="color: ${c.accentColor};">${c.domain}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Active Selected Chamber Detail Stage -->
      <div class="rounded-2xl border p-4 sm:p-5 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/95 shadow-xl" style="border-color: ${chamber.color}66;">
        <div class="flex items-start gap-3.5 mb-4">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0" style="background: ${chamber.color}25; border: 2px solid ${chamber.color};">
            ${chamber.icon}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-lg font-black text-white">${chamber.name}</h3>
              <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider" style="background: ${chamber.color}33; color: ${chamber.accentColor}; border: 1px solid ${chamber.color}66;">
                ${chamber.domain}
              </span>
            </div>
            <div class="text-xs font-bold text-slate-300 mt-0.5">${chamber.title}</div>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">${chamber.desc}</p>
          </div>
        </div>

        <!-- Tier Selection Pills -->
        <div class="mb-4">
          <div class="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Sanctuary Heat / Difficulty:</div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${ESSENCE_DIFFICULTY_TIERS.map(t => {
              const isActive = t.tier === selectedEssenceTierNum;
              return `
                <button class="essence-tier-btn p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${isActive ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]' : 'bg-slate-950/60 border-slate-800'}" data-tier="${t.tier}">
                  <span class="text-xs font-black text-white">Tier ${t.tier}</span>
                  <span class="text-[10px] text-slate-400">${t.subtitle}</span>
                  <span class="text-xs font-bold text-amber-400 mt-1">⚡ ${t.energyCost} Energy</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Power Assessment & Launch Strip -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div class="text-xs flex flex-col gap-0.5">
            <span class="text-slate-400">Recommended Power: <strong class="text-white">⚡ ${tier.recommendedPower.toLocaleString()}</strong></span>
            <span class="text-slate-400">Your Party Power: <strong class="text-cyan-300">⚡ ${partyPower.toLocaleString()}</strong></span>
            <span class="text-cyan-400 font-bold">Yield: 💠 ${tier.minGodEssences}–${tier.maxGodEssences} Essences ${tier.soulEssenceReward > 0 ? `• 🔮 +${tier.soulEssenceReward} Soul` : ''} • 💎 +${tier.shardsReward}</span>
          </div>

          <button id="btn-start-essence-trial" class="min-h-[46px] px-6 py-2.5 rounded-xl font-black text-sm text-slate-950 transition-all duration-200 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" style="background: linear-gradient(135deg, ${chamber.color}, ${chamber.accentColor});" ${canAfford ? '' : 'disabled'}>
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
    <div class="rounded-2xl border border-amber-500/30 p-5 bg-gradient-to-b from-amber-950/20 via-slate-900/90 to-slate-950 shadow-xl flex flex-col gap-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-inner">
          ⚡
        </div>
        <div>
          <h3 class="text-lg font-black text-amber-300">Energy Reservoir Expansion</h3>
          <p class="text-xs text-slate-400">Permanently expand your maximum Energy capacity up to the hard cap of 500 ⚡.</p>
        </div>
      </div>

      <!-- Energy Gauge Meter -->
      <div class="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col gap-2">
        <div class="flex justify-between text-xs font-bold">
          <span class="text-slate-400">Base: 60 ⚡</span>
          <span class="text-amber-400 text-sm font-black">Current: ${currentMax} / 500 ⚡</span>
          <span class="text-slate-400">Cap: 500 ⚡</span>
        </div>
        <div class="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
          <div class="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style="width: ${percent}%;"></div>
        </div>
        <div class="text-[11px] text-slate-400 text-center">
          ${isCapped ? '🌟 Maximum Energy Reservoir Limit Reached (500/500)!' : `${500 - currentMax} ⚡ remaining to reach primordial maximum.`}
        </div>
      </div>

      ${!isCapped ? `
        <div class="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div class="text-sm font-black text-white">
              Expand Capacity to <strong class="text-amber-300">${currentMax + 20} ⚡</strong> (+20 Max Energy)
            </div>
            <div class="text-xs text-slate-400 mt-0.5">
              Cost: <span class="text-cyan-300 font-bold">${costEssence} Essences of the Gods</span> ${costSoul > 0 ? `+ <span class="text-purple-300 font-bold">${costSoul} Soul Essence</span>` : ''}
            </div>
          </div>
          <button id="btn-upgrade-energy-cap" class="min-h-[44px] px-5 py-2.5 rounded-xl font-black text-xs text-slate-950 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200" ${canAfford ? '' : 'disabled'}>
            ${canAfford ? '⚡ Expand Reservoir (+20 Cap)' : '⚠️ Insufficient Essences'}
          </button>
        </div>
      ` : `
        <div class="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-center text-xs font-bold text-amber-300">
          🏆 Energy Reservoir is fully awakened at maximum 500 ⚡ capacity!
        </div>
      `}
    </div>
  `;
}

function renderPotionsSectionHtml(res, spirits) {
  const POTIONS = [
    { id: 'lesser_elixir', name: 'Lesser Astral Elixir', icon: '🧪', xp: 10000, shardCost: 50, essenceGodCost: 2, desc: 'Brewed elixir granting +10,000 Spirit XP.' },
    { id: 'grand_elixir', name: 'Grand Astral Elixir', icon: '⚗️', xp: 50000, shardCost: 200, essenceGodCost: 8, desc: 'Potent concentrated starlight granting +50,000 Spirit XP.' },
    { id: 'divine_ambrosia', name: 'Divine Ambrosia', icon: '🏺', xp: 250000, shardCost: 800, essenceGodCost: 25, soulCost: 2, desc: 'Nectar of the gods granting a colossal +250,000 Spirit XP.' }
  ];

  return `
    <div class="flex flex-col gap-3">
      <div class="text-xs text-slate-400">
        Feed concentrated astral potions to rapidly elevate spirit levels and unlock evolution gates:
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${POTIONS.map(pot => {
          const canBuy = res.spiritShards >= pot.shardCost && 
            (res.essencesOfTheGods || 0) >= pot.essenceGodCost &&
            (!pot.soulCost || (res.soulEssence || 0) >= pot.soulCost);

          return `
            <div class="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-emerald-400/50 transition-all">
              <div>
                <div class="flex items-center gap-2.5 mb-2">
                  <span class="text-3xl">${pot.icon}</span>
                  <div>
                    <h4 class="text-sm font-black text-white">${pot.name}</h4>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      +${pot.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">${pot.desc}</p>
              </div>

              <div class="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <div class="text-[11px] text-slate-300">
                  Cost: 💎 ${pot.shardCost} • <span class="text-cyan-300 font-bold">💠 ${pot.essenceGodCost}</span> ${pot.soulCost ? `• <span class="text-purple-300 font-bold">🔮 ${pot.soulCost}</span>` : ''}
                </div>
                <button class="btn-use-potion min-h-[44px] w-full py-2 rounded-xl font-black text-xs text-slate-950 transition-all cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-400 to-teal-300" 
                        data-potion-id="${pot.id}" 
                        ${canBuy ? '' : 'disabled'}>
                  ${canBuy ? 'Feed Potion to Spirit' : 'Insufficient Materials'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderBlessingsSectionHtml(res, activeBlessings) {
  const BLESSINGS = [
    { id: 'ares_blessing', name: 'Blessing of Ares', icon: '⚔️', stat: 'ATK Power +25%', cost: 10, desc: 'Increases all party damage output by +25% for 1 hour.' },
    { id: 'athena_blessing', name: 'Blessing of Athena', icon: '🛡️', stat: 'Max HP +30%', cost: 10, desc: 'Fortifies all party maximum health by +30% for 1 hour.' },
    { id: 'zeus_blessing', name: 'Blessing of Zeus', icon: '⚡', stat: 'Crit Rate +20%', cost: 15, desc: 'Electrifies spirit strikes with +20% Critical Hit Chance for 1 hour.' },
    { id: 'poseidon_blessing', name: 'Blessing of Poseidon', icon: '🌊', stat: 'Shard Yield +35%', cost: 15, desc: 'Surges tidal abundance granting +35% bonus Spirit Shards for 1 hour.' }
  ];

  return `
    <div class="flex flex-col gap-3">
      <div class="text-xs text-slate-400">
        Invoke 1-hour divine boons from the Greek Gods to supercharge party combat potency:
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${BLESSINGS.map(b => {
          const active = activeBlessings.find(ab => ab.id === b.id);
          const canAfford = (res.essencesOfTheGods || 0) >= b.cost;
          const minsRemaining = active ? Math.ceil((active.expiresAt - Date.now()) / (60 * 1000)) : 0;

          return `
            <div class="rounded-2xl border p-4 flex flex-col justify-between gap-3 shadow-lg transition-all ${active ? 'bg-purple-950/30 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-slate-900/80 border-slate-800'}">
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">${b.icon}</span>
                    <h4 class="text-sm font-black text-white">${b.name}</h4>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    ${b.stat}
                  </span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">${b.desc}</p>
              </div>

              <div class="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                ${active ? `
                  <div class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active: ${minsRemaining}m left
                  </div>
                ` : `
                  <div class="text-xs text-slate-300">
                    Cost: <strong class="text-cyan-300">${b.cost} Essences</strong>
                  </div>
                  <button class="btn-invoke-blessing min-h-[44px] px-4 py-2 rounded-xl font-black text-xs text-slate-950 transition-all cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-400 to-pink-300" 
                          data-blessing-id="${b.id}" 
                          ${canAfford ? '' : 'disabled'}>
                    Invoke Boon
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
      const blessingId = e.currentTarget.getAttribute('data-blessing-id');
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
      <div class="modal-card max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl text-white">
        <h3 class="text-base font-black text-emerald-300 flex items-center gap-2">
          🧪 Feed Astral Elixir
        </h3>
        <p class="text-xs text-slate-400 mt-1 mb-3">Choose an active party member to receive the XP surge:</p>
        
        <div class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
          ${partySpirits.map(s => `
            <div class="select-spirit-potion-row flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer" data-spirit-id="${s.id}">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-lg overflow-hidden shrink-0">${createSpiritPlaceholderBox(s)}</div>
                <div>
                  <div class="font-black text-sm text-white">${s.customName}</div>
                  <div class="text-xs text-slate-400">Lv. ${s.level} • ⚡ ${s.power} PWR</div>
                </div>
              </div>
              <button class="btn-feed-confirm px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black transition-all cursor-pointer">
                Feed
              </button>
            </div>
          `).join('')}
        </div>

        <button id="btn-cancel-potion-modal" class="min-h-[44px] w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer">
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
    <div class="trial-battle-container flex flex-col gap-3 min-h-full text-white">
      
      <!-- Top Combat HUD Header -->
      <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-lg backdrop-blur-md" style="border-color: ${chamber.color}66;">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">${chamber.icon}</span>
          <div>
            <div class="text-[10px] font-black uppercase tracking-wider" style="color: ${chamber.accentColor};">${chamber.name}</div>
            <div class="text-sm font-black text-white">${tierObj.name} • Wave ${battle.currentWave}/3</div>
          </div>
        </div>

        <button id="btn-leave-essence-battle" class="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-black transition-all cursor-pointer" title="Forfeit Battle">
          ✕ Forfeit
        </button>
      </div>

      <!-- Dynamic 2.5D Isometric Battlefield Area -->
      <div class="isometric-battlefield pantheon-battlefield relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-2xl min-h-[300px] flex items-center justify-between p-3 sm:p-5" style="border-color: ${chamber.color}44;">
        
        <!-- 2.5D Isometric Canvas Viewport Layer (Pixi.js / Canvas Engine) -->
        <div id="arena-viewport-25d" class="arena-viewport-25d absolute inset-0 pointer-events-none z-0 rounded-2xl overflow-hidden"></div>

        <!-- Left Side: Staggered Allied Spirit Formation -->
        <div class="allied-formation-column relative z-10 flex flex-col gap-2">
          <div class="text-[10px] font-black uppercase tracking-widest text-cyan-400">Allied Lineup</div>
          <div class="flex flex-col gap-2">
            ${party.map((spirit, idx) => {
              const maxHp = spirit.maxHp || 100;
              const curHp = typeof spirit.currentHp === 'number' ? Math.max(0, spirit.currentHp) : maxHp;
              const hpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));
              const mpPct = Math.max(0, Math.min(100, Math.round(spirit.currentMp || 0)));
              const isUltReady = mpPct >= 100;
              const isFallen = spirit.isFallen || curHp <= 0;

              return `
                <div class="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/75 border border-slate-800 ${isUltReady ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : ''} ${isFallen ? 'opacity-40' : ''}">
                  <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0">${createSpiritPlaceholderBox(spirit)}</div>
                  <div class="flex flex-col gap-1 w-20">
                    <div class="text-[10px] font-black truncate text-white">${spirit.customName}</div>
                    <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-400 rounded-full" style="width: ${hpPct}%;"></div>
                    </div>
                    <div class="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div class="h-full bg-cyan-400 rounded-full" style="width: ${mpPct}%;"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Center Combat Clash Point -->
        <div class="relative z-10 text-2xl animate-pulse">
          ⚔️
        </div>

        <!-- Right Side: Wave Enemies -->
        <div class="enemy-formation-column relative z-10 flex flex-col gap-2 items-end">
          <div class="text-[10px] font-black uppercase tracking-widest text-red-400">
            ${battle.currentWave === 3 ? '👑 Boss Avatar' : `Guardians (${livingEnemies.length}/${swarm.length})`}
          </div>
          <div class="flex flex-col gap-2">
            ${swarm.map(em => {
              const isDead = em.isDefeated || em.hp <= 0;
              const maxHp = em.maxHp || 100;
              const curHp = typeof em.hp === 'number' ? Math.max(0, em.hp) : maxHp;
              const emHpPct = Math.max(0, Math.min(100, Math.round((curHp / maxHp) * 100)));

              return `
                <div class="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/75 border border-slate-800 ${em.isBoss ? 'border-amber-500' : ''} ${isDead ? 'opacity-30' : ''}">
                  <div class="flex flex-col gap-1 w-20 items-end">
                    <div class="text-[10px] font-black truncate text-white" style="color: ${chamber.color};">${em.name}</div>
                    <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div class="h-full bg-red-400 rounded-full" style="width: ${emHpPct}%;"></div>
                    </div>
                  </div>
                  <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0">${createEnemyPlaceholderBox(em)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- Victory Modal if Battle Cleared -->
      ${battle.status === 'victory' && battle.loot ? `
        <div class="rounded-2xl border border-amber-400/60 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 p-4 shadow-2xl flex flex-col items-center text-center gap-2">
          <div class="text-base font-black text-amber-300">🏆 SANCTUM TRIAL CLEARED!</div>
          <div class="text-xs text-slate-300">
            Spoils: <strong class="text-cyan-300">+${battle.loot.godEssencesGained} Essences of the Gods</strong>, 
            ${battle.loot.soulEssenceGained > 0 ? `<strong class="text-purple-300">+${battle.loot.soulEssenceGained} Soul Essence</strong>, ` : ''}
            <strong class="text-emerald-300">+${battle.loot.shardsGained} Shards</strong>
          </div>
          <button id="btn-collect-essence-loot" class="min-h-[44px] w-full py-2.5 rounded-xl font-black text-xs text-slate-950 transition-all cursor-pointer shadow bg-gradient-to-r from-cyan-400 to-emerald-300 hover:from-cyan-300 hover:to-emerald-200">
            Collect Spoils to Sanctum
          </button>
        </div>
      ` : ''}

      <!-- Defeat Banner -->
      ${battle.status === 'defeat' ? `
        <div class="rounded-2xl border border-red-500/40 bg-slate-900 p-4 flex flex-col items-center text-center gap-2">
          <div class="text-base font-black text-red-400">☠️ TRIAL FAILED</div>
          <p class="text-xs text-slate-400">Your spirits succumbed to the primordial trial.</p>
          <button id="btn-leave-essence-battle" class="min-h-[44px] w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer">
            Return to Sanctum
          </button>
        </div>
      ` : ''}

      <!-- Attack Strike Footer -->
      ${battle.status === 'active' ? `
        <div class="combat-action-footer">
          <button id="btn-essence-strike" class="btn-main-attack min-h-[48px] w-full py-3 rounded-2xl font-black text-sm text-slate-950 transition-all cursor-pointer shadow-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 flex flex-col items-center justify-center">
            <span>⚔️ Divine Strike (Party Attack • Charges +10 MP)</span>
            <span class="text-[10px] font-bold opacity-80">Wave ${battle.currentWave}/3 • Party Power: ⚡ ${partyPower.toLocaleString()}</span>
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
