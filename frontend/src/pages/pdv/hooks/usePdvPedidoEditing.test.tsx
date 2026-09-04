// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPedido } from "../../../services/pedidos";
import type { PedidoResponse } from "../../../types";
import { usePdvPedidoEditing } from "./usePdvPedidoEditing";

vi.mock("../../../services/pedidos", () => ({ getPedido: vi.fn() }));

const pedido: PedidoResponse = {
  id: 7,
  estado: "pendiente",
  total: "3500",
  metodoPago: "tarjeta",
  clienteNombre: "Ana",
  updatedAt: "2026-07-20T10:00:00.000Z",
  detalles: []
};

describe("edición de pedidos en modo fácil", () => {
  beforeEach(() => vi.clearAllMocks());

  it("carga el pedido por ID y permite cancelar hacia pedidos fáciles", async () => {
    vi.mocked(getPedido).mockResolvedValue(pedido);
    const loadPedidoForEditing = vi.fn();
    const announce = vi.fn();
    const clearPedidoForm = vi.fn();
    const navigate = vi.fn();

    const { result } = renderHook(() =>
      usePdvPedidoEditing({
        announce,
        clearPedidoForm,
        isAccessible: true,
        loadPedidoForEditing,
        loadingProductos: false,
        navigate,
        search: "?editar=7",
        showFeedback: vi.fn()
      })
    );

    await waitFor(() => expect(loadPedidoForEditing).toHaveBeenCalledWith(pedido));
    expect(getPedido).toHaveBeenCalledWith(7, expect.any(AbortSignal));
    expect(result.current.editingPedido).toEqual(pedido);
    expect(announce).toHaveBeenCalledWith("Pedido número 7 cargado para edición.", {
      priority: "normal",
      dedupeKey: "pedido-edit-loaded:7",
      cooldownMs: 1600
    });

    act(() => result.current.cancelEditingPedido());
    expect(clearPedidoForm).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/pedidos/facil", { replace: true });
  });

  it("informa cuando el pedido dejó de estar pendiente", async () => {
    vi.mocked(getPedido).mockResolvedValue({
      ...pedido,
      estado: "en_preparacion"
    });
    const showFeedback = vi.fn();

    renderHook(() =>
      usePdvPedidoEditing({
        announce: vi.fn(),
        clearPedidoForm: vi.fn(),
        isAccessible: true,
        loadPedidoForEditing: vi.fn(),
        loadingProductos: false,
        navigate: vi.fn(),
        search: "?editar=7",
        showFeedback
      })
    );

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Solo se pueden modificar pedidos pendientes"
        })
      )
    );
  });
});
