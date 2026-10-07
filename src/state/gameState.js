import { 
  SPIRIT_SPECIES, 
  CONTRACT_POOLS_BY_RARITY,
  BANNER_CONFIGS,
  rollContractSpirit,
  rollAstralContractSpirit,
  rollBannerContractSpirit,
  getXpRequiredForLevel, 
  calculateSpiritPower,
  calculateSpiritMaxHp,
  getSpiritUltimate,
  getElementalMultiplier,
  calculatePartyResonance
} from '../data/spiritsData.js';
import { getEnemyForStage, getSwarmForStage } from '../data/madnessZoneData.js';
import { 
  GREEK_GOD_SETS, 
  RELIC_SLOT_TYPES, 
  WEAPON_TYPES, 
  RELIC_STAR_TIERS,
  RELIC_SUBSTAT_TYPES,
  createRelicInstance, 
  createWeaponInstance,
  enhanceRelicData,
  ascendRelicData,
  generateRelicSubstats,
  calculateRelicMainStat
} from '../data/equipmentData.js';
import { 
  PANTHEON_CHAMBERS, 
  PANTHEON_DIFFICULTY_TIERS, 
  generateDungeonLoot 
} from '../data/artifactDungeonData.js';
import { 
  FORGE_CHAMBERS, 
  FORGE_DIFFICULTY_TIERS, 
  generateForgeLoot 
} from '../data/weaponDungeonData.js';
import { 
  ESSENCE_CHAMBERS, 
  ESSENCE_DIFFICULTY_TIERS, 
  generateEssenceLoot 
} from '../data/essenceDungeonData.js';

const SAVE_KEY = 'spirit_contract_evo_idle_save_v2';
const AUTO_SAVE_INTERVAL_MS = 5000;
export const ENERGY_ENTRY_COST = 10;
export const ENERGY_REGEN_INTERVAL_SEC = 30; // 1 energy per 30 seconds

class GameStateManager {
  constructor() {
    this.state = null;
    this.subscribers = new Set();
    this.saveTimer = null;
    this.rafId = null;
    this.lastTickTime = performance.now();
    this.setBonusCooldowns = {};
  }

  /**
   * Subscribe to state change notifications
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Register event listener for a specific event type
   */
  on(eventType, callback) {
    return this.subscribe((evType, payload, state) => {
      if (evType === eventType) {
        callback(payload, state);
      }
    });
  }

  emit(eventType, payload) {
    for (const callback of this.subscribers) {
      try {
        callback(eventType, payload, this.state);
      } catch (err) {
        console.error('Error in state subscriber:', err);
      }
    }
  }

  /**
   * Initialize state, compute offline gains, and start tickers
   */
  init() {
    // Try v2 save key first, fallback to v1 for migration
    let rawSaved = localStorage.getItem(SAVE_KEY);
    if (!rawSaved) {
      rawSaved = localStorage.getItem('spirit_contract_evo_idle_save_v1');
    }

    let loaded = null;
    if (rawSaved) {
      try {
        loaded = JSON.parse(rawSaved);
      } catch (e) {
        console.warn('Corrupt save file detected, generating fresh state', e);
      }
    }

    if (!loaded || !loaded.spirits || !Array.isArray(loaded.spirits)) {
      this.state = this.getInitialState();
      this.save();
    } else {
      this.state = this.sanitizeLoadedState(loaded);
    }

    // Process Offline Progression based on last_saved
    const now = Date.now();
    const offlineSeconds = Math.max(0, Math.floor((now - (this.state.last_saved || now)) / 1000));
    
    let offlineReport = null;
    if (offlineSeconds >= 4) {
      offlineReport = this.applyOfflineGains(offlineSeconds);
    }

    // Ensure Madness Zone current enemy is active and living
    const mz = this.state.madnessZone;
    if (!mz.currentEnemy || !mz.currentSwarm || mz.currentSwarm.length === 0 || mz.currentSwarm.every(e => e.isDefeated || e.hp <= 0)) {
      this.spawnMadnessEnemy();
    }

    // Start 5-second localStorage auto-saver
    this.startAutoSaver();

    // Start Real-time AFK Training & Combat ticker
    this.startGameLoop();

    // Attach unload listeners for data safety
    window.addEventListener('beforeunload', () => this.save());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.save();
      } else {
        // App reopened / focused
        const refocusNow = Date.now();
        const refocusOfflineSec = Math.max(0, Math.floor((refocusNow - (this.state.last_saved || refocusNow)) / 1000));
        if (refocusOfflineSec >= 5) {
          const refocusReport = this.applyOfflineGains(refocusOfflineSec);
          if (refocusReport) {
            this.emit('offlineGains', refocusReport);
          }
        }
      }
    });

    return offlineReport;
  }

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
        spiritShards: 300, // Enough for 3 summons right away!
        soulEssence: 0,
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
      spirits: [starterSpirit],
      party: [starterId], // Max 5 active spirits
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
      }
    };
  }

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

    if (typeof state.resources.essencesOfTheGods !== 'number') {
      state.resources.essencesOfTheGods = 0;
    }
    if (typeof state.resources.energySecondsAccumulator !== 'number') {
      state.resources.energySecondsAccumulator = 0;
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
        s.element = s.element || species.element || 'EARTH';
        s.power = calculateSpiritPower(species, s.level, s.rarity || species.baseRarity);
        s.maxHp = calculateSpiritMaxHp(species, s.level, s.rarity || species.baseRarity);
        if (typeof s.currentHp !== 'number' || isNaN(s.currentHp) || s.currentHp <= 0) {
          s.currentHp = s.maxHp;
        } else {
          s.currentHp = Math.min(s.currentHp, s.maxHp);
        }
        s.maxMp = 100;
        if (typeof s.currentMp !== 'number' || isNaN(s.currentMp)) {
          s.currentMp = 0;
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

    return state;
  }

  /**
   * LocalStorage saving
   */
  save() {
    if (!this.state) return;
    this.state.last_saved = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      this.emit('saved', { timestamp: this.state.last_saved });
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  startAutoSaver() {
    if (this.saveTimer) clearInterval(this.saveTimer);
    this.saveTimer = setInterval(() => {
      this.save();
    }, AUTO_SAVE_INTERVAL_MS);
  }

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
  }

  /**
   * Regenerates energy over time (1 energy per 30 seconds)
   */
  tickEnergyRegen(secondsPassed) {
    const res = this.state.resources;
    if (res.energy >= res.maxEnergy) {
      res.energySecondsAccumulator = 0;
      return;
    }

    res.energySecondsAccumulator += secondsPassed;
    while (res.energySecondsAccumulator >= ENERGY_REGEN_INTERVAL_SEC && res.energy < res.maxEnergy) {
      res.energy += 1;
      res.energySecondsAccumulator -= ENERGY_REGEN_INTERVAL_SEC;
      this.emit('energyGained', { current: res.energy, max: res.maxEnergy });
    }
  }


  /**
   * AFK Training - equipped spirits continuously gain XP
   */
  tickAfkTraining(deltaSec) {
    const partySpirits = this.getPartySpirits();
    if (partySpirits.length === 0) return;

    // Base XP per second scales with highest stage cleared
    const xpPerSec = this.getXpGainRate();
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
  }

  /**
   * Real-time XP gain rate per second for active party
   */
  getXpGainRate() {
    const stageBonus = 1 + (this.state.madnessZone.highestStageCleared - 1) * 0.08;
    return 3.0 * stageBonus;
  }

  /**
   * Offline XP & Resources & Energy Calculation when reopening the app
   * Rebalanced: 24-hour cap before diminishing returns, 20% passive meditation rate
   */
  applyOfflineGains(elapsedSeconds) {
    const cappedSeconds = Math.min(elapsedSeconds, 86400); // 24-hour cap
    // Passive meditation rate: 20% of active rate
    const xpRate = this.getXpGainRate() * 0.20;
    const totalOfflineXp = xpRate * cappedSeconds;

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

    // 2. Offline Energy Accumulation
    const res = this.state.resources;
    const energyGained = Math.min(
      res.maxEnergy - res.energy,
      Math.floor(cappedSeconds / ENERGY_REGEN_INTERVAL_SEC)
    );
    if (energyGained > 0) {
      res.energy += energyGained;
    }

    // 3. Offline Madness Zone combat farming on previously unlocked stages
    // Rebalanced: 25% shard salvage rate, Essence capped at 1 per 2 hours (max 12 in 24h)
    const partyPower = this.getTotalPartyPower();
    const farmStage = this.state.madnessZone.farmMode 
      ? Math.max(1, this.state.madnessZone.stage - 1)
      : this.state.madnessZone.stage;

    const sampleEnemy = getEnemyForStage(farmStage, 3);
    const killTimeSec = Math.max(2, (sampleEnemy.power / Math.max(1, partyPower)) * 4);
    // Soft-cap diminishing returns past 4 hours (14,400 sec)
    const effectiveSeconds = cappedSeconds <= 14400 
      ? cappedSeconds 
      : 14400 + (cappedSeconds - 14400) * 0.5;
    const estimatedKills = Math.floor(effectiveSeconds / killTimeSec);
    const offlineShards = Math.round(estimatedKills * sampleEnemy.shardReward * 0.20);
    const maxOfflineEssence = Math.min(12, Math.floor(cappedSeconds / 7200));
    const offlineEssence = Math.min(maxOfflineEssence, Math.floor(estimatedKills / 60));

    this.state.resources.spiritShards += offlineShards;
    this.state.resources.soulEssence += offlineEssence;
    this.state.stats.shardsEarnedTotal += offlineShards;
    this.state.stats.totalOfflineTimeSec += cappedSeconds;

    this.save();

    return {
      elapsedSeconds: cappedSeconds,
      xpGainedPerSpirit: Math.round(totalOfflineXp),
      levelUps,
      readyToEvolve,
      offlineShards,
      offlineEssence,
      energyGained,
      partyCount: partySpirits.length
    };
  }

  toggleMadnessEngagement() {
    const mz = this.state.madnessZone;
    mz.isEngaged = mz.isEngaged === false ? true : false;
    this.save();
    this.emit('madnessZoneUpdated', mz);
    return mz.isEngaged;
  }

  /**
   * Madness Zone Two-Way Combat Loop
   * Living spirits attack living swarm enemies & accumulate Mana
   * At 100 MP, spirits unleash Ultimates (AoE, Heals, Shields, Executes)
   * Enemies fight back on cooldowns, damaging spirits
   * Revives whole party on Floor Boss Victory; Resets to Wave 1 on Party Wipeout
   */
  tickMadnessCombat(deltaSec) {
    const { madnessZone } = this.state;
    if (madnessZone.isEngaged === false) return;

    if (!madnessZone.currentSwarm || madnessZone.currentSwarm.length === 0) {
      this.spawnMadnessEnemy();
      return;
    }

    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);
    const livingEnemies = madnessZone.currentSwarm.filter(e => !e.isDefeated && e.hp > 0);

    // 1. Check for Party Wipeout (All party members fallen)
    if (livingSpirits.length === 0 && party.length > 0) {
      madnessZone.subStage = 1;
      party.forEach(s => {
        s.currentHp = s.maxHp;
        s.currentMp = 0;
        s.shieldHp = 0;
        s.isFallen = false;
      });
      this.spawnMadnessEnemy();
      this.emit('partyWiped', {
        stage: madnessZone.stage,
        message: 'Party wiped out! Regrouping at Wave 1...'
      });
      this.emit('madnessZoneUpdated', madnessZone);
      return;
    }

    // 2. Check if all enemies in swarm defeated
    if (livingEnemies.length === 0) {
      this.onSwarmCleared();
      return;
    }

    // Frontline target enemy
    const leadEnemy = livingEnemies[0];

    // 3. Spirits Attack, Mana Accumulation & 4-pc Set Bonus Procs
    for (const spirit of livingSpirits) {
      // Effective power including weapons, relics, substats, and 2-pc set bonuses
      const effectivePower = this.getSpiritTotalPower(spirit);
      const elemMult = getElementalMultiplier(spirit.element, leadEnemy.element || 'EARTH');
      const baseDps = Math.max(1, Math.round(effectivePower * 0.45 * elemMult));
      const damageThisTick = baseDps * deltaSec;
      leadEnemy.hp = Math.max(0, leadEnemy.hp - damageThisTick);

      // Mana Accumulation with Mana Replenish modifiers (Zeus 2pc, Hades 2pc, Apollo 2pc, Pendant relic)
      const activeBonuses = this.getSpiritActiveSetBonuses(spirit);
      let manaBonusMult = 1;
      for (const b of activeBonuses) {
        if (b.bonus.manaReplenishBonus) {
          manaBonusMult += b.bonus.manaReplenishBonus;
        }
      }
      const mpGain = 20 * manaBonusMult * deltaSec;
      spirit.currentMp = Math.min(spirit.maxMp || 100, (spirit.currentMp || 0) + mpGain);

      // Trigger Ultimate at 100 MP
      if (spirit.currentMp >= 100) {
        spirit.currentMp = 0;
        this.procSpiritUltimate(spirit);
      }

      // Check 4-piece Greek God Set Bonus procs
      for (const b of activeBonuses) {
        if (b.tier === '4pc') {
          const cdKey = `${spirit.id}_${b.setId}`;
          this.setBonusCooldowns[cdKey] = (this.setBonusCooldowns[cdKey] || 0) - deltaSec;
          if (this.setBonusCooldowns[cdKey] <= 0) {
            this.setBonusCooldowns[cdKey] = b.bonus.cooldownSec || 30;
            this.proc4PieceSetBonus(spirit, b);
          }
        }
      }

      // Check if lead enemy died from basic attack
      if (leadEnemy.hp <= 0 && !leadEnemy.isDefeated) {
        this.onIndividualEnemyKilled(leadEnemy);
        break;
      }
    }

    // Keep currentEnemy in sync with lead living enemy
    madnessZone.currentEnemy = livingEnemies.find(e => !e.isDefeated && e.hp > 0) || null;

    // 4. Enemies Fight Back (Counter-attacks on cooldown timers with Evasion check)
    for (const enemy of livingEnemies) {
      if (enemy.hp <= 0 || enemy.isDefeated) continue;

      enemy.attackTimer = (enemy.attackTimer || 2.0) - deltaSec;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.attackCooldown || 2.4;

        // Counter-attack the lead living spirit
        const targetSpirit = livingSpirits[0];
        if (targetSpirit) {
          // Check Evasion (Hermes 2pc +15% evasion, Feather relic)
          const targetBonuses = this.getSpiritActiveSetBonuses(targetSpirit);
          let evasionChance = 0.05;
          for (const b of targetBonuses) {
            if (b.bonus.evasionBonus) evasionChance += b.bonus.evasionBonus;
          }
          if (Math.random() < evasionChance) {
            this.emit('spiritEvaded', { spirit: targetSpirit });
            continue;
          }

          const enemyElemMult = getElementalMultiplier(enemy.element || 'EARTH', targetSpirit.element || 'EARTH');
          let enemyDamage = Math.max(1, Math.round(enemy.power * enemyElemMult * (0.8 + Math.random() * 0.35)));

          // Absorb damage with shield first
          if (targetSpirit.shieldHp > 0) {
            const absorb = Math.min(targetSpirit.shieldHp, enemyDamage);
            targetSpirit.shieldHp -= absorb;
            enemyDamage -= absorb;
          }

          // Apply remaining damage to HP
          targetSpirit.currentHp = Math.max(0, targetSpirit.currentHp - enemyDamage);
          if (targetSpirit.currentHp <= 0) {
            targetSpirit.isFallen = true;
            targetSpirit.currentHp = 0;
            this.emit('spiritDefeated', targetSpirit);
          }

          this.emit('enemyCounterAttack', {
            enemy,
            targetSpirit,
            damage: enemyDamage
          });
        }
      }
    }
  }

  /**
   * Spirit Ultimate Execution
   */
  procSpiritUltimate(spirit) {
    const ult = getSpiritUltimate(spirit.speciesId);
    const { madnessZone } = this.state;
    const livingEnemies = (madnessZone.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);
    const fallenSpirits = party.filter(s => s.isFallen || s.currentHp <= 0);

    let totalDamageDealt = 0;
    let totalHealingDone = 0;

    switch (ult.type) {
      case 'AOE_DAMAGE': {
        const damagePerEnemy = Math.max(1, Math.round(spirit.power * ult.multiplier));
        for (const enemy of livingEnemies) {
          enemy.hp = Math.max(0, enemy.hp - damagePerEnemy);
          totalDamageDealt += damagePerEnemy;
          if (enemy.hp <= 0) {
            this.onIndividualEnemyKilled(enemy);
          }
        }
        break;
      }
      case 'DAMAGE': {
        if (livingEnemies.length > 0) {
          const target = livingEnemies[0];
          const damage = Math.max(1, Math.round(spirit.power * ult.multiplier));
          target.hp = Math.max(0, target.hp - damage);
          totalDamageDealt = damage;
          if (target.hp <= 0) {
            this.onIndividualEnemyKilled(target);
          }
        }
        break;
      }
      case 'EXECUTE': {
        if (livingEnemies.length > 0) {
          const sorted = [...livingEnemies].sort((a, b) => a.hp - b.hp);
          const target = sorted[0];
          const damage = Math.max(1, Math.round(spirit.power * ult.multiplier));
          target.hp = Math.max(0, target.hp - damage);
          totalDamageDealt = damage;
          if (target.hp <= 0) {
            this.onIndividualEnemyKilled(target);
          }
        }
        break;
      }
      case 'HEAL': {
        const healRatio = (ult.healPercent || 30) / 100;
        // Revive 1 fallen ally with healRatio HP if someone is fallen
        if (fallenSpirits.length > 0) {
          const allyToRevive = fallenSpirits[0];
          allyToRevive.isFallen = false;
          allyToRevive.currentHp = Math.max(1, Math.round(allyToRevive.maxHp * healRatio));
          totalHealingDone += allyToRevive.currentHp;
        }
        for (const ally of livingSpirits) {
          const heal = Math.round(ally.maxHp * healRatio);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
          totalHealingDone += heal;
        }
        break;
      }
      case 'SUPPORT': {
        const healRatio = (ult.healPercent || 20) / 100;
        const shieldRatio = (ult.shieldPercent || 20) / 100;
        if (fallenSpirits.length > 0) {
          const allyToRevive = fallenSpirits[0];
          allyToRevive.isFallen = false;
          allyToRevive.currentHp = Math.max(1, Math.round(allyToRevive.maxHp * healRatio));
          totalHealingDone += allyToRevive.currentHp;
        }
        for (const ally of livingSpirits) {
          const heal = Math.round(ally.maxHp * healRatio);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
          ally.shieldHp = (ally.shieldHp || 0) + Math.round(ally.maxHp * shieldRatio);
          totalHealingDone += heal;
        }
        break;
      }
      case 'AOE_DAMAGE_AND_HEAL': {
        const damagePerEnemy = Math.max(1, Math.round(spirit.power * (ult.multiplier || 3.0)));
        for (const enemy of livingEnemies) {
          enemy.hp = Math.max(0, enemy.hp - damagePerEnemy);
          totalDamageDealt += damagePerEnemy;
          if (enemy.hp <= 0) {
            this.onIndividualEnemyKilled(enemy);
          }
        }
        const healRatio = (ult.healPercent || 25) / 100;
        if (fallenSpirits.length > 0) {
          const allyToRevive = fallenSpirits[0];
          allyToRevive.isFallen = false;
          allyToRevive.currentHp = Math.max(1, Math.round(allyToRevive.maxHp * healRatio));
          totalHealingDone += allyToRevive.currentHp;
        }
        for (const ally of livingSpirits) {
          const heal = Math.round(ally.maxHp * healRatio);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
          totalHealingDone += heal;
        }
        break;
      }
    }

    this.emit('ultimateCast', {
      spirit,
      ult,
      totalDamageDealt,
      totalHealingDone
    });
  }

  /**
   * Manual Party Attack Click Action
   * Deals burst damage to frontline enemy and awards +10 MP to all living party spirits
   */
  attackEnemyWithPartyPower() {
    const { madnessZone } = this.state;
    if (!madnessZone.currentSwarm || madnessZone.currentSwarm.length === 0) {
      this.spawnMadnessEnemy();
      return { damage: 0, killed: false };
    }

    const livingEnemies = madnessZone.currentSwarm.filter(e => !e.isDefeated && e.hp > 0);
    if (livingEnemies.length === 0) {
      return { damage: 0, killed: false };
    }

    const enemy = livingEnemies[0];
    const partyPower = this.getTotalPartyPower();
    const damage = Math.max(1, Math.round(partyPower * 0.45));
    enemy.hp = Math.max(0, enemy.hp - damage);

    // Active tapping charges +10 MP on all living party spirits!
    const party = this.getPartySpirits();
    party.forEach(s => {
      if (!s.isFallen) {
        s.currentMp = Math.min(s.maxMp || 100, (s.currentMp || 0) + 10);
        if (s.currentMp >= 100) {
          s.currentMp = 0;
          this.procSpiritUltimate(s);
        }
      }
    });

    let killed = false;
    if (enemy.hp <= 0) {
      this.onIndividualEnemyKilled(enemy);
      killed = true;
    }

    this.emit('partyAttack', {
      damage,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      killed
    });

    return { damage, killed, remainingHp: enemy.hp };
  }

  spawnMadnessEnemy() {
    const { stage, subStage } = this.state.madnessZone;
    const swarm = getSwarmForStage(stage, subStage);
    this.state.madnessZone.currentSwarm = swarm;
    this.state.madnessZone.currentEnemy = swarm[0] || null;
    this.emit('enemySpawned', this.state.madnessZone.currentEnemy);
    this.emit('swarmSpawned', this.state.madnessZone.currentSwarm);
  }

  onIndividualEnemyKilled(enemy) {
    if (enemy.isDefeated) return;
    enemy.isDefeated = true;
    enemy.hp = 0;

    const shardsGained = enemy.shardReward || 0;
    const essenceGained = enemy.essenceReward || 0;

    this.state.resources.spiritShards += shardsGained;
    this.state.resources.soulEssence += essenceGained;
    this.state.stats.shardsEarnedTotal += shardsGained;
    this.state.stats.totalEnemiesDefeated += 1;

    this.emit('enemyDefeated', {
      enemy,
      shardsGained,
      essenceGained
    });

    // 35% chance for Overlord Boss to drop a random Greek God Relic
    if (enemy.isBoss && Math.random() < 0.35) {
      const godKeys = Object.keys(GREEK_GOD_SETS);
      const randomGod = godKeys[Math.floor(Math.random() * godKeys.length)];
      const randomSlot = RELIC_SLOT_TYPES[Math.floor(Math.random() * RELIC_SLOT_TYPES.length)];
      const rolledRelic = createRelicInstance({
        setId: randomGod,
        slotTypeId: randomSlot.id,
        rarity: Math.random() < 0.65 ? 'UNCOMMON' : 'RARE',
        level: Math.max(1, Math.min(4, Math.floor(this.state.madnessZone.stage / 25) + 1))
      });
      if (!this.state.inventory) this.state.inventory = { equipment: [] };
      this.state.inventory.equipment.push(rolledRelic);
      this.emit('relicDropped', rolledRelic);
    }

    // Check if the entire swarm is defeated
    const remaining = (this.state.madnessZone.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    if (remaining.length === 0) {
      this.emit('enemyDefeated', {
        enemy,
        shardsGained,
        essenceGained,
        isSwarmCleared: true
      });
      this.onSwarmCleared();
    } else {
      this.state.madnessZone.currentEnemy = remaining[0];
      this.emit('enemyDefeated', {
        enemy,
        shardsGained,
        essenceGained,
        isSwarmCleared: false
      });
    }
  }

  // Backward compatibility alias for tests/external callers
  onEnemyDefeated(enemy) {
    this.onIndividualEnemyKilled(enemy);
  }

  onSwarmCleared() {
    const mz = this.state.madnessZone;
    const isBossFloor = mz.subStage >= 5;

    if (isBossFloor) {
      // Zone Boss Defeated!
      mz.highestStageCleared = Math.max(mz.highestStageCleared || 0, mz.stage);

      // Floor Victory: Revive ALL party spirits to 100% HP!
      const party = this.getPartySpirits();
      party.forEach(s => {
        s.currentHp = s.maxHp;
        s.isFallen = false;
        s.shieldHp = 0;
      });
      this.emit('partyRevived', { reason: 'floor_victory' });

      // Check if next stage is already unlocked
      const nextStage = mz.stage + 1;
      const isNextUnlocked = mz.unlockedStages.includes(nextStage);

      if (mz.autoAdvance && !mz.farmMode && isNextUnlocked) {
        mz.stage = nextStage;
        mz.subStage = 1;
      } else {
        // Repeat current stage at Wave 1 (infinite farming) until next stage is unlocked
        mz.subStage = 1;
      }
      this.emit('floorCleared', { stage: mz.stage, highestCleared: mz.highestStageCleared });
    } else {
      // Advance to next wave in current floor
      mz.subStage += 1;
    }

    this.spawnMadnessEnemy();
    this.save();
    this.emit('madnessZoneUpdated', mz);
  }

  /**
   * Navigate to a previously unlocked floor (costs 0 Energy)
   */
  setStage(targetStage) {
    const mz = this.state.madnessZone;
    const stageNum = parseInt(targetStage, 10);
    if (isNaN(stageNum) || stageNum < 1) return;
    if (!mz.unlockedStages.includes(stageNum)) {
      throw new Error(`Floor ${stageNum} is not yet unlocked! Defeat previous floor bosses and unlock it first.`);
    }
    mz.stage = stageNum;
    mz.subStage = 1;
    this.spawnMadnessEnemy();
    this.save();
    this.emit('madnessZoneUpdated', mz);
    return { success: true, stage: stageNum };
  }

  /**
   * Unlock and enter a new floor using Energy
   * Once unlocked, repeated plays of this floor cost 0 Energy!
   */
  unlockAndEnterStage(targetStage) {
    const mz = this.state.madnessZone;
    const res = this.state.resources;

    // If already unlocked, simply switch to it (0 Energy cost)
    if (mz.unlockedStages.includes(targetStage)) {
      mz.stage = targetStage;
      mz.subStage = 1;
      this.spawnMadnessEnemy();
      this.emit('madnessZoneUpdated', mz);
      return { success: true, alreadyUnlocked: true };
    }

    // Must be the immediate next locked stage
    if (targetStage !== mz.highestStageUnlocked + 1) {
      throw new Error(`You must clear Floor ${mz.highestStageUnlocked} before unlocking Floor ${targetStage}!`);
    }

    // STRICT GUARD: Must have actually defeated the boss on highestStageUnlocked!
    if ((mz.highestStageCleared || 0) < mz.highestStageUnlocked) {
      throw new Error(`You must defeat the Boss on Floor ${mz.highestStageUnlocked} before unlocking Floor ${targetStage}!`);
    }

    // Energy cost check
    if (res.energy < ENERGY_ENTRY_COST) {
      throw new Error(`Insufficient Energy! Tackling Floor ${targetStage} costs ${ENERGY_ENTRY_COST} ⚡ (Current: ${res.energy} ⚡). Energy recovers 1 per 30s.`);
    }

    // Deduct energy and unlock floor permanently
    res.energy -= ENERGY_ENTRY_COST;
    mz.unlockedStages.push(targetStage);
    mz.unlockedStages.sort((a, b) => a - b);
    mz.highestStageUnlocked = Math.max(...mz.unlockedStages);
    mz.stage = targetStage;
    mz.subStage = 1;

    this.save();
    this.spawnMadnessEnemy();
    this.emit('stageUnlocked', { stage: targetStage, remainingEnergy: res.energy });
    this.emit('madnessZoneUpdated', mz);

    return { success: true, stage: targetStage, remainingEnergy: res.energy };
  }

  toggleAutoAdvance() {
    this.state.madnessZone.autoAdvance = !this.state.madnessZone.autoAdvance;
    this.emit('madnessZoneUpdated', this.state.madnessZone);
  }

  toggleFarmMode() {
    this.state.madnessZone.farmMode = !this.state.madnessZone.farmMode;
    this.emit('madnessZoneUpdated', this.state.madnessZone);
  }

  /**
   * RNG Evolution System
   * Evaluates branch table odds for the spirit's species
   */
  evolveSpirit(spiritId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found');

    const currentSpecies = SPIRIT_SPECIES[spirit.speciesId];
    if (!currentSpecies) throw new Error('Species data missing');

    if (!spirit.canEvolve || !currentSpecies.evolutions || currentSpecies.evolutions.length === 0) {
      throw new Error('This Spirit is not eligible for evolution yet.');
    }

    // RNG Branch Roll based on weights
    const totalWeight = currentSpecies.evolutions.reduce((acc, ev) => acc + ev.weight, 0);
    const roll = Math.random() * totalWeight;

    let runningWeight = 0;
    let chosenBranch = currentSpecies.evolutions[0];

    for (const evo of currentSpecies.evolutions) {
      runningWeight += evo.weight;
      if (roll <= runningWeight) {
        chosenBranch = evo;
        break;
      }
    }

    const nextSpecies = SPIRIT_SPECIES[chosenBranch.targetSpeciesId];
    if (!nextSpecies) throw new Error(`Target species ${chosenBranch.targetSpeciesId} does not exist`);

    const oldPower = spirit.power;
    const isRare = chosenBranch.rarity && chosenBranch.rarity !== 'UNCOMMON';

    // Apply Evolution
    spirit.speciesId = nextSpecies.id;
    spirit.customName = nextSpecies.name;
    spirit.tier = nextSpecies.tier || 2;
    spirit.level = 1; // Resets to Lv 1 of new Tier for high-ceiling AFK progression
    spirit.xp = 0;
    spirit.canEvolve = false;
    spirit.rarity = chosenBranch.rarity || nextSpecies.baseRarity;
    spirit.power = calculateSpiritPower(nextSpecies, spirit.level, spirit.rarity);
    spirit.maxHp = calculateSpiritMaxHp(nextSpecies, spirit.level, spirit.rarity);
    spirit.currentHp = spirit.maxHp;
    spirit.maxMp = 100;
    spirit.currentMp = 0;
    spirit.shieldHp = 0;
    spirit.isFallen = false;
    spirit.evolutionHistory.push(nextSpecies.name);

    this.state.stats.totalEvolutions += 1;
    this.markSpeciesDiscovered(nextSpecies.id);
    this.save();

    const result = {
      spiritId: spirit.id,
      spirit,
      oldSpecies: currentSpecies,
      newSpecies: nextSpecies,
      variantName: chosenBranch.variant,
      rarity: spirit.rarity,
      isRare,
      rollValue: Math.round((roll / totalWeight) * 100),
      oldPower,
      newPower: spirit.power
    };

    this.emit('spiritEvolved', result);
    return result;
  }

  /**
   * Contracting random Spirits (Gacha / Summoning)
   * Supports Common, Uncommon, Rare, Epic, Legendary pulls
   */
  getSummonLevelReqXp(level = 1) {
    return Math.round(200 * Math.pow(Math.max(1, level), 1.35));
  }

  /**
   * Contracting random Spirits (Gacha / Summoning)
   * Supports Multi-Banner (Solaris Rate-Up, Gelda Rate-Up, Celestial Conflux, Standard)
   * Supports 1x, 10x, and 30x pulls with summon level XP progression
   */
  contractSpirit(count = 1, bannerId = 'standard') {
    const singleCost = 100;
    let totalCost = singleCost * count;
    if (count === 10) totalCost = 950;
    if (count === 30) totalCost = 2700; // 10% discount for 30x contract

    if (this.state.resources.spiritShards < totalCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${totalCost}, have ${this.state.resources.spiritShards}.`);
    }

    this.state.resources.spiritShards -= totalCost;

    const newSpirits = [];

    for (let i = 0; i < count; i++) {
      const rolled = (!bannerId || bannerId === 'standard') 
        ? rollContractSpirit() 
        : rollBannerContractSpirit(bannerId);
      const species = SPIRIT_SPECIES[rolled.speciesId] || SPIRIT_SPECIES['fallen_warrior_spirit'];

      const spirit = {
        id: this.generateId(),
        speciesId: species.id,
        customName: species.name,
        level: 1,
        xp: 0,
        tier: species.tier || 1,
        rarity: rolled.rarityTier,
        element: species.element || 'EARTH',
        power: calculateSpiritPower(species, 1, rolled.rarityTier),
        maxHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
        currentHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
        maxMp: 100,
        currentMp: 0,
        shieldHp: 0,
        isFallen: false,
        isEquipped: false,
        canEvolve: false,
        evolutionHistory: [species.name],
        contractedAt: Date.now()
      };

      // Auto-equip if active party has room (< 5)
      if (this.state.party.length < 5) {
        spirit.isEquipped = true;
        this.state.party.push(spirit.id);
      }

      this.state.spirits.unshift(spirit);
      newSpirits.push(spirit);
      this.markSpeciesDiscovered(species.id);
    }

    // Summon Level XP Progression
    if (!this.state.stats) this.state.stats = {};
    const gainedXp = count * 25;
    this.state.stats.summonXp = (this.state.stats.summonXp || 0) + gainedXp;
    this.state.stats.summonLevel = this.state.stats.summonLevel || 1;
    let reqXp = this.getSummonLevelReqXp(this.state.stats.summonLevel);

    while (this.state.stats.summonXp >= reqXp) {
      this.state.stats.summonXp -= reqXp;
      this.state.stats.summonLevel += 1;
      reqXp = this.getSummonLevelReqXp(this.state.stats.summonLevel);
      this.emit('summonLevelUp', { level: this.state.stats.summonLevel });
    }

    this.state.stats.totalSpiritsContracted = (this.state.stats.totalSpiritsContracted || 0) + count;
    this.state.stats.totalBannerSummons = (this.state.stats.totalBannerSummons || 0) + count;
    this.save();

    this.emit('spiritsContracted', { spirits: newSpirits, cost: totalCost, bannerId });
    this.emit('resourcesUpdated', this.state.resources);
    return newSpirits;
  }

  claimSummonMilestone(milestoneCount) {
    if (!this.state.stats.claimedSummonMilestones) this.state.stats.claimedSummonMilestones = [];
    if (this.state.stats.claimedSummonMilestones.includes(milestoneCount)) {
      throw new Error('Milestone reward already claimed!');
    }
    const total = this.state.stats.totalBannerSummons || this.state.stats.totalSpiritsContracted || 0;
    if (total < milestoneCount) {
      throw new Error(`Need ${milestoneCount} total summons! Currently at ${total}.`);
    }

    const MILESTONE_REWARDS = {
      20: { shards: 500, essences: 20, desc: '500 Shards & 20 Essences of the Gods' },
      50: { shards: 1200, essences: 50, desc: '1,200 Shards & 50 Essences of the Gods' },
      100: { soulEssence: 10, essences: 100, desc: '10 Soul Essence & 100 Essences of the Gods' },
      200: { speciesId: 'astraea_valkyrie', desc: 'Guaranteed Legendary Hero: Astraea, Star-Forged Valkyrie' },
      500: { speciesId: 'solaris_lion_pride', desc: 'Guaranteed Mythical Hero: Solaris, Lion Sin of Pride' },
      1000: { speciesId: 'solaris_the_one', desc: 'Transcendent Hero: Solaris, The One Ultimate' }
    };

    const reward = MILESTONE_REWARDS[milestoneCount];
    if (!reward) throw new Error('Invalid milestone tier!');

    if (reward.shards) this.state.resources.spiritShards += reward.shards;
    if (reward.essences) this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + reward.essences;
    if (reward.soulEssence) this.state.resources.soulEssence = (this.state.resources.soulEssence || 0) + reward.soulEssence;
    if (reward.speciesId) {
      const species = SPIRIT_SPECIES[reward.speciesId];
      if (species) {
        const spirit = {
          id: this.generateId(),
          speciesId: species.id,
          customName: species.name,
          level: 1,
          xp: 0,
          tier: species.tier || 1,
          rarity: species.baseRarity,
          element: species.element || 'LIGHT',
          power: calculateSpiritPower(species, 1, species.baseRarity),
          maxHp: calculateSpiritMaxHp(species, 1, species.baseRarity),
          currentHp: calculateSpiritMaxHp(species, 1, species.baseRarity),
          maxMp: 100,
          currentMp: 0,
          shieldHp: 0,
          isFallen: false,
          isEquipped: false,
          canEvolve: false,
          evolutionHistory: [species.name],
          contractedAt: Date.now()
        };
        this.state.spirits.unshift(spirit);
        this.markSpeciesDiscovered(species.id);
      }
    }

    this.state.stats.claimedSummonMilestones.push(milestoneCount);
    this.save();
    this.emit('milestoneClaimed', { milestoneCount, reward });
    this.emit('resourcesUpdated', this.state.resources);
    return reward;
  }

  /**
   * Party Management (Strict limit: Max 5 Spirits)
   */
  equipSpirit(spiritId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) return false;

    if (this.state.party.includes(spiritId)) return true; // Already equipped

    if (this.state.party.length >= 5) {
      throw new Error('Party is full! Maximum 5 Spirits can be equipped.');
    }

    spirit.isEquipped = true;
    this.state.party.push(spiritId);
    this.save();
    this.emit('partyUpdated', this.getPartySpirits());
    return true;
  }

  unequipSpirit(spiritId) {
    const index = this.state.party.indexOf(spiritId);
    if (index === -1) return false;

    if (this.state.party.length <= 1) {
      throw new Error('You must keep at least 1 Spirit in your active party!');
    }

    this.state.party.splice(index, 1);
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (spirit) spirit.isEquipped = false;

    this.save();
    this.emit('partyUpdated', this.getPartySpirits());
    return true;
  }

  getPartySpirits() {
    return this.state.party
      .map(id => this.state.spirits.find(s => s.id === id))
      .filter(Boolean);
  }

  getTotalPartyPower() {
    const party = this.getPartySpirits();
    const basePower = party.reduce((sum, s) => sum + s.power, 0);
    const resonanceBonus = 1 + (this.state.resources.resonanceTier || 0) * 0.05;
    return Math.round(basePower * resonanceBonus);
  }

  // =========================================================================
  // SOUL ESSENCE SANCTUM (Essence Spending Shop) - Rebalanced
  // =========================================================================

  /**
   * Premium Astral Contract (0% Commons, guaranteed Uncommon+)
   * Costs 8 Soul Essence (Rebalanced from 5)
   */
  contractAstralSpirit() {
    const cost = 8;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮 (Have: ${this.state.resources.soulEssence} 🔮). Earn Essence by defeating Floor Bosses.`);
    }

    this.state.resources.soulEssence -= cost;
    const rolled = rollAstralContractSpirit();
    const species = SPIRIT_SPECIES[rolled.speciesId];

    const spirit = {
      id: this.generateId(),
      speciesId: species.id,
      customName: species.name,
      level: 1,
      xp: 0,
      tier: 1,
      rarity: rolled.rarityTier,
      element: species.element || 'EARTH',
      power: calculateSpiritPower(species, 1, rolled.rarityTier),
      maxHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
      currentHp: calculateSpiritMaxHp(species, 1, rolled.rarityTier),
      maxMp: 100,
      currentMp: 0,
      shieldHp: 0,
      isFallen: false,
      isEquipped: false,
      canEvolve: false,
      favorite: false,
      evolutionHistory: [species.name],
      contractedAt: Date.now()
    };

    if (this.state.party.length < 5) {
      spirit.isEquipped = true;
      this.state.party.push(spirit.id);
    }

    this.state.spirits.unshift(spirit);
    this.state.stats.totalSpiritsContracted += 1;
    this.markSpeciesDiscovered(species.id);
    this.save();

    this.emit('spiritsContracted', { spirits: [spirit], cost, currency: 'essence' });
    return [spirit];
  }

  /**
   * Grants +500 AFK Training XP to all active party spirits (Rebalanced from 2,500)
   * Costs 10 Soul Essence (Rebalanced from 3)
   */
  buyPartyXpElixir() {
    const cost = 10;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    const party = this.getPartySpirits();
    if (party.length === 0) {
      throw new Error('You have no spirits in your active party to receive XP!');
    }

    this.state.resources.soulEssence -= cost;
    const xpBonus = 500; // Balanced boost, not instant level-skip

    for (const spirit of party) {
      const species = SPIRIT_SPECIES[spirit.speciesId];
      if (!species) continue;

      let remainingXp = xpBonus;
      while (remainingXp > 0 && spirit.level < species.levelCap) {
        const req = getXpRequiredForLevel(spirit.level) - spirit.xp;
        if (remainingXp >= req) {
          remainingXp -= req;
          spirit.xp = 0;
          spirit.level += 1;
          spirit.power = calculateSpiritPower(species, spirit.level, spirit.rarity);
          spirit.maxHp = calculateSpiritMaxHp(species, spirit.level, spirit.rarity);
          spirit.currentHp = spirit.maxHp;
          spirit.isFallen = false;
        } else {
          spirit.xp += remainingXp;
          remainingXp = 0;
        }
      }

      if (spirit.level >= species.levelCap) {
        spirit.xp = getXpRequiredForLevel(spirit.level);
        if (species.evolutions && species.evolutions.length > 0) {
          spirit.canEvolve = true;
        }
      }
    }

    this.save();
    this.emit('partyUpdated', party);
    return { success: true, xpGranted: xpBonus };
  }

  /**
   * Permanently expands Max Energy by +10
   * Scaling cost: 8 + (purchases * 4) Soul Essence
   */
  buyMaxEnergyExpansion() {
    const purchases = this.state.resources.maxEnergyPurchases || 0;
    const cost = 8 + purchases * 4;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    this.state.resources.soulEssence -= cost;
    this.state.resources.maxEnergyPurchases = purchases + 1;
    this.state.resources.maxEnergy += 10;
    this.state.resources.energy += 10;
    this.save();
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });
    return { newMaxEnergy: this.state.resources.maxEnergy };
  }

  /**
   * Instantly restores +30 Energy
   * Costs 3 Soul Essence (Rebalanced from 2)
   */
  buyInstantEnergySurge() {
    const cost = 3;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    this.state.resources.soulEssence -= cost;
    this.state.resources.energy = Math.min(this.state.resources.maxEnergy, this.state.resources.energy + 30);
    this.save();
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });
    return { currentEnergy: this.state.resources.energy };
  }

  /**
   * Permanently upgrades party resonance (+5% all spirit power per tier)
   * Costs 6 + (tier * 4) Soul Essence (Rebalanced)
   */
  buyPartyResonanceUpgrade() {
    const currentTier = this.state.resources.resonanceTier || 0;
    const cost = 6 + currentTier * 4;
    if (this.state.resources.soulEssence < cost) {
      throw new Error(`Insufficient Soul Essence! Need ${cost} 🔮.`);
    }

    this.state.resources.soulEssence -= cost;
    this.state.resources.resonanceTier = currentTier + 1;
    this.save();
    this.emit('partyUpdated', this.getPartySpirits());
    return { newTier: this.state.resources.resonanceTier, bonusPercent: (currentTier + 1) * 5 };
  }

  // =========================================================================
  // VAULT & SPIRIT MANAGEMENT QoL (Annul, Bulk Annul, Rename, Favorite)
  // =========================================================================

  toggleFavoriteSpirit(spiritId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) return false;
    spirit.favorite = !spirit.favorite;
    this.save();
    this.emit('spiritUpdated', spirit);
    return spirit.favorite;
  }

  renameSpirit(spiritId, newName) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) return false;
    const cleanName = (newName || '').trim();
    if (!cleanName) return false;
    spirit.customName = cleanName.substring(0, 24);
    this.save();
    this.emit('spiritUpdated', spirit);
    return true;
  }

  /**
   * Annul Contract with Spirit (formerly Dispel) for refund shards
   */
  annulContract(spiritId) {
    if (this.state.party.includes(spiritId)) {
      throw new Error('Cannot annul contract with an active party Spirit. Unequip it first.');
    }

    const idx = this.state.spirits.findIndex(s => s.id === spiritId);
    if (idx === -1) return 0;

    const spirit = this.state.spirits[idx];
    if (spirit.favorite) {
      throw new Error('This Spirit is marked as Favorite! Unfavorite it first before annulling contract.');
    }

    const shardsGained = 40 * (spirit.tier || 1) + Math.floor((spirit.level || 1) * 3);
    this.state.spirits.splice(idx, 1);
    this.state.resources.spiritShards += shardsGained;

    if (Array.isArray(this.state.hallOfFame)) {
      this.state.hallOfFame = this.state.hallOfFame.filter(id => id !== spiritId);
    }

    this.save();
    this.emit('spiritAnnulled', { spiritId, shardsGained });
    return shardsGained;
  }

  releaseSpirit(spiritId) {
    return this.annulContract(spiritId);
  }

  bulkAnnulSpirits(spiritIds) {
    if (!Array.isArray(spiritIds) || spiritIds.length === 0) {
      return { count: 0, shardsGained: 0, annulledCount: 0, totalShardsGained: 0 };
    }

    let count = 0;
    let totalShardsGained = 0;

    for (const id of spiritIds) {
      if (this.state.party.includes(id)) continue;
      const idx = this.state.spirits.findIndex(s => s.id === id);
      if (idx === -1) continue;
      const spirit = this.state.spirits[idx];
      if (spirit.favorite) continue;

      const shards = 40 * (spirit.tier || 1) + Math.floor((spirit.level || 1) * 3);
      totalShardsGained += shards;
      count++;
      this.state.spirits.splice(idx, 1);

      if (Array.isArray(this.state.hallOfFame)) {
        this.state.hallOfFame = this.state.hallOfFame.filter(hid => hid !== id);
      }
    }

    this.state.resources.spiritShards += totalShardsGained;
    this.save();
    this.emit('spiritsBulkAnnulled', { count, shardsGained: totalShardsGained });
    return {
      count,
      shardsGained: totalShardsGained,
      annulledCount: count,
      totalShardsGained: totalShardsGained
    };
  }

  bulkAnnulContracts(spiritIds) {
    return this.bulkAnnulSpirits(spiritIds);
  }

  // =========================================================================
  // HALL OF FAME (Profile Showcase - up to 5 Spirits)
  // =========================================================================

  toggleHallOfFame(spiritId) {
    if (!Array.isArray(this.state.hallOfFame)) {
      this.state.hallOfFame = [];
    }
    const idx = this.state.hallOfFame.indexOf(spiritId);
    if (idx !== -1) {
      this.state.hallOfFame.splice(idx, 1);
      this.save();
      this.emit('hallOfFameUpdated', this.state.hallOfFame);
      return false;
    }

    if (this.state.hallOfFame.length >= 5) {
      throw new Error('Hall of Fame is full! Maximum 5 Spirits can be showcased.');
    }

    this.state.hallOfFame.push(spiritId);
    this.save();
    this.emit('hallOfFameUpdated', this.state.hallOfFame);
    return true;
  }

  getHallOfFameSpirits() {
    if (!Array.isArray(this.state.hallOfFame)) return [];
    return this.state.hallOfFame
      .map(id => this.state.spirits.find(s => s.id === id))
      .filter(Boolean);
  }

  // =========================================================================
  // SPIRIT COMPENDIUM / INDEX
  // =========================================================================

  markSpeciesDiscovered(speciesId) {
    if (!Array.isArray(this.state.discoveredSpeciesIds)) {
      this.state.discoveredSpeciesIds = [];
    }
    if (speciesId && !this.state.discoveredSpeciesIds.includes(speciesId)) {
      this.state.discoveredSpeciesIds.push(speciesId);
      this.save();
      this.emit('speciesDiscovered', speciesId);
    }
  }

  isSpeciesDiscovered(speciesId) {
    if (!Array.isArray(this.state.discoveredSpeciesIds)) return false;
    return this.state.discoveredSpeciesIds.includes(speciesId);
  }

  resetAllProgress() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('spirit_contract_evo_idle_save_v1');
    this.state = this.getInitialState();
    this.spawnMadnessEnemy();
    this.save();
    this.emit('gameReset');
  }

  generateId() {
    return 'sp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }
  // =========================================================================
  // EQUIPMENT, GREEK GOD RELICS & SET BONUSES
  // =========================================================================

  getSpiritEquippedItems(spiritOrId) {
    if (!spiritOrId) return { weapon: null, relics: {} };
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) return { weapon: null, relics: {} };
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];
    const weapon = spirit.weapon ? equipmentList.find(e => e.uid === spirit.weapon) || null : null;
    const relics = {};
    if (spirit.relics) {
      for (const [slot, uid] of Object.entries(spirit.relics)) {
        relics[slot] = uid ? equipmentList.find(e => e.uid === uid) || null : null;
      }
    }
    return { weapon, relics };
  }

  getSpiritActiveSetBonuses(spiritOrId) {
    if (!spiritOrId) return [];
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit || !spirit.relics) return [];
    const countBySet = {};
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];

    for (const relicUid of Object.values(spirit.relics)) {
      if (!relicUid) continue;
      const relic = equipmentList.find(e => e.uid === relicUid);
      if (relic && relic.setId) {
        countBySet[relic.setId] = (countBySet[relic.setId] || 0) + 1;
      }
    }

    const activeBonuses = [];
    for (const [setId, count] of Object.entries(countBySet)) {
      const godSet = GREEK_GOD_SETS[setId];
      if (!godSet) continue;
      if (count >= 2) {
        activeBonuses.push({
          setId,
          godName: godSet.god,
          tier: '2pc',
          name: godSet.bonus2pc.name,
          description: godSet.bonus2pc.description,
          bonus: godSet.bonus2pc,
          color: godSet.color,
          icon: godSet.icon,
          count
        });
      }
      if (count >= 4) {
        activeBonuses.push({
          setId,
          godName: godSet.god,
          tier: '4pc',
          name: godSet.bonus4pc.name,
          description: godSet.bonus4pc.description,
          bonus: godSet.bonus4pc,
          color: godSet.color,
          icon: godSet.icon,
          count
        });
      }
    }
    return activeBonuses;
  }

  getSpiritTotalPower(spiritOrId) {
    if (!spiritOrId) return 0;
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) return 0;
    let power = spirit.power || 0;
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];

    // Weapon bonus
    if (spirit.weapon) {
      const wpn = equipmentList.find(e => e.uid === spirit.weapon);
      if (wpn && wpn.atkPower) {
        power += wpn.atkPower;
      }
    }

    // Relic bonuses & Substats
    let percentAtkBonus = 0;
    if (spirit.relics) {
      for (const relicUid of Object.values(spirit.relics)) {
        if (!relicUid) continue;
        const relic = equipmentList.find(e => e.uid === relicUid);
        if (relic) {
          if (relic.mainStatName === 'Bonus ATK Power') {
            power += (relic.mainStatValue || 0);
          }
          if (Array.isArray(relic.substats)) {
            for (const sub of relic.substats) {
              if (sub.typeId === 'flat_atk') power += (sub.value || 0);
              else if (sub.typeId === 'percent_atk') percentAtkBonus += (sub.value || 0);
            }
          }
        }
      }
    }

    if (percentAtkBonus > 0) {
      power = Math.round(power * (1 + percentAtkBonus / 100));
    }

    // Active 2-pc damage bonuses (e.g. Hades +10%, Ares +15%, Poseidon +10%)
    const activeBonuses = this.getSpiritActiveSetBonuses(spirit);
    let damageMultiplier = 1;
    for (const b of activeBonuses) {
      if (b.bonus.damageBonus) {
        damageMultiplier += b.bonus.damageBonus;
      }
    }

    return Math.round(power * damageMultiplier);
  }

  getPartyElementalResonances() {
    return calculatePartyResonance(this.getPartySpirits());
  }

  getTotalPartyPower() {
    const party = this.getPartySpirits();
    const basePower = party.reduce((sum, s) => sum + this.getSpiritTotalPower(s), 0);
    const resonanceBonus = 1 + (this.state.resources.resonanceTier || 0) * 0.05;
    const elemResonance = this.getPartyElementalResonances();
    const elemAtkBonus = 1 + (elemResonance.atkPercent || 0) + (elemResonance.allStatsPercent || 0);
    return Math.round(basePower * resonanceBonus * elemAtkBonus);
  }

  proc4PieceSetBonus(spirit, setBonusObj) {
    const { madnessZone } = this.state;
    const livingEnemies = (madnessZone.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);

    switch (setBonusObj.setId) {
      case 'hades': {
        // Underworld Flames: 5% enemy max HP DoT
        for (const em of livingEnemies) {
          const dotDamage = Math.max(1, Math.round(em.maxHp * 0.05));
          em.hp = Math.max(0, em.hp - dotDamage);
          if (em.hp <= 0) this.onIndividualEnemyKilled(em);
        }
        break;
      }
      case 'zeus': {
        // Divine Retribution: 15% instant lightning blast
        for (const em of livingEnemies) {
          const strikeDamage = Math.max(1, Math.round(em.maxHp * 0.15));
          em.hp = Math.max(0, em.hp - strikeDamage);
          if (em.hp <= 0) this.onIndividualEnemyKilled(em);
        }
        break;
      }
      case 'poseidon': {
        // Oceanic Surge: Water Shield (15% max HP)
        for (const ally of livingSpirits) {
          ally.shieldHp = (ally.shieldHp || 0) + Math.round(ally.maxHp * 0.15);
        }
        break;
      }
      case 'hermes': {
        // Swift Support: 3% max HP per second
        for (const ally of livingSpirits) {
          const heal = Math.round(ally.maxHp * 0.03 * 7);
          ally.currentHp = Math.min(ally.maxHp, ally.currentHp + heal);
        }
        break;
      }
      case 'ares': {
        // War of Olympus: Weaken enemy attacks
        for (const em of livingEnemies) {
          em.power = Math.max(1, Math.round(em.power * 0.9));
        }
        break;
      }
      case 'apollo': {
        // Solar Radiance: heal lowest ally 8% max HP
        if (livingSpirits.length > 0) {
          const sorted = [...livingSpirits].sort((a, b) => a.currentHp - b.currentHp);
          const lowest = sorted[0];
          lowest.currentHp = Math.min(lowest.maxHp, lowest.currentHp + Math.round(lowest.maxHp * 0.08));
        }
        break;
      }
      case 'athena': {
        // Aegis of Olympus: 25% damage reflect buff
        for (const ally of livingSpirits) {
          ally.shieldHp = (ally.shieldHp || 0) + Math.round(ally.maxHp * 0.10);
        }
        break;
      }
      case 'artemis': {
        // Lunar Piercer: 25% true max HP damage to highest-HP enemy
        if (livingEnemies.length > 0) {
          const sorted = [...livingEnemies].sort((a, b) => b.hp - a.hp);
          const highest = sorted[0];
          const pierce = Math.max(1, Math.round(highest.maxHp * 0.25));
          highest.hp = Math.max(0, highest.hp - pierce);
          if (highest.hp <= 0) this.onIndividualEnemyKilled(highest);
        }
        break;
      }
    }

    this.emit('setBonusProc', {
      spirit,
      godSet: setBonusObj,
      name: setBonusObj.name,
      description: setBonusObj.description
    });
  }

  equipItem(spiritId, itemUid) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found');

    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];
    const item = equipmentList.find(e => e.uid === itemUid);
    if (!item) throw new Error('Equipment not found in inventory');

    if (item.type === 'weapon') {
      if (spirit.weapon) {
        const oldWpn = equipmentList.find(e => e.uid === spirit.weapon);
        if (oldWpn) oldWpn.equippedToSpiritId = null;
      }
      if (item.equippedToSpiritId) {
        const prevSpirit = this.state.spirits.find(s => s.id === item.equippedToSpiritId);
        if (prevSpirit && prevSpirit.weapon === item.uid) {
          prevSpirit.weapon = null;
        }
      }
      spirit.weapon = item.uid;
      item.equippedToSpiritId = spirit.id;
    } else if (item.type === 'relic') {
      const slotType = item.slotTypeId;
      if (!spirit.relics) {
        spirit.relics = { headgear: null, totem: null, ring: null, necklace: null, orb: null, charm: null };
      }
      if (spirit.relics[slotType]) {
        const oldRelic = equipmentList.find(e => e.uid === spirit.relics[slotType]);
        if (oldRelic) oldRelic.equippedToSpiritId = null;
      }
      if (item.equippedToSpiritId) {
        const prevSpirit = this.state.spirits.find(s => s.id === item.equippedToSpiritId);
        if (prevSpirit && prevSpirit.relics && prevSpirit.relics[slotType] === item.uid) {
          prevSpirit.relics[slotType] = null;
        }
      }
      spirit.relics[slotType] = item.uid;
      item.equippedToSpiritId = spirit.id;
    }

    this.save();
    this.emit('equipmentUpdated', { spirit, item });
    this.emit('inventoryUpdated', this.state.inventory);
    return { success: true, spirit, item };
  }

  unequipItem(spiritId, slotType) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found');
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];

    if (slotType === 'weapon') {
      if (spirit.weapon) {
        const wpn = equipmentList.find(e => e.uid === spirit.weapon);
        if (wpn) wpn.equippedToSpiritId = null;
        spirit.weapon = null;
      }
    } else {
      if (spirit.relics && spirit.relics[slotType]) {
        const relic = equipmentList.find(e => e.uid === spirit.relics[slotType]);
        if (relic) relic.equippedToSpiritId = null;
        spirit.relics[slotType] = null;
      }
    }

    this.save();
    this.emit('equipmentUpdated', { spirit, slotType });
    this.emit('inventoryUpdated', this.state.inventory);
    return { success: true, spirit, slotType };
  }

  dismantleEquipment(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const index = this.state.inventory.equipment.findIndex(e => e.uid === itemUid);
    if (index === -1) throw new Error('Item not found in inventory');

    const item = this.state.inventory.equipment[index];
    if (item.equippedToSpiritId) {
      throw new Error('Cannot dismantle an equipped item! Unequip it first.');
    }

    this.state.inventory.equipment.splice(index, 1);

    let shardsGained = 0;
    let essencesGained = 0;

    if (item.type === 'relic') {
      const stars = item.stars || 3;
      const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
      shardsGained = Math.round(tier.dismantleShards * (1 + (item.level - 1) * 0.15));
      essencesGained = tier.dismantleEssences + Math.floor((item.level - 1) * 1.5);
      this.state.resources.spiritShards += shardsGained;
      this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + essencesGained;
    } else {
      // Weapon dismantle
      shardsGained = Math.round(25 * (item.level || 1));
      this.state.resources.spiritShards += shardsGained;
    }

    this.save();
    this.emit('equipmentDismantled', { item, shardsGained, essencesGained });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, shardsGained, essencesGained };
  }

  enhanceRelic(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const item = this.state.inventory.equipment.find(e => e.uid === itemUid);
    if (!item) throw new Error('Relic not found in inventory');
    if (item.type !== 'relic') throw new Error('Item is not a Relic');

    const stars = item.stars || 3;
    const tier = RELIC_STAR_TIERS[stars] || RELIC_STAR_TIERS[3];
    if (item.level >= tier.maxLevel) {
      throw new Error(`Relic has reached maximum enhancement (+${tier.maxLevel})!`);
    }

    const nextLevel = item.level + 1;
    const shardCost = Math.round(50 * nextLevel * (stars * 0.4));
    const isMilestone = nextLevel % 3 === 0;
    const essenceCost = isMilestone ? Math.round(stars * 2 + nextLevel * 0.5) : 0;

    if (this.state.resources.spiritShards < shardCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${shardCost}, have ${this.state.resources.spiritShards}.`);
    }
    if (essenceCost > 0 && (this.state.resources.essencesOfTheGods || 0) < essenceCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${essenceCost}, have ${this.state.resources.essencesOfTheGods || 0}.`);
    }

    this.state.resources.spiritShards -= shardCost;
    if (essenceCost > 0) {
      this.state.resources.essencesOfTheGods -= essenceCost;
    }

    enhanceRelicData(item);

    this.save();
    this.emit('equipmentUpdated', { item });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, item, shardCost, essenceCost };
  }

  ascendRelic(itemUid) {
    if (!this.state.inventory || !Array.isArray(this.state.inventory.equipment)) return;
    const item = this.state.inventory.equipment.find(e => e.uid === itemUid);
    if (!item) throw new Error('Relic not found in inventory');
    if (item.type !== 'relic') throw new Error('Item is not a Relic');
    if (item.stars !== 5) throw new Error('Only 5★ Relics can be ascended to 6★!');
    if (item.level < 15) throw new Error('Relic must be enhanced to +15 before ascending!');

    const essenceGodCost = 100;
    const soulEssenceCost = 10;

    if ((this.state.resources.essencesOfTheGods || 0) < essenceGodCost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${essenceGodCost}, have ${this.state.resources.essencesOfTheGods || 0}.`);
    }
    if ((this.state.resources.soulEssence || 0) < soulEssenceCost) {
      throw new Error(`Insufficient Soul Essence! Need ${soulEssenceCost}, have ${this.state.resources.soulEssence || 0}.`);
    }

    this.state.resources.essencesOfTheGods -= essenceGodCost;
    this.state.resources.soulEssence -= soulEssenceCost;

    ascendRelicData(item);

    this.save();
    this.emit('equipmentUpdated', { item });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, item };
  }

  upgradeEnergyCapacity() {
    const res = this.state.resources;
    const currentMax = res.maxEnergy || 60;
    if (currentMax >= 500) {
      throw new Error('Energy capacity is already at the maximum limit of 500 ⚡!');
    }

    const tierIndex = Math.floor((currentMax - 60) / 20);
    const costEssence = Math.round(15 * Math.pow(1.18, tierIndex));
    const costSoul = 1 + Math.floor(tierIndex * 0.75); // Linear Astral Essence cost from Tier 1

    if ((res.essencesOfTheGods || 0) < costEssence) {
      throw new Error(`Insufficient Essences of the Gods! Need ${costEssence}, have ${res.essencesOfTheGods || 0}.`);
    }
    if (costSoul > 0 && (res.soulEssence || 0) < costSoul) {
      throw new Error(`Insufficient Astral Essence! Need ${costSoul} 🔮, have ${res.soulEssence || 0} 🔮.`);
    }

    res.essencesOfTheGods -= costEssence;
    if (costSoul > 0) res.soulEssence -= costSoul;

    res.maxEnergy = Math.min(500, currentMax + 20);

    this.save();
    this.emit('resourcesUpdated', res);
    return { success: true, newMaxEnergy: res.maxEnergy, costEssence, costSoul };
  }

  getSpiritTotalMaxHp(spiritOrId) {
    if (!spiritOrId) return 100;
    const spirit = typeof spiritOrId === 'string' ? this.state.spirits.find(s => s.id === spiritOrId) : spiritOrId;
    if (!spirit) return 100;
    let baseHp = spirit.maxHp || 100;
    const equipmentList = (this.state.inventory && this.state.inventory.equipment) || [];
    let percentHpBonus = 0;

    if (spirit.relics) {
      for (const relicUid of Object.values(spirit.relics)) {
        if (!relicUid) continue;
        const relic = equipmentList.find(e => e.uid === relicUid);
        if (relic) {
          if (relic.mainStatName === 'Bonus Max HP') {
            baseHp += (relic.mainStatValue || 0);
          }
          if (Array.isArray(relic.substats)) {
            for (const sub of relic.substats) {
              if (sub.typeId === 'flat_hp') baseHp += (sub.value || 0);
              else if (sub.typeId === 'percent_hp') percentHpBonus += (sub.value || 0);
            }
          }
        }
      }
    }

    const setBonuses = this.getSpiritActiveSetBonuses(spirit);
    for (const b of setBonuses) {
      if (b.bonus.maxHpBonus) percentHpBonus += (b.bonus.maxHpBonus * 100);
    }
    const resonance = this.getPartyElementalResonances();
    if (resonance.maxHpPercent) percentHpBonus += (resonance.maxHpPercent * 100);
    if (resonance.allStatsPercent) percentHpBonus += (resonance.allStatsPercent * 100);

    return Math.round(baseHp * (1 + percentHpBonus / 100));
  }

  // =========================================================================
  // ARTIFACT DUNGEON (THE PANTHEON TRIALS)
  // =========================================================================

  runPantheonTrial(chamberId, tierNum = 1) {
    const chamber = PANTHEON_CHAMBERS.find(c => c.id === chamberId);
    if (!chamber) throw new Error('Invalid Pantheon Chamber selected!');

    const tierObj = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === tierNum);
    if (!tierObj) throw new Error('Invalid difficulty tier selected!');

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    // Deduct energy
    this.state.resources.energy -= tierObj.energyCost;

    // Generate targeted Greek God loot
    const loot = generateDungeonLoot(chamberId, tierNum);

    // Store in inventory
    if (!this.state.inventory) this.state.inventory = { equipment: [] };
    if (!Array.isArray(this.state.inventory.equipment)) this.state.inventory.equipment = [];

    loot.relics.forEach(r => this.state.inventory.equipment.push(r));
    loot.weapons.forEach(w => this.state.inventory.equipment.push(w));

    // Award resources
    this.state.resources.spiritShards += loot.shardsGained;
    this.state.resources.soulEssence += loot.essenceGained;
    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;

    this.save();
    this.emit('dungeonCompleted', loot);
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    return loot;
  }

  // =========================================================================
  // 3-WAVE DUNGEON COMBAT ENGINE (PANTHEON TRIALS & THE DIVINE FORGE)
  // =========================================================================

  generateDungeonWave(dungeonType, chamberId, tierNum, waveNum) {
    let chamber;
    let tierObj;
    if (dungeonType === 'pantheon') {
      chamber = PANTHEON_CHAMBERS.find(c => c.id === chamberId) || PANTHEON_CHAMBERS[0];
      tierObj = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || PANTHEON_DIFFICULTY_TIERS[0];
    } else if (dungeonType === 'essence') {
      chamber = ESSENCE_CHAMBERS.find(c => c.id === chamberId) || ESSENCE_CHAMBERS[0];
      tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || ESSENCE_DIFFICULTY_TIERS[0];
    } else {
      chamber = FORGE_CHAMBERS.find(c => c.id === chamberId) || FORGE_CHAMBERS[0];
      tierObj = FORGE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || FORGE_DIFFICULTY_TIERS[0];
    }

    const targetPower = tierObj.recommendedPower || tierObj.minPartyPower || 1500;
    const baseHp = Math.round(targetPower * 1.6);
    const targetGod = chamber.god || chamber.godTitle || (chamber.godId && GREEK_GOD_SETS[chamber.godId] ? GREEK_GOD_SETS[chamber.godId].god : null) || chamber.name;
    const enemies = [];

    if (waveNum === 1) {
      const namePrefix = dungeonType === 'pantheon' ? `${targetGod} Sentinel` : dungeonType === 'essence' ? `${chamber.name} Sentinel` : 'Cinder Golem';
      const icon = dungeonType === 'pantheon' ? '🛡️' : dungeonType === 'essence' ? '💠' : '🔥';
      enemies.push({
        id: `wave1_e1_${Date.now()}`,
        name: `${namePrefix} Alpha`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(50, Math.round(baseHp * 0.45)),
        hp: Math.max(50, Math.round(baseHp * 0.45)),
        power: Math.max(10, Math.round(targetPower * 0.25)),
        isDefeated: false,
        attackCooldown: 2.0,
        currentCooldown: 1.0
      });
      enemies.push({
        id: `wave1_e2_${Date.now()}`,
        name: `${namePrefix} Beta`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(50, Math.round(baseHp * 0.45)),
        hp: Math.max(50, Math.round(baseHp * 0.45)),
        power: Math.max(10, Math.round(targetPower * 0.25)),
        isDefeated: false,
        attackCooldown: 2.4,
        currentCooldown: 2.0
      });
    } else if (waveNum === 2) {
      const namePrefix = dungeonType === 'pantheon' ? `${targetGod} Guardian` : dungeonType === 'essence' ? `${chamber.name} Warden` : 'Crucible Automaton';
      const icon = dungeonType === 'pantheon' ? '⚡' : dungeonType === 'essence' ? '✨' : '⚙️';
      enemies.push({
        id: `wave2_e1_${Date.now()}`,
        name: `Elite ${namePrefix}`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(80, Math.round(baseHp * 0.75)),
        hp: Math.max(80, Math.round(baseHp * 0.75)),
        power: Math.max(15, Math.round(targetPower * 0.35)),
        isDefeated: false,
        attackCooldown: 1.8,
        currentCooldown: 0.8
      });
      enemies.push({
        id: `wave2_e2_${Date.now()}`,
        name: `${namePrefix} Warden`,
        icon,
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(70, Math.round(baseHp * 0.65)),
        hp: Math.max(70, Math.round(baseHp * 0.65)),
        power: Math.max(12, Math.round(targetPower * 0.3)),
        isDefeated: false,
        attackCooldown: 2.2,
        currentCooldown: 1.5
      });
    } else {
      const bossName = dungeonType === 'pantheon' ? `Avatar of ${targetGod}` : dungeonType === 'essence' ? (chamber.bossName || `${chamber.name} Overlord`) : (chamber.bossName || 'Vulcan Titan');
      const bossIcon = dungeonType === 'pantheon' ? (chamber.sigil || chamber.icon || '🔱') : dungeonType === 'essence' ? (chamber.bossIcon || '👑') : (chamber.bossIcon || '🌋');
      enemies.push({
        id: `wave3_boss_${Date.now()}`,
        name: bossName,
        icon: bossIcon,
        element: chamber.element || 'LIGHT',
        isBoss: true,
        maxHp: Math.max(150, Math.round(baseHp * 1.5)),
        hp: Math.max(150, Math.round(baseHp * 1.5)),
        power: Math.max(25, Math.round(targetPower * 0.5)),
        isDefeated: false,
        attackCooldown: 1.6,
        currentCooldown: 0.5
      });
      enemies.push({
        id: `wave3_attendant_${Date.now()}`,
        name: dungeonType === 'pantheon' ? 'Temple High Priest' : dungeonType === 'essence' ? 'Essence Core Primordial' : 'Forge Overseer',
        icon: '🔮',
        element: chamber.element || 'LIGHT',
        maxHp: Math.max(50, Math.round(baseHp * 0.5)),
        hp: Math.max(50, Math.round(baseHp * 0.5)),
        power: Math.max(10, Math.round(targetPower * 0.28)),
        isDefeated: false,
        attackCooldown: 2.0,
        currentCooldown: 1.8
      });
    }

    return enemies;
  }

  startDungeonTrial(dungeonType, chamberId, tierNum = 1) {
    let tierObj;
    if (dungeonType === 'pantheon') {
      tierObj = PANTHEON_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || PANTHEON_DIFFICULTY_TIERS[0];
    } else if (dungeonType === 'essence') {
      tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || ESSENCE_DIFFICULTY_TIERS[0];
    } else {
      tierObj = FORGE_DIFFICULTY_TIERS.find(t => t.tier === tierNum) || FORGE_DIFFICULTY_TIERS[0];
    }

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    this.state.resources.energy -= tierObj.energyCost;
    this.save();
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    const party = this.getPartySpirits();
    party.forEach(s => {
      s.currentHp = s.maxHp;
      s.currentMp = 0;
      s.shieldHp = 0;
      s.isFallen = false;
    });

    const initialSwarm = this.generateDungeonWave(dungeonType, chamberId, tierNum, 1);

    this.state.activeDungeonBattle = {
      dungeonType,
      chamberId,
      tier: tierNum,
      currentWave: 1,
      maxWaves: 3,
      status: 'active',
      currentSwarm: initialSwarm,
      loot: null
    };

    this.emit('dungeonBattleUpdated', this.state.activeDungeonBattle);
    return this.state.activeDungeonBattle;
  }

  tickDungeonBattle(deltaSec) {
    const battle = this.state.activeDungeonBattle;
    if (!battle || battle.status !== 'active') return;

    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);
    const livingEnemies = (battle.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);

    // Defeat check
    if (livingSpirits.length === 0 && party.length > 0) {
      battle.status = 'defeat';
      this.emit('dungeonBattleUpdated', battle);
      this.emit('dungeonBattleDefeat', battle);
      return;
    }

    // Wave Clear check
    if (livingEnemies.length === 0) {
      if (battle.currentWave < battle.maxWaves) {
        battle.currentWave += 1;
        livingSpirits.forEach(s => {
          s.currentHp = Math.min(s.maxHp, s.currentHp + Math.round(s.maxHp * 0.25));
        });
        battle.currentSwarm = this.generateDungeonWave(battle.dungeonType, battle.chamberId, battle.tier, battle.currentWave);
        this.emit('dungeonBattleUpdated', battle);
        this.emit('dungeonWaveCleared', { wave: battle.currentWave - 1, nextWave: battle.currentWave });
        return;
      } else {
        this.completeDungeonBattleVictory();
        return;
      }
    }

    const leadEnemy = livingEnemies[0];

    // Spirits attack & accumulate MP
    for (const spirit of livingSpirits) {
      const effectivePower = this.getSpiritTotalPower(spirit);
      const baseDps = Math.max(1, Math.round(effectivePower * 0.45));
      const damageThisTick = baseDps * deltaSec;
      leadEnemy.hp = Math.max(0, leadEnemy.hp - damageThisTick);

      const activeBonuses = this.getSpiritActiveSetBonuses(spirit);
      let manaBonusMult = 1;
      for (const b of activeBonuses) {
        if (b.bonus.manaReplenishBonus) {
          manaBonusMult += b.bonus.manaReplenishBonus;
        }
      }
      spirit.currentMp = Math.min(100, (spirit.currentMp || 0) + 20 * manaBonusMult * deltaSec);

      if (spirit.currentMp >= 100) {
        spirit.currentMp = 0;
        this.procSpiritUltimateForDungeon(spirit, battle);
      }
    }

    if (leadEnemy.hp <= 0) {
      leadEnemy.isDefeated = true;
      leadEnemy.hp = 0;
    }

    // Enemies attack living spirits
    for (const enemy of livingEnemies) {
      if (enemy.isDefeated || enemy.hp <= 0) continue;
      enemy.currentCooldown = (enemy.currentCooldown || 0) - deltaSec;
      if (enemy.currentCooldown <= 0) {
        enemy.currentCooldown = enemy.attackCooldown || 2.0;

        const targetSpirit = livingSpirits[Math.floor(Math.random() * livingSpirits.length)];
        if (targetSpirit) {
          let enemyDamage = Math.max(1, Math.round(enemy.power * (0.8 + Math.random() * 0.4)));

          if (targetSpirit.shieldHp > 0) {
            const absorbed = Math.min(targetSpirit.shieldHp, enemyDamage);
            targetSpirit.shieldHp -= absorbed;
            enemyDamage -= absorbed;
          }

          targetSpirit.currentHp = Math.max(0, targetSpirit.currentHp - enemyDamage);
          if (targetSpirit.currentHp <= 0) {
            targetSpirit.isFallen = true;
            targetSpirit.currentHp = 0;
          }
        }
      }
    }

    this.emit('dungeonBattleUpdated', battle);
  }

  procSpiritUltimateForDungeon(spirit, battle) {
    const ult = getSpiritUltimate(spirit.speciesId);
    const livingEnemies = (battle.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);

    let totalDamageDealt = 0;
    let totalHealingDone = 0;

    switch (ult.type) {
      case 'AOE_DAMAGE': {
        const damagePerEnemy = Math.max(1, Math.round(spirit.power * ult.multiplier));
        for (const enemy of livingEnemies) {
          enemy.hp = Math.max(0, enemy.hp - damagePerEnemy);
          totalDamageDealt += damagePerEnemy;
          if (enemy.hp <= 0) {
            enemy.isDefeated = true;
            enemy.hp = 0;
          }
        }
        break;
      }
      case 'SINGLE_TARGET_BURST': {
        const primaryTarget = livingEnemies[0];
        if (primaryTarget) {
          const burstDamage = Math.max(1, Math.round(spirit.power * ult.multiplier));
          primaryTarget.hp = Math.max(0, primaryTarget.hp - burstDamage);
          totalDamageDealt += burstDamage;
          if (primaryTarget.hp <= 0) {
            primaryTarget.isDefeated = true;
            primaryTarget.hp = 0;
          }
        }
        break;
      }
      case 'TEAM_HEAL': {
        const healPerSpirit = Math.max(1, Math.round(spirit.power * ult.multiplier));
        for (const ally of livingSpirits) {
          const actualHeal = Math.min(ally.maxHp - ally.currentHp, healPerSpirit);
          ally.currentHp += actualHeal;
          totalHealingDone += actualHeal;
        }
        break;
      }
      case 'TEAM_SHIELD': {
        const shieldPerSpirit = Math.max(1, Math.round(spirit.power * ult.multiplier));
        for (const ally of livingSpirits) {
          ally.shieldHp = (ally.shieldHp || 0) + shieldPerSpirit;
        }
        break;
      }
      case 'EXECUTE': {
        const lowestHpEnemy = [...livingEnemies].sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
        if (lowestHpEnemy) {
          const isExecuteThreshold = (lowestHpEnemy.hp / lowestHpEnemy.maxHp) <= ult.threshold;
          const mult = isExecuteThreshold ? ult.multiplier * 2 : ult.multiplier;
          const execDamage = Math.max(1, Math.round(spirit.power * mult));
          lowestHpEnemy.hp = Math.max(0, lowestHpEnemy.hp - execDamage);
          totalDamageDealt += execDamage;
          if (lowestHpEnemy.hp <= 0) {
            lowestHpEnemy.isDefeated = true;
            lowestHpEnemy.hp = 0;
          }
        }
        break;
      }
    }

    this.emit('ultimateCast', {
      spirit,
      ult,
      totalDamageDealt,
      totalHealingDone
    });
  }

  manualDungeonStrike() {
    const battle = this.state.activeDungeonBattle;
    if (!battle || battle.status !== 'active') return;

    const livingEnemies = (battle.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    if (livingEnemies.length === 0) return;

    const leadEnemy = livingEnemies[0];
    const party = this.getPartySpirits();
    const livingSpirits = party.filter(s => !s.isFallen && s.currentHp > 0);

    const totalPartyPower = livingSpirits.reduce((sum, s) => sum + this.getSpiritTotalPower(s), 0);
    const tapDamage = Math.max(1, Math.round(totalPartyPower * (0.35 + Math.random() * 0.2)));

    leadEnemy.hp = Math.max(0, leadEnemy.hp - tapDamage);
    if (leadEnemy.hp <= 0) {
      leadEnemy.isDefeated = true;
      leadEnemy.hp = 0;
    }

    livingSpirits.forEach(s => {
      s.currentMp = Math.min(100, (s.currentMp || 0) + 10);
      if (s.currentMp >= 100) {
        s.currentMp = 0;
        this.procSpiritUltimateForDungeon(s, battle);
      }
    });

    this.emit('dungeonBattleUpdated', battle);
  }

  completeDungeonBattleVictory() {
    const battle = this.state.activeDungeonBattle;
    if (!battle) return;

    battle.status = 'victory';

    let loot;
    if (battle.dungeonType === 'pantheon') {
      loot = generateDungeonLoot(battle.chamberId, battle.tier);
    } else if (battle.dungeonType === 'essence') {
      loot = generateEssenceLoot(battle.chamberId, battle.tier);
    } else {
      loot = generateForgeLoot(battle.chamberId, battle.tier);
    }

    battle.loot = loot;

    if (!this.state.inventory) this.state.inventory = { equipment: [] };
    if (!Array.isArray(this.state.inventory.equipment)) this.state.inventory.equipment = [];

    if (loot.relics) {
      loot.relics.forEach(r => this.state.inventory.equipment.push(r));
    }
    if (loot.weapons) {
      loot.weapons.forEach(w => this.state.inventory.equipment.push(w));
    }
    if (loot.godEssencesGained) {
      this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + loot.godEssencesGained;
    }
    if (loot.soulEssenceGained) {
      this.state.resources.soulEssence += loot.soulEssenceGained;
    } else if (loot.essenceGained) {
      this.state.resources.soulEssence += loot.essenceGained;
    }

    this.state.resources.spiritShards += loot.shardsGained;
    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;

    this.getPartySpirits().forEach(s => {
      s.currentHp = s.maxHp;
      s.currentMp = 0;
      s.shieldHp = 0;
      s.isFallen = false;
    });

    this.save();
    this.emit('dungeonBattleVictory', { loot, battle });
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('resourcesUpdated', this.state.resources);
    this.emit('dungeonBattleUpdated', battle);
  }

  runEssenceDungeon(chamberId, tierNum = 1) {
    const chamber = ESSENCE_CHAMBERS.find(c => c.id === chamberId);
    if (!chamber) throw new Error('Invalid Essence Chamber selected!');

    const tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum);
    if (!tierObj) throw new Error('Invalid difficulty tier selected!');

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    this.state.resources.energy -= tierObj.energyCost;
    const loot = generateEssenceLoot(chamberId, tierNum);

    this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + loot.godEssencesGained;
    this.state.resources.soulEssence += loot.soulEssenceGained;
    this.state.resources.spiritShards += loot.shardsGained;
    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;

    this.save();
    this.emit('dungeonCompleted', loot);
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });
    this.emit('resourcesUpdated', this.state.resources);

    return loot;
  }

  applyTemporaryBlessing(blessingId) {
    const ALIASES = {
      ares_blessing: 'blessing_ares',
      athena_blessing: 'blessing_athena',
      hermes_blessing: 'blessing_hermes',
      zeus_blessing: 'blessing_zeus',
      poseidon_blessing: 'blessing_poseidon'
    };
    const key = ALIASES[blessingId] || blessingId;

    const BLESSINGS = {
      blessing_ares: { id: 'blessing_ares', name: 'Blessing of Ares', icon: '⚔️', cost: 10, durationSec: 3600, desc: '+20% Party DMG & +10% Crit Rate' },
      blessing_athena: { id: 'blessing_athena', name: 'Blessing of Athena', icon: '🛡️', cost: 10, durationSec: 3600, desc: '+25% Max HP & +20% Shield' },
      blessing_hermes: { id: 'blessing_hermes', name: 'Blessing of Hermes', icon: '🪽', cost: 10, durationSec: 3600, desc: '+30% Shards & Drops in Madness Zone' },
      blessing_zeus: { id: 'blessing_zeus', name: 'Blessing of Zeus', icon: '⚡', cost: 15, durationSec: 3600, desc: '+20% Crit Rate & +15% Lightning Surge' },
      blessing_poseidon: { id: 'blessing_poseidon', name: 'Blessing of Poseidon', icon: '🌊', cost: 15, durationSec: 3600, desc: '+35% Tidal Shard Abundance' }
    };

    const b = BLESSINGS[key];
    if (!b) throw new Error('Invalid Blessing selected!');

    if ((this.state.resources.essencesOfTheGods || 0) < b.cost) {
      throw new Error(`Insufficient Essences of the Gods! Need ${b.cost} 💠, have ${this.state.resources.essencesOfTheGods || 0} 💠.`);
    }

    this.state.resources.essencesOfTheGods -= b.cost;
    if (!this.state.activeBlessings) this.state.activeBlessings = {};
    this.state.activeBlessings[key] = {
      id: b.id,
      name: b.name,
      icon: b.icon,
      expiresAt: Date.now() + b.durationSec * 1000
    };

    this.save();
    this.emit('blessingsUpdated', this.state.activeBlessings);
    this.emit('resourcesUpdated', this.state.resources);
    return { success: true, blessing: this.state.activeBlessings[blessingId] };
  }

  getActiveBlessings() {
    const now = Date.now();
    const active = {};
    if (this.state.activeBlessings) {
      for (const [id, b] of Object.entries(this.state.activeBlessings)) {
        if (b.expiresAt > now) {
          active[id] = { ...b, remainingSec: Math.round((b.expiresAt - now) / 1000) };
        }
      }
    }
    return active;
  }

  tickBlessings() {
    if (!this.state.activeBlessings) return;
    const now = Date.now();
    let changed = false;
    for (const [id, b] of Object.entries(this.state.activeBlessings)) {
      if (b.expiresAt <= now) {
        delete this.state.activeBlessings[id];
        changed = true;
      }
    }
    if (changed) {
      this.emit('blessingsUpdated', this.state.activeBlessings);
    }
  }

  addExperienceToSpirit(spirit, gainedXp) {
    if (!spirit || gainedXp <= 0) return 0;
    const species = SPIRIT_SPECIES[spirit.speciesId];
    if (!species) return 0;

    const initialLevel = spirit.level;
    spirit.xp = (spirit.xp || 0) + gainedXp;
    let reqXp = getXpRequiredForLevel(spirit.level);

    while (spirit.xp >= reqXp && spirit.level < (species.levelCap || 100)) {
      spirit.xp -= reqXp;
      spirit.level += 1;
      spirit.power = calculateSpiritPower(species, spirit.level, spirit.rarity);
      const newMaxHp = calculateSpiritMaxHp(species, spirit.level, spirit.rarity);
      const hpBonus = newMaxHp - (spirit.maxHp || newMaxHp);
      spirit.maxHp = newMaxHp;
      spirit.currentHp = Math.min(spirit.maxHp, (spirit.currentHp || newMaxHp) + Math.max(0, hpBonus));
      spirit.isFallen = false;

      if (spirit.level >= (species.levelCap || 100)) {
        spirit.xp = reqXp;
        if (species.evolutions && species.evolutions.length > 0) {
          spirit.canEvolve = true;
        }
        this.emit('spiritLevelCapped', spirit);
        break;
      }

      this.emit('spiritLeveledUp', spirit);
      reqXp = getXpRequiredForLevel(spirit.level);
    }

    return spirit.level - initialLevel;
  }

  buyExpPotion(arg1, arg2) {
    const POTIONS = {
      lesser_elixir: { id: 'lesser_elixir', name: 'Lesser Astral Elixir', icon: '🧪', xp: 10000, shardCost: 0, essenceGodCost: 5, soulEssenceCost: 1 },
      grand_elixir: { id: 'grand_elixir', name: 'Grand Astral Elixir', icon: '⚗️', xp: 50000, shardCost: 0, essenceGodCost: 15, soulEssenceCost: 3 },
      divine_ambrosia: { id: 'divine_ambrosia', name: 'Divine Ambrosia', icon: '🏺', xp: 250000, shardCost: 0, essenceGodCost: 40, soulEssenceCost: 10 }
    };

    const potionId = POTIONS[arg1] ? arg1 : arg2;
    const targetSpiritId = POTIONS[arg1] ? arg2 : arg1;

    const pot = POTIONS[potionId];
    if (!pot) throw new Error('Invalid EXP Potion!');

    const spirit = this.state.spirits.find(s => s.id === targetSpiritId);
    if (!spirit) throw new Error('Target Spirit not found in collection!');

    const res = this.state.resources;
    if ((res.soulEssence || 0) < pot.soulEssenceCost) throw new Error(`Insufficient Astral Essence! Need ${pot.soulEssenceCost} 🔮, have ${res.soulEssence || 0} 🔮.`);
    if ((res.essencesOfTheGods || 0) < pot.essenceGodCost) throw new Error(`Insufficient Essences of the Gods! Need ${pot.essenceGodCost} 💠, have ${res.essencesOfTheGods || 0} 💠.`);

    if (pot.soulEssenceCost > 0) res.soulEssence -= pot.soulEssenceCost;
    if (pot.essenceGodCost > 0) res.essencesOfTheGods -= pot.essenceGodCost;

    const initialLevel = spirit.level;
    this.addExperienceToSpirit(spirit, pot.xp);
    this.save();
    this.emit('spiritLeveled', { spirit, levelUps: spirit.level - initialLevel });
    this.emit('resourcesUpdated', res);

    return { success: true, spirit, xpGained: pot.xp, levelUps: spirit.level - initialLevel };
  }

  exitDungeonBattle() {
    this.state.activeDungeonBattle = null;
    this.getPartySpirits().forEach(s => {
      s.currentHp = s.maxHp;
      s.currentMp = 0;
      s.shieldHp = 0;
      s.isFallen = false;
    });
    this.save();
    this.emit('dungeonBattleExited');
  }

  runForgeDungeon(chamberId, tierNum = 1) {
    const chamber = FORGE_CHAMBERS.find(c => c.id === chamberId);
    if (!chamber) throw new Error('Invalid Forge Chamber selected!');

    const tierObj = FORGE_DIFFICULTY_TIERS.find(t => t.tier === tierNum);
    if (!tierObj) throw new Error('Invalid difficulty tier selected!');

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    this.state.resources.energy -= tierObj.energyCost;
    const loot = generateForgeLoot(chamberId, tierNum);

    if (!this.state.inventory) this.state.inventory = { equipment: [] };
    if (!Array.isArray(this.state.inventory.equipment)) this.state.inventory.equipment = [];

    loot.weapons.forEach(w => this.state.inventory.equipment.push(w));

    this.state.resources.spiritShards += loot.shardsGained;
    this.state.resources.soulEssence += loot.essenceGained;
    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;

    this.save();
    this.emit('dungeonCompleted', loot);
    this.emit('inventoryUpdated', this.state.inventory);
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    return loot;
  }

  runEssenceDungeon(chamberId, tierNum = 1) {
    const chamber = ESSENCE_CHAMBERS.find(c => c.id === chamberId);
    if (!chamber) throw new Error('Invalid Essence Chamber selected!');

    const tierObj = ESSENCE_DIFFICULTY_TIERS.find(t => t.tier === tierNum);
    if (!tierObj) throw new Error('Invalid difficulty tier selected!');

    if (this.state.resources.energy < tierObj.energyCost) {
      throw new Error(`Insufficient Energy! Need ${tierObj.energyCost} ⚡, have ${this.state.resources.energy} ⚡.`);
    }

    this.state.resources.energy -= tierObj.energyCost;
    const loot = generateEssenceLoot(chamberId, tierNum);

    this.state.resources.essencesOfTheGods = (this.state.resources.essencesOfTheGods || 0) + loot.godEssencesGained;
    this.state.resources.soulEssence = (this.state.resources.soulEssence || 0) + loot.soulEssenceGained;
    this.state.resources.spiritShards = (this.state.resources.spiritShards || 0) + loot.shardsGained;

    this.state.stats.shardsEarnedTotal += loot.shardsGained;
    this.state.stats.totalDungeonRuns = (this.state.stats.totalDungeonRuns || 0) + 1;

    this.save();
    this.emit('dungeonCompleted', loot);
    this.emit('resourcesUpdated', this.state.resources);
    this.emit('energyGained', { current: this.state.resources.energy, max: this.state.resources.maxEnergy });

    return {
      ...loot,
      essencesAwarded: loot.godEssencesGained,
      soulEssenceAwarded: loot.soulEssenceGained
    };
  }
}

export const gameState = new GameStateManager();


