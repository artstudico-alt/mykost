import api from '../utils/api'

const authService = {
  login: async (credentials) => {
    try {
      // Mock login untuk testing (hapus ini saat backend sudah siap)
      if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
        const mockResponse = {
          success: true,
          token: 'mock-jwt-token-12345',
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@example.com'
          }
        }
        localStorage.setItem('token', mockResponse.token)
        return mockResponse
      }

      // Coba ke backend jika bukan credentials mock
      const response = await api.post('/auth/login', credentials)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userEmail', credentials.email)
      }
      return response.data
    } catch (error) {
      console.error('Login error:', error)
      // Jika backend error, cek mock login
      if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
        const mockResponse = {
          success: true,
          token: 'mock-jwt-token-12345',
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@example.com'
          }
        }
        localStorage.setItem('token', mockResponse.token)
        localStorage.setItem('userEmail', credentials.email)
        return mockResponse
      }

      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message)
      } else if (error.message) {
        throw new Error('Koneksi Gagal: ' + error.message)
      }

      throw error
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
    window.location.href = '/login'
  },

  getToken: () => {
    return localStorage.getItem('token')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}

export default authService
