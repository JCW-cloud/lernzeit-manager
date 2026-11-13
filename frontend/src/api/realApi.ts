
import { request } from "./client";
import type { Course, CourseInput, LearningGoal, LearningGoalInput, StudySession } from './types';

function sessionsPath(courseId: string): string {
    return '/courses/' + courseId + '/study-sessions';
}

export const realApi = {

    // =========================== Kurse =================================
    // GET /api/courses
    getCourses(): Promise<Course[]> {
        return request<Course[]>('/courses');
    },

    // POST /api/courses
    createCourse(input: CourseInput): Promise<Course> {
        return request<Course>('/courses', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    // PUT /api/courses/{id}
    updateCourse(id: string, input: CourseInput): Promise<Course> {
        return request<Course>('/courses/' + id, {
            method: 'PUT',
            body: JSON.stringify(input),
        });
    },

    // DELETE /api/courses/{id}
    deleteCourse(id: string): Promise<void> {
        return request<void>('/courses/' + id, {
            method: 'DELETE',
        });
    },


    // ================================ Lernziele =============================
    // GET /api/courses/{courseId}/goals
    async getGoals(courseId: string): Promise<LearningGoal[]> {
        const goals = await request<LearningGoal[]>('/courses/' + courseId + '/goals');
        return goals.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    },

    // POST /api/courses/{courseId}/goals
    createGoal(courseId: string, input: LearningGoalInput): Promise<LearningGoal> {
        return request<LearningGoal>('/courses/' + courseId + '/goals', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    },

    // PATCH /api/courses/{courseId}/goals/{goalId}/completion
    setGoalCompleted(courseId: string, goalId: string, isCompleted: boolean): Promise<LearningGoal> {
        return request<LearningGoal>('/courses/' + courseId + '/goals/' + goalId + '/completion', {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted: isCompleted }),
        });
    },

    // DELETE /api/courses/{courseId}/goals/{goalId}
    deleteGoal(courseId: string, goalId: string): Promise<void> {
        return request<void>('/courses/' + courseId + '/goals/' + goalId, {
        method: 'DELETE',
        });
    },

    // =============================== Lernzeiten ===========================
    // GET
    getStudySessions(courseId: string): Promise<StudySession[]> {
        return request<StudySession[]>(sessionsPath(courseId));
    },

    // POST manual
    createManualSession(courseId: string, minutes: number): Promise<StudySession> {
        return request<StudySession>(sessionsPath(courseId) + '/manual', {
            method: 'POST',
            body: JSON.stringify({ minutes: minutes }),
        });
    },

    // POST auto
    startTimer(courseId: string): Promise<StudySession> {
        return request<StudySession>(sessionsPath(courseId) + '/timer/start', {
            method: 'POST',
        });
    },

    pauseTimer(courseId: string, id: string): Promise<StudySession> {
        return request<StudySession>(sessionsPath(courseId) + '/' + id + '/pause', {
            method: 'PATCH',
        });
    },

    resumeTimer(courseId: string, id: string): Promise<StudySession> {
        return request<StudySession>(sessionsPath(courseId) + '/' + id + '/resume', {
            method: 'PATCH',
        });
    },

    stopTimer(courseId: string, id: string): Promise<StudySession> {
        return request<StudySession>(sessionsPath(courseId) + '/' + id + '/stop', {
            method: 'PATCH',
        });
    },

};