import api from '../utils/api'

const penyewaService = {
  getAllPenyewa: async () => {
    try {
      const response = await api.get('/karyawan')
      return response.data
    } catch (error) {
      console.error('Error fetching penyewa:', error)
      throw error
    }
  },

  getPenyewaById: async (id) => {
    try {
      const response = await api.get(`/karyawan/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching penyewa:', error)
      throw error
    }
  },

  createPenyewa: async (penyewaData) => {
    try {
      const response = await api.post('/karyawan', penyewaData)
      return response.data
    } catch (error) {
      console.error('Error creating penyewa:', error)
      throw error
    }
  },

  updatePenyewa: async (id, penyewaData) => {
    try {
      const response = await api.put(`/karyawan/${id}`, penyewaData)
      return response.data
    } catch (error) {
      console.error('Error updating penyewa:', error)
      throw error
    }
  },

  deletePenyewa: async (id) => {
    try {
      await api.delete(`/karyawan/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting penyewa:', error)
      throw error
    }
  }
}

export default penyewaService
