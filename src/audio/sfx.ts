import { SynthEngine } from './synth';

export class SfxController {
  private synth = new SynthEngine();

  async humanMove() {
    await this.synth.playTone({
      frequency: 980,
      sweepTo: 860,
      durationMs: 48,
      attackMs: 4,
      releaseMs: 44,
      volume: 0.07,
    });
  }

  async cpuMove() {
    await this.synth.playTone({
      frequency: 452,
      sweepTo: 398,
      durationMs: 48,
      attackMs: 8,
      releaseMs: 50,
      volume: 0.065,
      type: 'sine',
    });
  }

  async land() {
    await Promise.all([
      this.synth.playTone({
        frequency: 176,
        sweepTo: 132,
        durationMs: 72,
        attackMs: 2,
        releaseMs: 64,
        volume: 0.045,
        type: 'triangle',
      }),
      this.synth.playTone({
        frequency: 112,
        sweepTo: 88,
        durationMs: 86,
        attackMs: 2,
        releaseMs: 76,
        volume: 0.032,
        type: 'sine',
      }),
    ]);
  }

  async uiConfirm() {
    await this.synth.playTone({
      frequency: 740,
      sweepTo: 690,
      durationMs: 30,
      attackMs: 2,
      releaseMs: 30,
      volume: 0.045,
    });
  }

  async win() {
    await this.synth.playChord([
      { frequency: 659, sweepTo: 620, durationMs: 90, volume: 0.06 },
      { frequency: 880, sweepTo: 830, durationMs: 110, volume: 0.06 },
      { frequency: 1174, sweepTo: 1046, durationMs: 130, volume: 0.05 },
    ]);
  }

  async loss() {
    await this.synth.playChord([
      { frequency: 294, sweepTo: 252, durationMs: 110, volume: 0.05, type: 'sine' },
      { frequency: 220, sweepTo: 196, durationMs: 140, volume: 0.055, type: 'sine' },
    ]);
  }
}

let controller: SfxController | null = null;

export function getSfxController() {
  if (!controller) {
    controller = new SfxController();
  }
  return controller;
}
