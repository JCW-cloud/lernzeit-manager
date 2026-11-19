
// Monatsplanung: Formular, Monats-Tabs, Liste mit Lernzeiten + Zwischenzielen

import { useEffect, useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, LearningGoal, PlannedStudySession } from '../../api/types';
import { formatNumber, formatShortDate, toIsoDate } from '../../lib/format';
import { courseLabel } from '../tracking/sessionTime';
import { nextMonths } from './months';
import { longMonthLabel, monthPrefix } from './time';
import PlannedSessionForm from './PlannedSessionForm';
import PlannedRow from './PlannedRow';

const MONTH_COUNT = 7;

interface MonthPlanProps {
    courses: Course[];
}

type Entry =
    | { kind: 'planned'; sortKey: string; planned: PlannedStudySession }
    | { kind: 'goal'; sortKey: string; goal: LearningGoal };

export default function MonthPlan({ courses }: MonthPlanProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [planned, setPlanned] = useState<PlannedStudySession[]>([]);
    const [goals, setGoals] = useState<LearningGoal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Daten laden
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


    // Nach dem Anlegen: Lernzeiten dieses Kurses neu laden

    async function handleCreated(courseId: string) {
        const fresh = await api.getPlannedSessions(courseId);

        setPlanned(prev => {
            const others = prev.filter(item => item.courseId !== courseId);
            return [...others, ...fresh];
        });
    }

    function handleDeleted(id: string) {
        setPlanned(prev => prev.filter(item => item.id !== id));
    }


    // Berechnungen

    const today = toIsoDate(new Date());
    const months = nextMonths(MONTH_COUNT);

    // Nur Kurse im Formular, deren Zieldatum noch nicht vorbei ist
    const activeCourses = courses.filter(course => {
        return course.targetDate !== null && course.targetDate >= today;
    });

    function labelFor(courseId: string): string {
        const course = courses.find(item => item.id === courseId);
        if (course === undefined) {
            return '';
        }
        return courseLabel(course);
    }


    // Formular
    const form = <PlannedSessionForm courses={activeCourses} onCreated={handleCreated} />;

    if (loading) {
        return (
            <>
                {form}
                <p className="planning-status">Einträge werden geladen...</p>
            </>
        );
    }

    if (error !== null) {
        return (
            <>
                {form}
                <p className="planning-status">{error}</p>
            </>
        );
    }


    // Einträge des gewählten Monats
    const month = months[selectedIndex];
    const prefix = monthPrefix(month.year, month.month);

    const entries: Entry[] = [];

    for (const item of planned) {
        if (item.date.startsWith(prefix)) {
            entries.push({ kind: 'planned', sortKey: item.date + ' ' + item.startTime, planned: item });
        }
    }

    for (const goal of goals) {
        if (goal.targetDate.startsWith(prefix)) {
            entries.push({ kind: 'goal', sortKey: goal.targetDate, goal: goal });
        }
    }

    entries.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Summe der geplanten Minuten im Monat
    let totalMinutes = 0;
    for (const entry of entries) {
        if (entry.kind === 'planned') {
            totalMinutes = totalMinutes + entry.planned.plannedDurationMinutes;
        }
    }

    return (
        <>
            {form}

            <div className="month-tabs">
                {months.map((item, index) => {
                    let tabClass = 'month-tab';
                    if (index === selectedIndex) {
                        tabClass = tabClass + ' active';
                    }
                    return (
                        <button key={item.label} className={tabClass} onClick={() => setSelectedIndex(index)}>
                            {longMonthLabel(item.year, item.month)}
                        </button>
                    );
                })}
            </div>

            <div className="month-list">
                {entries.length === 0 && <p className="entry-empty">Keine Einträge in diesem Monat.</p>}

                {entries.map(entry => {
                    if (entry.kind === 'planned') {
                        return (
                            <PlannedRow
                                key={entry.planned.id}
                                planned={entry.planned}
                                label={labelFor(entry.planned.courseId)}
                                today={today}
                                onDeleted={handleDeleted}
                            />
                        );
                    }

                    // Zwischenziel
                    const goal = entry.goal;
                    let rowClass = 'entry-row goal';
                    let icon = '○';
                    if (goal.isCompleted) {
                        icon = '✓';
                    }
                    if (goal.targetDate < today) {
                        rowClass = rowClass + ' past';
                    }
                    if (goal.targetDate < today && !goal.isCompleted) {
                        rowClass = rowClass + ' overdue';
                    }

                    return (
                        <div key={goal.id} className={rowClass}>
                            <span className="entry-date">{formatShortDate(goal.targetDate)}</span>
                            <span className="entry-course">{labelFor(goal.courseId)}</span>
                            <span className="entry-goal">
                                <span className="goal-icon">{icon}</span>
                                {goal.title}
                            </span>
                            <span />
                            <span />
                        </div>
                    );
                })}

                <div className="month-sum">
                    Gesamt im Monat: <strong>{formatNumber(totalMinutes / 60)} h</strong>
                </div>
            </div>
        </>
    );
}