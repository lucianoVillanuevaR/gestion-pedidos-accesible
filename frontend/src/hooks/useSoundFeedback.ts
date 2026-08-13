import { useCallback } from "react";

export type SoundFeedbackType = "success" | "error" | "warning" | "notification";

type ToneStep = {
  delayMs?: number;
  durationMs: number;
  frequency: number;
  type?: OscillatorType;
  volume: number;
};

const FEEDBACK_TONES: Record<SoundFeedbackType, ToneStep[]> = {
  success: [
    { frequency: 740, durationMs: 80, type: "sine", volume: 0.035 },
    { frequency: 980, durationMs: 120, delayMs: 75, type: "sine", volume: 0.04 }
  ],
  error: [
    { frequency: 260, durationMs: 100, type: "triangle", volume: 0.035 },
    { frequency: 210, durationMs: 140, delayMs: 85, type: "triangle", volume: 0.04 }
  ],
  warning: [
    { frequency: 440, durationMs: 100, type: "sine", volume: 0.035 },
    { frequency: 440, durationMs: 100, delayMs: 140, type: "sine", volume: 0.035 }
  ],
  notification: [
    { frequency: 660, durationMs: 90, type: "sine", volume: 0.035 },
    { frequency: 880, durationMs: 130, delayMs: 90, type: "sine", volume: 0.04 }
  ]
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
}

export async function playSoundFeedback(type: SoundFeedbackType) {
  try {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return;

    const start = context.currentTime + 0.01;
    for (const step of FEEDBACK_TONES[type]) {
      const startAt = start + (step.delayMs ?? 0) / 1000;
      const endAt = startAt + step.durationMs / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = step.type ?? "sine";
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(step.volume, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    }
  } catch {
    // El audio es una mejora progresiva: nunca debe interrumpir la acción principal.
  }
}

export function useSoundFeedback(isSoundEnabled: boolean) {
  const play = useCallback(
    (type: SoundFeedbackType) => {
      if (isSoundEnabled) void playSoundFeedback(type);
    },
    [isSoundEnabled]
  );

  return {
    success: useCallback(() => play("success"), [play]),
    error: useCallback(() => play("error"), [play]),
    warning: useCallback(() => play("warning"), [play]),
    notification: useCallback(() => play("notification"), [play])
  };
}
