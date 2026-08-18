import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { serializeCierreTurno, serializeTurno } from "./turnos.controller";

const usuarioActual = {
  label: "Administrador nuevo",
  role: "admin",
  username: "cajero"
};

function turnoBase(): Parameters<typeof serializeTurno>[0] {
  return {
    estado: "cerrado",
    fechaCierre: new Date("2026-08-16T22:00:00.000Z"),
    fechaInicio: new Date("2026-08-16T18:00:00.000Z"),
    id: 7,
    pedidos: [],
    resumen: null,
    usuario: usuarioActual,
    usuarioId: 1
  };
}

describe("serialización de turnos", () => {
  it("preserva el usuario guardado en el snapshot aunque el usuario actual haya cambiado", () => {
    const turno = turnoBase();
    turno.resumen = {
      id: "turno-7",
      usuario: {
        label: "Cajero antiguo",
        role: "cajero",
        username: "cajero"
      },
      usuarioId: "cajero"
    };

    const serialized = serializeTurno(turno);

    expect(serialized.resumen).toMatchObject({
      usuario: {
        label: "Cajero antiguo",
        role: "cajero",
        username: "cajero"
      },
      usuarioId: "cajero"
    });
  });

  it("usa el usuario actual como fallback para snapshots antiguos sin usuario", () => {
    const turno = turnoBase();
    turno.resumen = { id: "turno-7" };

    const serialized = serializeTurno(turno);

    expect(serialized.resumen).toMatchObject({
      usuario: usuarioActual,
      usuarioId: "cajero"
    });
  });

  it("reconstruye un cierre antiguo con resumen null usando sus relaciones persistidas", () => {
    const turno: Parameters<typeof serializeCierreTurno>[0] = {
      ...turnoBase(),
      pedidos: [
        {
          clienteNombre: "Cliente histórico",
          createdAt: new Date("2026-08-16T19:00:00.000Z"),
          detalles: [
            {
              cantidad: 1,
              id: 1,
              pedidoId: 21,
              personalizacion: null,
              precioUnitario: new Prisma.Decimal(3500),
              producto: { nombre: "Completo Italiano" },
              productoId: 4,
              subtotal: new Prisma.Decimal(3500),
              varianteId: null
            }
          ],
          estado: "entregado",
          id: 21,
          metodoPago: "efectivo",
          observacion: null,
          total: new Prisma.Decimal(3500),
          turnoId: 7,
          updatedAt: new Date("2026-08-16T19:05:00.000Z")
        }
      ]
    };

    const serialized = serializeCierreTurno(turno);

    expect(serialized.resumen).toMatchObject({
      id: "turno-7",
      pedidos: [{ id: 21, total: 3500 }],
      productosVendidos: [{ cantidad: 1, productoNombre: "Completo Italiano", total: 3500 }],
      totalEfectivo: 3500,
      totalPedidos: 1,
      totalVendido: 3500,
      usuario: usuarioActual
    });
  });
});
