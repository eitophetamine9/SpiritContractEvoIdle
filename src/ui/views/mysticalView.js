/**
 * The Mystical Realm View Coordinator
 * Composes Astral sub-tabs under src/ui/views/astral/
 */

import { gameState } from '../../state/gameState.js';
import { ESSENCE_CHAMBERS, ESSENCE_DIFFICULTY_TIERS } from '../../data/essenceDungeonData.js';
import { createAnimatedSpriteHtml } from '../../render/spriteAnimator.js';

import {
  renderEnergySectionHtml,
  bindEnergyEvents,
  renderPotionsSectionHtml,
  bindPotionEvents,
  renderBlessingsSectionHtml,
  bindBlessingEvents,
  renderConstellationsSectionHtml,
  bindConstellationEvents,
  renderExpeditionsSectionHtml,
  bindExpeditionEvents,
  renderTransmutationSectionHtml,
  bindTransmutationEvents,
  renderDwarvenForgeSectionHtml,
  bindDwarvenForgeEvents,
  renderDungeonSectionHtml,
  bindDungeonEvents,
  renderEssenceBattleArena
} from './astral/index.js';

let selectedEssenceChamberId = 'olympian_nexus';
let selectedEssenceTierNum = 1;
let activeRealmSection = 'dungeon'; // 'dungeon' | 'zodiac' | 'expeditions' | 'dwarven' | 'transmute' | 'energy' | 'potions' | 'blessings'
let selectedConstellationId = 'draco';
let isCosmicBoonsOpen = false;

export function setActiveRealmSection(tab) {
  activeRealmSection = tab;
}

export function getActiveRealmSection() {
  return activeRealmSection;
}

export function setSelectedConstellationId(cId) {
  selectedConstellationId = cId;
}

export function getSelectedConstellationId() {
  return selectedConstellationId;
}

export function renderMysticalView(container) {
  const battle = gameState.state.activeDungeonBattle;

  // If in active essence dungeon battle, render the combat arena
  if (battle && battle.dungeonType === 'essence') {
    renderEssenceBattleArena(container, battle, {
      onRefresh: () => renderMysticalView(container)
    });
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
    <div class="mystical-realm-container">
      
      <!-- Top Realm Hero Banner: Clean Proportional Typography with Animated Celestial Avatar -->
      <div class="mystical-hero-banner">
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-col gap-2 flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                ✨ SANCTUM OF THE DIVINE
              </div>

              <!-- Currency Badges -->
              <div class="flex items-center gap-1.5 flex-wrap">
                <div class="mystical-stat-chip" title="Essences of the Gods">
                  <span class="text-cyan-400 font-bold">💠 Gods:</span>
                  <strong class="text-cyan-200 font-black">${(res.essencesOfTheGods || 0).toLocaleString()}</strong>
                </div>
                <div class="mystical-stat-chip" title="Astral Essence">
                  <span class="text-purple-400 font-bold">🔮 Astral:</span>
                  <strong class="text-purple-200 font-black">${(res.soulEssence || 0).toLocaleString()}</strong>
                </div>
                <div class="mystical-stat-chip" title="Energy Capacity">
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
                Harness Astral Essences & Essences of the Gods to brew elixirs, ascend spirits, forge divine scriptures, and awaken cosmic constellations.
              </p>
            </div>
          </div>

          <!-- Animated Floating Celestial Avatar -->
          <div class="hidden sm:flex items-center justify-center p-2 rounded-2xl bg-slate-950/70 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
            ${createAnimatedSpriteHtml('celestial_angel', { extraClasses: 'astral-hero-sprite scale-110' })}
          </div>
        </div>
      </div>

      <!-- Realm Navigation Section Tabs: 8-Tab Responsive Modern Dock -->
      <div class="realm-tab-grid">
        <button class="realm-tab-btn ${activeRealmSection === 'dungeon' ? 'active' : ''}" data-realm-tab="dungeon">
          <span class="text-sm pointer-events-none">🏛️</span>
          <span class="truncate pointer-events-none">Sanctuary</span>
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'zodiac' ? 'active' : ''}" data-realm-tab="zodiac">
          <span class="text-sm pointer-events-none">🌌</span>
          <span class="truncate pointer-events-none">Zodiac</span>
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'expeditions' ? 'active' : ''}" data-realm-tab="expeditions">
          <span class="text-sm pointer-events-none">🧭</span>
          <span class="truncate pointer-events-none">Expeditions</span>
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'dwarven' ? 'active' : ''}" data-realm-tab="dwarven">
          <span class="text-sm pointer-events-none">⚒️</span>
          <span class="truncate pointer-events-none">Dwarven's Forge</span>
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'transmute' ? 'active' : ''}" data-realm-tab="transmute">
          <span class="text-sm pointer-events-none">⚗️</span>
          <span class="truncate pointer-events-none">Transmute</span>
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'energy' ? 'active' : ''}" data-realm-tab="energy">
          <span class="text-sm pointer-events-none">⚡</span>
          <span class="truncate pointer-events-none">Vault (${currentMaxEnergy})</span>
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'potions' ? 'active' : ''}" data-realm-tab="potions">
          <span class="text-sm pointer-events-none">🧪</span>
          <span class="truncate pointer-events-none">EXP Pots</span>
        </button>
        <button class="realm-tab-btn ${activeRealmSection === 'blessings' ? 'active' : ''}" data-realm-tab="blessings">
          <span class="text-sm pointer-events-none">✨</span>
          <span class="truncate pointer-events-none">Blessings</span>
        </button>
      </div>

      <!-- Active Section Content Container -->
      <div class="realm-section-content">
        ${activeRealmSection === 'dungeon' ? renderDungeonSectionHtml(chamber, tier, canAffordDungeon, partyPower, selectedEssenceChamberId, selectedEssenceTierNum) : ''}
        ${activeRealmSection === 'zodiac' ? renderConstellationsSectionHtml(res, selectedConstellationId, isCosmicBoonsOpen) : ''}
        ${activeRealmSection === 'expeditions' ? renderExpeditionsSectionHtml(state) : ''}
        ${activeRealmSection === 'dwarven' ? renderDwarvenForgeSectionHtml(res, state) : ''}
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

  const refreshCb = { onRefresh: () => renderMysticalView(container) };

  // Bind specific section listeners
  if (activeRealmSection === 'dungeon') {
    bindDungeonEvents(container, {
      chamberId: selectedEssenceChamberId,
      tierNum: selectedEssenceTierNum
    }, {
      onSelectChamber: (id) => { selectedEssenceChamberId = id; },
      onSelectTier: (t) => { selectedEssenceTierNum = t; },
      ...refreshCb
    });
  } else if (activeRealmSection === 'zodiac') {
    bindConstellationEvents(container, {}, {
      onSelectConstellation: (id) => { selectedConstellationId = id; },
      onToggleBoons: () => { isCosmicBoonsOpen = !isCosmicBoonsOpen; },
      ...refreshCb
    });
  } else if (activeRealmSection === 'expeditions') {
    bindExpeditionEvents(container, refreshCb);
  } else if (activeRealmSection === 'dwarven') {
    bindDwarvenForgeEvents(container, refreshCb);
  } else if (activeRealmSection === 'transmute') {
    bindTransmutationEvents(container, refreshCb);
  } else if (activeRealmSection === 'energy') {
    bindEnergyEvents(container, refreshCb);
  } else if (activeRealmSection === 'potions') {
    bindPotionEvents(container, refreshCb);
  } else if (activeRealmSection === 'blessings') {
    bindBlessingEvents(container, refreshCb);
  }
}
