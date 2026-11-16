
// Kalenderübersicht: Lernzeiten + Zwischenziele in Überfällig, Heute, nächste 7 Tage

import { useEffect, useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, LearningGoal, PlannedStudySession } from '../../api/types';
import { formatShortDate, toIsoDate } from '../../lib/format';
import { courseLabel } from '../tracking/sessionTime';
import { minutesToTime, timeToMinutes } from '../planning/time';

interface CalendarOverviewProps {
    courses: Course[];
}

type Entry =
    | { kind: 'planned'; date: string; sortKey: string; planned: PlannedStudySession }
    | { kind: 'goal'; date: string; sortKey: string; goal: LearningGoal };

function dayLabel(iso: string): string {
    const parts = iso.split('-');
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    const weekday = date.toLocaleDateString('de-AT', { weekday: 'short' }).replace('.', '');
    return weekday + ' ' + formatShortDate(iso);
}

function addDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return toIsoDate(date);
}

interface RowProps {
    entry: Entry;
    label: string;       // Kürzel
    showDate: boolean; 
    overdue: boolean;
}

function CalendarRow({ entry, label, showDate, overdue }: RowProps) {

    let rowClass = 'calendar-row';
    if (!showDate) {
        rowClass = rowClass + ' no-date';
    }
    if (entry.kind === 'goal') {
        rowClass = rowClass + ' goal';
    }
    if (overdue) {
        rowClass = rowClass + ' overdue';
    }

    let timeCell;
    let titleCell;
    if (entry.kind === 'planned') {
        const start = timeToMinutes(entry.planned.startTime);
        const end = start + entry.planned.plannedDurationMinutes;
        timeCell = minutesToTime(start) + '–' + minutesToTime(end);
        titleCell = <span>Lernzeit</span>;
    } else {
        timeCell = 'Ziel';
        let icon = '○';
        if (entry.goal.isCompleted) {
            icon = '✓';
        }
        titleCell = (
            <span className="calendar-goal">
                <span className="goal-icon">{icon}</span>
                {entry.goal.title}
            </span>
        );
    }

    return (
        <div className={rowClass}>
            {showDate && <span className="calendar-date">{dayLabel(entry.date)}</span>}
            <span className="calendar-time">{timeCell}</span>
            {titleCell}
            <span className="calendar-badge">{label}</span>
        </div>
    );
}

export default function CalendarOverview({ courses }: CalendarOverviewProps) {

    const [planned, setPlanned] = useState<PlannedStudySession[]>([]);
    const [goals, setGoals] = useState<LearningGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Geplante Lernzeiten und Ziele laden
    useEffect(() => {
        async function load() {
            try {
                const plannedLists = await Promise.all(
                    courses.map(course => api.getPlannedSessions(course.id))
                );
                const goalLists = await Promise.all(
                    courses.map(course => api.getGoals(course.id))
                );
                setPlanned(plannedLists.flat());
                setGoals(goalLists.flat());
            } catch (err) {
                setError(errorText(err));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [courses]);

    if (loading) {
        return <p className="tracking-status">Kalender wird geladen...</p>;
    }
    if (error !== null) {
        return <p className="tracking-status">{error}</p>;
    }

    const today = toIsoDate(new Date());
    const lastDay = addDays(7);

    const all: Entry[] = [];
    for (const item of planned) {
        all.push({ kind: 'planned', date: item.date, sortKey: item.date + ' ' + item.startTime, planned: item });
    }
    for (const goal of goals) {
        all.push({ kind: 'goal', date: goal.targetDate, sortKey: goal.targetDate, goal: goal });
    }
    all.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    const overdue = all.filter(entry => {
        return entry.kind === 'goal' && !entry.goal.isCompleted && entry.date < today;
    });

    const todayEntries = all.filter(entry => entry.date === today);

    // Morgen bis heute in 7 Tagen
    const nextEntries = all.filter(entry => entry.date > today && entry.date <= lastDay);

    function labelFor(courseId: string): string {
        const course = courses.find(item => item.id === courseId);
        if (course === undefined) {
            return '';
        }
        return courseLabel(course);
    }

    function courseIdOf(entry: Entry): string {
        if (entry.kind === 'planned') {
            return entry.planned.courseId;
        }
        return entry.goal.courseId;
    }

    function keyOf(entry: Entry): string {
        if (entry.kind === 'planned') {
            return entry.planned.id;
        }
        return entry.goal.id;
    }

    return (
        <>
            {overdue.length > 0 && (
                <div className="calendar-section">
                    <h3>Überfällig</h3>
                    <div className="calendar-list">
                        {overdue.map(entry => (
                            <CalendarRow
                                key={keyOf(entry)}
                                entry={entry}
                                label={labelFor(courseIdOf(entry))}
                                showDate={true}
                                overdue={true}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="calendar-section">
                <h3>
                    Heute
                    <span className="calendar-sub">{dayLabel(today)}</span>
                </h3>
                <div className="calendar-list">
                    {todayEntries.length === 0 && (
                        <p className="calendar-empty">Heute ist nichts geplant.</p>
                    )}
                    {todayEntries.map(entry => (
                        <CalendarRow
                            key={keyOf(entry)}
                            entry={entry}
                            label={labelFor(courseIdOf(entry))}
                            showDate={false}
                            overdue={false}
                        />
                    ))}
                </div>
            </div>

            <div className="calendar-section">
                <h3>Nächste 7 Tage</h3>
                <div className="calendar-list">
                    {nextEntries.length === 0 && (
                        <p className="calendar-empty">In den nächsten 7 Tagen ist nichts geplant.</p>
                    )}
                    {nextEntries.map(entry => (
                        <CalendarRow
                            key={keyOf(entry)}
                            entry={entry}
                            label={labelFor(courseIdOf(entry))}
                            showDate={true}
                            overdue={false}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}