import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaKey, FaEnvelope } from 'react-icons/fa';
import API from './api';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/Card';
import { useToast } from './components/ui/Toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1); // 1 = request token, 2 = reset password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const res = await API.post('/api/auth/forgot-password', { email: email.trim() });
      setMessage(res.data?.message || 'Password reset token generated.');
      showSuccess('Reset token generated! Enter it below.');
      if (res.data?.resetToken) {
        setToken(res.data.resetToken);
      }
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to process password request';
      setMessage(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !token || !newPassword) return;

    setIsLoading(true);
    setMessage('');

    try {
      const res = await API.post('/api/auth/reset-password', {
        email: email.trim(),
        token: token.trim(),
        newPassword
      });
      showSuccess(res.data?.message || 'Password reset successful!');
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Password reset failed';
      setMessage(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white mb-6 transition"
        >
          <FaArrowLeft className="mr-2" /> Back to Sign In
        </button>

        <Card className="shadow-2xl">
          <CardHeader>
            <div>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                {step === 1
                  ? 'Enter your account email to generate a secure recovery token.'
                  : 'Enter the recovery token and your new password.'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {message && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-xl mb-4">
                {message}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestToken} className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="Enter your account email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  icon={FaEnvelope}
                >
                  Generate Reset Token
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Reset Token"
                  type="text"
                  placeholder="Paste your token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  icon={FaKey}
                >
                  Confirm Password Reset
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;