// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { getPdvKeyboardAction } from "./pdvKeyboardNavigation";

describe("getPdvKeyboardAction", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each(["Escape", "ArrowRight", "ArrowLeft"])("ignora %s mientras hay un modal abierto", (key) => {
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);

    expect(getPdvKeyboardAction(key)).toBeNull();
  });

  it("mantiene la navegación del modo fácil cuando no hay un modal abierto", () => {
    expect(getPdvKeyboardAction("ArrowRight")).toBe("next");
    expect(getPdvKeyboardAction("ArrowLeft")).toBe("previous");
    expect(getPdvKeyboardAction("Escape")).toBe("reset");
  });
});
