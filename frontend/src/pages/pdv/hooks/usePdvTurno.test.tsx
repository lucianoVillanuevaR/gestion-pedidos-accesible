// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  abrirTurnoRemoto,
  sincronizarTurnoActual,
} from "../../../services/cierresTurno";
import { usePdvTurno } from "./usePdvTurno";

vi.mock("../../../services/cierresTurno", () => ({
  abrirTurnoRemoto: vi.fn(),
  guardarCierreTurno: vi.fn(),
  sincronizarTurnoActual: vi.fn(),
}));
vi.mock("../../pedidos/PedidosShared", () => ({
  readTurnoAbierto: () => false,
  setTurnoAbierto: vi.fn(),
  setTurnoFechaInicio: vi.fn(),
  TURNO_ABIERTO_STORAGE_KEY: "turno",
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe("usePdvTurno", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("impide dos aperturas mientras la primera sigue pendiente", async () => {
    vi.mocked(sincronizarTurnoActual).mockResolvedValue(null);
    const pending = deferred<{ fechaInicio: string }>();
    vi.mocked(abrirTurnoRemoto).mockReturnValue(pending.promise);
    const { result } = renderHook(() =>
      usePdvTurno({
        announce: vi.fn(),
        onTurnoStateChange: vi.fn(),
        playSoundCue: vi.fn(),
        showFeedback: vi.fn(),
      }),
    );

    let first!: Promise<void>;
    await act(async () => {
      first = result.current.handleToggleTurno();
      void result.current.handleToggleTurno();
    });
    expect(abrirTurnoRemoto).toHaveBeenCalledOnce();
    expect(result.current.isTurnoUpdating).toBe(true);

    pending.resolve({ fechaInicio: "2026-09-02T10:00:00.000Z" });
    await act(() => first);
    expect(result.current.isTurnoUpdating).toBe(false);
  });
});
