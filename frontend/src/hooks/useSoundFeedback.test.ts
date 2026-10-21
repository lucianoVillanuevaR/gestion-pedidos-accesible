// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SoundVolumeLevel } from "../constants/accessibility";
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
    oscillator.stop.mockClear();
    setFrequency.mockClear();
    gain.gain.exponentialRampToValueAtTime.mockClear();
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: AudioContextMock
    });
  });

  it("no reproduce feedback cuando los sonidos están desactivados", async () => {
    const { result } = renderHook(() => useSoundFeedback(false));
    await act(async () => void (await result.current.success()));
    expect(start).not.toHaveBeenCalled();
  });

  it("reproduce una señal cuando están activados", async () => {
    const { result } = renderHook(() => useSoundFeedback(true, "normal"));
    await act(async () => void (await result.current.error()));
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2));
    expect(gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.1225);
  });

  it.each([
    ["success", [740, 980]],
    ["warning", [440, 440]],
    ["error", [260, 210]],
    ["notification", [660, 880]],
    ["orderReady", [523, 659, 784]]
  ] as const)("distingue la señal %s", async (type, expectedFrequencies) => {
    const { result } = renderHook(() => useSoundFeedback(true, "soft"));
    await act(async () => void (await result.current[type]()));
    await vi.waitFor(() => expect(setFrequency).toHaveBeenCalledTimes(expectedFrequencies.length));
    expect(setFrequency.mock.calls.map(([frequency]) => frequency)).toEqual(expectedFrequencies);
  });

  it("extiende la campanilla de pedido listo a unos 670 ms", async () => {
    const { result } = renderHook(() => useSoundFeedback(true, "normal"));
    await act(async () => void (await result.current.orderReady()));
    await vi.waitFor(() => expect(oscillator.stop).toHaveBeenCalledTimes(3));
    expect(oscillator.stop.mock.calls[oscillator.stop.mock.calls.length - 1]?.[0]).toBeCloseTo(0.7);
  });

  it("aplica ganancias crecientes para Suave, Normal y Fuerte", async () => {
    const peakByLevel: number[] = [];
    for (const level of ["soft", "normal", "loud"] as const) {
      gain.gain.exponentialRampToValueAtTime.mockClear();
      const { result, unmount } = renderHook(() => useSoundFeedback(true, level));
      await act(async () => void (await result.current.success()));
      await vi.waitFor(() => expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalled());
      peakByLevel.push(gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]);
      unmount();
    }
    expect(peakByLevel[0]).toBeLessThan(peakByLevel[1]);
    expect(peakByLevel[1]).toBeLessThan(peakByLevel[2]);
    expect(peakByLevel[2]).toBeGreaterThan(peakByLevel[1] * 1.5);
    expect(peakByLevel).toEqual([expect.closeTo(0.0735), expect.closeTo(0.1225), expect.closeTo(0.21875)]);
  });

  it("refuerza las alertas de pedido sin superar el límite seguro de ganancia", async () => {
    const { result, rerender } = renderHook(
      ({ level }) => useSoundFeedback(true, level),
      { initialProps: { level: "normal" as SoundVolumeLevel } }
    );

    await act(async () => void (await result.current.notification()));
    expect(gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.153125);

    gain.gain.exponentialRampToValueAtTime.mockClear();
    rerender({ level: "loud" });
    await act(async () => void (await result.current.orderReady()));
    expect(gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(0.32);
  });
});
