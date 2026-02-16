# Attendee (Step 1 Foundation)

Personal semester attendance tracker built with Next.js App Router, Firebase Firestore, and Google auth.

## What is implemented in Step 1

- Next.js App Router scaffold with TypeScript.
- Auth.js (next-auth) Google sign-in/sign-out flow.
- Protected routes: `/dashboard`, `/calendar`, `/settings`, `/mark`.
- Public route: `/login`.
- Middleware route guard:
  - Unauthenticated users are redirected from protected routes to `/login`.
  - Authenticated users are redirected from `/login` to `/dashboard`.
- Firebase setup:
  - Browser SDK singleton in `lib/firebase/client.ts`.
  - Admin SDK singleton in `lib/firebase/admin.ts`.
- Firestore health check endpoint in `app/api/health/firestore/route.ts`.
- Runtime env validation with `zod` in `lib/config/env.ts`.

## What is implemented in Step 2

- Firestore-backed management for:
  - `timetable` (subject CRUD)
  - `semesterConfig` (single `current` doc upsert/read)
  - `holidays` (date-based CRUD)
- Shared zod validators:
  - `lib/validators/timetable.ts`
  - `lib/validators/semester-config.ts`
  - `lib/validators/holidays.ts`
- Settings page now includes full management UI:
  - Semester configuration form
  - Timetable create/update/delete with day-wise timings per subject
  - Holiday create/update/delete
- Server actions with auth guards for every mutation:
  - `app/(protected)/settings/actions.ts`
- Read helpers added for next steps:
  - `listTimetableByWeekday`, `listTimetableForDate`
  - `isHoliday`, `listHolidaysInRange`
  - `getSemesterConfig`

## What is implemented in Step 3

- Manual attendance marking on `/dashboard`:
  - Per-subject `Present` / `Absent` actions for today
  - `Mark All Today Present` bulk action
- Attendance storage in Firestore collection `attendance` with deterministic uniqueness key:
  - doc id: `${date}__${subjectId}`
- Attendance validation:
  - `lib/validators/attendance.ts`
- Attendance data layer:
  - `lib/firestore/attendance.ts`
- Dashboard server actions:
  - `app/(protected)/dashboard/actions.ts`
- Holiday-aware dashboard behavior:
  - marking disabled when today is a configured holiday
- Timezone-aware “today” utility:
  - `lib/date/date.ts` using `APP_TIMEZONE` (default `Asia/Kolkata`)

## What is implemented in Step 4

- Semester statistics engine (server-side):
  - `lib/stats/semester-stats.ts`
  - Calculates per subject:
    - conducted classes (timetable + semester window - holidays)
    - attended classes (only explicit `present` marks)
    - attendance percentage
    - required classes to reach `minAttendance`
  - Calculates overall attendance percentage and risk flag.
- Dashboard now shows:
  - overall semester cards
  - risk badge
  - subject-wise stats table
- Added attendance range query helper:
  - `listAttendanceInRange` in `lib/firestore/attendance.ts`
- Date helpers for range iteration/comparison:
  - `compareDateStrings`, `minDateString`, `eachDateInRange` in `lib/date/date.ts`
- Timezone default switched to:
  - `APP_TIMEZONE=Asia/Kolkata` in `.env.example`

## What is implemented in Step 5

- Monthly calendar visualization at `/calendar`:
  - server-generated month grid
  - previous/next month navigation
  - colored subject indicators per date:
    - green = present
    - red = absent
    - gray = holiday
    - blue = future class
- Click-to-edit modal on date cells:
  - shows scheduled subjects for selected date
  - allows editing attendance status (`present`/`absent`)
  - blocks edits for holidays and future dates
- Calendar attendance update server action:
  - `app/(protected)/calendar/actions.ts`
  - validates date/subject/schedule before upsert
  - revalidates `/calendar` and `/dashboard`
- Calendar month data builder:
  - `lib/calendar/month-view.ts`
  - combines timetable + holidays + attendance range data

## What is implemented in Step 6

- Smart Google Calendar link auto-mark route:
  - `/mark?auto=true&subject=<subjectId>`
- Route behavior:
  - validates query params
  - resolves today using `APP_TIMEZONE`
  - blocks marking on holidays
  - verifies subject is scheduled today
  - upserts attendance as `present` (duplicate-safe)
  - redirects to `/dashboard` with success/error message
- Middleware improvement for login redirects:
  - preserves full callback URL including query parameters
  - ensures `/mark?auto=true&subject=...` survives auth redirects

## UX and Access Hardening

- Loading/disabled states for all form submissions:
  - shared `SubmitButton` with pending text in `components/ui/submit-button.tsx`
  - applied across login, dashboard, settings, calendar modal, and sign-out
- Confirmation dialogs for destructive actions:
  - shared `ConfirmSubmitButton` in `components/ui/confirm-submit-button.tsx`
  - applied to delete actions in settings (timetable and holidays)
- Toast notifications (replacing page banners):
  - `components/ui/query-toast.tsx`
  - reads `status/message` query params, shows toast, then cleans URL params
  - mounted globally in protected layout
- Stronger single-user restriction:
  - optional allowlist env var: `ALLOWED_EMAILS` (comma-separated, case-insensitive)
  - enforced in:
    - Auth.js `signIn` callback (`auth.ts`)
    - middleware route guard (`middleware.ts`)
    - protected layout fallback check (`app/(protected)/layout.tsx`)
  - login page shows `AccessDenied` message and sign-out option for restricted sessions

## Bunk Simulator

- New protected route: `/simulator`
- Includes:
  - subject-wise bunk simulation (projected % after N additional bunks)
  - full-day bunk simulation (today's schedule pattern)
  - maximum safe bunk classes while staying above minimum attendance
- Simulator does not write attendance data; it is projection-only.

## Prerequisites

- Node.js 20+ (22 tested here).
- pnpm 9+
- Firebase project
- Google OAuth client credentials
- Optional: allowlisted email(s) for single-user lock (`ALLOWED_EMAILS`)

## Setup

1. Copy env template:

```bash
cp .env.example .env.local
```

2. Fill all values in `.env.local`.

3. Install dependencies:

```bash
pnpm install
```

4. Run development server:

```bash
pnpm dev
```

5. Open `http://localhost:3000`.

## Google OAuth configuration

1. In Google Cloud Console, create OAuth 2.0 Client ID (Web).
2. Add Authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
3. Put client ID and secret into `.env.local`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## Firebase configuration

1. In Firebase project settings, collect Web app keys for:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
2. Create a service account key and set:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

`FIREBASE_PRIVATE_KEY` should preserve newlines. If pasted with `\\n`, code converts it automatically.

## Firestore health check

Authenticated users can call:

- `GET /api/health/firestore`

Behavior:
- Writes a temporary `_healthchecks/probe-*` document
- Reads it back
- Deletes it in `finally` (best-effort cleanup)

This endpoint is meant for setup validation and can be removed/restricted further later.

## Firestore security rules

This project is designed so Firestore access happens through server-side Admin SDK code only.
Client-side Firestore access is intentionally blocked by `firestore.rules`.

Files:
- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`

Deploy rules:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project attendee-7051
```

## Step 1 completion checklist

- [x] App scaffolded with Next.js App Router + TypeScript
- [x] Firebase Client/Admin SDK modules added
- [x] Google sign-in/sign-out flow implemented
- [x] Protected route guard in middleware
- [x] Placeholder pages created (`/dashboard`, `/calendar`, `/settings`, `/mark`)
- [x] Firestore health check route added
- [x] Env validation and template documented

## Next planned step

Step 7 (optional): Firestore rules/indexes and automated tests (unit + e2e).
