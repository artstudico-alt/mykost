import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  const hasToken = !!localStorage.getItem('token')

  if (loading) {
    return (
      <div className="app-loading-shell">
        <div className="app-loading-spinner" role="status" aria-label="Memuat" />
        <p className="app-loading-text">Memuat…</p>
      </div>
    )
  }

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />
  }

  if (hasToken && !user) {
    return (
      <div className="app-loading-shell">
        <div className="app-loading-spinner" role="status" aria-label="Memuat profil" />
        <p className="app-loading-text">Memuat profil…</p>
      </div>
    )
  }

  if (allowedRoles.length > 0) {
    const userRole = user?.role?.name || ''
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute
