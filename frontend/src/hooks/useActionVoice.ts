import useVoice, { type SpeakOptions } from "./useVoice";
import { useCallback } from "react";

const ACTION_VOICE_OPTIONS: SpeakOptions = {
  cooldownMs: 700,
  delayMs: 0,
  force: true,
  interrupt: true,
  priority: "high"
};

function useActionVoice(enabled: boolean) {
  const { speak } = useVoice({ enabled });

  const speakAction = useCallback(
    (message: string, dedupeKey: string, options: SpeakOptions = {}) => {
      return speak(message, {
        ...ACTION_VOICE_OPTIONS,
        ...options,
        dedupeKey
      });
    },
    [speak]
  );

  return {
    speak,
    speakAction
  };
}

export default useActionVoice;
