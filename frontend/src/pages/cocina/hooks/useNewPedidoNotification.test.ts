// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PedidoResponse } from "../../../types";
import { useNewPedidoNotification } from "./useNewPedidoNotification";

const pedido = (id: number) => ({ id }) as PedidoResponse;

describe("useNewPedidoNotification", () => {
  it("ignora carga inicial, polling igual y agrupa varios pedidos nuevos", () => {
    const notify = vi.fn();
    const { rerender } = renderHook(
      ({ isInitialLoading, pedidos }) =>
        useNewPedidoNotification({ isInitialLoading, isAutomaticRefresh: true, notify, pedidos }),
      { initialProps: { isInitialLoading: true, pedidos: [pedido(1)] } }
    );

    rerender({ isInitialLoading: false, pedidos: [pedido(1)] });
    expect(notify).not.toHaveBeenCalled();

    rerender({ isInitialLoading: false, pedidos: [pedido(1)] });
    expect(notify).not.toHaveBeenCalled();

    rerender({ isInitialLoading: false, pedidos: [pedido(1), pedido(2), pedido(3)] });
    expect(notify).toHaveBeenCalledOnce();

    rerender({ isInitialLoading: false, pedidos: [pedido(3), pedido(2), pedido(1)] });
    expect(notify).toHaveBeenCalledOnce();
  });

  it("no notifica pedidos descubiertos por una actualización manual", () => {
    const notify = vi.fn();
    const { rerender } = renderHook(
      ({ automatic, pedidos }) =>
        useNewPedidoNotification({ isInitialLoading: false, isAutomaticRefresh: automatic, notify, pedidos }),
      { initialProps: { automatic: true, pedidos: [pedido(1)] } }
    );
    rerender({ automatic: false, pedidos: [pedido(1), pedido(2)] });
    expect(notify).not.toHaveBeenCalled();
  });

  it("no vuelve a notificar un pedido conocido que desaparece y reaparece", () => {
    const notify = vi.fn();
    const { rerender } = renderHook(
      ({ pedidos }) => useNewPedidoNotification({ isInitialLoading: false, isAutomaticRefresh: true, notify, pedidos }),
      { initialProps: { pedidos: [pedido(1), pedido(2)] } }
    );

    rerender({ pedidos: [pedido(1)] });
    rerender({ pedidos: [pedido(1), pedido(2)] });
    expect(notify).not.toHaveBeenCalled();
  });
});
