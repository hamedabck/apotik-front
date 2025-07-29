import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

export const useInsuranceStore = defineStore('insurance', () => {
  const insurances = ref([])
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

  // Fetch all insurances for user's pharmacy
  const fetchInsurances = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/insurances/`, {
        headers: getAuthHeaders()
      })
      
      if (response.data.results) {
        insurances.value = response.data.results
        pharmacyInfo.value = response.data.pharmacy
      } else {
        insurances.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to fetch insurances'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add new insurance
  const addInsurance = async (insuranceData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_BASE_URL}/insurances/`, insuranceData, {
        headers: getAuthHeaders()
      })
      
      insurances.value.push(response.data)
      ElMessage.success(`Insurance "${response.data.name}" created successfully!`)
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.name?.[0] || 
                          err.response?.data?.detail || 
                          'Failed to create insurance'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update existing insurance
  const updateInsurance = async (id, insuranceData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(`${API_BASE_URL}/insurances/${id}/`, insuranceData, {
        headers: getAuthHeaders()
      })
      
      const index = insurances.value.findIndex(insurance => insurance.id === id)
      if (index !== -1) {
        insurances.value[index] = response.data
      }
      
      ElMessage.success(`Insurance "${response.data.name}" updated successfully!`)
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.name?.[0] || 
                          err.response?.data?.detail || 
                          'Failed to update insurance'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete insurance
  const deleteInsurance = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      await axios.delete(`${API_BASE_URL}/insurances/${id}/`, {
        headers: getAuthHeaders()
      })
      
      const index = insurances.value.findIndex(insurance => insurance.id === id)
      if (index !== -1) {
        const deletedInsurance = insurances.value[index]
        insurances.value.splice(index, 1)
        ElMessage.success(`Insurance "${deletedInsurance.name}" deleted successfully!`)
      }
      
      return true
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete insurance'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get insurance by ID
  const getInsuranceById = (id) => {
    return insurances.value.find(insurance => insurance.id === id)
  }

  // Get insurances by coverage level
  const getInsurancesByCoverage = (minCoverage = 0, maxCoverage = 100) => {
    return insurances.value.filter(insurance => 
      insurance.coverage_percentage >= minCoverage && 
      insurance.coverage_percentage <= maxCoverage
    )
  }

  // Get insurance summary
  const getInsuranceSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/insurances/summary/`, {
        headers: getAuthHeaders()
      })
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch insurance summary'
      ElMessage.error(errorMessage)
      throw err
    }
  }

  // Get insurances grouped by coverage level
  const getInsurancesByCoverageGrouped = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/insurances/by-coverage/`, {
        headers: getAuthHeaders()
      })
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch grouped insurances'
      ElMessage.error(errorMessage)
      throw err
    }
  }

  // Clear store data (for logout)
  const clearInsurances = () => {
    insurances.value = []
    pharmacyInfo.value = null
    error.value = null
  }

  // Ensure data is available (fetch if empty)
  const ensureDataAvailable = async () => {
    if (insurances.value.length === 0) {
      await fetchInsurances()
    }
  }

  return {
    // State
    insurances,
    loading,
    error,
    pharmacyInfo,
    
    // Actions
    fetchInsurances,
    addInsurance,
    updateInsurance,
    deleteInsurance,
    getInsuranceById,
    getInsurancesByCoverage,
    getInsuranceSummary,
    getInsurancesByCoverageGrouped,
    clearInsurances,
    ensureDataAvailable
  }
})
