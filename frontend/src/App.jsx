import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Kamar from './pages/Kamar'
import Penyewa from './pages/Penyewa'
import KostDetail from './pages/KostDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminKost from './pages/AdminKost'
import AdminUsers from './pages/AdminUsers'
import AdminKantor from './pages/AdminKantor'
import AdminLayout from './components/AdminLayout'
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
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="kost" element={<AdminKost />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="kantor" element={<AdminKantor />} />
            <Route path="properti" element={<div className="p-8"><h1>Halaman Verifikasi Kost (Segera Hadir)</h1></div>} />
            <Route path="pembayaran" element={<div className="p-8"><h1>Halaman Pembayaran (Segera Hadir)</h1></div>} />
            <Route path="laporan" element={<div className="p-8"><h1>Halaman Laporan (Segera Hadir)</h1></div>} />
          </Route>

          {/* Fallback dashboard / Legacy */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
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
