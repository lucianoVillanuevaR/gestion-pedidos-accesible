import { Request, Response } from "express";
import prisma from "../config/prisma";
import { parsePositiveIntegerId, validatePositiveIntegerId } from "../validations/common.validation";
import { validateCategoriaNombre } from "../validations/categorias.validation";

function serializeCategoria(categoria: { id: number; nombre: string }) {
  return {
    id: categoria.id,
    nombre: categoria.nombre
  };
}

export async function getCategorias(_req: Request, res: Response) {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true }
    });

    return res.json(categorias.map(serializeCategoria));
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return res.status(500).json({ error: "Error al obtener categorías" });
  }
}

export async function createCategoria(req: Request, res: Response) {
  try {
    const { nombre } = req.body as { nombre?: unknown };
    const validationError = validateCategoriaNombre(nombre);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const cleanName = (nombre as string).trim();
    const categoria = await prisma.categoria.create({
      data: {
        descripcion: `Productos de ${cleanName}`,
        nombre: cleanName
      },
      select: { id: true, nombre: true }
    });

    return res.status(201).json(serializeCategoria(categoria));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe una categoría con ese nombre" });
    }

    console.error("Error al crear categoría:", error);
    return res.status(500).json({ error: "Error al crear categoría" });
  }
}

export async function deleteCategoria(req: Request, res: Response) {
  try {
    const idError = validatePositiveIntegerId(req.params.id, "ID de categoría");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const categoriaId = parsePositiveIntegerId(req.params.id);
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
      include: { _count: { select: { productos: true } } }
    });

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    if (categoria._count.productos > 0) {
      return res.status(409).json({ error: "No se puede eliminar una categoría con productos asociados" });
    }

    await prisma.categoria.delete({ where: { id: categoriaId } });
    return res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return res.status(500).json({ error: "Error al eliminar categoría" });
  }
}
