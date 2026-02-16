import { getWeekdayFromDate } from "@/lib/constants/weekdays";
import { compareDateStrings, eachDateInRange, getTodayDateString } from "@/lib/date/date";
import { listAttendanceInRange } from "@/lib/firestore/attendance";
import { listHolidaysInRange } from "@/lib/firestore/holidays";
import { listTimetableEntries } from "@/lib/firestore/timetable";

export type CalendarSubjectStatus = "present" | "absent" | "future" | "holiday";

export type CalendarSubjectItem = {
  subjectId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  status: CalendarSubjectStatus;
};

export type CalendarDay = {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  isFuture: boolean;
  subjects: CalendarSubjectItem[];
};

export type CalendarMonthView = {
  month: string;
  monthLabel: string;
  prevMonth: string;
  nextMonth: string;
  days: CalendarDay[];
};

const MONTH_PARAM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const weekdayIndexByName: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

const parseMonthParam = (monthParam?: string): { year: number; monthIndex: number; month: string } => {
  if (monthParam && MONTH_PARAM_REGEX.test(monthParam)) {
    const [yearRaw, monthRaw] = monthParam.split("-");
    return {
      year: Number(yearRaw),
      monthIndex: Number(monthRaw) - 1,
      month: `${yearRaw}-${monthRaw}`
    };
  }

  const today = getTodayDateString();
  return {
    year: Number(today.slice(0, 4)),
    monthIndex: Number(today.slice(5, 7)) - 1,
    month: today.slice(0, 7)
  };
};

const toDateString = (year: number, monthIndex: number, day: number) => {
  const month = String(monthIndex + 1).padStart(2, "0");
  const dayPart = String(day).padStart(2, "0");
  return `${year}-${month}-${dayPart}`;
};

const shiftMonth = (year: number, monthIndex: number, offset: number) => {
  const date = new Date(Date.UTC(year, monthIndex + offset, 1));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
};

const getMonthLabel = (year: number, monthIndex: number) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
};

export const getCalendarMonthView = async (monthParam?: string): Promise<CalendarMonthView> => {
  const { year, monthIndex, month } = parseMonthParam(monthParam);

  const monthStart = toDateString(year, monthIndex, 1);
  const firstWeekdayName = getWeekdayFromDate(monthStart);
  const leadingDays = weekdayIndexByName[firstWeekdayName];

  const gridStartDate = new Date(Date.UTC(year, monthIndex, 1 - leadingDays));
  const gridStart = toDateString(
    gridStartDate.getUTCFullYear(),
    gridStartDate.getUTCMonth(),
    gridStartDate.getUTCDate()
  );

  const gridEndDate = new Date(Date.UTC(gridStartDate.getUTCFullYear(), gridStartDate.getUTCMonth(), gridStartDate.getUTCDate() + 41));
  const gridEnd = toDateString(
    gridEndDate.getUTCFullYear(),
    gridEndDate.getUTCMonth(),
    gridEndDate.getUTCDate()
  );

  const today = getTodayDateString();

  const [timetableEntries, attendanceEntries, holidays] = await Promise.all([
    listTimetableEntries(),
    listAttendanceInRange(gridStart, gridEnd),
    listHolidaysInRange(gridStart, gridEnd)
  ]);

  const holidaySet = new Set(holidays.map((item) => item.date));

  const attendanceMap = attendanceEntries.reduce<Record<string, "present" | "absent">>((acc, item) => {
    acc[`${item.date}__${item.subjectId}`] = item.status;
    return acc;
  }, {});

  const scheduleByWeekday = timetableEntries.reduce<
    Record<string, { subjectId: string; subjectName: string; startTime: string; endTime: string }[]>
  >(
    (acc, item) => {
      for (const session of item.sessions) {
        if (!acc[session.day]) {
          acc[session.day] = [];
        }
        acc[session.day].push({
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          startTime: session.startTime,
          endTime: session.endTime
        });
      }

      return acc;
    },
    {}
  );

  for (const weekday of Object.keys(scheduleByWeekday)) {
    scheduleByWeekday[weekday].sort((a, b) => {
      if (a.startTime === b.startTime) {
        return a.subjectName.localeCompare(b.subjectName);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }

  const days = eachDateInRange(gridStart, gridEnd).map<CalendarDay>((date) => {
    const weekdayName = getWeekdayFromDate(date);
    const scheduled = scheduleByWeekday[weekdayName] ?? [];
    const isHoliday = holidaySet.has(date);
    const isFuture = compareDateStrings(date, today) > 0;

    const subjects = scheduled.map<CalendarSubjectItem>((subject) => {
      if (isHoliday) {
        return {
          ...subject,
          status: "holiday"
        };
      }

      if (isFuture) {
        return {
          ...subject,
          status: "future"
        };
      }

      const markedStatus = attendanceMap[`${date}__${subject.subjectId}`];

      return {
        ...subject,
        status: markedStatus === "present" ? "present" : "absent"
      };
    });

    return {
      date,
      dayNumber: Number(date.slice(8, 10)),
      inMonth: date.startsWith(month),
      isToday: date === today,
      isHoliday,
      isFuture,
      subjects
    };
  });

  return {
    month,
    monthLabel: getMonthLabel(year, monthIndex),
    prevMonth: shiftMonth(year, monthIndex, -1),
    nextMonth: shiftMonth(year, monthIndex, 1),
    days
  };
};
