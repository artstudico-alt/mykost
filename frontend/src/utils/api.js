import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  timeout: 60000
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // DEBUG: Log requests to kost endpoint
    if (config.url?.includes('/kost')) {
      console.log('[API DEBUG] Kost request:', {
        url: config.url,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
        headers: config.headers
      })
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor — jangan hapus token pada 401 dari login/register (password salah, dll.)
api.interceptors.response.use(
  (response) => {
    // DEBUG: Log kost responses
    if (response.config.url?.includes('/kost')) {
      console.log('[API DEBUG] Kost response:', {
        url: response.config.url,
        status: response.status,
        hasData: !!response.data
      })
    }
    return response
  },
  (error) => {
    // DEBUG: Log kost errors
    if (error.config?.url?.includes('/kost')) {
      console.error('[API DEBUG] Kost error:', {
        url: error.config.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      })
    }
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '')
      const isAuthForm =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/verify-otp') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password')
      // Don't redirect for auth/me - let the component handle it
      const isAuthMe = url.includes('/auth/me')
      
      if (!isAuthForm && !isAuthMe) {
        console.error('[API DEBUG] 401 detected, logging out. URL:', url)
        localStorage.removeItem('token')
        window.location.href = '/#/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
