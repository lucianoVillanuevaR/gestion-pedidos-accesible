import { useCallback, useEffect, useRef } from "react";
import { SOUND_CUES, type SoundCue, type ToneStep } from "../PdvShared";

function getBrowserAudioContext() {
  const AudioContextClass = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioContextClass ?? null;
}

function scheduleTone(context: AudioContext, startAt: number, step: ToneStep) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = step.type || "sine";
  oscillator.frequency.setValueAtTime(step.frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(step.volume || 0.045, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.durationMs / 1000);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + step.durationMs / 1000 + 0.02);
}

export function usePdvSoundCue(isSoundEnabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundEndRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!isSoundEnabled || typeof window === "undefined") {
      return null;
    }

    const AudioContextClass = getBrowserAudioContext();
    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume().catch(() => {});
    }

    return audioContextRef.current;
  }, [isSoundEnabled]);

  useEffect(() => {
    return () => {
      if (!audioContextRef.current) {
        return;
      }

      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  return useCallback((cue: SoundCue) => {
    const context = getAudioContext();
    if (!context) {
      return;
    }

    const steps = SOUND_CUES[cue];
    const baseStart = Math.max(context.currentTime + 0.01, lastSoundEndRef.current + 0.03);
    let soundEnd = baseStart;

    steps.forEach((step) => {
      const startAt = baseStart + (step.delayMs || 0) / 1000;
      scheduleTone(context, startAt, step);
      soundEnd = Math.max(soundEnd, startAt + step.durationMs / 1000);
    });

    lastSoundEndRef.current = soundEnd;
  }, [getAudioContext]);
}
