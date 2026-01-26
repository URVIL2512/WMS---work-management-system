import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Validate token on mount
    if (!token) {
      setTokenValid(false);
      setError('Invalid reset token');
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="bg-gray-900 px-8 py-6">
              <h1 className="text-3xl font-bold text-green-500 text-center">WMS</h1>
              <p className="text-gray-400 text-center mt-2">Work Management System</p>
            </div>

            <div className="px-8 py-8 text-center">
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                <p className="font-semibold mb-2">Invalid or Expired Link</p>
                <p className="text-sm">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-block text-green-500 hover:text-green-600 font-semibold"
              >
                Request New Reset Link
              </Link>
              <div className="mt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gray-900 px-8 py-6">
            <h1 className="text-3xl font-bold text-green-500 text-center">WMS</h1>
            <p className="text-gray-400 text-center mt-2">Work Management System</p>
          </div>

          {success ? (
            <div className="px-8 py-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-4">
                Your password has been successfully reset. Redirecting to login page...
              </p>
              <Link
                to="/login"
                className="inline-block text-green-500 hover:text-green-600 font-semibold"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-8">
              <div className="mb-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-4"
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
                <p className="text-gray-600 text-sm">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all shadow-lg ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link to="/login" className="text-green-500 hover:text-green-600 font-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Professional Manufacturing Solution
        </p>
      </div>
    </div>
  );
}
