import type { Course } from './types';

export const courses: Course[] = [
    {
        id: 1,
        listId: 1,
        courseTitle: 'Projekt Software Engineering',
        courseShortName: 'ISEF01',
        creationDate: '2026-10-01T09:00:00Z',
        examType: 'Projektbericht',
        examPassed: false,
        examTry: 'Erstversuch',
        grade: null,
    },
    {
        id: 2,
        listId: 1,
        courseTitle: 'Statistik',
        courseShortName: 'STEF01',
        creationDate: '2026-09-01T09:00:00Z',
        examType: 'Klausur',
        examPassed: false,
        examTry: 'Erstversuch',
        grade: null,
    },
    {
        id: 3,
        listId: 1,
        courseTitle: 'Architektur',
        courseShortName: 'ACHR01',
        creationDate: '2026-11-01T09:00:00Z',
        examType: 'Klausur',
        examPassed: true,
        examTry: 'Erstversuch',
        grade: 1.9,
    },
];