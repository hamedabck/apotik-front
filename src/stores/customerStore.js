import { defineStore } from 'pinia'
import axios from 'axios'
import { 
  formatDateJalali, 
  jalaliToGregorian, 
  gregorianToJalali, 
  validateJalaliDate,
  formatJalaliDateInput 
} from '@/utils/dateUtils'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    customers: [],
    loading: false,
    error: null,
    summary: null
  }),

  getters: {
    getCustomerById: (state) => (id) => {
      return state.customers.find(customer => customer.id === id)
    },
    
    getCustomersByName: (state) => (searchTerm) => {
      if (!searchTerm) return state.customers
      return state.customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.id_number && customer.id_number.includes(searchTerm)) ||
        (customer.phone && customer.phone.includes(searchTerm))
      )
    },
    
    getCustomersByGender: (state) => (gender) => {
      if (!gender) return state.customers
      return state.customers.filter(customer => customer.gender === gender)
    },
    
    getCustomersWithInsurance: (state) => {
      return state.customers.filter(customer => customer.insurance_id)
    },
    
    getCustomersWithEmail: (state) => {
      return state.customers.filter(customer => customer.email)
    },
    
    getCustomersWithPhone: (state) => {
      return state.customers.filter(customer => customer.phone)
    },
    
    totalCustomers: (state) => state.customers.length,
    
    hasError: (state) => !!state.error,
    
    isLoading: (state) => state.loading,
    
    genderDistribution: (state) => {
      const distribution = { male: 0, female: 0, other: 0 }
      state.customers.forEach(customer => {
        if (customer.gender && distribution.hasOwnProperty(customer.gender)) {
          distribution[customer.gender]++
        }
      })
      return distribution
    }
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

    // Fetch all customers
    async fetchCustomers() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/customers/`, {
          headers: this.getAuthHeaders()
        })
        
        this.customers = response.data.results || response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to fetch customers'
        console.error('Error fetching customers:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Create new customer
    async createCustomer(customerData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_BASE_URL}/customers/`, customerData, {
          headers: this.getAuthHeaders()
        })
        
        // Add the new customer to the store
        this.customers.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data || error.message || 'Failed to create customer'
        console.error('Error creating customer:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Update existing customer
    async updateCustomer(id, customerData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`${API_BASE_URL}/customers/${id}/`, customerData, {
          headers: this.getAuthHeaders()
        })
        
        // Update the customer in the store
        const index = this.customers.findIndex(customer => customer.id === id)
        if (index !== -1) {
          this.customers[index] = response.data
        }
        
        return response.data
      } catch (error) {
        this.error = error.response?.data || error.message || 'Failed to update customer'
        console.error('Error updating customer:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Delete customer
    async deleteCustomer(id) {
      this.loading = true
      this.error = null
      
      try {
        await axios.delete(`${API_BASE_URL}/customers/${id}/`, {
          headers: this.getAuthHeaders()
        })
        
        // Remove the customer from the store
        this.customers = this.customers.filter(customer => customer.id !== id)
        return true
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to delete customer'
        console.error('Error deleting customer:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Search customers
    async searchCustomers(query) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/customers/search/`, {
          headers: this.getAuthHeaders(),
          params: { q: query }
        })
        
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to search customers'
        console.error('Error searching customers:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Get customer summary
    async fetchCustomerSummary() {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_BASE_URL}/customers/summary/`, {
          headers: this.getAuthHeaders()
        })
        
        this.summary = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.detail || error.message || 'Failed to fetch customer summary'
        console.error('Error fetching customer summary:', error)
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
      this.customers = []
      this.loading = false
      this.error = null
      this.summary = null
    },

    // Validation helpers
    validateCustomer(customerData) {
      const errors = {}
      
      if (!customerData.name?.trim()) {
        errors.name = 'Customer name is required'
      }
      
      if (customerData.email && !this.isValidEmail(customerData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      
      if (customerData.phone && !this.isValidPhone(customerData.phone)) {
        errors.phone = 'Please enter a valid phone number'
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      }
    },

    // Check if ID number exists
    isIdNumberExists(idNumber, excludeId = null) {
      if (!idNumber) return false
      return this.customers.some(customer => 
        customer.id_number === idNumber && 
        customer.id !== excludeId
      )
    },

    // Email validation
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },

    // Phone validation
    isValidPhone(phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
    },

    // Format phone number for display
    formatPhoneNumber(phone) {
      if (!phone) return ''
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length === 11) {
        return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')
      }
      return phone
    },

    // Calculate age from birthdate
    calculateAge(birthdate) {
      if (!birthdate) return null
      const today = new Date()
      const birth = new Date(birthdate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    },

    // Check if insurance is expired
    isInsuranceExpired(expiryDate) {
      if (!expiryDate) return false
      return new Date(expiryDate) < new Date()
    },

    // Get customers with expired insurance
    getCustomersWithExpiredInsurance() {
      return this.customers.filter(customer => 
        customer.insurance_expiry_date && this.isInsuranceExpired(customer.insurance_expiry_date)
      )
    },

    // ===== JALALI DATE UTILITIES =====

    /**
     * Convert Gregorian birthdate to Jalali format for display
     * @param {string} gregorianDate - Gregorian date string from backend
     * @returns {string} Jalali date string in YYYY/MM/DD format
     */
    formatBirthdateJalali(gregorianDate) {
      return formatDateJalali(gregorianDate)
    },

    /**
     * Convert Jalali birthdate to Gregorian for backend submission
     * @param {string} jalaliDateString - Jalali date string in YYYY/MM/DD format
     * @returns {string|null} Gregorian date string in YYYY-MM-DD format or null if invalid
     */
    jalaliToGregorianBirthdate(jalaliDateString) {
      const gregorianDate = jalaliToGregorian(jalaliDateString)
      if (!gregorianDate) return null
      
      // Format as YYYY-MM-DD for backend
      const year = gregorianDate.getFullYear()
      const month = String(gregorianDate.getMonth() + 1).padStart(2, '0')
      const day = String(gregorianDate.getDate()).padStart(2, '0')
      
      return `${year}-${month}-${day}`
    },

    /**
     * Validate Jalali birthdate
     * @param {string} jalaliDateString - Jalali date string to validate
     * @returns {object} Validation result with isValid boolean and error message
     */
    validateJalaliBirthdate(jalaliDateString) {
      if (!jalaliDateString || !jalaliDateString.trim()) {
        return { isValid: true, error: null } // Birthdate is optional
      }
      
      const validation = validateJalaliDate(jalaliDateString)
      if (!validation.isValid) {
        return validation
      }
      
      // Additional validation for birthdate (should not be in future)
      const gregorianDate = jalaliToGregorian(jalaliDateString)
      if (gregorianDate && gregorianDate > new Date()) {
        return { isValid: false, error: 'Birthdate cannot be in the future' }
      }
      
      return { isValid: true, error: null }
    },

    /**
     * Format Jalali date input as user types
     * @param {string} input - User input string
     * @returns {string} Formatted Jalali date string
     */
    formatJalaliInput(input) {
      return formatJalaliDateInput(input)
    }
  }
}) 