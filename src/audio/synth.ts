type ToneSpec = {
  frequency: number;
  durationMs: number;
  attackMs?: number;
  releaseMs?: number;
  sweepTo?: number;
  volume?: number;
  type?: OscillatorType;
  when?: number;
};

function createContext(): AudioContext | null {
  const Target =
    globalThis.AudioContext ||
    (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Target) {
    return null;
  }
  return new Target();
}

export class SynthEngine {
  private context: AudioContext | null = null;

  private getContext() {
    if (!this.context) {
      this.context = createContext();
    }
    return this.context;
  }

  async unlock() {
    const context = this.getContext();
    if (!context) {
      return;
    }
    if (context.state === 'suspended') {
      await context.resume();
    }
  }

  async playTone(spec: ToneSpec) {
    const context = this.getContext();
    if (!context) {
      return;
    }

    await this.unlock();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = spec.type ?? 'triangle';
    oscillator.frequency.setValueAtTime(
      spec.frequency,
      spec.when ?? context.currentTime,
    );

    const volume = spec.volume ?? 0.08;
    const attack = (spec.attackMs ?? 5) / 1000;
    const release = (spec.releaseMs ?? spec.durationMs) / 1000;
    const duration = spec.durationMs / 1000;
    const startTime = spec.when ?? context.currentTime;
    const stopTime = startTime + duration;

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + release);

    if (spec.sweepTo) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(40, spec.sweepTo),
        stopTime,
      );
    }

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(stopTime + 0.02);
  }

  async playChord(specs: ToneSpec[]) {
    const context = this.getContext();
    if (!context) {
      return;
    }
    const start = context.currentTime;
    await Promise.all(
      specs.map((spec, index) =>
        this.playTone({
          ...spec,
          when: start + index * 0.045,
        }),
      ),
    );
  }
}
