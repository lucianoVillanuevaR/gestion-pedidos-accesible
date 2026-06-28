import { describe, expect, it } from "vitest";
import * as backendPedidoRules from "./pedidoRules";
import * as backendProductoRules from "./productoRules";
import * as frontendPedidoRules from "../../../frontend/src/domain/pedidoRules";
import * as frontendProductoRules from "../../../frontend/src/domain/productoRules";

describe("contrato de reglas compartidas con frontend", () => {
  it("mantiene sincronizadas las reglas de pedidos", () => {
    expect(frontendPedidoRules.PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH).toBe(
      backendPedidoRules.PEDIDO_CLIENTE_NOMBRE_MAX_LENGTH
    );
    expect(frontendPedidoRules.PEDIDO_OBSERVACION_MAX_LENGTH).toBe(backendPedidoRules.PEDIDO_OBSERVACION_MAX_LENGTH);
    expect(frontendPedidoRules.PEDIDO_MAX_DETALLES).toBe(backendPedidoRules.PEDIDO_MAX_DETALLES);
    expect(frontendPedidoRules.PEDIDO_MAX_CANTIDAD_DETALLE).toBe(backendPedidoRules.PEDIDO_MAX_CANTIDAD_DETALLE);
    expect(frontendPedidoRules.CLIENTE_NOMBRE_PATTERN.source).toBe(backendPedidoRules.CLIENTE_NOMBRE_PATTERN.source);
    expect(frontendPedidoRules.ESTADOS_PEDIDO_VALIDOS).toEqual(backendPedidoRules.ESTADOS_PEDIDO_VALIDOS);
    expect(frontendPedidoRules.ESTADOS_PEDIDO_ACTIVOS).toEqual(backendPedidoRules.ESTADOS_PEDIDO_ACTIVOS);
    expect(frontendPedidoRules.METODOS_PAGO_VALIDOS).toEqual(backendPedidoRules.METODOS_PAGO_VALIDOS);
    expect(frontendPedidoRules.TRANSICIONES_ESTADO_PERMITIDAS).toEqual(
      backendPedidoRules.TRANSICIONES_ESTADO_PERMITIDAS
    );
  });

  it("mantiene sincronizadas las reglas de productos", () => {
    expect(frontendProductoRules.PRODUCTO_NOMBRE_MAX_LENGTH).toBe(backendProductoRules.PRODUCTO_NOMBRE_MAX_LENGTH);
    expect(frontendProductoRules.PRODUCTO_CATEGORIA_MAX_LENGTH).toBe(
      backendProductoRules.PRODUCTO_CATEGORIA_MAX_LENGTH
    );
    expect(frontendProductoRules.PRODUCTO_DESCRIPCION_MAX_LENGTH).toBe(
      backendProductoRules.PRODUCTO_DESCRIPCION_MAX_LENGTH
    );
    expect(frontendProductoRules.PRODUCTO_PRECIO_MIN).toBe(backendProductoRules.PRODUCTO_PRECIO_MIN);
    expect(frontendProductoRules.PRODUCTO_PRECIO_MAX).toBe(backendProductoRules.PRODUCTO_PRECIO_MAX);
  });
});
