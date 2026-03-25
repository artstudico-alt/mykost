import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Home() {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <Navigate to="/login" replace />
}

export default Home
