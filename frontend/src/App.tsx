import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import Layout from './components/Layout';
import { UserRole } from './types';

const queryClient = new QueryClient();

function App() {
  const token = localStorage.getItem('token');
  const [, setRoleUpdate] = useState(0);

  const handleSwitchRole = (role: UserRole) => {
    localStorage.setItem('currentRole', role);
    setRoleUpdate(prev => prev + 1);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/projects" />} />

          {/* Protected Routes */}
          <Route 
            path="/projects" 
            element={token ? <ProjectList onSwitchRole={handleSwitchRole} /> : <Navigate to="/login" />}
          />
          
          <Route 
            path="/project/:projectId/*" 
            element={token ? <Layout /> : <Navigate to="/login" />} 
          />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to={token ? "/projects" : "/login"} />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
