import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
    return(
        <div className="Layout">
            <nav className="nav">
                <div className="nav-title">Lernzeit-Manager</div>
                <NavLink to="/">Übersicht</NavLink>
                <NavLink to="/kurse">Kurse</NavLink>
                <NavLink to="/ziele">Ziele</NavLink>
                <NavLink to="/planung">Grobplanung</NavLink>
                <NavLink to="/kalender">Monatsplanung</NavLink>
                <NavLink to="/timer">Timer</NavLink>
            </nav>
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}