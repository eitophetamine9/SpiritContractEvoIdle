import {
  SAVE_KEY,
  AUTO_SAVE_INTERVAL_MS,
  ENERGY_ENTRY_COST,
  ENERGY_REGEN_INTERVAL_SEC
} from './constants.js';

import { contractorMethods } from './modules/contractorModule.js';
import { formationMethods } from './modules/formationModule.js';
import { summonMethods } from './modules/summonModule.js';
import { equipmentMethods } from './modules/equipmentModule.js';
import { spiritMethods } from './modules/spiritModule.js';
import { combatMethods } from './modules/combatModule.js';
import { dungeonMethods } from './modules/dungeonModule.js';
import { astralMethods } from './modules/astralModule.js';
import { persistenceMethods } from './modules/persistenceModule.js';
import { devCheatMethods } from './modules/devCheatModule.js';

export { ENERGY_ENTRY_COST, ENERGY_REGEN_INTERVAL_SEC, SAVE_KEY, AUTO_SAVE_INTERVAL_MS };

/**
 * GameStateManager - Unified coordinator composing modular domain logic
 */
class GameStateManager {
  constructor() {
    this.state = null;
    this.subscribers = new Set();
    this.saveTimer = null;
    this.rafId = null;
    this.lastTickTime = performance.now();
    this.setBonusCooldowns = {};
    this.isDirty = false;
    this._equipmentMap = null;
    this._equipmentMapDirty = true;
    this._combatStatsCache = new Map();
    this._spiritPowerCache = new Map();
    this._setBonusesCache = new Map();
    this._partyPowerCache = null;
    this._isTabHidden = false;
    this._tabHiddenTimestamp = null;
  }

  invalidateCaches() {
    this._equipmentMapDirty = true;
    if (this._combatStatsCache) this._combatStatsCache.clear();
    if (this._spiritPowerCache) this._spiritPowerCache.clear();
    if (this._setBonusesCache) this._setBonusesCache.clear();
    this._partyPowerCache = null;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  on(event, callback) {
    return this.subscribe((type, data) => {
      if (type === event) callback(data);
    });
  }

  emit(type, payload) {
    this.subscribers.forEach(cb => {
      try {
        cb(type, payload);
      } catch (err) {
        console.error('Subscriber error:', err);
      }
    });
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
    this.invalidateCaches();

    // Process Offline Progression based on last_saved (Minimum 1 hour / 3600s to claim)
    const now = Date.now();
    const offlineSeconds = Math.max(0, Math.floor((now - (this.state.last_saved || now)) / 1000));
    
    let offlineReport = null;
    if (offlineSeconds >= 3600) {
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

    // Attach unload & lifecycle visibility listeners for offline progression and data safety
    const handleTabHide = () => {
      if (this._isTabHidden) return;
      this._isTabHidden = true;
      this._tabHiddenTimestamp = Date.now();
      if (this.state) {
        this.state.last_saved = this._tabHiddenTimestamp;
      }
      this.save(true);
    };

    const handleTabShow = () => {
      if (!this._isTabHidden && this._tabHiddenTimestamp === null) return;
      this._isTabHidden = false;
      const refocusNow = Date.now();
      const hiddenTime = this._tabHiddenTimestamp || this.state?.last_saved || refocusNow;
      this._tabHiddenTimestamp = null;

      const refocusOfflineSec = Math.max(0, Math.floor((refocusNow - hiddenTime) / 1000));

      if (this.state) {
        this.state.last_saved = refocusNow;
      }
      this.save(true);

      // Trigger offline gains if away for at least 1 hour (3600 seconds)
      if (refocusOfflineSec >= 3600) {
        const refocusReport = this.applyOfflineGains(refocusOfflineSec);
        if (refocusReport && refocusReport.canClaim) {
          this.emit('offlineGains', refocusReport);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleTabHide);
      window.addEventListener('pagehide', handleTabHide);
      window.addEventListener('pageshow', handleTabShow);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          handleTabHide();
        } else {
          handleTabShow();
        }
      });
    }

    return offlineReport;
  }
}

// Attach all modular domain methods onto GameStateManager prototype
Object.assign(
  GameStateManager.prototype,
  contractorMethods,
  formationMethods,
  summonMethods,
  equipmentMethods,
  spiritMethods,
  combatMethods,
  dungeonMethods,
  astralMethods,
  persistenceMethods,
  devCheatMethods
);

export const gameState = new GameStateManager();
