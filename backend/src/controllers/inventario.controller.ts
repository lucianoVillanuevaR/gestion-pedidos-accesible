import { Request, Response } from "express";
import prisma from "../config/prisma";
import { parsePositiveIntegerId, validatePositiveIntegerId } from "../validations/common.validation";
import { validateInventarioUpdate } from "../validations/inventario.validation";

const DEFAULT_STOCK_ACTUAL = 0;
const DEFAULT_STOCK_MINIMO = 0;

function getEstadoInventario(stockActual: number, stockMinimo: number) {
  if (stockActual <= 0) {
    return "sin_stock";
  }

  if (stockActual <= stockMinimo) {
    return "bajo_stock";
  }

  return "disponible";
}

function toInventarioResponse(item: {
  productoId: number;
  stockActual: number;
  stockMinimo: number;
  producto: {
    disponible: boolean;
    id: number;
    nombre: string;
  };
}) {
  return {
    productoId: item.productoId,
    productoNombre: item.producto.nombre,
    productoDisponible: item.producto.disponible,
    stockActual: item.stockActual,
    stockMinimo: item.stockMinimo,
    estado: getEstadoInventario(item.stockActual, item.stockMinimo)
  };
}

export const getInventario = async (_req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        inventario: true
      },
      orderBy: { nombre: "asc" }
    });

    const inventario = await Promise.all(
      productos.map(async (producto) => {
        const item = producto.inventario ?? (await prisma.inventario.create({
          data: {
            productoId: producto.id,
            stockActual: DEFAULT_STOCK_ACTUAL,
            stockMinimo: DEFAULT_STOCK_MINIMO
          }
        }));

        return toInventarioResponse({
          producto,
          productoId: producto.id,
          stockActual: item.stockActual,
          stockMinimo: item.stockMinimo
        });
      })
    );

    res.json(inventario);
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    res.status(500).json({ error: "Error al obtener inventario" });
  }
};

export const updateInventarioProducto = async (req: Request, res: Response) => {
  try {
    const idError = validatePositiveIntegerId(req.params.productoId, "ID de producto");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const validation = validateInventarioUpdate(req.body);

    if (validation.error || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    const productoId = parsePositiveIntegerId(req.params.productoId);
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const item = await prisma.inventario.upsert({
      create: {
        productoId,
        stockActual: validation.data.stockActual ?? DEFAULT_STOCK_ACTUAL,
        stockMinimo: validation.data.stockMinimo ?? DEFAULT_STOCK_MINIMO
      },
      update: validation.data,
      where: { productoId }
    });

    res.json(toInventarioResponse({
      producto,
      productoId,
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo
    }));
  } catch (error) {
    console.error("Error al actualizar inventario:", error);
    res.status(500).json({ error: "Error al actualizar inventario" });
  }
};
