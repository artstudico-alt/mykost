import { useState, useEffect } from 'react'
import authService from '../services/authService'

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated())
      setLoading(false)
    }
    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      await authService.login(credentials)
      setIsAuthenticated(true)
      return true
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    setIsAuthenticated(false)
  }

  return { isAuthenticated, loading, login, logout }
}
