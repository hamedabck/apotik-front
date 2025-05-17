import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMedicinesStore = defineStore('medicines', () => {
  const medicines = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Sample medicine data for development
  const sampleMedicines = [
    {
      id: 1,
      genericCode: 'ASP001',
      name: 'Aspirin',
      companyName: 'Bayer',
      quantity: 500,
      sellingPrice: 9.99,
      fda: true,
      expiryDate: '2025-10-15',
      details: {
        gtinCode: '12345678901234',
        ircCode: 'IRC123456',
        numPerBox: 100,
        englishName: 'Aspirin',
        persianName: 'آسپرین',
        genericName: 'Acetylsalicylic Acid',
        englishCompanyName: 'Bayer',
        persianCompanyName: 'بایر',
        keyword: 'pain relief',
        technicalEvaluation: true,
        pharmacistDescription: 'Used for pain relief and reducing fever'
      },
      stocks: [
        {
          batchNumber: 'B123456',
          price: 9.99,
          expiryDate: '2025-10-15',
          quantity: 300,
          locations: [
            { warehouse: 'Main Warehouse', quantity: 200 },
            { warehouse: 'Pharmacy Shelf A1', quantity: 100 }
          ]
        },
        {
          batchNumber: 'B123457',
          price: 10.99,
          expiryDate: '2026-05-20',
          quantity: 200,
          locations: [
            { warehouse: 'Main Warehouse', quantity: 150 },
            { warehouse: 'Pharmacy Shelf A2', quantity: 50 }
          ]
        }
      ],
      insurances: [
        {
          type: 'Basic Insurance',
          speciality: 'General',
          price: 8.99,
          percentage: 70,
          share: 6.29,
          arz: 0.5,
          total: 8.99,
          numMax: 2,
          ageMax: 65,
          barcodeRequired: true,
          hospitalRequired: false
        }
      ]
    },
    {
      id: 2,
      genericCode: 'PRC001',
      name: 'Paracetamol',
      companyName: 'GlaxoSmithKline',
      quantity: 350,
      sellingPrice: 7.50,
      fda: true,
      expiryDate: '2024-08-30',
      details: {
        gtinCode: '12345678901235',
        ircCode: 'IRC123457',
        numPerBox: 50,
        englishName: 'Paracetamol',
        persianName: 'پاراستامول',
        genericName: 'Acetaminophen',
        englishCompanyName: 'GlaxoSmithKline',
        persianCompanyName: 'گلاکسو اسمیت کلاین',
        keyword: 'pain relief, fever',
        technicalEvaluation: true,
        pharmacistDescription: 'Used for pain relief and reducing fever'
      },
      stocks: [
        {
          batchNumber: 'P123456',
          price: 7.50,
          expiryDate: '2024-08-30',
          quantity: 350,
          locations: [
            { warehouse: 'Main Warehouse', quantity: 250 },
            { warehouse: 'Pharmacy Shelf B1', quantity: 100 }
          ]
        }
      ],
      insurances: [
        {
          type: 'Basic Insurance',
          speciality: 'General',
          price: 6.75,
          percentage: 80,
          share: 5.4,
          arz: 0.4,
          total: 6.75,
          numMax: 3,
          ageMax: 70,
          barcodeRequired: false,
          hospitalRequired: false
        }
      ]
    }
  ]
  
  // Get all medicines
  const fetchMedicines = async () => {
    loading.value = true
    try {
      // In a real app, this would be an API call
      // const response = await api.get('/medicines')
      // medicines.value = response.data
      
      // For development, use sample data
      medicines.value = sampleMedicines
      error.value = null
    } catch (err) {
      error.value = err.message || 'Failed to fetch medicines'
      medicines.value = []
    } finally {
      loading.value = false
    }
  }
  
  // Get medicine by ID
  const getMedicineById = (id) => {
    return medicines.value.find(med => med.id === Number(id)) || null
  }
  
  // Add new medicine
  const addMedicine = async (medicine) => {
    loading.value = true
    try {
      // In a real app, this would be an API call
      // const response = await api.post('/medicines', medicine)
      // const newMedicine = response.data
      
      // For development, simulate adding a new medicine
      const newMedicine = {
        ...medicine,
        id: medicines.value.length + 1
      }
      
      medicines.value.push(newMedicine)
      error.value = null
      return newMedicine
    } catch (err) {
      error.value = err.message || 'Failed to add medicine'
      throw error.value
    } finally {
      loading.value = false
    }
  }
  
  // Update medicine
  const updateMedicine = async (id, medicineData) => {
    loading.value = true
    try {
      // In a real app, this would be an API call
      // const response = await api.put(`/medicines/${id}`, medicineData)
      // const updatedMedicine = response.data
      
      // For development, simulate updating a medicine
      const index = medicines.value.findIndex(med => med.id === Number(id))
      if (index === -1) {
        throw new Error('Medicine not found')
      }
      
      medicines.value[index] = { ...medicines.value[index], ...medicineData }
      error.value = null
      return medicines.value[index]
    } catch (err) {
      error.value = err.message || 'Failed to update medicine'
      throw error.value
    } finally {
      loading.value = false
    }
  }
  
  // Delete medicine
  const deleteMedicine = async (id) => {
    loading.value = true
    try {
      // In a real app, this would be an API call
      // await api.delete(`/medicines/${id}`)
      
      // For development, simulate deleting a medicine
      const index = medicines.value.findIndex(med => med.id === Number(id))
      if (index === -1) {
        throw new Error('Medicine not found')
      }
      
      medicines.value.splice(index, 1)
      error.value = null
      return true
    } catch (err) {
      error.value = err.message || 'Failed to delete medicine'
      throw error.value
    } finally {
      loading.value = false
    }
  }
  
  // Adjust medicine stock
  const adjustStock = async (id, adjustmentData) => {
    loading.value = true
    try {
      // In a real app, this would be an API call
      // const response = await api.post(`/medicines/${id}/stock-adjustment`, adjustmentData)
      
      // For development, simulate adjusting stock
      const medicine = medicines.value.find(med => med.id === Number(id))
      if (!medicine) {
        throw new Error('Medicine not found')
      }
      
      // Find batch
      const batch = medicine.stocks.find(stock => stock.batchNumber === adjustmentData.batchNumber)
      if (!batch) {
        throw new Error('Batch not found')
      }
      
      // Apply adjustment
      batch.quantity += adjustmentData.quantity // Can be negative for removal
      medicine.quantity += adjustmentData.quantity
      
      error.value = null
      return medicine
    } catch (err) {
      error.value = err.message || 'Failed to adjust stock'
      throw error.value
    } finally {
      loading.value = false
    }
  }
  
  return {
    medicines,
    loading,
    error,
    fetchMedicines,
    getMedicineById,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    adjustStock
  }
}) 