import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const READY_ORDER_VISIBLE_MS = 15_000;

declare global {
  interface Window {
    __readyToneStarts?: number;
  }
}

async function api<T>(page: Page, path: string, init: RequestInit = {}) {
  return page.evaluate(
    async ({ init, path }) => {
      const token = window.sessionStorage.getItem("riquisimo-auth-token");
      const response = await fetch(`/api${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...init.headers
        }
      });
      const body = await response.json();
      if (!response.ok && response.status !== 409) {
        throw new Error(body.error ?? `HTTP ${response.status}`);
      }
      return body as T;
    },
    { init, path }
  );
}

async function pollNow(page: Page) {
  const response = page.waitForResponse(
    (candidate) => candidate.url().endsWith("/api/pedidos") && candidate.request().method() === "GET"
  );
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await response;
}

async function navigateWithinApp(page: Page, path: string) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
  await expect(page).toHaveURL(new RegExp(`${path.replaceAll("/", "\\/")}$`));
}

async function openAuthenticatedAccessibilityPanel(page: Page) {
  const accessibilityTrigger = page.getByRole("button", { name: /accesibilidad|opciones de ayuda/i }).first();
  const isMobileLayout = await page.evaluate(() => window.innerWidth < 1024);
  if (isMobileLayout) {
    await page.getByRole("button", { name: "Abrir navegación" }).click();
    await accessibilityTrigger.focus();
    await expect(accessibilityTrigger).toBeFocused();
    await page.keyboard.press("Enter");
  } else {
    await accessibilityTrigger.click();
  }
  await expect(page.getByRole("dialog", { name: /opciones de accesibilidad/i })).toBeVisible();
}

async function createBasicOrder(page: Page, clienteNombre: string) {
  await api(page, "/turnos/abrir", { method: "POST" });
  const products = await api<
    Array<{
      id: number;
      disponible?: boolean;
      requiereSeleccionVariante?: boolean;
      tipo?: string;
    }>
  >(page, "/productos");
  const product = products.find(
    (candidate) =>
      candidate.disponible !== false && candidate.tipo === "producto" && !candidate.requiereSeleccionVariante
  );
  if (!product) throw new Error("No existe un producto básico disponible para la prueba");

  return api<{ id: number; numeroTurno: number }>(page, "/pedidos", {
    method: "POST",
    body: JSON.stringify({
      clienteNombre,
      detalles: [{ productoId: product.id, cantidad: 1 }],
      idempotencyKey: crypto.randomUUID(),
      metodoPago: "efectivo"
    })
  });
}

async function setOrderState(page: Page, id: number, estado: "en_preparacion" | "listo") {
  await api(page, `/pedidos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado })
  });
}

test("Caja recibe en el PDV la campanilla y el aviso cuando Cocina termina un pedido", async ({ browser }) => {
  test.setTimeout(45_000);
  const cashierContext = await browser.newContext();
  const kitchenContext = await browser.newContext();
  const countRealAudioTones = () => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const originalCreateOscillator = AudioContextClass.prototype.createOscillator;
    AudioContextClass.prototype.createOscillator = function (...args) {
      const oscillator = originalCreateOscillator.apply(this, args);
      const originalStart = oscillator.start.bind(oscillator);
      oscillator.start = (...startArgs) => {
        window.__readyToneStarts = (window.__readyToneStarts ?? 0) + 1;
        return originalStart(...startArgs);
      };
      return oscillator;
    };
  };
  await cashierContext.addInitScript(countRealAudioTones);
  await kitchenContext.addInitScript(countRealAudioTones);

  const cashier = await cashierContext.newPage();
  const kitchen = await kitchenContext.newPage();
  await loginAs(cashier, "cajero");
  await cashier.goto("/pdv");
  await openAuthenticatedAccessibilityPanel(cashier);
  await cashier.getByRole("switch", { name: "Sonidos de interacción: Desactivado" }).click();
  await expect(cashier.getByText(/prueba de sonido iniciada/i)).toBeVisible();
  await cashier.getByRole("button", { name: "Cerrar panel de accesibilidad" }).click();
  await cashier.evaluate(() => (window.__readyToneStarts = 0));

  await loginAs(kitchen, "cocina");
  await kitchen.goto("/cocina");
  await openAuthenticatedAccessibilityPanel(kitchen);
  await kitchen.getByRole("switch", { name: "Sonidos de interacción: Desactivado" }).click();
  await expect(kitchen.getByText(/prueba de sonido iniciada/i)).toBeVisible();
  await kitchen.getByRole("button", { name: "Cerrar panel de accesibilidad" }).click();
  await kitchen.evaluate(() => (window.__readyToneStarts = 0));

  const firstOrder = await createBasicOrder(cashier, "Prueba Caja");
  await pollNow(cashier);
  await pollNow(kitchen);
  await expect.poll(() => kitchen.evaluate(() => window.__readyToneStarts ?? 0)).toBe(2);
  await expect(kitchen.getByText(`Pedido #${firstOrder.numeroTurno}`, { exact: true })).toBeVisible();
  await setOrderState(kitchen, firstOrder.id, "en_preparacion");
  await setOrderState(kitchen, firstOrder.id, "listo");

  const readyAt = Date.now();
  await expect(cashier.getByText(`Pedido N.º ${firstOrder.numeroTurno} listo para entregar`)).toBeVisible({
    timeout: 4500
  });
  expect(Date.now() - readyAt).toBeLessThan(4500);
  await expect.poll(() => cashier.evaluate(() => window.__readyToneStarts ?? 0)).toBeGreaterThanOrEqual(3);
  await pollNow(cashier);
  expect(
    await cashier.getByText(`Pedido N.º ${firstOrder.numeroTurno} listo para entregar`, { exact: true }).count()
  ).toBe(1);
  const readyToneStarts = await cashier.evaluate(() => window.__readyToneStarts ?? 0);
  expect(readyToneStarts).toBeGreaterThanOrEqual(3);
  expect(readyToneStarts % 3).toBe(0);

  await navigateWithinApp(cashier, "/pedidos");
  await expect(cashier.getByText(`Pedido N.º ${firstOrder.numeroTurno} listo para entregar`)).toBeVisible();
  const viewport = cashier.viewportSize();
  await cashier.mouse.move(1, Math.max(1, (viewport?.height ?? 800) - 1));
  await expect(cashier.getByText(`Pedido N.º ${firstOrder.numeroTurno} listo para entregar`)).toHaveCount(0, {
    timeout: 16500
  });
  await expect(cashier.getByText(`Pedido #${firstOrder.numeroTurno}`, { exact: true }).first()).toBeVisible();
  await expect(cashier.getByText("Listo", { exact: true }).first()).toBeVisible();

  await cashier.evaluate(() => {
    window.localStorage.setItem("riquisimo.modoAccesible", "true");
    window.localStorage.setItem("riquisimo.contraste", "true");
    window.localStorage.setItem("riquisimo.sonidos", "false");
  });
  await cashier.goto("/pdv/facil");
  await expect(cashier.locator("html")).toHaveAttribute("data-contrast", "true");

  const secondOrder = await createBasicOrder(cashier, "Prueba Fácil");
  await pollNow(cashier);
  await setOrderState(kitchen, secondOrder.id, "en_preparacion");
  await setOrderState(kitchen, secondOrder.id, "listo");
  await pollNow(cashier);

  await expect(cashier.getByText(`Pedido N.º ${secondOrder.numeroTurno} listo para entregar`)).toBeVisible();
  const easyModeReadyToneStarts = await cashier.evaluate(() => window.__readyToneStarts ?? 0);
  expect(easyModeReadyToneStarts).toBeGreaterThanOrEqual(3);
  expect(easyModeReadyToneStarts % 3).toBe(0);
  await navigateWithinApp(cashier, "/pedidos/facil");
  await expect(cashier.getByText(`Pedido N.º ${secondOrder.numeroTurno} listo para entregar`)).toBeVisible();
  await expect(cashier.getByText(`Pedido #${secondOrder.numeroTurno}`, { exact: true }).first()).toBeVisible();

  await cashierContext.close();
  await kitchenContext.close();
});

test("Caja y Cocina completan el flujo mediante los controles reales", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "El flujo UI completo se ejecuta una vez sobre la base compartida");
  test.setTimeout(70_000);

  const cashierContext = await browser.newContext();
  const kitchenContext = await browser.newContext();
  const countRealAudioTones = () => {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const originalCreateOscillator = AudioContextClass.prototype.createOscillator;
    AudioContextClass.prototype.createOscillator = function (...args) {
      const oscillator = originalCreateOscillator.apply(this, args);
      const originalStart = oscillator.start.bind(oscillator);
      oscillator.start = (...startArgs) => {
        window.__readyToneStarts = (window.__readyToneStarts ?? 0) + 1;
        return originalStart(...startArgs);
      };
      return oscillator;
    };
  };
  await cashierContext.addInitScript(countRealAudioTones);

  const cashier = await cashierContext.newPage();
  const kitchen = await kitchenContext.newPage();

  await loginAs(cashier, "cajero");
  await cashier.goto("/pdv");
  await openAuthenticatedAccessibilityPanel(cashier);
  await cashier.getByRole("switch", { name: "Sonidos de interacción: Desactivado" }).click();
  await cashier.getByRole("button", { name: "Fuerte" }).click();
  await cashier.getByRole("button", { name: "Probar sonido" }).click();
  await expect(cashier.getByText(/prueba de sonido iniciada/i)).toBeVisible();
  await cashier.getByRole("button", { name: "Cerrar panel de accesibilidad" }).click();
  await cashier.evaluate(() => (window.__readyToneStarts = 0));

  const openTurnButton = cashier.getByRole("button", { name: "Abrir turno", exact: true });
  if (await openTurnButton.isVisible()) {
    await openTurnButton.click();
    await cashier.getByRole("dialog").getByRole("button", { name: "Abrir turno", exact: true }).click();
    await expect(cashier.getByRole("button", { name: "Cerrar turno", exact: true })).toBeVisible();
  }

  await cashier.getByRole("button", { name: "Completos", exact: true }).first().click();
  const productName = "Completo Italiano";
  await cashier.getByRole("textbox", { name: "Barra de búsqueda de productos" }).fill(productName);
  await cashier
    .getByRole("button", { name: `Agregar ${productName}`, exact: true })
    .last()
    .click();
  const productDialog = cashier.getByRole("dialog", { name: productName });
  if (await productDialog.isVisible()) {
    await productDialog.getByRole("button", { name: /^Agregar ·/ }).click();
  }
  await cashier.getByRole("textbox", { name: "Nombre del cliente" }).fill("Flujo Interfaz");
  await cashier.getByRole("button", { name: "Efectivo", exact: true }).click();
  await cashier.getByRole("button", { name: "Aceptar", exact: true }).click();

  const createResponsePromise = cashier.waitForResponse(
    (response) => response.url().endsWith("/api/pedidos") && response.request().method() === "POST"
  );
  await cashier.getByRole("dialog").getByRole("button", { name: "Aceptar pedido", exact: true }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.ok()).toBe(true);
  const createdOrder = (await createResponse.json()) as { id: number; numeroTurno: number };
  await pollNow(cashier);
  await cashier.evaluate(() => (window.__readyToneStarts = 0));

  await loginAs(kitchen, "cocina");
  await kitchen.goto("/cocina");
  await kitchen.getByRole("button", { name: "Actualizar preparación" }).click();
  const kitchenTicket = kitchen.locator("article").filter({
    has: kitchen.getByText(`Pedido #${createdOrder.numeroTurno}`, { exact: true })
  });
  await expect(kitchenTicket).toBeVisible();

  await kitchenTicket.getByRole("button", { name: "Iniciar preparación", exact: true }).click();
  await expect(kitchenTicket.getByRole("button", { name: "Marcar como listo", exact: true })).toBeEnabled();
  await kitchenTicket.getByRole("button", { name: "Marcar como listo", exact: true }).click();

  const readyMessage = `Pedido N.º ${createdOrder.numeroTurno} listo para entregar`;
  const readyToast = cashier.getByText(readyMessage, { exact: true });
  await expect(readyToast).toBeVisible({ timeout: 4500 });
  await expect.poll(() => cashier.evaluate(() => window.__readyToneStarts ?? 0)).toBe(3);

  const toastCard = cashier.getByRole("status").filter({ hasText: readyMessage });
  await toastCard.hover();
  await cashier.waitForTimeout(READY_ORDER_VISIBLE_MS + 500);
  await expect(readyToast).toBeVisible();

  const closeButton = cashier.getByRole("button", {
    name: `Cerrar aviso del pedido ${createdOrder.numeroTurno}`
  });
  await closeButton.focus();
  const viewport = cashier.viewportSize();
  await cashier.mouse.move(1, Math.max(1, (viewport?.height ?? 800) - 1));
  await cashier.waitForTimeout(1000);
  await expect(readyToast).toBeVisible();

  const tonesBeforeDismiss = await cashier.evaluate(() => window.__readyToneStarts ?? 0);
  await closeButton.click();
  await expect(readyToast).toHaveCount(0);
  await pollNow(cashier);
  expect(await cashier.evaluate(() => window.__readyToneStarts ?? 0)).toBe(tonesBeforeDismiss);

  await navigateWithinApp(cashier, "/pedidos");
  const orderRow = cashier.getByText(`Pedido #${createdOrder.numeroTurno}`, { exact: true }).first();
  await expect(orderRow).toBeVisible();
  await expect(cashier.getByText("Listo", { exact: true }).first()).toBeVisible();

  await openAuthenticatedAccessibilityPanel(cashier);
  await cashier.getByRole("switch", { name: "Contraste alto: Desactivado" }).click();
  await expect(cashier.locator("html")).toHaveAttribute("data-contrast", "true");
  await cashier.getByRole("button", { name: "Cerrar panel de accesibilidad" }).click();
  await navigateWithinApp(cashier, "/pedidos/facil");
  await expect(cashier.getByText(`Pedido #${createdOrder.numeroTurno}`, { exact: true }).first()).toBeVisible();

  await cashierContext.close();
  await kitchenContext.close();
});
