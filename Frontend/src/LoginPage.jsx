import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUserGraduate, FaUserShield, FaUserTie, FaEye, FaEyeSlash, FaShieldAlt, FaLock } from 'react-icons/fa';
import API from './api';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import { useToast } from './components/ui/Toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const roles = [
    { id: 'student', title: 'Student', icon: FaUserGraduate, desc: 'Submit and track campus complaints' },
    { id: 'admin', title: 'Department Admin', icon: FaUserShield, desc: 'Manage department ticket workflows' },
    { id: 'principal', title: 'Principal Executive', icon: FaUserTie, desc: 'Overlook cross-department analytics' }
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await API.post('/api/auth/login', {
        email: email.trim(),
        password,
        role: selectedRole
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      showSuccess(`Welcome back, ${user.name || user.email}!`);

      if (user.role === 'student') navigate('/student/home');
      else if (user.role === 'admin') navigate('/admin/home');
      else if (user.role === 'principal') navigate('/principal/home');
      else navigate('/');

    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Authentication failed. Please check credentials.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Logo Mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-xl shadow-indigo-600/30 mb-4 border border-indigo-500/30">
          S
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Smart Complaint Management
        </h1>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          Unified Operational Platform for Campus Grievance Resolution
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 sm:px-10">
          
          {/* Role Tab Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Your Access Portal
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r.id);
                      setErrorMessage('');
                    }}
                    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg text-xs font-bold transition duration-200 ${
                      isSelected
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon size={16} className={isSelected ? 'text-indigo-600 mb-1' : 'text-slate-400 mb-1'} />
                    <span>{r.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center">
                <span>{errorMessage}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-600 transition duration-150 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to {selectedRole.toUpperCase()} Dashboard
            </Button>
          </form>

          {/* Track Anonymous Direct Link */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-2">Submitted a complaint anonymously?</p>
            <Link
              to="/track-anonymous"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition"
            >
              <FaLock className="text-amber-500" />
              <span>Track Anonymous Complaint</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} SCMS Engineering Platform. Enterprise Security & SSL Encrypted.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
