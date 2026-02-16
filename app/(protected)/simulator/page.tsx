import { getTodayDateString } from "@/lib/date/date";
import { listTimetableForDate } from "@/lib/firestore/timetable";
import { getSemesterStats } from "@/lib/stats/semester-stats";

import SimulatorClient from "./simulator-client";

export default async function SimulatorPage() {
  const [stats, todayClasses] = await Promise.all([
    getSemesterStats(),
    listTimetableForDate(getTodayDateString())
  ]);

  const uniqueTodaySubjects = Array.from(
    new Map(todayClasses.map((item) => [item.subjectId, { subjectId: item.subjectId, subjectName: item.subjectName }])).values()
  );

  return (
    <SimulatorClient
      minAttendance={stats.minAttendance}
      overall={stats.overall}
      subjects={stats.subjects}
      todaySubjects={uniqueTodaySubjects}
    />
  );
}
