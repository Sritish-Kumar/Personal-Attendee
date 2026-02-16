import { getServerEnv } from "@/lib/config/env";

const toDateParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to derive date parts from timezone formatter");
  }

  return { year, month, day };
};

export const getTodayDateString = () => {
  const { APP_TIMEZONE } = getServerEnv();
  const { year, month, day } = toDateParts(new Date(), APP_TIMEZONE);
  return `${year}-${month}-${day}`;
};

const toUtcDate = (dateString: string) => new Date(`${dateString}T00:00:00Z`);

const formatUtcDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const compareDateStrings = (a: string, b: string) => a.localeCompare(b);

export const minDateString = (a: string, b: string) => (compareDateStrings(a, b) <= 0 ? a : b);

export const eachDateInRange = (startDate: string, endDate: string) => {
  if (compareDateStrings(startDate, endDate) > 0) {
    return [] as string[];
  }

  const dates: string[] = [];
  let cursor = toUtcDate(startDate);
  const end = toUtcDate(endDate);

  while (cursor <= end) {
    dates.push(formatUtcDate(cursor));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1));
  }

  return dates;
};
