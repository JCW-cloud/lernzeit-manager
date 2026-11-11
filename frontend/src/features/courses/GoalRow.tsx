
// Eine Zeile pro Zwischenziel: Checkbox, Titel, Aufwand, Datum, Löschen.


import { useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { LearningGoal } from '../../api/types';
import { formatNumber, formatShortDate } from '../../lib/format';

interface GoalRowProps {
    goal: LearningGoal;
    today: string;    // "2026-11-10", für die Überfällig-Prüfung
    onChanged: (goal: LearningGoal) => void;
    onDeleted: (goalId: string) => void;
}

export default function GoalRow({ goal, today, onChanged, onDeleted }: GoalRowProps) {

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);


    // ---------- Abhaken / wieder öffnen --------------------------------

    async function handleToggle() {
        setError(null);
        setBusy(true);
        try {
            // !goal.isCompleted: genau das Gegenteil vom aktuellen Zustand
            const updated = await api.setGoalCompleted(goal.courseId, goal.id, !goal.isCompleted);
            onChanged(updated);
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }


    // ---------- Löschen ------------------------------------------------

    async function handleDelete() {
        setError(null);
        setBusy(true);
        try {
            await api.deleteGoal(goal.courseId, goal.id);
            onDeleted(goal.id);
        } catch (err) {
            setError(errorText(err));
            setBusy(false);
        }
    }


    // ---------- Anzeige ------------------------------------------------

    // Überfällig: nicht erledigt und Datum vor heute.
    // Datumstexte "2026-11-05" < "2026-11-10" lassen sich direkt vergleichen.
    const overdue = !goal.isCompleted && goal.targetDate < today;

    let rowClass = 'goal-row';
    if (overdue) {
        rowClass = rowClass + ' overdue';
    }

    let hoursText = '';
    if (goal.targetHours !== null) {
        hoursText = formatNumber(goal.targetHours) + ' h';
    }

    return (
        <div className={rowClass}>
            <input
                type="checkbox"
                checked={goal.isCompleted}
                disabled={busy}
                onChange={handleToggle}
            />
            <span className="goal-title">{goal.title}</span>
            <span className="goal-hours">{hoursText}</span>
            <span className="goal-date">{formatShortDate(goal.targetDate)}</span>
            <button
                className="icon-button"
                title="Ziel löschen"
                disabled={busy}
                onClick={handleDelete}
            >
                ×
            </button>

            {error !== null && <p className="form-error">{error}</p>}
        </div>
    );
}
