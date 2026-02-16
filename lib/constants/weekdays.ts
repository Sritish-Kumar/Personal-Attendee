import { getServerEnv } from "@/lib/config/env";

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const isWeekday = (value: string): value is Weekday => {
  return WEEKDAYS.includes(value as Weekday);
};

export const getWeekdayFromDate = (dateInput: string | Date): Weekday => {
  const date = typeof dateInput === "string" ? new Date(`${dateInput}T00:00:00Z`) : dateInput;
  const { APP_TIMEZONE } = getServerEnv();
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long"
  }).format(date);

  if (!isWeekday(weekday)) {
    throw new Error(`Invalid weekday resolved for date: ${dateInput}`);
  }

  return weekday;
};
