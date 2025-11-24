

import { BGMMood, GameVersion } from "../types";

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
  } else if (currentMood && currentVersion) {
    playBGM(currentMood, currentVersion);
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
let currentVersion: GameVersion | null = null;
let currentStep = 0;

// Frequencies for notes
const N = {
  G0: 24.50, Ab0: 25.96, A0: 27.50, Bb0: 29.14, B0: 30.87,
  C1: 32.70, Cs1: 34.65, Db1: 34.65, D1: 36.71, Ds1: 38.89, Eb1: 38.89, E1: 41.20,
  F1: 43.65, Gb1: 46.25, G1: 49.00, Ab1: 51.91, A1: 55.00, Bb1: 58.27, B1: 61.74,
  C2: 65.41, Cs2: 69.30, Db2: 69.30, D2: 73.42, Ds2: 77.78, Eb2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, Gb2: 92.50, G2: 98.00, Gs2: 103.83, Ab2: 103.83, A2: 110.00, As2: 116.54, Bb2: 116.54, B2: 123.47,
  C3: 130.81, Cs3: 138.59, Db3: 138.59, D3: 146.83, Ds3: 155.56, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, Gb3: 185.00, G3: 196.00, Gs3: 207.65, Ab3: 207.65, A3: 220.00, As3: 233.08, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, Db4: 277.18, D4: 293.66, Ds4: 311.13, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, Gb4: 369.99, G4: 392.00, Gs4: 415.30, Ab4: 415.30, A4: 440.00, As4: 466.16, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, Db5: 554.37, D5: 587.33, Ds5: 622.25, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, Gb5: 739.99, G5: 783.99, Gs5: 830.61, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, E6: 1318.51,
  xx: 0 // Rest
};

interface Pattern {
  voice1: number[];
  voice2: number[];
  voice3: number[];
  voice4?: number[]; // Extended voices for richer sound (Title)
  voice5?: number[];
  voice6?: number[];
  voice7?: number[];
  voice8?: number[];
  noise: number[];
}

interface Track {
  tempo: number; // ms per step
  voice1: number[];
  voice2: number[];
  voice3: number[];
  voice4: number[];
  voice5: number[];
  voice6: number[];
  voice7: number[];
  voice8: number[];
  noise: number[];
}

// Composition Helper
const composeTrack = (tempo: number, patterns: Record<string, Pattern>, sequence: string[]): Track => {
  const track: Track = { 
    tempo, 
    voice1: [], voice2: [], voice3: [], 
    voice4: [], voice5: [], voice6: [], voice7: [], voice8: [],
    noise: [] 
  };
  
  sequence.forEach(key => {
    const p = patterns[key];
    if (p) {
      track.voice1.push(...p.voice1);
      track.voice2.push(...p.voice2);
      track.voice3.push(...p.voice3);
      // Handle optional extended voices (fill with rests if missing)
      track.voice4.push(...(p.voice4 || Array(p.voice1.length).fill(0)));
      track.voice5.push(...(p.voice5 || Array(p.voice1.length).fill(0)));
      track.voice6.push(...(p.voice6 || Array(p.voice1.length).fill(0)));
      track.voice7.push(...(p.voice7 || Array(p.voice1.length).fill(0)));
      track.voice8.push(...(p.voice8 || Array(p.voice1.length).fill(0)));
      track.noise.push(...p.noise);
    }
  });
  return track;
};

// ==========================================
// ZORK I PATTERNS
// ==========================================

const P_Z1_EXP_A: Pattern = {
  voice1: [N.E4, N.xx, N.G4, N.xx, N.C5, N.xx, N.B4, N.A4, N.G4, N.xx, N.E4, N.xx, N.A4, N.G4, N.F4, N.D4],
  voice2: [N.C4, N.xx, N.E4, N.xx, N.G4, N.xx, N.G4, N.F4, N.E4, N.xx, N.C4, N.xx, N.F4, N.E4, N.D4, N.B3],
  voice3: [N.C3, N.G3, N.C3, N.G3, N.C3, N.G3, N.C3, N.G3, N.D3, N.A3, N.D3, N.A3, N.D3, N.A3, N.G2, N.B2],
  noise:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
};
const P_Z1_EXP_B: Pattern = {
  voice1: [N.C5, N.xx, N.E5, N.D5, N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, N.F4, N.G4, N.A4, N.B4, N.C5, N.D5],
  voice2: [N.A4, N.xx, N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, N.D4, N.C4, N.D4, N.E4, N.F4, N.G4, N.A4, N.B4],
  voice3: [N.A2, N.E3, N.A2, N.E3, N.A2, N.E3, N.A2, N.E3, N.F2, N.C3, N.F2, N.C3, N.G2, N.D3, N.G2, N.B2],
  noise:  [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
};
const P_Z1_DNG_A: Pattern = {
  voice1: [N.C3, N.xx, N.xx, N.xx, N.Eb3, N.xx, N.xx, N.xx, N.G3, N.xx, N.xx, N.xx, N.Fs3, N.xx, N.xx, N.xx],
  voice2: [N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx],
  voice3: [N.C2, N.xx, N.xx, N.xx, N.C2, N.xx, N.xx, N.xx, N.G2, N.xx, N.xx, N.xx, N.Fs2, N.xx, N.xx, N.xx],
  noise:  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
const P_Z1_BTL_A: Pattern = {
  voice1: [N.A4, N.A4, N.G4, N.A4, N.C5, N.xx, N.A4, N.xx, N.G4, N.G4, N.F4, N.G4, N.A4, N.xx, N.G4, N.xx],
  voice2: [N.E4, N.E4, N.E4, N.E4, N.E4, N.xx, N.E4, N.xx, N.D4, N.D4, N.D4, N.D4, N.D4, N.xx, N.D4, N.xx],
  voice3: [N.A2, N.A2, N.A2, N.A2, N.G2, N.G2, N.G2, N.G2, N.F2, N.F2, N.F2, N.F2, N.E2, N.E2, N.E2, N.E2],
  noise:  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0]
};

// ==========================================
// ZORK II PATTERNS
// ==========================================
const P_Z2_MAG_A: Pattern = {
  voice1: [N.C5, N.xx, N.E5, N.G5, N.xx, N.C5, N.E5, N.G5, N.B4, N.xx, N.D5, N.F5, N.xx, N.B4, N.D5, N.F5],
  voice2: [N.E4, N.G4, N.C5, N.E4, N.G4, N.C5, N.E4, N.G4, N.D4, N.F4, N.B4, N.D4, N.F4, N.B4, N.D4, N.F4],
  voice3: [N.C3, N.xx, N.xx, N.C3, N.xx, N.xx, N.C3, N.xx, N.G2, N.xx, N.xx, N.G2, N.xx, N.xx, N.G2, N.xx],
  noise:  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0]
};
const P_Z2_WIZ_A: Pattern = {
  voice1: [N.C4, N.D4, N.E4, N.Fs4, N.Gs4, N.As4, N.C5, N.D5, N.E5, N.D5, N.C5, N.As4, N.Gs4, N.Fs4, N.E4, N.D4],
  voice2: [N.E4, N.xx, N.Gs4, N.xx, N.C5, N.xx, N.E5, N.xx, N.C5, N.xx, N.Gs4, N.xx, N.E4, N.xx, N.C4, N.xx],
  voice3: [N.C3, N.xx, N.E3, N.xx, N.Gs3, N.xx, N.As3, N.xx, N.C3, N.xx, N.E3, N.xx, N.Gs3, N.xx, N.As3, N.xx],
  noise:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
};
const P_Z2_PLAY_A: Pattern = {
  voice1: [N.A4, N.B4, N.C5, N.A4, N.D5, N.C5, N.B4, N.G4, N.E4, N.F4, N.G4, N.E4, N.A4, N.G4, N.F4, N.D4],
  voice2: [N.C4, N.E4, N.A4, N.E4, N.B3, N.D4, N.G4, N.D4, N.C4, N.E4, N.G4, N.E4, N.F3, N.A3, N.D4, N.A3],
  voice3: [N.A2, N.xx, N.A2, N.xx, N.G2, N.xx, N.G2, N.xx, N.C3, N.xx, N.C3, N.xx, N.D3, N.xx, N.D3, N.xx],
  noise:  [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]
};
const P_Z2_DEM_A: Pattern = {
  voice1: [N.C3, N.Eb3, N.C3, N.Eb3, N.F3, N.G3, N.F3, N.G3, N.C3, N.Eb3, N.C3, N.Eb3, N.Bb3, N.B3, N.C4, N.xx],
  voice2: [N.G2, N.G2, N.G2, N.G2, N.G2, N.G2, N.G2, N.G2, N.G2, N.G2, N.G2, N.G2, N.F2, N.F2, N.E2, N.E2],
  voice3: [N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.Db2, N.xx, N.D2, N.xx],
  noise:  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
};

// ==========================================
// ZORK III PATTERNS
// ==========================================
const P_Z3_MAIN_A: Pattern = {
  voice1: [N.C4, N.xx, N.Eb4, N.xx, N.G4, N.xx, N.Bb4, N.xx, N.C5, N.xx, N.Bb4, N.xx, N.G4, N.xx, N.Eb4, N.xx],
  voice2: [N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3, N.G3],
  voice3: [N.C2, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.G2, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx, N.xx],
  noise:  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
const P_Z3_ROYAL_A: Pattern = {
  voice1: [N.D5, N.C5, N.B4, N.A4, N.G4, N.F4, N.E4, N.D4, N.C4, N.B3, N.A3, N.G3, N.A3, N.B3, N.C4, N.Cs4],
  voice2: [N.D4, N.xx, N.G4, N.xx, N.B3, N.xx, N.G3, N.xx, N.E3, N.xx, N.C4, N.xx, N.F3, N.xx, N.A3, N.xx],
  voice3: [N.D3, N.A2, N.D3, N.A2, N.G2, N.D2, N.G2, N.D2, N.C3, N.G2, N.C3, N.G2, N.F2, N.C2, N.F2, N.C2],
  noise:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
const P_Z3_GUARD_A: Pattern = {
  voice1: [N.C4, N.C4, N.xx, N.C4, N.Eb4, N.Eb4, N.xx, N.Eb4, N.F4, N.F4, N.xx, N.F4, N.G4, N.G4, N.Ab4, N.G4],
  voice2: [N.C3, N.C3, N.xx, N.C3, N.C3, N.C3, N.xx, N.C3, N.C3, N.C3, N.xx, N.C3, N.B2, N.B2, N.B2, N.B2],
  voice3: [N.C2, N.C2, N.C2, N.C2, N.C2, N.C2, N.C2, N.C2, N.G1, N.G1, N.G1, N.G1, N.G1, N.G1, N.G1, N.G1],
  noise:  [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1]
};

// ==========================================
// REMIX PATTERNS
// ==========================================
const P_RMX_GLITCH_A: Pattern = {
  voice1: [N.C6, N.C3, N.E6, N.E3, N.G2, N.G5, N.xx, N.C4, N.C6, N.C3, N.E6, N.E3, N.G2, N.G5, N.xx, N.xx],
  voice2: [N.C3, N.Cs3, N.D3, N.Ds3, N.E3, N.F3, N.Fs3, N.G3, N.Gs3, N.A3, N.As3, N.B3, N.C4, N.Cs4, N.D4, N.Ds4],
  voice3: [N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.C2, N.xx, N.Gb1, N.xx, N.Gb1, N.xx, N.Gb1, N.xx, N.Gb1, N.xx],
  noise:  [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1]
};
const P_RMX_CHAOS_A: Pattern = {
  voice1: [N.F5, N.E5, N.Eb5, N.D5, N.Db5, N.C5, N.B4, N.Bb4, N.A4, N.Ab4, N.G4, N.Gb4, N.F4, N.E4, N.Eb4, N.D4],
  voice2: [N.xx, N.C6, N.xx, N.B5, N.xx, N.Bb5, N.xx, N.A5, N.xx, N.Ab5, N.xx, N.G5, N.xx, N.Gb5, N.xx, N.F5],
  voice3: [N.F2, N.C2, N.F2, N.C2, N.F2, N.C2, N.F2, N.C2, N.Bb1, N.F1, N.Bb1, N.F1, N.Bb1, N.F1, N.Bb1, N.F1],
  noise:  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
};

// ==========================================
// TITLE THEME PATTERNS (8-VOICE)
// ==========================================

// Intro: Deep Drone
const P_TIT_INTRO: Pattern = {
  voice1: Array(16).fill(0),
  voice2: Array(16).fill(0),
  voice3: Array(16).fill(0),
  voice4: Array(16).fill(0),
  voice5: [N.C4, 0, 0, 0, N.C4, 0, 0, 0, N.G3, 0, 0, 0, N.G3, 0, 0, 0], // Pad High
  voice6: [N.C3, 0, 0, 0, N.C3, 0, 0, 0, N.G2, 0, 0, 0, N.G2, 0, 0, 0], // Pad Low
  voice7: [N.C2, 0, 0, 0, N.C2, 0, 0, 0, N.C2, 0, 0, 0, N.C2, 0, 0, 0], // Sub Bass
  voice8: [N.C1, 0, 0, 0, N.C1, 0, 0, 0, N.C1, 0, 0, 0, N.C1, 0, 0, 0], // Rumble
  noise:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

// Main Theme A: Arps enter
const P_TIT_MAIN_A: Pattern = {
  voice1: [N.C5, 0, 0, 0, N.Eb5, 0, 0, 0, N.G5, 0, 0, 0, N.F5, 0, 0, 0], // Melody Lead
  voice2: [N.C4, 0, 0, 0, N.Eb4, 0, 0, 0, N.G4, 0, 0, 0, N.F4, 0, 0, 0], // Melody Shadow
  voice3: [N.C4, N.Eb4, N.G4, N.Eb4, N.C4, N.Eb4, N.G4, N.Eb4, N.Bb3, N.D4, N.F4, N.D4, N.Bb3, N.D4, N.F4, N.D4], // Arp 1
  voice4: [N.G3, N.C4, N.Eb4, N.C4, N.G3, N.C4, N.Eb4, N.C4, N.F3, N.Bb3, N.D4, N.Bb3, N.F3, N.Bb3, N.D4, N.Bb3], // Arp 2
  voice5: [N.C4, 0, 0, 0, 0, 0, 0, 0, N.Bb3, 0, 0, 0, 0, 0, 0, 0], // Pad
  voice6: [N.C3, 0, 0, 0, 0, 0, 0, 0, N.Bb2, 0, 0, 0, 0, 0, 0, 0], // Pad
  voice7: [N.C2, 0, 0, 0, N.C2, 0, 0, 0, N.Bb1, 0, 0, 0, N.Bb1, 0, 0, 0], // Bass
  voice8: [N.C1, 0, 0, 0, N.C1, 0, 0, 0, N.Bb0, 0, 0, 0, N.Bb0, 0, 0, 0], // Sub
  noise:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
};

// Main Theme B: Variation
const P_TIT_MAIN_B: Pattern = {
  voice1: [N.Ab4, 0, 0, 0, N.C5, 0, 0, 0, N.Eb5, 0, 0, 0, N.G5, 0, 0, 0], 
  voice2: [N.Ab3, 0, 0, 0, N.C4, 0, 0, 0, N.Eb4, 0, 0, 0, N.G4, 0, 0, 0], 
  voice3: [N.Ab3, N.C4, N.Eb4, N.C4, N.Ab3, N.C4, N.Eb4, N.C4, N.G3, N.C4, N.Eb4, N.C4, N.G3, N.C4, N.Eb4, N.C4],
  voice4: [N.Eb3, N.Ab3, N.C4, N.Ab3, N.Eb3, N.Ab3, N.C4, N.Ab3, N.Eb3, N.G3, N.C4, N.G3, N.Eb3, N.G3, N.C4, N.G3],
  voice5: [N.Ab3, 0, 0, 0, 0, 0, 0, 0, N.G3, 0, 0, 0, 0, 0, 0, 0],
  voice6: [N.Ab2, 0, 0, 0, 0, 0, 0, 0, N.G2, 0, 0, 0, 0, 0, 0, 0],
  voice7: [N.Ab1, 0, 0, 0, N.Ab1, 0, 0, 0, N.G1, 0, 0, 0, N.G1, 0, 0, 0],
  voice8: [N.Ab0, 0, 0, 0, N.Ab0, 0, 0, 0, N.G0, 0, 0, 0, N.G0, 0, 0, 0],
  noise:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0]
};

// ==========================================
// TRACK DEFINITIONS
// ==========================================

// Helper to bundle tracks
const createTracks = (list: Track[]) => list;

const ZORK1_TRACKS = {
  [BGMMood.TITLE]: createTracks([
    composeTrack(240, 
      { I: P_TIT_INTRO, A: P_TIT_MAIN_A, B: P_TIT_MAIN_B }, 
      // Structure for ~3 minutes (180s). 
      // Each step 240ms * 16 steps = 3.84s per pattern.
      // Need approx 45-50 patterns.
      [
        'I','I','I','I', // Intro 15s
        'A','A','B','B', // Theme 1 15s
        'A','A','B','B', // Theme 2 15s
        'A','A','B','B', // Theme 3 15s
        'A','A','B','B', // Theme 4 15s
        'I','I',         // Breakdown 7s
        'A','A','B','B', // Return 15s
        'A','A','B','B', // Return 15s
        'A','A','A','A', // Outro 15s
        'I','I','I','I'  // Fade 15s
      ]
    )
  ]),
  [BGMMood.EXPLORATION]: createTracks([
    composeTrack(200, { A: P_Z1_EXP_A, B: P_Z1_EXP_B }, ['A','A','B','A','A','A','B','B']),
    composeTrack(180, { A: P_Z1_EXP_B, B: P_Z1_EXP_A }, ['A','B','A','B','A','A','B','B']),
    composeTrack(220, { A: P_Z1_EXP_A }, ['A','A','A','A','A','A','A','A']),
  ]),
  [BGMMood.DUNGEON]: createTracks([
    composeTrack(400, { A: P_Z1_DNG_A }, ['A','A','A','A','A','A','A','A']),
    composeTrack(350, { A: P_Z1_DNG_A, B: P_Z1_EXP_A }, ['A','A','B','A']),
  ]),
  [BGMMood.BATTLE]: createTracks([
    composeTrack(120, { A: P_Z1_BTL_A }, ['A','A','A','A','A','A','A','A']),
  ]),
  [BGMMood.INDOOR]: createTracks([
     composeTrack(300, { A: P_Z1_EXP_A }, ['A','A']),
  ]),
};

const ZORK2_TRACKS = {
  [BGMMood.EXPLORATION]: createTracks([
    composeTrack(180, { A: P_Z2_MAG_A }, ['A','A','A','A','A','A','A','A']),
    composeTrack(200, { A: P_Z2_PLAY_A }, ['A','A','A','A','A','A','A','A']),
    composeTrack(190, { A: P_Z2_MAG_A, B: P_Z2_PLAY_A }, ['A','B','A','B','A','A','B','B']),
  ]),
  [BGMMood.DUNGEON]: createTracks([
    composeTrack(250, { A: P_Z2_WIZ_A }, ['A','A','A','A']),
    composeTrack(300, { A: P_Z1_DNG_A, B: P_Z2_WIZ_A }, ['A','A','B','A']),
  ]),
  [BGMMood.MYSTERIOUS]: createTracks([
    composeTrack(240, { A: P_Z2_WIZ_A }, ['A','A','A','A']),
    composeTrack(220, { A: P_Z2_MAG_A }, ['A','A']),
  ]),
  [BGMMood.DANGER]: createTracks([
    composeTrack(140, { A: P_Z2_DEM_A }, ['A','A','A','A','A','A','A','A']),
    composeTrack(130, { A: P_Z2_DEM_A, B: P_Z2_WIZ_A }, ['A','B','A','B']),
  ]),
  [BGMMood.BATTLE]: createTracks([
    composeTrack(120, { A: P_Z2_DEM_A }, ['A','A','A','A']),
    composeTrack(110, { A: P_Z1_BTL_A, B: P_Z2_DEM_A }, ['A','B','A','B']),
  ]),
};

const ZORK3_TRACKS = {
  [BGMMood.EXPLORATION]: createTracks([
    composeTrack(250, { A: P_Z3_MAIN_A }, ['A','A','A','A','A','A','A','A']),
    composeTrack(280, { A: P_Z3_ROYAL_A }, ['A','A','A','A']),
  ]),
  [BGMMood.DUNGEON]: createTracks([
    composeTrack(400, { A: P_Z3_MAIN_A }, ['A','A']),
    composeTrack(350, { A: P_Z3_GUARD_A }, ['A','A','A','A']),
  ]),
  [BGMMood.MYSTERIOUS]: createTracks([
    composeTrack(300, { A: P_Z3_ROYAL_A }, ['A','A','A','A']),
  ]),
  [BGMMood.BATTLE]: createTracks([
    composeTrack(130, { A: P_Z3_GUARD_A }, ['A','A','A','A']),
    composeTrack(140, { A: P_Z3_GUARD_A, B: P_Z1_BTL_A }, ['A','B','A','B']),
  ]),
};

const REMIX_TRACKS = {
  [BGMMood.MYSTERIOUS]: createTracks([
    composeTrack(160, { A: P_RMX_GLITCH_A }, ['A','A','A','A']),
  ]),
  [BGMMood.BATTLE]: createTracks([
    composeTrack(110, { A: P_RMX_CHAOS_A, B: P_RMX_GLITCH_A }, ['A','B','A','B']),
  ]),
  [BGMMood.DANGER]: createTracks([
    composeTrack(120, { A: P_RMX_CHAOS_A }, ['A','A']),
  ]),
};

// Master Library
const GAME_TRACKS: Record<GameVersion, Partial<Record<BGMMood, Track[]>>> = {
  [GameVersion.ZORK1]: ZORK1_TRACKS,
  [GameVersion.ZORK2]: ZORK2_TRACKS,
  [GameVersion.ZORK3]: ZORK3_TRACKS,
  [GameVersion.ZORK_REMIX]: REMIX_TRACKS,
};

// --- Player Logic ---

const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 0.1;
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
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); 
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playBGM = (mood: BGMMood, version: GameVersion) => {
  if (currentMood === mood && currentVersion === version && bgmInterval) return;
  
  stopBGM();
  
  currentMood = mood;
  currentVersion = version;
  if (isBgmMuted || !mood) return;

  // Track Selection Logic
  let availableTracks: Track[] = [];

  if (version === GameVersion.ZORK_REMIX) {
    const sources = [ZORK1_TRACKS, ZORK2_TRACKS, ZORK3_TRACKS, REMIX_TRACKS];
    sources.forEach(source => {
      const tracks = source[mood];
      if (tracks) availableTracks.push(...tracks);
    });
  } else {
    // Specific Game Mode (or Title which is in ZORK1)
    const source = GAME_TRACKS[version] || ZORK1_TRACKS;
    if (source && source[mood]) {
      availableTracks = source[mood]!;
    }
  }

  // Fallback for Title if not in current version
  if (mood === BGMMood.TITLE && availableTracks.length === 0) {
      availableTracks = ZORK1_TRACKS[BGMMood.TITLE]!;
  }

  if (availableTracks.length === 0) {
    if (mood === BGMMood.EXPLORATION) {
       availableTracks = ZORK1_TRACKS[BGMMood.EXPLORATION]!;
    } else {
       return;
    }
  }

  const trackIndex = Math.floor(Math.random() * availableTracks.length);
  const track = availableTracks[trackIndex];

  if (!track) return;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  currentStep = 0;
  const stepTime = track.tempo;

  console.log(`Playing BGM: Version=${version}, Mood=${mood}, TrackIdx=${trackIndex}, Tempo=${stepTime}`);

  bgmInterval = window.setInterval(() => {
    if (!currentMood || isBgmMuted) {
      stopBGM();
      return;
    }

    // Voice 1 & 2: Lead / Melody (Square)
    if (track.voice1.length) playNote(ctx, track.voice1[currentStep % track.voice1.length], 'square', stepTime / 1000 * 0.9, 0.03);
    if (track.voice2.length) playNote(ctx, track.voice2[currentStep % track.voice2.length], 'square', stepTime / 1000 * 0.9, 0.02);

    // Voice 3 & 4: Arpeggio / Harmony (Triangle)
    if (track.voice3.length) {
        const bassType = (mood === BGMMood.DUNGEON || mood === BGMMood.DANGER || mood === BGMMood.TITLE) ? 'sawtooth' : 'triangle';
        playNote(ctx, track.voice3[currentStep % track.voice3.length], bassType, stepTime / 1000 * 1.5, 0.04);
    }
    if (track.voice4 && track.voice4.length) {
        playNote(ctx, track.voice4[currentStep % track.voice4.length], 'triangle', stepTime / 1000 * 0.5, 0.03);
    }

    // Voice 5 & 6: Pads (Triangle)
    if (track.voice5 && track.voice5.length) playNote(ctx, track.voice5[currentStep % track.voice5.length], 'triangle', stepTime / 1000 * 2.0, 0.02);
    if (track.voice6 && track.voice6.length) playNote(ctx, track.voice6[currentStep % track.voice6.length], 'triangle', stepTime / 1000 * 2.0, 0.02);

    // Voice 7 & 8: Deep Bass / Sub (Sawtooth)
    if (track.voice7 && track.voice7.length) playNote(ctx, track.voice7[currentStep % track.voice7.length], 'sawtooth', stepTime / 1000 * 2.0, 0.05);
    if (track.voice8 && track.voice8.length) playNote(ctx, track.voice8[currentStep % track.voice8.length], 'sawtooth', stepTime / 1000 * 2.0, 0.05);

    // Noise
    if (track.noise.length) {
        const hit = track.noise[currentStep % track.noise.length];
        if (hit) playNoise(ctx, 0.02);
    }

    currentStep++;
  }, stepTime);
};

export const stopBGM = () => {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
    currentMood = null;
    currentVersion = null;
  }
};