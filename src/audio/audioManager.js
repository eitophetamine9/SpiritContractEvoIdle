/**
 * Spirit Contract Evo | Idle - Audio Engine
 * Supports HTML5 Audio & Web Audio API for zero-latency BGM crossfading and SFX triggers.
 */
import { getGameIcon } from '../ui/icons/gameIcons.js';

class AudioManager {

  constructor() {
    this.audioContext = null;
    this.masterCompressor = null;
    this.masterGain = null;
    this.isMuted = false;
    this.bgmVolume = 0.18; // Calibrated gentle baseline
    this.sfxVolume = 0.20; // Calibrated gentle baseline
    this.lastUltSfxTime = 0;
    this.currentBgmTrack = null;
    this.bgmAudioElement = null;
    this.audioInitialized = false;

    // Load persisted settings
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('spirit_audio_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.isMuted = !!parsed.isMuted;
          this.bgmVolume = typeof parsed.bgmVolume === 'number' ? Math.min(parsed.bgmVolume, 0.40) : 0.18;
          this.sfxVolume = typeof parsed.sfxVolume === 'number' ? Math.min(parsed.sfxVolume, 0.40) : 0.20;
        }
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
      const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();

        // Master Dynamics Compressor to tame harsh volume peaks & audio clipping
        if (typeof this.audioContext.createDynamicsCompressor === 'function') {
          this.masterCompressor = this.audioContext.createDynamicsCompressor();
          this.masterCompressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
          this.masterCompressor.knee.setValueAtTime(30, this.audioContext.currentTime);
          this.masterCompressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
          this.masterCompressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
          this.masterCompressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
        }

        // Master Gain Stage
        if (typeof this.audioContext.createGain === 'function') {
          this.masterGain = this.audioContext.createGain();
          this.masterGain.gain.setValueAtTime(1.0, this.audioContext.currentTime);
        }

        // Connect node graph
        if (this.masterCompressor && this.masterGain) {
          this.masterCompressor.connect(this.masterGain);
          if (this.audioContext.destination) {
            this.masterGain.connect(this.audioContext.destination);
          }
        }
      }
    } catch (e) {
      console.warn('Web Audio Context not supported or deferred:', e);
    }
  }

  saveSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('spirit_audio_settings', JSON.stringify({
          isMuted: this.isMuted,
          bgmVolume: this.bgmVolume,
          sfxVolume: this.sfxVolume
        }));
      }
    } catch {
      // ignore
    }
  }

  updateAllAudioButtons() {
    if (typeof document === 'undefined') return;
    const isMuted = this.isMuted;
    const iconHtml = isMuted 
      ? getGameIcon('audioOff', { size: '15px' }) 
      : getGameIcon('audioOn', { size: '15px' });

    const topSymbol = document.getElementById('audio-icon-symbol');
    if (topSymbol) topSymbol.innerHTML = iconHtml;

    const topBtn = document.getElementById('btn-top-audio');
    if (topBtn) topBtn.classList.toggle('muted', isMuted);

    const combatBtn = document.getElementById('btn-combat-sound');
    if (combatBtn) combatBtn.innerHTML = iconHtml;
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
      if (!this.bgmAudioElement && typeof Audio !== 'undefined') {
        this.bgmAudioElement = new Audio();
        this.bgmAudioElement.loop = true;
      }
      const targetSrc = this.bgmTracks[this.currentBgmTrack] || this.bgmTracks.battle;
      if (this.bgmAudioElement) {
        if (!this.bgmAudioElement.src || !this.bgmAudioElement.src.endsWith(targetSrc)) {
          this.bgmAudioElement.src = targetSrc;
        }
        this.bgmAudioElement.muted = false;
        this.bgmAudioElement.volume = this.bgmVolume;
        const playPromise = this.bgmAudioElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => console.warn('BGM play on unmute:', err));
        }
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

    if (!this.bgmAudioElement && typeof Audio !== 'undefined') {
      this.bgmAudioElement = new Audio();
      this.bgmAudioElement.loop = true;
    }

    if (!this.bgmAudioElement) return;

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

  /**
   * Generates a soft, warm wooden/crystal UI tap via Web Audio API
   */
  playWarmTap() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.audioContext) return;

    try {
      const ctx = this.audioContext;
      const t0 = ctx.currentTime;
      const dest = this.masterCompressor || ctx.destination;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t0);
      osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.05);

      const tapVol = Math.max(0, Math.min(1, this.sfxVolume * 0.28));
      gain.gain.setValueAtTime(tapVol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.055);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(t0);
      osc.stop(t0 + 0.06);
    } catch {
      // Ignore Web Audio synth errors
    }
  }

  /**
   * Generates a soft harmonic temple chime with gentle natural overtones
   */
  playHarmonicChime(noteFreq = 880, duration = 1.0) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.audioContext) return;

    try {
      const ctx = this.audioContext;
      const t0 = ctx.currentTime;
      const dest = this.masterCompressor || ctx.destination;
      const baseVol = Math.max(0, Math.min(1, this.sfxVolume * 0.35));

      // Fundamental + 2nd + 3rd harmonic partials
      const partials = [
        { freqMult: 1.0, vol: 1.0, decay: duration },
        { freqMult: 2.76, vol: 0.35, decay: duration * 0.65 },
        { freqMult: 5.4, vol: 0.12, decay: duration * 0.4 }
      ];

      partials.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq * p.freqMult, t0);

        gain.gain.setValueAtTime(baseVol * p.vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + p.decay);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(t0);
        osc.stop(t0 + p.decay + 0.05);
      });
    } catch {
      // Ignore Web Audio synth errors
    }
  }

  /**
   * Generates a soft, ethereal harp/lyre arpeggio
   */
  playHarpStrum(chordNotes = [523.25, 659.25, 783.99, 1046.50]) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.audioContext) return;

    try {
      chordNotes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.audioContext || this.isMuted) return;
          const ctx = this.audioContext;
          const t0 = ctx.currentTime;
          const dest = this.masterCompressor || ctx.destination;

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t0);

          const noteVol = Math.max(0, Math.min(1, this.sfxVolume * 0.32));
          gain.gain.setValueAtTime(0.001, t0);
          gain.gain.linearRampToValueAtTime(noteVol, t0 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.75);

          osc.connect(gain);
          gain.connect(dest);

          osc.start(t0);
          osc.stop(t0 + 0.8);
        }, idx * 42);
      });
    } catch {
      // Ignore Web Audio synth errors
    }
  }

  /**
   * Generates a deep resonant temple bell with peaceful astral overtone
   */
  playEtherealBell(baseFreq = 432) {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.audioContext) return;

    try {
      const ctx = this.audioContext;
      const t0 = ctx.currentTime;
      const dest = this.masterCompressor || ctx.destination;
      const bellVol = Math.max(0, Math.min(1, this.sfxVolume * 0.32));

      [
        { freq: baseFreq, vol: 1.0, decay: 1.4 },
        { freq: baseFreq * 2.01, vol: 0.45, decay: 1.0 },
        { freq: baseFreq * 3.02, vol: 0.18, decay: 0.6 }
      ].forEach(b => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(b.freq, t0);

        gain.gain.setValueAtTime(bellVol * b.vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + b.decay);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(t0);
        osc.stop(t0 + b.decay + 0.05);
      });
    } catch {
      // Ignore Web Audio synth errors
    }
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
      button_click: 'tap',
      click: 'tap'
    };
    const resolvedKey = aliasMap[sfxKey] || sfxKey;

    // Harmonic Web Audio synthesizers for pure, gentle acoustics
    if (resolvedKey === 'tap') {
      this.playWarmTap();
    } else if (resolvedKey === 'chime' || resolvedKey === 'temple_chime') {
      this.playHarmonicChime();
      return;
    } else if (resolvedKey === 'harp' || resolvedKey === 'harp_strum') {
      this.playHarpStrum();
      return;
    } else if (resolvedKey === 'bell' || resolvedKey === 'ethereal_bell') {
      this.playEtherealBell();
      return;
    } else if (resolvedKey === 'evolution') {
      this.playHarpStrum([523.25, 659.25, 783.99, 1046.50]);
    } else if (resolvedKey === 'reward') {
      this.playHarmonicChime(784, 1.1);
    }

    // Anti-spam throttling for ultimate SFX (minimum 1.4s interval)
    if (resolvedKey === 'ult') {
      const now = Date.now();
      if (now - this.lastUltSfxTime < 1400) {
        return; // Suppress overlapping ultimate sounds
      }
      this.lastUltSfxTime = now;
    }

    const src = this.sfxTracks[resolvedKey] || this.sfxTracks.tap;
    try {
      if (typeof Audio !== 'undefined') {
        const audio = new Audio(src);
        // Attenuate ultimate sound specifically so it never overwhelms or distorts
        const volumeLevel = resolvedKey === 'ult' 
          ? Math.max(0, Math.min(1, this.sfxVolume * 0.50)) 
          : this.sfxVolume;
        audio.volume = volumeLevel;
        audio.play().catch(() => {});
      }
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

// Ensure global accessibility across all modules and inline handlers
if (typeof globalThis !== 'undefined') {
  globalThis.audioManager = audioManager;
}
if (typeof window !== 'undefined') {
  window.audioManager = audioManager;
}

/**
 * Global failsafe sound effect trigger.
 * Will never throw or interrupt UI state updates if audio is unavailable.
 */
export function safePlaySfx(sfxKey) {
  try {
    if (typeof audioManager !== 'undefined' && audioManager?.playSfx) {
      audioManager.playSfx(sfxKey);
    }
  } catch {
    // Silently ignore audio playback errors
  }
}

/**
 * Global failsafe BGM trigger.
 */
export function safePlayBgm(trackKey) {
  try {
    if (typeof audioManager !== 'undefined' && audioManager?.playBgm) {
      audioManager.playBgm(trackKey);
    }
  } catch {
    // Silently ignore audio playback errors
  }
}
