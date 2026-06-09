import { Request, Response } from "express";
import prisma from "../config/prisma";
import { getUploadErrorMessage, uploadProductImageMiddleware } from "../middlewares/uploadImage";
import { deleteProductImage, uploadProductImage, withProductImageUrl } from "../services/productImageService";

const CATEGORIAS_VALIDAS = ["Sandwich", "Completos", "Bebidas", "Otros", "Destacados"];

function parseBoolean(value: unknown, defaultValue: boolean) {
  return typeof value === "boolean" ? value : defaultValue;
}

export const getProductos = async (req: Request, res: Response) => {
  try {
    const includeUnavailable = req.query.includeUnavailable === "true";
    const productos = await prisma.producto.findMany({
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
    const producto = await prisma.producto.findUnique({
      where: { id: Number(id) }
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
    const {
      categoria = "Otros",
      descripcion,
      destacado,
      disponible,
      nombre,
      precio
    } = req.body as {
      categoria?: string;
      descripcion?: string;
      destacado?: boolean;
      disponible?: boolean;
      nombre?: string;
      precio?: number | string;
    };

    const nombreLimpio = nombre?.trim();
    const descripcionLimpia = descripcion?.trim();
    const precioNumerico = Number(precio);
    const categoriaLimpia = categoria.trim();

    if (!nombreLimpio) {
      return res.status(400).json({ error: "El nombre del producto es obligatorio" });
    }

    if (!Number.isFinite(precioNumerico) || precioNumerico < 0) {
      return res.status(400).json({ error: "El precio debe ser un número válido mayor o igual a 0" });
    }

    if (!CATEGORIAS_VALIDAS.includes(categoriaLimpia)) {
      return res.status(400).json({ error: "Categoría inválida" });
    }

    const categoriaNombre = categoriaLimpia === "Destacados" ? "Destacados" : categoriaLimpia;
    const producto = await prisma.producto.create({
      data: {
        descripcion: descripcionLimpia || null,
        destacado: parseBoolean(destacado, categoriaLimpia === "Destacados"),
        disponible: parseBoolean(disponible, true),
        nombre: nombreLimpio,
        precio: precioNumerico,
        categorias: {
          connectOrCreate: {
            create: {
              descripcion: `Productos de ${categoriaNombre}`,
              nombre: categoriaNombre
            },
            where: { nombre: categoriaNombre }
          }
        }
      }
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
    const {
      categoria,
      descripcion,
      destacado,
      disponible,
      nombre,
      precio
    } = req.body as {
      categoria?: string;
      descripcion?: string;
      destacado?: boolean;
      disponible?: boolean;
      nombre?: string;
      precio?: number | string;
    };

    const data: Parameters<typeof prisma.producto.update>[0]["data"] = {};

    if (nombre !== undefined) {
      const nombreLimpio = nombre.trim();

      if (!nombreLimpio) {
        return res.status(400).json({ error: "El nombre del producto es obligatorio" });
      }

      data.nombre = nombreLimpio;
    }

    if (descripcion !== undefined) {
      data.descripcion = descripcion.trim() || null;
    }

    if (precio !== undefined) {
      const precioNumerico = Number(precio);

      if (!Number.isFinite(precioNumerico) || precioNumerico < 0) {
        return res.status(400).json({ error: "El precio debe ser un número válido mayor o igual a 0" });
      }

      data.precio = precioNumerico;
    }

    if (destacado !== undefined) {
      data.destacado = destacado;
    }

    if (disponible !== undefined) {
      data.disponible = disponible;
    }

    if (categoria !== undefined) {
      const categoriaLimpia = categoria.trim();

      if (!CATEGORIAS_VALIDAS.includes(categoriaLimpia)) {
        return res.status(400).json({ error: "Categoría inválida" });
      }

      const categoriaNombre = categoriaLimpia === "Destacados" ? "Destacados" : categoriaLimpia;
      data.categorias = {
        set: [],
        connectOrCreate: {
          create: {
            descripcion: `Productos de ${categoriaNombre}`,
            nombre: categoriaNombre
          },
          where: { nombre: categoriaNombre }
        }
      };
    }

    const producto = await prisma.producto.update({
      data,
      where: { id: Number(id) }
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

export const uploadProductoImagen = (req: Request, res: Response) => {
  uploadProductImageMiddleware(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: getUploadErrorMessage(uploadError) });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Debe seleccionar una imagen." });
    }

    try {
      const producto = await uploadProductImage(Number(req.params.id), req.file);
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
    const producto = await deleteProductImage(Number(req.params.id));
    res.json(producto);
  } catch (error) {
    if (error instanceof Error && error.message === "Producto no encontrado") {
      return res.status(404).json({ error: error.message });
    }

    console.error("Error al eliminar imagen de producto:", error);
    res.status(500).json({ error: "No se pudo eliminar la imagen." });
  }
};
