import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import GoalsPage from './pages/GoalsPage';
import PlanningPage from './pages/PlanningPage';
import CalendarPage from './pages/CalendarPage';
import TimerPage from './pages/TimerPage';



function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/kurse" element={<CoursesPage />} />
          <Route path="/ziele" element={<GoalsPage />} />
          <Route path="/planung" element={<PlanningPage />} />
          <Route path="/kalender" element={<CalendarPage />} />
          <Route path="/Timer" element={<TimerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
