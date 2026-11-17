/// <reference types="node" />
import { Prisma, PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildResumenTurno,
  turnoCloseInclude,
} from "../src/services/turnoSummaryService";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

// El .env raíz usa el hostname interno de Compose. Al ejecutar npm directamente
// desde el host, PostgreSQL está publicado por docker-compose.yml en el puerto 5433.
if (!existsSync("/.dockerenv") && process.env.DATABASE_URL) {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  if (databaseUrl.hostname === "postgres") {
    databaseUrl.hostname = "localhost";
    databaseUrl.port = process.env.POSTGRES_HOST_PORT?.trim() || "5433";
    process.env.DATABASE_URL = databaseUrl.toString();
  }
}

const prisma = new PrismaClient();

const BUSINESS_TIME_ZONE = "America/Santiago";
const EXPECTED_DATABASE = "sistema_pedidos";
const ORDER_COUNTS = [12, 14, 13, 15, 12, 14, 13, 14, 13];
const DAY_OFFSETS = [-28, -24, -20, -16, -12, -8, -5, -2, 0];
const PAYMENT_METHODS = [
  "efectivo",
  "tarjeta",
  "tarjeta",
  "transferencia",
  "efectivo",
  "tarjeta",
];
const CUSTOMER_NAMES = [
  "Camila",
  "Matías",
  "Fernanda",
  "Sebastián",
  "Valentina",
  "Diego",
  "Javiera",
  "Nicolás",
  "Daniela",
  "Tomás",
  "Francisca",
  "Benjamín",
  "Constanza",
  "Vicente",
  "Catalina",
  "Felipe",
  "Antonia",
  "Martín",
  "Paula",
  "Cristóbal",
  "Josefa",
  "Ignacio",
  "Carolina",
  "Andrés",
];
const ORDER_NOTES = [
  "Sin mayonesa, por favor",
  "Agregar servilletas",
  "Salsa aparte",
  "Sin tomate",
  "Bien tostado",
  "Retira en caja",
];
const CURRENT_SHIFT_STATUSES = [
  "entregado",
  "entregado",
  "entregado",
  "entregado",
  "entregado",
  "cancelado",
  "listo",
  "listo",
  "en_preparacion",
  "en_preparacion",
  "pendiente",
  "pendiente",
  "pendiente",
] as const;

const INVENTORY_TARGETS: Record<string, number> = {
  "ARMA TU SANDWICH": 36,
  "BARROS LUCO SANDWICH": 8,
  "CHACARERO SANDWICH": 3,
  "Completo Alemán": 42,
  "Completo Dinámico": 27,
  "Completo Hass Italiano": 34,
  "Completo Italiano": 48,
  "SANDWICH LUCO PATRÓN": 24,
};

type DateParts = { year: number; month: number; day: number };
type SeedUser = { id: number; role: string; username: string };
type SeedProduct = Prisma.ProductoGetPayload<{
  include: { variantes: true };
}>;
type OrderStatus =
  | "pendiente"
  | "en_preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

function zonedDateParts(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function addDays(parts: DateParts, days: number): DateParts {
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days),
  );
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function timeZoneOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return (
    Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute"),
      value("second"),
    ) -
    Math.floor(date.getTime() / 1000) * 1000
  );
}

function localDateTimeToUtc(parts: DateParts, hour: number, minute: number) {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hour,
    minute,
  );
  let result = new Date(localAsUtc - timeZoneOffset(new Date(localAsUtc)));
  result = new Date(localAsUtc - timeZoneOffset(result));
  return result;
}

function historicalOrderTime(dayIndex: number, orderIndex: number) {
  const serviceHours = [12, 13, 14, 18, 19, 20, 21, 22];
  const hour =
    serviceHours[(dayIndex * 3 + orderIndex * 5) % serviceHours.length];
  const minuteLimit = hour === 22 ? 35 : 60;
  const minute = (dayIndex * 13 + orderIndex * 17) % minuteLimit;
  return { hour, minute };
}

function currentOrderTimes(today: DateParts, now: Date, count: number) {
  const dayStart = localDateTimeToUtc(today, 0, 0).getTime();
  const earliest = dayStart + 60_000;
  const available = Math.max(now.getTime() - earliest, count * 1_000);
  const interval = Math.max(
    1_000,
    Math.min(4 * 60_000, Math.floor(available / (count + 2))),
  );
  const first = Math.max(earliest, now.getTime() - interval * count);
  return Array.from(
    { length: count },
    (_, index) => new Date(first + interval * index),
  );
}

function historicalStatus(dayIndex: number, orderIndex: number): OrderStatus {
  return (dayIndex * 17 + orderIndex * 7) % 9 === 0 ? "cancelado" : "entregado";
}

function transitionPath(
  finalStatus: OrderStatus,
  sequence: number,
): OrderStatus[] {
  if (finalStatus === "pendiente") return [];
  if (finalStatus === "en_preparacion") return ["en_preparacion"];
  if (finalStatus === "listo") return ["en_preparacion", "listo"];
  if (finalStatus === "entregado")
    return ["en_preparacion", "listo", "entregado"];
  return sequence % 2 === 0 ? ["cancelado"] : ["en_preparacion", "cancelado"];
}

function buildHistory(
  finalStatus: OrderStatus,
  createdAt: Date,
  sequence: number,
  users: { cajero: SeedUser; cocina: SeedUser },
  latestAllowed: Date,
) {
  const transitions = transitionPath(finalStatus, sequence);
  const availableMilliseconds = Math.max(
    latestAllowed.getTime() - createdAt.getTime(),
    transitions.length + 1,
  );
  const step = Math.max(
    1,
    Math.floor(availableMilliseconds / (transitions.length + 1)),
  );
  const history: Prisma.PedidoHistorialCreateWithoutPedidoInput[] = [
    {
      accion: "pedido_creado",
      cambios: { estado: "pendiente" },
      createdAt,
      usuario: { connect: { id: users.cajero.id } },
    },
  ];
  let previous: OrderStatus = "pendiente";

  transitions.forEach((next, index) => {
    const user =
      next === "en_preparacion" || next === "listo"
        ? users.cocina
        : users.cajero;
    history.push({
      accion: "estado_modificado",
      cambios: { anterior: previous, nuevo: next },
      createdAt: new Date(createdAt.getTime() + step * (index + 1)),
      usuario: { connect: { id: user.id } },
    });
    previous = next;
  });

  return {
    history,
    updatedAt: history.at(-1)?.createdAt ?? createdAt,
  };
}

function buildDetails(
  products: SeedProduct[],
  sequence: number,
  dayIndex: number,
) {
  const detailCount = 1 + ((sequence + dayIndex) % 3);
  return Array.from({ length: detailCount }, (_, detailIndex) => {
    const product =
      products[(sequence * 7 + detailIndex * 5 + dayIndex) % products.length];
    const cantidad =
      (sequence + detailIndex * 11) % 19 === 0
        ? 3
        : (sequence + detailIndex * 3) % 6 === 0
          ? 2
          : 1;
    const variant = product.variantes.length
      ? product.variantes[
          (sequence + detailIndex + dayIndex) % product.variantes.length
        ]
      : null;
    const subtotal = product.precio.mul(cantidad);
    return {
      productoId: product.id,
      varianteId: variant?.id ?? null,
      cantidad,
      precioUnitario: product.precio,
      subtotal,
    };
  });
}

async function assertLocalDevelopmentDatabase() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Preparación abortada: este procedimiento no se ejecuta con NODE_ENV=production.",
    );
  }
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL no está configurada.");
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const databaseName = databaseUrl.pathname.replace(/^\//, "");
  const localHosts = new Set(["postgres", "localhost", "127.0.0.1"]);
  if (
    databaseName !== EXPECTED_DATABASE ||
    !localHosts.has(databaseUrl.hostname)
  ) {
    throw new Error(
      `Preparación abortada: se esperaba ${EXPECTED_DATABASE} en Docker local y se detectó ${databaseName}@${databaseUrl.hostname}.`,
    );
  }
}

async function cleanOperationalData(tx: Prisma.TransactionClient) {
  const before = {
    pedidos: await tx.pedido.count(),
    detalles: await tx.detallePedido.count(),
    historiales: await tx.pedidoHistorial.count(),
    turnos: await tx.turno.count(),
  };
  await tx.pedido.deleteMany();
  await tx.turno.deleteMany();
  return before;
}

async function requireEmptyOperationalData(tx: Prisma.TransactionClient) {
  const [orders, shifts] = await Promise.all([
    tx.pedido.count(),
    tx.turno.count(),
  ]);
  if (orders !== 0 || shifts !== 0) {
    throw new Error(
      `Existen ${orders} pedidos y ${shifts} turnos. Ejecuta primero la limpieza local explícita y respaldada.`,
    );
  }
}

async function getRequiredUsers(tx: Prisma.TransactionClient) {
  const users = await tx.usuario.findMany({
    where: { activo: true, username: { in: ["admin", "cajero", "cocina"] } },
    select: { id: true, role: true, username: true },
  });
  const byUsername = new Map(users.map((user) => [user.username, user]));
  const admin = byUsername.get("admin");
  const cajero = byUsername.get("cajero");
  const cocina = byUsername.get("cocina");
  if (
    !admin ||
    admin.role !== "admin" ||
    !cajero ||
    cajero.role !== "cajero" ||
    !cocina ||
    cocina.role !== "cocina"
  ) {
    throw new Error(
      "No están disponibles los usuarios activos Administrador, Cajero y Cocina con sus roles originales.",
    );
  }
  return { admin, cajero, cocina };
}

async function prepareInventory(tx: Prisma.TransactionClient) {
  const inventory = await tx.inventario.findMany({
    include: { producto: { select: { nombre: true } } },
    orderBy: { productoId: "asc" },
  });
  for (const item of inventory) {
    const target = INVENTORY_TARGETS[item.producto.nombre];
    if (target === undefined)
      throw new Error(
        `No existe nivel de presentación para ${item.producto.nombre}.`,
      );
    await tx.inventario.update({
      where: { id: item.id },
      data: { stockActual: target, stockMinimo: 10 },
    });
  }
  return inventory
    .filter((item) => (INVENTORY_TARGETS[item.producto.nombre] ?? 0) <= 10)
    .map((item) => item.producto.nombre);
}

async function createPresentationData(tx: Prisma.TransactionClient) {
  await requireEmptyOperationalData(tx);
  const users = await getRequiredUsers(tx);
  const products = await tx.producto.findMany({
    where: { disponible: true },
    include: {
      variantes: { where: { disponible: true }, orderBy: { orden: "asc" } },
    },
    orderBy: { id: "asc" },
  });
  if (products.length !== 12)
    throw new Error(
      `Se esperaban 12 productos originales y se encontraron ${products.length}.`,
    );
  if (products.some((product) => !product.imagenUrl)) {
    throw new Error(
      "Todos los productos deben tener una fotografía verificada antes de preparar pedidos.",
    );
  }

  const now = new Date();
  const today = zonedDateParts(now);
  const currentTimes = currentOrderTimes(today, now, ORDER_COUNTS.at(-1) ?? 0);
  let sequence = 0;
  let delivered = 0;
  let cancelled = 0;
  let totalDelivered = new Prisma.Decimal(0);

  for (let dayIndex = 0; dayIndex < DAY_OFFSETS.length; dayIndex += 1) {
    const date = addDays(today, DAY_OFFSETS[dayIndex]);
    const isCurrentShift = dayIndex === DAY_OFFSETS.length - 1;
    const orderCount = ORDER_COUNTS[dayIndex];
    const shiftStart = isCurrentShift
      ? new Date(
          Math.max(
            localDateTimeToUtc(today, 0, 0).getTime(),
            currentTimes[0].getTime() - 60_000,
          ),
        )
      : localDateTimeToUtc(date, 11, 30);
    const shiftClose = isCurrentShift ? null : localDateTimeToUtc(date, 23, 15);
    const responsible = dayIndex % 3 === 0 ? users.admin : users.cajero;
    const shift = await tx.turno.create({
      data: {
        usuarioId: responsible.id,
        estado: "abierto",
        fechaInicio: shiftStart,
      },
    });

    for (let orderIndex = 0; orderIndex < orderCount; orderIndex += 1) {
      const historicalTime = historicalOrderTime(dayIndex, orderIndex);
      const createdAt = isCurrentShift
        ? currentTimes[orderIndex]
        : localDateTimeToUtc(date, historicalTime.hour, historicalTime.minute);
      const status: OrderStatus = isCurrentShift
        ? CURRENT_SHIFT_STATUSES[orderIndex]
        : historicalStatus(dayIndex, orderIndex);
      const details = buildDetails(products, sequence, dayIndex);
      const total = details.reduce(
        (sum, detail) => sum.add(detail.subtotal),
        new Prisma.Decimal(0),
      );
      const latestAllowed = isCurrentShift
        ? now
        : new Date(
            Math.min(
              shiftClose!.getTime() - 60_000,
              createdAt.getTime() + 30 * 60_000,
            ),
          );
      const { history, updatedAt } = buildHistory(
        status,
        createdAt,
        sequence,
        users,
        latestAllowed,
      );
      const customerName =
        sequence % 11 === 0
          ? null
          : CUSTOMER_NAMES[(sequence * 5 + dayIndex) % CUSTOMER_NAMES.length];
      const observation =
        sequence % 8 === 0
          ? ORDER_NOTES[(sequence + dayIndex) % ORDER_NOTES.length]
          : null;

      await tx.pedido.create({
        data: {
          idempotencyKey: `a11ce000-0000-4000-8000-${String(sequence + 1).padStart(12, "0")}`,
          total,
          estado: status,
          metodoPago:
            PAYMENT_METHODS[(sequence * 5 + dayIndex) % PAYMENT_METHODS.length],
          clienteNombre: customerName,
          observacion: observation,
          createdAt,
          updatedAt,
          turnoId: shift.id,
          detalles: { create: details },
          historial: { create: history },
        },
      });

      if (status === "entregado") {
        delivered += 1;
        totalDelivered = totalDelivered.add(total);
      }
      if (status === "cancelado") cancelled += 1;
      sequence += 1;
    }

    if (shiftClose) {
      const shiftForSummary = await tx.turno.findUniqueOrThrow({
        where: { id: shift.id },
        include: turnoCloseInclude,
      });
      await tx.turno.update({
        where: { id: shift.id },
        data: {
          estado: "cerrado",
          fechaCierre: shiftClose,
          resumen: buildResumenTurno(shiftForSummary, shiftClose),
        },
      });
    }
  }

  const criticalProducts = await prepareInventory(tx);
  return {
    orders: sequence,
    delivered,
    cancelled,
    totalDelivered: totalDelivered.toNumber(),
    closedShifts: DAY_OFFSETS.length - 1,
    openShifts: 1,
    criticalProducts,
  };
}

async function main() {
  await assertLocalDevelopmentDatabase();
  const cleanOnly = process.argv.includes("--clean");

  if (cleanOnly) {
    if (!process.argv.includes("--confirm-local-clean")) {
      throw new Error("Limpieza abortada: falta --confirm-local-clean.");
    }
    const removed = await prisma.$transaction(
      (tx) => cleanOperationalData(tx),
      { timeout: 30_000 },
    );
    console.log(
      `Limpieza local terminada: ${removed.pedidos} pedidos, ${removed.detalles} detalles, ${removed.historiales} historiales y ${removed.turnos} turnos eliminados.`,
    );
    return;
  }

  const result = await prisma.$transaction((tx) => createPresentationData(tx), {
    timeout: 90_000,
  });
  console.log("Preparación de datos ficticios terminada.");
  console.log(
    `${result.orders} pedidos: ${result.delivered} entregados, ${result.cancelled} cancelados; ${result.closedShifts} turnos cerrados y ${result.openShifts} abierto.`,
  );
  console.log(
    `Venta entregada: $${result.totalDelivered.toLocaleString("es-CL")}.`,
  );
  console.log(
    `Stock crítico controlado: ${result.criticalProducts.join(", ")}.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
