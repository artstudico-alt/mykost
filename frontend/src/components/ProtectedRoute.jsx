import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Jika ada role yang ditentukan, cek apakah role user sesuai
  if (allowedRoles.length > 0) {
    const userRole = user?.role?.name || ''
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute
