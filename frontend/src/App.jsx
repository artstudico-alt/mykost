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
import AdminPembayaran from './pages/AdminPembayaran'
import AdminTracking from './pages/AdminTracking'
import AdminLaporan from './pages/AdminLaporan'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HRDashboard from './pages/HRDashboard'
import OwnerDashboard from './pages/OwnerDashboard'

function App() {
  const { user } = useAuth()

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/kost/:kostId" element={<KostDetail />} />

          {/* Super Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="kost" element={<AdminKost />} />
            <Route path="karyawan" element={<AdminUsers />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="pembayaran" element={<AdminPembayaran />} />
            <Route path="laporan" element={<AdminLaporan />} />
          </Route>

          {/* HR Routes */}
          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={['hr']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="dashboard" element={<HRDashboard />} />
            <Route path="karyawan" element={<AdminUsers />} />
            <Route path="tracking" element={<AdminTracking />} />
            <Route path="laporan" element={<AdminLaporan />} />
          </Route>

          {/* Owner Routes */}
          <Route path="/owner" element={
            <ProtectedRoute allowedRoles={['pemilik_kost']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="kost" element={<AdminKost />} />
            <Route path="pembayaran" element={<AdminPembayaran />} />
          </Route>

          {/* User / Fallback Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardNavigator />
            </ProtectedRoute>
          } />
          <Route path="/kamar" element={<ProtectedRoute><Kamar /></ProtectedRoute>} />
          <Route path="/penyewa" element={<ProtectedRoute><Penyewa /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  )
}

function DashboardNavigator() {
  const { user } = useAuth()
  const role = user?.role?.name || ''
  
  if (role === 'hr') return <Navigate to="/hr/dashboard" replace />
  if (role === 'pemilik_kost') return <Navigate to="/owner/dashboard" replace />
  if (role === 'super_admin' || role === 'admin') return <Navigate to="/admin/dashboard" replace />
  
  return <Navigate to="/kamar" replace />
}

export default App
