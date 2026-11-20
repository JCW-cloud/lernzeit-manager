
// Übersicht: Timer + Zusammenfassung

import { Link } from 'react-router-dom'; 
import { useEffect, useState } from 'react';
import { api } from '../api';
import { errorText } from '../api/client';
import type { Course } from '../api/types';
import StudyTimer from '../features/tracking/StudyTimer';
import ManualEntry from '../features/tracking/ManualEntry';
import CourseSummary from '../features/overview/CourseSummary';
import CalendarOverview from '../features/overview/CalendarOverview';
import '../features/tracking/tracking.css';
import '../features/overview/overview.css';

export default function DashboardPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);   // Hochzählen -> CourseSummary lädt neu

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

    function handleRecorded() {
        setRefreshKey(prev => prev + 1);
    }

    let trackingContent;
    let summaryContent;
    if(loading) {
        trackingContent = <p className="tracking-status">Kurse werden geladen...</p>;
        summaryContent = null;
    } else if (error !== null) {
        trackingContent = <p className="tracking-status">{error}</p>;
        summaryContent = null;
    } else if (courses.length === 0) {
        trackingContent = <p className="tracking-status">Lege zuerst einen Kurs an: <Link to="/kurse">Kurs anlegen</Link></p>;
        summaryContent = <p className="tracking-status">Noch keine Kurse vorhanden.</p>;
    } else {
        trackingContent = (
            <div className="tracking-grid">
                <StudyTimer courses={courses} onRecorded={handleRecorded} />
                <ManualEntry courses={courses} onRecorded={handleRecorded} />
            </div>
        );
        summaryContent = <CourseSummary courses={courses} refreshKey={refreshKey} />;
    }

    const showOverviews = !loading && error === null;

    return(
        <div className="dashboard-page">
            <h1>Übersicht</h1>

            <section className="tracking-card">
                <h2>Zeiterfassung</h2>
                {trackingContent}
            </section>
            {showOverviews && (
                <>
                    <section className="summary-card">
                        <h2>Kalenderübersicht</h2>
                        <CalendarOverview courses={courses} />
                    </section>

                    <section className="summary-card">
                        <h2>Kursübersicht</h2>
                        {summaryContent}
                    </section>
                </>
            )}

        </div>

    );
}