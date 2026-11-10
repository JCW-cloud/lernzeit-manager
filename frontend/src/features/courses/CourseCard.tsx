//Course Card eine Karte pro Kurs

import type { Course } from '../../api/types';
import { formatHours, formatShortDate } from '../../lib/format';
import { EXAM_TYPE_LABELS } from './examTypes';

interface CourseCardProps {
    course: Course;
}

// Überschrift (mit/ohne Kürzel)
function headline(course: Course): string {
    if (course.description === null) {
        return course.title;
    }
    return course.description + ' - ' + course.title;
}

// Zusatzinfo
function meta(course: Course): string {
    const parts: string[] = [];
    
    if(course.examType !== null) {
        parts.push(EXAM_TYPE_LABELS[course.examType]);
    }
    if(course.expectedTimeMinutes !== null) {
        parts.push(formatHours(course.expectedTimeMinutes));
    }
    return parts.join(' · ');
}

export default function CourseCard({ course }: CourseCardProps) {
    // Zieldatum
    let targetDateText = 'kein Zieldatum';
    if(course.targetDate !== null ) {
        targetDateText = formatShortDate(course.targetDate);
    }

    const metaText = meta(course);

    return(
        <article className="course-card">
            
            {/* Kopfzeile */}
            <header className="course-card-header">
                <h2>{headline(course)}</h2>
                {metaText !== '' && <span className="course-card-meta">{metaText}</span>}
                {/* später 2 von 3 erreicht */}
            </header>
            
            {/* Zwischenziele */}
            <p className="course-card-empty">Noch keine Zwischenziele.</p>
            
            {/* Endziel */}
            <div className="course-card-final">
                <span className="course-card-diamond">◆</span>
                <span>Kurs abgeschlossen</span>
                <span className="course-card-date">{targetDateText}</span>
            </div>


        </article>
    );
}