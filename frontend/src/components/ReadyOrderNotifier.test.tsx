// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PedidoResponse } from "../types";
import ReadyOrderNotifier, {
  READY_ORDER_POLL_MS,
  READY_ORDER_VISIBLE_MS,
  findNewlyReadyOrders
} from "./ReadyOrderNotifier";

const mocks = vi.hoisted(() => ({
  getPedidos: vi.fn(),
  orderReady: vi.fn().mockResolvedValue(true)
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuthContext: () => ({ user: { role: "cajero" } })
}));
vi.mock("../contexts/AccessibilityContext", () => ({
  useAccessibilityContext: () => ({
    isHighContrast: false,
    isSoundEnabled: true,
    soundVolume: "normal"
  })
}));
vi.mock("../hooks/useSoundFeedback", () => ({
  useSoundFeedback: () => ({ orderReady: mocks.orderReady })
}));
vi.mock("../services/pedidos", () => ({
  getPedidos: (...args: unknown[]) => mocks.getPedidos(...args)
}));

const pedido = (
  estado: PedidoResponse["estado"],
  { id = 42, numeroTurno = 7 }: { id?: number; numeroTurno?: number } = {}
): PedidoResponse => ({
  id,
  numeroTurno,
  estado,
  metodoPago: "efectivo",
  total: "3500"
});

describe("notificador global de pedidos listos", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("solo detecta una transición conocida hacia listo", () => {
    expect(findNewlyReadyOrders(new Map(), [pedido("listo")])).toEqual([]);
    expect(findNewlyReadyOrders(new Map([[42, "en_preparacion"]]), [pedido("listo")])).toHaveLength(1);
    expect(findNewlyReadyOrders(new Map([[42, "listo"]]), [pedido("listo")])).toEqual([]);
  });

  it("no avisa en la carga inicial y no repite el aviso en consultas posteriores", async () => {
    mocks.getPedidos
      .mockResolvedValueOnce([pedido("en_preparacion")])
      .mockResolvedValueOnce([pedido("listo")])
      .mockResolvedValueOnce([pedido("listo")]);
    render(<ReadyOrderNotifier />);
    await act(async () => undefined);
    expect(screen.queryByRole("status")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS);
    });
    expect(screen.getByText("Pedido N.º 1 listo para entregar")).toBeTruthy();
    expect(mocks.orderReady).toHaveBeenCalledOnce();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS);
    });
    expect(mocks.orderReady).toHaveBeenCalledOnce();
  });

  it("evita solicitudes superpuestas", async () => {
    let resolveRequest!: (value: PedidoResponse[]) => void;
    mocks.getPedidos.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)));
    render(<ReadyOrderNotifier />);
    expect(mocks.getPedidos).toHaveBeenCalledOnce();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS * 3);
    });
    expect(mocks.getPedidos).toHaveBeenCalledOnce();
    await act(async () => resolveRequest([pedido("pendiente")]));
  });

  it("muestra el número del turno y no el ID interno", async () => {
    mocks.getPedidos
      .mockResolvedValueOnce([pedido("en_preparacion", { id: 448, numeroTurno: 1 })])
      .mockResolvedValue([pedido("listo", { id: 448, numeroTurno: 1 })]);
    render(<ReadyOrderNotifier />);
    await act(async () => undefined);
    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS)));

    expect(screen.getByText("Pedido N.º 1 listo para entregar")).toBeTruthy();
    expect(screen.queryByText(/448 listo/)).toBeNull();
  });

  it("cierra automáticamente la tarjeta después de 15 segundos", async () => {
    mocks.getPedidos.mockResolvedValueOnce([pedido("en_preparacion")]).mockResolvedValue([pedido("listo")]);
    render(<ReadyOrderNotifier />);
    await act(async () => undefined);
    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS)));

    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_VISIBLE_MS - 1)));
    expect(screen.getByText("Pedido N.º 1 listo para entregar")).toBeTruthy();
    await act(async () => void (await vi.advanceTimersByTimeAsync(1)));
    expect(screen.queryByText(/listo para entregar/)).toBeNull();
  });

  it("pausa y reanuda el tiempo restante con cursor y foco", async () => {
    mocks.getPedidos.mockResolvedValueOnce([pedido("en_preparacion")]).mockResolvedValue([pedido("listo")]);
    render(<ReadyOrderNotifier />);
    await act(async () => undefined);
    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS)));

    const card = screen.getByRole("status");
    const closeButton = screen.getByRole("button", { name: "Cerrar aviso del pedido 1" });
    await act(async () => void (await vi.advanceTimersByTimeAsync(5000)));
    fireEvent.mouseEnter(card);
    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_VISIBLE_MS)));
    expect(card.isConnected).toBe(true);
    fireEvent.mouseLeave(card);

    await act(async () => void (await vi.advanceTimersByTimeAsync(4000)));
    closeButton.focus();
    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_VISIBLE_MS)));
    expect(card.isConnected).toBe(true);
    fireEvent.blur(closeButton, { relatedTarget: document.body });

    await act(async () => void (await vi.advanceTimersByTimeAsync(5999)));
    expect(card.isConnected).toBe(true);
    await act(async () => void (await vi.advanceTimersByTimeAsync(1)));
    expect(card.isConnected).toBe(false);
  });

  it("conserva alertas simultáneas y reproduce una sola campanilla por lote", async () => {
    const initial = [
      pedido("en_preparacion", { id: 448, numeroTurno: 1 }),
      pedido("en_preparacion", { id: 900, numeroTurno: 2 })
    ];
    const ready = initial.map((item) => ({ ...item, estado: "listo" as const }));
    mocks.getPedidos.mockResolvedValueOnce(initial).mockResolvedValue(ready);
    render(<ReadyOrderNotifier />);
    await act(async () => undefined);
    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS)));

    expect(screen.getByText("Pedido N.º 1 listo para entregar")).toBeTruthy();
    expect(screen.getByText("Pedido N.º 2 listo para entregar")).toBeTruthy();
    expect(mocks.orderReady).toHaveBeenCalledOnce();
  });

  it("permite cerrar inmediatamente con X y devuelve el foco al contenido principal", async () => {
    const main = document.createElement("main");
    main.id = "main-content";
    main.tabIndex = -1;
    document.body.appendChild(main);
    mocks.getPedidos.mockResolvedValueOnce([pedido("en_preparacion")]).mockResolvedValue([pedido("listo")]);
    render(<ReadyOrderNotifier />);
    await act(async () => undefined);
    await act(async () => void (await vi.advanceTimersByTimeAsync(READY_ORDER_POLL_MS)));

    const closeButton = screen.getByRole("button", { name: "Cerrar aviso del pedido 1" });
    closeButton.focus();
    fireEvent.click(closeButton);
    await act(async () => void (await vi.advanceTimersByTimeAsync(16)));

    expect(screen.queryByText(/listo para entregar/)).toBeNull();
    expect(document.activeElement).toBe(main);
    main.remove();
  });
});
