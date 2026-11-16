
// Zeile pro geplanter Lernzeit (löschbar)

import { useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { PlannedStudySession } from '../../api/types';
import { formatNumber, formatShortDate } from '../../lib/format';
import { minutesToTime, timeToMinutes } from './time';
import { announcePlannedChange } from '../reminders/events';

interface PlannedRowProps {
    planned: PlannedStudySession;
    label: string;
    today: string;
    onDeleted: (id: string) => void;
}

export default function PlannedRow({ planned, label, today, onDeleted }: PlannedRowProps) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setError(null);
        setBusy(true);
        try {
            await api.deletePlannedSession(planned.courseId, planned.id);
            announcePlannedChange();
            onDeleted(planned.id);
        } catch (err) {
            setError(errorText(err));
            setBusy(false);
        }
    }

    const start = timeToMinutes(planned.startTime);
    const end = start + planned.plannedDurationMinutes;
    const timeText = minutesToTime(start) + '-' + minutesToTime(end);

    // vergangenes grau
    let rowClass = 'entry-row';
    if (planned.date < today) {
        rowClass = rowClass + ' past';
    }

    return (
        <div className={rowClass}>
            <span className="entry-date">{formatShortDate(planned.date)}</span>
            <span className="entry-course">{label}</span>
            <span className="entry-time">{timeText}</span>
            <span className="entry-hours">{formatNumber(planned.plannedDurationMinutes / 60)} h</span>
            <button className="entry-delete" title="Lernzeit löschen" disabled={busy} onClick={handleDelete}>
                ×
            </button>
            {error !== null && <p className="plan-error">{error}</p>}
        </div>
    );

}