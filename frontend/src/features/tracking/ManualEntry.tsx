
// Manuell Lernzeiten nachtragen

import { useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course } from '../../api/types';
import { courseLabel } from './sessionTime';

interface ManualEntryProps {
    courses: Course[];
}

export default function ManualEntry({ courses }: ManualEntryProps) {
    const [courseId, setCourseId] = useState('');
    const [minutes, setMinutes] = useState('');

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setMessage(null);

        // Kursname für Rückfrage und Bestätigung
        let label = '';
        const course = courses.find(item => item.id === courseId);
        if (course !== undefined) {
            label = courseLabel(course);
        }

        // Sicherheitsabfrage
        const confirmed = window.confirm(minutes + ' Minuten für ' + label + ' erfassen?');
        if (!confirmed) {
            return;
        }

        setBusy(true);
        try {
            await api.createManualSession(courseId, Number(minutes));
            setMessage(minutes + ' min für ' + label + ' erfasst.');
            setMinutes('');
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="tracking-column" onSubmit={handleSubmit}>
            <h3>Manuell erfassen</h3>

            <select
                value={courseId}
                required
                onChange={event => setCourseId(event.target.value)}
            >
                <option value="">Kurs wählen …</option>
                {courses.map(course => (
                    <option key={course.id} value={course.id}>
                        {courseLabel(course)} – {course.title}
                    </option>
                ))}
            </select>

            <label>
                Minuten
                {/* 1 bis 1440 Minuten, gleich Backend */}
                <input
                    type="number"
                    value={minutes}
                    required
                    min={1}
                    max={1440}
                    step={1}
                    onChange={event => setMinutes(event.target.value)}
                />
            </label>

            <button type="submit" className="btn-submit" disabled={busy}>
                {busy ? 'Speichern …' : 'Erfassen'}
            </button>

            {message !== null && <p className="tracking-success">{message}</p>}
            {error !== null && <p className="tracking-error">{error}</p>}
        </form>
    );
}