import { useState, useEffect } from 'react'
import authService from '../services/authService'
import api from '../utils/api'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      if (authenticated) {
        try {
          const response = await api.get('/auth/me')
          setUser(response.data.user)
        } catch (error) {
          console.error('Failed to fetch user data:', error)
          // Hanya logout jika error adalah 401 (Unauthorized)
          if (error.response && error.response.status === 401) {
            authService.logout()
            setIsAuthenticated(false)
            setUser(null)
          }
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials)
      setIsAuthenticated(true)
      setUser(data.user)
      return data
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  return { isAuthenticated, user, loading, login, logout }
}
