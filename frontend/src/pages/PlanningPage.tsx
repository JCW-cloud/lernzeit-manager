
// Grobplanung + Monatsplanung

import { useEffect, useState } from 'react';
import { api } from '../api';
import { errorText } from '../api/client';
import type { Course } from '../api/types';
import RoughPlan from '../features/planning/RoughPlan';
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
    if(loading) {
        roughContent = <p className="planning-status">Kurse werden geladen...</p>;
    } else if (error !== null) {
        roughContent = <p className="plannung-status">{error}</p>;
    } else {
        roughContent = <RoughPlan courses={courses} />;
    }
    
    return(
        <div className="planning-page">
            <h1>Planung</h1>

            <section>
                <h2>Grobplanung</h2>
                {roughContent}
            </section>

            <section>
                <h2>Monatsplaung</h2>
                <p className="planning-status">Folgt...</p>
            </section>
        </div>
        
    );
}