
import type { Course, StudySession } from '../../api/types';

// aktuelle Lernzeit in Sek
export function currentSeconds(session: StudySession, nowMs: number): number {
    let total = session.accumulatedSeconds;

    if(session.status === 'Running' && session.currentRunStartedAtUtc !== null) {
        const runSeconds = Math.floor((nowMs - Date.parse(session.currentRunStartedAtUtc)) / 1000);
        total = total + Math.max(0, runSeconds);
    }
    return total;
}

// sek als Uhr
export function formatClock(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return String(hours).padStart(2, '0') + ':'
        + String(minutes).padStart(2, '0') + ':'
        + String(seconds).padStart(2, '0');
}

// Sekunden als Minutentext
export function formatMinutes(totalSeconds: number): string {
    const minutes = Math.round(totalSeconds / 60);
    if (minutes < 1) {
        return 'unter 1 min';
    }
    return minutes + ' min';
}

// Kurzname Kurs
export function courseLabel(course: Course): string {
    if (course.description !== null) {
        return course.description;
    }
    return course.title;
}

