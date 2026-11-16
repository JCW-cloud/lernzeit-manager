
// Erinnerungen an geplante Lernzeiten heute
// zur Startzeit + 10min danach falls kein Timer läuft

import { useEffect, useRef, useState } from 'react';
import { api } from '../../api';
import type { PlannedStudySession } from '../../api/types';
import { toIsoDate } from '../../lib/format';
import { courseLabel } from '../tracking/sessionTime';
import { minutesToTime, timeToMinutes } from '../planning/time';
import { PLANNED_CHANGED_EVENT } from './events';

const CHECK_AFTER_MS = 10 * 60 * 1000;  // 10min
const RELOAD_EVERY_MS = 15 * 60 * 1000; // 15min

export type ReminderPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface InAppReminder {
    id: string;
    text: string;
}

function readPermission(): ReminderPermission {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

function startTimestamp(planned: PlannedStudySession): number {
    const dateParts = planned.date.split('-');
    const minutes = timeToMinutes(planned.startTime);
    const date = new Date(
        Number(dateParts[0]),
        Number(dateParts[1]) - 1,
        Number(dateParts[2]),
        Math.floor(minutes / 60),
        minutes % 60,
    );
    return date.getTime();
}

export function useReminders() {
    const [permission, setPermission] = useState<ReminderPermission>(() => readPermission());
    const [inApp, setInApp] = useState<InAppReminder[]>([]);
    const [askHidden, setAskHidden] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const permissionRef = useRef(permission);
    useEffect(() => {
        permissionRef.current = permission;
    }, [permission]);


    // Neu laden
    useEffect(() => {
        function reload() {
            setReloadKey(prev => prev + 1);
        }

        window.addEventListener(PLANNED_CHANGED_EVENT, reload);
        const intervalId = window.setInterval(reload, RELOAD_EVERY_MS);

        return () => {
            window.removeEventListener(PLANNED_CHANGED_EVENT, reload);
            window.clearInterval(intervalId);
        };
    }, []);


    // Wecker stellen
    useEffect(() => {
        let cancelled = false;
        const timers: number[] = [];

        // als Systemmeldung oder als Banner
        function show(id: string, text: string) {
            if (permissionRef.current === 'granted') {
                try {
                    new Notification('Lernzeit-Manager', { body: text, tag: id });
                    return;
                } catch {
                    
                }
            }
            setInApp(prev => [...prev, { id: id, text: text }]);
        }

        // 10 Minuten nach Start: läuft für den Kurs ein Timer
        async function checkTimer(planned: PlannedStudySession, text: string) {
            try {
                const sessions = await api.getStudySessions(planned.courseId);
                const active = sessions.some(item => {
                    return item.type === 'Timer' && item.status !== 'Completed';
                });
                if (!active) {
                    show(planned.id + '-check', text);
                }
            } catch {
                // Fehler hier sollen die App nicht stören
            }
        }

        async function schedule() {
            try {
                const courses = await api.getCourses();
                const lists = await Promise.all(
                    courses.map(course => api.getPlannedSessions(course.id))
                );
                if (cancelled) {
                    return;
                }

                const today = toIsoDate(new Date());
                const now = Date.now();

                for (const planned of lists.flat()) {
                    if (planned.date !== today) {
                        continue;   // nur heutige Lernzeiten
                    }

                    let label = '';
                    const course = courses.find(item => item.id === planned.courseId);
                    if (course !== undefined) {
                        label = courseLabel(course);
                    }
                    const start = timeToMinutes(planned.startTime);
                    const timeText = minutesToTime(start) + '–' + minutesToTime(start + planned.plannedDurationMinutes);

                    const startMs = startTimestamp(planned);
                    const endMs = startMs + planned.plannedDurationMinutes * 60 * 1000;

                    // Wecker 1
                    const startDelay = startMs - now;
                    if (startDelay > 0) {
                        timers.push(window.setTimeout(() => {
                            show(planned.id + '-start', timeText + ': Lernzeit ' + label + ' beginnt jetzt.');
                        }, startDelay));
                    }

                    // Wecker 2 wenn noch kein Timer läuft
                    const checkMs = startMs + CHECK_AFTER_MS;
                    const checkDelay = checkMs - now;
                    if (checkDelay > 0 && checkMs < endMs) {
                        timers.push(window.setTimeout(() => {
                            checkTimer(
                                planned,
                                'Geplante Lernzeit ' + label + ' (' + timeText + ') läuft seit 10 Minuten. Es wurde aber noch kein Timer gestartet.'
                            );
                        }, checkDelay));
                    }
                }
            } catch {
                // Fehler hier sollen die App nicht stören.
            }
        }

        schedule();

        // Vor dem Neustellen alle alten Wecker entfernen
        return () => {
            cancelled = true;
            for (const id of timers) {
                window.clearTimeout(id);
            }
        };
    }, [reloadKey]);


    // Aktionen für das Banner
    // Muss durch einen Klick ausgelöst werden, sonst ignoriert Safari die Frage
    async function requestPermission() {
        if (!('Notification' in window)) {
            return;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
    }

    function hideAsk() {
        setAskHidden(true);
    }

    function dismiss(id: string) {
        setInApp(prev => prev.filter(item => item.id !== id));
    }

    return { permission, inApp, askHidden, requestPermission, hideAsk, dismiss };
}

export type Reminders = ReturnType<typeof useReminders>;