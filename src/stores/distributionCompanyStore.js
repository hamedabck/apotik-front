import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

export const useDistributionCompanyStore = defineStore('distributionCompany', () => {
  const companies = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pharmacyInfo = ref(null)

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Fetch all distribution companies for user's pharmacy
  const fetchCompanies = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/distribution-companies/`, {
        headers: getAuthHeaders()
      })
      
      if (response.data.results) {
        companies.value = response.data.results
        pharmacyInfo.value = response.data.pharmacy
      } else {
        companies.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to fetch distribution companies'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add new distribution company
  const addCompany = async (companyData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_BASE_URL}/distribution-companies/`, companyData, {
        headers: getAuthHeaders()
      })
      
      companies.value.push(response.data)
      ElMessage.success(`Distribution company "${response.data.name}" created successfully!`)
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.name?.[0] || 
                          err.response?.data?.detail || 
                          'Failed to create distribution company'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update existing distribution company
  const updateCompany = async (id, companyData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(`${API_BASE_URL}/distribution-companies/${id}/`, companyData, {
        headers: getAuthHeaders()
      })
      
      const index = companies.value.findIndex(company => company.id === id)
      if (index !== -1) {
        companies.value[index] = response.data
      }
      
      ElMessage.success(`Distribution company "${response.data.name}" updated successfully!`)
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.name?.[0] || 
                          err.response?.data?.detail || 
                          'Failed to update distribution company'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete distribution company
  const deleteCompany = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      await axios.delete(`${API_BASE_URL}/distribution-companies/${id}/`, {
        headers: getAuthHeaders()
      })
      
      const index = companies.value.findIndex(company => company.id === id)
      if (index !== -1) {
        const deletedCompany = companies.value[index]
        companies.value.splice(index, 1)
        ElMessage.success(`Distribution company "${deletedCompany.name}" deleted successfully!`)
      }
      
      return true
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete distribution company'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get distribution company by ID
  const getCompanyById = (id) => {
    return companies.value.find(company => company.id === id)
  }

  // Search distribution companies
  const searchCompanies = async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/distribution-companies/search/`, {
        headers: getAuthHeaders(),
        params: { q: query }
      })
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to search distribution companies'
      ElMessage.error(errorMessage)
      throw err
    }
  }

  // Get distribution company summary
  const getCompanySummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/distribution-companies/summary/`, {
        headers: getAuthHeaders()
      })
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch distribution company summary'
      ElMessage.error(errorMessage)
      throw err
    }
  }

  // Clear store data (for logout)
  const clearCompanies = () => {
    companies.value = []
    pharmacyInfo.value = null
    error.value = null
  }

  // Ensure data is available (fetch if empty)
  const ensureDataAvailable = async () => {
    if (companies.value.length === 0) {
      await fetchCompanies()
    }
  }

  return {
    // State
    companies,
    loading,
    error,
    pharmacyInfo,
    
    // Actions
    fetchCompanies,
    addCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    searchCompanies,
    getCompanySummary,
    clearCompanies,
    ensureDataAvailable
  }
}) 