
import { ApiError } from './client';
import type { 
    Course, CourseInput, LearningGoal, LearningGoalInput, StudySession, PlannedStudySession, PlannedStudySessionInput 
} from './types';
import { mockCourses, mockLearningGoals, mockSessions, mockPlannedSessions } from './mock';

type MockSession = StudySession & {
    currentRunStartedAtUtc: string | null;
    accumulatedSeconds: number;
};

let courses: Course[] = [...mockCourses];
let goals: LearningGoal[] = [...mockLearningGoals];
let sessions: MockSession[] = mockSessions.map(session => ({
    ...session,
    currentRunStartedAtUtc: null,
    accumulatedSeconds: session.elapsedSeconds,
}));
let plannedSessions: PlannedStudySession[] = [...mockPlannedSessions]; 

function delay<T>(value: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => resolve(value), 300);
    });
}

function cleanText(value: string | null): string | null {
    if (value === null) {
        return null;
    }
    const trimmed = value.trim();
    if (trimmed === '') {
        return null;
    }
    return trimmed;
}

function secondsSince(iso: string): number {
    return Math.floor((Date.now() - Date.parse(iso)) / 1000);
}

function toResponse(session: MockSession): StudySession {
    let total = session.accumulatedSeconds;
    if (session.status === 'Running' && session.currentRunStartedAtUtc !== null) {
        total = total + secondsSince(session.currentRunStartedAtUtc);
    }

    return {
        id: session.id,
        courseId: session.courseId,
        type: session.type,
        status: session.status,
        createdAtUtc: session.createdAtUtc,
        startedAtUtc: session.startedAtUtc,
        endedAtUtc: session.endedAtUtc,
        elapsedSeconds: total,
    };
}

function replaceSession(updated: MockSession): void {
    sessions = sessions.map(session => {
        if (session.id === updated.id) {
            return updated;
        }
        return session;
    });
}

function findSession(courseId: string, id: string): MockSession | undefined {
    return sessions.find(session => session.id === id && session.courseId === courseId);
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
            return Promise.reject(new ApiError(404, 'Kurs nicht gefunden.'));
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
        plannedSessions = plannedSessions.filter(item => item.courseId !== id);     // bei Kurslöschung Ziele und Lernzeiten mitlöschen
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
            return Promise.reject(new ApiError(404, 'Ziel nicht gefunden.'));
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

    // =================== Lernzeiten ===================

    // GET /api/courses/{courseId}/study-sessions
    getStudySessions(courseId: string): Promise<StudySession[]> {
        const ofCourse = sessions
            .filter(session => session.courseId === courseId)
            .map(toResponse);
        return delay(ofCourse);
    },

    // POST /api/courses/{courseId}/study-sessions/manual
    createManualSession(courseId: string, minutes: number): Promise<StudySession> {
        const seconds = minutes * 60;
        const session: MockSession = {
            id: crypto.randomUUID(),
            courseId: courseId,
            type: 'Manual',
            status: 'Completed',
            createdAtUtc: new Date().toISOString(),
            startedAtUtc: null,
            endedAtUtc: null,
            elapsedSeconds: seconds,
            currentRunStartedAtUtc: null,
            accumulatedSeconds: seconds,
        };
        sessions.push(session);
        return delay(toResponse(session));
    },

    // POST /api/courses/{courseId}/study-sessions/timer/start
    startTimer(courseId: string): Promise<StudySession> {
        const active = sessions.find(session => {
            return session.courseId === courseId && session.type === 'Timer' && session.status !== 'Completed';
        });
        if (active !== undefined) {
            return Promise.reject(new ApiError(409, 'Für diesen Kurs läuft bereits ein Timer.'));
        }

        const now = new Date().toISOString();
        const session: MockSession = {
            id: crypto.randomUUID(),
            courseId: courseId,
            type: 'Timer',
            status: 'Running',
            createdAtUtc: now,
            startedAtUtc: now,
            endedAtUtc: null,
            elapsedSeconds: 0,
            currentRunStartedAtUtc: now,
            accumulatedSeconds: 0,
        };
        sessions.push(session);
        return delay(toResponse(session));
    },

    // PATCH …/{id}/pause
    pauseTimer(courseId: string, id: string): Promise<StudySession> {
        const existing = findSession(courseId, id);
        if (existing === undefined) {
            return Promise.reject(new ApiError(404, 'Timer nicht gefunden.'));
        }
        if (existing.status !== 'Running' || existing.currentRunStartedAtUtc === null) {
            return Promise.reject(new ApiError(409, 'Der Timer läuft nicht.'));
        }

        const updated: MockSession = {
            ...existing,
            status: 'Paused',
            accumulatedSeconds: existing.accumulatedSeconds + secondsSince(existing.currentRunStartedAtUtc),
            currentRunStartedAtUtc: null,
        };
        replaceSession(updated);
        return delay(toResponse(updated));
    },

    // PATCH …/{id}/resume
    resumeTimer(courseId: string, id: string): Promise<StudySession> {
        const existing = findSession(courseId, id);
        if (existing === undefined) {
            return Promise.reject(new ApiError(404, 'Timer nicht gefunden.'));
        }
        if (existing.status !== 'Paused') {
            return Promise.reject(new ApiError(409, 'Der Timer ist nicht pausiert.'));
        }

        const updated: MockSession = {
            ...existing,
            status: 'Running',
            currentRunStartedAtUtc: new Date().toISOString(),
        };
        replaceSession(updated);
        return delay(toResponse(updated));
    },

    // PATCH …/{id}/stop
    stopTimer(courseId: string, id: string): Promise<StudySession> {
        const existing = findSession(courseId, id);
        if (existing === undefined) {
            return Promise.reject(new ApiError(404, 'Timer nicht gefunden.'));
        }
        if (existing.status === 'Completed') {
            return Promise.reject(new ApiError(409, 'Der Timer ist bereits beendet.'));
        }

        let total = existing.accumulatedSeconds;
        if (existing.status === 'Running' && existing.currentRunStartedAtUtc !== null) {
            total = total + secondsSince(existing.currentRunStartedAtUtc);
        }

        const updated: MockSession = {
            ...existing,
            status: 'Completed',
            accumulatedSeconds: total,
            currentRunStartedAtUtc: null,
            endedAtUtc: new Date().toISOString(),
        };
        replaceSession(updated);
        return delay(toResponse(updated));
    },

    // =========================== Geplante Lernzeiten ==============================
    // GET /api/courses/{courseId}/planned-sessions
    getPlannedSessions(courseId: string): Promise<PlannedStudySession[]> {
        const ofCourse = plannedSessions.filter(item => item.courseId === courseId);
        return delay(ofCourse);
    },

    // POST /api/courses/{courseId}/planned-sessions
    createPlannedSession(courseId: string, input: PlannedStudySessionInput): Promise<void> {
        const item: PlannedStudySession = {
            id: crypto.randomUUID(),
            courseId: courseId,
            date: input.date,
            startTime: input.startTime,
            plannedDurationMinutes: input.plannedDurationMinutes,
            note: input.note,
        };
        plannedSessions.push(item);
        return delay(undefined);
    },

    deletePlannedSession(courseId: string, id: string): Promise<void> {
        plannedSessions = plannedSessions.filter(item => !(item.id === id && item.courseId === courseId));
        return delay(undefined);
    },

};