import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Lock, Mail, User, Shield } from "lucide-react"
import api from "../api/axios"

export default function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("Staff")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        role
      })

      if (response.data.success) {
        setSuccess("Account created successfully! Logging you in...")
        
        // Automatically log in the user after successful signup
        try {
          const loginResponse = await api.post("/auth/login", {
            email,
            password
          })

          if (loginResponse.data.success) {
            // Store authentication data
            const token = loginResponse.data.data?.token ?? loginResponse.data.token;
            const user = loginResponse.data.data?.user ?? loginResponse.data.user;

            sessionStorage.setItem("token", token);
            sessionStorage.setItem("isAuthenticated", "true");
            sessionStorage.setItem("userName", user?.name ?? "");
            sessionStorage.setItem("userRole", user?.role ?? "");
            sessionStorage.setItem("userEmail", user?.email ?? "");
            sessionStorage.setItem("userId", user?.id ?? user?._id ?? "");
            sessionStorage.setItem("userEmail", user?.email ?? "");
            sessionStorage.setItem("userId", user?.id ?? user?._id ?? "");

            // Clear form
            setName("")
            setEmail("")
            setPassword("")
            setRole("Staff")
            
            // Navigate to main page
            navigate("/")
          }
        } catch (loginErr: any) {
          // If auto-login fails, redirect to login page
          setSuccess("Account created successfully! Please login...")
          setTimeout(() => {
            navigate("/login")
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to sign up. Please try again.")
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
            <p className="text-gray-400 text-center mt-2">Create your account</p>
          </div>

          <form onSubmit={handleSignup} className="px-8 py-8">

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign Up</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Full Name
              </label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

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

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Role
              </label>

              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all shadow-lg ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
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
  )
}
