import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Kamar from './pages/Kamar'
import Penyewa from './pages/Penyewa'
import KostDetail from './pages/KostDetail'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, logout } = useAuth()

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/kost/:kostId" element={<KostDetail />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="bg-gray-100">
                <nav className="bg-white shadow-md">
                  <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                      <Link to="/dashboard" className="text-xl font-bold text-blue-600">MyKost</Link>
                      <div className="flex space-x-6">
                        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                        <Link to="/kamar" className="text-gray-600 hover:text-blue-600">Kamar</Link>
                        <Link to="/penyewa" className="text-gray-600 hover:text-blue-600">Penyewa</Link>
                        <button 
                          onClick={logout}
                          className="text-red-600 hover:text-red-800"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </nav>
                <Dashboard />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/kamar" element={
            <ProtectedRoute>
              <Kamar />
            </ProtectedRoute>
          } />
          <Route path="/penyewa" element={
            <ProtectedRoute>
              <Penyewa />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
