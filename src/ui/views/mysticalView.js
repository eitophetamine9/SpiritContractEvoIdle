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
import { CONSTELLATIONS_CONFIG, EXPEDITIONS_CONFIG, TRANSMUTATION_CONFIG } from '../../data/astralRealmData.js';
import { createSpiritPlaceholderBox, createEnemyPlaceholderBox } from '../components/pixelBox.js';
import { SPIRIT_SPECIES } from '../../data/spiritsData.js';
import { arenaRenderer } from '../../render/arenaRenderer.js';

let selectedEssenceChamberId = 'olympian_nexus';
let selectedEssenceTierNum = 1;
let activeRealmSection = 'dungeon'; // 'dungeon' | 'zodiac' | 'expeditions' | 'transmute' | 'energy' | 'potions' | 'blessings'

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
  const nextEnergyCostSoul = 1 + Math.floor(tierIndex * 0.75);
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
              <div class="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-purple-500/30 text-[11px]" title="Astral Essence">
                <span class="text-purple-400 font-bold">🔮 Astral:</span>
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
              <span>🌌</span> The Astral Realm
            </h2>
            <p class="text-[11px] text-slate-400 leading-snug mt-0.5">
              Harness Astral Essences & Essences of the Gods to brew elixirs, ascend spirits, and invoke cosmic blessings.
            </p>
          </div>
        </div>
      </div>

      <!-- Realm Navigation Section Tabs: 7-Tab Responsive Modern Dock -->
      <div class="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        <button class="realm-tab-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'dungeon' ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="dungeon">
          <span class="text-sm pointer-events-none">🏛️</span>
          <span class="truncate pointer-events-none">Sanctuary</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'zodiac' ? 'bg-rose-500/25 text-rose-200 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="zodiac">
          <span class="text-sm pointer-events-none">🌌</span>
          <span class="truncate pointer-events-none">Zodiac</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'expeditions' ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="expeditions">
          <span class="text-sm pointer-events-none">🧭</span>
          <span class="truncate pointer-events-none">Expeditions</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'transmute' ? 'bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="transmute">
          <span class="text-sm pointer-events-none">⚗️</span>
          <span class="truncate pointer-events-none">Transmute</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'energy' ? 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="energy">
          <span class="text-sm pointer-events-none">⚡</span>
          <span class="truncate pointer-events-none">Vault (${currentMaxEnergy})</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'potions' ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="potions">
          <span class="text-sm pointer-events-none">🧪</span>
          <span class="truncate pointer-events-none">EXP Pots</span>
        </button>
        <button class="realm-tab-btn flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-150 border cursor-pointer min-h-[42px] ${activeRealmSection === 'blessings' ? 'bg-purple-500/25 text-purple-200 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'bg-slate-900/70 text-slate-400 border-slate-800'}" data-realm-tab="blessings">
          <span class="text-sm pointer-events-none">✨</span>
          <span class="truncate pointer-events-none">Blessings</span>
        </button>
      </div>

      <!-- Active Section Content Container -->
      <div class="realm-section-content">
        ${activeRealmSection === 'dungeon' ? renderDungeonSectionHtml(chamber, tier, canAffordDungeon, partyPower) : ''}
        ${activeRealmSection === 'zodiac' ? renderConstellationsSectionHtml(res) : ''}
        ${activeRealmSection === 'expeditions' ? renderExpeditionsSectionHtml(state) : ''}
        ${activeRealmSection === 'transmute' ? renderTransmutationSectionHtml(res, state) : ''}
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
  } else if (activeRealmSection === 'zodiac') {
    bindConstellationEvents(container);
  } else if (activeRealmSection === 'expeditions') {
    bindExpeditionEvents(container);
  } else if (activeRealmSection === 'transmute') {
    bindTransmutationEvents(container);
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
    { id: 'lesser_elixir', name: 'Lesser Astral Elixir', icon: '🧪', xp: 10000, astralCost: 1, essenceGodCost: 5, desc: 'Brewed elixir granting +10,000 Spirit XP.' },
    { id: 'grand_elixir', name: 'Grand Astral Elixir', icon: '⚗️', xp: 50000, astralCost: 3, essenceGodCost: 15, desc: 'Concentrated starlight granting +50,000 Spirit XP.' },
    { id: 'divine_ambrosia', name: 'Divine Ambrosia', icon: '🏺', xp: 250000, astralCost: 10, essenceGodCost: 40, desc: 'Nectar of the gods granting +250,000 Spirit XP.' }
  ];

  return `
    <div class="flex flex-col gap-2">
      <div class="text-[11px] text-slate-400">
        Feed concentrated astral potions to rapidly elevate spirit levels:
      </div>

      <div class="flex flex-col gap-2">
        ${POTIONS.map(pot => {
          const canBuy = (res.soulEssence || 0) >= pot.astralCost && 
            (res.essencesOfTheGods || 0) >= pot.essenceGodCost;

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
                    Cost: <span class="text-purple-300 font-bold">🔮 ${pot.astralCost} Astral</span> • <span class="text-cyan-300 font-bold">💠 ${pot.essenceGodCost} Gods</span>
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
          const key = `blessing_${b.id.replace('_blessing', '')}`;
          const active = activeBlessings ? (Array.isArray(activeBlessings) 
            ? activeBlessings.find(ab => ab.id === b.id || ab.id === key) 
            : (activeBlessings[b.id] || activeBlessings[key])) : null;
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

function renderConstellationsSectionHtml(res) {
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
  if (bonuses.bonusAstralDropChance) activeBonusLabels.push(`+${bonuses.bonusAstralDropChance}% Boss 🔮 Drops`);
  if (bonuses.afkXpBonus) activeBonusLabels.push(`+${bonuses.afkXpBonus}% AFK XP`);
  if (bonuses.bonusGodEssencesPercent) activeBonusLabels.push(`+${bonuses.bonusGodEssencesPercent}% Trial 💠 Gods`);

  return `
    <div class="flex flex-col gap-3">
      <!-- Zodiac Header & Active Synergy Overview -->
      <div class="rounded-xl border border-rose-500/30 p-3 bg-gradient-to-b from-rose-950/20 via-slate-900/90 to-slate-950 shadow-md flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🌌</span>
            <div>
              <h3 class="text-xs sm:text-sm font-extrabold text-white">Celestial Constellations (Zodiac Trees)</h3>
              <p class="text-[10px] sm:text-[11px] text-slate-400">Illuminate celestial star nodes using 🔮 Astral Essences to bestow permanent passive boons across all combat systems.</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-400/40 text-purple-300">
              🔮 ${(res.soulEssence || 0).toLocaleString()} Astral
            </span>
          </div>
        </div>

        <!-- Active Global Boons Strip -->
        <div class="pt-2 border-t border-slate-800">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Illuminated Cosmic Boons:</div>
          <div class="flex flex-wrap gap-1">
            ${activeBonusLabels.length > 0 ? activeBonusLabels.map(b => `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shadow-sm">
                ✨ ${b}
              </span>
            `).join('') : '<span class="text-[10px] text-slate-500 italic">No celestial stars illuminated yet. Spend 🔮 Astral Essences below to awaken your party!</span>'}
          </div>
        </div>
      </div>

      <!-- Constellations List -->
      <div class="flex flex-col gap-3">
        ${Object.values(CONSTELLATIONS_CONFIG).map(constConfig => {
          const curLevel = constellations[constConfig.id] || 0;
          const nextNode = curLevel + 1;
          const pct = Math.round((curLevel / 5) * 100);

          return `
            <div class="rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-md flex flex-col gap-2.5 transition-all hover:border-slate-700" style="border-left: 4px solid ${constConfig.themeColor};">
              <!-- Constellation Header -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0" style="background-color: ${constConfig.themeColor}22; border: 1px solid ${constConfig.themeColor}55;">
                    ${constConfig.icon}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-xs sm:text-sm font-black text-white">${constConfig.name}</span>
                      <span class="text-[10px] font-medium opacity-80" style="color: ${constConfig.accentColor};">${constConfig.title}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 truncate">${constConfig.description}</div>
                  </div>
                </div>

                <div class="flex flex-col items-end shrink-0">
                  <span class="text-[11px] font-black" style="color: ${constConfig.accentColor};">
                    ${curLevel}/5 ★
                  </span>
                  <div class="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-0.5">
                    <div class="h-full rounded-full transition-all" style="width: ${pct}%; background-color: ${constConfig.themeColor};"></div>
                  </div>
                </div>
              </div>

              <!-- Star Nodes (1 to 5) Horizontal Sequence -->
              <div class="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                ${constConfig.stars.map(star => {
                  const isUnlocked = star.node <= curLevel;
                  const isAvailable = star.node === nextNode;
                  const canAfford = (res.soulEssence || 0) >= star.cost;

                  let borderStyle = 'border-slate-800/80 bg-slate-950/60 opacity-60';
                  let statusBadge = `<span class="text-[9px] text-slate-500">🔒 Node ${star.node - 1} req</span>`;

                  if (isUnlocked) {
                    borderStyle = `border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]`;
                    statusBadge = `<span class="text-[9px] font-bold text-emerald-400">★ Illuminated</span>`;
                  } else if (isAvailable) {
                    borderStyle = `border-amber-400/60 bg-amber-950/30 shadow-[0_0_10px_rgba(251,191,36,0.2)] animate-pulse`;
                    statusBadge = `
                      <button class="btn-unlock-star w-full py-1 px-1.5 rounded-md font-bold text-[10px] transition-all cursor-pointer shadow ${canAfford ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 hover:brightness-110' : 'bg-slate-800 text-slate-400 border border-slate-700'}" 
                              data-constellation-id="${constConfig.id}" 
                              data-node="${star.node}" 
                              data-cost="${star.cost}" 
                              ${canAfford ? '' : 'disabled'}>
                        ${canAfford ? `Unlock (${star.cost} 🔮)` : `Need ${star.cost} 🔮`}
                      </button>
                    `;
                  }

                  return `
                    <div class="rounded-lg border ${borderStyle} p-2 flex flex-col justify-between gap-1 text-left min-h-[72px]">
                      <div>
                        <div class="flex items-center justify-between text-[10px]">
                          <strong class="text-white truncate">${star.node}. ${star.name}</strong>
                          <span class="text-[9px] text-purple-300 font-bold shrink-0">${star.cost} 🔮</span>
                        </div>
                        <div class="text-[10px] text-cyan-300 font-medium leading-tight mt-0.5">${star.desc}</div>
                      </div>
                      <div class="mt-1">
                        ${statusBadge}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

function renderExpeditionsSectionHtml(state) {
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

function renderTransmutationSectionHtml(res, state) {
  const currentCount = state.transmutationsToday || 0;
  const shardCost = TRANSMUTATION_CONFIG.shardCost + currentCount * 250;
  const godCost = TRANSMUTATION_CONFIG.godEssenceCost;
  const canTransmute = (res.spiritShards || 0) >= shardCost && (res.essencesOfTheGods || 0) >= godCost;

  return `
    <div class="flex flex-col gap-3">
      <!-- Transmutation Circle Banner -->
      <div class="rounded-xl border border-fuchsia-500/30 p-3.5 bg-gradient-to-b from-fuchsia-950/25 via-slate-900/90 to-slate-950 shadow-md flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-2xl shrink-0">
              ⚗️
            </div>
            <div>
              <h3 class="text-xs sm:text-sm font-extrabold text-white">Astral Transmutation Circle</h3>
              <p class="text-[10px] sm:text-[11px] text-slate-400">Refine massive reserves of Spirit Shards & Essences of the Gods into pure Astral Essence.</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300">
              Today: ${currentCount}x
            </span>
          </div>
        </div>

        <div class="text-[10px] text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-lg px-2.5 py-1 mt-1">
          🛡️ <strong>Anti-Oversaturation Economy Protocol:</strong> Base rate is 1,000 💎 + 10 💠. Each transmutation completed today increases shard stabilization cost by <strong>+250 💎</strong> (resets daily at midnight).
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
                <span>💎 Shards:</span>
                <strong>${shardCost.toLocaleString()} (${(res.spiritShards || 0).toLocaleString()})</strong>
              </div>
              <div class="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-900 border ${(res.essencesOfTheGods || 0) >= godCost ? 'border-emerald-500/40 text-emerald-300' : 'border-red-500/40 text-red-300'}">
                <span>💠 Gods:</span>
                <strong>${godCost} (${(res.essencesOfTheGods || 0)})</strong>
              </div>
            </div>
          </div>

          <!-- Conversion Catalyst Flow Arrow -->
          <div class="flex flex-col items-center justify-center gap-1">
            <span class="text-3xl text-fuchsia-400 animate-pulse">➔</span>
            <span class="text-[10px] font-black text-fuchsia-300 uppercase tracking-widest">Crystallize</span>
          </div>

          <!-- Output Catalyst -->
          <div class="rounded-xl bg-gradient-to-b from-purple-950/30 to-slate-950/80 border border-purple-500/40 p-3 flex flex-col items-center justify-center gap-1">
            <div class="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Product</div>
            <div class="text-2xl">🔮</div>
            <div class="text-sm font-black text-white">+1 Astral Essence</div>
            <div class="text-[10px] text-slate-400">Current Stock: ${(res.soulEssence || 0).toLocaleString()} 🔮</div>
          </div>
        </div>

        <!-- Action Button -->
        <button id="btn-transmute-shards" class="min-h-[44px] w-full py-2.5 px-4 rounded-xl font-extrabold text-xs text-slate-950 transition-all cursor-pointer shadow-lg disabled:opacity-50 bg-gradient-to-r from-fuchsia-400 via-purple-300 to-indigo-400 hover:brightness-110 flex items-center justify-center gap-1.5" ${canTransmute ? '' : 'disabled'}>
          <span>⚗️</span>
          <span>${canTransmute ? `Perform Transmutation (Cost: ${shardCost.toLocaleString()} 💎 + ${godCost} 💠)` : `Insufficient Reagents (Need ${shardCost.toLocaleString()} 💎 + ${godCost} 💠)`}</span>
        </button>

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

function bindConstellationEvents(container) {
  container.querySelectorAll('.btn-unlock-star').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cId = e.currentTarget.getAttribute('data-constellation-id');
      try {
        gameState.unlockConstellationStar(cId);
        audioManager.play('evolution_confirm');
        renderMysticalView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function bindTransmutationEvents(container) {
  container.querySelector('#btn-transmute-shards')?.addEventListener('click', () => {
    try {
      gameState.transmuteShardsToAstralEssence();
      audioManager.play('evolution_confirm');
      renderMysticalView(container);
    } catch (err) {
      alert(err.message);
    }
  });
}

function bindExpeditionEvents(container) {
  container.querySelectorAll('.btn-claim-expedition').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fId = e.currentTarget.getAttribute('data-fissure-id');
      try {
        const loot = gameState.claimExpeditionRewards(fId);
        audioManager.play('level_up');
        alert(`🏆 Expedition Spoils Collected!\n+${loot.astralGained} 🔮 Astral Essences\n+${loot.godsGained} 💠 Essences of the Gods\n+${loot.shardsGained.toLocaleString()} 💎 Spirit Shards${loot.relicGained ? `\n🎁 BONUS RELIC: ${loot.relicGained.name} (${loot.relicGained.rarity})` : ''}${loot.hasElementMatch ? '\n✨ Elemental Synergy: +25% Bonus Applied!' : ''}`);
        renderMysticalView(container);
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
        audioManager.play('spirit_unlocked');
        renderMysticalView(container);
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

function openExpeditionSpiritPickerModal(fissureId, container) {
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
      audioManager.play('spirit_unlocked');
      closeModal();
      renderMysticalView(container);
    } catch (err) {
      alert(err.message);
    }
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
