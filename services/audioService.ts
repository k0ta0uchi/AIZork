
import { BGMMood } from "../types";

let audioContext: AudioContext | null = null;
let isSfxMuted = false;
let isBgmMuted = false;

// --- SFX Section ---

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const setMute = (muted: boolean) => {
  isSfxMuted = muted;
};

export const setBgmMute = (muted: boolean) => {
  isBgmMuted = muted;
  if (isBgmMuted) {
    stopBGM();
  } else if (currentMood) {
    playBGM(currentMood);
  }
};

export const playInputSound = () => {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

export const playResponseSound = () => {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.setValueAtTime(440, now + 0.05);
  osc.frequency.setValueAtTime(330, now + 0.1);

  gain.gain.setValueAtTime(0.02, now);
  gain.gain.linearRampToValueAtTime(0.02, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(now + 0.15);
};

export const playImportantSound = () => {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  
  [440, 554, 659, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + (i * 0.08);

    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.05, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
};

export const playGameOverSound = () => {
  if (isSfxMuted) return;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 1.5);
};

// --- BGM Engine Section ---

let bgmInterval: number | null = null;
let currentMood: BGMMood | null = null;
let currentStep = 0;

// Frequencies for notes
const N = {
  G1: 49.00,
  C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, Eb2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
  C3: 130.81, Cs3: 138.59, Db3: 138.59, D3: 146.83, Ds3: 155.56, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, Ab3: 207.65, A3: 220.00, As3: 233.08, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00,
  C6: 1046.50, E6: 1318.51,
  xx: 0 // Rest
};

interface Pattern {
  voice1: number[];
  voice2: number[];
  voice3: number[];
  noise: number[];
}

interface Track {
  tempo: number; // ms per step
  voice1: number[];
  voice2: number[];
  voice3: number[];
  noise: number[];
}

// Composition Helper
const composeTrack = (tempo: number, patterns: Record<string, Pattern>, sequence: string[]): Track => {
  const track: Track = { tempo, voice1: [], voice2: [], voice3: [], noise: [] };
  sequence.forEach(key => {
    const p = patterns[key];
    if (p) {
      track.voice1.push(...p.voice1);
      track.voice2.push(...p.voice2);
      track.voice3.push(...p.voice3);
      track.noise.push(...p.noise);
    }
  });
  return track;
};

// -- Musical Data (Patterns) --

// EXPLORATION: Adventurous, Optimistic
const P_EXP_A: Pattern = {
  voice1: [N.E4, N.xx, N.G4, N.xx, N.C5, N.xx, N.B4, N.A4, N.G4, N.xx, N.E4, N.xx, N.A4, N.G4, N.F4, N.D4],
  voice2: [N.C4, N.xx, N.E4, N.xx, N.G4, N.xx, N.G4, N.F4, N.E4, N.xx, N.C4, N.xx, N.F4, N.E4, N.D4, N.B3],
  voice3: [N.C3, N.G3, N.C3, N.G3, N.C3, N.G3, N.C3, N.G3, N.D3, N.A3, N.D3, N.A3, N.D3, N.A3, N.G2, N.B2],
  noise:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
};
const P_EXP_B: Pattern = {
  voice1: [N.C5, N.xx, N.E5, N.D5, N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, N.F4, N.G4, N.A4, N.B4, N.C5, N.D5],
  voice2: [N.A4, N.xx, N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, N.D4, N.C4, N.D4, N.E4, N.F4, N.G4, N.A4, N.B4],
  voice3: [N.A2, N.E3, N.A2, N.E3, N.A2, N.E3, N.A2, N.E3, N.F2, N.C3, N.F2, N.C3, N.G2, N.D3, N.G2, N.B2],
  noise:  [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
};

// INDOOR: Cozy, Calm, Slower
const P_IND_A: Pattern = {
  voice1: [N.E4, N.xx, N.xx, N.xx, N.C4, N.xx, N.xx, N.xx, N.D4, N.xx, N.E4, N.F4, N.G4, N.xx, N.xx, N.xx],
  voice2: [N.C4, N.G3, N.E4, N.G3, N.C4, N.G3, N.E4, N.G3, N.B3, N.G3, N.D4, N.G3, N.B3, N.G3, N.D4, N.G3],
  voice3: [N.C3, N.xx, N.C3, N.xx, N.C3, N.xx, N.C3, N.xx, N.G2, N.xx, N.G2, N.xx, N.G2, N.xx, N.G2, N.xx],
  noise:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // No drums for cozy feel
};
const P_IND_B: Pattern = {
  voice1: [N.A4, N.xx, N.xx, N.xx, N.F4, N.xx, N.xx, N.xx, N.G4, N.xx, N.A4, N.B4, N.C5, N.xx, N.xx, N.xx],
  voice2: [N.F4, N.C4, N.A4, N.C4, N.F4, N.C4, N.A4, N.C4, N.E4, N.C4, N.G4, N.C4, N.E4, N.C4, N.G4, N.C4],
  voice3: [N.F2, N.xx, N.F2, N.xx, N.F2, N.xx, N.F2, N.xx, N.C3, N.xx, N.C3, N.xx, N.C3, N.xx, N.C3, N.xx],
  noise:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

// DUNGEON: Echoey, Minimal, Dark
const P_DNG_A: Pattern = {
  voice1: [N.C3, N.xx, N.xx, N.xx, N.Eb3, N.xx, N.xx, N.xx, N.G3, N.xx, N.xx, N.xx, N.Fs3, N.xx, N.xx, N.xx],
  voice2: [N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx], // Sparse
  voice3: [N.C2, N.xx, N.xx, N.xx, N.C2, N.xx, N.xx, N.xx, N.G2, N.xx, N.xx, N.xx, N.Fs2, N.xx, N.xx, N.xx],
  noise:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Rare echo hit
};
const P_DNG_B: Pattern = {
  voice1: [N.xx, N.xx, N.B2, N.xx, N.xx, N.xx, N.D3, N.xx, N.xx, N.xx, N.F3, N.xx, N.xx, N.xx, N.Ab3, N.xx],
  voice2: [N.xx, N.G2, N.xx, N.xx, N.xx, N.G2, N.xx, N.xx, N.xx, N.G2, N.xx, N.xx, N.xx, N.G2, N.xx, N.xx],
  voice3: [N.G1, N.xx, N.xx, N.xx, N.G1, N.xx, N.xx, N.xx, N.G1, N.xx, N.xx, N.xx, N.G1, N.xx, N.xx, N.xx],
  noise:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

// MYSTERIOUS: Whole tone, odd
const P_MYS_A: Pattern = {
  voice1: [N.C4, N.D4, N.E4, N.Fs4, N.Gs4, N.As4, N.C5, N.xx, N.C5, N.As4, N.Gs4, N.Fs4, N.E4, N.D4, N.C4, N.xx],
  voice2: [N.E4, N.Fs4, N.Gs4, N.As4, N.C5, N.D5, N.E5, N.xx, N.E5, N.D5, N.C5, N.As4, N.Gs4, N.Fs4, N.E4, N.xx],
  voice3: [N.C3, N.xx, N.xx, N.xx, N.E3, N.xx, N.xx, N.xx, N.Gs3, N.xx, N.xx, N.xx, N.C4, N.xx, N.xx, N.xx],
  noise:  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0]
};

// DANGER: Tension, Chromatic, Fast Bass
const P_DNGER_A: Pattern = {
  voice1: [N.C4, N.Cs4, N.D4, N.Cs4, N.C4, N.B3, N.Bb3, N.B3, N.C4, N.Cs4, N.D4, N.Cs4, N.C4, N.B3, N.Bb3, N.B3],
  voice2: [N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.Fs4, N.xx, N.Fs4, N.xx, N.Fs4, N.xx, N.Fs4, N.xx],
  voice3: [N.C2, N.C2, N.Cs2, N.Cs2, N.D2, N.D2, N.Eb2, N.Eb2, N.E2, N.E2, N.F2, N.F2, N.Fs2, N.Fs2, N.G2, N.G2],
  noise:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
};

// BATTLE: Fast, Arpeggios
const P_BTL_A: Pattern = {
  voice1: [N.A4, N.A4, N.G4, N.A4, N.C5, N.xx, N.A4, N.xx, N.G4, N.G4, N.F4, N.G4, N.A4, N.xx, N.G4, N.xx],
  voice2: [N.E4, N.E4, N.E4, N.E4, N.E4, N.xx, N.E4, N.xx, N.D4, N.D4, N.D4, N.D4, N.D4, N.xx, N.D4, N.xx],
  voice3: [N.A2, N.A2, N.A2, N.A2, N.G2, N.G2, N.G2, N.G2, N.F2, N.F2, N.F2, N.F2, N.E2, N.E2, N.E2, N.E2],
  noise:  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0]
};
const P_BTL_B: Pattern = {
  voice1: [N.D5, N.D5, N.C5, N.D5, N.F5, N.xx, N.D5, N.xx, N.C5, N.C5, N.B4, N.C5, N.D5, N.xx, N.C5, N.xx],
  voice2: [N.A4, N.A4, N.A4, N.A4, N.A4, N.xx, N.A4, N.xx, N.G4, N.G4, N.G4, N.G4, N.G4, N.xx, N.G4, N.xx],
  voice3: [N.D3, N.D3, N.D3, N.D3, N.C3, N.C3, N.C3, N.C3, N.B2, N.B2, N.B2, N.B2, N.A2, N.A2, N.A2, N.A2],
  noise:  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0]
};

// VICTORY: Fanfare (One pattern, repeated with slight var or just looped)
const P_VIC_A: Pattern = {
  voice1: [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.C6, N.xx, N.G5, N.E5, N.C5, N.G4, N.E4, N.C4, N.xx, N.xx],
  voice2: [N.E4, N.G4, N.C5, N.E5, N.G5, N.C6, N.E6, N.xx, N.C6, N.G5, N.E5, N.C5, N.G4, N.E4, N.xx, N.xx],
  voice3: [N.C3, N.C3, N.C3, N.C3, N.C3, N.C3, N.C3, N.xx, N.G2, N.G2, N.G2, N.G2, N.C3, N.C3, N.xx, N.xx],
  noise:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
};

// GAME_OVER: Dirge
const P_GO_A: Pattern = {
  voice1: [N.C4, N.xx, N.B3, N.xx, N.Bb3, N.xx, N.A3, N.xx, N.Ab3, N.xx, N.G3, N.xx, N.C3, N.xx, N.xx, N.xx],
  voice2: [N.E3, N.xx, N.Eb3, N.xx, N.D3, N.xx, N.Db3, N.xx, N.C3, N.xx, N.B2, N.xx, N.G2, N.xx, N.xx, N.xx],
  voice3: [N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.xx, N.xx],
  noise:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
};

// -- Composed Tracks --

const TRACKS: Record<string, Track> = {
  [BGMMood.EXPLORATION]: composeTrack(200, { A: P_EXP_A, B: P_EXP_B }, 
    // A A B A A A B B ... extended to ~2 mins
    ['A','A','B','A', 'A','A','B','B', 'A','B','A','A', 'B','A','A','B', 'A','A','A','A', 'B','B','B','B']
  ),
  [BGMMood.INDOOR]: composeTrack(300, { A: P_IND_A, B: P_IND_B },
    // A A B A ...
    ['A','A','B','A', 'A','A','B','B', 'A','B','A','B', 'A','A','A','A']
  ),
  [BGMMood.DUNGEON]: composeTrack(400, { A: P_DNG_A, B: P_DNG_B },
    // Slow, dark
    ['A','A','B','A', 'B','B','A','B', 'A','A','A','B']
  ),
  [BGMMood.MYSTERIOUS]: composeTrack(250, { A: P_MYS_A },
    // Repetitive but hypnotic
    ['A','A','A','A', 'A','A','A','A', 'A','A','A','A']
  ),
  [BGMMood.DANGER]: composeTrack(130, { A: P_DNGER_A },
    // Fast chromatic tension
    ['A','A','A','A', 'A','A','A','A', 'A','A','A','A', 'A','A','A','A']
  ),
  [BGMMood.BATTLE]: composeTrack(120, { A: P_BTL_A, B: P_BTL_B },
    // Fast action
    ['A','A','B','A', 'A','B','A','B', 'A','A','B','B', 'A','B','A','A', 'A','A','B','A']
  ),
  [BGMMood.VICTORY]: composeTrack(150, { A: P_VIC_A },
    ['A','A','A','A']
  ),
  [BGMMood.GAME_OVER]: composeTrack(300, { A: P_GO_A },
    ['A','A']
  ),
};

const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 0.1; // 0.1 sec noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

const playNoise = (ctx: AudioContext, vol: number) => {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  const gain = ctx.createGain();
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  
  noise.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
};

const playNote = (ctx: AudioContext, freq: number, type: OscillatorType, duration: number, vol: number) => {
  if (freq <= 0) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Decay
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playBGM = (mood: BGMMood) => {
  if (currentMood === mood && bgmInterval) return; // Already playing this track
  stopBGM();
  
  currentMood = mood;
  if (isBgmMuted || !mood) return;

  const track = TRACKS[mood];
  if (!track) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  currentStep = 0;
  const stepTime = track.tempo;

  bgmInterval = window.setInterval(() => {
    if (!currentMood || isBgmMuted) {
      stopBGM();
      return;
    }

    // Voice 1: Melody (Square)
    const note1 = track.voice1[currentStep % track.voice1.length];
    playNote(ctx, note1, 'square', stepTime / 1000 * 0.9, 0.03);

    // Voice 2: Harmony (Triangle)
    const note2 = track.voice2[currentStep % track.voice2.length];
    playNote(ctx, note2, 'triangle', stepTime / 1000 * 0.9, 0.02);

    // Voice 3: Bass (Triangle)
    const note3 = track.voice3[currentStep % track.voice3.length];
    playNote(ctx, note3, 'triangle', stepTime / 1000 * 1.5, 0.04);

    // Voice 4: Noise (Percussion)
    const hit = track.noise[currentStep % track.noise.length];
    if (hit) playNoise(ctx, 0.02);

    currentStep++;
  }, stepTime);
};

export const stopBGM = () => {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
    currentMood = null;
  }
};
