
// Formular: geplante Lernzeit mit Kurs + Datum + Von + Bis

import { useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, PlannedStudySessionInput } from '../../api/types';
import { addMonths, formatShortDate, toIsoDate } from '../../lib/format';
import { courseLabel } from '../tracking/sessionTime';
import { timeToMinutes } from './time';
import { announcePlannedChange } from '../reminders/events';

interface PlannedSessionFormProps {
    courses: Course[];                               // nur Kurse mit Zieldatum ab heute
    onCreated: (courseId: string) => Promise<void>;  // Monatsplanung lädt dann neu
}

export default function PlannedSessionForm({ courses, onCreated }: PlannedSessionFormProps) {

    const [courseId, setCourseId] = useState('');
    const [date, setDate] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Frühestens heute, spätestens das Zieldatum des gewählten Kurses
    const minDate = toIsoDate(new Date());
    let maxDate = addMonths(6);
    const selected = courses.find(course => course.id === courseId);
    if (selected !== undefined && selected.targetDate !== null) {
        maxDate = selected.targetDate;
    }

    // ---------- Absenden ----------

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setMessage(null);

        // Dauer aus Von und Bis
        const fromMinutes = timeToMinutes(from);
        const toMinutes = timeToMinutes(to);
        if (toMinutes <= fromMinutes) {
            setError('"Bis" muss nach "Von" liegen.');
            return;
        }

        const input: PlannedStudySessionInput = {
            date: date,
            startTime: from + ':00',   // Backend erwartet Sekunden, z. B. "13:00:00"
            plannedDurationMinutes: toMinutes - fromMinutes,
            note: null,
        };

        setBusy(true);
        try {
            await api.createPlannedSession(courseId, input);
            await onCreated(courseId);
            announcePlannedChange();

            // Bestätigung
            setMessage('Lernzeit am ' + formatShortDate(date) + ' hinzugefügt.');

            // Kurs und Datum bleiben
            setFrom('');
            setTo('');
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }

    // ---------- Anzeige ----------

    return (
        <form className="plan-form" onSubmit={handleSubmit}>
            <label>
                Kurs
                <select value={courseId} required onChange={event => setCourseId(event.target.value)}>
                    <option value="">Kurs wählen...</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>
                            {courseLabel(course)} – {course.title}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Datum
                <input
                    type="date"
                    value={date}
                    required
                    min={minDate}
                    max={maxDate}
                    onChange={event => setDate(event.target.value)}
                />
            </label>

            <label>
                Von
                <input type="time" value={from} required onChange={event => setFrom(event.target.value)} />
            </label>

            <label>
                Bis
                <input type="time" value={to} required onChange={event => setTo(event.target.value)} />
            </label>

            <button type="submit" disabled={busy}>
                {busy ? 'Speichern...' : 'Lernzeit hinzufügen'}
            </button>

            {message !== null && <p className="plan-message">{message}</p>}
            {error !== null && <p className="plan-error">{error}</p>}
        </form>
    );
}