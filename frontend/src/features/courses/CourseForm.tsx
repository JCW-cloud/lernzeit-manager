import { useState } from 'react';
import type { CourseInput } from '../../api/types';

const EXAM_TYPES = ['Klausur', 'Hausarbeit', 'Seminararbeit', 'Projektbericht', 'Fallstudie', 'Portfolio']
const EXAM_TRY = ['Erstversuch', 'Zweitversuch', 'Drittversuch'];

const emptyForm: CourseInput = {
    courseTitle: '',
    courseShortName: '',
    examType: EXAM_TYPES[0],
    examTry: EXAM_TRY[0],
};

type Props = {
    onSubmit: (input: CourseInput) => void;
};

export default function CourseForm({ onSubmit }: Props) {
    const [form, setForm] = useState<CourseInput>(emptyForm);

    function updateField<K extends keyof CourseInput>(key: K, value: CourseInput[K]) {
        setForm({ ...form, [key]: value});
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        onSubmit(form);
        setForm(emptyForm);
    }

    return(
        <form className="course-form" onSubmit={handleSubmit}>
            <label>
                Kürzel
                <input
                    value={form.courseShortName}
                    onChange={event => updateField('courseShortName', event.target.value)}
                    required
                />
            </label>
            <label className="wide">
                Kurstitel
                <input
                    value={form.courseTitle}
                    onChange={event => updateField('courseTitle', event.target.value)}
                    required
                />
            </label>
            <label>
                Prüfungsart
                <select
                    value={form.examType}
                    onChange={event => updateField('examType', event.target.value)}
                >
                    {EXAM_TYPES.map(type => (
                        <option key={type}>{type}</option>
                    ))}
                </select>
            </label>
            <label>
                Versuch
                <select
                    value={form.examTry}
                    onChange={event => updateField('examTry', event.target.value)}
                >
                    {EXAM_TRY.map(attempt =>(
                        <option key={attempt}>{attempt}</option>
                    ))}
                </select>
            </label>
            <button type="submit">Kurs anlegen</button>
        </form>
    );
}

