// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AccessibilityPanel from "./AccessibilityPanel";

vi.mock("../hooks/useVoice", () => ({
  default: () => ({ cancel: vi.fn(), speak: vi.fn() })
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  isAccessible: false,
  textSize: "normal" as const,
  isHighContrast: false,
  isVoiceEnabled: false,
  isSoundEnabled: false,
  soundVolume: "loud" as const,
  onToggleAccessible: vi.fn(),
  onSetTextSize: vi.fn(),
  onToggleContrast: vi.fn(),
  onToggleVoice: vi.fn(),
  onToggleSound: vi.fn(),
  onSetSoundVolume: vi.fn(),
  onReset: vi.fn()
};

describe("AccessibilityPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("mueve el foco al panel y lo devuelve al elemento que lo abrió", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<AccessibilityPanel {...defaultProps} />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cerrar panel de opciones" }));

    rerender(<AccessibilityPanel {...defaultProps} isOpen={false} />);

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("mantiene la navegación con Tab dentro del diálogo", async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel {...defaultProps} />);

    const dialog = screen.getByRole("dialog");
    const buttons = Array.from(dialog.querySelectorAll("button"));
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    lastButton.focus();
    await user.tab();
    expect(document.activeElement).toBe(firstButton);

    firstButton.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(lastButton);
  });

  it("cierra el diálogo al presionar Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AccessibilityPanel {...defaultProps} onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("expone controles claros cuando modo fácil está activo", () => {
    render(<AccessibilityPanel {...defaultProps} isAccessible isHighContrast isVoiceEnabled isSoundEnabled />);

    expect(screen.getByRole("dialog", { name: "Panel de opciones simples" }).getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("button", { name: "Desactivar modo fácil" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Cerrar panel de opciones" })).toBeTruthy();
    expect(screen.getByText("MODO FÁCIL")).toBeTruthy();
    expect(screen.getAllByText("ACTIVADO")).toHaveLength(4);
  });

  it("permite elegir volumen y deshabilita el control cuando los sonidos están apagados", async () => {
    const user = userEvent.setup();
    const onSetSoundVolume = vi.fn();
    const { rerender } = render(
      <AccessibilityPanel {...defaultProps} isSoundEnabled onSetSoundVolume={onSetSoundVolume} />
    );

    await user.click(screen.getByRole("button", { name: "Normal" }));
    expect(onSetSoundVolume).toHaveBeenCalledWith("normal");

    rerender(<AccessibilityPanel {...defaultProps} />);
    expect((screen.getByRole("button", { name: "Fuerte" }).closest("fieldset") as HTMLFieldSetElement).disabled).toBe(
      true
    );
    expect(
      (screen.getByRole("button", { name: "Probar sonido" }).closest("fieldset") as HTMLFieldSetElement).disabled
    ).toBe(true);
  });
});
