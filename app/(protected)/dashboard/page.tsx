import SubmitButton from "@/components/ui/submit-button";
import { eachDateInRange } from "@/lib/date/date";
import { getTodayDateString } from "@/lib/date/date";
import { listAttendanceInRange } from "@/lib/firestore/attendance";
import { getAttendanceStatusMapForDate } from "@/lib/firestore/attendance";
import { isHoliday } from "@/lib/firestore/holidays";
import { listQuickNotes } from "@/lib/firestore/notes";
import { listTimetableForDate } from "@/lib/firestore/timetable";
import { getSemesterStats } from "@/lib/stats/semester-stats";

import {
  createQuickNoteAction,
  deleteQuickNoteAction,
  markAllTodayPresentAction,
  markSingleAttendanceAction,
  updateQuickNoteAction
} from "./actions";

// Force dynamic rendering to avoid Firebase Admin init during build
export const dynamic = "force-dynamic";

const formatLabel = (value: string) => `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;

const to12HourTime = (time24: string) => {
  const [hourRaw, minuteRaw] = time24.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return time24;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
};

const shiftDateByDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const getUtcWeekdayIndex = (dateString: string) => new Date(`${dateString}T00:00:00Z`).getUTCDay();

type HeatmapCell = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

const toHeatmapLevel = (count: number, maxCount: number): HeatmapCell["level"] => {
  if (count <= 0) {
    return 0;
  }

  if (maxCount <= 1) {
    return 4;
  }

  const scaled = Math.ceil((count / maxCount) * 4);
  return Math.max(1, Math.min(4, scaled)) as HeatmapCell["level"];
};

export default async function DashboardPage() {
  const today = getTodayDateString();

  const [holidayToday, classesToday, attendanceMap, semesterStats, quickNotes] = await Promise.all([
    isHoliday(today),
    listTimetableForDate(today),
    getAttendanceStatusMapForDate(today),
    getSemesterStats(),
    listQuickNotes()
  ]);

  const semesterStatusText: Record<string, string> = {
    not_configured: "Semester is not configured yet.",
    not_started: "Semester has not started yet.",
    active: "Semester is in progress.",
    ended: "Semester has ended."
  };
  const atRiskSubjects = semesterStats.subjects
    .filter((subject) => subject.attendancePercentage < semesterStats.minAttendance)
    .slice(0, 2);

  const heatmapEnd = today;
  const weeksToShow = 32;
  const visibleDays = weeksToShow * 7;
  const rawHeatmapStart = shiftDateByDays(heatmapEnd, -(visibleDays - 1));
  const leadingEmptyCells = getUtcWeekdayIndex(rawHeatmapStart);

  const attendanceInRange = await listAttendanceInRange(rawHeatmapStart, heatmapEnd);
  const contributionCountByDate = attendanceInRange.reduce<Record<string, number>>((acc, entry) => {
    if (entry.status !== "present") {
      return acc;
    }

    acc[entry.date] = (acc[entry.date] ?? 0) + 1;
    return acc;
  }, {});

  const heatmapDates = eachDateInRange(rawHeatmapStart, heatmapEnd);
  const maxDailyContribution = heatmapDates.reduce((max, date) => {
    const count = contributionCountByDate[date] ?? 0;
    return count > max ? count : max;
  }, 0);

  const coreHeatmapCells = heatmapDates.map<HeatmapCell>((date) => {
    const count = contributionCountByDate[date] ?? 0;
    return {
      date,
      count,
      level: toHeatmapLevel(count, maxDailyContribution)
    };
  });
  const trailingEmptyCells = (7 - ((leadingEmptyCells + coreHeatmapCells.length) % 7)) % 7;
  const heatmapCells = [
    ...Array<HeatmapCell | null>(leadingEmptyCells).fill(null),
    ...coreHeatmapCells,
    ...Array<HeatmapCell | null>(trailingEmptyCells).fill(null)
  ];

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title dashboard-title">Dashboard</h1>
          <p className="muted page-subtitle dashboard-date">
            Date: {today}
          </p>
        </div>
      </header>

      <div className="section-stack">
        <div className="row">
          <div>
            <h2 className="section-title">Overall Semester Stats</h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              {semesterStatusText[semesterStats.status]}
              {semesterStats.semesterStart && semesterStats.semesterEnd
                ? ` Window: ${semesterStats.semesterStart} to ${semesterStats.semesterEnd}`
                : ""}
            </p>
          </div>
          <span className={`status-pill ${semesterStats.overall.risk ? "is-absent" : "is-present"}`}>
            {semesterStats.overall.risk ? "At Risk" : "Safe"}
          </span>
        </div>

        <div className="stats-grid">
          <article className="card stat-card">
            <p className="stat-label dashboard-stat-label">Attendance %</p>
            <p className="stat-value dashboard-stat-value">{semesterStats.overall.attendancePercentage.toFixed(2)}%</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label dashboard-stat-label">Conducted</p>
            <p className="stat-value dashboard-stat-value">{semesterStats.overall.conductedClasses}</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label dashboard-stat-label">Attended</p>
            <p className="stat-value dashboard-stat-value">{semesterStats.overall.attendedClasses}</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label dashboard-stat-label">Minimum Required</p>
            <p className="stat-value dashboard-stat-value">{semesterStats.minAttendance}%</p>
          </article>
        </div>
      </div>

      <div className="section-stack">
        <div className="row">
          <h2 className="section-title">Today&apos;s Classes</h2>
          <form action={markAllTodayPresentAction}>
            <SubmitButton
              className="button"
              pendingText="Marking..."
              disabled={holidayToday || classesToday.length === 0}
            >
              Mark All Present
            </SubmitButton>
          </form>
        </div>

        {holidayToday ? (
          <p className="muted" style={{ margin: 0 }}>
            Today is marked as a holiday. Attendance cannot be marked.
          </p>
        ) : classesToday.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No classes scheduled today.
          </p>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {classesToday.map((entry) => {
              const currentStatus = attendanceMap[entry.subjectId] ?? "unmarked";

              return (
                <article className="card class-card" key={entry.subjectId}>
                  <div className="row" style={{ alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{entry.subjectName}</h3>
                      <p className="muted" style={{ margin: "6px 0 0" }}>
                        {to12HourTime(entry.startTime)} - {to12HourTime(entry.endTime)} | {entry.subjectId}
                      </p>
                    </div>

                    <span className={`status-pill is-${currentStatus}`}>{formatLabel(currentStatus)}</span>
                  </div>

                  <form
                    action={markSingleAttendanceAction}
                    className="row"
                    style={{ marginTop: 14, justifyContent: "flex-start" }}
                  >
                    <input type="hidden" name="date" value={today} />
                    <input type="hidden" name="subjectId" value={entry.subjectId} />

                    <SubmitButton className="button" name="status" value="present" pendingText="Saving...">
                      Present
                    </SubmitButton>

                    <SubmitButton
                      className="button secondary"
                      name="status"
                      value="absent"
                      pendingText="Saving..."
                    >
                      Absent
                    </SubmitButton>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="section-stack">
        <h2 className="section-title">Subject-wise Semester Stats</h2>
        {semesterStats.subjects.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            No subjects configured yet. Add timetable entries in Settings.
          </p>
        ) : (
          <div className="table-shell">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Conducted</th>
                  <th>Attended</th>
                  <th>%</th>
                  <th>Required to {semesterStats.minAttendance}%</th>
                </tr>
              </thead>
              <tbody>
                {semesterStats.subjects.map((subject) => (
                  <tr
                    key={subject.subjectId}
                    className={subject.attendancePercentage < semesterStats.minAttendance ? "risk-row" : ""}
                  >
                    <td>
                      <strong>{subject.subjectName}</strong>
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        {subject.subjectId}
                      </div>
                    </td>
                    <td>{subject.conductedClasses}</td>
                    <td>{subject.attendedClasses}</td>
                    <td>
                      {subject.attendancePercentage.toFixed(2)}%
                      {subject.attendancePercentage < semesterStats.minAttendance ? (
                        <span className="risk-icon" aria-label="At risk" title="At risk">
                          ⚠️
                        </span>
                      ) : null}
                    </td>
                    <td>{subject.requiredClassesToTarget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="section-stack">
        <h2 className="section-title">Insights &amp; Activity</h2>
        <div className="insights-layout">
          <article className="card section-stack">
            <div className="row">
              <h2 className="section-title">Attendance Progress</h2>
              <span
                className={`status-pill ${semesterStats.overall.attendancePercentage >= semesterStats.minAttendance ? "is-present" : "is-absent"}`}
              >
                {semesterStats.overall.attendancePercentage.toFixed(2)}%
              </span>
            </div>
            <p className="muted">
              Heat map for daily attendance consistency.
            </p>
            <div className="heatmap-grid" aria-label="Attendance contribution heatmap">
              {heatmapCells.map((cell, index) => (
                <span
                  className={`heatmap-cell ${cell ? `level-${cell.level}` : "is-empty"}`}
                  key={cell?.date ?? `empty-${index}`}
                  title={cell ? `${cell.date}: ${cell.count} present marks` : undefined}
                />
              ))}
            </div>
          </article>

          <div className="grid" style={{ gap: 16 }}>
            <article className="card section-stack">
              <h3 className="insight-title">Quick Notes</h3>
              <form action={createQuickNoteAction} className="quick-note-form">
                <input
                  className="input"
                  type="text"
                  name="content"
                  placeholder="Add a quick note..."
                  maxLength={240}
                  required
                />
                <SubmitButton className="button" pendingText="Adding...">
                  Add
                </SubmitButton>
              </form>

              {quickNotes.length === 0 ? (
                <p className="muted">No notes yet. Add your first quick note.</p>
              ) : (
                <div className="quick-note-list">
                  {quickNotes.map((note) => (
                    <details className="quick-note-item" key={note.id}>
                      <summary className="quick-note-row">
                        <div className="quick-note">{note.content}</div>
                        <span className="button secondary quick-note-edit-toggle">Edit</span>
                      </summary>

                      <div className="quick-note-actions">
                        <form action={updateQuickNoteAction} className="quick-note-edit-form">
                          <input type="hidden" name="noteId" value={note.id} />
                          <input
                            className="input"
                            type="text"
                            name="content"
                            defaultValue={note.content}
                            maxLength={240}
                            required
                          />
                          <SubmitButton className="button" pendingText="Saving...">
                            Save
                          </SubmitButton>
                        </form>
                        <form action={deleteQuickNoteAction}>
                          <input type="hidden" name="noteId" value={note.id} />
                          <SubmitButton className="button secondary quick-note-delete" pendingText="...">
                            Delete
                          </SubmitButton>
                        </form>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </article>

            <article className="card section-stack">
              <h3 className="insight-title">At-Risk Subjects</h3>
              {atRiskSubjects.length === 0 ? (
                <p className="muted">No subjects currently below threshold.</p>
              ) : (
                atRiskSubjects.map((subject) => (
                  <div className="risk-item" key={subject.subjectId}>
                    <span>{subject.subjectName}</span>
                    <strong>{subject.attendancePercentage.toFixed(0)}%</strong>
                  </div>
                ))
              )}
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
