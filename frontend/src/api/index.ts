
import type { Course, CourseInput } from './types';
import { mockCourses } from './mock';

// Arbeitskopie von Mock
let courses: Course[] = [...mockCourses];

function delay<T>(value: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => resolve(value), 300);
    });
}

function cleanText(value: string | null): string | null {
    if(value === null){
        return null;
    }
    const trimmed = value.trim();
    if (trimmed === ''){
        return null;
    }
    return trimmed;
}


export const api = {

    // GET: alle Kurse alphabetisch nach Titel
    getCourses(): Promise<Course[]> {
        const sorted = [...courses].sort((a,b) => a.title.localeCompare(b.title, 'de'));
        return delay(sorted);
    },

    // POST: neuen Kurs anlegen
    createCourse(input: CourseInput): Promise<Course> {
        const course: Course = {
            id: crypto.randomUUID(),
            title: input.title.trim(),
            description: cleanText(input.description),
            createdAtUtc: new Date().toISOString(),
            targetDate: input.targetDate,
            examType: input.examType,
            examTry: input.examTry,
            expectedTimeMinutes: input.expectedTimeMinutes,
        };
        courses.push(course);
        return delay(course);
    },

    // PUT{id}: Kurs ändern
    updateCourse(id: string, input: CourseInput): Promise<Course> {
        const existing = courses.find(course => course.id === id);
        if(existing === undefined) {
            return Promise.reject(new Error ('Kurs nicht gefunden.'));
        }
        
        const updated: Course = {
            ...existing,
            title: input.title.trim(),
            description: cleanText(input.description),
            targetDate: input.targetDate,
            examType: input.examType,
            examTry: input.examTry,
            expectedTimeMinutes: input.expectedTimeMinutes,
        };

        courses = courses.map(course => {
            if(course.id === id){
                return updated;
            }
            return course;
        });
        return delay(updated);
    },

    deleteCourse(id: string): Promise<void> {
        courses = courses.filter(course => course.id !== id)
        return delay(undefined);
    },

};