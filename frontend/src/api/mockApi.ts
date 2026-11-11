
import type { Course, CourseInput, LearningGoal, LearningGoalInput } from './types';
import { mockCourses, mockLearningGoals } from './mock';

// Arbeitskopie von Mock
let courses: Course[] = [...mockCourses];
let goals: LearningGoal[] = [...mockLearningGoals];

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


export const mockApi = {

    // =============================================Kurse===================================================

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
        goals = goals.filter(goal => goal.courseId !== id);
        return delay(undefined);
    },

    // ========================================== Lernziele ======================================

    // GET
    getGoals(courseId: string): Promise<LearningGoal[]> {
        const ofCourse = goals.filter(goal => goal.courseId === courseId);
        ofCourse.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
        return delay(ofCourse);
    },

    // POST
    createGoal(courseId: string, input: LearningGoalInput): Promise<LearningGoal> {
        const goal: LearningGoal = {
            id: crypto.randomUUID(),
            courseId: courseId,
            title: input.title.trim(),
            description: cleanText(input.description),
            startDate: input.startDate,
            targetDate: input.targetDate,
            targetHours: input.targetHours,
            isCompleted: false,
            completedAtUtc: null,
        };
        goals.push(goal);
        return delay(goal);
    },

    // Patch
    setGoalCompleted(courseId: string, goalId: string, isCompleted: boolean): Promise<LearningGoal> {
        const existing = goals.find(goal => goal.id === goalId && goal.courseId === courseId);
        if(existing === undefined) {
            return Promise.reject(new Error('Ziel nicht gefunden.'));
        }

        let completedAt: string | null = null;
        if(isCompleted) {
            if(existing.completedAtUtc !== null) {
                completedAt = existing.completedAtUtc;
            } else {
                completedAt = new Date().toISOString();
            }
        }

        const updated: LearningGoal = {
            ...existing,
            isCompleted: isCompleted,
            completedAtUtc: completedAt,
        };

        goals = goals.map(goal => {
            if(goal.id === goalId) {
                return updated;
            }
            return goal;
        });
        return delay(updated);
    },

    deleteGoal(courseId: string, goalId: string): Promise<void> {
        goals = goals.filter(goal => !(goal.id === goalId && goal.courseId === courseId));
        return delay(undefined);
    },

};