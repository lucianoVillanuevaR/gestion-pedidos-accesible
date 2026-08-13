// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessibilityPanel from "../components/AccessibilityPanel";

vi.mock("../hooks/useVoice", () => ({
  default: () => ({ cancel: vi.fn(), speak: vi.fn() })
}));

describe("auditoría automática del panel de accesibilidad", () => {
  afterEach(cleanup);

  it("no presenta violaciones WCAG A/AA detectables", async () => {
    const { container } = render(
      <AccessibilityPanel
        isOpen
        onClose={vi.fn()}
        isAccessible
        textSize="large"
        isHighContrast
        isVoiceEnabled={false}
        isSoundEnabled
        soundVolume="loud"
        onToggleAccessible={vi.fn()}
        onSetTextSize={vi.fn()}
        onToggleContrast={vi.fn()}
        onToggleVoice={vi.fn()}
        onToggleSound={vi.fn()}
        onSetSoundVolume={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const results = await axe.run(container, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
      },
      rules: { "color-contrast": { enabled: false } }
    });
    expect(results.violations).toEqual([]);
  });
});
