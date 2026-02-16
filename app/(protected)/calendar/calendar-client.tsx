"use client";

import { useMemo, useState } from "react";

import SubmitButton from "@/components/ui/submit-button";
import type { CalendarDay } from "@/lib/calendar/month-view";

import { updateCalendarAttendanceAction } from "./actions";

type CalendarClientProps = {
  month: string;
  days: CalendarDay[];
};

const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const colorByStatus: Record<string, string> = {
  present: "#22c55e",
  absent: "#ef4444",
  holiday: "#94a3b8",
  future: "#3b82f6"
};

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

export default function CalendarClient({ month, days }: CalendarClientProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedDay = useMemo(() => {
    if (!selectedDate) {
      return null;
    }

    return days.find((day) => day.date === selectedDate) ?? null;
  }, [days, selectedDate]);

  return (
    <>
      <div className="calendar-shell">
        <div className="calendar-grid">
          {weekdayHeaders.map((day) => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          ))}

          {days.map((day) => {
            const indicatorItems = day.subjects.slice(0, 5);
            const remainingCount = day.subjects.length - indicatorItems.length;

            return (
              <button
                className={`calendar-day${day.inMonth ? "" : " is-outside"}${day.isToday ? " is-today" : ""}`}
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                type="button"
              >
                <div className="calendar-day-head">
                  <span>{day.dayNumber}</span>
                  {day.isHoliday ? <span className="calendar-holiday-pill">Holiday</span> : null}
                </div>

                <div className="calendar-indicators">
                  {indicatorItems.map((subject) => (
                    <span
                      className="calendar-dot"
                      key={`${day.date}-${subject.subjectId}`}
                      style={{ background: colorByStatus[subject.status] }}
                      title={`${subject.subjectName} (${to12HourTime(subject.startTime)}-${to12HourTime(subject.endTime)}): ${subject.status}`}
                    />
                  ))}
                  {remainingCount > 0 ? <span className="calendar-more">+{remainingCount}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay ? (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)} role="presentation">
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="row" style={{ alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Attendance for {selectedDay.date}</h3>
              <button className="button secondary" onClick={() => setSelectedDate(null)} type="button">
                Close
              </button>
            </div>

            {selectedDay.subjects.length === 0 ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                No scheduled subjects for this date.
              </p>
            ) : selectedDay.isHoliday ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                This date is configured as a holiday. Editing is disabled.
              </p>
            ) : selectedDay.isFuture ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                This is a future date. Attendance can be edited once the class date is reached.
              </p>
            ) : (
              <div className="grid" style={{ gap: 10, marginTop: 12 }}>
                {selectedDay.subjects.map((subject) => (
                  <article
                    className={`card calendar-subject-card ${subject.status === "present" ? "is-present" : "is-absent"}`}
                    key={`${selectedDay.date}-${subject.subjectId}`}
                    style={{ borderRadius: 12 }}
                  >
                    <div className="row" style={{ alignItems: "center" }}>
                      <div>
                        <strong>{subject.subjectName}</strong>
                        <p className="muted" style={{ margin: "4px 0 0" }}>
                          {subject.subjectId}
                        </p>
                        <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
                          {to12HourTime(subject.startTime)} - {to12HourTime(subject.endTime)}
                        </p>
                      </div>
                      <span className={`status-pill is-${subject.status}`}>
                        {subject.status}
                      </span>
                    </div>

                    <form action={updateCalendarAttendanceAction} className="row" style={{ marginTop: 10, justifyContent: "flex-start" }}>
                      <input type="hidden" name="month" value={month} />
                      <input type="hidden" name="date" value={selectedDay.date} />
                      <input type="hidden" name="subjectId" value={subject.subjectId} />

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
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
