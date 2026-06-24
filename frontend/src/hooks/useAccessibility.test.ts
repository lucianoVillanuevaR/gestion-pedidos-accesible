// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCESSIBILITY_CONTRAST_STORAGE_KEY,
  ACCESSIBILITY_MODE_STORAGE_KEY,
  ACCESSIBILITY_SOUND_STORAGE_KEY,
  ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY,
  ACCESSIBILITY_VOICE_STORAGE_KEY
} from "../constants/accessibility";
import useAccessibility from "./useAccessibility";

type MediaQueryChangeListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<MediaQueryChangeListener>();

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: (_type: string, listener: MediaQueryChangeListener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: MediaQueryChangeListener) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  } as unknown as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => mediaQueryList)
  });

  return {
    setMatches(value: boolean) {
      matches = value;
      const event = { matches: value, media: mediaQueryList.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    }
  };
}

describe("useAccessibility", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    delete document.documentElement.dataset.accessible;
    delete document.documentElement.dataset.contrast;
    delete document.documentElement.dataset.reducedMotion;
    installMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("recupera los ajustes válidos guardados en localStorage", () => {
    window.localStorage.setItem(ACCESSIBILITY_MODE_STORAGE_KEY, "true");
    window.localStorage.setItem(ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY, "large");
    window.localStorage.setItem(ACCESSIBILITY_CONTRAST_STORAGE_KEY, "true");
    window.localStorage.setItem(ACCESSIBILITY_VOICE_STORAGE_KEY, "true");
    window.localStorage.setItem(ACCESSIBILITY_SOUND_STORAGE_KEY, "true");

    const { result } = renderHook(() => useAccessibility());

    expect(result.current).toMatchObject({
      isAccessible: true,
      textSize: "large",
      isHighContrast: true,
      isVoiceEnabled: true,
      isSoundEnabled: true
    });
    expect(document.documentElement.style.fontSize).toBe("24px");
  });

  it("persiste y refleja los cambios de tamaño y contraste en el documento", () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.setTextSize("large");
      result.current.toggleHighContrast();
    });

    expect(window.localStorage.getItem(ACCESSIBILITY_TEXT_SIZE_STORAGE_KEY)).toBe("large");
    expect(window.localStorage.getItem(ACCESSIBILITY_CONTRAST_STORAGE_KEY)).toBe("true");
    expect(document.documentElement.dataset.textSize).toBe("large");
    expect(document.documentElement.dataset.contrast).toBe("true");
    expect(document.documentElement.style.fontSize).toBe("18px");
  });

  it("reacciona cuando cambia la preferencia de movimiento reducido", async () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useAccessibility());

    act(() => media.setMatches(true));

    await waitFor(() => expect(result.current.prefersReducedMotion).toBe(true));
    expect(document.documentElement.dataset.reducedMotion).toBe("true");
    expect(document.documentElement.classList.contains("reduce-motion")).toBe(true);

    act(() => media.setMatches(false));

    await waitFor(() => expect(result.current.prefersReducedMotion).toBe(false));
    expect(document.documentElement.classList.contains("reduce-motion")).toBe(false);
  });
});
