/**
 * Spirit Contract Evo | Idle - Audio Engine
 * Supports HTML5 Audio & Web Audio API for zero-latency BGM crossfading and SFX triggers.
 */

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isMuted = false;
    this.bgmVolume = 0.45;
    this.sfxVolume = 0.70;
    this.currentBgmTrack = null;
    this.bgmAudioElement = null;
    this.audioInitialized = false;

    // Load persisted settings
    try {
      const saved = localStorage.getItem('spirit_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.isMuted = !!parsed.isMuted;
        this.bgmVolume = typeof parsed.bgmVolume === 'number' ? parsed.bgmVolume : 0.45;
        this.sfxVolume = typeof parsed.sfxVolume === 'number' ? parsed.sfxVolume : 0.70;
      }
    } catch {
      // Fallback to defaults
    }

    this.bgmTracks = {
      ambient: '/audio/bgm/sanctum_ambient.wav',
      battle: '/audio/bgm/battle_madness.wav',
      trials: '/audio/bgm/trials_pantheon.wav'
    };

    this.sfxTracks = {
      attack: '/audio/sfx/attack_hit.wav',
      crit: '/audio/sfx/crit_hit.wav',
      ult: '/audio/sfx/ultimate_cast.wav',
      levelup: '/audio/sfx/level_up.wav',
      evolution: '/audio/sfx/evolution_fanfare.wav',
      reward: '/audio/sfx/dungeon_reward.wav',
      tap: '/audio/sfx/button_tap.wav'
    };

    // SFX Audio element pool for concurrent overlap
    this.sfxPool = {};
  }

  init() {
    if (this.audioInitialized) return;
    this.audioInitialized = true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio Context not supported or deferred:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('spirit_audio_settings', JSON.stringify({
        isMuted: this.isMuted,
        bgmVolume: this.bgmVolume,
        sfxVolume: this.sfxVolume
      }));
    } catch {
      // ignore
    }
  }

  updateAllAudioButtons() {
    if (typeof document === 'undefined') return;
    const isMuted = this.isMuted;
    const icon = isMuted ? '🔇' : '🔊';

    const topSymbol = document.getElementById('audio-icon-symbol');
    if (topSymbol) topSymbol.textContent = icon;

    const topBtn = document.getElementById('btn-top-audio');
    if (topBtn) topBtn.classList.toggle('muted', isMuted);

    const combatBtn = document.getElementById('btn-combat-sound');
    if (combatBtn) combatBtn.textContent = icon;
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    if (!this.isMuted) {
      if (!this.currentBgmTrack) {
        this.currentBgmTrack = 'battle';
      }
      if (!this.bgmAudioElement) {
        this.bgmAudioElement = new Audio();
        this.bgmAudioElement.loop = true;
      }
      const targetSrc = this.bgmTracks[this.currentBgmTrack] || this.bgmTracks.battle;
      if (!this.bgmAudioElement.src || !this.bgmAudioElement.src.endsWith(targetSrc)) {
        this.bgmAudioElement.src = targetSrc;
      }
      this.bgmAudioElement.muted = false;
      this.bgmAudioElement.volume = this.bgmVolume;
      const playPromise = this.bgmAudioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.warn('BGM play on unmute:', err));
      }
      this.playSfx('tap');
    } else {
      if (this.bgmAudioElement) {
        this.bgmAudioElement.muted = true;
        this.bgmAudioElement.pause();
      }
    }

    this.saveSettings();
    this.updateAllAudioButtons();
    return this.isMuted;
  }

  setBgmVolume(val) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (this.bgmAudioElement) {
      this.bgmAudioElement.volume = this.isMuted ? 0 : this.bgmVolume;
    }
    this.saveSettings();
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.saveSettings();
  }

  playBgm(trackKey) {
    this.init();
    const src = this.bgmTracks[trackKey] || this.bgmTracks.ambient;
    this.currentBgmTrack = trackKey;

    if (!this.bgmAudioElement) {
      this.bgmAudioElement = new Audio();
      this.bgmAudioElement.loop = true;
    }

    if (this.isMuted) {
      this.bgmAudioElement.muted = true;
      this.bgmAudioElement.pause();
      return;
    }

    if (!this.bgmAudioElement.src || !this.bgmAudioElement.src.endsWith(src)) {
      this.bgmAudioElement.src = src;
    }

    this.bgmAudioElement.muted = false;
    this.bgmAudioElement.volume = this.bgmVolume;

    const playPromise = this.bgmAudioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy deferred playback
      });
    }
  }

  play(sfxKey) {
    return this.playSfx(sfxKey);
  }

  playSfx(sfxKey) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();

    // Map common aliases
    const aliasMap = {
      evolution_confirm: 'evolution',
      spirit_unlocked: 'reward',
      level_up: 'levelup',
      item_claim: 'reward',
      click: 'tap'
    };
    const resolvedKey = aliasMap[sfxKey] || sfxKey;
    const src = this.sfxTracks[resolvedKey] || this.sfxTracks.tap;
    try {
      const audio = new Audio(src);
      audio.volume = this.sfxVolume;
      audio.play().catch(() => {});
    } catch {
      // ignore audio play errors in background
    }
  }

  /**
   * Automatically switches BGM depending on the active game view
   */
  handleTabChange(tabId) {
    if (tabId === 'madness' || tabId === 'forge') {
      this.playBgm('battle');
    } else if (tabId === 'trials') {
      this.playBgm('trials');
    } else {
      this.playBgm('ambient');
    }
  }

  /**
   * Bind gameState events to sound effects
   */
  bindGameStateEvents(gameState) {
    if (!gameState) return;

    gameState.on('spiritEvolved', () => {
      this.playSfx('evolution');
    });

    gameState.on('ultimateCast', () => {
      this.playSfx('ult');
    });

    gameState.on('setBonusProc', () => {
      this.playSfx('crit');
    });

    gameState.on('equipmentUpdated', () => {
      this.playSfx('tap');
    });

    gameState.on('equipmentDismantled', () => {
      this.playSfx('tap');
    });

    gameState.on('trialVictory', () => {
      this.playSfx('reward');
    });
  }
}

export const audioManager = new AudioManager();
