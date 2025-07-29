import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

export const usePharmacyDrugStore = defineStore('pharmacyDrug', () => {
  const drugs = ref([])
  const batches = ref([])
  const insurances = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pharmacyInfo = ref(null)
  const drugInsurances = ref([])

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Fetch all drugs for user's pharmacy
  const fetchDrugs = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/pharmacy-drugs/`, {
        headers: getAuthHeaders()
      })
      
      drugs.value = response.data.results || response.data
      
      // Process each drug to add computed fields for the table
      drugs.value = drugs.value.map(drug => ({
        ...drug,
        // Add selling_price from maximum_price if available
        selling_price: drug.maximum_price || drug.latest_price || 0,
        // Add total_quantity from total_stock
        total_quantity: drug.total_stock || 0,
        // Add expiry information
        nearest_expiry_date: drug.nearest_expiry_info?.nearest_expiry_date || null,
        days_to_expire: drug.nearest_expiry_info?.days_to_expire || null
      }))
      
      // Extract pharmacy info if available
      if (response.data.pharmacy_info) {
        pharmacyInfo.value = response.data.pharmacy_info
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to fetch drugs'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create or update drug (handles GTIN uniqueness)
  const createOrUpdateDrug = async (drugData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_BASE_URL}/pharmacy-drugs/`, drugData, {
        headers: getAuthHeaders()
      })
      
      // Check if drug was created or updated
      const drug = response.data
      const existingIndex = drugs.value.findIndex(d => d.id === drug.id)
      
      if (existingIndex !== -1) {
        // Updated existing drug
        drugs.value[existingIndex] = drug
        ElMessage.success('Drug updated successfully')
      } else {
        // Created new drug
        drugs.value.push(drug)
        ElMessage.success('Drug created successfully')
      }
      
      return drug
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to save drug'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update drug
  const updateDrug = async (drugId, drugData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(`${API_BASE_URL}/pharmacy-drugs/${drugId}/`, drugData, {
        headers: getAuthHeaders()
      })
      
      const updatedDrug = response.data
      const index = drugs.value.findIndex(d => d.id === drugId)
      if (index !== -1) {
        drugs.value[index] = updatedDrug
      }
      
      ElMessage.success('Drug updated successfully')
      return updatedDrug
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to update drug'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete drug
  const deleteDrug = async (drugId) => {
    loading.value = true
    error.value = null
    
    try {
      await axios.delete(`${API_BASE_URL}/pharmacy-drugs/${drugId}/`, {
        headers: getAuthHeaders()
      })
      
      drugs.value = drugs.value.filter(d => d.id !== drugId)
      ElMessage.success('Drug deleted successfully')
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to delete drug'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Search drugs
  const searchDrugs = async (query) => {
    if (!query) return []
    
    try {
      const response = await axios.get(`${API_BASE_URL}/pharmacy-drugs/search/`, {
        params: { q: query },
        headers: getAuthHeaders()
      })
      
      return response.data.results || []
    } catch (err) {
      console.error('Search failed:', err)
      return []
    }
  }

  // Get drug by GTIN
  const getDrugByGtin = async (gtin) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pharmacy-drugs/${gtin}/by_gtin/`, {
        headers: getAuthHeaders()
      })
      
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        return null // Drug not found
      }
      throw err
    }
  }

  // Get low stock drugs
  const getLowStockDrugs = async (threshold = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pharmacy-drugs/low_stock/`, {
        params: { threshold },
        headers: getAuthHeaders()
      })
      
      return response.data.results || []
    } catch (err) {
      console.error('Failed to fetch low stock drugs:', err)
      return []
    }
  }

  // Get drugs with expiring batches
  const getExpiringDrugs = async (days = 30) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pharmacy-drugs/expiring_soon/`, {
        params: { days },
        headers: getAuthHeaders()
      })
      
      return response.data.results || []
    } catch (err) {
      console.error('Failed to fetch expiring drugs:', err)
      return []
    }
  }

  // Batch management functions
  const fetchBatches = async (drugId = null) => {
    loading.value = true
    error.value = null
    
    try {
      let url = `${API_BASE_URL}/drug-batches/`
      if (drugId) {
        url += `?drug=${drugId}`
      }
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      })
      
      batches.value = response.data.results || response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to fetch batches'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createBatch = async (batchData) => {
    loading.value = true
    error.value = null
    
    try {
      // The locations data is already in the correct format from the component
      // No need to transform it again
      const response = await axios.post(`${API_BASE_URL}/drug-batches/`, batchData, {
        headers: getAuthHeaders()
      })
      
      const batch = response.data
      batches.value.push(batch)
      ElMessage.success('Batch created successfully')
      return batch
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to create batch'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBatch = async (batchId, batchData) => {
    loading.value = true
    error.value = null
    
    try {
      // The locations data is already in the correct format from the component
      // No need to transform it again
      const response = await axios.put(`${API_BASE_URL}/drug-batches/${batchId}/`, batchData, {
        headers: getAuthHeaders()
      })
      
      const updatedBatch = response.data
      const index = batches.value.findIndex(b => b.id === batchId)
      if (index !== -1) {
        batches.value[index] = updatedBatch
      }
      
      ElMessage.success('Batch updated successfully')
      return updatedBatch
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to update batch'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteBatch = async (batchId) => {
    loading.value = true
    error.value = null
    
    try {
      await axios.delete(`${API_BASE_URL}/drug-batches/${batchId}/`, {
        headers: getAuthHeaders()
      })
      
      batches.value = batches.value.filter(b => b.id !== batchId)
      ElMessage.success('Batch deleted successfully')
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to delete batch'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Save drug selections
  const saveDrugSelections = async (drugId, drugSelections) => {
    loading.value = true
    error.value = null
    
    try {
      // Convert frontend format to backend format
      const drug_selections_list = drugSelections.map(selection => ({
        gtin_code: selection.gtinCode,
        quantity: selection.quantity
      }))
      
      const response = await axios.patch(`${API_BASE_URL}/pharmacy-drugs/${drugId}/`, {
        drug_selections_list
      }, {
        headers: getAuthHeaders()
      })
      
      // Update the drug in the local store
      const updatedDrug = response.data
      const existingIndex = drugs.value.findIndex(d => d.id === updatedDrug.id)
      
      if (existingIndex !== -1) {
        drugs.value[existingIndex] = updatedDrug
      }
      
      ElMessage.success('Drug selections saved successfully')
      return updatedDrug
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to save drug selections'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Insurance management functions
  const fetchDrugInsurances = async (drugId) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/drug-insurances/?drug=${drugId}`, {
        headers: getAuthHeaders()
      })
      
      drugInsurances.value = response.data.results || response.data
      return drugInsurances.value
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to fetch drug insurances'
      console.error('Error fetching drug insurances:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createDrugInsurance = async (insuranceData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_BASE_URL}/drug-insurances/`, insuranceData, {
        headers: getAuthHeaders()
      })
      
      const newInsurance = response.data
      drugInsurances.value.push(newInsurance)
      ElMessage.success('Drug insurance created successfully')
      return newInsurance
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to create drug insurance'
      console.error('Error creating drug insurance:', err)
      
      // Handle validation errors
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'object') {
          const errorMessages = []
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`)
            } else {
              errorMessages.push(`${field}: ${messages}`)
            }
          }
          ElMessage.error(errorMessages.join('\n'))
        }
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateDrugInsurance = async (insuranceId, insuranceData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(`${API_BASE_URL}/drug-insurances/${insuranceId}/`, insuranceData, {
        headers: getAuthHeaders()
      })
      
      const updatedInsurance = response.data
      const index = drugInsurances.value.findIndex(insurance => insurance.id === insuranceId)
      if (index !== -1) {
        drugInsurances.value[index] = updatedInsurance
      }
      
      ElMessage.success('Drug insurance updated successfully')
      return updatedInsurance
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to update drug insurance'
      console.error('Error updating drug insurance:', err)
      
      // Handle validation errors
      if (err.response?.data) {
        const errorData = err.response.data
        if (typeof errorData === 'object') {
          const errorMessages = []
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`)
            } else {
              errorMessages.push(`${field}: ${messages}`)
            }
          }
          ElMessage.error(errorMessages.join('\n'))
        }
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteDrugInsurance = async (insuranceId) => {
    loading.value = true
    error.value = null
    
    try {
      await axios.delete(`${API_BASE_URL}/drug-insurances/${insuranceId}/`, {
        headers: getAuthHeaders()
      })
      
      drugInsurances.value = drugInsurances.value.filter(insurance => insurance.id !== insuranceId)
      ElMessage.success('Drug insurance deleted successfully')
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to delete drug insurance'
      console.error('Error deleting drug insurance:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getDrugInsuranceById = (insuranceId) => {
    return drugInsurances.value.find(insurance => insurance.id === insuranceId)
  }

  // Batch location management
  const createBatchLocation = async (locationData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/batch-locations/`, locationData, {
        headers: getAuthHeaders()
      })
      
      ElMessage.success('Batch location created successfully')
      return response.data
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to create batch location'
      ElMessage.error(errorMsg)
      throw err
    }
  }

  const updateBatchLocation = async (locationId, locationData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/batch-locations/${locationId}/`, locationData, {
        headers: getAuthHeaders()
      })
      
      ElMessage.success('Batch location updated successfully')
      return response.data
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to update batch location'
      ElMessage.error(errorMsg)
      throw err
    }
  }

  const deleteBatchLocation = async (locationId) => {
    try {
      await axios.delete(`${API_BASE_URL}/batch-locations/${locationId}/`, {
        headers: getAuthHeaders()
      })
      
      ElMessage.success('Batch location deleted successfully')
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete batch location'
      ElMessage.error(errorMsg)
      throw err
    }
  }

  // Calculate total quantity for a drug from its batches
  const calculateTotalQuantity = async (drugId) => {
    try {
      await fetchBatches(drugId)
      const drugBatches = batches.value
      const totalQuantity = drugBatches.reduce((total, batch) => {
        return total + (batch.quantity || 0)
      }, 0)
      
      // Update the drug in the store with calculated total quantity
      const drugIndex = drugs.value.findIndex(d => d.id === drugId)
      if (drugIndex !== -1) {
        drugs.value[drugIndex].total_quantity = totalQuantity
      }
      
      return totalQuantity
    } catch (error) {
      console.error('Error calculating total quantity:', error)
      return 0
    }
  }

  // Get drug with calculated total quantity
  const getDrugWithTotalQuantity = async (drugId) => {
    const drug = drugs.value.find(d => d.id === drugId)
    if (!drug) return null
    
    // If total_quantity is not available or is 0, calculate it from batches
    if (!drug.total_quantity || drug.total_quantity === 0) {
      await calculateTotalQuantity(drugId)
    }
    
    return drugs.value.find(d => d.id === drugId)
  }

  // Update all batches of a drug to TTAC price
  const updateDrugBatchesToTtacPrice = async (drugId, ttacPrice) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.patch(`${API_BASE_URL}/pharmacy-drugs/${drugId}/update_batches_to_ttac_price/`, {
        ttac_price: ttacPrice
      }, {
        headers: getAuthHeaders()
      })
      
      // Update the drug in the local store
      const updatedDrug = response.data
      const existingIndex = drugs.value.findIndex(d => d.id === updatedDrug.id)
      
      if (existingIndex !== -1) {
        drugs.value[existingIndex] = {
          ...drugs.value[existingIndex],
          ...updatedDrug,
          // Ensure computed fields are maintained
          selling_price: updatedDrug.maximum_price || updatedDrug.latest_price || 0,
          total_quantity: updatedDrug.total_stock || 0,
          nearest_expiry_date: updatedDrug.nearest_expiry_info?.nearest_expiry_date || null,
          days_to_expire: updatedDrug.nearest_expiry_info?.days_to_expire || null
        }
      }
      
      ElMessage.success('Drug batch prices updated to TTAC price successfully')
      return updatedDrug
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to update drug batch prices'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear all data
  const clearData = () => {
    drugs.value = []
    batches.value = []
    insurances.value = []
    error.value = null
    pharmacyInfo.value = null
    drugInsurances.value = []
  }

  return {
    // State
    drugs,
    batches,
    insurances,
    loading,
    error,
    pharmacyInfo,
    drugInsurances,
    
    // Drug actions
    fetchDrugs,
    createOrUpdateDrug,
    updateDrug,
    deleteDrug,
    searchDrugs,
    getDrugByGtin,
    getLowStockDrugs,
    getExpiringDrugs,
    
    // Batch actions
    fetchBatches,
    createBatch,
    updateBatch,
    deleteBatch,
    saveDrugSelections,
    
    // Insurance actions
    fetchDrugInsurances,
    createDrugInsurance,
    updateDrugInsurance,
    deleteDrugInsurance,
    getDrugInsuranceById,
    
    // Batch location actions
    createBatchLocation,
    updateBatchLocation,
    deleteBatchLocation,
    
    // Utility
    clearData,
    calculateTotalQuantity,
    getDrugWithTotalQuantity,
    updateDrugBatchesToTtacPrice
  }
}) 