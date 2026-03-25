import api from '../utils/api'

const penyewaService = {
  getAllPenyewa: async () => {
    try {
      const response = await api.get('/penyewas')
      return response.data
    } catch (error) {
      console.error('Error fetching penyewa:', error)
      throw error
    }
  },

  getPenyewaById: async (id) => {
    try {
      const response = await api.get(`/penyewas/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching penyewa:', error)
      throw error
    }
  },

  createPenyewa: async (penyewaData) => {
    try {
      const response = await api.post('/penyewas', penyewaData)
      return response.data
    } catch (error) {
      console.error('Error creating penyewa:', error)
      throw error
    }
  },

  updatePenyewa: async (id, penyewaData) => {
    try {
      const response = await api.put(`/penyewas/${id}`, penyewaData)
      return response.data
    } catch (error) {
      console.error('Error updating penyewa:', error)
      throw error
    }
  },

  deletePenyewa: async (id) => {
    try {
      await api.delete(`/penyewas/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting penyewa:', error)
      throw error
    }
  }
}

export default penyewaService
