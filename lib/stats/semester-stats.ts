import { getWeekdayFromDate } from "@/lib/constants/weekdays";
import { compareDateStrings, eachDateInRange, getTodayDateString, minDateString } from "@/lib/date/date";
import { listAttendanceInRange } from "@/lib/firestore/attendance";
import { listHolidaysInRange } from "@/lib/firestore/holidays";
import { getSemesterConfig } from "@/lib/firestore/semester-config";
import { listTimetableEntries } from "@/lib/firestore/timetable";

export type SubjectSemesterStats = {
  subjectId: string;
  subjectName: string;
  conductedClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  requiredClassesToTarget: number;
};

export type SemesterStats = {
  status: "not_configured" | "not_started" | "active" | "ended";
  semesterStart?: string;
  semesterEnd?: string;
  minAttendance: number;
  overall: {
    conductedClasses: number;
    attendedClasses: number;
    attendancePercentage: number;
    risk: boolean;
  };
  subjects: SubjectSemesterStats[];
};

const roundTo2 = (value: number) => Math.round(value * 100) / 100;

const getRequiredClassesToTarget = (
  attendedClasses: number,
  conductedClasses: number,
  minAttendancePercent: number
) => {
  const required = minAttendancePercent / 100;
  const numerator = required * conductedClasses - attendedClasses;
  const denominator = 1 - required;

  if (denominator <= 0) {
    return 0;
  }

  return Math.max(0, Math.ceil(numerator / denominator));
};

export const getSemesterStats = async (): Promise<SemesterStats> => {
  const [semesterConfig, timetableEntries] = await Promise.all([
    getSemesterConfig(),
    listTimetableEntries()
  ]);

  const fallback: SemesterStats = {
    status: "not_configured",
    minAttendance: 75,
    overall: {
      conductedClasses: 0,
      attendedClasses: 0,
      attendancePercentage: 0,
      risk: false
    },
    subjects: timetableEntries.map((entry) => ({
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      conductedClasses: 0,
      attendedClasses: 0,
      attendancePercentage: 0,
      requiredClassesToTarget: 0
    }))
  };

  if (!semesterConfig) {
    return fallback;
  }

  const { semesterStart, semesterEnd, minAttendance } = semesterConfig;
  const today = getTodayDateString();

  const baseResult: SemesterStats = {
    status: compareDateStrings(today, semesterEnd) > 0 ? "ended" : "active",
    semesterStart,
    semesterEnd,
    minAttendance,
    overall: {
      conductedClasses: 0,
      attendedClasses: 0,
      attendancePercentage: 0,
      risk: false
    },
    subjects: timetableEntries.map((entry) => ({
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      conductedClasses: 0,
      attendedClasses: 0,
      attendancePercentage: 0,
      requiredClassesToTarget: 0
    }))
  };

  if (compareDateStrings(today, semesterStart) < 0) {
    baseResult.status = "not_started";
    return baseResult;
  }

  const effectiveEnd = minDateString(today, semesterEnd);

  const [holidays, attendance] = await Promise.all([
    listHolidaysInRange(semesterStart, effectiveEnd),
    listAttendanceInRange(semesterStart, effectiveEnd)
  ]);

  const holidaySet = new Set(holidays.map((item) => item.date));
  const presentSet = new Set(
    attendance
      .filter((entry) => entry.status === "present")
      .map((entry) => `${entry.date}__${entry.subjectId}`)
  );

  const dateRange = eachDateInRange(semesterStart, effectiveEnd);
  const timetableBySubjectId = new Map(
    timetableEntries.map((entry) => [entry.subjectId, entry] as const)
  );

  const subjects = baseResult.subjects.map((subject) => {
    let conducted = 0;
    let attended = 0;

    for (const date of dateRange) {
      if (holidaySet.has(date)) {
        continue;
      }

      const weekday = getWeekdayFromDate(date);
      const subjectTimetable = timetableBySubjectId.get(subject.subjectId);

      if (!subjectTimetable || !subjectTimetable.sessions.some((session) => session.day === weekday)) {
        continue;
      }

      conducted += 1;

      if (presentSet.has(`${date}__${subject.subjectId}`)) {
        attended += 1;
      }
    }

    const attendancePercentage = conducted > 0 ? roundTo2((attended / conducted) * 100) : 0;

    return {
      ...subject,
      conductedClasses: conducted,
      attendedClasses: attended,
      attendancePercentage,
      requiredClassesToTarget: getRequiredClassesToTarget(attended, conducted, minAttendance)
    };
  });

  const totalConducted = subjects.reduce((acc, item) => acc + item.conductedClasses, 0);
  const totalAttended = subjects.reduce((acc, item) => acc + item.attendedClasses, 0);
  const overallPercentage = totalConducted > 0 ? roundTo2((totalAttended / totalConducted) * 100) : 0;

  return {
    ...baseResult,
    subjects,
    overall: {
      conductedClasses: totalConducted,
      attendedClasses: totalAttended,
      attendancePercentage: overallPercentage,
      risk: overallPercentage < minAttendance
    }
  };
};
