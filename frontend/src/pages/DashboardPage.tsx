
// Übersicht: Timer + Zusammenfassung

import { useEffect, useState } from 'react';
import { api } from '../api';
import { errorText } from '../api/client';
import type { Course } from '../api/types';
import StudyTimer from '../features/tracking/StudyTimer';
import ManualEntry from '../features/tracking/ManualEntry';
import '../features/tracking/tracking.css';

export default function DashboardPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    let trackingContent;
    if(loading) {
        trackingContent = <p className="tracking-status">Kurse werden geladen...</p>;
    } else if (error !== null) {
        trackingContent = <p className="tracking-status">{error}</p>;
    } else if (courses.length === 0) {
        trackingContent = <p className="tracking-status">Lege zuerst auf der Seite Kurse einen Kurs an.</p>;
    } else {
        trackingContent = (
            <div className="tracking-grid">
                <StudyTimer courses={courses} />
                <ManualEntry courses={courses} />
            </div>
        );
    }

    return(
        <div className="dashboard-page">
            <h1>Übersicht</h1>

            <section className="tracking-card">
                <h2>Zeiterfassung</h2>
                {trackingContent}
            </section>

        </div>

    );
}