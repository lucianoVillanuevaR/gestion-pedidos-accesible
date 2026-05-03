import { useEffect, useState } from "react";
import {
  ACCESSIBILITY_CONTRAST_STORAGE_KEY,
  ACCESSIBILITY_MODE_STORAGE_KEY,
  ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY,
  ACCESSIBILITY_VOICE_STORAGE_KEY
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

function getFontSizeForState(textSize, isAccessible) {
  const sizeMap = {
    small: isAccessible ? 18 : 16,
    normal: isAccessible ? 20 : 18,
    large: isAccessible ? 22 : 20
  };

  return `${sizeMap[textSize]}px`;
}

function useAccessibility() {
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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

    window.document.documentElement.dataset.accessible = String(isAccessible);
    window.document.documentElement.dataset.contrast = String(isHighContrast);
    window.document.documentElement.dataset.voice = String(isVoiceEnabled);
    window.document.documentElement.dataset.textSize = textSize;
    window.document.body.dataset.contrast = String(isHighContrast);
    window.document.body.dataset.accessible = String(isAccessible);
    window.document.body.dataset.textSize = textSize;
    window.document.documentElement.style.fontSize = getFontSizeForState(
      textSize,
      isAccessible
    );
  }, [isAccessible, textSize, isHighContrast, isVoiceEnabled]);

  const toggleAccessibility = () => {
    setIsAccessible((currentValue) => !currentValue);
  };

  const updateTextSize = (value) => {
    setTextSize(value);
  };

  const toggleHighContrast = () => {
    setIsHighContrast((currentValue) => !currentValue);
  };

  const toggleVoiceEnabled = () => {
    setIsVoiceEnabled((currentValue) => !currentValue);
  };

  return {
    isAccessible,
    textSize,
    isHighContrast,
    isVoiceEnabled,
    setTextSize: updateTextSize,
    toggleAccessibility,
    toggleHighContrast,
    toggleVoiceEnabled
  };
}

export default useAccessibility;