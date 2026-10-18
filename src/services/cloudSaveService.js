import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { authService } from './authService.js';
import { gameState } from '../state/gameState.js';
import { showConflictModal } from '../ui/components/conflictModal.js';
import { getGameIcon } from '../ui/icons/gameIcons.js';

class CloudSaveService {
  constructor() {
    this.syncStatus = 'local'; // 'local' | 'syncing' | 'synced' | 'error' | 'conflict'
    this.lastSyncTimestamp = null;
    this.debounceTimer = null;
    this.isSyncing = false;
    this.subscribers = new Set();
    this.minDebounceMs = 15000; // 15 seconds minimum between auto-pushes
    this.lastPushAttempt = 0;
  }

  /**
   * Initializes cloud save listeners, auth hooks, and initial sync checks
   */
  init() {
    // Listen to Auth State Changes
    authService.subscribe(async (event, payload) => {
      if (event === 'AUTH_STATE_CHANGED' || event === 'AUTH_INITIALIZED') {
        if (!authService.isGuest()) {
          await this.checkAndResolveSyncOnLogin();
        } else {
          this.syncStatus = 'local';
          this.updateSaveStatusUI();
        }
      }
    });

    // Listen to Game State events for auto-sync
    gameState.subscribe((eventType, payload, state) => {
      if (authService.isGuest() || !isSupabaseConfigured()) {
        this.syncStatus = 'local';
        this.updateSaveStatusUI();
        return;
      }

      // Major milestones trigger immediate sync, ordinary ticks/saves trigger debounced sync
      if (eventType === 'stageUnlocked' || eventType === 'floorCleared' || eventType === 'contractMade') {
        this.scheduleSync(true);
      } else if (eventType === 'saved') {
        this.scheduleSync(false);
      }
    });

    this.updateSaveStatusUI();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  emit(event, payload) {
    for (const cb of this.subscribers) {
      try { cb(event, payload); } catch (e) { console.error(e); }
    }
  }

  /**
   * Schedules a cloud sync with debouncing
   * @param {boolean} immediate - If true, bypasses the debounce delay
   */
  scheduleSync(immediate = false) {
    if (authService.isGuest() || !isSupabaseConfigured()) {
      return;
    }

    if (immediate) {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.uploadSave(false);
      return;
    }

    if (this.debounceTimer) return;

    const now = Date.now();
    const elapsedSinceLast = now - this.lastPushAttempt;
    const delay = Math.max(1000, this.minDebounceMs - elapsedSinceLast);

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.uploadSave(false);
    }, delay);
  }

  /**
   * Uploads the active gameState to Supabase public.game_saves & public.leaderboards
   * @param {boolean} force - Force upload regardless of current syncing state
   * @returns {Promise<boolean>} Success status
   */
  async uploadSave(force = false) {
    if (authService.isGuest() || !isSupabaseConfigured() || !supabase) {
      this.syncStatus = 'local';
      this.updateSaveStatusUI();
      return false;
    }

    if (this.isSyncing && !force) return false;

    const user = authService.currentUser;
    if (!user || !user.id) return false;

    const rawState = gameState.state;
    if (!rawState) return false;

    this.isSyncing = true;
    this.syncStatus = 'syncing';
    this.updateSaveStatusUI();
    this.lastPushAttempt = Date.now();

    try {
      const nowIso = new Date().toISOString();
      const savePayload = {
        user_id: user.id,
        version: 2,
        save_data: rawState,
        updated_at: nowIso,
        checksum: 'v2_' + (rawState.last_saved || Date.now())
      };

      // 1. Upsert Game Save
      const { error: saveError } = await supabase
        .from('game_saves')
        .upsert(savePayload, { onConflict: 'user_id' });

      if (saveError) {
        throw saveError;
      }

      // 2. Upsert Public Leaderboard Entry
      const profile = authService.getProfile();
      const partyPower = gameState.calculateTotalPartyPower ? gameState.calculateTotalPartyPower() : 0;
      const highestStage = rawState.madnessZone?.highestUnlockedStage || 1;
      const totalSpirits = Array.isArray(rawState.spirits) ? rawState.spirits.length : 1;

      await supabase.from('leaderboards').upsert({
        user_id: user.id,
        username: profile.username || 'Contractor',
        avatar_emoji: profile.avatarEmoji || 'wizard',
        contractor_level: profile.contractorLevel || 1,
        highest_stage: highestStage,
        total_party_power: partyPower,
        total_spirits_contracted: totalSpirits,
        updated_at: nowIso
      }, { onConflict: 'user_id' }).catch(err => {
        // Non-blocking leaderboard update error
        console.warn('[CloudSaveService] Leaderboard update notice:', err);
      });

      this.isSyncing = false;
      this.syncStatus = 'synced';
      this.lastSyncTimestamp = Date.now();
      this.updateSaveStatusUI();
      this.emit('CLOUD_SYNC_SUCCESS', { timestamp: this.lastSyncTimestamp });
      return true;

    } catch (err) {
      console.warn('[CloudSaveService] Cloud save failed, local save preserved:', err);
      this.isSyncing = false;
      this.syncStatus = 'error';
      this.updateSaveStatusUI();
      this.emit('CLOUD_SYNC_ERROR', { error: err });
      return false;
    }
  }

  /**
   * Fetches cloud save for the logged in user
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async fetchCloudSave(userId) {
    if (!isSupabaseConfigured() || !supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[CloudSaveService] Error fetching cloud save:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('[CloudSaveService] Exception fetching cloud save:', err);
      return null;
    }
  }

  /**
   * Compares local device save against remote Supabase save and resolves conflicts
   */
  async checkAndResolveSyncOnLogin() {
    const user = authService.currentUser;
    if (!user || !user.id) return;

    this.syncStatus = 'syncing';
    this.updateSaveStatusUI();

    const cloudRecord = await this.fetchCloudSave(user.id);
    const localState = gameState.state;

    // Case 1: No remote save exists yet
    if (!cloudRecord || !cloudRecord.save_data) {
      const isExplicitLink = typeof window !== 'undefined' && window.__linkDeviceSaveRequested;
      if (typeof window !== 'undefined') {
        window.__linkDeviceSaveRequested = false;
      }

      // If NOT an explicit link and local state has advanced/veteran dev testing progress,
      // reset to Day-1 starter state so this brand-new cloud account starts completely fresh!
      const isDirtyVeteranState = (localState?.madnessZone?.highestStageCleared || 0) > 0 ||
                                  (localState?.spirits || []).length > 1 ||
                                  (localState?.contractor?.level || 1) > 1;

      if (!isExplicitLink && isDirtyVeteranState) {
        console.log('[CloudSaveService] New account with no remote save detected; resetting to fresh starter state.');
        gameState.resetAllProgress();
      }

      await this.uploadSave(true);
      return;
    }

    const cloudState = cloudRecord.save_data;
    const localLastSaved = localState?.last_saved || 0;
    const cloudLastSaved = cloudState?.last_saved || new Date(cloudRecord.updated_at).getTime() || 0;

    const localStage = localState?.madnessZone?.highestUnlockedStage || 1;
    const cloudStage = cloudState?.madnessZone?.highestUnlockedStage || 1;

    const localPower = gameState.calculateTotalPartyPower ? gameState.calculateTotalPartyPower() : 0;
    let cloudPower = 0;
    try {
      if (Array.isArray(cloudState?.party) && Array.isArray(cloudState?.spirits)) {
        const partySpirits = cloudState.party.map(id => cloudState.spirits.find(s => s.id === id)).filter(Boolean);
        cloudPower = partySpirits.reduce((acc, s) => acc + (s.power || 0), 0);
      }
    } catch {}

    const localShards = localState?.resources?.spiritShards || 0;
    const cloudShards = cloudState?.resources?.spiritShards || 0;

    const localSpiritsCount = Array.isArray(localState?.spirits) ? localState.spirits.length : 1;
    const cloudSpiritsCount = Array.isArray(cloudState?.spirits) ? cloudState.spirits.length : 1;

    // Check if progress is practically identical (timestamp within 60s, same stage and power)
    const timeDiffMs = Math.abs(localLastSaved - cloudLastSaved);
    const isProgressionIdentical = localStage === cloudStage && localSpiritsCount === cloudSpiritsCount;

    if (isProgressionIdentical && timeDiffMs < 60000) {
      // Cleanly adopt the newer one or push if local is ahead
      if (cloudLastSaved > localLastSaved) {
        gameState.loadCustomState(cloudState);
      } else {
        await this.uploadSave(true);
      }
      this.syncStatus = 'synced';
      this.lastSyncTimestamp = Date.now();
      this.updateSaveStatusUI();
      return;
    }

    // Meaningful difference detected -> Show Interactive Conflict Resolution Modal!
    this.syncStatus = 'conflict';
    this.updateSaveStatusUI();

    showConflictModal({
      localSummary: {
        timestamp: localLastSaved,
        stage: localStage,
        partyPower: localPower,
        shards: localShards,
        spiritsCount: localSpiritsCount
      },
      cloudSummary: {
        timestamp: cloudLastSaved,
        stage: cloudStage,
        partyPower: cloudPower,
        shards: cloudShards,
        spiritsCount: cloudSpiritsCount
      },
      onChooseLocal: async () => {
        await this.uploadSave(true);
        this.emit('CONFLICT_RESOLVED', { choice: 'local' });
      },
      onChooseCloud: () => {
        gameState.loadCustomState(cloudState);
        this.syncStatus = 'synced';
        this.lastSyncTimestamp = Date.now();
        this.updateSaveStatusUI();
        this.emit('CONFLICT_RESOLVED', { choice: 'cloud' });
      }
    });
  }

  /**
   * Updates the #save-status indicator pill in the sticky header
   */
  updateSaveStatusUI() {
    const el = document.getElementById('save-status');
    if (!el) return;

    if (authService.isGuest()) {
      el.innerHTML = `<span class="save-dot" style="color:#d4e478;">●</span> ${getGameIcon('save', { size: 12, className: 'inline mr-0.5' })} Local`;
      el.title = 'Saved locally in browser storage (Guest Mode)';
      el.classList.remove('syncing');
      return;
    }

    switch (this.syncStatus) {
      case 'syncing':
        el.innerHTML = `<span class="save-dot animate-pulse" style="color:#00d0ff;">●</span> ${getGameIcon('recycle', { size: 12, className: 'inline mr-0.5 animate-spin' })} Syncing...`;
        el.title = 'Synchronizing progress with Supabase Cloud...';
        el.classList.add('syncing');
        break;
      case 'synced':
        el.innerHTML = `<span class="save-dot" style="color:#10b981;">●</span> ${getGameIcon('cloud', { size: 12, className: 'inline mr-0.5' })} Synced`;
        el.title = `Cloud synchronized with Supabase (${this.lastSyncTimestamp ? new Date(this.lastSyncTimestamp).toLocaleTimeString() : 'Active'})`;
        el.classList.remove('syncing');
        break;
      case 'error':
        el.innerHTML = `<span class="save-dot" style="color:#f59e0b;">●</span> ${getGameIcon('alert', { size: 12, className: 'inline mr-0.5' })} Offline`;
        el.title = 'Network interrupted. Local browser save preserved!';
        el.classList.remove('syncing');
        break;
      case 'conflict':
        el.innerHTML = `<span class="save-dot animate-pulse" style="color:#ef4444;">●</span> ${getGameIcon('scale', { size: 12, className: 'inline mr-0.5' })} Conflict`;
        el.title = 'Save conflict detected between local device and cloud.';
        el.classList.remove('syncing');
        break;
      case 'local':
      default:
        el.innerHTML = `<span class="save-dot" style="color:#d4e478;">●</span> ${getGameIcon('save', { size: 12, className: 'inline mr-0.5' })} Local`;
        el.title = 'Saved locally in browser storage';
        el.classList.remove('syncing');
        break;
    }
  }
}

export const cloudSaveService = new CloudSaveService();
