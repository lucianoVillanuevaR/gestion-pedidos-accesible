// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSoundFeedback } from "./useSoundFeedback";

const start = vi.fn();
const setFrequency = vi.fn();
const oscillator = {
  connect: vi.fn(),
  frequency: { setValueAtTime: setFrequency },
  start,
  stop: vi.fn(),
  type: "sine"
};
const gain = {
  connect: vi.fn(),
  gain: {
    exponentialRampToValueAtTime: vi.fn(),
    setValueAtTime: vi.fn()
  }
};

class AudioContextMock {
  currentTime = 0;
  destination = {};
  state = "running";
  createGain = () => gain;
  createOscillator = () => oscillator;
  resume = vi.fn().mockResolvedValue(undefined);
}

describe("useSoundFeedback", () => {
  beforeEach(() => {
    start.mockClear();
    setFrequency.mockClear();
    gain.gain.exponentialRampToValueAtTime.mockClear();
    Object.defineProperty(window, "AudioContext", { configurable: true, value: AudioContextMock });
  });

  it("no reproduce feedback cuando los sonidos están desactivados", () => {
    const { result } = renderHook(() => useSoundFeedback(false));
    act(() => result.current.success());
    expect(start).not.toHaveBeenCalled();
  });

  it("reproduce una señal cuando están activados", async () => {
    const { result } = renderHook(() => useSoundFeedback(true, "normal"));
    act(() => result.current.error());
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2));
    expect(gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.0875);
  });

  it.each([
    ["success", [740, 980]],
    ["warning", [440, 440]],
    ["error", [260, 210]],
    ["notification", [660, 880]]
  ] as const)("distingue la señal %s", async (type, expectedFrequencies) => {
    const { result } = renderHook(() => useSoundFeedback(true, "soft"));
    act(() => result.current[type]());
    await vi.waitFor(() => expect(setFrequency).toHaveBeenCalledTimes(2));
    expect(setFrequency.mock.calls.map(([frequency]) => frequency)).toEqual(expectedFrequencies);
  });

  it("aplica ganancias crecientes para Suave, Normal y Fuerte", async () => {
    const peakByLevel: number[] = [];
    for (const level of ["soft", "normal", "loud"] as const) {
      gain.gain.exponentialRampToValueAtTime.mockClear();
      const { result, unmount } = renderHook(() => useSoundFeedback(true, level));
      act(() => result.current.success());
      await vi.waitFor(() => expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalled());
      peakByLevel.push(gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]);
      unmount();
    }
    expect(peakByLevel[0]).toBeLessThan(peakByLevel[1]);
    expect(peakByLevel[1]).toBeLessThan(peakByLevel[2]);
  });
});
