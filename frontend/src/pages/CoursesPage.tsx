import { useState } from 'react';
import type { Course, CourseInput } from '../api/types';
import { courses as mockCourses } from '../api/mock';
import CourseForm from '../features/courses/CourseForm';
import CourseList from '../features/courses/CourseList';
import '../features/courses/courses.css';

export default function CoursesPage(){
    const [courses, setCourses] = useState<Course[]>(mockCourses);

    function addCourse(input: CourseInput) {
        const ids = courses.map(course => course.id);
        const nextId = Math.max(0,...ids) + 1;

        const newCourse: Course = {
            ...input,
            id: nextId,
            listId: 1,
            creationDate: new Date().toString(),
            examPassed: false,
            grade: null,
        };

        setCourses([...courses, newCourse]);
    }

    return(
        <>
            <h1>Kurse</h1>
            
            <section className="card">
                <h2>Neuer Kurs</h2>
                <CourseForm onSubmit={addCourse} />
            </section>

            <section className="card">
                <h2>Meine Kurse</h2>
                <CourseList courses={courses} />
            </section>
        </>
    );
}