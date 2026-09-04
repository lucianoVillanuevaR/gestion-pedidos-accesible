import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import prisma from "../config/prisma";
import {
  BUSINESS_TIME_ZONE,
  EXCLUDED_SALES_STATUS,
  calculateAverageTicket,
  getDashboardPeriodRange,
  isDashboardPeriod
} from "../services/adminDashboardService";
import { withProductImageUrl } from "../services/productImageService";

type SummaryRow = { sales: string; orders: number; productsSold: number };
type TimelineRow = { bucket: string; sales: string; orders: number };
type ProductRow = {
  productId: number;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  sales: string;
};
type HourRow = { hour: number; orders: number };
type StatusRow = { status: string; orders: number };

const VALID_ORDER = Prisma.sql`p.estado <> ${EXCLUDED_SALES_STATUS}`;

export async function getAdminDashboard(req: Request, res: Response) {
  const period = req.query.period ?? "7d";
  if (!isDashboardPeriod(period)) {
    return res.status(400).json({ error: "Período inválido. Usa today, 7d o 30d." });
  }

  const range = getDashboardPeriodRange(period);
  const localCreatedAt = Prisma.sql`(p."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${BUSINESS_TIME_ZONE}`;
  const timelineBucket =
    period === "today"
      ? Prisma.sql`date_trunc('hour', ${localCreatedAt})`
      : Prisma.sql`date_trunc('day', ${localCreatedAt})`;

  try {
    const [summaryRows, timelineRows, topProductRows, hourRows, statusRows, criticalStock] = await Promise.all([
      prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(p.total), 0)::text AS sales,
          COUNT(*)::int AS orders,
          COALESCE((
            SELECT SUM(d.cantidad)
            FROM "DetallePedido" d
            INNER JOIN "Pedido" valid_order ON valid_order.id = d."pedidoId"
            WHERE valid_order.estado <> ${EXCLUDED_SALES_STATUS}
              AND valid_order."createdAt" >= ${range.start}
              AND valid_order."createdAt" < ${range.end}
          ), 0)::int AS "productsSold"
        FROM "Pedido" p
        WHERE ${VALID_ORDER}
          AND p."createdAt" >= ${range.start}
          AND p."createdAt" < ${range.end}
      `),
      prisma.$queryRaw<TimelineRow[]>(Prisma.sql`
        SELECT to_char(${timelineBucket}, 'YYYY-MM-DD HH24:MI') AS bucket,
          COALESCE(SUM(p.total), 0)::text AS sales, COUNT(*)::int AS orders
        FROM "Pedido" p
        WHERE ${VALID_ORDER}
          AND p."createdAt" >= ${range.start}
          AND p."createdAt" < ${range.end}
        GROUP BY 1
        ORDER BY 1
      `),
      prisma.$queryRaw<ProductRow[]>(Prisma.sql`
        SELECT
          product.id AS "productId",
          product.nombre AS "productName",
          product.imagen_url AS "imageUrl",
          SUM(detail.cantidad)::int AS quantity,
          COALESCE(SUM(detail.subtotal), 0)::text AS sales
        FROM "DetallePedido" detail
        INNER JOIN "Pedido" p ON p.id = detail."pedidoId"
        INNER JOIN "Producto" product ON product.id = detail."productoId"
        WHERE ${VALID_ORDER}
          AND p."createdAt" >= ${range.start}
          AND p."createdAt" < ${range.end}
        GROUP BY product.id, product.nombre, product.imagen_url
        ORDER BY quantity DESC, sales DESC
        LIMIT 10
      `),
      prisma.$queryRaw<HourRow[]>(Prisma.sql`
        SELECT EXTRACT(HOUR FROM ${localCreatedAt})::int AS hour, COUNT(*)::int AS orders
        FROM "Pedido" p
        WHERE ${VALID_ORDER}
          AND p."createdAt" >= ${range.start}
          AND p."createdAt" < ${range.end}
        GROUP BY 1
        ORDER BY 1
      `),
      prisma.$queryRaw<StatusRow[]>(Prisma.sql`
        SELECT p.estado AS status, COUNT(*)::int AS orders
        FROM "Pedido" p
        WHERE p."createdAt" >= ${range.todayStart}
          AND p."createdAt" < ${range.todayEnd}
        GROUP BY p.estado
      `),
      prisma.inventario.findMany({
        where: {
          stockActual: { lte: prisma.inventario.fields.stockMinimo },
          producto: { controlaStock: true, tipo: "producto" }
        },
        include: { producto: { select: { id: true, nombre: true } } },
        orderBy: [{ stockActual: "asc" }, { producto: { nombre: "asc" } }],
        take: 5
      })
    ]);

    const summary = summaryRows[0] ?? { sales: "0", orders: 0, productsSold: 0 };
    const sales = Number(summary.sales);
    const ordersToday = Object.fromEntries(statusRows.map((row) => [row.status, row.orders]));

    return res.json({
      period,
      range: { start: range.start.toISOString(), end: range.end.toISOString(), timeZone: BUSINESS_TIME_ZONE },
      summary: {
        sales,
        orders: summary.orders,
        averageTicket: calculateAverageTicket(sales, summary.orders),
        productsSold: summary.productsSold
      },
      salesTimeline: timelineRows.map((row) => ({
        date: row.bucket,
        sales: Number(row.sales),
        orders: row.orders
      })),
      topProducts: topProductRows.map((row) => ({
        productId: row.productId,
        productName: row.productName,
        imageUrl: withProductImageUrl({ imagenUrl: row.imageUrl }).imagenPublicUrl ?? null,
        quantity: row.quantity,
        sales: Number(row.sales)
      })),
      ordersByHour: hourRows,
      ordersToday: {
        pendiente: ordersToday.pendiente ?? 0,
        en_preparacion: ordersToday.en_preparacion ?? 0,
        listo: ordersToday.listo ?? 0,
        entregado: ordersToday.entregado ?? 0,
        cancelado: ordersToday.cancelado ?? 0
      },
      criticalStock: criticalStock.map((item) => ({
        productId: item.producto.id,
        productName: item.producto.nombre,
        currentStock: item.stockActual,
        minimumStock: item.stockMinimo
      }))
    });
  } catch (error) {
    console.error("Error al obtener dashboard administrativo:", error);
    return res.status(500).json({ error: "No se pudo cargar el dashboard administrativo" });
  }
}
