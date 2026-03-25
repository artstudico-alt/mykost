import api from '../utils/api'

const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userEmail', credentials.email)
      }
      return response.data
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Koneksi ke server gagal. Pastikan server backend menyala.')
    }
  },

  register: async (payload) => {
    const response = await api.post('/auth/register', payload)
    return response.data
  },

  verifyOtp: async ({ email, kode }) => {
    const response = await api.post('/auth/verify-otp', { email, kode })
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  resendOtp: async ({ email }) => {
    const response = await api.post('/auth/resend-otp', { email })
    return response.data
  },

  forgotPassword: async ({ email }) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async ({ email, kode, password, password_confirmation }) => {
    const response = await api.post('/auth/reset-password', {
      email,
      kode,
      password,
      password_confirmation
    })
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    // HashRouter pakai /#/login bukan /login
    window.location.hash = '#/login'
  },

  getToken: () => {
    return localStorage.getItem('token')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}

export default authService
