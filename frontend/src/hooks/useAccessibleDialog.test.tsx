// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useAccessibleDialog from "./useAccessibleDialog";

function TestDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useAccessibleDialog({ containerRef: ref, onClose });
  return (
    <div ref={ref} role="dialog" tabIndex={-1}>
      <button>Primero</button>
      <button>Último</button>
    </div>
  );
}

describe("useAccessibleDialog", () => {
  afterEach(cleanup);

  it("encierra el foco, cierra con Escape y restaura el disparador", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = render(<TestDialog onClose={onClose} />);

    const first = screen.getByRole("button", { name: "Primero" });
    const last = screen.getByRole("button", { name: "Último" });
    expect(document.activeElement).toBe(first);
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
