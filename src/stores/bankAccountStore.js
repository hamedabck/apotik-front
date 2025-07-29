import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

export const useBankAccountStore = defineStore('bankAccount', {
  state: () => ({
    bankAccounts: [],
    loading: false,
    error: null,
    summary: null
  }),

  getters: {
    getBankAccountById: (state) => (id) => {
      return state.bankAccounts.find(account => account.id === id)
    },
    
    getBankAccountsByName: (state) => (searchTerm) => {
      if (!searchTerm) return state.bankAccounts
      return state.bankAccounts.filter(account => 
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    },
    
    totalBankAccounts: (state) => state.bankAccounts.length,
    
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

    // Fetch all bank accounts
    async fetchBankAccounts() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/bank-accounts/`, {
          headers: this.getAuthHeaders()
        })
        
        this.bankAccounts = response.data.results || response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to fetch bank accounts'
        console.error('Error fetching bank accounts:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new bank account
    async createBankAccount(bankAccountData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_BASE_URL}/bank-accounts/`, bankAccountData, {
          headers: this.getAuthHeaders()
        })
        
        // Add the new bank account to the store
        this.bankAccounts.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data || error.message || 'Failed to create bank account'
        console.error('Error creating bank account:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update existing bank account
    async updateBankAccount(id, bankAccountData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`${API_BASE_URL}/bank-accounts/${id}/`, bankAccountData, {
          headers: this.getAuthHeaders()
        })
        
        // Update the bank account in the store
        const index = this.bankAccounts.findIndex(account => account.id === id)
        if (index !== -1) {
          this.bankAccounts[index] = response.data
        }
        
        return response.data
      } catch (error) {
        this.error = error.response?.data || error.message || 'Failed to update bank account'
        console.error('Error updating bank account:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete bank account
    async deleteBankAccount(id) {
      this.loading = true
      this.error = null
      
      try {
        await axios.delete(`${API_BASE_URL}/bank-accounts/${id}/`, {
          headers: this.getAuthHeaders()
        })
        
        // Remove the bank account from the store
        this.bankAccounts = this.bankAccounts.filter(account => account.id !== id)
        return true
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to delete bank account'
        console.error('Error deleting bank account:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Get bank account summary
    async fetchBankAccountSummary() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/bank-accounts/summary/`, {
          headers: this.getAuthHeaders()
        })
        
        this.summary = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to fetch bank account summary'
        console.error('Error fetching bank account summary:', error)
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
      this.bankAccounts = []
      this.loading = false
      this.error = null
      this.summary = null
    },

    // Validation helpers
    validateBankAccount(bankAccountData) {
      const errors = {}
      
      if (!bankAccountData.account_name?.trim()) {
        errors.account_name = 'Account name is required'
      }
      
      if (!bankAccountData.card_number?.trim()) {
        errors.card_number = 'Card number is required'
      } else if (!/^\d{16}$/.test(bankAccountData.card_number.replace(/\s/g, ''))) {
        errors.card_number = 'Card number must be exactly 16 digits'
      }
      
      if (!bankAccountData.iban?.trim()) {
        errors.iban = 'IBAN is required'
      } else if (bankAccountData.iban.length < 15 || bankAccountData.iban.length > 34) {
        errors.iban = 'IBAN must be between 15 and 34 characters'
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      }
    },

    // Check if bank account name exists
    isAccountNameExists(accountName, excludeId = null) {
      return this.bankAccounts.some(account => 
        account.account_name.toLowerCase() === accountName.toLowerCase() && 
        account.id !== excludeId
      )
    },

    // Check if card number exists
    isCardNumberExists(cardNumber, excludeId = null) {
      const cleanCardNumber = cardNumber.replace(/\s/g, '')
      return this.bankAccounts.some(account => 
        account.card_number === cleanCardNumber && 
        account.id !== excludeId
      )
    },

    // Format card number for display
    formatCardNumber(cardNumber) {
      if (!cardNumber) return ''
      const cleaned = cardNumber.replace(/\s/g, '')
      return cleaned.replace(/(.{4})/g, '$1 ').trim()
    }
  }
}) 