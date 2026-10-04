import { 
  SPIRIT_SPECIES, 
  CONTRACT_POOLS_BY_RARITY,
  rollContractSpirit,
  rollAstralContractSpirit,
  getXpRequiredForLevel, 
  calculateSpiritPower,
  calculateSpiritMaxHp,
  getSpiritUltimate
} from '../data/spiritsData.js';
import { getEnemyForStage, getSwarmForStage } from '../data/madnessZoneData.js';

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
    const starterSpirit = {
      id: starterId,
      speciesId: starterSpecies.id,
      customName: starterSpecies.name,
      level: 1,
      xp: 0,
      tier: 1,
      rarity: starterSpecies.baseRarity,
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
      contractedAt: Date.now()
    };

    return {
      version: 2,
      last_saved: Date.now(),
      resources: {
        spiritShards: 300, // Enough for 3 summons right away!
        soulEssence: 0,
        energy: 60,        // Max 60 Energy base
        maxEnergy: 60,
        energySecondsAccumulator: 0,
        resonanceTier: 0    // Essence upgrade: permanent +5% power per tier
      },
      spirits: [starterSpirit],
      party: [starterId], // Max 5 active spirits
      hallOfFame: [starterId], // Max 5 showcase spirits
      discoveredSpeciesIds: [starterSpecies.id], // Spirit Compendium
      madnessZone: {
        stage: 1,
        subStage: 1,
        unlockedStages: [1],      // Floor 1 is unlocked initially
        highestStageUnlocked: 1,
        highestStageCleared: 1,
        autoAdvance: true,
        farmMode: false,
        currentSwarm: [],
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

    // Ensure energy properties exist
    if (typeof state.resources.energy !== 'number') {
      state.resources.energy = base.resources.energy;
    }
    if (typeof state.resources.maxEnergy !== 'number') {
      state.resources.maxEnergy = base.resources.maxEnergy;
    }
    if (typeof state.resources.energySecondsAccumulator !== 'number') {
      state.resources.energySecondsAccumulator = 0;
    }

    // Ensure unlocked stages exist
    if (!Array.isArray(state.madnessZone.unlockedStages) || state.madnessZone.unlockedStages.length === 0) {
      state.madnessZone.unlockedStages = [1];
    }
    if (!state.madnessZone.highestStageUnlocked) {
      state.madnessZone.highestStageUnlocked = Math.max(...state.madnessZone.unlockedStages, 1);
    }

    // Graceful migration of old spirit species if needed
    state.spirits.forEach(s => {
      if (!SPIRIT_SPECIES[s.speciesId]) {
        s.speciesId = 'cat_spirit';
        s.customName = 'Cat Spirit';
      }
      const species = SPIRIT_SPECIES[s.speciesId];
      if (species) {
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
    const estimatedKills = Math.floor(cappedSeconds / killTimeSec);
    const offlineShards = Math.round(estimatedKills * sampleEnemy.shardReward * 0.25);
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

  /**
   * Madness Zone Two-Way Combat Loop
   * Living spirits attack living swarm enemies & accumulate Mana
   * At 100 MP, spirits unleash Ultimates (AoE, Heals, Shields, Executes)
   * Enemies fight back on cooldowns, damaging spirits
   * Revives whole party on Floor Boss Victory; Resets to Wave 1 on Party Wipeout
   */
  tickMadnessCombat(deltaSec) {
    const { madnessZone } = this.state;
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

    // 3. Spirits Attack & Mana Accumulation
    for (const spirit of livingSpirits) {
      // Basic DPS contribution
      const baseDps = Math.max(1, Math.round(spirit.power * 0.45));
      const damageThisTick = baseDps * deltaSec;
      leadEnemy.hp = Math.max(0, leadEnemy.hp - damageThisTick);

      // Mana Accumulation: ~20 MP per second (Procs Ult in ~5 seconds)
      spirit.currentMp = Math.min(spirit.maxMp || 100, (spirit.currentMp || 0) + (20 * deltaSec));

      // Trigger Ultimate at 100 MP
      if (spirit.currentMp >= 100) {
        spirit.currentMp = 0;
        this.procSpiritUltimate(spirit);
      }

      // Check if lead enemy died from basic attack
      if (leadEnemy.hp <= 0 && !leadEnemy.isDefeated) {
        this.onIndividualEnemyKilled(leadEnemy);
        break;
      }
    }

    // Keep currentEnemy in sync with lead living enemy
    madnessZone.currentEnemy = livingEnemies.find(e => !e.isDefeated && e.hp > 0) || null;

    // 4. Enemies Fight Back (Counter-attacks on cooldown timers)
    for (const enemy of livingEnemies) {
      if (enemy.hp <= 0 || enemy.isDefeated) continue;

      enemy.attackTimer = (enemy.attackTimer || 2.0) - deltaSec;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.attackCooldown || 2.4;

        // Counter-attack the lead living spirit
        const targetSpirit = livingSpirits[0];
        if (targetSpirit) {
          let enemyDamage = Math.max(1, Math.round(enemy.power * (0.8 + Math.random() * 0.35)));

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

    // Check if the entire swarm is defeated
    const remaining = (this.state.madnessZone.currentSwarm || []).filter(e => !e.isDefeated && e.hp > 0);
    if (remaining.length === 0) {
      this.onSwarmCleared();
    } else {
      this.state.madnessZone.currentEnemy = remaining[0];
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
      mz.highestStageCleared = Math.max(mz.highestStageCleared, mz.stage);

      // Floor Victory: Revive ALL party spirits to 100% HP!
      const party = this.getPartySpirits();
      party.forEach(s => {
        s.currentHp = s.maxHp;
        s.isFallen = false;
        s.shieldHp = 0;
      });
      this.emit('partyRevived', { reason: 'floor_victory' });

      // Unlock next stage permanently
      const nextStage = mz.stage + 1;
      if (!mz.unlockedStages.includes(nextStage)) {
        mz.unlockedStages.push(nextStage);
        mz.unlockedStages.sort((a, b) => a - b);
      }
      mz.highestStageUnlocked = Math.max(mz.highestStageUnlocked, nextStage);

      if (mz.autoAdvance && !mz.farmMode) {
        mz.stage = nextStage;
        mz.subStage = 1;
      } else {
        mz.subStage = 1;
      }
      this.emit('floorCleared', { stage: mz.stage });
    } else {
      mz.subStage += 1;
    }

    this.spawnMadnessEnemy();
    this.emit('madnessZoneUpdated', mz);
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

    // Energy cost check
    if (res.energy < ENERGY_ENTRY_COST) {
      throw new Error(`Insufficient Energy! Tackling Floor ${targetStage} costs ${ENERGY_ENTRY_COST} ⚡ (Current: ${res.energy} ⚡). Energy recovers 1 per 30s.`);
    }

    // Deduct energy and unlock floor permanently
    res.energy -= ENERGY_ENTRY_COST;
    mz.unlockedStages.push(targetStage);
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

  setStage(stage) {
    const mz = this.state.madnessZone;
    if (!mz.unlockedStages.includes(stage)) {
      throw new Error(`Floor ${stage} is locked! Unlock it with ${ENERGY_ENTRY_COST} ⚡ Energy first.`);
    }
    mz.stage = stage;
    mz.subStage = 1;
    this.spawnMadnessEnemy();
    this.emit('madnessZoneUpdated', mz);
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
  contractSpirit(count = 1) {
    const singleCost = 100;
    const totalCost = count === 10 ? 950 : singleCost * count;

    if (this.state.resources.spiritShards < totalCost) {
      throw new Error(`Insufficient Spirit Shards! Need ${totalCost}, have ${this.state.resources.spiritShards}.`);
    }

    this.state.resources.spiritShards -= totalCost;

    const newSpirits = [];

    for (let i = 0; i < count; i++) {
      const rolled = rollContractSpirit();
      const species = SPIRIT_SPECIES[rolled.speciesId];

      const spirit = {
        id: this.generateId(),
        speciesId: species.id,
        customName: species.name,
        level: 1,
        xp: 0,
        tier: 1,
        rarity: rolled.rarityTier,
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

    this.state.stats.totalSpiritsContracted += count;
    this.save();

    this.emit('spiritsContracted', { spirits: newSpirits, cost: totalCost });
    return newSpirits;
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
    if (!Array.isArray(spiritIds) || spiritIds.length === 0) return { count: 0, shardsGained: 0 };

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
    return { count, shardsGained: totalShardsGained };
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
}

export const gameState = new GameStateManager();
