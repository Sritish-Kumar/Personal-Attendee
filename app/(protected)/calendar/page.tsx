import Link from "next/link";

import { getCalendarMonthView } from "@/lib/calendar/month-view";

import CalendarClient from "./calendar-client";

// Force dynamic rendering to avoid Firebase Admin init during build
export const dynamic = "force-dynamic";

type CalendarPageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const view = await getCalendarMonthView(params.month);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div className="row" style={{ alignItems: "center" }}>
          <div>
            <h1 className="page-title">Calendar</h1>
            <p className="muted page-subtitle">
              {view.monthLabel}
            </p>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <Link className="button secondary" href={`/calendar?month=${view.prevMonth}`}>
              ← Previous
            </Link>
            <Link className="button secondary" href={`/calendar?month=${view.nextMonth}`}>
              Next →
            </Link>
          </div>
        </div>
      </header>

      <div className="legend-panel">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#22c55e" }} />
          <span className="muted">Present</span>
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#ef4444" }} />
          <span className="muted">Absent</span>
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#94a3b8" }} />
          <span className="muted">Holiday</span>
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#3b82f6" }} />
          <span className="muted">Future</span>
        </span>
      </div>

      <div className="section-stack">
        <CalendarClient month={view.month} days={view.days} />
      </div>
    </section>
  );
}
