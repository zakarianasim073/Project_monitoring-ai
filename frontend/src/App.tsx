import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import Layout from './components/Layout';
// Import all your other components: Dashboard, SiteExecution, etc.

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/projects" element={isAuthenticated ? <ProjectList /> : <Navigate to="/login" />} />
        <Route path="/project/:projectId" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/projects" />} />
      </Routes>
    </Router>
  );
}

export default App;
