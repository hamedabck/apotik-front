import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

export const useCardReaderStore = defineStore('cardReader', {
  state: () => ({
    cardReaders: [],
    loading: false,
    error: null,
    summary: null
  }),

  getters: {
    getCardReaderById: (state) => (id) => {
      return state.cardReaders.find(reader => reader.id === id)
    },
    
    getCardReadersByModel: (state) => (searchTerm) => {
      if (!searchTerm) return state.cardReaders
      return state.cardReaders.filter(reader => 
        reader.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reader.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    },
    
    getCardReadersByLocation: (state) => (location) => {
      if (!location) return state.cardReaders
      return state.cardReaders.filter(reader => 
        reader.location && reader.location.toLowerCase().includes(location.toLowerCase())
      )
    },
    
    totalCardReaders: (state) => state.cardReaders.length,
    
    cardReadersWithLocation: (state) => state.cardReaders.filter(reader => reader.location),
    
    hasError: (state) => !!state.error,
    
    isLoading: (state) => state.loading
  },

  actions: {
    // Get authentication headers
    getAuthHeaders() {
      const token = localStorage.getItem('access_token')
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    },

    // Fetch all card readers
    async fetchCardReaders() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/card-readers/`, {
          headers: this.getAuthHeaders()
        })
        
        this.cardReaders = response.data.results || response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to fetch card readers'
        console.error('Error fetching card readers:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new card reader
    async createCardReader(cardReaderData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_BASE_URL}/card-readers/`, cardReaderData, {
          headers: this.getAuthHeaders()
        })
        
        // Add the new card reader to the store
        this.cardReaders.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data || error.message || 'Failed to create card reader'
        console.error('Error creating card reader:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update existing card reader
    async updateCardReader(id, cardReaderData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`${API_BASE_URL}/card-readers/${id}/`, cardReaderData, {
          headers: this.getAuthHeaders()
        })
        
        // Update the card reader in the store
        const index = this.cardReaders.findIndex(reader => reader.id === id)
        if (index !== -1) {
          this.cardReaders[index] = response.data
        }
        
        return response.data
      } catch (error) {
        this.error = error.response?.data || error.message || 'Failed to update card reader'
        console.error('Error updating card reader:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete card reader
    async deleteCardReader(id) {
      this.loading = true
      this.error = null
      
      try {
        await axios.delete(`${API_BASE_URL}/card-readers/${id}/`, {
          headers: this.getAuthHeaders()
        })
        
        // Remove the card reader from the store
        this.cardReaders = this.cardReaders.filter(reader => reader.id !== id)
        return true
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to delete card reader'
        console.error('Error deleting card reader:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Get card reader summary
    async fetchCardReaderSummary() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/card-readers/summary/`, {
          headers: this.getAuthHeaders()
        })
        
        this.summary = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to fetch card reader summary'
        console.error('Error fetching card reader summary:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Reset store
    resetStore() {
      this.cardReaders = []
      this.loading = false
      this.error = null
      this.summary = null
    },

    // Validation helpers
    validateCardReader(cardReaderData) {
      const errors = {}
      
      if (!cardReaderData.model?.trim()) {
        errors.model = 'Model is required'
      }
      
      if (!cardReaderData.serial_number?.trim()) {
        errors.serial_number = 'Serial number is required'
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      }
    },

    // Check if serial number exists
    isSerialNumberExists(serialNumber, excludeId = null) {
      return this.cardReaders.some(reader => 
        reader.serial_number.toLowerCase() === serialNumber.toLowerCase() && 
        reader.id !== excludeId
      )
    },

    // Get unique models
    getUniqueModels() {
      const models = this.cardReaders.map(reader => reader.model)
      return [...new Set(models)].sort()
    },

    // Get unique locations
    getUniqueLocations() {
      const locations = this.cardReaders
        .filter(reader => reader.location)
        .map(reader => reader.location)
      return [...new Set(locations)].sort()
    }
  }
}) 