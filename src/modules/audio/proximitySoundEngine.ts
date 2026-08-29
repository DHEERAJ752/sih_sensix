/**
 * Proximity Sound Engine
 * Plays dynamic audio warning beeps that increase in frequency, volume,
 * and tempo as cars get closer to each other.
 * 
 * - Far / safe (> maxRange) : completely silent
 * - Approaching (maxRange -> threshold) : gentle low-pitch warning beeps
 * - Danger / Critical (< threshold) : rapid, loud, high-pitch collision alarm
 */
export class ProximitySoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted = false;
  private beepTimerId: ReturnType<typeof setTimeout> | null = null;
  private lastDistanceM = Infinity;
  private currentMaxRange = 80;
  private isScheduling = false;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const ACtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (ACtx) this.audioCtx = new ACtx();
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stop();
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Update the proximity sound.
   * @param distanceM Closest distance between any active vehicle pair in meters.
   * @param maxRangeM The range in meters under which sound begins playing (default 80m).
   */
  update(distanceM: number, maxRangeM: number = 80) {
    if (this.isMuted) {
      this.stop();
      return;
    }

    this.lastDistanceM = distanceM;
    this.currentMaxRange = Math.max(30, maxRangeM);

    if (distanceM > this.currentMaxRange || !isFinite(distanceM)) {
      this.stop();
      return;
    }

    // Start beep scheduler if not running
    if (!this.isScheduling) {
      this.isScheduling = true;
      this.scheduleNext();
    }
  }

  private scheduleNext() {
    if (this.isMuted || this.lastDistanceM > this.currentMaxRange || !isFinite(this.lastDistanceM)) {
      this.isScheduling = false;
      return;
    }

    const d = Math.max(0, Math.min(this.currentMaxRange, this.lastDistanceM));
    // 0 = at boundary (far), 1 = at collision point (0m)
    const danger = 1 - (d / this.currentMaxRange);

    // Beep interval: 900ms (far) down to 70ms (immediate danger)
    const intervalMs = Math.max(70, 900 - Math.pow(danger, 1.3) * 830);

    // Volume: 0.06 -> 0.55
    const volume = 0.06 + danger * 0.49;

    // Frequency: 440 Hz -> 1450 Hz
    const freq = 440 + danger * 1010;

    // Tone duration: 50ms -> 180ms
    const toneDurationMs = 50 + danger * 130;

    this.playBeep(freq, volume, toneDurationMs / 1000, danger);

    this.beepTimerId = setTimeout(() => this.scheduleNext(), intervalMs);
  }

  private playBeep(freq: number, volume: number, durationSec: number, danger: number) {
    const ctx = this.getCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = danger > 0.7 ? 'sawtooth' : danger > 0.35 ? 'square' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.008);
      gain.gain.setValueAtTime(volume, ctx.currentTime + durationSec * 0.7);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationSec);
    } catch (_) {
      // AudioContext could be blocked if user has not interacted yet
    }
  }

  stop() {
    if (this.beepTimerId !== null) {
      clearTimeout(this.beepTimerId);
      this.beepTimerId = null;
    }
    this.isScheduling = false;
    this.lastDistanceM = Infinity;
  }

  destroy() {
    this.stop();
    this.audioCtx?.close();
    this.audioCtx = null;
  }
}
