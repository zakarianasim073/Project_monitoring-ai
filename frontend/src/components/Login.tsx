import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/projects');
    } else alert('Login failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8 text-slate-800">BuildTrack AI</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 border rounded-2xl" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 border rounded-2xl" required />
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg">Login</button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-500">Demo: director@buildtrack.bd / 123456</p>
      </div>
    </div>
  );
};

export default Login;
