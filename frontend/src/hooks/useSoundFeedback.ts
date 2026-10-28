import { useCallback } from "react";
import type { SoundVolumeLevel } from "../constants/accessibility";

export type SoundFeedbackType = "success" | "error" | "warning" | "notification" | "orderReady";

export const AUDIO_FEEDBACK_STARTED_EVENT = "riquisimo:audio-feedback-started";

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
    {
      frequency: 980,
      durationMs: 120,
      delayMs: 75,
      type: "sine",
      volume: 0.04
    }
  ],
  error: [
    { frequency: 260, durationMs: 100, type: "triangle", volume: 0.035 },
    {
      frequency: 210,
      durationMs: 140,
      delayMs: 85,
      type: "triangle",
      volume: 0.04
    }
  ],
  warning: [
    { frequency: 440, durationMs: 100, type: "sine", volume: 0.035 },
    {
      frequency: 440,
      durationMs: 100,
      delayMs: 140,
      type: "sine",
      volume: 0.035
    }
  ],
  notification: [
    { frequency: 660, durationMs: 90, type: "sine", volume: 0.035 },
    {
      frequency: 880,
      durationMs: 130,
      delayMs: 90,
      type: "sine",
      volume: 0.04
    }
  ],
  orderReady: [
    { frequency: 523, durationMs: 220, type: "sine", volume: 0.045 },
    {
      frequency: 659,
      durationMs: 220,
      delayMs: 210,
      type: "sine",
      volume: 0.05
    },
    {
      frequency: 784,
      durationMs: 250,
      delayMs: 420,
      type: "sine",
      volume: 0.055
    }
  ]
};

let sharedAudioContext: AudioContext | null = null;

const VOLUME_MULTIPLIERS: Record<SoundVolumeLevel, number> = {
  soft: 2.1,
  normal: 3.5,
  loud: 6.25
};

const MAXIMUM_GAIN: Record<SoundVolumeLevel, number> = {
  soft: 0.18,
  normal: 0.24,
  loud: 0.32
};

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

export async function unlockSoundFeedback() {
  try {
    const context = getAudioContext();
    if (!context) return false;
    if (context.state === "suspended") await context.resume();
    const isAvailable = context.state === "running";
    if (isAvailable) window.dispatchEvent(new Event(AUDIO_FEEDBACK_STARTED_EVENT));
    return isAvailable;
  } catch {
    return false;
  }
}

export async function playSoundFeedback(type: SoundFeedbackType, volumeLevel: SoundVolumeLevel = "soft") {
  try {
    const context = getAudioContext();
    if (!context) return false;
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return false;

    const start = context.currentTime + 0.01;
    for (const step of FEEDBACK_TONES[type]) {
      const startAt = start + (step.delayMs ?? 0) / 1000;
      const endAt = startAt + step.durationMs / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = step.type ?? "sine";
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      const notificationBoost = type === "notification" ? 1.25 : type === "orderReady" ? 1.4 : 1;
      const volume = Math.min(
        step.volume * VOLUME_MULTIPLIERS[volumeLevel] * notificationBoost,
        MAXIMUM_GAIN[volumeLevel]
      );
      gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    }
    window.dispatchEvent(new Event(AUDIO_FEEDBACK_STARTED_EVENT));
    return true;
  } catch {
    // El audio es una mejora progresiva: nunca debe interrumpir la acción principal.
    return false;
  }
}

export function useOperationalSoundFeedback(volumeLevel: SoundVolumeLevel = "soft") {
  const playOperationalAlert = useCallback(
    (type: "notification" | "orderReady") => playSoundFeedback(type, volumeLevel),
    [volumeLevel]
  );

  return {
    notification: useCallback(() => playOperationalAlert("notification"), [playOperationalAlert]),
    orderReady: useCallback(() => playOperationalAlert("orderReady"), [playOperationalAlert])
  };
}

export function useSoundFeedback(isSoundEnabled: boolean, volumeLevel: SoundVolumeLevel = "soft") {
  const operationalFeedback = useOperationalSoundFeedback(volumeLevel);
  const playInteraction = useCallback(
    (type: SoundFeedbackType) => {
      if (!isSoundEnabled) return Promise.resolve(false);
      return playSoundFeedback(type, volumeLevel);
    },
    [isSoundEnabled, volumeLevel]
  );

  return {
    success: useCallback(() => playInteraction("success"), [playInteraction]),
    error: useCallback(() => playInteraction("error"), [playInteraction]),
    warning: useCallback(() => playInteraction("warning"), [playInteraction]),
    ...operationalFeedback
  };
}
