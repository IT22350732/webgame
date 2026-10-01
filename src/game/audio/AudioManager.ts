export class AudioManager {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Master Gain
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Engine Oscillators
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Road / Tire Noise
  private tireNoiseNode: AudioNode | null = null;
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;

  // Wind Rush
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Rain Noise
  private rainGain: GainNode | null = null;

  // Volumes
  private masterVolume = 0.8;
  private engineVolume = 0.7;
  private ambientVolume = 0.6;

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Category Gains
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.engineVolume, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.setupEngineSynth();
      this.setupTireNoise();
      this.setupWindSynth();
      this.setupRainSynth();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public resume() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.engineGain) return;

    // Filter to shape raw sawtooth harmonics into deep mechanical engine tone
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);
    this.engineFilter.connect(this.engineGain);

    // Fundamental cylinder firing oscillator (sawtooth)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc1.start();

    // Secondary harmonic (triangle for body)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);
    this.engineOsc2.connect(this.engineFilter);
    this.engineOsc2.start();

    // Sub-bass rumble
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.setValueAtTime(30, this.ctx.currentTime);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineSubOsc.start();
  }

  private setupTireNoise() {
    if (!this.ctx || !this.engineGain) return;

    // Procedural noise buffer (2 seconds loop)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start();
    this.tireNoiseNode = whiteNoise;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.engineGain);
  }

  private setupWindSynth() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;
    windSource.start();

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ambientGain);
  }

  private setupRainSynth() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;
    rainSource.start();

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    rainFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.ambientGain);
  }

  public update(rpm: number, speedKmh: number, throttle: number, isRaining: boolean, isOffroad: boolean) {
    if (!this.ctx || !this.isInitialized || this.ctx.state !== 'running') return;

    const t = this.ctx.currentTime;
    const absSpeed = Math.abs(speedKmh);

    // 1. Engine Pitch & Tone
    // rpm ranges from 900 to 7200
    const baseFreq = 28 + (rpm / 7200) * 110;
    this.engineOsc1?.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineOsc2?.frequency.setTargetAtTime(baseFreq * 2.02, t, 0.05);
    this.engineSubOsc?.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.05);

    // Filter opens up when throttle is applied
    const filterFreq = 380 + (rpm / 7200) * 1200 + throttle * 600;
    this.engineFilter?.frequency.setTargetAtTime(filterFreq, t, 0.08);

    // 2. Tire Road Hum
    const targetTireVol = (absSpeed / 180) * 0.45 + (isOffroad ? 0.35 : 0);
    this.tireGain?.gain.setTargetAtTime(targetTireVol, t, 0.1);
    const tireCenterFreq = isOffroad ? 180 : 320 + (absSpeed / 180) * 200;
    this.tireFilter?.frequency.setTargetAtTime(tireCenterFreq, t, 0.1);

    // 3. Wind Rush
    const targetWindVol = Math.max(0, (absSpeed - 40) / 140) * 0.4;
    this.windGain?.gain.setTargetAtTime(targetWindVol, t, 0.15);
    const windCutoff = 300 + (absSpeed / 180) * 700;
    this.windFilter?.frequency.setTargetAtTime(windCutoff, t, 0.15);

    // 4. Rain sound
    const targetRainVol = isRaining ? 0.35 : 0.0;
    this.rainGain?.gain.setTargetAtTime(targetRainVol, t, 0.3);
  }

  public setVolumes(master: number, engine: number, ambient: number) {
    this.masterVolume = master;
    this.engineVolume = engine;
    this.ambientVolume = ambient;

    if (this.ctx && this.masterGain && this.engineGain && this.ambientGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(master, t, 0.05);
      this.engineGain.gain.setTargetAtTime(engine, t, 0.05);
      this.ambientGain.gain.setTargetAtTime(ambient, t, 0.05);
    }
  }

  public playClick() {
    if (!this.ctx || !this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playCrash(intensity: number = 1.0) {
    if (!this.ctx || !this.isInitialized || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const clampedInt = Math.max(0.2, Math.min(1.0, intensity));

    // 1. Low frequency impact thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

    oscGain.gain.setValueAtTime(0.6 * clampedInt, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.35);

    // 2. Metal crunch noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.Q.setValueAtTime(2.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8 * clampedInt, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(t);
    noiseSource.stop(t + 0.4);
  }
}

export const audioManager = new AudioManager();
