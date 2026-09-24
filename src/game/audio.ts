/**
 * Audio System for Amoeba
 * Accurate procedural recreation of the iconic Terraria "Overworld Day" Theme
 * using Web Audio API synthesis (square lead, syncopated chord pads, triangle bass, chiptune percussion)
 * + Support for custom audio files (drag-and-drop / file selector).
 */

import { DEATH_AUDIO_DATA_URI } from './deathAudioData';

// Note frequency map including sharps across octaves
const N: Record<string, number> = {
  // Octave 1
  C1: 32.7, 'C#1': 34.65, D1: 36.71, 'D#1': 38.89, E1: 41.2, F1: 43.65, 'F#1': 46.25, G1: 49.0, 'G#1': 51.91, A1: 55.0, 'A#1': 58.27, B1: 61.74,
  // Octave 2
  C2: 65.41, 'C#2': 69.3, D2: 73.42, 'D#2': 77.78, E2: 82.41, F2: 87.31, 'F#2': 92.5, G2: 98.0, 'G#2': 103.83, A2: 110.0, 'A#2': 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, 'C#3': 138.59, D3: 146.83, 'D#3': 155.56, E3: 164.81, F3: 174.61, 'F#3': 185.0, G3: 196.0, 'G#3': 207.65, A3: 220.0, 'A#3': 233.08, B3: 246.94,
  // Octave 4
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13, E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.0, 'G#4': 415.3, A4: 440.0, 'A#4': 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, 'C#5': 554.37, D5: 587.33, 'D#5': 622.25, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99, 'G#5': 830.61, A5: 880.0, 'A#5': 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.5, 'C#6': 1108.73, D6: 1174.66, 'D#6': 1244.51, E6: 1318.51, F6: 1396.91, 'F#6': 1479.98, G6: 1567.98, 'G#6': 1661.22, A6: 1760.0, 'A#6': 1864.66, B6: 1975.53,
};

interface NoteEvent {
  note: string;
  duration: number; // in 16th notes (1 = 16th, 2 = 8th, 4 = quarter, 8 = half, 16 = whole)
  accent?: boolean;
}

/**
 * Terraria Overworld Day Theme (Scott Lloyd Shelly)
 * In G Major. 138 BPM.
 */
const TERRARIA_LEAD_PATTERN: NoteEvent[] = [
  // --- Intro Drums & Bass (4 bars of rest for lead) ---
  { note: '-', duration: 16 },
  { note: '-', duration: 16 },

  // --- Section 1: Main Theme (Iconic Hook) ---
  // Bar 1
  { note: 'G4', duration: 2 },
  { note: 'F#4', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'C5', duration: 2 },
  { note: 'E5', duration: 2 },
  { note: 'D5', duration: 4, accent: true },

  // Bar 2
  { note: 'G4', duration: 4 },
  { note: 'G4', duration: 2 },
  { note: 'D4', duration: 2 },
  { note: 'G4', duration: 2 },
  { note: 'A4', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'G4', duration: 2 },

  // Bar 3
  { note: 'D4', duration: 2 },
  { note: 'G4', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'C5', duration: 2 },
  { note: 'G4', duration: 2 },
  { note: 'D5', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'G4', duration: 2 },

  // Bar 4 (Pause / breath before repeat)
  { note: 'G4', duration: 4 },
  { note: '-', duration: 12 },

  // --- Section 2: Main Hook Repeat with Upward Flourish ---
  // Bar 5
  { note: 'G4', duration: 2 },
  { note: 'F#4', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'C5', duration: 2 },
  { note: 'E5', duration: 2 },
  { note: 'D5', duration: 4, accent: true },

  // Bar 6 (Rapid 16th upward sparkle arpeggio)
  { note: 'D5', duration: 1 },
  { note: 'G5', duration: 1 },
  { note: 'A5', duration: 1 },
  { note: 'C6', duration: 1 },
  { note: 'E6', duration: 1 },
  { note: 'B5', duration: 1 },
  { note: 'C6', duration: 1 },
  { note: 'D6', duration: 1 },
  { note: 'F#6', duration: 2, accent: true },
  { note: 'G6', duration: 6, accent: true },

  // Bar 7 (Descending energetic cascade)
  { note: 'A5', duration: 2 },
  { note: 'B5', duration: 2 },
  { note: 'G5', duration: 2 },
  { note: 'D5', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'D5', duration: 2 },
  { note: 'G5', duration: 2 },
  { note: 'B5', duration: 2 },

  // Bar 8
  { note: 'D6', duration: 2 },
  { note: 'G5', duration: 2 },
  { note: 'D5', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'G4', duration: 8 },

  // --- Section 3: Terraria B-Theme (Playful Whistling / Synth Melody) ---
  // Bar 9
  { note: 'D5', duration: 4 },
  { note: 'E5', duration: 2 },
  { note: 'D5', duration: 2 },
  { note: 'B4', duration: 4 },
  { note: 'G4', duration: 4 },

  // Bar 10
  { note: 'A4', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'C5', duration: 4 },
  { note: 'B4', duration: 2 },
  { note: 'A4', duration: 2 },
  { note: 'G4', duration: 4 },

  // Bar 11
  { note: 'D5', duration: 4 },
  { note: 'G5', duration: 4, accent: true },
  { note: 'F#5', duration: 2 },
  { note: 'E5', duration: 2 },
  { note: 'D5', duration: 4 },

  // Bar 12
  { note: 'C5', duration: 2 },
  { note: 'B4', duration: 2 },
  { note: 'A4', duration: 4 },
  { note: 'G4', duration: 8 },

  // Bar 13 (B-Theme Variation 2)
  { note: 'D5', duration: 4 },
  { note: 'E5', duration: 2 },
  { note: 'D5', duration: 2 },
  { note: 'B4', duration: 4 },
  { note: 'D5', duration: 4 },

  // Bar 14
  { note: 'E5', duration: 2 },
  { note: 'F#5', duration: 2 },
  { note: 'G5', duration: 4, accent: true },
  { note: 'F#5', duration: 2 },
  { note: 'E5', duration: 2 },
  { note: 'D5', duration: 4 },

  // Bar 15
  { note: 'B5', duration: 4, accent: true },
  { note: 'A5', duration: 4 },
  { note: 'G5', duration: 2 },
  { note: 'F#5', duration: 2 },
  { note: 'E5', duration: 4 },

  // Bar 16 (Turnaround resolution)
  { note: 'D5', duration: 2 },
  { note: 'E5', duration: 2 },
  { note: 'D5', duration: 4 },
  { note: 'G4', duration: 8 },
];

// Terraria Bouncy Bassline (Roots per bar: G -> Em -> C -> D)
const TERRARIA_BASS_BARS = [
  // Bar 1-4 Intro
  ['G2', 'G2', 'D3', 'G2', 'B2', 'D3', 'G2', 'D3'],
  ['G2', 'G2', 'D3', 'G2', 'B2', 'D3', 'G2', 'F#2'],
  ['E2', 'E2', 'B2', 'E2', 'G2', 'B2', 'E2', 'B2'],
  ['D2', 'D2', 'A2', 'D2', 'F#2', 'A2', 'D3', 'D2'],

  // Bar 5-8 Hook
  ['G2', 'G2', 'D3', 'G2', 'B2', 'D3', 'G2', 'D3'],
  ['G2', 'G2', 'D3', 'G2', 'B2', 'D3', 'G2', 'F#2'],
  ['C2', 'C2', 'G2', 'C2', 'E2', 'G2', 'C3', 'G2'],
  ['D2', 'D2', 'A2', 'D2', 'F#2', 'A2', 'D3', 'D2'],

  // Bar 9-12 Flourish
  ['G2', 'G2', 'D3', 'G2', 'B2', 'D3', 'G2', 'D3'],
  ['E2', 'E2', 'B2', 'E2', 'G2', 'B2', 'E2', 'B2'],
  ['C2', 'C2', 'G2', 'C2', 'E2', 'G2', 'C3', 'G2'],
  ['D2', 'D2', 'A2', 'D2', 'F#2', 'A2', 'D3', 'D2'],

  // Bar 13-16 B-Theme
  ['G2', 'G2', 'D3', 'G2', 'B2', 'D3', 'G2', 'D3'],
  ['C2', 'C2', 'G2', 'C2', 'E2', 'G2', 'C3', 'G2'],
  ['E2', 'E2', 'B2', 'E2', 'G2', 'B2', 'E2', 'B2'],
  ['D2', 'D2', 'A2', 'D2', 'F#2', 'A2', 'D3', 'D2'],
];

// Synth Chords stabs (G, Em, C, D)
const CHORD_MAP: Record<string, string[]> = {
  G: ['G3', 'B3', 'D4'],
  Em: ['E3', 'G3', 'B3'],
  C: ['C3', 'E3', 'G3'],
  D: ['D3', 'F#3', 'A3'],
};

const CHORD_SEQUENCE = [
  'G', 'G', 'Em', 'D',
  'G', 'G', 'C', 'D',
  'G', 'Em', 'C', 'D',
  'G', 'C', 'Em', 'D',
];

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public sfxVolume: number = 0.3;

  // Background Music State
  public musicEnabled: boolean = true;
  public musicVolume: number = 0.3;
  public isMusicPlaying: boolean = false;
  private musicSchedulerTimer: number | null = null;
  private nextStepTime: number = 0;
  private currentStepIndex: number = 0;
  private sixteenthStepCount: number = 0;
  private sixteenthTime: number = 60 / 138 / 4; // 138 BPM Terraria speed (~0.1087s)

  // Custom audio element if user loads their own song
  private customAudio: HTMLAudioElement | null = null;
  public customTrackName: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const handleFirstInteraction = () => {
        this.initCtx();
        if (this.musicEnabled && !this.isMusicPlaying) {
          this.startMusic();
        }
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
      };
      window.addEventListener('click', handleFirstInteraction, { once: true });
      window.addEventListener('keydown', handleFirstInteraction, { once: true });
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    this.musicEnabled = this.enabled;

    if (!this.enabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.enabled;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.customAudio) {
      this.customAudio.volume = this.musicVolume;
    }
  }

  public startMusic() {
    this.musicEnabled = true;
    if (this.isMusicPlaying) return;

    if (this.customAudio) {
      this.customAudio.volume = this.musicVolume;
      this.customAudio.play().catch(() => {});
      this.isMusicPlaying = true;
      return;
    }

    const ctx = this.initCtx();
    if (!ctx) return;

    this.isMusicPlaying = true;
    this.nextStepTime = ctx.currentTime + 0.05;
    this.currentStepIndex = 0;
    this.sixteenthStepCount = 0;

    this.scheduler();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicSchedulerTimer !== null) {
      window.clearTimeout(this.musicSchedulerTimer);
      this.musicSchedulerTimer = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  public loadCustomMusic(file: File) {
    try {
      if (this.customAudio) {
        this.customAudio.pause();
        this.customAudio = null;
      }
      const url = URL.createObjectURL(file);
      this.customAudio = new Audio(url);
      this.customAudio.loop = true;
      this.customAudio.volume = this.musicVolume;
      this.customTrackName = file.name;

      if (this.musicSchedulerTimer !== null) {
        window.clearTimeout(this.musicSchedulerTimer);
        this.musicSchedulerTimer = null;
      }

      this.isMusicPlaying = true;
      this.customAudio.play().catch(() => {});
    } catch (e) {
      console.error('Failed to load custom music', e);
    }
  }

  /**
   * Main Web Audio scheduler loop
   */
  private scheduler = () => {
    if (!this.isMusicPlaying || !this.musicEnabled || this.customAudio) return;

    const ctx = this.ctx;
    if (!ctx) return;

    while (this.nextStepTime < ctx.currentTime + 0.3) {
      const step = TERRARIA_LEAD_PATTERN[this.currentStepIndex];
      const durationSeconds = (step?.duration || 2) * this.sixteenthTime;

      // 1. Play Lead Melody
      this.playLeadStep(this.nextStepTime, step);

      // 2. Schedule Bass, Chords, and Drums for each 16th interval in this step
      for (let s = 0; s < (step?.duration || 2); s++) {
        const subTime = this.nextStepTime + s * this.sixteenthTime;
        const current16th = this.sixteenthStepCount + s;
        this.playAccompaniment(subTime, current16th);
      }

      this.sixteenthStepCount += step?.duration || 2;
      this.nextStepTime += durationSeconds;

      this.currentStepIndex++;
      if (this.currentStepIndex >= TERRARIA_LEAD_PATTERN.length) {
        this.currentStepIndex = 0;
        this.sixteenthStepCount = 0;
      }
    }

    this.musicSchedulerTimer = window.setTimeout(this.scheduler, 35);
  };

  /**
   * Play Lead Synth Note (Square Wave with warm filter and vibrato)
   */
  private playLeadStep(time: number, step: NoteEvent) {
    const ctx = this.ctx;
    if (!ctx || step.note === '-' || !N[step.note]) return;

    const durationSec = step.duration * this.sixteenthTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Pulse / Square wave for authentic Terraria chiptune sound
    osc.type = 'square';
    osc.frequency.setValueAtTime(N[step.note], time);

    // Warm Lowpass filter envelope
    filter.type = 'lowpass';
    const cutoff = step.accent ? 2200 : 1600;
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + durationSec);

    // Subtle pitch vibrato for longer notes
    if (step.duration >= 4) {
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(6.0, time); // 6 Hz vibrato
      vibratoGain.gain.setValueAtTime(4.0, time);
      vibrato.connect(osc.frequency);
      vibrato.start(time + 0.1);
      vibrato.stop(time + durationSec);
    }

    const vol = this.musicVolume * (step.accent ? 0.38 : 0.32);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.015);
    gain.gain.setValueAtTime(vol * 0.85, time + durationSec * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, time + durationSec * 0.98);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + durationSec);
  }

  /**
   * Play Rhythm Section: Punchy Bass, Synth Chords, Kick, Snare, Hi-hat
   */
  private playAccompaniment(time: number, step16th: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const barNumber = Math.floor(step16th / 16) % TERRARIA_BASS_BARS.length;
    const stepInBar = step16th % 16;

    // --- 1. Terraria Punchy Bass (Every 8th note: step 0, 2, 4, 6...) ---
    if (stepInBar % 2 === 0) {
      const bassBar = TERRARIA_BASS_BARS[barNumber];
      const bassNoteIndex = Math.floor(stepInBar / 2) % bassBar.length;
      const bassNote = bassBar[bassNoteIndex];

      if (bassNote && N[bassNote]) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();

        // Triangle wave for smooth punchy bass
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(N[bassNote], time);

        const bassVol = this.musicVolume * 0.42;
        bassGain.gain.setValueAtTime(bassVol, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + this.sixteenthTime * 1.8);

        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);

        bassOsc.start(time);
        bassOsc.stop(time + this.sixteenthTime * 2);
      }
    }

    // --- 2. Terraria Chord Stabs (Syncopated upbeat stabs on 4, 10, 12) ---
    if (stepInBar === 4 || stepInBar === 10 || stepInBar === 12) {
      const chordName = CHORD_SEQUENCE[barNumber] || 'G';
      const notes = CHORD_MAP[chordName] || ['G3', 'B3', 'D4'];

      for (const noteName of notes) {
        if (!N[noteName]) continue;
        const chordOsc = ctx.createOscillator();
        const chordFilter = ctx.createBiquadFilter();
        const chordGain = ctx.createGain();

        chordOsc.type = 'sawtooth';
        chordOsc.frequency.setValueAtTime(N[noteName], time);

        chordFilter.type = 'lowpass';
        chordFilter.frequency.setValueAtTime(1100, time);
        chordFilter.frequency.exponentialRampToValueAtTime(450, time + this.sixteenthTime * 1.8);

        const chordVol = this.musicVolume * 0.12;
        chordGain.gain.setValueAtTime(0.001, time);
        chordGain.gain.linearRampToValueAtTime(chordVol, time + 0.01);
        chordGain.gain.exponentialRampToValueAtTime(0.001, time + this.sixteenthTime * 1.9);

        chordOsc.connect(chordFilter);
        chordFilter.connect(chordGain);
        chordGain.connect(ctx.destination);

        chordOsc.start(time);
        chordOsc.stop(time + this.sixteenthTime * 2);
      }
    }

    // --- 3. Chiptune Percussion ---
    // Kick drum on beats 1 and 3 (steps 0, 8)
    if (stepInBar === 0 || stepInBar === 8) {
      this.playKick(time);
    }
    // Snare drum / clap on beats 2 and 4 (steps 4, 12)
    if (stepInBar === 4 || stepInBar === 12) {
      this.playSnare(time);
    }
    // Hi-hat on 8th notes (steps 2, 6, 10, 14)
    if (stepInBar % 2 === 0 && stepInBar !== 0 && stepInBar !== 8) {
      this.playHiHat(time);
    }
  }

  private playKick(time: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    const kickVol = this.musicVolume * 0.45;
    gain.gain.setValueAtTime(kickVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.14);
  }

  private playSnare(time: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    // Noise buffer for snappy 8-bit snare
    const bufferSize = Math.floor(ctx.sampleRate * 0.1);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.setValueAtTime(1.5, time);

    const gain = ctx.createGain();
    const snareVol = this.musicVolume * 0.28;
    gain.gain.setValueAtTime(snareVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.11);
  }

  private playHiHat(time: number) {
    const ctx = this.ctx;
    if (!ctx) return;

    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = ctx.createGain();
    const hatVol = this.musicVolume * 0.14;
    gain.gain.setValueAtTime(hatVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  // --- Sound Effects ---

  private playTone(
    freq: number,
    type: OscillatorType,
    duration: number,
    endFreq?: number,
    gainMult = 1.0
  ) {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), ctx.currentTime + duration);
      }

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(this.sfxVolume * gainMult, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore autoplay policy safely
    }
  }

  public playJump() {
    this.playTone(180, 'sine', 0.14, 380, 0.7);
  }

  public playLand() {
    this.playTone(120, 'triangle', 0.08, 60, 0.4);
  }

  public playMineHit() {
    this.playTone(140 + Math.random() * 40, 'square', 0.06, 80, 0.35);
  }

  public playBlockBreak() {
    this.playTone(220, 'square', 0.12, 50, 0.6);
  }

  public playBlockPlace() {
    this.playTone(320, 'triangle', 0.08, 200, 0.5);
  }

  public playAttack() {
    this.playTone(340, 'sawtooth', 0.1, 120, 0.4);
  }

  public playEnemyHurt() {
    this.playTone(240, 'square', 0.12, 100, 0.6);
  }

  public playPlayerHurt() {
    this.playTone(180, 'sawtooth', 0.22, 60, 0.9);
  }

  public playPickup() {
    this.playTone(480, 'sine', 0.08, 720, 0.4);
  }

  public playCraft() {
    this.playTone(400, 'triangle', 0.15, 600, 0.7);
  }

  public playAxeSwing() {
    this.playTone(190, 'sawtooth', 0.16, 60, 0.65);
  }

  public playAxeHit() {
    this.playTone(150, 'square', 0.14, 40, 0.85);
  }

  public playEnemyDeath(isBoss = false) {
    if (isBoss) {
      this.playTone(110, 'sawtooth', 0.6, 25, 1.3);
    } else {
      this.playTone(280, 'square', 0.18, 50, 0.75);
    }
  }

  public playItemBounce() {
    this.playTone(420 + Math.random() * 60, 'sine', 0.04, 240, 0.2);
  }

  public playBossRoar() {
    this.playTone(90, 'sawtooth', 0.5, 40, 1.2);
  }

  public playBossDefeat() {
    this.playTone(300, 'square', 0.6, 600, 1.0);
  }

  // --- Death Voice Audio Playback ---
  private deathAudio: HTMLAudioElement | null = null;
  public isDeathVoicePlaying: boolean = false;

  public playDeathVoice(force = false) {
    if (!this.enabled) return;
    if (this.isDeathVoicePlaying && !force) return;
    this.isDeathVoicePlaying = true;

    // Pause background music so speech is clearly audible
    this.stopMusic();

    // 1. Play deep impact death tone
    this.playTone(110, 'sawtooth', 0.45, 30, 0.9);

    // 2. Play exact recorded audio clip: "Вы погибли. Не переживайте, когда-нибудь вы научитесь играть в игры."
    try {
      if (!this.deathAudio) {
        this.deathAudio = new Audio(DEATH_AUDIO_DATA_URI);
      } else {
        this.deathAudio.pause();
        this.deathAudio.currentTime = 0;
      }

      this.deathAudio.volume = Math.min(1.0, Math.max(0.6, this.sfxVolume * 2.8));

      this.deathAudio.onended = () => {
        this.isDeathVoicePlaying = false;
      };

      this.deathAudio.onerror = () => {
        this.isDeathVoicePlaying = false;
        this.speakDeathPhraseFallback();
      };

      const playPromise = this.deathAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio playback fallback triggered:', err);
          this.isDeathVoicePlaying = false;
          this.speakDeathPhraseFallback();
        });
      }
    } catch (e) {
      console.warn('Audio play exception, fallback to TTS:', e);
      this.isDeathVoicePlaying = false;
      this.speakDeathPhraseFallback();
    }
  }

  public stopDeathVoice() {
    this.isDeathVoicePlaying = false;
    if (this.deathAudio) {
      this.deathAudio.pause();
      this.deathAudio.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private speakDeathPhraseFallback() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance('Вы погибли. Не переживайте, когда-нибудь вы научитесь играть в игры.');
      utter.lang = 'ru-RU';
      utter.rate = 0.95;
      utter.pitch = 0.88;
      const voices = window.speechSynthesis.getVoices();
      const ruVoice = voices.find((v) => v.lang.startsWith('ru') || v.lang.includes('RU'));
      if (ruVoice) utter.voice = ruVoice;
      window.speechSynthesis.speak(utter);
    } catch {
      // Ignore safely
    }
  }
}

export const soundManager = new SoundManager();
