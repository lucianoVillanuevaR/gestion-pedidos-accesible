import type { Categoria } from "../types";
import { apiRequest } from "./api";

export async function getCategorias(): Promise<Categoria[]> {
  return apiRequest<Categoria[]>("/categorias", {
    fallbackMessage: "Error cargando categorías"
  });
}

export async function createCategoria(nombre: string): Promise<Categoria> {
  return apiRequest<Categoria>("/categorias", {
    body: JSON.stringify({ nombre }),
    fallbackMessage: "Error creando categoría",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
}

export async function updateCategoriaActiva(id: number, activa: boolean): Promise<Categoria> {
  return apiRequest<Categoria>(`/categorias/${id}`, {
    body: JSON.stringify({ activa }),
    fallbackMessage: activa ? "Error mostrando categoría" : "Error ocultando categoría",
    headers: {
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });
}

export async function deleteCategoria(id: number): Promise<void> {
  await apiRequest<void>(`/categorias/${id}`, {
    fallbackMessage: "Error eliminando categoría",
    method: "DELETE"
  });
}
