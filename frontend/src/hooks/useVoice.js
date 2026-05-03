import { useCallback } from "react";

const VOICE_LANGUAGE = "es-CL";

function useVoice({ enabled = false } = {}) {
  const speak = useCallback(
    (message) => {
      if (typeof window === "undefined" || !enabled) {
        return;
      }

      const speechSynthesis = window.speechSynthesis;
      if (!speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
        return;
      }

      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = VOICE_LANGUAGE;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      speechSynthesis.speak(utterance);
    },
    [enabled]
  );

  return {
    speak
  };
}

export default useVoice;