/**
 * The Arcane Vault - Card Collection & Inventory View
 * Features:
 * 1) 3 Distinct Sections: ⛩️ Spirits, 🔱 Relics, ⚔️ Weapons
 * 2) TCG / Gacha Card Collection Aesthetic with rarity frames & holographic sheen
 * 3) Pixi.js 2.5D Animated Card Altar Viewport ('vault' mode)
 * 4) Real-Time Search, Multi-Tier Rarity & Category Filters, and Favorites (All 3)
 * 5) In-line Spirit Renaming (Exclusive to Spirits)
 * 6) Proportional, mobile-first typography
 */

import { gameState } from '../../state/gameState.js';
import { audioManager } from '../../audio/audioManager.js';
import { SPIRIT_SPECIES, getRarityInfo } from '../../data/spiritsData.js';
import { EQUIPMENT_RARITIES, GREEK_GOD_SETS } from '../../data/equipmentData.js';
import { createSpiritPlaceholderBox } from '../components/pixelBox.js';
import { showSpiritModal, showItemInspectModal } from '../components/modals.js';
import { arenaRenderer } from '../../render/arenaRenderer.js';

let activeCategory = 'spirits'; // 'spirits' | 'relics' | 'weapons'
let activeRarityFilter = 'ALL';
let activeSubFilter = 'ALL'; // Element for spirits, Slot for relics, Archetype for weapons
let searchQuery = '';
let isBulkMode = false;
let selectedForBulk = new Set();
let rarityScrollLeft = 0;
let subScrollLeft = 0;

export function renderVaultView(container) {
  const state = gameState.state;
  const spirits = state.spirits || [];
  const partyIds = state.party || [];
  const allEquipment = (state.inventory && state.inventory.equipment) || [];
  const relics = allEquipment.filter(e => e.type === 'relic');
  const weapons = allEquipment.filter(e => e.type === 'weapon');

  const query = searchQuery.toLowerCase().trim();

  // 1. Filter Spirits
  const filteredSpirits = spirits.filter(s => {
    if (query) {
      const customMatch = (s.customName || '').toLowerCase().includes(query);
      const species = SPIRIT_SPECIES[s.speciesId];
      const speciesMatch = species && species.name.toLowerCase().includes(query);
      if (!customMatch && !speciesMatch) return false;
    }
    if (activeRarityFilter === 'FAVORITES' && !s.favorite) return false;
    if (activeRarityFilter !== 'ALL' && activeRarityFilter !== 'FAVORITES') {
      if ((s.rarity || 'COMMON').toUpperCase() !== activeRarityFilter) return false;
    }
    if (activeSubFilter !== 'ALL') {
      const species = SPIRIT_SPECIES[s.speciesId];
      if ((species?.element || 'EARTH').toUpperCase() !== activeSubFilter.toUpperCase()) return false;
    }
    return true;
  });

  filteredSpirits.sort((a, b) => {
    const aFav = a.favorite ? 1 : 0;
    const bFav = b.favorite ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    const aEq = partyIds.includes(a.id) ? 1 : 0;
    const bEq = partyIds.includes(b.id) ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return b.power - a.power;
  });

  // 2. Filter Relics
  const filteredRelics = relics.filter(r => {
    if (query) {
      const nameMatch = (r.name || '').toLowerCase().includes(query);
      const setMatch = (r.setName || '').toLowerCase().includes(query);
      const godMatch = (r.godName || '').toLowerCase().includes(query);
      if (!nameMatch && !setMatch && !godMatch) return false;
    }
    if (activeRarityFilter === 'FAVORITES' && !r.favorite && !r.equippedToSpiritId) return false;
    if (activeRarityFilter !== 'ALL' && activeRarityFilter !== 'FAVORITES') {
      if ((r.rarity || 'COMMON').toUpperCase() !== activeRarityFilter) return false;
    }
    if (activeSubFilter !== 'ALL') {
      if ((r.slotName || '').toLowerCase() !== activeSubFilter.toLowerCase()) return false;
    }
    return true;
  });

  filteredRelics.sort((a, b) => {
    const aFav = a.favorite ? 1 : 0;
    const bFav = b.favorite ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    const aEq = a.equippedToSpiritId ? 1 : 0;
    const bEq = b.equippedToSpiritId ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return (b.mainStatValue || 0) - (a.mainStatValue || 0);
  });

  // 3. Filter Weapons
  const filteredWeapons = weapons.filter(w => {
    if (query) {
      const nameMatch = (w.name || '').toLowerCase().includes(query);
      const arcMatch = (w.archetype || '').toLowerCase().includes(query);
      if (!nameMatch && !arcMatch) return false;
    }
    if (activeRarityFilter === 'FAVORITES' && !w.favorite && !w.equippedToSpiritId) return false;
    if (activeRarityFilter !== 'ALL' && activeRarityFilter !== 'FAVORITES') {
      if ((w.rarity || 'COMMON').toUpperCase() !== activeRarityFilter) return false;
    }
    if (activeSubFilter !== 'ALL') {
      if ((w.archetype || '').toLowerCase() !== activeSubFilter.toLowerCase()) return false;
    }
    return true;
  });

  filteredWeapons.sort((a, b) => {
    const aFav = a.favorite ? 1 : 0;
    const bFav = b.favorite ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    const aEq = a.equippedToSpiritId ? 1 : 0;
    const bEq = b.equippedToSpiritId ? 1 : 0;
    if (aEq !== bEq) return bEq - aEq;
    return (b.atkPower || 0) - (a.atkPower || 0);
  });

  const rarityTiers = ['ALL', 'FAVORITES', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHICAL', 'TRANSCENDENT'];

  // Sub-filter options per category
  const spiritElements = ['ALL', 'FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHT', 'DARK'];
  const relicSlots = ['ALL', 'Headgear', 'Totem', 'Ring', 'Necklace', 'Orb', 'Charm'];
  const weaponArchetypes = ['ALL', 'Blade', 'Bow', 'Staff', 'Claws', 'Daggers', 'Mallet'];

  let bulkShardsRefund = 0;
  selectedForBulk.forEach(id => {
    const sp = spirits.find(s => s.id === id);
    if (sp) {
      bulkShardsRefund += 40 * (sp.tier || 1) + Math.floor((sp.level || 1) * 3);
    }
  });

  container.innerHTML = `
    <div class="vault-collection-container flex flex-col gap-3 p-2 text-white">
      
      <!-- Top Card Collection Altar & Hero Banner (with Pixi.js Canvas Viewport) -->
      <div class="relative overflow-hidden rounded-xl bg-gradient-to-b from-indigo-950/60 via-slate-900/90 to-slate-950 border border-indigo-500/30 p-3 shadow-lg">
        <!-- Pixi.js Holographic Card Altar Canvas -->
        <div id="vault-pixi-viewport" class="arena-viewport-25d absolute inset-0 pointer-events-none z-0 rounded-xl overflow-hidden opacity-60"></div>

        <div class="relative z-10 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              🎴 ARCANE CARD COLLECTION
            </div>

            <!-- Total Collection Count Badge -->
            <div class="flex items-center gap-2 text-[11px]">
              <span class="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300">
                Spirits: <strong class="text-indigo-300 font-black">${spirits.length}</strong>
              </span>
              <span class="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300">
                Relics: <strong class="text-amber-300 font-black">${relics.length}</strong>
              </span>
              <span class="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300">
                Weapons: <strong class="text-orange-300 font-black">${weapons.length}</strong>
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <span>📜</span> The Divine Vault
              </h2>
              <p class="text-[11px] text-slate-400 leading-snug mt-0.5">
                Manage your collectible cards: contract spirits, Olympian relics, and sacred weapons.
              </p>
            </div>
            <button id="btn-vault-goto-index" class="shrink-0 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 text-[10px] font-bold cursor-pointer hover:bg-indigo-500/30 flex items-center gap-1 shadow-sm">
              <span>📖</span> Bestiary Index
            </button>
          </div>

          <!-- 3-Category Navigation Switcher -->
          <div class="grid grid-cols-3 gap-1.5 mt-1">
            <button class="vault-cat-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer min-h-[38px] ${activeCategory === 'spirits' ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 'bg-slate-900/80 text-slate-400 border-slate-800'}" data-cat="spirits">
              <span>⛩️</span> Spirits (${spirits.length})
            </button>
            <button class="vault-cat-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer min-h-[38px] ${activeCategory === 'relics' ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-slate-900/80 text-slate-400 border-slate-800'}" data-cat="relics">
              <span>🔱</span> Relics (${relics.length})
            </button>
            <button class="vault-cat-btn flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer min-h-[38px] ${activeCategory === 'weapons' ? 'bg-orange-500/30 text-orange-200 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]' : 'bg-slate-900/80 text-slate-400 border-slate-800'}" data-cat="weapons">
              <span>⚔️</span> Weapons (${weapons.length})
            </button>
          </div>
        </div>
      </div>

      <!-- Real-Time Search & Bulk Actions Bar -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input type="text" id="vault-search-input" 
                 class="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400" 
                 placeholder="Search by name, set, or stat..." 
                 value="${searchQuery}" />
          ${searchQuery ? `<button id="btn-clear-search" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs">✕</button>` : ''}
        </div>

        ${activeCategory === 'spirits' ? `
          <button id="btn-toggle-bulk" class="min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isBulkMode ? 'bg-red-500/20 border-red-400 text-red-300' : 'bg-slate-900/80 border-slate-700 text-slate-300'}">
            ${isBulkMode ? 'Done' : '📦 Bulk Annul'}
          </button>
        ` : ''}
      </div>

      <!-- Custom Rarity Filter Slider (Same as Index Bestiary) -->
      <div id="vault-rarity-scroll" class="index-filter-scroll" style="padding-bottom: 6px;">
        ${rarityTiers.map(tier => {
          const info = tier === 'ALL' || tier === 'FAVORITES' ? { color: '#ffffff' } : getRarityInfo(tier);
          const isActive = activeRarityFilter === tier;
          return `
            <button class="index-filter-btn vault-rarity-chip ${isActive ? 'active' : ''}" 
                    data-tier="${tier}"
                    style="${isActive && tier !== 'ALL' && tier !== 'FAVORITES' ? `border-color: ${info.color}; color: ${info.color};` : ''}">
              ${tier === 'FAVORITES' ? '⭐ Favorites' : tier}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Custom Element / Category Sub-Filter Slider (Same as Index Bestiary) -->
      <div id="vault-sub-scroll" class="index-filter-scroll" style="padding-bottom: 6px; margin-top: 2px;">
        ${(activeCategory === 'spirits' ? spiritElements : activeCategory === 'relics' ? relicSlots : weaponArchetypes).map(sub => {
          const isActive = activeSubFilter.toUpperCase() === sub.toUpperCase();
          const elemIcons = {
            FIRE: '🔥 Fire', WATER: '💧 Water', EARTH: '🌿 Earth',
            WIND: '⚡ Wind', LIGHT: '☀️ Light', DARK: '🌑 Dark', ALL: 'All'
          };
          const label = activeCategory === 'spirits' ? (elemIcons[sub] || sub) : sub;
          return `
            <button class="index-filter-btn vault-sub-chip ${isActive ? 'active' : ''}" 
                    data-sub="${sub}">
              ${label}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Bulk Actions Strip (Spirits Only) -->
      ${isBulkMode && activeCategory === 'spirits' ? `
        <div class="rounded-xl border border-red-500/30 bg-slate-900/90 p-2.5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button id="btn-select-commons" class="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer">Commons</button>
            <button id="btn-select-uncommons" class="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer">Uncommons</button>
            <button id="btn-select-all-filtered" class="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer">Select All</button>
            <button id="btn-clear-selection" class="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer">Clear</button>
          </div>
          <button id="btn-execute-bulk" class="px-3 py-1.5 rounded-lg text-xs font-extrabold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 cursor-pointer" ${selectedForBulk.size === 0 ? 'disabled' : ''}>
            Annul ${selectedForBulk.size} (+${bulkShardsRefund} 💎)
          </button>
        </div>
      ` : ''}

      <!-- Card Collection Grid -->
      <div class="vault-card-grid grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        
        <!-- ================= CATEGORY 1: SPIRITS CARDS ================= -->
        ${activeCategory === 'spirits' ? (
          filteredSpirits.length === 0 ? `
            <div class="col-span-full py-8 text-center text-xs text-slate-500">
              No spirits match your filter criteria.
            </div>
          ` : filteredSpirits.map(s => {
            const isEquipped = partyIds.includes(s.id);
            const isSelected = selectedForBulk.has(s.id);
            const rarity = getRarityInfo(s.rarity || 'COMMON');
            const species = SPIRIT_SPECIES[s.speciesId];
            const elem = (species?.element || 'EARTH').toUpperCase();

            const ELEM_COLORS = {
              FIRE: '#ff4757', WATER: '#00d2d3', EARTH: '#2ed573',
              WIND: '#ffd32a', LIGHT: '#f1c40f', DARK: '#a55eea'
            };
            const elemColor = ELEM_COLORS[elem] || '#2ed573';

            return `
              <div class="vault-card relative overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-900/90 to-slate-950 p-2.5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-md hover:scale-[1.01] ${isSelected ? 'ring-2 ring-red-500 bg-red-950/20' : ''}" 
                   style="border-color: ${rarity.color}66;" 
                   data-spirit-id="${s.id}">
                
                <!-- Bulk Selection Indicator Overlay -->
                ${isBulkMode ? `
                  <div class="absolute top-2 left-2 z-30 flex items-center justify-center">
                    <span class="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-red-500 text-white shadow-sm' : 'bg-slate-950/80 border border-slate-600 text-transparent'}">
                      ✓
                    </span>
                  </div>
                ` : ''}
                
                <!-- Card Header Strip -->
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <div class="flex items-center gap-1">
                    <span class="px-1.5 py-0.2 rounded text-[8px] font-black uppercase" style="background: ${elemColor}22; color: ${elemColor}; border: 1px solid ${elemColor}66;">
                      ${elem}
                    </span>
                    <span class="text-[9px] font-extrabold text-slate-400">Lv.${s.level}</span>
                  </div>

                  <div class="flex items-center gap-1">
                    ${isEquipped ? `<span class="px-1 py-0.2 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">⛩️ PARTY</span>` : ''}
                    <button class="btn-card-fav text-xs transition-transform active:scale-125" data-fav-spirit-id="${s.id}" title="Toggle Favorite">
                      ${s.favorite ? '<span class="text-amber-400 font-black">★</span>' : '<span class="text-slate-600">☆</span>'}
                    </button>
                  </div>
                </div>

                <!-- Card Artwork Frame -->
                <div class="relative w-full aspect-square max-h-24 rounded-xl flex items-center justify-center overflow-hidden mb-2" style="background: radial-gradient(circle, ${rarity.color}20 0%, rgba(10,15,25,0.8) 75%); border: 1px solid ${rarity.color}33;">
                  <div class="w-16 h-16 pointer-events-none">
                    ${createSpiritPlaceholderBox(s)}
                  </div>
                  <span class="absolute bottom-1 right-1.5 text-[8px] font-black uppercase px-1 rounded" style="color: ${rarity.color}; background: rgba(0,0,0,0.6);">
                    ${rarity.name}
                  </span>
                </div>

                <!-- Card Name & In-Line Rename Button -->
                <div class="flex items-center justify-between gap-1 mb-1">
                  <span class="text-xs font-bold text-white truncate flex-1">${s.customName}</span>
                  <button class="btn-card-rename text-slate-400 hover:text-cyan-300 text-[11px] p-0.5 rounded cursor-pointer" data-rename-spirit-id="${s.id}" data-current-name="${s.customName}" title="Rename Spirit">
                    ✏️
                  </button>
                </div>

                <!-- Stats Strip -->
                <div class="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-amber-400 font-extrabold">⚡ ${s.power.toLocaleString()}</span>
                  <span class="text-slate-400 text-[9px]">${species?.name || 'Spirit'}</span>
                </div>

              </div>
            `;
          }).join('')
        ) : ''}

        <!-- ================= CATEGORY 2: RELICS CARDS ================= -->
        ${activeCategory === 'relics' ? (
          filteredRelics.length === 0 ? `
            <div class="col-span-full py-8 text-center text-xs text-slate-500">
              No relics found. Clear Pantheon Trials to earn Greek God relics!
            </div>
          ` : filteredRelics.map(r => {
            const rarObj = EQUIPMENT_RARITIES[r.rarity] || EQUIPMENT_RARITIES.COMMON;
            const isEquipped = !!r.equippedToSpiritId;
            const equippedSpirit = isEquipped ? spirits.find(s => s.id === r.equippedToSpiritId) : null;
            const stars = r.stars || 3;
            const starColors = { 3: '#b2bec3', 4: '#00cec9', 5: '#ffd32a', 6: '#ff4757' };
            const starColor = starColors[stars] || '#ffd32a';

            return `
              <div class="vault-card relative overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-900/90 to-slate-950 p-2.5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-md hover:scale-[1.01]" 
                   style="border-color: ${starColor}66;" 
                   data-relic-uid="${r.uid}">
                
                <!-- Card Header -->
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="text-[9px] font-extrabold" style="color: ${starColor};">
                    ${'★'.repeat(stars)}
                  </span>
                  
                  <div class="flex items-center gap-1">
                    ${isEquipped ? `<span class="px-1 py-0.2 rounded text-[8px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">✓ ON ${equippedSpirit ? equippedSpirit.customName.slice(0, 5) : 'HERO'}</span>` : ''}
                    <button class="btn-card-fav text-xs transition-transform active:scale-125" data-fav-relic-uid="${r.uid}" title="Toggle Favorite">
                      ${r.favorite ? '<span class="text-amber-400 font-black">★</span>' : '<span class="text-slate-600">☆</span>'}
                    </button>
                  </div>
                </div>

                <!-- Card Artwork Frame -->
                <div class="relative w-full aspect-square max-h-24 rounded-xl flex items-center justify-center overflow-hidden mb-2" style="background: radial-gradient(circle, ${r.color || '#9b59b6'}25 0%, rgba(10,15,25,0.8) 75%); border: 1px solid ${starColor}33;">
                  <span class="text-3xl filter drop-shadow">${r.icon}</span>
                  <span class="absolute bottom-1 right-1.5 text-[8px] font-black uppercase px-1 rounded" style="color: ${rarObj.color}; background: rgba(0,0,0,0.6);">
                    ${r.slotName || 'Relic'}
                  </span>
                </div>

                <!-- Card Name -->
                <div class="text-xs font-bold truncate text-white mb-0.5" style="color: ${r.accentColor || '#fff'};">
                  ${r.name}
                </div>

                <!-- Stats Strip -->
                <div class="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-emerald-400 font-extrabold">+${r.mainStatValue} ${r.mainStatName}</span>
                  <span class="text-[9px] text-slate-400 truncate">${r.setName ? r.setName.slice(0, 7) : ''}</span>
                </div>

              </div>
            `;
          }).join('')
        ) : ''}

        <!-- ================= CATEGORY 3: WEAPONS CARDS ================= -->
        ${activeCategory === 'weapons' ? (
          filteredWeapons.length === 0 ? `
            <div class="col-span-full py-8 text-center text-xs text-slate-500">
              No weapons found. Smelt weapons in The Divine Forge!
            </div>
          ` : filteredWeapons.map(w => {
            const rarObj = EQUIPMENT_RARITIES[w.rarity] || EQUIPMENT_RARITIES.COMMON;
            const isEquipped = !!w.equippedToSpiritId;
            const equippedSpirit = isEquipped ? spirits.find(s => s.id === w.equippedToSpiritId) : null;

            return `
              <div class="vault-card relative overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-900/90 to-slate-950 p-2.5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-md hover:scale-[1.01]" 
                   style="border-color: ${rarObj.color}66;" 
                   data-weapon-uid="${w.uid}">
                
                <!-- Card Header -->
                <div class="flex items-center justify-between gap-1 mb-1.5">
                  <span class="text-[9px] font-extrabold" style="color: ${rarObj.color};">
                    ${rarObj.name}
                  </span>

                  <div class="flex items-center gap-1">
                    ${isEquipped ? `<span class="px-1 py-0.2 rounded text-[8px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">✓ ON ${equippedSpirit ? equippedSpirit.customName.slice(0, 5) : 'HERO'}</span>` : ''}
                    <button class="btn-card-fav text-xs transition-transform active:scale-125" data-fav-weapon-uid="${w.uid}" title="Toggle Favorite">
                      ${w.favorite ? '<span class="text-amber-400 font-black">★</span>' : '<span class="text-slate-600">☆</span>'}
                    </button>
                  </div>
                </div>

                <!-- Card Artwork Frame -->
                <div class="relative w-full aspect-square max-h-24 rounded-xl flex items-center justify-center overflow-hidden mb-2" style="background: radial-gradient(circle, rgba(230, 126, 34, 0.25) 0%, rgba(10,15,25,0.8) 75%); border: 1px solid ${rarObj.color}33;">
                  <span class="text-3xl filter drop-shadow">${w.icon}</span>
                  <span class="absolute bottom-1 right-1.5 text-[8px] font-black uppercase px-1 rounded" style="color: ${rarObj.color}; background: rgba(0,0,0,0.6);">
                    ${w.archetype || 'Weapon'}
                  </span>
                </div>

                <!-- Card Name -->
                <div class="text-xs font-bold truncate text-white mb-0.5" style="color: ${rarObj.color};">
                  ${w.name}
                </div>

                <!-- Stats Strip -->
                <div class="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span class="text-orange-400 font-extrabold">⚡ +${w.atkPower} PWR</span>
                  <span class="text-[9px] text-amber-300 font-bold">${w.critRate}% Crit</span>
                </div>

              </div>
            `;
          }).join('')
        ) : ''}

      </div>

    </div>
  `;

  // Mount Pixi.js 2.5D Animated Card Altar Viewport
  const vaultViewportEl = container.querySelector('#vault-pixi-viewport');
  if (vaultViewportEl) {
    arenaRenderer.init(vaultViewportEl, { mode: 'vault' });
  }

  // Bind Category Switching
  container.querySelectorAll('.vault-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-cat');
      activeSubFilter = 'ALL';
      isBulkMode = false;
      selectedForBulk.clear();
      renderVaultView(container);
    });
  });

  // Bind Search
  const searchInput = container.querySelector('#vault-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderVaultView(container);
      const newInput = container.querySelector('#vault-search-input');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(searchQuery.length, searchQuery.length);
      }
    });
  }

  container.querySelector('#btn-clear-search')?.addEventListener('click', () => {
    searchQuery = '';
    renderVaultView(container);
  });

  // Restore and track scroll positions for custom filter sliders
  const rarityScrollEl = container.querySelector('#vault-rarity-scroll');
  const subScrollEl = container.querySelector('#vault-sub-scroll');
  if (rarityScrollEl && rarityScrollLeft > 0) rarityScrollEl.scrollLeft = rarityScrollLeft;
  if (subScrollEl && subScrollLeft > 0) subScrollEl.scrollLeft = subScrollLeft;

  rarityScrollEl?.addEventListener('scroll', () => {
    rarityScrollLeft = rarityScrollEl.scrollLeft;
  });
  subScrollEl?.addEventListener('scroll', () => {
    subScrollLeft = subScrollEl.scrollLeft;
  });

  // Enable mouse wheel horizontal scrolling on filter sliders
  container.querySelectorAll('.index-filter-scroll').forEach(slider => {
    slider.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        slider.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  });

  // Bind Rarity Filters
  container.querySelectorAll('.vault-rarity-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeRarityFilter = btn.dataset.tier;
      renderVaultView(container);
    });
  });

  // Bind Sub Filters
  container.querySelectorAll('.vault-sub-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubFilter = btn.dataset.sub;
      renderVaultView(container);
    });
  });

  // In-line Favorite Toggle for Spirits
  container.querySelectorAll('[data-fav-spirit-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spId = btn.dataset.favSpiritId;
      const sp = spirits.find(s => s.id === spId);
      if (sp) {
        sp.favorite = !sp.favorite;
        if (sp.favorite && selectedForBulk.has(spId)) {
          selectedForBulk.delete(spId);
        }
        gameState.save();
        renderVaultView(container);
      }
    });
  });

  // In-line Favorite Toggle for Relics
  container.querySelectorAll('[data-fav-relic-uid]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const uid = btn.dataset.favRelicUid;
      const r = relics.find(it => it.uid === uid);
      if (r) {
        r.favorite = !r.favorite;
        gameState.save();
        renderVaultView(container);
      }
    });
  });

  // In-line Favorite Toggle for Weapons
  container.querySelectorAll('[data-fav-weapon-uid]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const uid = btn.dataset.favWeaponUid;
      const w = weapons.find(it => it.uid === uid);
      if (w) {
        w.favorite = !w.favorite;
        gameState.save();
        renderVaultView(container);
      }
    });
  });

  // In-line Rename Spirit Button
  container.querySelectorAll('.btn-card-rename').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const spId = btn.dataset.renameSpiritId;
      const curName = btn.dataset.currentName;
      const newName = prompt(`Rename spirit "${curName}":`, curName);
      if (newName && newName.trim() && newName.trim() !== curName) {
        gameState.renameSpirit(spId, newName.trim());
        renderVaultView(container);
      }
    });
  });

  // Card Inspect Clicks: Spirits
  container.querySelectorAll('[data-spirit-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card-fav') || e.target.closest('.btn-card-rename')) return;
      const spId = card.dataset.spiritId;
      if (isBulkMode) {
        if (partyIds.includes(spId)) {
          alert('Cannot select an active party spirit for annulment.');
          return;
        }
        const sp = spirits.find(s => s.id === spId);
        if (sp?.favorite) {
          alert('This Spirit is marked as Favorite! Unfavorite it first before selecting it for annulment.');
          return;
        }
        if (selectedForBulk.has(spId)) selectedForBulk.delete(spId);
        else selectedForBulk.add(spId);
        renderVaultView(container);
        return;
      }
      const spirit = spirits.find(s => s.id === spId);
      if (spirit) showSpiritModal(spirit, () => renderVaultView(container));
    });
  });

  // Card Inspect Clicks: Relics
  container.querySelectorAll('[data-relic-uid]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card-fav')) return;
      const uid = card.dataset.relicUid;
      const relic = relics.find(r => r.uid === uid);
      if (relic) showItemInspectModal({ item: relic, onUpdate: () => renderVaultView(container) });
    });
  });

  // Card Inspect Clicks: Weapons
  container.querySelectorAll('[data-weapon-uid]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card-fav')) return;
      const uid = card.dataset.weaponUid;
      const weapon = weapons.find(w => w.uid === uid);
      if (weapon) showItemInspectModal({ item: weapon, onUpdate: () => renderVaultView(container) });
    });
  });

  // Bulk Actions
  container.querySelector('#btn-toggle-bulk')?.addEventListener('click', () => {
    isBulkMode = !isBulkMode;
    selectedForBulk.clear();
    renderVaultView(container);
  });

  container.querySelector('#btn-select-commons')?.addEventListener('click', () => {
    spirits.forEach(s => {
      if (!partyIds.includes(s.id) && !s.favorite && (s.rarity || 'COMMON').toUpperCase() === 'COMMON') {
        selectedForBulk.add(s.id);
      }
    });
    renderVaultView(container);
  });

  container.querySelector('#btn-select-uncommons')?.addEventListener('click', () => {
    spirits.forEach(s => {
      if (!partyIds.includes(s.id) && !s.favorite && (s.rarity || 'COMMON').toUpperCase() === 'UNCOMMON') {
        selectedForBulk.add(s.id);
      }
    });
    renderVaultView(container);
  });

  container.querySelector('#btn-select-all-filtered')?.addEventListener('click', () => {
    filteredSpirits.forEach(s => {
      if (!partyIds.includes(s.id) && !s.favorite) {
        selectedForBulk.add(s.id);
      }
    });
    renderVaultView(container);
  });

  container.querySelector('#btn-clear-selection')?.addEventListener('click', () => {
    selectedForBulk.clear();
    renderVaultView(container);
  });

  container.querySelector('#btn-execute-bulk')?.addEventListener('click', () => {
    if (selectedForBulk.size === 0) return;
    if (confirm(`Annul contract with ${selectedForBulk.size} selected Spirits? You will receive +${bulkShardsRefund} Spirit Shards.`)) {
      try {
        const res = gameState.bulkAnnulContracts(Array.from(selectedForBulk));
        const annulledCount = res.annulledCount ?? res.count ?? 0;
        const shardsGained = res.totalShardsGained ?? res.shardsGained ?? 0;
        if (annulledCount === 0) {
          alert('No spirits could be annulled. Selected spirits may be active party members or marked as favorite.');
        } else {
          alert(`Successfully annulled contracts with ${annulledCount} Spirits! Gained +${shardsGained} Spirit Shards.`);
        }
        selectedForBulk.clear();
        isBulkMode = false;
        renderVaultView(container);
      } catch (err) {
        alert(err.message);
      }
    }
  });

  // Navigate to Index from Vault
  container.querySelector('#btn-vault-goto-index')?.addEventListener('click', () => {
    const navIndex = document.getElementById('nav-index');
    if (navIndex) {
      navIndex.click();
    }
  });
}
