import { RiskLevel } from '../../types/vehicle';

class SoundEffectsManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isVibrationEnabled: boolean = true;
  private lastAlertTime: Map<RiskLevel, number> = new Map();
  private alertCooldownMs: number = 2200; // 2.2s cooldown between sound blasts

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public setVibrationEnabled(enabled: boolean): void {
    this.isVibrationEnabled = enabled;
  }

  public playRiskAlert(level: RiskLevel): void {
    if (this.isMuted) return;

    const now = Date.now();
    const last = this.lastAlertTime.get(level) || 0;
    if (now - last < this.alertCooldownMs) {
      return; // Prevent alert spam
    }
    this.lastAlertTime.set(level, now);

    if (level === 'CRITICAL') {
      this.playCriticalAlarm();
      this.triggerVibration([250, 100, 250, 100, 400]);
    } else if (level === 'CAUTION') {
      this.playCautionBeep();
      this.triggerVibration([150, 100, 150]);
    } else if (level === 'CLEARED') {
      this.playClearedChime();
    }
  }

  public playEmergencySiren(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;

      // Two-tone siren (High-Low)
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.setValueAtTime(770, now + 0.25);
      osc.frequency.setValueAtTime(960, now + 0.5);
      osc.frequency.setValueAtTime(770, now + 0.75);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.1);
    } catch (e) {
      console.warn('Emergency audio failed:', e);
    }
  }

  private playCautionBeep(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // First beep
      this.beep(ctx, 680, now, 0.12, 0.25);
      // Second beep slightly higher
      this.beep(ctx, 840, now + 0.16, 0.14, 0.3);
    } catch (e) {
      console.warn('Caution audio failed:', e);
    }
  }

  private playCriticalAlarm(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Fast triple aggressive warning tone
      this.beep(ctx, 950, now, 0.12, 0.45, 'sawtooth');
      this.beep(ctx, 1100, now + 0.15, 0.12, 0.5, 'sawtooth');
      this.beep(ctx, 1300, now + 0.3, 0.25, 0.6, 'sawtooth');
    } catch (e) {
      console.warn('Critical audio failed:', e);
    }
  }

  private playClearedChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Harmonious resolved chord
      this.beep(ctx, 523.25, now, 0.2, 0.15, 'sine'); // C5
      this.beep(ctx, 659.25, now + 0.1, 0.2, 0.15, 'sine'); // E5
      this.beep(ctx, 783.99, now + 0.2, 0.35, 0.15, 'sine'); // G5
    } catch (e) {
      console.warn('Clear audio failed:', e);
    }
  }

  private beep(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine'
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private triggerVibration(pattern: number[]): void {
    if (!this.isVibrationEnabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignored if user hasn't interacted or unsupported
      }
    }
  }
}

export const soundEffects = new SoundEffectsManager();
