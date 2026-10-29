class AudioSynthService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public playTone(freq: number, type: OscillatorType = 'sine', durationMs: number = 200) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.4, this.ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + durationMs / 1000 + 0.05);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  public playPreset(name: 'click' | 'alert' | 'notification' | 'laser' | 'sub_bass') {
    this.init();
    if (!this.ctx) return;

    switch (name) {
      case 'click':
        this.playTone(850, 'triangle', 40);
        break;
      case 'alert':
        this.playTone(520, 'sine', 150);
        setTimeout(() => this.playTone(680, 'sine', 200), 120);
        break;
      case 'notification':
        this.playTone(440, 'sine', 100);
        setTimeout(() => this.playTone(660, 'sine', 120), 100);
        setTimeout(() => this.playTone(880, 'sine', 220), 220);
        break;
      case 'laser':
        this.playTone(1200, 'sawtooth', 150);
        break;
      case 'sub_bass':
        this.playTone(65, 'sine', 400);
        break;
    }
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const audioSynth = new AudioSynthService();
