import { useCallback, useEffect, useRef } from "react";

const VOICE_LANGUAGE = "es-CL";

/**
 * Gestiona retroalimentación de voz con SpeechSynthesis
 * Accesibilidad: proporciona retroalimentación auditiva clara
 * 
 * Casos de uso:
 * - Confirmación de acciones
 * - Guía de navegación
 * - Instrucciones para adultos mayores
 * - Lectores de pantalla amigables
 * 
 * WCAG: Audio con control del usuario
 */
function useVoice({ enabled = false } = {}) {
  const isSpeakingRef = useRef(false);
  const utteranceQueueRef = useRef([]);

  // Detectar soporte de SpeechSynthesis
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechSynthesis = window.speechSynthesis;
    if (!speechSynthesis) {
      console.warn("SpeechSynthesis no está soportada en este navegador");
    }
  }, []);

  const speak = useCallback(
    (message, options = {}) => {
      if (typeof window === "undefined" || !enabled) {
        return Promise.resolve();
      }

      const speechSynthesis = window.speechSynthesis;
      if (!speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
        console.warn("SpeechSynthesis no disponible");
        return Promise.reject(new Error("SpeechSynthesis no disponible"));
      }

      return new Promise((resolve) => {
        // Cancelar cualquier mensaje previo si no está en cola
        if (!options.queue) {
          speechSynthesis.cancel();
          isSpeakingRef.current = false;
        }

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = options.language || VOICE_LANGUAGE;
        utterance.rate = options.rate || 0.9; // Velocidad más lenta para adultos mayores
        utterance.pitch = options.pitch || 1;
        utterance.volume = Math.min(1, options.volume || 1);

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          options.onStart?.();
        };

        utterance.onend = () => {
          isSpeakingRef.current = false;
          options.onEnd?.();
          resolve();
        };

        utterance.onerror = (event) => {
          console.warn("Error en SpeechSynthesis:", event.error);
          isSpeakingRef.current = false;
          options.onError?.(event);
          resolve();
        };

        speechSynthesis.speak(utterance);
      });
    },
    [enabled]
  );

  const isSpeaking = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const speechSynthesis = window.speechSynthesis;
    return speechSynthesis ? speechSynthesis.speaking : false;
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const speechSynthesis = window.speechSynthesis;
    if (speechSynthesis) {
      speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  return {
    speak,
    isSpeaking,
    stop,
    isEnabled: enabled
  };
}

export default useVoice;
