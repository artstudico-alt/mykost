import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  const hasToken = !!localStorage.getItem('token')

  // Selama masih loading atau ada token tapi user belum siap, tampilkan loading
  if (loading || (hasToken && !user)) {
    return (
      <div className="app-loading-shell">
        <div className="app-loading-spinner" role="status" aria-label="Memuat" />
        <p className="app-loading-text">Memuat…</p>
      </div>
    )
  }

  // Redirect ke login hanya jika benar-benar tidak ada token
  if (!hasToken && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0) {
    const userRole = user?.role?.name || ''
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on user's actual role
      if (userRole === 'hr') return <Navigate to="/hr/dashboard" replace />
      if (userRole === 'pemilik_kost') return <Navigate to="/owner/dashboard" replace />
      if (userRole === 'super_admin' || userRole === 'admin') return <Navigate to="/admin/dashboard" replace />
      // Fallback to login if no valid role
      return <Navigate to="/login" replace />
    }
  }

  return children
}

export default ProtectedRoute
