//Course Card eine Karte pro Kurs

import { useEffect, useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, LearningGoal } from '../../api/types';
import { addMonths, formatShortDate, formatNumber, toIsoDate } from '../../lib/format';
import { EXAM_TYPE_LABELS } from './examTypes';
import CourseEditForm from './CourseEditForm';
import GoalRow from './GoalRow';
import GoalForm from './GoalForm';

interface CourseCardProps {
    course: Course;
    onUpdated: (course: Course) => void;
    onDeleted: (courseId: string) => void;
}

// -----------------------------------Hilfsfunktionen-----------------------------------------
// Überschrift (mit/ohne Kürzel)
function headline(course: Course): string {
    if(course.description === null) {
        return course.title;
    }
    return course.description + ' - ' + course.title;
}

function sortByDate(list: LearningGoal[]): LearningGoal[] {
    return [...list].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
}

// Zusatzinfo
function meta(course: Course, plannedHours: number): string {
    const parts: string[] = [];
    
    if(course.examType !== null) {
        parts.push(EXAM_TYPE_LABELS[course.examType]);
    }
    if(course.expectedTimeMinutes !== null) {
        const courseHours = course.expectedTimeMinutes / 60;
        parts.push(formatNumber(plannedHours) + ' von ' + formatNumber(courseHours) + ' h verplant');
    } else if(plannedHours > 0) {
        parts.push(formatNumber(plannedHours) + ' h verplant');
    }
    return parts.join(' · ');
}

export default function CourseCard({ course, onUpdated, onDeleted }: CourseCardProps) {

    const [goals, setGoals] = useState<LearningGoal[]>([]);
    const [goalsLoading, setGoalsLoading] = useState(true);
    const [goalsError, setGoalsError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);   // Edit
    const [adding, setAdding] = useState(false);     // "+ Ziel hinzufügen"

    // ------------------ Zwischenziele laden -------------------------
    useEffect(() => {
        async function load() {
            try {
                const result = await api.getGoals(course.id);
                setGoals(result);
            } catch (err) {
                setGoalsError(errorText(err));
            } finally {
                setGoalsLoading(false);
            }
        }
        load();
    }, [course.id]);

    // ---------- Reaktionen auf Änderungen ------------------------------
    function handleGoalCreated(goal: LearningGoal) {
        setGoals(prev => sortByDate([...prev, goal]));
        setAdding(false);
    }

    function handleGoalChanged(changed: LearningGoal) {
        setGoals(prev => prev.map(goal => {
            if (goal.id === changed.id) {
                return changed;
            }
            return goal;
        }));
    }

    function handleGoalDeleted(goalId: string) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }

    function handleSaved(updated: Course) {
        setEditing(false);
        onUpdated(updated);
    }    

    // -------------------- Berechnungen -----------------------------
    const completedCount = goals.filter(goal => goal.isCompleted).length;

    let plannedHours = 0;
    for (const goal of goals) {
        if(goal.targetHours !== null) {
            plannedHours = plannedHours + goal.targetHours;
        }
    }

    const today = toIsoDate(new Date());
    let maxGoalDate = addMonths(6);
    if ( course.targetDate !== null) {
        maxGoalDate = course.targetDate;
    }

    let targetDateText = 'kein Zieldatum';
    if (course.targetDate !== null) {
        targetDateText = formatShortDate(course.targetDate);
    }

    // ------------------------ Kopfzeile Modus -----------------------
    let header;
    if(editing) {
        header = (
            <CourseEditForm 
                course={course}
                onSaved={handleSaved}
                onCancel={() => setEditing(false)}
                onDeleted={onDeleted}
            />
        );
    } else {
        const metaText = meta(course, plannedHours);
        header = (
            <header className="course-card-header">
                <h2>{headline(course)}</h2>
                {metaText !== '' && <span className="course-card-meta">{metaText}</span>}

                {goals.length > 0 && (
                <span className="course-card-progress">
                    {completedCount} von {goals.length} erreicht
                </span>
                )}

                <button
                className="icon-button course-card-edit"
                title="Kurs bearbeiten"
                onClick={() => setEditing(true)}
                >
                ✎
                </button>
            </header>
        );
    }

    // ------------------------------- Zwischenziele ---------------------
    let goalContent;
    if(goalsLoading) {
        goalContent = <p className="course-card-empty">Ziele werden geladen …</p>;
    } else if (goalsError !== null) {
        goalContent = <p className="course-card-empty">{goalsError}</p>;
    } else {
        goalContent = (
            <div className="goal-list">
                {goals.length === 0 && !adding && (
                    <p className="course-card-empty">Noch keine Zwischenziele.</p>
                )}

                {goals.map(goal => (
                    <GoalRow 
                        key={goal.id}
                        goal={goal}
                        today={today}
                        onChanged={handleGoalChanged}
                        onDeleted={handleGoalDeleted}
                    />
                ))}

                {adding ? (
                    <GoalForm
                        courseId={course.id}
                        minDate={today}
                        maxDate={maxGoalDate}
                        onCreated={handleGoalCreated}
                        onCancel={() => setAdding(false)}
                    />
                ) : (
                    <button className="goal-add" onClick={() => setAdding(true)}>
                        + Ziel hinzufügen
                    </button>
                )}
            </div>
        );
    }




    // ----------------------------- Gesamte Karte -------------------------
    return(
        <article className="course-card">
            {header}
            {goalContent}
            <div className="course-card-final">
                <span className="course-card-diamond">◆</span>
                <span>Kurs abgeschlossen</span>
                <span className="course-card-date">{targetDateText}</span>
            </div>  
        </article>
    );
}