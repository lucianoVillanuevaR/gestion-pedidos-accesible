import { useCallback, useEffect } from "react";

const VOICE_LANGUAGE = "es-CL";
const DEFAULT_RATE = 0.86;
const DEFAULT_PITCH = 0.95;
const DEFAULT_VOLUME = 0.82;
const DEFAULT_DELAY_MS = 140;
const DEFAULT_COOLDOWN_MS = 2600;
const DEFAULT_MIN_GAP_MS = 350;
const RECENT_MESSAGES_TTL_MS = 15000;
const GOOGLE_SPANISH_VOICE_NAMES = [
  "google espanol",
  "google spanish",
  "google espanol de estados unidos",
  "google spanish united states"
];

const PRIORITY_LEVELS = {
  low: 0,
  normal: 1,
  high: 2
} as const;

type SpeakPriority = keyof typeof PRIORITY_LEVELS;

export type SpeakOptions = {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  delayMs?: number;
  cooldownMs?: number;
  minGapMs?: number;
  dedupeKey?: string;
  force?: boolean;
  interrupt?: boolean;
  priority?: SpeakPriority;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (event: SpeechSynthesisErrorEvent) => void;
};

let pendingSpeakTimer: number | null = null;
let pendingResolve: ((result: boolean) => void) | null = null;
let activeResolve: ((result: boolean) => void) | null = null;
let activeSpeechToken = 0;
let lastSpokenAt = 0;
let lastSpokenKey = "";
let lastPriorityLevel: number = PRIORITY_LEVELS.normal;

const recentMessages = new Map<string, number>();

function normalizeMessage(message: string) {
  return String(message || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function cleanupRecentMessages(now: number) {
  for (const [key, timestamp] of recentMessages.entries()) {
    if (now - timestamp > RECENT_MESSAGES_TTL_MS) {
      recentMessages.delete(key);
    }
  }
}

function resolvePendingSpeak(result: boolean) {
  if (pendingResolve) {
    const resolver = pendingResolve;
    pendingResolve = null;
    resolver(result);
  }
}

function resolveActiveSpeak(result: boolean) {
  if (activeResolve) {
    const resolver = activeResolve;
    activeResolve = null;
    resolver(result);
  }
}

function cancelGlobalSpeech(speechSynthesis: SpeechSynthesis) {
  activeSpeechToken += 1;

  if (pendingSpeakTimer) {
    window.clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = null;
    resolvePendingSpeak(false);
  }

  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
  }

  resolveActiveSpeak(false);
}

function normalizeVoiceName(name: string) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getPreferredVoice(speechSynthesis: SpeechSynthesis) {
  const voices = speechSynthesis.getVoices();

  if (!voices || voices.length === 0) {
    return null;
  }

  const isSpanishVoice = (voice: SpeechSynthesisVoice) => voice.lang?.toLowerCase().startsWith("es") ?? false;
  const isChileSpanishVoice = (voice: SpeechSynthesisVoice) =>
    voice.lang?.toLowerCase() === VOICE_LANGUAGE.toLowerCase() ||
    voice.lang?.toLowerCase().startsWith("es-cl") ||
    false;
  const isGoogleVoice = (voice: SpeechSynthesisVoice) => normalizeVoiceName(voice.name).includes("google");
  const hasGoogleSpanishName = (voice: SpeechSynthesisVoice) => {
    const normalizedName = normalizeVoiceName(voice.name);
    return GOOGLE_SPANISH_VOICE_NAMES.some((name) => normalizedName.includes(name));
  };

  return (
    voices.find((voice) => hasGoogleSpanishName(voice) && isChileSpanishVoice(voice)) ||
    voices.find((voice) => hasGoogleSpanishName(voice) && isSpanishVoice(voice)) ||
    voices.find((voice) => isGoogleVoice(voice) && isChileSpanishVoice(voice)) ||
    voices.find((voice) => isGoogleVoice(voice) && isSpanishVoice(voice)) ||
    voices.find((voice) => voice.lang?.toLowerCase() === VOICE_LANGUAGE.toLowerCase()) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("es-cl")) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith("es")) ||
    null
  );
}

function wakeSpeechSynthesis(speechSynthesis: SpeechSynthesis) {
  speechSynthesis.getVoices();

  if (speechSynthesis.paused) {
    speechSynthesis.resume();
  }
}

/**
 * Gestiona retroalimentación de voz breve y poco invasiva.
 * La voz se usa como guía simple, no como lector de pantalla completo.
 */
function useVoice({ enabled = false }: { enabled?: boolean } = {}) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis) {
      console.warn("SpeechSynthesis no está soportada en este navegador");
      return;
    }

    const warmVoices = () => {
      speechSynthesis.getVoices();
    };

    warmVoices();
    speechSynthesis.addEventListener("voiceschanged", warmVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", warmVoices);
    };
  }, []);

  const speak = useCallback(
    (message: string, options: SpeakOptions = {}) => {
      if (typeof window === "undefined" || !enabled) {
        return Promise.resolve(false);
      }

      const text = String(message || "").trim();
      if (!text) {
        return Promise.resolve(false);
      }

      const speechSynthesis = window.speechSynthesis;
      if (!speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
        console.warn("SpeechSynthesis no disponible");
        return Promise.reject(new Error("SpeechSynthesis no disponible"));
      }

      wakeSpeechSynthesis(speechSynthesis);

      const now = Date.now();
      cleanupRecentMessages(now);

      const priority = options.priority ?? "normal";
      const priorityLevel: number = PRIORITY_LEVELS[priority];
      const normalizedMessage = normalizeMessage(text);
      const dedupeKey = options.dedupeKey || normalizedMessage;
      const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
      const minGapMs = options.minGapMs ?? DEFAULT_MIN_GAP_MS;
      const isBusy = speechSynthesis.speaking || speechSynthesis.pending || pendingSpeakTimer !== null;
      const force = Boolean(options.force);
      const interrupt = options.interrupt ?? priorityLevel >= PRIORITY_LEVELS.high;

      if (!force) {
        const lastMessageAt = recentMessages.get(dedupeKey) ?? 0;
        const repeatedTooSoon = cooldownMs > 0 && now - lastMessageAt < cooldownMs;
        const tooCloseToPreviousMessage =
          lastSpokenAt > 0 && now - lastSpokenAt < minGapMs && priorityLevel <= lastPriorityLevel;
        const duplicateOfLastMessage = lastSpokenKey === dedupeKey && now - lastSpokenAt < cooldownMs;

        if (repeatedTooSoon || tooCloseToPreviousMessage || duplicateOfLastMessage) {
          return Promise.resolve(false);
        }

        if (isBusy && !interrupt) {
          return Promise.resolve(false);
        }
      }

      cancelGlobalSpeech(speechSynthesis);

      return new Promise<boolean>((resolve) => {
        const startSpeech = () => {
          pendingSpeakTimer = null;
          pendingResolve = null;

          const utterance = new SpeechSynthesisUtterance(text);
          const voice = getPreferredVoice(speechSynthesis);
          const token = activeSpeechToken + 1;

          activeSpeechToken = token;
          activeResolve = resolve;
          lastSpokenAt = Date.now();
          lastSpokenKey = dedupeKey;
          lastPriorityLevel = priorityLevel;
          recentMessages.set(dedupeKey, lastSpokenAt);

          utterance.lang = options.language || voice?.lang || VOICE_LANGUAGE;
          utterance.voice = voice || null;
          utterance.rate = options.rate ?? DEFAULT_RATE;
          utterance.pitch = options.pitch ?? DEFAULT_PITCH;
          utterance.volume = Math.min(1, Math.max(0, options.volume ?? DEFAULT_VOLUME));

          utterance.onstart = () => {
            options.onStart?.();
          };

          utterance.onend = () => {
            if (token !== activeSpeechToken) {
              return;
            }

            activeResolve = null;
            options.onEnd?.();
            resolve(true);
          };

          utterance.onerror = (event) => {
            if (token !== activeSpeechToken) {
              return;
            }

            activeResolve = null;
            console.warn("Error en SpeechSynthesis:", event.error);
            options.onError?.(event);
            resolve(false);
          };

          if (speechSynthesis.paused) {
            speechSynthesis.resume();
          }

          speechSynthesis.speak(utterance);
        };

        pendingResolve = resolve;
        const delayMs = options.delayMs ?? (force || interrupt ? 0 : DEFAULT_DELAY_MS);

        if (delayMs <= 0) {
          startSpeech();
          return;
        }

        pendingSpeakTimer = window.setTimeout(startSpeech, delayMs);
      });
    },
    [enabled]
  );

  const cancel = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis) {
      return;
    }

    cancelGlobalSpeech(speechSynthesis);
  }, []);

  return {
    cancel,
    speak
  };
}

export default useVoice;
