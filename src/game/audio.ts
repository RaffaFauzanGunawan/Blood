// IndexedDB helper for persistent custom BGM audio storage
const DB_NAME = 'RavenfallAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'bgm_store';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBgmBlob(blob: Blob, name: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, 'custom_bgm_blob');
    store.put(name, 'custom_bgm_name');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getSavedBgm(): Promise<{ blob: Blob; name: string } | null> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const reqBlob = store.get('custom_bgm_blob');
      const reqName = store.get('custom_bgm_name');
      tx.oncomplete = () => {
        if (reqBlob.result && reqBlob.result instanceof Blob) {
          resolve({ blob: reqBlob.result, name: reqName.result || 'custom_bgm.mp3' });
        } else {
          resolve(null);
        }
      };
      tx.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function deleteSavedBgm(): Promise<void> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete('custom_bgm_blob');
      store.delete('custom_bgm_name');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

class RetroAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public enabled: boolean = true;
  public bgmEnabled: boolean = true;
  private bgmInterval: number | null = null;
  private customAudio: HTMLAudioElement | null = null;
  public customAudioName: string | null = null;
  public hasCustomAudio: boolean = false;
  private bgmVolume: number = 0.5;
  private isAudioUnlocked: boolean = false;

  private customAudioBuffer: AudioBuffer | null = null;
  private customBufferSource: AudioBufferSourceNode | null = null;
  private isLoadingBuffer: boolean = false;

  constructor() {
    // Auto-setup interaction listener to unlock AudioContext on first user gesture anywhere
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.unlockAudio();
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });

      // Pre-init HTMLAudio element as additional option
      try {
        this.customAudio = new Audio('/mbg.wav');
        this.customAudio.loop = true;
        this.customAudio.volume = 0.5;
        this.hasCustomAudio = true;
        this.customAudioName = 'mbg.wav';
      } catch {
        this.customAudio = null;
      }
    }
  }

  public async unlockAudio(): Promise<boolean> {
    try {
      this.initCtx();
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isAudioUnlocked = true;
      if (this.bgmEnabled && !this.bgmInterval && !this.customBufferSource && (!this.customAudio || this.customAudio.paused)) {
        this.startBgmSource();
      }
      return this.ctx?.state === 'running';
    } catch {
      return false;
    }
  }

  public async loadWavBuffer() {
    if (this.customAudioBuffer || this.isLoadingBuffer) return;
    this.isLoadingBuffer = true;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const res = await fetch('/mbg.wav');
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        this.customAudioBuffer = await this.ctx.decodeAudioData(arrayBuf);
        this.hasCustomAudio = true;
        this.customAudioName = 'mbg.wav';
        if (this.bgmEnabled) {
          this.startBgmSource();
        }
      }
    } catch {
      // If fetch or decode fails, synth loop continues
    } finally {
      this.isLoadingBuffer = false;
    }
  }

  private async tryRestoreSavedCustomAudio() {}
  public async setCustomAudioFile(_file: File): Promise<string> { return ''; }
  public async clearCustomAudio() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playButtonPress() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.05);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio safety
    }
  }

  public playSwordSwing() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Audio safety
    }
  }

  public playDash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio safety
    }
  }

  public playHit() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio safety
    }
  }

  public playChurchBell() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [185, 370, 555, 740];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const initialVol = 0.4 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch {
      // Audio safety
    }
  }

  public playThunder() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.8);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // Audio safety
    }
  }

  public playCoin() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio safety
    }
  }

  public playPotion() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(580, now + 0.22);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Audio safety
    }
  }

  public playBlip(pitch: number = 320) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch + Math.random() * 40, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio safety
    }
  }

  public playGameOverStinger() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.playChurchBell();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(73.42, now);
      osc.frequency.exponentialRampToValueAtTime(36.71, now + 3.0);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 3.2);
    } catch {
      // Audio safety
    }
  }

  public playUpgrade() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        gain.gain.setValueAtTime(0.35, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch {}
  }

  public playQuestFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.playChurchBell();
      const notes = [440, 523.25, 659.25, 880];
      const now = this.ctx.currentTime + 0.2;
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.35, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.3);
      });
    } catch {
      // Audio safety
    }
  }

  public stopAllBgmSources() {
    if (this.customBufferSource) {
      try { this.customBufferSource.stop(); } catch {}
      this.customBufferSource = null;
    }
    if (this.customAudio) {
      try { this.customAudio.pause(); } catch {}
    }
    this.stopAmbientLoop();
  }

  public startBgmSource() {
    this.initCtx();
    if (!this.ctx || !this.bgmEnabled) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.stopAllBgmSources();

    // 1. If decoded AudioBuffer is ready, play seamlessly via Web Audio API
    if (this.customAudioBuffer) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.customAudioBuffer;
        src.loop = true;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(this.bgmVolume || 0.5, this.ctx.currentTime);
        src.connect(gainNode);
        gainNode.connect(this.masterGain || this.ctx.destination);
        src.start(0);
        this.customBufferSource = src;
        return;
      } catch {}
    }

    // 2. Fallback: try HTMLAudioElement if buffer is not yet decoded
    if (this.customAudio) {
      try {
        this.customAudio.volume = this.bgmVolume || 0.5;
        this.customAudio.play().catch(() => {});
      } catch {}
    }

    // 3. Trigger async load of /mbg.wav to convert to Web Audio buffer
    if (!this.customAudioBuffer && !this.isLoadingBuffer) {
      this.loadWavBuffer();
    }
  }

  public toggleBgm(state?: boolean) {
    this.unlockAudio();
    if (state !== undefined) {
      this.bgmEnabled = state;
    } else {
      this.bgmEnabled = !this.bgmEnabled;
    }

    if (this.bgmEnabled) {
      this.startBgmSource();
    } else {
      this.stopAllBgmSources();
    }
    return this.bgmEnabled;
  }

  public playParry() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // 1. Sharp high metallic clash
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1480, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(this.masterGain || this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // 2. Resonant ringing chime harmonic
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2200, now);
      osc2.frequency.setValueAtTime(1760, now + 0.05);
      gain2.gain.setValueAtTime(0.45, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(this.masterGain || this.ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.4);
    } catch {
      // Audio safety
    }
  }

  public playHolySpell() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.3, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.4);
      });
    } catch {}
  }

  public playWeaponSkill() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public playFloorClear() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880, 1108.73].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.4, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      });
    } catch {}
  }

  public playTestChime() {
    this.unlockAudio();
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    const now = (this.ctx ? this.ctx.currentTime : 0) + 0.05;
    // Play a bright, loud 4-note music box fanfare chime
    this.playMusicBoxNote(523.25, now, 2.5, 0.85, -0.3); // C5
    this.playMusicBoxNote(659.25, now + 0.15, 2.8, 0.9, -0.1); // E5
    this.playMusicBoxNote(987.77, now + 0.3, 3.0, 0.95, 0.1); // B5
    this.playMusicBoxNote(1318.51, now + 0.45, 3.8, 1.0, 0.3); // E6
    this.playMusicBoxBass(164.81, now, 3.8, 0.65); // E3 bass

    // Force start BGM loop if enabled
    if (this.bgmEnabled) {
      this.startBgmSource();
    }
  }

  public isBgmPlaying(): boolean {
    if (this.customAudio) {
      return this.bgmEnabled && !this.customAudio.paused;
    }
    return this.bgmEnabled && this.bgmInterval !== null;
  }

  // Plays a single delicate music box tine note with authentic steel comb acoustics
  private playMusicBoxNote(freq: number, time: number, duration: number = 2.4, volume: number = 0.55, pan: number = 0) {
    if (!this.ctx || !this.bgmEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const t = Math.max(time, now + 0.005);
      const effectiveVol = volume * this.bgmVolume;
      const outNode: AudioNode = this.masterGain || this.ctx.destination;
      let finalOut: AudioNode = outNode;

      if (this.ctx.createStereoPanner) {
        try {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(Math.max(-0.6, Math.min(0.6, pan)), t);
          panner.connect(outNode);
          finalOut = panner;
        } catch {}
      }

      // 1. Primary fundamental crystal tone (sine)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);

      gain1.gain.setValueAtTime(0.0001, t);
      gain1.gain.linearRampToValueAtTime(effectiveVol, t + 0.006);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc1.connect(gain1);
      gain1.connect(finalOut);
      osc1.start(t);
      osc1.stop(t + duration + 0.05);

      // 2. Subtle chorus shimmer detune (+2 cents) for organic antique feel
      const oscDetune = this.ctx.createOscillator();
      const gainDetune = this.ctx.createGain();
      oscDetune.type = 'sine';
      oscDetune.frequency.setValueAtTime(freq * 1.0016, t);

      gainDetune.gain.setValueAtTime(0.0001, t);
      gainDetune.gain.linearRampToValueAtTime(effectiveVol * 0.45, t + 0.006);
      gainDetune.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.85);

      oscDetune.connect(gainDetune);
      gainDetune.connect(finalOut);
      oscDetune.start(t);
      oscDetune.stop(t + duration * 0.9);

      // 3. High metallic chime overtone (steel reed mode ratio 2.756x)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.756, t);

      gain2.gain.setValueAtTime(0.0001, t);
      gain2.gain.linearRampToValueAtTime(effectiveVol * 0.35, t + 0.004);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      osc2.connect(gain2);
      gain2.connect(finalOut);
      osc2.start(t);
      osc2.stop(t + 0.7);

      // 4. Subtle cylinder pin pluck transient (striking click)
      const oscPluck = this.ctx.createOscillator();
      const gainPluck = this.ctx.createGain();
      oscPluck.type = 'triangle';
      oscPluck.frequency.setValueAtTime(freq * 4.8, t);

      gainPluck.gain.setValueAtTime(effectiveVol * 0.28, t);
      gainPluck.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

      oscPluck.connect(gainPluck);
      gainPluck.connect(finalOut);
      oscPluck.start(t);
      oscPluck.stop(t + 0.03);
    } catch {
      // Audio safety
    }
  }

  // Plays a deep warm bass chime note for harmonic foundation
  private playMusicBoxBass(freq: number, time: number, duration: number = 3.5, volume: number = 0.45) {
    if (!this.ctx || !this.bgmEnabled) return;
    try {
      const now = this.ctx.currentTime;
      const t = Math.max(time, now + 0.005);
      const effectiveVol = volume * this.bgmVolume;
      const outNode: AudioNode = this.masterGain || this.ctx.destination;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(effectiveVol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(outNode);
      osc.start(t);
      osc.stop(t + duration + 0.1);
    } catch {}
  }

  public startGothicAmbientLoop() {
    this.stopAmbientLoop();
  }

  public playRegionChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const harmonics = [220, 440, 660, 880];
      harmonics.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        const initialVol = 0.08 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 + idx * 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 2.4);
      });
    } catch {
      // Audio safety
    }
  }

  public playEquipSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(780, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(420, now);
      osc2.frequency.exponentialRampToValueAtTime(840, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.14);
      osc2.stop(now + 0.14);
    } catch {
      // Audio safety
    }
  }

  public playElementalSound(element: 'Physical' | 'Fire' | 'Holy' | 'Dark' | 'Ice') {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      if (element === 'Fire') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.15);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      } else if (element === 'Holy') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.28);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      } else if (element === 'Ice') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      } else if (element === 'Dark') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      }
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Audio safety
    }
  }

  public playBreakSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400 + i * 400, now + i * 0.04);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.25 + i * 0.04);
        gain.gain.setValueAtTime(0.15, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28 + i * 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + 0.3 + i * 0.04);
      }
    } catch {
      // Audio safety
    }
  }

  public playUltimateSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      sub.type = 'sine';
      sub.frequency.setValueAtTime(80, now);
      sub.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(gain);
      sub.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.7);
      sub.stop(now + 0.7);
    } catch {
      // Audio safety
    }
  }

  public playTrapSound(type: 'spikes' | 'poison_gas' | 'crypt_lever') {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      if (type === 'spikes') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      } else if (type === 'poison_gas') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      }
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // Audio safety
    }
  }

  public playLevelUp() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.16, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    } catch {
      // Audio safety
    }
  }

  public playFootstep() {
    this.playBlip(180);
  }

  public playSword() {
    this.playSwordSwing();
  }

  public playHurt() {
    this.playHit();
  }

  public playSaveSound() {
    this.playUpgrade();
  }

  public playLoadSound() {
    this.playRegionChime();
  }

  public playFanfare() {
    this.playQuestFanfare();
  }

  public init() {
    this.initCtx();
  }

  private rainGainNode: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  public setAmbientVolume(vol: number) {
    this.bgmVolume = vol;
    if (this.customAudio) {
      this.customAudio.volume = vol;
    }
    if (vol <= 0) {
      this.toggleBgm(false);
    } else {
      if (!this.bgmEnabled) {
        this.toggleBgm(true);
      }
    }
  }

  public setRainVolume(vol: number) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (vol <= 0) {
        if (this.rainSource) {
          try {
            this.rainSource.stop();
          } catch {}
          this.rainSource = null;
        }
        return;
      }
      if (!this.rainSource) {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.04;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(vol * 0.15, this.ctx.currentTime);
        this.rainGainNode = gainNode;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        whiteNoise.start();
        this.rainSource = whiteNoise;
      } else if (this.rainGainNode) {
        this.rainGainNode.gain.setValueAtTime(vol * 0.15, this.ctx.currentTime);
      }
    } catch {
      // Audio safety
    }
  }

  private stopAmbientLoop() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public playSelect() {
    this.playButtonPress();
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const audioManager = new RetroAudioManager();
