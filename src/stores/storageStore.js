import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export const useStorageStore = defineStore('storage', {
  state: () => ({
    storages: [],
    loading: false,
    error: null,
    lastFetched: null
  }),

  getters: {
    // Get storages by type
    getStoragesByType: (state) => (type) => {
      return state.storages.filter(storage => storage.type === type)
    },

    // Get storage by ID
    getStorageById: (state) => (id) => {
      return state.storages.find(storage => storage.id === id)
    },

    // Get storage options for select components
    storageOptions: (state) => {
      return state.storages.map(storage => ({
        label: `${storage.name} (${storage.type})`,
        value: storage.id,
        type: storage.type
      }))
    }
  },

  actions: {
    async fetchStorages(force = false) {
      // Check if we need to fetch (cache for 5 minutes)
      const now = new Date()
      if (!force && this.lastFetched && (now - this.lastFetched) < 5 * 60 * 1000) {
        return this.storages
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_BASE_URL}/storages/`, {
          headers: getAuthHeaders()
        })

        this.storages = response.data.results || response.data || []
        this.lastFetched = now
        return this.storages
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch storages'
        console.error('Error fetching storages:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createStorage(storageData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post(`${API_BASE_URL}/storages/`, storageData, {
          headers: getAuthHeaders()
        })

        const newStorage = response.data
        this.storages.push(newStorage)
        return newStorage
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to create storage'
        console.error('Error creating storage:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateStorage(id, storageData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.put(`${API_BASE_URL}/storages/${id}/`, storageData, {
          headers: getAuthHeaders()
        })

        const updatedStorage = response.data
        const index = this.storages.findIndex(storage => storage.id === id)
        if (index !== -1) {
          this.storages[index] = updatedStorage
        }
        return updatedStorage
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to update storage'
        console.error('Error updating storage:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteStorage(id) {
      this.loading = true
      this.error = null

      try {
        await axios.delete(`${API_BASE_URL}/storages/${id}/`, {
          headers: getAuthHeaders()
        })

        this.storages = this.storages.filter(storage => storage.id !== id)
        return true
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete storage'
        console.error('Error deleting storage:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Search storages by name
    searchStorages(query) {
      if (!query) return this.storages
      
      const queryLower = query.toLowerCase()
      return this.storages.filter(storage => 
        storage.name.toLowerCase().includes(queryLower) ||
        storage.description?.toLowerCase().includes(queryLower)
      )
    },

    // Clear the store
    clearStorages() {
      this.storages = []
      this.lastFetched = null
      this.error = null
    }
  }
})