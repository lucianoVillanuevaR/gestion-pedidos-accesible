// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSoundFeedback } from "./useSoundFeedback";

const start = vi.fn();
const oscillator = {
  connect: vi.fn(),
  frequency: { setValueAtTime: vi.fn() },
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
});
