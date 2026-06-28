// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY } from "../constants/auth";
import { AuthProvider, useAuthContext } from "../contexts/AuthContext";
import {
  getTurnoSummary,
  readTurnoAbierto,
  setTurnoAbierto,
  setTurnoFechaInicio
} from "../pages/pedidos/PedidosShared";
import { abrirTurnoRemoto, guardarCierreTurno, obtenerCierresTurno } from "../services/cierresTurno";
import { createPedido, getPedidos, updatePedidoEstado } from "../services/pedidos";
import type { CreatePedidoPayload, EstadoPedido, PedidoResponse } from "../types";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function installPedidosApi() {
  let pedido: PedidoResponse | null = null;
  let turnoAbierto = false;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith("/api/auth/login") && init?.method === "POST") {
      return jsonResponse({
        token: "token-prueba",
        user: { email: "cajero@demo.cl", label: "Cajero", role: "cajero", username: "cajero" }
      });
    }

    if (url.endsWith("/api/turnos/abrir") && init?.method === "POST") {
      turnoAbierto = true;
      return jsonResponse({ turno: { id: 1, fechaInicio: "2026-06-20T11:55:00.000Z" } }, 201);
    }

    if (url.endsWith("/api/turnos/actual") && (!init?.method || init.method === "GET")) {
      return jsonResponse({ turno: turnoAbierto ? { id: 1, fechaInicio: "2026-06-20T11:55:00.000Z" } : null });
    }

    if (url.endsWith("/api/turnos/1/cerrar") && init?.method === "POST") {
      turnoAbierto = false;
      return jsonResponse({
        turno: {
          id: 1,
          estado: "cerrado",
          resumen: {
            id: "turno-1",
            fechaCierre: "2026-06-20T13:00:00.000Z",
            usuarioId: "cajero",
            pedidos: pedido ? [{ id: pedido.id }] : [],
            productosVendidos: [],
            totalPedidos: pedido ? 1 : 0,
            pedidosEntregados: pedido?.estado === "entregado" ? 1 : 0,
            pedidosCancelados: 0,
            pedidosPendientes: 0,
            totalVendido: pedido?.estado === "entregado" ? Number(pedido.total) : 0,
            totalEfectivo: pedido?.estado === "entregado" ? Number(pedido.total) : 0,
            totalPendiente: 0,
            totalTarjeta: 0,
            totalTransferencia: 0
          }
        }
      });
    }

    if (url.endsWith("/api/pedidos") && init?.method === "POST") {
      const payload = JSON.parse(String(init.body)) as CreatePedidoPayload;
      pedido = {
        id: 101,
        estado: "pendiente",
        metodoPago: payload.metodoPago,
        clienteNombre: payload.clienteNombre,
        observacion: payload.observacion,
        total: "5000",
        createdAt: "2026-06-20T12:00:00.000Z",
        detalles: [
          {
            id: 1,
            pedidoId: 101,
            productoId: payload.detalles[0].productoId,
            cantidad: payload.detalles[0].cantidad,
            precioUnitario: "2500",
            subtotal: "5000",
            producto: { id: 7, nombre: "Completo italiano", precio: 2500 }
          }
        ]
      };

      return jsonResponse(pedido, 201);
    }

    if (url.endsWith("/api/pedidos") && (!init?.method || init.method === "GET")) {
      return jsonResponse(pedido ? [pedido] : []);
    }

    if (url.endsWith("/api/pedidos/101/estado") && init?.method === "PATCH" && pedido) {
      const { estado } = JSON.parse(String(init.body)) as { estado: EstadoPedido };
      pedido = { ...pedido, estado };
      return jsonResponse(pedido);
    }

    return jsonResponse({ error: `Ruta inesperada: ${url}` }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("flujo operativo principal", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("inicia sesión, abre turno, entrega un pedido y guarda el cierre", async () => {
    const fetchMock = installPedidosApi();
    const { result } = renderHook(() => useAuthContext(), { wrapper: AuthProvider });

    await act(async () => {
      const loginResult = await result.current.login({ identifier: "cajero", password: "123456" });
      expect(loginResult.ok).toBe(true);
    });

    expect(result.current.user).toMatchObject({ username: "cajero", role: "cajero" });
    expect(JSON.parse(window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? "null")).toMatchObject({
      username: "cajero"
    });
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("token-prueba");

    const turno = await abrirTurnoRemoto();
    setTurnoAbierto(true);
    setTurnoFechaInicio(turno.fechaInicio);
    expect(readTurnoAbierto()).toBe(true);

    const pedidoCreado = await createPedido({
      clienteNombre: "Ana",
      detalles: [{ productoId: 7, cantidad: 2 }],
      metodoPago: "efectivo",
      observacion: "Sin tomate"
    });
    expect(pedidoCreado).toMatchObject({ id: 101, estado: "pendiente", total: "5000" });

    const enPreparacion = await updatePedidoEstado(pedidoCreado.id, "en_preparacion");
    expect(enPreparacion.estado).toBe("en_preparacion");

    const listo = await updatePedidoEstado(pedidoCreado.id, "listo");
    expect(listo.estado).toBe("listo");

    const entregado = await updatePedidoEstado(pedidoCreado.id, "entregado");
    expect(entregado.estado).toBe("entregado");

    const pedidos = await getPedidos();
    expect(getTurnoSummary(pedidos)).toMatchObject({
      pedidosEntregados: 1,
      pedidosPendientes: 0,
      totalEfectivo: 5000,
      totalVendido: 5000
    });

    await guardarCierreTurno();
    setTurnoAbierto(false);

    expect(readTurnoAbierto()).toBe(false);
    expect(obtenerCierresTurno()).toHaveLength(1);
    expect(obtenerCierresTurno()[0]).toMatchObject({
      usuarioId: "cajero",
      pedidosEntregados: 1,
      totalVendido: 5000
    });
    const closeRequest = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/api/turnos/1/cerrar"));
    expect(closeRequest?.[1]?.body).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });
});
