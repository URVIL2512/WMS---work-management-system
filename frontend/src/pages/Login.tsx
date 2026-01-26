import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Lock, Mail } from "lucide-react"
import api from "../api/axios"

export default function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault()
    setError("")
    setLoading(true)

    try {

      const response = await api.post("/auth/login", {
        email,
        password
      })

      if (response.data.success) {

        // backend returns { success, message, data: { token, user } }
        const token = response.data.data?.token ?? response.data.token;
        const user = response.data.data?.user ?? response.data.user;

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("userName", user?.name ?? "");
        sessionStorage.setItem("userRole", user?.role ?? "");
        sessionStorage.setItem("userEmail", user?.email ?? "");
        sessionStorage.setItem("userId", user?.id ?? user?._id ?? "");

        navigate("/")
      }

    } catch (err: any) {

      setError(err.response?.data?.message || "Invalid email or password")

    } finally {

      setLoading(false)

    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full mx-4">

        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">

          <div className="bg-gray-900 px-8 py-6">
            <h1 className="text-3xl font-bold text-green-500 text-center">WMS</h1>
            <p className="text-gray-400 text-center mt-2">Work Management System</p>
          </div>

          <form onSubmit={handleLogin} className="px-8 py-8">

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

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

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all shadow-lg ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="mt-4 text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-green-500 hover:text-green-600 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-green-500 hover:text-green-600 font-semibold">
                  Sign Up
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
  )
}
