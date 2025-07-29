import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

export const useDoctorStore = defineStore('doctor', () => {
  const doctors = ref([])
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

  // Fetch all doctors for user's pharmacy
  const fetchDoctors = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/`, {
        headers: getAuthHeaders()
      })
      
      if (response.data.results) {
        doctors.value = response.data.results
        pharmacyInfo.value = response.data.pharmacy
      } else {
        doctors.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Failed to fetch doctors'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Add new doctor
  const addDoctor = async (doctorData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post(`${API_BASE_URL}/doctors/`, doctorData, {
        headers: getAuthHeaders()
      })
      
      doctors.value.push(response.data)
      ElMessage.success(`Doctor "${response.data.name}" created successfully!`)
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.name?.[0] || 
                          err.response?.data?.medical_council_number?.[0] ||
                          err.response?.data?.detail || 
                          'Failed to create doctor'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update existing doctor
  const updateDoctor = async (id, doctorData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(`${API_BASE_URL}/doctors/${id}/`, doctorData, {
        headers: getAuthHeaders()
      })
      
      const index = doctors.value.findIndex(doctor => doctor.id === id)
      if (index !== -1) {
        doctors.value[index] = response.data
      }
      
      ElMessage.success(`Doctor "${response.data.name}" updated successfully!`)
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.name?.[0] || 
                          err.response?.data?.medical_council_number?.[0] ||
                          err.response?.data?.detail || 
                          'Failed to update doctor'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete doctor
  const deleteDoctor = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      await axios.delete(`${API_BASE_URL}/doctors/${id}/`, {
        headers: getAuthHeaders()
      })
      
      const index = doctors.value.findIndex(doctor => doctor.id === id)
      if (index !== -1) {
        const deletedDoctor = doctors.value[index]
        doctors.value.splice(index, 1)
        ElMessage.success(`Doctor "${deletedDoctor.name}" deleted successfully!`)
      }
      
      return true
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to delete doctor'
      error.value = errorMessage
      ElMessage.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get doctor by ID
  const getDoctorById = (id) => {
    return doctors.value.find(doctor => doctor.id === id)
  }

  // Get doctors by specialty
  const getDoctorsBySpecialty = (specialty) => {
    return doctors.value.filter(doctor => 
      doctor.specialties && doctor.specialties.includes(specialty)
    )
  }

  // Get all unique specialties
  const getAllSpecialties = () => {
    const allSpecialties = new Set()
    doctors.value.forEach(doctor => {
      if (doctor.specialties) {
        doctor.specialties.forEach(specialty => allSpecialties.add(specialty))
      }
    })
    return Array.from(allSpecialties).sort()
  }

  // Get doctor summary
  const getDoctorSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/summary/`, {
        headers: getAuthHeaders()
      })
      
      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch doctor summary'
      ElMessage.error(errorMessage)
      throw err
    }
  }

  // Search doctors
  const searchDoctors = async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/search/`, {
        headers: getAuthHeaders(),
        params: { q: query }
      })
      
      return response.data.results || response.data
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to search doctors'
      ElMessage.error(errorMessage)
      throw err
    }
  }

  // Get specialties from API
  const fetchSpecialties = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/specialties/`, {
        headers: getAuthHeaders()
      })
      
      return response.data.specialties || []
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch specialties'
      ElMessage.error(errorMessage)
      throw err
    }
  }

  // Clear store data (for logout)
  const clearDoctors = () => {
    doctors.value = []
    pharmacyInfo.value = null
    error.value = null
  }

  // Ensure data is available (fetch if empty)
  const ensureDataAvailable = async () => {
    if (doctors.value.length === 0) {
      await fetchDoctors()
    }
  }

  return {
    // State
    doctors,
    loading,
    error,
    pharmacyInfo,
    
    // Actions
    fetchDoctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    getDoctorById,
    getDoctorsBySpecialty,
    getAllSpecialties,
    getDoctorSummary,
    searchDoctors,
    fetchSpecialties,
    clearDoctors,
    ensureDataAvailable
  }
}) 