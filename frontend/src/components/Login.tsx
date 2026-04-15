import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('123456');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/projects');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      alert('Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <div
              className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center"
              role="img"
              aria-label="BuildTrack AI Logo"
            >
              <span className="text-white text-4xl font-bold">B</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-center text-slate-900 mb-2">BuildTrack AI</h1>
          <p className="text-slate-500 text-center mb-10">Construction Project Management</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="director@buildtrack.bd"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"  className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="123456"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-70"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8">
            <p className="text-center text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Quick Demo Login</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickLogin('director@buildtrack.bd')}
                className="flex-1 text-xs bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-2 rounded-xl transition-colors font-medium border border-transparent hover:border-blue-200"
              >
                Director
              </button>
              <button
                onClick={() => handleQuickLogin('engineer@buildtrack.bd')}
                className="flex-1 text-xs bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-2 rounded-xl transition-colors font-medium border border-transparent hover:border-blue-200"
              >
                Engineer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
