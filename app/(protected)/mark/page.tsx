import Link from "next/link";
import { redirect } from "next/navigation";

import { getTodayDateString } from "@/lib/date/date";
import { upsertAttendance } from "@/lib/firestore/attendance";
import { isHoliday } from "@/lib/firestore/holidays";
import { listTimetableForDate } from "@/lib/firestore/timetable";

type MarkPageProps = {
  searchParams: Promise<{ auto?: string; subject?: string }>;
};

const isNextRedirect = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).includes("NEXT_REDIRECT")
  );
};

const redirectToDashboard = (status: "success" | "error", message: string) => {
  const params = new URLSearchParams({ status, message });
  redirect(`/dashboard?${params.toString()}`);
};

export default async function MarkPage({ searchParams }: MarkPageProps) {
  const params = await searchParams;
  const auto = params.auto === "true";
  const subjectId = (params.subject ?? "").trim();

  if (auto) {
    if (!subjectId) {
      redirectToDashboard("error", "Missing subject query parameter");
    }

    const today = getTodayDateString();

    try {
      if (await isHoliday(today)) {
        redirectToDashboard("error", "Cannot auto-mark attendance on a holiday");
      }

      const todaySchedule = await listTimetableForDate(today);
      const isScheduledToday = todaySchedule.some((entry) => entry.subjectId === subjectId);

      if (!isScheduledToday) {
        redirectToDashboard("error", `${subjectId} is not scheduled for today`);
      }

      await upsertAttendance({
        subjectId,
        date: today,
        status: "present"
      });

      redirectToDashboard("success", `Auto-marked ${subjectId} present for ${today}`);
    } catch (error) {
      if (isNextRedirect(error)) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Failed to auto-mark attendance";
      redirectToDashboard("error", message);
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Smart Mark Link</h1>
          <p className="muted page-subtitle">Auto-mark attendance from quick links.</p>
        </div>
      </header>

      <div className="card section-stack">
        <p>
          Use this route with query params to auto-mark present attendance.
        </p>
        <p className="muted">
          Designed for one-tap links from Google Calendar or reminders.
        </p>
        <div className="form-actions">
          <Link className="button secondary" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="card section-stack">
        <h2 className="section-title">Example Link</h2>
        <code className="code-chip">/mark?auto=true&subject=dbms101</code>
        <p className="muted">
          When called, this marks today&apos;s attendance for that subject as <strong>present</strong>.
        </p>
      </div>
    </section>
  );
}
