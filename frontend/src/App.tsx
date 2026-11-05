import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/layout/RequireAuth';

import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';

import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import PlanningPage from './pages/PlanningPage';




function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/kurse" element={<CoursesPage />} />
            <Route path="/planung" element={<PlanningPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
