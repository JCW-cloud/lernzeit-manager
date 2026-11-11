import { useState } from 'react';
import { api } from '../../api';
import { errorText } from '../../api/client';
import type { Course, CourseInput, ExamType } from '../../api/types';
import { EXAM_TYPES, EXAM_TYPE_LABELS } from './examTypes';
import { addMonths, toIsoDate } from '../../lib/format';


interface CourseFormProps {
    onCreated: (course: Course) => void;
}

export default function CourseForm({ onCreated }: CourseFormProps) {
    const [title, setTitle] = useState('');
    const [shortName, setShortName] = useState('');
    const [examType, setExamType] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [hours, setHours] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    
    const minDate = toIsoDate(new Date());
    const maxDate = addMonths(6);

    // Absenden
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);
        setBusy(true);
    

        let minutes: number | null = null;
        if(hours !== ''){
            minutes = Math.round(Number(hours) * 60);
        }

        let exam: ExamType | null = null;
        if (examType !== '') {
            exam = examType as ExamType;
        }

        const input: CourseInput = {
            title: title,
            description: shortName,
            targetDate: targetDate,
            examType: exam,
            examTry: null,
            expectedTimeMinutes: minutes,
        };

        try {
            const created = await api.createCourse(input);
            onCreated(created);

            // Form leeren
            setTitle('');
            setShortName('');
            setExamType('');
            setTargetDate('');
            setHours('');
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }
    }

    // Anzeige
    return(
        <form className="course-form" onSubmit={handleSubmit}>
            <label>
                Titel
                <input
                    type="text"
                    value={title}
                    required
                    maxLength={150}
                    placeholder="z.B. Software Engineering"
                    onChange={event => setTitle(event.target.value)}
                />
            </label>
            <label className="wide">
                Kürzel
                <input
                    type="text"
                    value={shortName}
                    maxLength={20}
                    placeholder="z.B. ISSE01"
                    onChange={event => setShortName(event.target.value)}
                />
            </label>
            <label>
                Prüfungsart
                <select
                    value={examType}
                    onChange={event => setExamType(event.target.value)}
                >
                    <option value="">–</option>
                    {EXAM_TYPES.map(type => (
                        <option key={type} value={type}>
                            {EXAM_TYPE_LABELS[type]}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Zieldatum
                <input
                    type="date"
                    value={targetDate}
                    required
                    min={minDate}
                    max={maxDate}
                    onChange={event => setTargetDate(event.target.value)}
                />
            </label>
            <label>
                Aufwand (h)
                <input
                    type="number"
                    value={hours}
                    min={0.5}
                    max={1666}
                    step={0.5}
                    placeholder="z.B. 150"
                    onChange={event => setHours(event.target.value)}
                />
            </label>

            <button type="submit" disabled={busy}>
                {busy ? 'Speichern...' : 'Kurs anlegen'}
            </button>
            {error !== null && <p className="form-error">{error}</p>}
        </form>
    );
}

