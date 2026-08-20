import { beforeEach, describe, expect, it, vi } from "vitest";

const categoria = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn()
}));

vi.mock("../config/prisma", () => ({ default: { categoria } }));

import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from "./categorias.controller";

function response() {
  const json = vi.fn();
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ json, send });
  return { json, res: { json, status } as never, send, status };
}

describe("categorías", () => {
  beforeEach(() => vi.clearAllMocks());

  it("devuelve activa al listar categorías", async () => {
    categoria.findMany.mockResolvedValue([{ activa: false, id: 1, nombre: "Completos" }]);
    const { json, res } = response();

    await getCategorias({} as never, res);

    expect(json).toHaveBeenCalledWith([{ activa: false, id: 1, nombre: "Completos" }]);
  });

  it("crea categorías activas por defecto", async () => {
    categoria.create.mockResolvedValue({ activa: true, id: 7, nombre: "Bebidas frías" });
    const { json, res, status } = response();

    await createCategoria({ body: { nombre: "Bebidas frías" } } as never, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ activa: true, id: 7, nombre: "Bebidas frías" });
  });

  it.each([
    [false, "oculta"],
    [true, "visible"]
  ])("actualiza activa a %s", async (activa) => {
    categoria.findUnique.mockResolvedValue({ id: 7, nombre: "Bebidas frías" });
    categoria.update.mockResolvedValue({ activa, id: 7, nombre: "Bebidas frías" });
    const { json, res } = response();

    await updateCategoria({ body: { activa }, params: { id: "7" } } as never, res);

    expect(categoria.update).toHaveBeenCalledWith(expect.objectContaining({ data: { activa } }));
    expect(json).toHaveBeenCalledWith({ activa, id: 7, nombre: "Bebidas frías" });
  });

  it("rechaza activa inválida", async () => {
    const { json, res, status } = response();
    await updateCategoria({ body: { activa: "false" }, params: { id: "7" } } as never, res);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "El estado activa debe ser booleano" });
  });

  it("devuelve 404 al actualizar una categoría inexistente", async () => {
    categoria.findUnique.mockResolvedValue(null);
    const { json, res, status } = response();
    await updateCategoria({ body: { activa: false }, params: { id: "99" } } as never, res);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: "Categoría no encontrada" });
  });

  it("permite ocultar la vista derivada Destacados sin eliminar productos", async () => {
    categoria.findUnique.mockResolvedValue({ id: 3, nombre: "Destacados" });
    categoria.update.mockResolvedValue({ activa: false, id: 3, nombre: "Destacados" });
    const { json, res } = response();
    await updateCategoria({ body: { activa: false }, params: { id: "3" } } as never, res);
    expect(categoria.update).toHaveBeenCalledWith(expect.objectContaining({ data: { activa: false } }));
    expect(json).toHaveBeenCalledWith({ activa: false, id: 3, nombre: "Destacados" });
  });

  it("impide eliminar una categoría base", async () => {
    categoria.findUnique.mockResolvedValue({ id: 1, nombre: "Completos", _count: { productos: 0 } });
    const { json, res, status } = response();
    await deleteCategoria({ params: { id: "1" } } as never, res);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ error: "No se puede eliminar una categoría base del sistema" });
  });

  it("elimina una categoría personalizada vacía", async () => {
    categoria.findUnique.mockResolvedValue({ id: 7, nombre: "Bebidas frías", _count: { productos: 0 } });
    const { res, send, status } = response();
    await deleteCategoria({ params: { id: "7" } } as never, res);
    expect(categoria.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(status).toHaveBeenCalledWith(204);
    expect(send).toHaveBeenCalledOnce();
  });

  it("mantiene la protección de categorías con productos", async () => {
    categoria.findUnique.mockResolvedValue({ id: 7, nombre: "Bebidas frías", _count: { productos: 2 } });
    const { json, res, status } = response();
    await deleteCategoria({ params: { id: "7" } } as never, res);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ error: "No se puede eliminar una categoría con productos asociados" });
  });
});
