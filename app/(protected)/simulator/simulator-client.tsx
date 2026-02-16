"use client";

import { useMemo, useState } from "react";

type SubjectStat = {
  subjectId: string;
  subjectName: string;
  conductedClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
};

type SimulatorClientProps = {
  minAttendance: number;
  overall: {
    conductedClasses: number;
    attendedClasses: number;
    attendancePercentage: number;
  };
  subjects: SubjectStat[];
  todaySubjects: { subjectId: string; subjectName: string }[];
};

const roundTo2 = (value: number) => Math.round(value * 100) / 100;

const projectedPercentage = (attended: number, conducted: number, extraBunks: number) => {
  const newConducted = conducted + Math.max(0, extraBunks);
  if (newConducted <= 0) {
    return 0;
  }

  return roundTo2((attended / newConducted) * 100);
};

const maxBunksAllowed = (attended: number, conducted: number, minAttendance: number) => {
  const required = minAttendance / 100;

  if (required <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  const raw = Math.floor(attended / required - conducted);
  return Math.max(0, raw);
};

export default function SimulatorClient({ minAttendance, overall, subjects, todaySubjects }: SimulatorClientProps) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.subjectId ?? "");
  const [subjectBunks, setSubjectBunks] = useState(1);
  const [fullDayBunks, setFullDayBunks] = useState(1);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.subjectId === subjectId) ?? null,
    [subjectId, subjects]
  );

  const selectedSubjectProjection = selectedSubject
    ? projectedPercentage(selectedSubject.attendedClasses, selectedSubject.conductedClasses, subjectBunks)
    : 0;

  const fullDayExtraClasses = todaySubjects.length * Math.max(0, fullDayBunks);
  const projectedOverallForFullDay = projectedPercentage(
    overall.attendedClasses,
    overall.conductedClasses,
    fullDayExtraClasses
  );

  const overallMaxBunks = maxBunksAllowed(overall.attendedClasses, overall.conductedClasses, minAttendance);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Bunk Simulator</h1>
          
        </div>
      </header>

      <div className="card section-stack">
        <h2 className="section-title">Subject-wise Simulation</h2>

        {subjects.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No subjects available yet.
          </p>
        ) : (
          <>
            <div className="form-grid">
              <label>
                Subject
                <select className="input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                  {subjects.map((subject) => (
                    <option key={subject.subjectId} value={subject.subjectId}>
                      {subject.subjectName} ({subject.subjectId})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Additional bunk classes
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={subjectBunks}
                  onChange={(event) => setSubjectBunks(Number(event.target.value) || 0)}
                />
              </label>
            </div>

            {selectedSubject ? (
              <div className="stats-grid">
                <article className="card stat-card">
                  <p className="stat-label">Current %</p>
                  <p className="stat-value">{selectedSubject.attendancePercentage.toFixed(2)}%</p>
                </article>
                <article className="card stat-card">
                  <p className="stat-label">Projected %</p>
                  <p className="stat-value">{selectedSubjectProjection.toFixed(2)}%</p>
                </article>
                <article className="card stat-card">
                  <p className="stat-label">Max Safe Bunks</p>
                  <p className="stat-value">
                    {maxBunksAllowed(
                      selectedSubject.attendedClasses,
                      selectedSubject.conductedClasses,
                      minAttendance
                    )}
                  </p>
                </article>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="card section-stack">
        <h2 className="section-title">Full-day Simulation</h2>
        <p className="muted">
          This simulates bunking all subjects scheduled for today&apos;s pattern.
        </p>

        <div className="form-grid">
          <label>
            Number of full-day bunks
            <input
              className="input"
              type="number"
              min={0}
              step={1}
              value={fullDayBunks}
              onChange={(event) => setFullDayBunks(Number(event.target.value) || 0)}
            />
          </label>

          <label>
            Subjects in today&apos;s day-pattern
            <input className="input" value={todaySubjects.length} readOnly />
          </label>
        </div>

        <div className="stats-grid">
          <article className="card stat-card">
            <p className="stat-label">Current Overall %</p>
            <p className="stat-value">{overall.attendancePercentage.toFixed(2)}%</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label">Projected Overall %</p>
            <p className="stat-value">{projectedOverallForFullDay.toFixed(2)}%</p>
          </article>
          <article className="card stat-card">
            <p className="stat-label">Extra Missed Classes</p>
            <p className="stat-value">{fullDayExtraClasses}</p>
          </article>
        </div>

        {todaySubjects.length > 0 ? (
          <div>
            <p className="muted section-note">Affected subjects:</p>
            <div className="day-grid">
              {todaySubjects.map((subject) => (
                <span key={subject.subjectId} className="pill">
                  {subject.subjectName}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">No classes in today&apos;s day-pattern.</p>
        )}
      </div>

      <div className="card section-stack">
        <h2 className="section-title">How Many Classes Can I Bunk?</h2>
        <p>
          Overall max additional bunks while staying above {minAttendance}%: <strong>{overallMaxBunks}</strong>
        </p>
      </div>
    </section>
  );
}
