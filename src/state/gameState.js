import { 
  SPIRIT_SPECIES, 
  CONTRACT_BASE_POOL, 
  getXpRequiredForLevel, 
  calculateSpiritPower 
} from '../data/spiritsData.js';
import { getEnemyForStage } from '../data/madnessZoneData.js';

const SAVE_KEY = 'spirit_contract_evo_idle_save_v1';
const AUTO_SAVE_INTERVAL_MS = 5000;

class GameStateManager {
  constructor() {
    this.state = null;
    this.subscribers = new Set();
    this.saveTimer = null;
    this.gameLoopTimer = null;
    this.combatTickTimer = null;
    this.lastTickTime = Date.now();
  }

  /**
   * Subscribe to state change notifications
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
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
    const rawSaved = localStorage.getItem(SAVE_KEY);
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
    // Trigger offline welcome if away for more than 4 seconds
    if (offlineSeconds >= 4) {
      offlineReport = this.applyOfflineGains(offlineSeconds);
    }

    // Ensure Madness Zone current enemy is active
    if (!this.state.madnessZone.currentEnemy) {
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
        const refocusOfflineSec = Math.max(0, Math.floor((refocusNow - this.lastTickTime) / 1000));
        if (refocusOfflineSec >= 5) {
          const refocusReport = this.applyOfflineGains(refocusOfflineSec);
          if (refocusReport) {
            this.emit('offlineGains', refocusReport);
          }
        }
        this.lastTickTime = refocusNow;
      }
    });

    return offlineReport;
  }

  /**
   * Generates default starting game state
   */
  getInitialState() {
    const starterId = this.generateId();
    const starterSpecies = SPIRIT_SPECIES['ignis_wisp'];
    const starterSpirit = {
      id: starterId,
      speciesId: starterSpecies.id,
      customName: starterSpecies.name,
      level: 1,
      xp: 0,
      tier: 1,
      rarity: 'common',
      power: calculateSpiritPower(starterSpecies, 1, 'common'),
      isEquipped: true,
      canEvolve: false,
      evolutionHistory: [starterSpecies.name],
      contractedAt: Date.now()
    };

    return {
      version: 1,
      last_saved: Date.now(),
      resources: {
        spiritShards: 300, // Enough for 3 summons right away!
        soulEssence: 0
      },
      spirits: [starterSpirit],
      party: [starterId], // Max 5 active spirits
      madnessZone: {
        stage: 1,
        subStage: 1,
        highestStageCleared: 1,
        autoAdvance: true,
        farmMode: false,
        currentEnemy: null,
        combatTickProgress: 0
      },
      stats: {
        totalOfflineTimeSec: 0,
        totalSpiritsContracted: 1,
        totalEvolutions: 0,
        totalEnemiesDefeated: 0,
        shardsEarnedTotal: 0
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
      spirits: loaded.spirits || [],
      party: loaded.party || []
    };

    // Recalculate power and evolution flags for loaded spirits
    state.spirits.forEach(s => {
      const species = SPIRIT_SPECIES[s.speciesId];
      if (species) {
        s.power = calculateSpiritPower(species, s.level, s.rarity);
        s.canEvolve = s.level >= species.levelCap && species.evolutions && species.evolutions.length > 0;
      }
    });

    // Make sure party doesn't exceed 5
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
   * Adds XP to the 5 active Spirits every second
   */
  startGameLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    let lastSecondTime = performance.now();
    let lastFrameTime = performance.now();

    const loop = (timestamp) => {
      // 1. Every second: add XP to the 5 active Spirits
      if (timestamp - lastSecondTime >= 1000) {
        const secondsPassed = Math.floor((timestamp - lastSecondTime) / 1000);
        lastSecondTime = timestamp;
        this.tickAfkTraining(secondsPassed);
        this.emit('secondTick', { seconds: secondsPassed });
      }

      // 2. Smooth frame tick for combat and visual responsiveness
      const frameDeltaSec = Math.min(0.2, (timestamp - lastFrameTime) / 1000);
      lastFrameTime = timestamp;
      this.tickMadnessCombat(frameDeltaSec);

      this.emit('tick', { frameDeltaSec });
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Click-to-fight action: strike the enemy using the Active Party's combined power
   */
  attackEnemyWithPartyPower() {
    const mz = this.state.madnessZone;
    if (!mz.currentEnemy) {
      this.spawnMadnessEnemy();
      return { damage: 0, killed: false };
    }

    const enemy = mz.currentEnemy;
    const combinedPartyPower = Math.max(1, this.getTotalPartyPower());
    const damageDealt = combinedPartyPower;

    enemy.hp = Math.max(0, enemy.hp - damageDealt);
    const killed = enemy.hp <= 0;

    this.emit('partyAttack', {
      damage: damageDealt,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.maxHp,
      killed
    });

    if (killed) {
      this.onEnemyDefeated(enemy);
    }

    return { damage: damageDealt, killed };
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
   * Offline XP & Resources Calculation when reopening the app
   */
  applyOfflineGains(elapsedSeconds) {
    // Max cap: 7 days offline
    const cappedSeconds = Math.min(elapsedSeconds, 86400 * 7);
    const xpRate = this.getXpGainRate();
    const totalOfflineXp = xpRate * cappedSeconds;

    const partySpirits = this.getPartySpirits();
    const levelUps = [];
    const readyToEvolve = [];

    // Distribute offline XP to equipped spirits
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

      if (spirit.level > initialLevel) {
        levelUps.push({
          spiritId: spirit.id,
          name: spirit.customName,
          oldLevel: initialLevel,
          newLevel: spirit.level
        });
      }
    }

    // Offline Madness Zone combat farming
    const partyPower = this.getTotalPartyPower();
    const farmStage = this.state.madnessZone.farmMode 
      ? Math.max(1, this.state.madnessZone.stage - 1)
      : this.state.madnessZone.stage;

    const sampleEnemy = getEnemyForStage(farmStage, 3);
    const killTimeSec = Math.max(2, (sampleEnemy.power / Math.max(1, partyPower)) * 4);
    const estimatedKills = Math.floor(cappedSeconds / killTimeSec);
    const offlineShards = Math.round(estimatedKills * sampleEnemy.shardReward * 0.7);
    const offlineEssence = Math.floor(estimatedKills / 15);

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
      partyCount: partySpirits.length
    };
  }

  /**
   * Madness Zone Combat Math Loop
   */
  tickMadnessCombat(deltaSec) {
    const { madnessZone } = this.state;
    if (!madnessZone.currentEnemy) {
      this.spawnMadnessEnemy();
      return;
    }

    const enemy = madnessZone.currentEnemy;
    const partyPower = this.getTotalPartyPower();

    // Mathematical comparison: Party Total Power vs. Madness Enemy Power
    // DPS ratio: If party is 2x enemy power, enemy falls very quickly.
    // If party is equal, takes standard ~4 seconds.
    // If party is lower, takes longer.
    const partyPowerRatio = partyPower / Math.max(1, enemy.power);
    
    // Effective damage per second dealt to corrupted enemy
    const baseDps = enemy.maxHp / 4.0;
    const actualDps = Math.max(1, baseDps * Math.min(6, Math.max(0.2, partyPowerRatio)));
    const damageThisTick = actualDps * deltaSec;

    enemy.hp = Math.max(0, enemy.hp - damageThisTick);

    // If enemy defeated
    if (enemy.hp <= 0) {
      this.onEnemyDefeated(enemy);
    }
  }

  spawnMadnessEnemy() {
    const { stage, subStage } = this.state.madnessZone;
    this.state.madnessZone.currentEnemy = getEnemyForStage(stage, subStage);
    this.emit('enemySpawned', this.state.madnessZone.currentEnemy);
  }

  onEnemyDefeated(enemy) {
    const shardsGained = enemy.shardReward;
    const essenceGained = enemy.essenceReward;

    this.state.resources.spiritShards += shardsGained;
    this.state.resources.soulEssence += essenceGained;
    this.state.stats.shardsEarnedTotal += shardsGained;
    this.state.stats.totalEnemiesDefeated += 1;

    this.emit('enemyDefeated', {
      enemy,
      shardsGained,
      essenceGained
    });

    const mz = this.state.madnessZone;

    if (mz.subStage >= 5) {
      // Zone Boss Defeated!
      mz.highestStageCleared = Math.max(mz.highestStageCleared, mz.stage);

      if (mz.autoAdvance && !mz.farmMode) {
        mz.stage += 1;
        mz.subStage = 1;
      } else {
        // Loop current stage boss or wave
        mz.subStage = 1;
      }
    } else {
      mz.subStage += 1;
    }

    this.spawnMadnessEnemy();
  }

  toggleAutoAdvance() {
    this.state.madnessZone.autoAdvance = !this.state.madnessZone.autoAdvance;
    this.emit('madnessZoneUpdated', this.state.madnessZone);
  }

  toggleFarmMode() {
    this.state.madnessZone.farmMode = !this.state.madnessZone.farmMode;
    // If farm mode turned on and stage > 1, drop to stage - 1 for high-speed shard grinding
    this.emit('madnessZoneUpdated', this.state.madnessZone);
  }

  setStage(stage) {
    if (stage < 1 || stage > this.state.madnessZone.highestStageCleared + 1) return;
    this.state.madnessZone.stage = stage;
    this.state.madnessZone.subStage = 1;
    this.spawnMadnessEnemy();
    this.emit('madnessZoneUpdated', this.state.madnessZone);
  }

  /**
   * RNG Evolution System
   * Evaluates branch table odds (e.g. 80% Common Variant, 20% Rare Variant)
   */
  evolveSpirit(spiritId) {
    const spirit = this.state.spirits.find(s => s.id === spiritId);
    if (!spirit) throw new Error('Spirit not found');

    const currentSpecies = SPIRIT_SPECIES[spirit.speciesId];
    if (!currentSpecies) throw new Error('Species data missing');

    if (!spirit.canEvolve || !currentSpecies.evolutions || currentSpecies.evolutions.length === 0) {
      throw new Error('This Spirit is not eligible for evolution yet.');
    }

    // RNG Branch Roll
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
    const isRare = chosenBranch.variant.toLowerCase().includes('rare') || 
                  chosenBranch.variant.toLowerCase().includes('mythic') ||
                  chosenBranch.variant.toLowerCase().includes('supreme');

    // Apply Evolution
    spirit.speciesId = nextSpecies.id;
    spirit.customName = nextSpecies.name;
    spirit.tier = nextSpecies.tier;
    spirit.level = 1; // Resets to Lv 1 of new Tier for high-ceiling AFK progression
    spirit.xp = 0;
    spirit.canEvolve = false;
    spirit.rarity = isRare ? 'rare' : 'common';
    spirit.power = calculateSpiritPower(nextSpecies, spirit.level, spirit.rarity);
    spirit.evolutionHistory.push(nextSpecies.name);

    this.state.stats.totalEvolutions += 1;
    this.save();

    const result = {
      spiritId: spirit.id,
      spirit,
      oldSpecies: currentSpecies,
      newSpecies: nextSpecies,
      variantName: chosenBranch.variant,
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
   */
  contractSpirit(count = 1) {
    const singleCost = 100;
    const totalCost = count === 10 ? 950 : singleCost * count;

    if (this.state.resources.spiritShards < totalCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${totalCost}, have ${this.state.resources.spiritShards}.`);
    }

    this.state.resources.spiritShards -= totalCost;

    const newSpirits = [];

    for (let i = 0; i < count; i++) {
      // Pick random base species
      const randomIndex = Math.floor(Math.random() * CONTRACT_BASE_POOL.length);
      const speciesId = CONTRACT_BASE_POOL[randomIndex];
      const species = SPIRIT_SPECIES[speciesId];

      // Small 10% chance to summon with an innate "Blessed" Rare IV boost
      const isLucky = Math.random() < 0.10;
      const rarity = isLucky ? 'rare' : 'common';

      const spirit = {
        id: this.generateId(),
        speciesId: species.id,
        customName: isLucky ? `${species.name} ⭐` : species.name,
        level: 1,
        xp: 0,
        tier: 1,
        rarity,
        power: calculateSpiritPower(species, 1, rarity),
        isEquipped: false,
        canEvolve: false,
        evolutionHistory: [species.name],
        contractedAt: Date.now()
      };

      // Auto-equip if party has available slot (< 5)
      if (this.state.party.length < 5) {
        spirit.isEquipped = true;
        this.state.party.push(spirit.id);
      }

      this.state.spirits.unshift(spirit);
      newSpirits.push(spirit);
    }

    this.state.stats.totalSpiritsContracted += count;
    this.save();

    this.emit('spiritsContracted', { spirits: newSpirits, cost: totalCost });
    return newSpirits;
  }

  /**
   * Party Management (Max 5 Spirits)
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
    return party.reduce((sum, s) => sum + s.power, 0);
  }

  /**
   * Release/Dispel Spirit for refund shards
   */
  releaseSpirit(spiritId) {
    if (this.state.party.includes(spiritId)) {
      throw new Error('Cannot release an equipped party Spirit. Unequip it first.');
    }

    const idx = this.state.spirits.findIndex(s => s.id === spiritId);
    if (idx === -1) return 0;

    const spirit = this.state.spirits[idx];
    const shardsGained = 40 * spirit.tier + Math.floor(spirit.level * 3);

    this.state.spirits.splice(idx, 1);
    this.state.resources.spiritShards += shardsGained;
    this.save();

    this.emit('spiritReleased', { spiritId, shardsGained });
    return shardsGained;
  }

  resetAllProgress() {
    localStorage.removeItem(SAVE_KEY);
    this.state = this.getInitialState();
    this.spawnMadnessEnemy();
    this.save();
    this.emit('gameReset');
  }

  generateId() {
    return 'sp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }
}

export const gameState = new GameStateManager();
