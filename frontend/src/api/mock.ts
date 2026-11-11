import type { Course, LearningGoal } from './types';

export const mockCourses: Course[] = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Projekt Software Engineering',
        description: 'ISEF01',
        createdAtUtc: '2026-10-01T08:00:00Z',
        targetDate: '2027-01-31',
        examType: 'TermPaper',
        examTry: null,
        expectedTimeMinutes: 9000,
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Software Engineering',
        description: 'ISSE01',
        createdAtUtc: '2026-10-01T08:05:00Z',
        targetDate: '2026-12-15',
        examType: 'WrittenExam',
        examTry: null,
        expectedTimeMinutes: 7200,     // 120 Stunden

    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        title: 'IT-Sicherheit',
        description: 'DLBISA01',
        createdAtUtc: '2026-10-02T10:00:00Z',
        targetDate: null,              // noch kein Zieldatum
        examType: null,                // Prüfungsart noch offen
        examTry: null,
        expectedTimeMinutes: null,     // Aufwand noch nicht geschätzt
    },
];

export const mockLearningGoals: LearningGoal[] = [
    {
        id: 'aaaa0001-0000-0000-0000-000000000000',
        courseId: '11111111-1111-1111-1111-111111111111',
        title: 'Recherche abgeschlossen',
        description: null,
        startDate: '2026-10-01',
        targetDate: '2026-10-26',
        targetHours: 10,
        isCompleted: true,
        completedAtUtc: '2026-10-25T18:00:00Z',
  },
  {
        id: 'aaaa0002-0000-0000-0000-000000000000',
        courseId: '11111111-1111-1111-1111-111111111111',
        title: 'Anforderungen dokumentiert',
        description: null,
        startDate: '2026-10-01',
        targetDate: '2026-11-02',
        targetHours: 12.5,
        isCompleted: true,
        completedAtUtc: '2026-11-02T20:00:00Z',
  },
  {
        id: 'aaaa0003-0000-0000-0000-000000000000',
        courseId: '11111111-1111-1111-1111-111111111111',
        title: 'Prototyp steht',
        description: null,
        startDate: '2026-11-03',
        targetDate: '2026-11-19',
        targetHours: 20,
        isCompleted: false,
        completedAtUtc: null,
  },
  {
        id: 'bbbb0001-0000-0000-0000-000000000000',
        courseId: '22222222-2222-2222-2222-222222222222',
        title: 'Kapitel 1 bis 3 lernen',
        description: null,
        startDate: '2026-10-15',
        targetDate: '2026-11-05',      // überfällig, zum Testen der roten Anzeige
        targetHours: 15,
        isCompleted: false,
        completedAtUtc: null,
  },
];