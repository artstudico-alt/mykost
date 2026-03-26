import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth()
  
  // Sinkronisasi cek token untuk antisipasi race condition state saat sukses login
  const hasToken = !!localStorage.getItem('token')

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

  // Jika tidak ada token lokal sama sekali dan state tidak authenticated, lempar ke login
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />
  }

  // Jika token ada tapi state user masih kosong (sedang dimuat manual setelah login), render kosong sementara atau fallback loading
  if (hasToken && !user) {
     return <div className="min-h-screen flex items-center justify-center"><p>Memuat profil...</p></div>
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
