// Web Audio API Synthesizer for tactile agricultural controller feedback
// Generates authentic mechanical clicks, relay clacks, and acoustic alert beeps
// Requires zero external audio files and works in all modern browsers.

class SoundFX {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Lazy initialization on first user interaction
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  private initCtx() {
    if (!this.soundEnabled || typeof window === 'undefined') return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return !!this.ctx;
    } catch {
      return false;
    }
  }

  // 1. Crisp Tactile Button Click (1200Hz -> 800Hz chirp, 22ms)
  click() {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1250, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.022);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.022);
    } catch {}
  }

  // 2. Heavy Industrial Relay Clack (Dual transient: 360Hz -> 720Hz)
  relayClack(isTurningOn: boolean) {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(isTurningOn ? 380 : 520, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(isTurningOn ? 740 : 340, now + 0.035);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.035);
      osc2.start(now + 0.035);
      osc2.stop(now + 0.085);
    } catch {}
  }

  // 3. Command Sent / OLED Alert Trigger (Dual high-pitched confirm chime)
  alertTone() {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t0 = now + i * 0.11;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1850, t0);
        osc.frequency.exponentialRampToValueAtTime(1600, t0 + 0.07);

        gain.gain.setValueAtTime(0.2, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t0);
        osc.stop(t0 + 0.07);
      }
    } catch {}
  }

  // 4. Connected Triumph Jingle (Ascending Arpeggio C5 -> E5 -> G5)
  connectedChime() {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const t = this.ctx!.currentTime + idx * 0.075;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.14);
      });
    } catch {}
  }

  // 5. Emergency High Moisture Cutoff (Urgent Staccato Alarm: 3 pulses)
  cutoffAlert() {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t0 = now + i * 0.085;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200, t0);

        gain.gain.setValueAtTime(0.25, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t0);
        osc.stop(t0 + 0.06);
      }
    } catch {}
  }

  // 6. Slider Tick (Soft 900Hz micro-pip)
  sliderTick() {
    if (!this.initCtx() || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.012);
    } catch {}
  }
}

export const soundFX = new SoundFX();

