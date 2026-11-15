
// Stoppuhr

import { useEffect, useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, StudySession } from '../../api/types';
import { courseLabel, currentSeconds, formatClock, formatMinutes } from './sessionTime';

interface StudyTimerProps {
    courses: Course[];
}

export default function StudyTimer({ courses }: StudyTimerProps) {
    const [courseId, setCourseId] = useState('');
    const [session, setSession] = useState<StudySession | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [receivedAt, setReceivedAt] = useState(() => Date.now());

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Öffnen: checken ob schon einer läuft
    useEffect(() => {
        async function findActive() {
            try {
                // Promise.all startet alle
                // wartet, bis alle fertig sind
                const lists = await Promise.all(
                    courses.map(course => api.getStudySessions(course.id))
                );

                const active: StudySession[] = [];
                for (const list of lists) {
                    for (const item of list) {
                        if (item.type === 'Timer' && item.status !== 'Completed') {
                            active.push(item);
                        }
                    }
                }

                // Gibt es mehrere, den zuerst gestarteten
                if (active.length > 0) {
                    active.sort((a, b) => a.createdAtUtc.localeCompare(b.createdAtUtc));
                    setSession(active[0]);
                    setReceivedAt(Date.now());
                    setCourseId(active[0].courseId);
                    setNow(Date.now());
                }
            } catch (err) {
                setError(errorText(err));
            } finally {
                setLoading(false);
            }
        }
        findActive();
    }, [courses]);

    // Jede Sekunde anzeigen solange laufend
    useEffect(() => {
        if (session === null || session.status !== 'Running') {
            return;   // nichts zu zählen
        }

        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(intervalId);
    }, [session]);

    // Aktionen
    async function run(action: () => Promise<StudySession>) {
        setError(null);
        setMessage(null);
        setBusy(true);
        try {
            const updated = await action();
            setSession(updated);
            setReceivedAt(Date.now());
            setNow(Date.now());
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }

    function handleStart() {
        run(() => api.startTimer(courseId));
    }

    function handlePauseOrResume() {
        if (session === null) {
            return;
        }
        if (session.status === 'Running') {
            run(() => api.pauseTimer(session.courseId, session.id));
        } else {
            run(() => api.resumeTimer(session.courseId, session.id));
        }
    }

    async function handleStop() {
        if (session === null) {
            return;
        }
        setError(null);
        setBusy(true);
        try {
            const stopped = await api.stopTimer(session.courseId, session.id);

            // Bestätigung mit Kursname
            let label = '';
            const course = courses.find(item => item.id === stopped.courseId);
            if (course !== undefined) {
                label = courseLabel(course);
            }
            setMessage(formatMinutes(stopped.elapsedSeconds) + ' für ' + label + ' erfasst.');

            // Timer zurücksetzen
            setSession(null);
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }

    // Anzeige
    if (loading) {
        return <p className="tracking-status">Timer wird geladen...</p>;
    }

    let seconds = 0;
    if (session !== null) {
        seconds = currentSeconds(session, receivedAt, now);
    }

    const active = session !== null;
    const paused = session !== null && session.status === 'Paused';

    let pauseLabel = 'Pause';
    if (paused) {
        pauseLabel = 'Fortsetzen';
    }

    return (
        <div className="tracking-column">
            <h3>Timer</h3>

            {/* Gesperrt, solange ein Timer läuft oder pausiert ist */}
            <select
                value={courseId}
                disabled={active || busy}
                onChange={event => setCourseId(event.target.value)}
            >
                <option value="">Kurs wählen...</option>
                {courses.map(course => (
                    <option key={course.id} value={course.id}>
                        {courseLabel(course)} – {course.title}
                    </option>
                ))}
            </select>

            <div className="timer-clock">{formatClock(seconds)}</div>

            <div className="timer-buttons">
                <button
                    className="btn-start"
                    disabled={courseId === '' || active || busy}
                    onClick={handleStart}
                >
                    Start
                </button>
                <button
                    className="btn-pause"
                    disabled={!active || busy}
                    onClick={handlePauseOrResume}
                >
                    {pauseLabel}
                </button>
                <button
                    className="btn-stop"
                    disabled={!active || busy}
                    onClick={handleStop}
                >
                    Stopp
                </button>
            </div>

            {message !== null && <p className="tracking-success">{message}</p>}
            {error !== null && <p className="tracking-error">{error}</p>}
        </div>
    );
}