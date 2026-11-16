
// Kursübersicht: pro Kurs 
// Lernzeit gelernt vs. Aufwand
// Zwischenziele erreicht vs. gesamt

import { useEffect, useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, LearningGoal, StudySession } from '../../api/types';
import { formatNumber, formatShortDate, toIsoDate } from '../../lib/format';

interface CourseSummaryProps {
    courses: Course[];
    refreshKey: number;
}

// Kurs (Kürzel) + Titel
function headline(course: Course): string {
    if (course.description === null) {
        return course.title;
    }
    return course.description + ' – ' + course.title;
}

// Kurse nach Abschluss sortiert
function byTargetDate(a: Course, b: Course): number {
    if (a.targetDate === null && b.targetDate === null) {
        return 0;
    }
    if (a.targetDate === null) {
        return 1;
    }
    if (b.targetDate === null) {
        return -1;
    }
    return a.targetDate.localeCompare(b.targetDate);
}

// Fortschritt
function ProgressBar({ value }: { value: number }) {
    const percent = Math.max(0, Math.min(1, value)) * 100;
    return (
        <div className="progress">
            <div className="progress-fill" style={{ width: percent + '%' }} />
        </div>
    );
}

export default function CourseSummary({ courses, refreshKey }: CourseSummaryProps) {

    const [goals, setGoals] = useState<LearningGoal[]>([]);
    const [sessions, setSessions] = useState<StudySession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ziele und Lernzeiten aller Kurse laden
    useEffect(() => {
        async function load() {
            try {
                const goalLists = await Promise.all(
                    courses.map(course => api.getGoals(course.id))
                );
                const sessionLists = await Promise.all(
                    courses.map(course => api.getStudySessions(course.id))
                );
                setGoals(goalLists.flat());
                setSessions(sessionLists.flat());
                setError(null);
            } catch (err) {
                setError(errorText(err));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [courses, refreshKey]);

    if (loading) {
        return <p className="tracking-status">Übersicht wird geladen...</p>;
    }
    if (error !== null) {
        return <p className="tracking-status">{error}</p>;
    }

    const today = toIsoDate(new Date());
    const sorted = [...courses].sort(byTargetDate);

    return (
        <div className="summary-grid">
            {sorted.map(course => {

                // ----------- Lernzeit ----------
                // Nur abgeschlossene Lernzeiten zählen
                let learnedSeconds = 0;
                for (const session of sessions) {
                    if (session.courseId === course.id && session.status === 'Completed') {
                        learnedSeconds = learnedSeconds + session.elapsedSeconds;
                    }
                }
                const learnedHours = learnedSeconds / 3600;

                let timeText = formatNumber(learnedHours) + ' h';
                let timeBar = <span />;
                if (course.expectedTimeMinutes !== null) {
                    const expectedHours = course.expectedTimeMinutes / 60;
                    timeText = formatNumber(learnedHours) + ' / ' + formatNumber(expectedHours) + ' h';
                    timeBar = <ProgressBar value={learnedHours / expectedHours} />;
                }

                // --------- Ziele -----------
                const courseGoals = goals.filter(goal => goal.courseId === course.id);
                const reached = courseGoals.filter(goal => goal.isCompleted).length;

                let goalText = 'keine Ziele';
                let goalBar = <span />;
                if (courseGoals.length > 0) {
                    goalText = reached + ' / ' + courseGoals.length + ' erreicht';
                    goalBar = <ProgressBar value={reached / courseGoals.length} />;
                }

                let itemClass = 'summary-item';
                if (course.targetDate !== null && course.targetDate < today) {
                    itemClass = itemClass + ' past';
                }

                return (
                    <div key={course.id} className={itemClass}>
                        <div className="summary-header">
                            <h3>{headline(course)}</h3>
                            {course.targetDate !== null && (
                                <span className="summary-date">
                                    Abschluss {formatShortDate(course.targetDate)}
                                </span>
                            )}
                        </div>

                        <div className="summary-row">
                            <span className="summary-label">Lernzeit gesamt</span>
                            <span>{timeText}</span>
                            {timeBar}
                        </div>

                        <div className="summary-row">
                            <span className="summary-label">Ziele</span>
                            <span>{goalText}</span>
                            {goalBar}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}