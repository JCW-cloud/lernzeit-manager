import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../../lib/auth';
import './Layout.css';
import { useReminders } from '../../features/reminders/useReminders';
import ReminderBanner from '../../features/reminders/ReminderBanner';

// Aktuelle Seite
function linkClass({ isActive }: { isActive: boolean}): string {
    if(isActive) {
        return 'nav-link active';
    }
    return 'nav-link';
}

export default function Layout() {
    const navigate = useNavigate();
    const reminders = useReminders();

    function handleLogout() {
        clearToken();
        navigate('/login', {replace: true});
    }


    return(
        <>
            <nav className="nav">
                <span className="nav-title">Lernzeit-Manager</span>

                <NavLink to="/" end className={linkClass}>Übersicht</NavLink>
                <NavLink to="/kurse" className={linkClass}>Kurse</NavLink>
                <NavLink to="/planung" className={linkClass}>Planen</NavLink>

                <button className="nav-logout" onClick={handleLogout}>
                    Abmelden
                </button>
            </nav>
            <ReminderBanner reminders={reminders} />
            <main className="content">
                <Outlet />
            </main>
        </>
    );
}