
// Eingabezeile für ein neues Zwischenziel: Titel, Aufwand, Datum.

import { useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { LearningGoal, LearningGoalInput } from '../../api/types';

interface GoalFormProps {
    courseId: string;
    minDate: string;    // frühestens heute
    maxDate: string;    // spätestens Zieldatum des Kurses
    onCreated: (goal: LearningGoal) => void;
    onCancel: () => void;
}

export default function GoalForm({ courseId, minDate, maxDate, onCreated, onCancel }: GoalFormProps) {

    const [title, setTitle] = useState('');
    const [hours, setHours] = useState('');
    const [targetDate, setTargetDate] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setBusy(true);

        let targetHours: number | null = null;
        if (hours !== '') {
            targetHours = Number(hours);
        }

        const input: LearningGoalInput = {
            title: title,
            description: null,
            startDate: minDate,       // unsichtbar: heute
            targetDate: targetDate,
            targetHours: targetHours,
        };

        try {
            const created = await api.createGoal(courseId, input);
            onCreated(created);
        } catch (err) {
            setError(errorText(err));
            setBusy(false);
        }
    }

    return (
        <form className="goal-form" onSubmit={handleSubmit}>
            {/* autoFocus: Cursor steht sofort im Titelfeld */}
            <input
                type="text"
                value={title}
                required
                maxLength={150}
                placeholder="Neues Zwischenziel"
                autoFocus
                onChange={event => setTitle(event.target.value)}
            />
            <input
                type="number"
                value={hours}
                min={0.5}
                step={0.5}
                placeholder="h"
                onChange={event => setHours(event.target.value)}
            />
            <input
                type="date"
                value={targetDate}
                required
                min={minDate}
                max={maxDate}
                onChange={event => setTargetDate(event.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={busy} title="Speichern">
                ✓
            </button>
            <button type="button" className="icon-button" disabled={busy} title="Abbrechen" onClick={onCancel}>
                ×
            </button>

            {error !== null && <p className="form-error">{error}</p>}
        </form>
    );
}
