import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getProductos = async (req: Request, res: Response) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { nombre: "asc" }
    });
    res.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

export const getProductoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const producto = await prisma.producto.findUnique({
      where: { id: Number(id) }
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
};
