import { createContext, useState, useEffect, useRef } from 'react'
import authService from '../services/authService'
import api from '../utils/api'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const isFetchingRef = useRef(false)

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (isFetchingRef.current) {
      console.log('Auth check already in progress, skipping...')
      return
    }
    
    isFetchingRef.current = true
    
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)
    if (authenticated) {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.user)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
        
        if (error.response && error.response.status === 401) {
          authService.logout()
          setIsAuthenticated(false)
          setUser(null)
        } else if (error.response && error.response.status === 500) {
          // 500 error - server issue, don't logout user
          console.error('Server error in /auth/me - keeping user logged in')
          // Try to get user from localStorage as fallback
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser))
            } catch (parseError) {
              console.error('Failed to parse stored user data:', parseError)
              authService.logout()
              setIsAuthenticated(false)
              setUser(null)
            }
          } else {
            // No fallback data, logout user
            authService.logout()
            setIsAuthenticated(false)
            setUser(null)
          }
        } else {
          // Other errors, logout for safety
          authService.logout()
          setIsAuthenticated(false)
          setUser(null)
        }
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }

  const ensureAuth = async () => {
    if (!isAuthenticated && authService.isAuthenticated()) {
      await checkAuth()
    }
  }

  useEffect(() => {
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, checkAuth, ensureAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
