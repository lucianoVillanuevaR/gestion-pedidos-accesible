import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getUploadErrorMessage, uploadProductImageMiddleware } from "../middlewares/uploadImage";
import { deleteProductImage, uploadProductImage, withProductImageUrl } from "../services/productImageService";
import { parsePositiveIntegerId, validatePositiveIntegerId } from "../validations/common.validation";
import { validateProductoCreate, validateProductoUpdate } from "../validations/productos.validation";

const PRODUCTO_WITH_CATEGORIAS_INCLUDE = {
  categorias: {
    orderBy: {
      nombre: "asc"
    }
  }
} as const;

export const getProductos = async (req: Request, res: Response) => {
  try {
    const includeUnavailable = req.query.includeUnavailable === "true";
    const productos = await prisma.producto.findMany({
      include: PRODUCTO_WITH_CATEGORIAS_INCLUDE,
      where: includeUnavailable ? undefined : { disponible: true },
      orderBy: { nombre: "asc" }
    });
    res.json(productos.map(withProductImageUrl));
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

export const getProductoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idError = validatePositiveIntegerId(id, "ID de producto");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const productoId = parsePositiveIntegerId(id);
    const producto = await prisma.producto.findUnique({
      include: PRODUCTO_WITH_CATEGORIAS_INCLUDE,
      where: { id: productoId }
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(withProductImageUrl(producto));
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

export const createProducto = async (req: Request, res: Response) => {
  try {
    const validation = validateProductoCreate(req.body);

    if (validation.error || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    const { categoria, descripcion, destacado, disponible, nombre, precio } = validation.data;
    const producto = await prisma.producto.create({
      data: {
        descripcion,
        destacado,
        disponible,
        nombre,
        precio,
        inventario: {
          create: {
            stockActual: 0,
            stockMinimo: 0
          }
        },
        categorias: {
          connectOrCreate: {
            create: {
              descripcion: `Productos de ${categoria}`,
              nombre: categoria
            },
            where: { nombre: categoria }
          }
        }
      },
      include: PRODUCTO_WITH_CATEGORIAS_INCLUDE
    });

    res.status(201).json(withProductImageUrl(producto));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un producto con ese nombre" });
    }

    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

export const updateProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idError = validatePositiveIntegerId(id, "ID de producto");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const validation = validateProductoUpdate(req.body);

    if (validation.error || !validation.data) {
      return res.status(400).json({ error: validation.error });
    }

    const { categoria, ...productoData } = validation.data;
    const data: Parameters<typeof prisma.producto.update>[0]["data"] = { ...productoData };

    if (categoria !== undefined) {
      data.categorias = {
        set: [],
        connectOrCreate: {
          create: {
            descripcion: `Productos de ${categoria}`,
            nombre: categoria
          },
          where: { nombre: categoria }
        }
      };
    }

    const producto = await prisma.producto.update({
      data,
      include: PRODUCTO_WITH_CATEGORIAS_INCLUDE,
      where: { id: parsePositiveIntegerId(id) }
    });

    res.json(withProductImageUrl(producto));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un producto con ese nombre" });
    }

    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

export const deleteProducto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const idError = validatePositiveIntegerId(id, "ID de producto");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const productoId = parsePositiveIntegerId(id);
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const pedidosConProducto = await prisma.detallePedido.count({
      where: { productoId }
    });

    if (pedidosConProducto > 0) {
      return res.status(409).json({
        error: "No se puede eliminar un producto con pedidos registrados. Puedes ocultarlo para que no se venda."
      });
    }

    if (producto.imagenUrl) {
      await deleteProductImage(productoId);
    }

    await prisma.producto.delete({
      where: { id: productoId }
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (error instanceof Error && "code" in error && error.code === "P2003") {
      return res.status(409).json({
        error:
          "No se puede eliminar un producto relacionado con otros registros. Puedes ocultarlo para que no se venda."
      });
    }

    console.error("Error al eliminar producto:", error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};

export const uploadProductoImagen = (req: Request, res: Response) => {
  const idError = validatePositiveIntegerId(req.params.id, "ID de producto");

  if (idError) {
    return res.status(400).json({ error: idError });
  }

  uploadProductImageMiddleware(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: getUploadErrorMessage(uploadError) });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Debe seleccionar una imagen." });
    }

    try {
      const producto = await uploadProductImage(parsePositiveIntegerId(req.params.id), req.file);
      res.json(producto);
    } catch (error) {
      if (error instanceof Error && error.message === "Producto no encontrado") {
        return res.status(404).json({ error: error.message });
      }

      console.error("Error al subir imagen de producto:", error);
      res.status(500).json({ error: "No se pudo subir la imagen." });
    }
  });
};

export const deleteProductoImagen = async (req: Request, res: Response) => {
  try {
    const idError = validatePositiveIntegerId(req.params.id, "ID de producto");

    if (idError) {
      return res.status(400).json({ error: idError });
    }

    const producto = await deleteProductImage(parsePositiveIntegerId(req.params.id));
    res.json(producto);
  } catch (error) {
    if (error instanceof Error && error.message === "Producto no encontrado") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Error al eliminar imagen de producto:", error);
    res.status(500).json({ error: "No se pudo eliminar la imagen." });
  }
};
