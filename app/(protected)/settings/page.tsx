import ConfirmSubmitButton from "@/components/ui/confirm-submit-button";
import SubmitButton from "@/components/ui/submit-button";
import { WEEKDAYS } from "@/lib/constants/weekdays";
import { listHolidays } from "@/lib/firestore/holidays";
import { getSemesterConfig } from "@/lib/firestore/semester-config";
import { listTimetableEntries } from "@/lib/firestore/timetable";

import {
  createHolidayAction,
  createTimetableAction,
  deleteHolidayAction,
  deleteTimetableAction,
  updateHolidayAction,
  updateTimetableAction,
  upsertSemesterConfigAction
} from "./actions";

// Force dynamic rendering to avoid Firebase Admin init during build
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const initialVisibleCount = 3;
  const [semesterConfig, timetableEntries, holidays] = await Promise.all([
    getSemesterConfig(),
    listTimetableEntries(),
    listHolidays()
  ]);

  const visibleTimetableEntries = timetableEntries.slice(0, initialVisibleCount);
  const hiddenTimetableEntries = timetableEntries.slice(initialVisibleCount);
  const visibleHolidays = holidays.slice(0, initialVisibleCount);
  const hiddenHolidays = holidays.slice(initialVisibleCount);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="muted page-subtitle">
            Manage semester configuration, timetable entries, and holidays.
          </p>
        </div>
      </header>

      <div className="card section-stack add-panel">
        <h2 className="section-title">Semester Config</h2>
        <form action={upsertSemesterConfigAction} className="form-grid">
          <label>
            Semester Start
            <input
              className="input"
              type="date"
              name="semesterStart"
              required
              defaultValue={semesterConfig?.semesterStart ?? ""}
            />
          </label>

          <label>
            Semester End
            <input
              className="input"
              type="date"
              name="semesterEnd"
              required
              defaultValue={semesterConfig?.semesterEnd ?? ""}
            />
          </label>

          <label>
            Minimum Attendance (%)
            <input
              className="input"
              type="number"
              min={1}
              max={100}
              step={1}
              name="minAttendance"
              required
              defaultValue={semesterConfig?.minAttendance ?? 75}
            />
          </label>

          <div className="form-actions">
            <SubmitButton className="button" pendingText="Saving...">
              Save Semester Config
            </SubmitButton>
          </div>
        </form>
      </div>

      <div className="card section-stack">
        <h2 className="section-title">Timetable</h2>

        <div className="add-panel">
          <form action={createTimetableAction} className="form-grid">
            <label>
              Subject ID
              <input className="input" type="text" name="subjectId" placeholder="dbms101" required />
            </label>

            <label>
              Subject Name
              <input className="input" type="text" name="subjectName" placeholder="Database Systems" required />
            </label>

            <fieldset className="form-span">
              <legend>Day-wise Timings</legend>
              <div className="session-grid">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="session-row">
                    <label className="checkbox-label">
                      <input type="checkbox" name="days" value={day} />
                      <span>{day}</span>
                    </label>
                    <input className="input" type="time" name={`startTime_${day}`} />
                    <input className="input" type="time" name={`endTime_${day}`} />
                  </div>
                ))}
              </div>
            </fieldset>

            <div className="form-actions">
              <SubmitButton className="button" pendingText="Adding...">
                Add Subject
              </SubmitButton>
            </div>
          </form>
        </div>

        <div className="grid" style={{ gap: 12 }}>
          {timetableEntries.length === 0 ? (
            <p className="muted">No timetable entries yet.</p>
          ) : (
            <>
              {visibleTimetableEntries.map((entry) => (
                <details className="entry-accordion" key={entry.subjectId}>
                  <summary className="entry-summary">
                    <div>
                      <h3>{entry.subjectName}</h3>
                      <p className="muted entry-meta">{entry.subjectId}</p>
                    </div>
                    <div className="entry-summary-right">
                      <span className="muted entry-meta">
                        {entry.sessions.length} sessions
                      </span>
                      <span className="entry-chip">Edit</span>
                    </div>
                  </summary>

                  <div className="entry-body">
                    <p className="muted entry-meta">
                      {entry.sessions
                        .map((session) => `${session.day}: ${session.startTime}-${session.endTime}`)
                        .join(" | ")}
                    </p>

                    <form action={updateTimetableAction} className="form-grid">
                      <input type="hidden" name="subjectId" value={entry.subjectId} />

                      <label>
                        Subject Name
                        <input className="input" type="text" name="subjectName" required defaultValue={entry.subjectName} />
                      </label>

                      <fieldset className="form-span">
                        <legend>Day-wise Timings</legend>
                        <div className="session-grid">
                          {WEEKDAYS.map((day) => {
                            const session = entry.sessions.find((item) => item.day === day);
                            return (
                              <div key={`${entry.subjectId}-${day}`} className="session-row">
                                <label className="checkbox-label">
                                  <input type="checkbox" name="days" value={day} defaultChecked={Boolean(session)} />
                                  <span>{day}</span>
                                </label>
                                <input
                                  className="input"
                                  type="time"
                                  name={`startTime_${day}`}
                                  defaultValue={session?.startTime ?? ""}
                                />
                                <input
                                  className="input"
                                  type="time"
                                  name={`endTime_${day}`}
                                  defaultValue={session?.endTime ?? ""}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </fieldset>

                      <div className="form-actions">
                        <SubmitButton className="button" pendingText="Updating...">
                          Update
                        </SubmitButton>
                      </div>
                    </form>

                    <form action={deleteTimetableAction}>
                      <input type="hidden" name="subjectId" value={entry.subjectId} />
                      <ConfirmSubmitButton
                        className="button danger"
                        pendingText="Deleting..."
                        confirmMessage={`Delete timetable subject '${entry.subjectId}'?`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </details>
              ))}

              {hiddenTimetableEntries.length > 0 ? (
                <details className="show-more-block">
                  <summary className="show-more-summary">
                    Show more subjects ({hiddenTimetableEntries.length})
                  </summary>
                  <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                    {hiddenTimetableEntries.map((entry) => (
                      <details className="entry-accordion" key={entry.subjectId}>
                        <summary className="entry-summary">
                          <div>
                            <h3>{entry.subjectName}</h3>
                            <p className="muted entry-meta">{entry.subjectId}</p>
                          </div>
                          <div className="entry-summary-right">
                            <span className="muted entry-meta">
                              {entry.sessions.length} sessions
                            </span>
                            <span className="entry-chip">Edit</span>
                          </div>
                        </summary>

                        <div className="entry-body">
                          <p className="muted entry-meta">
                            {entry.sessions
                              .map((session) => `${session.day}: ${session.startTime}-${session.endTime}`)
                              .join(" | ")}
                          </p>

                          <form action={updateTimetableAction} className="form-grid">
                            <input type="hidden" name="subjectId" value={entry.subjectId} />
                            <label>
                              Subject Name
                              <input className="input" type="text" name="subjectName" required defaultValue={entry.subjectName} />
                            </label>
                            <fieldset className="form-span">
                              <legend>Day-wise Timings</legend>
                              <div className="session-grid">
                                {WEEKDAYS.map((day) => {
                                  const session = entry.sessions.find((item) => item.day === day);
                                  return (
                                    <div key={`${entry.subjectId}-${day}`} className="session-row">
                                      <label className="checkbox-label">
                                        <input type="checkbox" name="days" value={day} defaultChecked={Boolean(session)} />
                                        <span>{day}</span>
                                      </label>
                                      <input
                                        className="input"
                                        type="time"
                                        name={`startTime_${day}`}
                                        defaultValue={session?.startTime ?? ""}
                                      />
                                      <input
                                        className="input"
                                        type="time"
                                        name={`endTime_${day}`}
                                        defaultValue={session?.endTime ?? ""}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </fieldset>
                            <div className="form-actions">
                              <SubmitButton className="button" pendingText="Updating...">
                                Update
                              </SubmitButton>
                            </div>
                          </form>

                          <form action={deleteTimetableAction}>
                            <input type="hidden" name="subjectId" value={entry.subjectId} />
                            <ConfirmSubmitButton
                              className="button danger"
                              pendingText="Deleting..."
                              confirmMessage={`Delete timetable subject '${entry.subjectId}'?`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="card section-stack">
        <h2 className="section-title">Holidays</h2>

        <div className="add-panel">
          <form action={createHolidayAction} className="form-grid">
            <label>
              Date
              <input className="input" type="date" name="date" required />
            </label>

            <label>
              Reason
              <input className="input" type="text" name="reason" placeholder="Festival" required />
            </label>

            <div className="form-actions">
              <SubmitButton className="button" pendingText="Adding...">
                Add Holiday
              </SubmitButton>
            </div>
          </form>
        </div>

        <div className="grid" style={{ gap: 12 }}>
          {holidays.length === 0 ? (
            <p className="muted">No holidays configured yet.</p>
          ) : (
            <>
              {visibleHolidays.map((holiday) => (
                <details className="entry-accordion" key={holiday.date}>
                  <summary className="entry-summary">
                    <div>
                      <h3>{holiday.reason}</h3>
                      <p className="muted entry-meta">{holiday.date}</p>
                    </div>
                    <span className="entry-chip">Edit</span>
                  </summary>

                  <div className="entry-body">
                    <form action={updateHolidayAction} className="form-grid">
                      <input type="hidden" name="oldDate" value={holiday.date} />

                      <label>
                        Date
                        <input className="input" type="date" name="date" required defaultValue={holiday.date} />
                      </label>

                      <label>
                        Reason
                        <input className="input" type="text" name="reason" required defaultValue={holiday.reason} />
                      </label>

                      <div className="form-actions">
                        <SubmitButton className="button" pendingText="Updating...">
                          Update
                        </SubmitButton>
                      </div>
                    </form>

                    <form action={deleteHolidayAction}>
                      <input type="hidden" name="date" value={holiday.date} />
                      <ConfirmSubmitButton
                        className="button danger"
                        pendingText="Deleting..."
                        confirmMessage={`Delete holiday on '${holiday.date}'?`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </details>
              ))}

              {hiddenHolidays.length > 0 ? (
                <details className="show-more-block">
                  <summary className="show-more-summary">
                    Show more holidays ({hiddenHolidays.length})
                  </summary>
                  <div className="grid" style={{ gap: 12, marginTop: 12 }}>
                    {hiddenHolidays.map((holiday) => (
                      <details className="entry-accordion" key={holiday.date}>
                        <summary className="entry-summary">
                          <div>
                            <h3>{holiday.reason}</h3>
                            <p className="muted entry-meta">{holiday.date}</p>
                          </div>
                          <span className="entry-chip">Edit</span>
                        </summary>

                        <div className="entry-body">
                          <form action={updateHolidayAction} className="form-grid">
                            <input type="hidden" name="oldDate" value={holiday.date} />
                            <label>
                              Date
                              <input className="input" type="date" name="date" required defaultValue={holiday.date} />
                            </label>
                            <label>
                              Reason
                              <input className="input" type="text" name="reason" required defaultValue={holiday.reason} />
                            </label>
                            <div className="form-actions">
                              <SubmitButton className="button" pendingText="Updating...">
                                Update
                              </SubmitButton>
                            </div>
                          </form>

                          <form action={deleteHolidayAction}>
                            <input type="hidden" name="date" value={holiday.date} />
                            <ConfirmSubmitButton
                              className="button danger"
                              pendingText="Deleting..."
                              confirmMessage={`Delete holiday on '${holiday.date}'?`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
