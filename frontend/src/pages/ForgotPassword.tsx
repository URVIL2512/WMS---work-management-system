import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to send reset link');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gray-900 px-8 py-6">
            <h1 className="text-3xl font-bold text-green-500 text-center">WMS</h1>
            <p className="text-gray-400 text-center mt-2">Work Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="mb-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-4"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
              <p className="text-gray-600 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
                <p className="font-semibold mb-2">Check your email!</p>
                <p className="text-sm">
                  If an account with that email exists, a password reset link has been sent.
                  Please check your inbox and follow the instructions.
                </p>
              </div>
            )}

            {!success && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/login" className="text-green-500 hover:text-green-600 font-semibold">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          Professional Manufacturing Solution
        </p>
      </div>
    </div>
  );
}
