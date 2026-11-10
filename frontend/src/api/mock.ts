import type { Course } from './types';

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