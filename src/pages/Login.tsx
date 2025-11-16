import React, { useState } from 'react';
import { LogIn, GraduationCap, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';

export const Login: React.FC = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Debug: log form state and ensure submit prevented
    console.debug('[login] handleSubmit called', { form });

    try {
      // Use the new login endpoint with username
      console.debug('[login] sending login request', { username: form.username });
      const response = await apiService.login(form.username, form.password);
      console.debug('[login] received response', response && response.status, response && response.data);
      const user = response.data;

      if (user) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to dashboard
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mb-48"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white opacity-5 rounded-full"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-lg">
            <GraduationCap className="text-white" size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Driving School</h1>
        <p className="text-center text-gray-600 mb-2 font-medium">Management System</p>
      

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600"><strong>❌ Error:</strong> {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:from-blue-300 disabled:to-indigo-300 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="text-xs text-gray-700 font-bold mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Test Accounts
          </div>
          <div className="space-y-2 text-xs text-gray-700">
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <div className="font-semibold text-purple-600">Manager</div>
              <div className="font-mono">robert / admin123</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <div className="font-semibold text-blue-600">Instructor</div>
              <div className="font-mono">emma / admin123</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-blue-100">
              <div className="font-semibold text-green-600">Customer</div>
              <div className="font-mono">alice / admin123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
