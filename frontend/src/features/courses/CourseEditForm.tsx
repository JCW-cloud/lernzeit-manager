
import { useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, CourseInput, ExamType } from '../../api/types';
import { formatDate } from '../../lib/format';
import { EXAM_TYPES, EXAM_TYPE_LABELS } from './examTypes';

interface CourseEditFormProps {
    course: Course;
    onSaved: (course: Course) => void;
    onCancel: () => void;
    onDeleted: (courseId: string) => void;
}

// Startwerte für die Eingabefelder aus dem Kurs.
function initialShortName(course: Course): string {
    if (course.description === null) {
        return '';
    }
    return course.description;
}

function initialExamType(course: Course): string {
    if (course.examType === null) {
        return '';
    }
    return course.examType;
}

function initialHours(course: Course): string {
    if (course.expectedTimeMinutes === null) {
        return '';
    }
    return String(course.expectedTimeMinutes / 60);
}


export default function CourseEditForm({ course, onSaved, onCancel, onDeleted }: CourseEditFormProps) {

    // ---------- Zustand, vorbefüllt mit den aktuellen Werten -----------

    const [title, setTitle] = useState(course.title);
    const [shortName, setShortName] = useState(initialShortName(course));
    const [examType, setExamType] = useState(initialExamType(course));
    const [hours, setHours] = useState(initialHours(course));

    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);


    // ---------- Speichern ----------------------------------------------

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setBusy(true);

        let minutes: number | null = null;
        if (hours !== '') {
            minutes = Math.round(Number(hours) * 60);
        }

        let exam: ExamType | null = null;
        if (examType !== '') {
            exam = examType as ExamType;
        }

        // PUT
        const input: CourseInput = {
            title: title,
            description: shortName,
            targetDate: course.targetDate,
            examType: exam,
            examTry: course.examTry,
            expectedTimeMinutes: minutes,
        };

        try {
            const updated = await api.updateCourse(course.id, input);
            onSaved(updated);
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }


    // ---------- Löschen ------------------------------------------------

    async function handleDelete() {
        // Sicherheitsabfrage des Browsers. Bei "Abbrechen" passiert nichts.
        const confirmed = window.confirm(
            'Kurs "' + course.title + '" mit allen Zwischenzielen löschen?'
        );
        if (!confirmed) {
            return;
        }

        setError(null);
        setBusy(true);
        try {
            await api.deleteCourse(course.id);
            onDeleted(course.id);
        } catch (err) {
            setError(errorText(err));
            setBusy(false);
        }
    }


    // ---------- Anzeige ------------------------------------------------

    let targetDateText = 'kein Zieldatum';
    if (course.targetDate !== null) {
        targetDateText = formatDate(course.targetDate);
    }

    return (
        <form className="course-edit" onSubmit={handleSubmit}>
            <label>
                Titel
                <input
                    type="text"
                    value={title}
                    required
                    maxLength={150}
                    onChange={event => setTitle(event.target.value)}
                />
            </label>

            <label>
                Kürzel
                <input
                    type="text"
                    value={shortName}
                    maxLength={20}
                    onChange={event => setShortName(event.target.value)}
                />
            </label>

            <label>
                Prüfungsart
                <select value={examType} onChange={event => setExamType(event.target.value)}>
                    <option value="">–</option>
                    {EXAM_TYPES.map(type => (
                        <option key={type} value={type}>{EXAM_TYPE_LABELS[type]}</option>
                    ))}
                </select>
            </label>

            <label>
                Aufwand (h)
                <input
                    type="number"
                    value={hours}
                    min={0.5}
                    max={1666}
                    step={0.5}
                    onChange={event => setHours(event.target.value)}
                />
            </label>

            <div className="course-edit-footer">
                <span className="course-edit-date">
                    Zieldatum: {targetDateText}
                </span>

                <button type="button" className="btn-danger" disabled={busy} onClick={handleDelete}>
                    Kurs löschen
                </button>
                <button type="button" className="btn-secondary" disabled={busy} onClick={onCancel}>
                    Abbrechen
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                    Speichern
                </button>
            </div>

            {error !== null && <p className="form-error">{error}</p>}
        </form>
    );
}
