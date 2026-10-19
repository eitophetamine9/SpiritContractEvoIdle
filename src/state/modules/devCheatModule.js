import { authService } from '../../services/authService.js';
import { SPIRIT_SPECIES } from '../../data/spiritsData.js';
import { getFeaturesUnlockedAtLevel } from '../../data/contractorData.js';

export const devCheatMethods = {
  /**
   * Helper to verify if caller is logged into the admin/dev account
   */
  isDevAuthorized() {
    return Boolean(authService && typeof authService.isAdmin === 'function' && authService.isAdmin());
  },

  /**
   * Skip through Madness Zone floors
   * @param {number} targetFloor - Target floor number or relative delta
   * @param {boolean} isRelative - If true, adds to current floor
   */
  devSkipFloor(targetFloor, isRelative = false) {
    if (!this.isDevAuthorized()) {
      console.warn('[DEV CHEAT BLOCKED] Unauthorized attempt to skip floors.');
      return { success: false, error: 'Unauthorized: Dev Admin account required.' };
    }

    const currentFloor = this.state.madnessZone.stage || 1;
    let newFloor = isRelative ? currentFloor + targetFloor : targetFloor;
    newFloor = Math.max(1, Math.floor(newFloor));

    this.state.madnessZone.stage = newFloor;
    this.state.madnessZone.highestStageCleared = Math.max(
      this.state.madnessZone.highestStageCleared || 0,
      newFloor - 1
    );

    // Reset current wave and enemy for fresh floor spawn
    this.state.madnessZone.currentWave = 1;
    this.state.madnessZone.currentEnemy = null;
    this.state.madnessZone.isEngaged = true;
    this.state.madnessZone.combatTimer = 0;

    if (typeof this.spawnEnemy === 'function') {
      this.spawnEnemy();
    }

    this.emit('madnessStageChanged', { stage: newFloor });
    this.emit('stageChanged', { stage: newFloor });
    this.save(true);

    return {
      success: true,
      message: `[Dev] Successfully skipped to Madness Floor ${newFloor}!`,
      stage: newFloor
    };
  },

  /**
   * Instantly levels up the Contractor by N levels or to a target level
   * @param {number} levels - Number of levels to add
   * @param {boolean} setToAbsolute - If true, sets level directly to this number
   */
  devLevelUp(levels = 1, setToAbsolute = false) {
    if (!this.isDevAuthorized()) {
      return { success: false, error: 'Unauthorized: Dev Admin account required.' };
    }

    const currentLevel = this.state.contractor?.level || 1;
    let targetLevel = setToAbsolute ? levels : currentLevel + levels;
    targetLevel = Math.max(1, Math.min(99, Math.floor(targetLevel)));

    if (!this.state.contractor) this.state.contractor = { level: 1, xp: 0 };
    this.state.contractor.level = targetLevel;
    this.state.contractor.xp = 0;

    // Grant milestones and unlock features up to targetLevel
    if (!this.state.unlockedFeatures) this.state.unlockedFeatures = [];
    for (let lvl = 2; lvl <= targetLevel; lvl++) {
      const feats = getFeaturesUnlockedAtLevel(lvl);
      if (feats && feats.length) {
        feats.forEach(f => {
          if (!this.state.unlockedFeatures.includes(f)) {
            this.state.unlockedFeatures.push(f);
          }
        });
      }
    }

    // If level >= 3, make sure starter equipment is unlocked
    if (targetLevel >= 3 && typeof this.checkAndAwardTrialsStarterEquipment === 'function') {
      this.checkAndAwardTrialsStarterEquipment();
    }

    this.emit('contractorLevelUp', { level: targetLevel });
    this.emit('featureUnlocked');
    this.save(true);

    return {
      success: true,
      message: `[Dev] Contractor instantly leveled up to Level ${targetLevel}!`,
      level: targetLevel
    };
  },

  /**
   * Instantly grants currency - supports all currencies:
   * spiritShards, purifiedSoulEssence, soulEssence, energy, maxEnergy,
   * astralEssence, essencesOfTheGods, divineScriptures, relicReshapers
   */
  devAddCurrency(bundle = {}) {
    if (!this.isDevAuthorized()) {
      return { success: false, error: 'Unauthorized: Dev Admin account required.' };
    }

    const res = this.state.resources;
    if (bundle.spiritShards) {
      res.spiritShards = (res.spiritShards || 0) + Number(bundle.spiritShards);
    }
    if (bundle.purifiedSoulEssence || bundle.purifiedEssence || bundle.purified) {
      const p = Number(bundle.purifiedSoulEssence || bundle.purifiedEssence || bundle.purified);
      res.purifiedSoulEssence = (res.purifiedSoulEssence || 0) + p;
    }
    if (bundle.soulEssence) {
      res.soulEssence = (res.soulEssence || 0) + Number(bundle.soulEssence);
    }
    if (bundle.energy) {
      res.energy = Math.max(res.maxEnergy || 60, (res.energy || 0) + Number(bundle.energy));
    }
    if (bundle.maxEnergy) {
      res.maxEnergy = (res.maxEnergy || 60) + Number(bundle.maxEnergy);
    }
    if (bundle.astralEssence) {
      res.astralEssence = (res.astralEssence || 0) + Number(bundle.astralEssence);
    }
    if (bundle.essencesOfTheGods || bundle.essencesOfGods || bundle.gods) {
      const g = Number(bundle.essencesOfTheGods || bundle.essencesOfGods || bundle.gods);
      res.essencesOfTheGods = (res.essencesOfTheGods || 0) + g;
    }
    if (bundle.divineScriptures || bundle.scriptures || bundle.scrip) {
      const s = Number(bundle.divineScriptures || bundle.scriptures || bundle.scrip);
      res.divineScriptures = (res.divineScriptures || 0) + s;
    }
    if (bundle.relicReshapers || bundle.reshapers || bundle.reshaper) {
      const r = Number(bundle.relicReshapers || bundle.reshapers || bundle.reshaper);
      res.relicReshapers = (res.relicReshapers || 0) + r;
    }
    if (bundle.resonanceTier) {
      res.resonanceTier = (res.resonanceTier || 0) + Number(bundle.resonanceTier);
    }

    this.emit('resourcesChanged', res);
    this.emit('resourcesUpdated', res);
    this.save(true);

    return {
      success: true,
      message: `[Dev] All specified currencies boosted successfully!`,
      resources: res
    };
  },

  /**
   * Max out all active party spirits (Lv. 100, ★5)
   */
  devMaxPartySpirits() {
    if (!this.isDevAuthorized()) {
      return { success: false, error: 'Unauthorized: Dev Admin account required.' };
    }

    const party = typeof this.getPartySpirits === 'function' ? this.getPartySpirits() : [];
    party.forEach(s => {
      s.level = 100;
      s.starTier = 5;
      s.exp = 0;
      s.power = Math.max(s.power || 100, 50000);
    });

    this.invalidateCaches();
    this.emit('partyChanged');
    this.save(true);

    return {
      success: true,
      message: `[Dev] All ${party.length} active party spirits boosted to Lv. 100 ★5!`
    };
  },

  /**
   * Unlock all features, bestiary entries, and milestones
   */
  devUnlockAll() {
    if (!this.isDevAuthorized()) {
      return { success: false, error: 'Unauthorized: Dev Admin account required.' };
    }

    // Level 20 unlocks all features in contractorData
    this.devLevelUp(20, true);

    // Discover all bestiary species
    if (this.state.bestiary) {
      Object.keys(SPIRIT_SPECIES).forEach(k => {
        this.state.bestiary.discoveredSpecies[k] = true;
      });
    }

    // Give massive boost across all currencies (including Purified Soul Essence)
    this.devAddCurrency({
      spiritShards: 5000000,
      purifiedSoulEssence: 10000,
      soulEssence: 5000,
      energy: 999,
      maxEnergy: 999,
      astralEssence: 100000,
      essencesOfTheGods: 10000,
      divineScriptures: 100,
      relicReshapers: 100
    });

    this.invalidateCaches();
    this.save(true);

    return {
      success: true,
      message: '[Dev] All systems, bestiary, and all currencies boosted!'
    };
  },

  /**
   * Simulates offline progression for N hours and triggers the offline spoils modal
   * @param {number} hours - Number of hours to simulate (default 24)
   */
  devSimulateOffline(hours = 24) {
    if (!this.isDevAuthorized()) {
      return { success: false, error: 'Unauthorized: Dev Admin account required.' };
    }
    const seconds = Math.min(86400, Math.max(3600, Math.floor(hours * 3600)));
    const report = this.applyOfflineGains(seconds, true);
    if (report) {
      this.emit('offlineGains', report);
    }
    this.save(true);
    return {
      success: true,
      message: `[Dev] Successfully simulated ${hours} hour(s) (${seconds}s) of offline idle progression!`,
      report
    };
  },

  /**
   * Unified Cheat Code parser for text command bar or console
   */
  executeCheatCode(inputCommand) {
    if (!this.isDevAuthorized()) {
      return { success: false, error: 'Unauthorized: Only available to the Dev Admin account.' };
    }

    const trimmed = (inputCommand || '').trim().toLowerCase();
    if (!trimmed) return { success: false, error: 'Empty cheat code.' };

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const arg = parts[1];

    if (cmd === 'offline' || cmd === 'afk' || cmd === 'idle' || cmd === 'fastforward') {
      const num = arg ? parseFloat(arg) : 24;
      return this.devSimulateOffline(isNaN(num) ? 24 : num);
    }

    if (cmd === 'skip' || cmd === 'floor') {
      const fl = parseInt(arg, 10);
      if (isNaN(fl) || fl < 1) return { success: false, error: 'Usage: floor <number>' };
      return this.devSkipFloor(fl, false);
    }

    if (cmd === 'levelup' || cmd === 'lvl' || cmd === 'level') {
      const num = arg ? parseInt(arg, 10) : 1;
      return this.devLevelUp(isNaN(num) ? 1 : num, false);
    }

    if (cmd === 'maxlevel') {
      return this.devLevelUp(50, true);
    }

    if (cmd === 'shards' || cmd === 'spiritshards') {
      const num = arg ? parseInt(arg, 10) : 500000;
      return this.devAddCurrency({ spiritShards: num });
    }

    // Explicit Purified Soul Essence boosts
    if (cmd === 'purified' || cmd === 'purifiedsoul' || cmd === 'summoncurrency') {
      const num = arg ? parseInt(arg, 10) : 1000;
      return this.devAddCurrency({ purifiedSoulEssence: num });
    }

    // Soul Essence boosts
    if (cmd === 'soul' || cmd === 'soulessence') {
      const num = arg ? parseInt(arg, 10) : 500;
      return this.devAddCurrency({ soulEssence: num, purifiedSoulEssence: num });
    }

    if (cmd === 'energy') {
      const num = arg ? parseInt(arg, 10) : 999;
      return this.devAddCurrency({ energy: num, maxEnergy: Math.max(999, num) });
    }

    if (cmd === 'astral' || cmd === 'astralessence') {
      const num = arg ? parseInt(arg, 10) : 50000;
      return this.devAddCurrency({ astralEssence: num });
    }

    if (cmd === 'gods' || cmd === 'godessence') {
      const num = arg ? parseInt(arg, 10) : 5000;
      return this.devAddCurrency({ essencesOfTheGods: num });
    }

    if (cmd === 'scriptures' || cmd === 'scrip') {
      const num = arg ? parseInt(arg, 10) : 50;
      return this.devAddCurrency({ divineScriptures: num });
    }

    if (cmd === 'reshapers' || cmd === 'reshaper') {
      const num = arg ? parseInt(arg, 10) : 50;
      return this.devAddCurrency({ relicReshapers: num });
    }

    // All Currency Boost
    if (cmd === 'rich' || cmd === 'currency' || cmd === 'gold' || cmd === 'boostall' || cmd === 'allcurrency') {
      return this.devAddCurrency({
        spiritShards: 5000000,
        purifiedSoulEssence: 10000,
        soulEssence: 5000,
        energy: 999,
        maxEnergy: 999,
        astralEssence: 100000,
        essencesOfTheGods: 10000,
        divineScriptures: 100,
        relicReshapers: 100
      });
    }

    if (cmd === 'spirits' || cmd === 'maxspirits' || cmd === 'spiritlvl') {
      return this.devMaxPartySpirits();
    }

    if (cmd === 'unlockall') {
      return this.devUnlockAll();
    }

    if (cmd === 'godmode') {
      this.devLevelUp(50, true);
      this.devSkipFloor(50, false);
      this.devMaxPartySpirits();
      this.devAddCurrency({
        spiritShards: 10000000,
        purifiedSoulEssence: 25000,
        soulEssence: 10000,
        energy: 999,
        maxEnergy: 999,
        astralEssence: 200000,
        essencesOfTheGods: 25000,
        divineScriptures: 200,
        relicReshapers: 200
      });
      return { success: true, message: '[GOD MODE ACTIVATED] Lv 50 Contractor, Floor 50, Max Spirits, Full Currencies (including 25,000 Purified Soul Essence)!' };
    }

    return {
      success: false,
      error: `Unknown cheat code: "${cmd}". Available codes: floor <num>, levelup <num>, purified <num>, shards <num>, soul <num>, energy <num>, gods <num>, scriptures <num>, reshapers <num>, rich (boost all), maxspirits, unlockall, godmode.`
    };
  }
};
