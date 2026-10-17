import {
  SPIRIT_SPECIES,
  calculateSpiritPower,
  calculateSpiritMaxHp,
  getXpRequiredForLevel
} from '../../data/spiritsData.js';
import { getEnemyForStage } from '../../data/madnessZoneData.js';
import {
  createRelicInstance,
  createWeaponInstance,
  generateRelicSubstats,
  calculateRelicMainStat
} from '../../data/equipmentData.js';
import { getContractorXpRequired } from '../../data/contractorData.js';
import { SAVE_KEY, AUTO_SAVE_INTERVAL_MS, ENERGY_REGEN_INTERVAL_SEC } from '../constants.js';

export const persistenceMethods = {
  /**
   * Generates default starting game state
   */
  getInitialState() {
    const starterId = this.generateId();
    const starterSpecies = SPIRIT_SPECIES['cat_spirit'];
    const starterMaxHp = calculateSpiritMaxHp(starterSpecies, 1, starterSpecies.baseRarity);
    
    // Starter Equipment: 1 Common Blade + 2 Hades Relics to test 2-pc Hades bonus immediately
    const starterWeapon = createWeaponInstance({ weaponTypeId: 'sword', rarity: 'COMMON', level: 1 });
    const starterRelic1 = createRelicInstance({ setId: 'hades', slotTypeId: 'headgear', rarity: 'COMMON', level: 1 });
    const starterRelic2 = createRelicInstance({ setId: 'hades', slotTypeId: 'totem', rarity: 'COMMON', level: 1 });

    starterWeapon.equippedToSpiritId = starterId;
    starterRelic1.equippedToSpiritId = starterId;
    starterRelic2.equippedToSpiritId = starterId;

    const starterSpirit = {
      id: starterId,
      speciesId: starterSpecies.id,
      customName: starterSpecies.name,
      level: 1,
      xp: 0,
      tier: 1,
      rarity: starterSpecies.baseRarity,
      element: starterSpecies.element || 'WIND',
      power: calculateSpiritPower(starterSpecies, 1, starterSpecies.baseRarity),
      maxHp: starterMaxHp,
      currentHp: starterMaxHp,
      maxMp: 100,
      currentMp: 0,
      shieldHp: 0,
      isFallen: false,
      isEquipped: true,
      canEvolve: false,
      evolutionHistory: [starterSpecies.name],
      contractedAt: Date.now(),
      weapon: starterWeapon.uid,
      relics: {
        headgear: starterRelic1.uid,
        totem: starterRelic2.uid,
        ring: null,
        necklace: null,
        orb: null,
        charm: null
      }
    };

    return {
      version: 2,
      last_saved: Date.now(),
      resources: {
        spiritShards: 300, // Enough for starter training!
        soulEssence: 0,
        purifiedSoulEssence: 3, // Starter 3 Purified Soul Essences for initial contracts
        divineScriptures: 0, // Divine Relic Scripture consumable (select 2 guaranteed substats)
        relicReshapers: 0,   // Relic Reshaper consumable (rerolls relic substats)
        essencesOfTheGods: 0,
        energy: 60,        // Max 60 Energy base
        maxEnergy: 60,
        energySecondsAccumulator: 0,
        resonanceTier: 0    // Essence upgrade: permanent +5% power per tier
      },
      inventory: {
        equipment: [starterWeapon, starterRelic1, starterRelic2]
      },
      activeDungeonBattle: null,
      activeBlessings: {}, // Temporary 1-hour spirit blessings
      constellations: { draco: 0, phoenix: 0, pegasus: 0, leo: 0, taurus: 0, scorpio: 0, aquarius: 0, sagittarius: 0 },
      expeditions: {},
      dwarvenForge: {
        weekKey: '',
        scripturesPurchasedThisWeek: 0,
        reshapersPurchasedThisWeek: 0
      },
      transmutationsToday: 0,
      lastTransmutationDate: new Date().toDateString(),
      dailyExchange: {
        purifiedEssenceCount: 0,
        purifiedEssenceDate: new Date().toDateString()
      },
      spirits: [starterSpirit],
      party: [starterId], // Max 5 active spirits
      partyFormation: {
        b1: null, b2: null, b3: null,
        m1: null, m2: starterId, m3: null,
        f1: null, f2: null, f3: null
      },
      hallOfFame: [starterId], // Max 5 showcase spirits
      discoveredSpeciesIds: [starterSpecies.id], // Spirit Compendium
      madnessZone: {
        stage: 1,
        subStage: 1,
        unlockedStages: [1],      // Floor 1 is unlocked initially
        highestStageUnlocked: 1,
        highestStageCleared: 0,   // 0 floors cleared initially
        autoAdvance: true,
        farmMode: false,
        isEngaged: true,          // Controlled manually: false = standby/paused, true = active combat
        currentSwarm: [],
        currentEnemy: null,
        combatTickProgress: 0
      },
      stats: {
        totalOfflineTimeSec: 0,
        totalSpiritsContracted: 1,
        totalEvolutions: 0,
        totalEnemiesDefeated: 0,
        shardsEarnedTotal: 0,
        totalDungeonRuns: 0
      },
      contractor: {
        level: 1,
        xp: 0,
        xpRequired: getContractorXpRequired(1)
      },
      tutorial: {
        step: 0,
        completed: false,
        active: true
      }
    };
  },

  /**
   * Validate and migrate loaded state
   */
  sanitizeLoadedState(loaded) {
    const base = this.getInitialState();
    const state = {
      ...base,
      ...loaded,
      resources: { ...base.resources, ...(loaded.resources || {}) },
      madnessZone: { ...base.madnessZone, ...(loaded.madnessZone || {}) },
      stats: { ...base.stats, ...(loaded.stats || {}) },
      activeBlessings: loaded.activeBlessings && typeof loaded.activeBlessings === 'object' ? loaded.activeBlessings : {},
      spirits: loaded.spirits || [],
      party: loaded.party || []
    };

    // Ensure energy & essence properties exist
    if (typeof state.resources.energy !== 'number') {
      state.resources.energy = base.resources.energy;
    }
    if (typeof state.resources.maxEnergy !== 'number') {
      state.resources.maxEnergy = base.resources.maxEnergy;
    }
    // Hard cap maxEnergy to 500
    state.resources.maxEnergy = Math.min(500, Math.max(60, state.resources.maxEnergy));

    if (typeof state.resources.divineScriptures !== 'number') {
      state.resources.divineScriptures = 2;
    }
    if (typeof state.resources.purifiedSoulEssence !== 'number' || isNaN(state.resources.purifiedSoulEssence)) {
      state.resources.purifiedSoulEssence = 3;
    }
    if (typeof state.resources.relicReshapers !== 'number') {
      state.resources.relicReshapers = 0;
    }
    if (typeof state.resources.essencesOfTheGods !== 'number') {
      state.resources.essencesOfTheGods = 0;
    }
    if (typeof state.resources.energySecondsAccumulator !== 'number') {
      state.resources.energySecondsAccumulator = 0;
    }

    if (!state.dailyExchange || typeof state.dailyExchange !== 'object') {
      state.dailyExchange = {
        purifiedEssenceCount: 0,
        purifiedEssenceDate: new Date().toDateString()
      };
    } else {
      if (typeof state.dailyExchange.purifiedEssenceCount !== 'number') {
        state.dailyExchange.purifiedEssenceCount = 0;
      }
      if (typeof state.dailyExchange.purifiedEssenceDate !== 'string') {
        state.dailyExchange.purifiedEssenceDate = new Date().toDateString();
      }
      // Reset if date changed
      if (state.dailyExchange.purifiedEssenceDate !== new Date().toDateString()) {
        state.dailyExchange.purifiedEssenceCount = 0;
        state.dailyExchange.purifiedEssenceDate = new Date().toDateString();
      }
    }

    if (!state.dwarvenForge || typeof state.dwarvenForge !== 'object') {
      state.dwarvenForge = {
        weekKey: '',
        scripturesPurchasedThisWeek: 0,
        reshapersPurchasedThisWeek: 0
      };
    }

    if (!state.constellations || typeof state.constellations !== 'object') {
      state.constellations = { draco: 0, phoenix: 0, pegasus: 0, leo: 0, taurus: 0, scorpio: 0, aquarius: 0, sagittarius: 0 };
    } else {
      const allConstKeys = ['draco', 'phoenix', 'pegasus', 'leo', 'taurus', 'scorpio', 'aquarius', 'sagittarius'];
      for (const k of allConstKeys) {
        if (typeof state.constellations[k] !== 'number') {
          state.constellations[k] = 0;
        }
      }
    }
    if (!state.expeditions || typeof state.expeditions !== 'object') {
      state.expeditions = {};
    }
    if (typeof state.transmutationsToday !== 'number') {
      state.transmutationsToday = 0;
    }
    if (typeof state.lastTransmutationDate !== 'string') {
      state.lastTransmutationDate = new Date().toDateString();
    }

    // Ensure contractor level & XP exist
    if (!state.contractor || typeof state.contractor !== 'object') {
      state.contractor = { level: 1, xp: 0, xpRequired: getContractorXpRequired(1) };
    } else {
      state.contractor.level = Math.max(1, Math.floor(state.contractor.level || 1));
      state.contractor.xp = Math.max(0, Math.floor(state.contractor.xp || 0));
      state.contractor.xpRequired = getContractorXpRequired(state.contractor.level);
    }

    // Ensure tutorial state exists
    if (!state.tutorial || typeof state.tutorial !== 'object') {
      const isVeteran = (state.madnessZone?.highestStageCleared || 0) > 1 || (state.spirits?.length || 0) > 2;
      state.tutorial = {
        step: isVeteran ? 99 : 0,
        completed: isVeteran,
        active: !isVeteran
      };
    } else {
      state.tutorial.step = typeof state.tutorial.step === 'number' ? state.tutorial.step : 0;
      state.tutorial.completed = Boolean(state.tutorial.completed);
      state.tutorial.active = Boolean(state.tutorial.active);
    }

    // Ensure unlocked stages exist and sanitize floor progression
    if (!Array.isArray(state.madnessZone.unlockedStages) || state.madnessZone.unlockedStages.length === 0) {
      state.madnessZone.unlockedStages = [1];
    }
    state.madnessZone.highestStageUnlocked = Math.max(...state.madnessZone.unlockedStages, 1);
    if (typeof state.madnessZone.highestStageCleared !== 'number') {
      state.madnessZone.highestStageCleared = 0;
    }
    // Prevent corrupted state where highestStageCleared exceeded highestStageUnlocked
    if (state.madnessZone.highestStageCleared > state.madnessZone.highestStageUnlocked) {
      state.madnessZone.highestStageCleared = state.madnessZone.highestStageUnlocked;
    }
    // Fix dirty save where Floor 1 had highestStageCleared = 1 before defeat
    if (state.madnessZone.highestStageCleared === 1 && state.madnessZone.highestStageUnlocked === 1 && (state.stats?.totalEnemiesDefeated || 0) < 5) {
      state.madnessZone.highestStageCleared = 0;
    }
    // Ensure current stage is among unlocked stages
    if (!state.madnessZone.unlockedStages.includes(state.madnessZone.stage)) {
      state.madnessZone.stage = state.madnessZone.highestStageUnlocked;
    }

    // Graceful migration of old spirit species if needed
    state.spirits.forEach(s => {
      if (!SPIRIT_SPECIES[s.speciesId]) {
        s.speciesId = 'cat_spirit';
        s.customName = 'Cat Spirit';
      }
      const species = SPIRIT_SPECIES[s.speciesId];
      if (species) {
        s.ascensionLevel = s.ascensionLevel || 0;
        s.element = s.element || species.element || 'EARTH';
        s.power = calculateSpiritPower(species, s.level, s.rarity || species.baseRarity, s.ascensionLevel);
        s.maxHp = calculateSpiritMaxHp(species, s.level, s.rarity || species.baseRarity, s.ascensionLevel);
        if (typeof s.currentHp !== 'number' || isNaN(s.currentHp) || s.currentHp <= 0) {
          s.currentHp = s.maxHp;
        } else {
          s.currentHp = Math.min(s.currentHp, s.maxHp);
        }
        s.maxMp = 100;
        if (typeof s.currentMp !== 'number' || isNaN(s.currentMp)) {
          s.currentMp = (s.ascensionLevel >= 3) ? 15 : 0;
        } else {
          s.currentMp = Math.max(0, Math.min(100, s.currentMp));
        }
        if (typeof s.shieldHp !== 'number' || isNaN(s.shieldHp)) {
          s.shieldHp = 0;
        }
        s.isFallen = s.currentHp <= 0;
        s.canEvolve = s.level >= species.levelCap && species.evolutions && species.evolutions.length > 0;
      }
      if (typeof s.favorite !== 'boolean') {
        s.favorite = false;
      }
      if (!s.customName && species) {
        s.customName = species.name;
      }
    });

    // Ensure equipment inventory exists
    if (!state.inventory || typeof state.inventory !== 'object') {
      state.inventory = { equipment: [] };
    }
    if (!Array.isArray(state.inventory.equipment)) {
      state.inventory.equipment = [];
    }

    // Ensure madnessZone.isEngaged exists
    if (typeof state.madnessZone.isEngaged !== 'boolean') {
      state.madnessZone.isEngaged = true;
    }
    state.activeDungeonBattle = null;

    // Ensure equipment fields on spirits
    state.spirits.forEach(s => {
      if (typeof s.weapon === 'undefined') s.weapon = null;
      if (!s.relics || typeof s.relics !== 'object') {
        s.relics = { headgear: null, totem: null, ring: null, necklace: null, orb: null, charm: null };
      }
      // Migrate legacy slot names
      if (s.relics.crown && !s.relics.headgear) { s.relics.headgear = s.relics.crown; delete s.relics.crown; }
      if (s.relics.goblet && !s.relics.totem) { s.relics.totem = s.relics.goblet; delete s.relics.goblet; }
      if (s.relics.pendant && !s.relics.necklace) { s.relics.necklace = s.relics.pendant; delete s.relics.pendant; }
      if (s.relics.aegis && !s.relics.orb) { s.relics.orb = s.relics.aegis; delete s.relics.aegis; }
      if (s.relics.feather && !s.relics.charm) { s.relics.charm = s.relics.feather; delete s.relics.feather; }

      ['headgear', 'totem', 'ring', 'necklace', 'orb', 'charm'].forEach(slot => {
        if (typeof s.relics[slot] === 'undefined') s.relics[slot] = null;
      });
    });

    // Migrate equipment items with legacy slotTypeId & initialize relic stars/substats
    if (state.inventory && Array.isArray(state.inventory.equipment)) {
      state.inventory.equipment.forEach(item => {
        if (item.type === 'relic') {
          if (item.slotTypeId === 'crown') { item.slotTypeId = 'headgear'; item.slotName = 'Headgear'; item.icon = '👑'; item.mainStatName = 'Bonus Max HP'; }
          else if (item.slotTypeId === 'goblet') { item.slotTypeId = 'totem'; item.slotName = 'Totem'; item.icon = '🗿'; item.mainStatName = 'Shield Strength'; }
          else if (item.slotTypeId === 'pendant') { item.slotTypeId = 'necklace'; item.slotName = 'Necklace'; item.icon = '📿'; item.mainStatName = 'Mana Replenish'; }
          else if (item.slotTypeId === 'aegis') { item.slotTypeId = 'orb'; item.slotName = 'Orb'; item.icon = '🔮'; item.mainStatName = 'Ult Amp'; }
          else if (item.slotTypeId === 'feather') { item.slotTypeId = 'charm'; item.slotName = 'Charm'; item.icon = '🧿'; item.mainStatName = 'Evasion Rating'; }

          if (!item.stars) {
            const r = (item.rarity || 'COMMON').toUpperCase();
            item.stars = r === 'MYTHICAL' ? 6 : r === 'LEGENDARY' ? 5 : r === 'EPIC' ? 4 : 3;
          }
          if (!Array.isArray(item.substats)) {
            item.substats = generateRelicSubstats({ stars: item.stars, mainStatName: item.mainStatName });
          }
          if (!item.mainStatValue) {
            item.mainStatValue = calculateRelicMainStat(item.slotTypeId, item.stars, item.level || 1);
          }
        }
      });
    }

    if (typeof state.stats.totalDungeonRuns !== 'number') {
      state.stats.totalDungeonRuns = 0;
    }

    if (!Array.isArray(state.madnessZone.currentSwarm)) {
      state.madnessZone.currentSwarm = [];
    }

    // Ensure discoveredSpeciesIds array exists
    if (!Array.isArray(state.discoveredSpeciesIds)) {
      state.discoveredSpeciesIds = [];
    }
    state.spirits.forEach(s => {
      if (s.speciesId && !state.discoveredSpeciesIds.includes(s.speciesId)) {
        state.discoveredSpeciesIds.push(s.speciesId);
      }
    });

    // Ensure hall of fame array exists
    if (!Array.isArray(state.hallOfFame)) {
      state.hallOfFame = state.party ? state.party.slice(0, 5) : [];
    }

    // Enforce active party limit of 5
    if (state.party.length > 5) {
      state.party = state.party.slice(0, 5);
    }

    // Ensure partyFormation exists, is sanitized, and matches state.party
    state.partyFormation = this.sanitizePartyFormation(state.partyFormation, state.party, state.spirits);

    return state;
  },

  /**
   * LocalStorage saving (supports dirty checking to avoid redundant JSON serialization)
   */
  save(force = false) {
    if (!this.state) return;
    if (!force && this.isDirty === false) return;
    this.state.last_saved = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      this.isDirty = false;
      this.emit('saved', { timestamp: this.state.last_saved });
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  },

  /**
   * Applies an external state (e.g. from Supabase cloud sync) and reconciles caches
   * @param {Object} savedState - Raw state object to load
   * @returns {boolean} Success status
   */
  loadCustomState(savedState) {
    if (!savedState || typeof savedState !== 'object') return false;
    try {
      this.state = this.sanitizeLoadedState(savedState);
      this.invalidateCaches();
      const mz = this.state.madnessZone;
      if (!mz.currentEnemy || !mz.currentSwarm || mz.currentSwarm.length === 0 || mz.currentSwarm.every(e => e.isDefeated || e.hp <= 0)) {
        this.spawnMadnessEnemy();
      }
      this.save(true);
      this.emit('stateLoaded', this.state);
      this.emit('partyUpdated', this.state.party);
      return true;
    } catch (err) {
      console.error('[GameStateManager] Failed to load custom state:', err);
      return false;
    }
  },

  /**
   * Completely resets player progress to clean Day-1 starter state.
   * Clears saved state from localStorage, resets caches, and notifies listeners.
   * @returns {Object} Fresh starter state
   */
  resetAllProgress() {
    this.state = this.getInitialState();
    this.invalidateCaches();
    this.setBonusCooldowns = {};
    this.isDirty = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem('spirit_contract_evo_idle_save_v1');
      }
    } catch (e) {
      console.warn('[GameStateManager] Could not clear localStorage keys:', e);
    }
    this.save(true);
    const mz = this.state.madnessZone;
    if (!mz.currentEnemy || !mz.currentSwarm || mz.currentSwarm.length === 0 || mz.currentSwarm.every(e => e.isDefeated || e.hp <= 0)) {
      this.spawnMadnessEnemy();
    }
    this.emit('stateLoaded', this.state);
    this.emit('partyUpdated', this.state.party);
    this.emit('stageUnlocked', 1);
    this.emit('gameReset', this.state);
    return this.state;
  },

  markDirty() {
    this.isDirty = true;
  },

  startAutoSaver() {
    if (this.saveTimer) clearInterval(this.saveTimer);
    this.saveTimer = setInterval(() => {
      // Do not auto-save while tab is hidden to prevent overwriting last_saved departure time
      if (this._isTabHidden || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
        return;
      }
      if (this.isDirty) {
        this.save(true);
      }
    }, AUTO_SAVE_INTERVAL_MS);
  },

  /**
   * Main game loop using requestAnimationFrame
   * Adds XP to the 5 active Spirits every second and regenerates Energy
   */
  startGameLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    let lastSecondTime = performance.now();
    let lastFrameTime = performance.now();

    const loop = (timestamp) => {
      // If tab is hidden or backgrounded, freeze loop delta updates to prevent time-warp jumps
      if (this._isTabHidden || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
        lastSecondTime = timestamp;
        lastFrameTime = timestamp;
        this.rafId = requestAnimationFrame(loop);
        return;
      }

      // If returning from background or pause, clamp large gaps
      if (timestamp - lastSecondTime > 4000) {
        lastSecondTime = timestamp;
      }
      if (timestamp - lastFrameTime > 2000) {
        lastFrameTime = timestamp;
      }

      // 1. Every second: add XP to the 5 active Spirits and update energy regeneration
      if (timestamp - lastSecondTime >= 1000) {
        const secondsPassed = Math.floor((timestamp - lastSecondTime) / 1000);
        lastSecondTime = timestamp;

        // AFK Training XP
        this.tickAfkTraining(secondsPassed);

        // Real-time Energy Regeneration (1 per 30s)
        this.tickEnergyRegen(secondsPassed);

        // Tick temporary spirit blessings
        this.tickBlessings();

        this.emit('secondTick', { seconds: secondsPassed });
      }

      // 2. Smooth frame tick for combat and visual responsiveness
      const frameDeltaSec = Math.min(0.2, (timestamp - lastFrameTime) / 1000);
      lastFrameTime = timestamp;

      if (this.state.madnessZone.isEngaged !== false) {
        this.tickMadnessCombat(frameDeltaSec);
      }

      if (this.state.activeDungeonBattle && this.state.activeDungeonBattle.status === 'active') {
        this.tickDungeonBattle(frameDeltaSec);
      }

      this.emit('tick', { frameDeltaSec });
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  },

  /**
   * Regenerates energy over time (1 energy per 30 seconds)
   */
  tickEnergyRegen(secondsPassed) {
    const res = this.state.resources;
    if (res.energy >= res.maxEnergy) {
      res.energySecondsAccumulator = 0;
      return;
    }

    const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
    const effectiveInterval = ENERGY_REGEN_INTERVAL_SEC / (1 + ((constBonuses.energyRegenBonus || 0) / 100));

    res.energySecondsAccumulator += secondsPassed;
    while (res.energySecondsAccumulator >= effectiveInterval && res.energy < res.maxEnergy) {
      res.energy += 1;
      res.energySecondsAccumulator -= effectiveInterval;
      this.emit('energyGained', { current: res.energy, max: res.maxEnergy });
    }
  },

  /**
   * AFK Training - equipped spirits continuously gain XP
   */
  tickAfkTraining(deltaSec) {
    const partySpirits = this.getPartySpirits();
    if (partySpirits.length === 0) return;

    // Base XP per second scales with highest stage cleared
    const constBonuses = this.getConstellationBonuses ? this.getConstellationBonuses() : {};
    const afkMult = 1 + ((constBonuses.afkXpBonus || 0) / 100);
    const xpPerSec = this.getXpGainRate() * afkMult;
    const gainedXp = xpPerSec * deltaSec;

    let stateChanged = false;

    for (const spirit of partySpirits) {
      const species = SPIRIT_SPECIES[spirit.speciesId];
      if (!species) continue;

      // Check if capped
      if (spirit.level >= species.levelCap) {
        if (!spirit.canEvolve && species.evolutions && species.evolutions.length > 0) {
          spirit.canEvolve = true;
          stateChanged = true;
        }
        continue;
      }

      spirit.xp += gainedXp;
      let reqXp = getXpRequiredForLevel(spirit.level);

      while (spirit.xp >= reqXp && spirit.level < species.levelCap) {
        spirit.xp -= reqXp;
        spirit.level += 1;
        spirit.power = calculateSpiritPower(species, spirit.level, spirit.rarity);
        const newMaxHp = calculateSpiritMaxHp(species, spirit.level, spirit.rarity);
        const hpBonus = newMaxHp - (spirit.maxHp || newMaxHp);
        spirit.maxHp = newMaxHp;
        spirit.currentHp = Math.min(spirit.maxHp, (spirit.currentHp || newMaxHp) + Math.max(0, hpBonus));
        spirit.isFallen = false;
        stateChanged = true;

        if (spirit.level >= species.levelCap) {
          spirit.xp = reqXp; // Lock at max
          if (species.evolutions && species.evolutions.length > 0) {
            spirit.canEvolve = true;
          }
          this.emit('spiritLevelCapped', spirit);
          break;
        }

        this.emit('spiritLeveledUp', spirit);
        reqXp = getXpRequiredForLevel(spirit.level);
      }
    }

    if (stateChanged) {
      this.emit('partyUpdated', partySpirits);
    }
  },

  /**
   * Real-time XP gain rate per second for active party
   */
  getXpGainRate() {
    const stageBonus = 1 + (this.state.madnessZone.highestStageCleared - 1) * 0.08;
    return 3.0 * stageBonus;
  },

  /**
   * Offline XP & Resources & Energy Calculation when reopening the app
   * Rebalanced: 24-hour cap, diminishing returns past 8 hours, 6% XP rate, 5% shard salvage, max 35 energy, max 2-3 soul essence
   */
  applyOfflineGains(elapsedSeconds, forceClaim = false) {
    if (typeof elapsedSeconds !== 'number') {
      const now = Date.now();
      const last = this.state.last_saved || this.state.lastSaveTime || now;
      elapsedSeconds = Math.max(0, Math.floor((now - last) / 1000));
    }
    const cappedSeconds = Math.min(elapsedSeconds, 86400); // 24-hour cap
    const canClaim = cappedSeconds >= 3600 || forceClaim;

    // Diminishing returns past 8 hours (28,800s): 50% yield reduction
    const effectiveSeconds = cappedSeconds <= 28800
      ? cappedSeconds
      : 28800 + (cappedSeconds - 28800) * 0.5;

    // Passive meditation rate: 6% of active rate (heavily nerfed from 20%)
    const xpRate = this.getXpGainRate() * 0.06;
    const totalOfflineXp = xpRate * effectiveSeconds;

    const partySpirits = this.getPartySpirits();
    const levelUps = [];
    const readyToEvolve = [];

    // 1. Distribute offline XP to equipped spirits
    for (const spirit of partySpirits) {
      const species = SPIRIT_SPECIES[spirit.speciesId];
      if (!species) continue;

      const initialLevel = spirit.level;
      let remainingXp = totalOfflineXp;

      while (remainingXp > 0 && spirit.level < species.levelCap) {
        const req = getXpRequiredForLevel(spirit.level) - spirit.xp;
        if (remainingXp >= req) {
          remainingXp -= req;
          spirit.xp = 0;
          spirit.level += 1;
        } else {
          spirit.xp += remainingXp;
          remainingXp = 0;
        }
      }

      if (spirit.level >= species.levelCap) {
        spirit.xp = getXpRequiredForLevel(spirit.level);
        if (species.evolutions && species.evolutions.length > 0) {
          spirit.canEvolve = true;
          readyToEvolve.push(spirit);
        }
      }

      spirit.power = calculateSpiritPower(species, spirit.level, spirit.rarity);
      spirit.maxHp = calculateSpiritMaxHp(species, spirit.level, spirit.rarity);
      spirit.currentHp = spirit.maxHp;
      spirit.isFallen = false;

      if (spirit.level > initialLevel) {
        levelUps.push({
          spiritId: spirit.id,
          name: spirit.customName,
          oldLevel: initialLevel,
          newLevel: spirit.level
        });
      }
    }

    // 2. Offline Energy Accumulation (capped at max 35 offline energy)
    const res = this.state.resources;
    const maxOfflineEnergy = 35;
    const energyGained = Math.min(
      Math.min(res.maxEnergy - res.energy, maxOfflineEnergy),
      Math.floor(cappedSeconds / ENERGY_REGEN_INTERVAL_SEC)
    );
    if (energyGained > 0) {
      res.energy += energyGained;
    }

    // 3. Offline Madness Zone combat farming on previously unlocked stages
    // Rebalanced: 5% shard salvage rate, Soul Essence ceiling of max 2-3 in 24h
    const partyPower = this.getTotalPartyPower();
    const farmStage = this.state.madnessZone.farmMode 
      ? Math.max(1, this.state.madnessZone.stage - 1)
      : this.state.madnessZone.stage;

    const sampleEnemy = getEnemyForStage(farmStage, 3);
    const killTimeSec = Math.max(2, (sampleEnemy.power / Math.max(1, partyPower)) * 4);
    const estimatedKills = Math.floor(effectiveSeconds / killTimeSec);
    const offlineShards = Math.round(estimatedKills * sampleEnemy.shardReward * 0.05);
    const maxOfflineEssence = Math.min(3, Math.floor(cappedSeconds / 28800));
    const offlineEssence = Math.min(maxOfflineEssence, Math.floor(estimatedKills / 400));

    if (canClaim) {
      this.state.resources.spiritShards += offlineShards;
      this.state.resources.soulEssence += offlineEssence;
      this.state.stats.shardsEarnedTotal += offlineShards;
      this.state.stats.totalOfflineTimeSec += cappedSeconds;
      this.save();
    }

    const report = {
      elapsedSeconds: cappedSeconds,
      canClaim,
      minClaimTimeSec: 3600,
      xpGainedPerSpirit: Math.round(totalOfflineXp),
      levelUps,
      readyToEvolve,
      offlineShards,
      offlineEssence,
      offlineGold: Math.round(offlineShards * 1.5),
      energyGained,
      partyCount: partySpirits.length
    };
    this.state.offlineSpoils = report;
    return report;
  },

  claimIdleSpoils(report, { force = false } = {}) {
    if (!report) {
      report = this.state.offlineSpoils;
    }
    if (!report || (report.elapsedSeconds < 3600 && !report.canClaim && !force)) {
      throw new Error(`Idle spoils can only be claimed after at least 1 hour (3,600s) of meditation. Current: ${report ? report.elapsedSeconds : 0}s.`);
    }
    this.state.offlineSpoils = null;
    return {
      success: true,
      claimed: true,
      claimedSeconds: report.elapsedSeconds,
      offlineShards: report.offlineShards || 0,
      offlineEssence: report.offlineEssence || 0,
      soulEssence: report.offlineEssence || 0,
      gold: report.offlineGold || 0
    };
  },

  generateId() {
    return 'sp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }
};
