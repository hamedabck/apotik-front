import { defineStore } from 'pinia'
import axios from 'axios'

export const useTtacDrugsStore = defineStore('ttacDrugs', {
  state: () => ({
    drugs: [],
    loading: false,
    loaded: false,
    error: null,
    lastFetch: null
  }),

  getters: {
    drugsCount: (state) => state.drugs.length,
    
    isDataFresh: (state) => {
      if (!state.lastFetch) return false
      // Consider data fresh for 5 minutes
      const fiveMinutes = 5 * 60 * 1000
      return Date.now() - state.lastFetch < fiveMinutes
    },

    // Fast GTIN search function
    findByGtin: (state) => (gtin) => {
      if (!gtin) return null
      const searchGtin = gtin.toString().toUpperCase().trim()
      return state.drugs.find(drug => 
        drug.gtin_code && drug.gtin_code.toUpperCase() === searchGtin
      )
    },

    // Search with GTIN extraction for 16+ character inputs
    findByGtinWithExtraction: (state) => (input) => {
      if (!input) return null
      
      let searchGtin = input.toString().trim()
      
      // Extract GTIN if input is 16+ characters (take indices 2-14)
      if (searchGtin.length >= 16) {
        searchGtin = searchGtin.substring(2, 16)
      }
      
      searchGtin = searchGtin.toUpperCase()
      return state.drugs.find(drug => 
        drug.gtin_code && drug.gtin_code.toUpperCase() === searchGtin
      )
    }
  },

  actions: {
    async fetchDrugs(force = false) {
      // Skip if already loaded and data is fresh, unless forced
      if (this.loaded && this.isDataFresh && !force) {
        return this.drugs
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get('/pharmacy/ttac-drugs/')
        this.drugs = response.data.results || response.data
        this.loaded = true
        this.lastFetch = Date.now()
        this.error = null
        
        console.log(`✅ TTAC Drugs loaded: ${this.drugs.length} records`)
        return this.drugs
      } catch (error) {
        this.error = error.message || 'Failed to fetch TTAC drugs'
        console.error('Error fetching TTAC drugs:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async refreshDrugs() {
      return this.fetchDrugs(true)
    },

    // Ensure data is available - loads if not already loaded
    async ensureDataAvailable() {
      if (!this.loaded && !this.loading) {
        return this.fetchDrugs()
      }
      return this.drugs
    },

    // Add a new drug to the store (for when drugs are created)
    addDrug(drug) {
      this.drugs.push(drug)
    },

    // Update a drug in the store
    updateDrug(updatedDrug) {
      const index = this.drugs.findIndex(drug => drug.id === updatedDrug.id)
      if (index !== -1) {
        this.drugs[index] = updatedDrug
      }
    },

    // Remove a drug from the store (local only)
    removeDrug(drugId) {
      const index = this.drugs.findIndex(drug => drug.id === drugId)
      if (index !== -1) {
        this.drugs.splice(index, 1)
      }
    },

    // Delete a drug via API and remove from store
    async deleteDrug(drugId) {
      try {
        await axios.delete(`/pharmacy/ttac-drugs/${drugId}/`)
        
        // Remove from local store after successful API call
        this.removeDrug(drugId)
        
        console.log(`✅ Drug ${drugId} deleted successfully`)
        return true
      } catch (error) {
        console.error('Error deleting drug:', error)
        throw error
      }
    },

    // Delete all drugs via API and clear store
    async deleteAllDrugs(confirmData) {
      try {
        const response = await axios.delete('/pharmacy/ttac-drugs/delete-all/', {
          data: confirmData
        })
        
        // Clear local store after successful API call
        this.clearDrugs()
        
        console.log(`✅ All drugs deleted successfully: ${response.data.deleted_count} records`)
        return response.data
      } catch (error) {
        console.error('Error deleting all drugs:', error)
        throw error
      }
    },

    // Clear the store
    clearDrugs() {
      this.drugs = []
      this.loaded = false
      this.lastFetch = null
      this.error = null
    },

    // Search drugs by various criteria
    searchDrugs(query) {
      if (!query || !query.trim()) return this.drugs
      
      const searchTerm = query.toLowerCase().trim()
      return this.drugs.filter(drug => 
        (drug.name_persian && drug.name_persian.toLowerCase().includes(searchTerm)) ||
        (drug.name_english && drug.name_english.toLowerCase().includes(searchTerm)) ||
        (drug.gtin_code && drug.gtin_code.toLowerCase().includes(searchTerm)) ||
        (drug.generic_code && drug.generic_code.toLowerCase().includes(searchTerm)) ||
        (drug.company_name_persian && drug.company_name_persian.toLowerCase().includes(searchTerm)) ||
        (drug.company_name_english && drug.company_name_english.toLowerCase().includes(searchTerm))
      )
    }
  }
}) 