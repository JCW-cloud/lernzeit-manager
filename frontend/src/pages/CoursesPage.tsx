import { useEffect, useState } from 'react';
import { api } from '../api';
import { errorText } from '../api/client';
import type { Course } from '../api/types';
import CourseForm from '../features/courses/CourseForm';
import CourseCard from '../features/courses/CourseCard';
import '../features/courses/courses.css';

function sortByTitle(list: Course[]): Course[] {
    return [...list].sort((a,b) => a.title.localeCompare(b.title, 'de'));
}

export default function CoursesPage(){
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Kurse beim öffnen der Seite laden
    useEffect(() => {
        async function load() {
            try {
                const result = await api.getCourses();
                setCourses(result);
            } catch (err) {
                setError(errorText(err));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // neuer Kurs
    function handleCreated(course: Course) {
        setCourses(sortByTitle([...courses, course]));
    }

    // Anzeige
    let content;
    if(loading) {
        content = <p className="courses-status">Kurse werden geladen</p>
    } else if (error !== null) {
        content = <p className="courses-status">{error}</p>
    } else if (courses.length === 0) {
        content = <p className="courses-status">Noch keine Kurse angelegt.</p>
    } else {
        content = (
            <div className="course-list">
                {courses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>
        );
    }

    return(
        <div className="courses-page">
            <h1>Kurse</h1>
            <CourseForm onCreated={handleCreated} />
            {content}
        </div>
    );
}