import { useEffect, useState } from "react";
import {
  ACCESSIBILITY_CONTRAST_STORAGE_KEY,
  ACCESSIBILITY_MODE_STORAGE_KEY,
  ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY,
  ACCESSIBILITY_VOICE_STORAGE_KEY,
  ACCESSIBILITY_SOUND_STORAGE_KEY
} from "../constants/accessibility";
const TEXT_SIZE_VALUES = ["small", "normal", "large"];

function readBooleanStorage(key) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(key) === "true";
}

function readTextSizeStorage() {
  if (typeof window === "undefined") {
    return "normal";
  }

  const savedValue = window.localStorage.getItem(
    ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY
  );

  return TEXT_SIZE_VALUES.includes(savedValue) ? savedValue : "normal";
}

/**
 * Calcula el tamaño de fuente base según el modo y preferencia del usuario
 * Modo Accesible: fuentes más grandes
 * Modo Normal: fuentes compactas
 * WCAG: proporciones accesibles para legibilidad
 */
function getFontSizeForState(textSize, isAccessible) {
  const sizeMap = {
    small: isAccessible ? "18px" : "14px",
    normal: isAccessible ? "20px" : "16px",
    large: isAccessible ? "24px" : "18px"
  };

  return sizeMap[textSize];
}

/**
 * Gestiona preferencias de accesibilidad
 * Proporciona dos experiencias visuales claramente diferenciadas:
 * 1. Modo Normal: compacto, moderno, eficiente
 * 2. Modo Accesible: expandido, simple, legible
 * 
 * - Contraste AA mínimo
 * - Navegación por teclado
 * - Soporte de voz
 */
function useAccessibility() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAccessible, setIsAccessible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(ACCESSIBILITY_MODE_STORAGE_KEY) === "true";
  });
  
  const [textSize, setTextSize] = useState(readTextSizeStorage);
  
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return readBooleanStorage(ACCESSIBILITY_CONTRAST_STORAGE_KEY);
  });
  
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return readBooleanStorage(ACCESSIBILITY_VOICE_STORAGE_KEY);
  });
  
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return readBooleanStorage(ACCESSIBILITY_SOUND_STORAGE_KEY);
  });

  // Detectar preferencias de sistema
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Detectar preferencia de reducción de movimiento (WCAG)
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Sincronizar con localStorage y aplicar estilos globales
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Guardar preferencias
    window.localStorage.setItem(
      ACCESSIBILITY_MODE_STORAGE_KEY,
      String(isAccessible)
    );
    window.localStorage.setItem(
      ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY,
      textSize
    );
    window.localStorage.setItem(
      ACCESSIBILITY_CONTRAST_STORAGE_KEY,
      String(isHighContrast)
    );
    window.localStorage.setItem(
      ACCESSIBILITY_VOICE_STORAGE_KEY,
      String(isVoiceEnabled)
    );
    window.localStorage.setItem(
      ACCESSIBILITY_SOUND_STORAGE_KEY,
      String(isSoundEnabled)
    );

    // Aplicar atributos de datos para CSS
    const doc = window.document.documentElement;
    const body = window.document.body;

    doc.dataset.accessible = String(isAccessible);
    doc.dataset.contrast = String(isHighContrast);
    doc.dataset.voice = String(isVoiceEnabled);
    doc.dataset.sound = String(isSoundEnabled);
    doc.dataset.textSize = textSize;
    doc.dataset.reducedMotion = String(prefersReducedMotion);

    body.dataset.accessible = String(isAccessible);
    body.dataset.contrast = String(isHighContrast);
    body.dataset.sound = String(isSoundEnabled);
    body.dataset.textSize = textSize;

    // Aplicar tamaño de fuente base
    doc.style.fontSize = getFontSizeForState(textSize, isAccessible);

    // Aplicar clases para animaciones si no reduce movimiento
    if (prefersReducedMotion) {
      doc.classList.add("reduce-motion");
    } else {
      doc.classList.remove("reduce-motion");
    }

  }, [isAccessible, textSize, isHighContrast, isVoiceEnabled, isSoundEnabled, prefersReducedMotion]);

  const toggleAccessibility = () => {
    setIsAccessible((currentValue) => !currentValue);
  };

  const updateTextSize = (value) => {
    if (TEXT_SIZE_VALUES.includes(value)) {
      setTextSize(value);
    }
  };

  const toggleHighContrast = () => {
    setIsHighContrast((currentValue) => !currentValue);
  };

  const toggleVoiceEnabled = () => {
    setIsVoiceEnabled((currentValue) => !currentValue);
  };

  const toggleSoundEnabled = () => {
    setIsSoundEnabled((currentValue) => !currentValue);
  };

  const openAccessibilityPanel = () => {
    setIsPanelOpen(true);
  };

  const closeAccessibilityPanel = () => {
    setIsPanelOpen(false);
  };

  return {
    isPanelOpen,
    isAccessible,
    textSize,
    isHighContrast,
    isVoiceEnabled,
    isSoundEnabled,
    prefersReducedMotion,
    setTextSize: updateTextSize,
    openAccessibilityPanel,
    closeAccessibilityPanel,
    toggleAccessibility,
    toggleHighContrast,
    toggleVoiceEnabled,
    toggleSoundEnabled
  };
}

export default useAccessibility;
