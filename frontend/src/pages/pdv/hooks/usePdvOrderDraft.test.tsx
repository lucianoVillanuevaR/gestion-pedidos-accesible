// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Producto } from "../../../types";
import { usePdvOrderDraft } from "./usePdvOrderDraft";

const producto = { id: 1, nombre: "Completo Italiano", precio: 3500 } as Producto;

function renderDraft(playSoundCue = vi.fn()) {
  return {
    playSoundCue,
    ...renderHook(() =>
      usePdvOrderDraft({
        announce: vi.fn(),
        isTurnoOpen: true,
        notifyTurnoClosed: vi.fn(),
        playSoundCue,
        productos: [producto],
        setFeedback: vi.fn(),
        showFeedback: vi.fn()
      })
    )
  };
}

describe("usePdvOrderDraft: feedback al modificar productos", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("permanece en silencio al abrir o cancelar el configurador y confirma una sola vez al agregar", () => {
    const { playSoundCue, result } = renderDraft();

    act(() => result.current.addProduct(producto));
    expect(result.current.pendingVariantProduct).toBe(producto);
    expect(playSoundCue).not.toHaveBeenCalled();

    act(() => result.current.setPendingVariantProduct(null));
    expect(playSoundCue).not.toHaveBeenCalled();

    act(() => result.current.addProduct(producto));
    act(() => result.current.selectPendingVariant(undefined, 1, { aderezos: [] }));
    expect(playSoundCue).toHaveBeenCalledOnce();
    expect(playSoundCue).toHaveBeenCalledWith("success");
    expect(result.current.pedidoDetalles).toHaveLength(1);
  });

  it("no suena al aumentar cantidad y usa warning solamente cuando la cantidad llega a cero", () => {
    const { playSoundCue, result } = renderDraft();

    act(() => result.current.increaseProduct(producto));
    expect(playSoundCue).not.toHaveBeenCalled();

    act(() => result.current.increaseProduct(producto));
    act(() => result.current.decreaseProduct(producto));
    expect(playSoundCue).not.toHaveBeenCalled();

    act(() => result.current.decreaseProduct(producto));
    expect(playSoundCue).toHaveBeenCalledOnce();
    expect(playSoundCue).toHaveBeenCalledWith("warning");
  });

  it("elimina una línea completa con un único warning", () => {
    const { playSoundCue, result } = renderDraft();
    act(() => result.current.addProduct(producto));
    act(() => result.current.selectPendingVariant(undefined, 1, { aderezos: [] }));
    playSoundCue.mockClear();

    const itemKey = result.current.pedidoDetalles[0].itemKey;
    act(() => result.current.removeProduct(itemKey));

    expect(playSoundCue).toHaveBeenCalledOnce();
    expect(playSoundCue).toHaveBeenCalledWith("warning");
    expect(result.current.pedidoDetalles).toHaveLength(0);
  });

  it("no duplica la confirmación bajo React StrictMode", () => {
    const playSoundCue = vi.fn();
    const { result } = renderHook(
      () =>
        usePdvOrderDraft({
          announce: vi.fn(),
          isTurnoOpen: true,
          notifyTurnoClosed: vi.fn(),
          playSoundCue,
          productos: [producto],
          setFeedback: vi.fn(),
          showFeedback: vi.fn()
        }),
      { wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode> }
    );

    act(() => result.current.addProduct(producto));
    act(() => result.current.selectPendingVariant(undefined, 1, { aderezos: [] }));
    expect(playSoundCue).toHaveBeenCalledOnce();
  });

  it("limpia todos los datos del pedido confirmado y elimina el borrador persistido", () => {
    const { result } = renderDraft();

    act(() => {
      result.current.increaseProduct(producto);
      result.current.setClienteNombre("Ana");
      result.current.selectMetodoPago("efectivo");
      result.current.setObservacion("Sin tomate");
    });

    expect(result.current.pedidoDetalles).toHaveLength(1);
    expect(window.localStorage.length).toBe(1);

    act(() => result.current.clearPedidoForm());

    expect(result.current.pedidoDetalles).toHaveLength(0);
    expect(result.current.clienteNombre).toBe("");
    expect(result.current.metodoPago).toBe("");
    expect(result.current.observacion).toBe("");
    expect(result.current.total).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });
});
