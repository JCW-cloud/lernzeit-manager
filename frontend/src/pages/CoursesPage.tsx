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

    // ---------- Änderungen aus Formular und Karten ---------------------
    function handleCreated(course: Course) {
        setCourses(prev => sortByTitle([...prev, course]));
    }

    function handleUpdated(updated: Course) {
        setCourses(prev => {
            const replaced = prev.map(course => {
                if (course.id === updated.id) {
                    return updated;
                }
                return course;
            });
            // Neu sortieren, falls sich der Titel geändert hat
            return sortByTitle(replaced);
        });
    }

    function handleDeleted(courseId: string) {
        setCourses(prev => prev.filter(course => course.id !== courseId));
    }

    // --------------- Anzeige -------------------
    let content;
    if(loading) {
        content = <p className="courses-status">Kurse werden geladen ...</p>
    } else if (error !== null) {
        content = <p className="courses-status">{error}</p>
    } else if (courses.length === 0) {
        content = <p className="courses-status">Noch keine Kurse angelegt.</p>
    } else {
        content = (
            <div className="course-list">
                {courses.map(course => (
                    <CourseCard 
                        key={course.id} 
                        course={course}
                        onUpdated={handleUpdated}
                        onDeleted={handleDeleted}
                    />
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