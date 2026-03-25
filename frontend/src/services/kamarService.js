import api from '../utils/api'

const kamarService = {
  // Get all kamar
  getAllKamar: async () => {
    try {
      const response = await api.get('/kamars')
      return response.data
    } catch (error) {
      console.error('Error fetching kamar:', error)
      throw error
    }
  },

  // Get kamar by id
  getKamarById: async (id) => {
    try {
      const response = await api.get(`/kamars/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching kamar:', error)
      throw error
    }
  },

  // Create new kamar
  createKamar: async (kamarData) => {
    try {
      const response = await api.post('/kamars', kamarData)
      return response.data
    } catch (error) {
      console.error('Error creating kamar:', error)
      throw error
    }
  },

  // Update kamar
  updateKamar: async (id, kamarData) => {
    try {
      const response = await api.put(`/kamars/${id}`, kamarData)
      return response.data
    } catch (error) {
      console.error('Error updating kamar:', error)
      throw error
    }
  },

  // Delete kamar
  deleteKamar: async (id) => {
    try {
      await api.delete(`/kamars/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting kamar:', error)
      throw error
    }
  }
}

export default kamarService
