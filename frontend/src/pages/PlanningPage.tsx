
// Grobplanung + Monatsplanung

import { useEffect, useState } from 'react';
import { api } from '../api';
import { errorText } from '../api/client';
import type { Course } from '../api/types';
import RoughPlan from '../features/planning/RoughPlan';
import MonthPlan from '../features/planning/MonthPlan';
import '../features/planning/planning.css';


export default function PlanningPage() {
    const [ courses, setCourses ] = useState<Course[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState<string | null>(null);

    // Kurse laden bei öffnen der Seite
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

    let roughContent;
    let monthContent;
    if(loading) {
        roughContent = <p className="planning-status">Kurse werden geladen...</p>;
        monthContent = null;
    } else if (error !== null) {
        roughContent = <p className="planning-status">{error}</p>;
        monthContent = null;
    } else {
        roughContent = <RoughPlan courses={courses} />;
        monthContent = <MonthPlan courses={courses} />;
    }
    
    return(
        <div className="planning-page">
            <h1>Planung</h1>

            <section>
                <h2>Grobplanung</h2>
                {roughContent}
            </section>

            <section>
                <h2>Monatsplanung</h2>
                {monthContent}
            </section>
        </div>
        
    );
}