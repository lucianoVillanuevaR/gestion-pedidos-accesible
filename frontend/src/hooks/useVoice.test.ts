import { describe, expect, it } from "vitest";
import { expandCurrencyForSpeech } from "./useVoice";

describe("expandCurrencyForSpeech", () => {
  it("lee montos con signo peso como pesos chilenos", () => {
    expect(expandCurrencyForSpeech("Total $8.300. Pendiente $0.")).toBe(
      "Total 8300 pesos chilenos. Pendiente 0 pesos chilenos."
    );
  });
});
