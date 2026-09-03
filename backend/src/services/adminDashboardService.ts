const DASHBOARD_PERIODS = ["today", "7d", "30d"] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const BUSINESS_TIME_ZONE = "America/Santiago";
export const EXCLUDED_SALES_STATUS = "cancelado";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getZonedDateParts(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);

  return { year: value("year"), month: value("month"), day: value("day") };
}

function getTimeZoneOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const representedAsUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second")
  );

  return representedAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function localMidnightToUtc(parts: DateParts) {
  const localAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  let result = new Date(localAsUtc - getTimeZoneOffset(new Date(localAsUtc)));
  result = new Date(localAsUtc - getTimeZoneOffset(result));
  return result;
}

function addCalendarDays(parts: DateParts, days: number): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function isDashboardPeriod(value: unknown): value is DashboardPeriod {
  return DASHBOARD_PERIODS.includes(value as DashboardPeriod);
}

export function getDashboardPeriodRange(period: DashboardPeriod, now = new Date()) {
  const today = getZonedDateParts(now);
  const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
  const startParts = addCalendarDays(today, -(days - 1));

  return {
    start: localMidnightToUtc(startParts),
    end: localMidnightToUtc(addCalendarDays(today, 1)),
    todayStart: localMidnightToUtc(today),
    todayEnd: localMidnightToUtc(addCalendarDays(today, 1)),
    bucket: period === "today" ? ("hour" as const) : ("day" as const),
    days
  };
}

export function calculateAverageTicket(sales: number, orders: number) {
  return orders === 0 ? 0 : Math.round(sales / orders);
}
