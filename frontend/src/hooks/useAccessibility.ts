import { useCallback, useEffect, useState } from "react";
import {
  ACCESSIBILITY_CONTRAST_STORAGE_KEY,
  ACCESSIBILITY_MODE_STORAGE_KEY,
  ACCESSIBILITY_SOUND_STORAGE_KEY,
  ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY,
  ACCESSIBILITY_TEXT_SIZES,
  ACCESSIBILITY_VOICE_STORAGE_KEY,
  type AccessibilityTextSize
} from "../constants/accessibility";

export type AccessibilityState = {
  isPanelOpen: boolean;
  isAccessible: boolean;
  textSize: AccessibilityTextSize;
  isHighContrast: boolean;
  isVoiceEnabled: boolean;
  isSoundEnabled: boolean;
  prefersReducedMotion: boolean;
  setTextSize: (value: AccessibilityTextSize) => void;
  openAccessibilityPanel: () => void;
  closeAccessibilityPanel: () => void;
  toggleAccessibility: () => void;
  toggleHighContrast: () => void;
  toggleVoiceEnabled: () => void;
  toggleSoundEnabled: () => void;
};

function readBooleanStorage(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(key) === "true";
}

function readTextSizeStorage(): AccessibilityTextSize {
  if (typeof window === "undefined") {
    return "normal";
  }

  const savedValue = window.localStorage.getItem(ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY);

  return ACCESSIBILITY_TEXT_SIZES.includes(savedValue as AccessibilityTextSize)
    ? (savedValue as AccessibilityTextSize)
    : "normal";
}

function getFontSizeForState(textSize: AccessibilityTextSize, isAccessible: boolean) {
  const sizeMap: Record<AccessibilityTextSize, string> = {
    small: isAccessible ? "18px" : "14px",
    normal: isAccessible ? "20px" : "16px",
    large: isAccessible ? "24px" : "18px"
  };

  return sizeMap[textSize];
}

function useAccessibility(): AccessibilityState {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAccessible, setIsAccessible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(ACCESSIBILITY_MODE_STORAGE_KEY) === "true";
  });
  const [textSize, setTextSizeState] = useState(readTextSizeStorage);
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ACCESSIBILITY_MODE_STORAGE_KEY, String(isAccessible));
    window.localStorage.setItem(ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY, textSize);
    window.localStorage.setItem(ACCESSIBILITY_CONTRAST_STORAGE_KEY, String(isHighContrast));
    window.localStorage.setItem(ACCESSIBILITY_VOICE_STORAGE_KEY, String(isVoiceEnabled));
    window.localStorage.setItem(ACCESSIBILITY_SOUND_STORAGE_KEY, String(isSoundEnabled));

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

    doc.style.fontSize = getFontSizeForState(textSize, isAccessible);

    if (prefersReducedMotion) {
      doc.classList.add("reduce-motion");
    } else {
      doc.classList.remove("reduce-motion");
    }
  }, [isAccessible, textSize, isHighContrast, isVoiceEnabled, isSoundEnabled, prefersReducedMotion]);

  const toggleAccessibility = useCallback(() => {
    setIsAccessible((currentValue) => !currentValue);
  }, []);

  const updateTextSize = useCallback((value: AccessibilityTextSize) => {
    if (ACCESSIBILITY_TEXT_SIZES.includes(value)) {
      setTextSizeState(value);
    }
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast((currentValue) => !currentValue);
  }, []);

  const toggleVoiceEnabled = useCallback(() => {
    setIsVoiceEnabled((currentValue) => !currentValue);
  }, []);

  const toggleSoundEnabled = useCallback(() => {
    setIsSoundEnabled((currentValue) => !currentValue);
  }, []);

  const openAccessibilityPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closeAccessibilityPanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

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