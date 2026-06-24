export class SchedulerClock {
  private bpm = 84;

  private startedAtMs = performance.now();

  setBpm(bpm: number): void {
    this.bpm = Math.max(1, bpm);
  }

  getBpm(): number {
    return this.bpm;
  }

  beatDurationMs(): number {
    return 60000 / this.bpm;
  }

  nowBeat(nowMs = performance.now()): number {
    return (nowMs - this.startedAtMs) / this.beatDurationMs();
  }

  reset(nowMs = performance.now()): void {
    this.startedAtMs = nowMs;
  }
}
