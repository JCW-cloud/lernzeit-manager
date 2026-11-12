
// Grobplanung

import type { Course } from "../../api/types";
import { formatNumber, formatShortDate, toIsoDate } from '../../lib/format';
import { EXAM_TYPE_LABELS } from '../courses/examTypes';
import { monthIndex, nextMonths } from './months';

const MONTH_COUNT = 7;

interface RoughPlanProps {
    courses: Course[]
}

function subline(course: Course, targetDate: string): string {
    let text = formatShortDate(targetDate);
    if (course.examType !== null) {
        text = text + ' · ' + EXAM_TYPE_LABELS[course.examType];
    }
    return text;
}

// Gesamtspalte
function totalText(course: Course): string {
    if(course.expectedTimeMinutes === null){
        return '-';
    }
    return formatNumber(course.expectedTimeMinutes / 60) + ' h';
}

export default function RoughPlan({ courses }: RoughPlanProps) {
    const months = nextMonths(MONTH_COUNT);
    const today = toIsoDate(new Date());

    const visible = courses.filter(course => {
        return course.targetDate !== null && course.targetDate >= today;
    });

    visible.sort((a, b) => (a.targetDate as string).localeCompare(b.targetDate as string));

    if(visible.length === 0){
        return <p className="planning-status">Keine Kurse mit Zieldatum vorhanden.</p>
    }

    return (
        <div className="rough-plan">

            {/* ---------- Kopfzeile mit Monaten ---------- */}
            <div className="rough-row rough-head">
                {months.map(month => (
                <div key={month.label} className="rough-cell">{month.label}</div>
                ))}
                <div className="rough-cell rough-total">Gesamt</div>
            </div>

            {/* ---------- Eine Zeile pro Kurs ---------- */}
            {visible.map(course => {
                const targetDate = course.targetDate as string;

                let end = monthIndex(targetDate, months[0]);
                if(end > MONTH_COUNT - 1) {
                    end = MONTH_COUNT - 1;
                }
                return (
                    <div key={course.id} className="rough-row">

                    {months.map((month, index) => (
                        <div
                            key={month.label}
                            className="rough-cell"
                            style={{ gridColumn: index + 1 }}
                        />
                    ))}

                        <div
                            className="rough-bar"
                            style={{ gridColumn: '1 / ' + (end + 2) }}
                            title={course.title}
                        >
                            <span className="rough-bar-title">{course.title}</span>
                            <span className="rough-bar-sub">{subline(course, targetDate)}</span>
                        </div>

                        <div className="rough-cell rough-total" style={{ gridColumn: MONTH_COUNT + 1 }}>
                            {totalText(course)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}