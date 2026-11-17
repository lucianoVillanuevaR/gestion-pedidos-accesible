import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("fotografías originales visibles en caja y administración", async ({ page }) => {
  await loginAs(page, "admin");
  for (const route of ["/pdv", "/productos"]) {
    await page.goto(route);
    const photos = page.locator('img[src*=".webp"]');
    await expect(photos.first()).toBeAttached();
    for (const photo of await photos.all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          photo.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && !img.src.startsWith("data:")
          )
        )
        .toBe(true);
    }
  }
});

test("registra un pedido con fotografía original mediante modo fácil", async ({ page }) => {
  await loginAs(page, "cajero");
  // Preparación por API, el pedido se registra exclusivamente con los controles UI.
  await page.evaluate(async () => {
    const response = await fetch("/api/turnos/abrir", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("riquisimo-auth-token")}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok && response.status !== 409) throw new Error("No se pudo abrir turno de prueba");
  });
  await page.goto("/pdv/facil");
  await page.getByRole("button", { name: "Completos", exact: true }).click();
  const photo = page.getByRole("img", { name: "Imagen de Completo Italiano", exact: true });
  await photo.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && !img.src.startsWith("data:"))
    )
    .toBe(true);
  await page.getByRole("button", { name: "Aumentar Completo Italiano", exact: true }).click();
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible()) {
    // Completo sin variante: pasos de aderezos y cantidad del configurador.
    for (
      let step = 0;
      step < 4 && (await dialog.getByRole("button", { name: "Continuar", exact: true }).isVisible());
      step++
    ) {
      await dialog.getByRole("button", { name: "Continuar", exact: true }).click();
    }
    await dialog.getByRole("button", { name: /^Agregar ·/ }).click();
  }
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Nombre del comprador").fill("SIMULADO Modo Facil");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: /^Efectivo/ }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Registrar pedido", exact: true }).click();
  const response = page.waitForResponse((r) => r.url().endsWith("/api/pedidos") && r.request().method() === "POST");
  await page.getByRole("dialog").getByRole("button", { name: "Registrar pedido", exact: true }).click();
  const saved = await response;
  expect(saved.ok()).toBe(true);
  const order = await saved.json();
  expect(Number(order.total)).toBe(3900);
  expect(order.clienteNombre).toBe("SIMULADO Modo Facil");
});
