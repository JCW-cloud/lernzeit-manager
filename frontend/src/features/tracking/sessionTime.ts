
import type { Course, StudySession } from '../../api/types';

// Aktuelle Lernzeit in Sek
export function currentSeconds(session: StudySession, receivedAtMs: number, nowMs: number): number {
    if (session.status !== 'Running') {
        return session.elapsedSeconds;
    }

    const sinceReceived = Math.floor((nowMs - receivedAtMs) / 1000);
    return session.elapsedSeconds + Math.max(0, sinceReceived);
}

// Sekunden als Uhr
export function formatClock(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);   // % = Rest der Division
    const seconds = totalSeconds % 60;

    return String(hours).padStart(2, '0') + ':'
        + String(minutes).padStart(2, '0') + ':'
        + String(seconds).padStart(2, '0');
}

// Sekunden als Text für die Bestätigung
export function formatMinutes(totalSeconds: number): string {
    const minutes = Math.round(totalSeconds / 60);
    if (minutes < 1) {
        return 'unter 1 min';
    }
    return minutes + ' min';
}

// Kurzname eines Kurses
export function courseLabel(course: Course): string {
    if (course.description !== null) {
        return course.description;
    }
    return course.title;
}
