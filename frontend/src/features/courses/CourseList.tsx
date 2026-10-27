
import type { Course } from '../../api/types';
import { formatDate } from '../../lib/format';

type Props = {
    courses: Course[];
};

export default function CourseList({ courses }: Props) {
    if (courses.length === 0){
        return <p className="empty">Kursliste ist leer.</p>;
    }
    return (
        <table className="course-list">
            <thead>
                <tr>
                    <th>Kürzel</th>
                    <th>Kurstitel</th>
                    <th>Prüfungsart</th>
                    <th>Versuch</th>
                    <th>Status</th>
                    <th>Note</th>
                    <th>Angelegt</th>
                </tr>
            </thead>
            <tbody>
                {courses.map(c => (
                    <tr key={c.id}>
                        <td>{c.courseShortName}</td>
                        <td>{c.courseTitle}</td>
                        <td>{c.examType}</td>
                        <td>{c.examTry}</td>
                        <td>{c.examPassed
                            ? <span className="badge done">Bestanden</span>
                            : <span className="badge open">Offen</span>}
                        </td>
                        <td>{c.grade !== null ? c.grade.toFixed(1) : '-'}</td>
                        <td>{formatDate(c.creationDate)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}