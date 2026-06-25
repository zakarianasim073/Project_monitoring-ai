import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './components/Login';
import ProjectList from './components/ProjectList';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SiteExecution from './components/SiteExecution';
import LiabilityTracker from './components/LiabilityTracker';

const queryClient = new QueryClient();

function App() {
  const token = localStorage.getItem('token');

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/projects" />} />

          {/* Protected Routes */}
          <Route 
            path="/projects" 
            element={token ? <ProjectList onSwitchRole={() => {}} /> : <Navigate to="/login" />}
          />
          
          <Route 
            path="/project/:projectId/*" 
            element={token ? <Layout /> : <Navigate to="/login" />} 
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="site" element={<SiteExecution />} />
            <Route path="liability" element={<LiabilityTracker />} />
            <Route path="*" element={<Dashboard />} />
          </Route>

          {/* Redirect root */}
          <Route path="/" element={<Navigate to={token ? "/projects" : "/login"} />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
