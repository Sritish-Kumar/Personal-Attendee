export type TimetableSession = {
  day: string;
  startTime: string;
  endTime: string;
};

export type TimetableEntry = {
  subjectId: string;
  subjectName: string;
  sessions: TimetableSession[];
  createdAt?: string;
  updatedAt?: string;
};

export type HolidayEntry = {
  date: string;
  reason: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SemesterConfig = {
  semesterStart: string;
  semesterEnd: string;
  minAttendance: number;
  updatedAt?: string;
};

export type QuickNoteEntry = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
