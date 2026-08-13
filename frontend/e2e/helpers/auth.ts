import { expect, type Page } from "@playwright/test";

export type DemoRole = "admin" | "cajero" | "cocina";

export async function loginAs(page: Page, role: DemoRole) {
  const password = process.env.E2E_DEMO_PASSWORD ?? "123456";
  await page.goto("/");
  await page.getByLabel("Usuario o correo").fill(role);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  const loginResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/login") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Ingresar al sistema" }).click();
  expect((await loginResponse).ok()).toBe(true);
  await expect(page).not.toHaveURL(/\/$/);
}
