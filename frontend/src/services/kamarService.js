import api from '../utils/api'

const kamarService = {
  // Get all kamar
  getAllKamar: async (kostId = null) => {
    const currentKostId = kostId || localStorage.getItem('kostId') || 1;
    try {
      const response = await api.get(`/kost/${currentKostId}/kamar`)
      return response.data
    } catch (error) {
      console.error('Error fetching kamar:', error)
      throw error
    }
  },

  // Get kamar by id
  getKamarById: async (id, kostId = null) => {
    const currentKostId = kostId || localStorage.getItem('kostId') || 1;
    try {
      const response = await api.get(`/kost/${currentKostId}/kamar/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching kamar:', error)
      throw error
    }
  },

  // Create new kamar
  createKamar: async (kamarData, kostId = null) => {
    const currentKostId = kostId || localStorage.getItem('kostId') || 1;
    try {
      const response = await api.post(`/kost/${currentKostId}/kamar`, kamarData)
      return response.data
    } catch (error) {
      console.error('Error creating kamar:', error)
      throw error
    }
  },

  // Update kamar
  updateKamar: async (id, kamarData, kostId = null) => {
    const currentKostId = kostId || localStorage.getItem('kostId') || 1;
    try {
      const response = await api.put(`/kost/${currentKostId}/kamar/${id}`, kamarData)
      return response.data
    } catch (error) {
      console.error('Error updating kamar:', error)
      throw error
    }
  },

  // Delete kamar
  deleteKamar: async (id, kostId = null) => {
    const currentKostId = kostId || localStorage.getItem('kostId') || 1;
    try {
      await api.delete(`/kost/${currentKostId}/kamar/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting kamar:', error)
      throw error
    }
  }
}

export default kamarService
