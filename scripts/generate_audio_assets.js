import fs from 'fs';
import path from 'path';

function createWavHeader(dataLength, sampleRate = 22050, numChannels = 1, bitsPerSample = 16) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

function writeWav(filePath, samples, sampleRate = 22050) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
    data.writeInt16LE(intSample, i * 2);
  }
  const header = createWavHeader(data.length, sampleRate);
  const full = Buffer.concat([header, data]);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, full);
  console.log(`Generated: ${filePath} (${(full.length / 1024).toFixed(1)} KB)`);
}

const sampleRate = 22050;

// =========================================================================
// SFX GENERATORS
// =========================================================================

// 1. Attack Hit (Punchy impact + transient)
function generateAttackHit() {
  const duration = 0.18;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 180 * Math.exp(-t * 30);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 25);
    const tone = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 18);
    samples[i] = (tone * 0.7 + noise * 0.4);
  }
  return samples;
}

// 2. Critical Hit (Explosive resonance + bass drop)
function generateCritHit() {
  const duration = 0.35;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 320 * Math.exp(-t * 18);
    const sub = Math.sin(2 * Math.PI * 65 * t) * Math.exp(-t * 8);
    const metallic = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 22) * 0.3;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.5;
    samples[i] = (Math.sin(2 * Math.PI * freq * t) * 0.5 + sub * 0.5 + metallic + noise) * Math.min(1, t * 100);
  }
  return samples;
}

// 3. Ultimate Cast (Ascending cosmic energy surge)
function generateUltimateCast() {
  const duration = 0.8;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 150 + 600 * (t / duration) ** 2;
    const sweep = Math.sin(2 * Math.PI * freq * t);
    const shimmer = Math.sin(2 * Math.PI * (freq * 2.01) * t) * 0.3;
    const env = t < 0.1 ? (t / 0.1) : Math.exp(-(t - 0.1) * 3);
    samples[i] = (sweep + shimmer) * env * 0.75;
  }
  return samples;
}

// 4. Level Up (Ascending celestial arpeggio: C4, E4, G4, C5)
function generateLevelUp() {
  const duration = 0.6;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const notes = [261.63, 329.63, 392.00, 523.25];
  const noteDur = duration / notes.length;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.min(notes.length - 1, Math.floor(t / noteDur));
    const noteT = t - noteIdx * noteDur;
    const freq = notes[noteIdx];
    const wave = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t);
    const env = Math.exp(-noteT * 10);
    samples[i] = wave * env * 0.6;
  }
  return samples;
}

// 5. Evolution Fanfare (Glorious chord progression)
function generateEvolutionFanfare() {
  const duration = 1.2;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const chords = [
    [261.63, 329.63, 392.00], // C maj
    [293.66, 369.99, 440.00], // D maj
    [329.63, 415.30, 493.88], // E maj
    [523.25, 659.25, 783.99]  // High C maj
  ];
  const stepDur = duration / chords.length;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.min(chords.length - 1, Math.floor(t / stepDur));
    const stepT = t - chordIdx * stepDur;
    const freqs = chords[chordIdx];
    let wave = 0;
    for (const f of freqs) {
      wave += Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(2 * Math.PI * f * 2 * t);
    }
    const env = Math.exp(-stepT * 4);
    samples[i] = (wave / freqs.length) * env * 0.7;
  }
  return samples;
}

// 6. Dungeon Reward / Relic Loot (Sparkling crystal bell)
function generateDungeonReward() {
  const duration = 0.7;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const freqs = [587.33, 880.00, 1174.66, 1760.00]; // D major bell
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let val = 0;
    freqs.forEach((f, idx) => {
      const delay = idx * 0.08;
      if (t >= delay) {
        const localT = t - delay;
        val += Math.sin(2 * Math.PI * f * localT) * Math.exp(-localT * 8);
      }
    });
    samples[i] = val * 0.28;
  }
  return samples;
}

// 7. Button Tap (Crisp UI click)
function generateButtonTap() {
  const duration = 0.04;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 1200 * Math.exp(-t * 60);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 70) * 0.5;
  }
  return samples;
}

// =========================================================================
// BGM LOOP GENERATORS (12-Second Seamless Loops)
// =========================================================================

// 1. Sanctum Ambient (Calm ethereal astral drone with harp notes)
function generateSanctumAmbient() {
  const duration = 12.0;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const droneFreqs = [110.00, 164.81, 220.00, 277.18]; // A minor pad

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Ambient warm drone with gentle LFO modulation
    let drone = 0;
    const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.2 * t);
    droneFreqs.forEach((f, idx) => {
      drone += Math.sin(2 * Math.PI * f * t) * (0.15 / (idx + 1));
    });

    // Gentle harp arpeggios every 1.5s
    const arpHits = [440, 523.25, 659.25, 783.99, 659.25, 523.25, 440, 329.63];
    const hitIdx = Math.floor(t / 1.5) % arpHits.length;
    const hitT = t % 1.5;
    const harp = Math.sin(2 * Math.PI * arpHits[hitIdx] * hitT) * Math.exp(-hitT * 3.5) * 0.18;

    samples[i] = (drone * lfo + harp) * 0.7;
  }
  return samples;
}

// 2. Battle Madness (Driving percussion beat + tension bassline)
function generateBattleMadness() {
  const duration = 12.0;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const bpm = 120;
  const beatDur = 60 / bpm; // 0.5s

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatT = t % beatDur;
    const beatIndex = Math.floor(t / beatDur);

    // Kick drum on every beat
    const kick = Math.sin(2 * Math.PI * 90 * Math.exp(-beatT * 35) * beatT) * Math.exp(-beatT * 14) * 0.45;

    // Snare / clap on beats 2 & 4
    const isSnare = (beatIndex % 2 === 1);
    const snare = isSnare ? (Math.random() * 2 - 1) * Math.exp(-beatT * 22) * 0.25 : 0;

    // Rolling bass synth
    const bassNotes = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42];
    const bassFreq = bassNotes[beatIndex % bassNotes.length];
    const bass = (Math.sin(2 * Math.PI * bassFreq * t) + 0.3 * Math.sin(2 * Math.PI * bassFreq * 2 * t)) * 0.22;

    samples[i] = kick + snare + bass;
  }
  return samples;
}

// 3. Pantheon Trials (Epic divine brass chord progression)
function generatePantheonTrials() {
  const duration = 12.0;
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  const chordCycle = [
    [130.81, 196.00, 261.63, 311.13], // C min
    [116.54, 174.61, 233.08, 293.66], // Bb maj
    [103.83, 155.56, 207.65, 261.63], // Ab maj
    [98.00,  146.83, 196.00, 246.94]  // G maj (Phrygian dominant cadence)
  ];
  const chordDur = 3.0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / chordDur) % chordCycle.length;
    const cT = t % chordDur;
    const freqs = chordCycle[chordIdx];

    let chord = 0;
    freqs.forEach(f => {
      chord += Math.sin(2 * Math.PI * f * t) * 0.12;
      chord += Math.sin(2 * Math.PI * f * 2 * t) * 0.04;
    });

    // Deep sub boom on chord transitions
    const sub = Math.sin(2 * Math.PI * 45 * cT) * Math.exp(-cT * 3) * 0.35;

    // Choir pulse
    const choirLfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t);

    samples[i] = (chord * choirLfo + sub) * 0.8;
  }
  return samples;
}

// Write files
console.log('--- Generating High-Quality Free-Of-Use Placeholder Audio Assets ---');
writeWav('public/audio/sfx/attack_hit.wav', generateAttackHit());
writeWav('public/audio/sfx/crit_hit.wav', generateCritHit());
writeWav('public/audio/sfx/ultimate_cast.wav', generateUltimateCast());
writeWav('public/audio/sfx/level_up.wav', generateLevelUp());
writeWav('public/audio/sfx/evolution_fanfare.wav', generateEvolutionFanfare());
writeWav('public/audio/sfx/dungeon_reward.wav', generateDungeonReward());
writeWav('public/audio/sfx/button_tap.wav', generateButtonTap());

writeWav('public/audio/bgm/sanctum_ambient.wav', generateSanctumAmbient());
writeWav('public/audio/bgm/battle_madness.wav', generateBattleMadness());
writeWav('public/audio/bgm/trials_pantheon.wav', generatePantheonTrials());

console.log('--- Audio Assets Generated Successfully! ---');
