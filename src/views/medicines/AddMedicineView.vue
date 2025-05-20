<template>
  <div class="add-medicine-page">
    <div class="page-header">
      <h1 class="page-title">Add New Medicine</h1>
    </div>
    
    <div class="card">
      <el-tabs tab-position="top" class="medicine-tabs">
        <el-tab-pane label="Details">
          <MedicineDetailsForm 
            v-model="medicineForm.details"
            ref="detailsFormRef"
          />
        </el-tab-pane>
        
        <el-tab-pane label="Stock">
          <MedicineStockForm 
            v-model="medicineForm.stocks"
          />
        </el-tab-pane>
        
        <el-tab-pane label="Insurance">
          <MedicineInsuranceForm 
            v-model="medicineForm.insurances"
          />
        </el-tab-pane>
      </el-tabs>
      
      <div class="form-actions">
        <el-button @click="cancel">Cancel</el-button>
        <el-button type="primary" @click="saveMedicine" :loading="saving">Save Medicine</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMedicinesStore } from '@/store/medicines'
import { ElMessage } from 'element-plus'
import MedicineDetailsForm from '@/components/medicine/MedicineDetailsForm.vue'
import MedicineStockForm from '@/components/medicine/MedicineStockForm.vue'
import MedicineInsuranceForm from '@/components/medicine/MedicineInsuranceForm.vue'

const router = useRouter()
const medicinesStore = useMedicinesStore()
const detailsFormRef = ref(null)
const saving = ref(false)

// Initialize form with empty values
const medicineForm = reactive({
  details: {
    gtinCode: '',
    ircCode: '',
    genericCode: '',
    numPerBox: 1,
    englishName: '',
    persianName: '',
    genericName: '',
    englishCompanyName: '',
    persianCompanyName: '',
    keyword: '',
    technicalEvaluation: false,
    pharmacistDescription: ''
  },
  stocks: [
    {
      batchNumber: '',
      price: 0,
      expiryDate: '',
      quantity: 0,
      locations: [
        {
          warehouse: 'Main Warehouse',
          quantity: 0
        }
      ]
    }
  ],
  insurances: []
})

// Form Actions
const saveMedicine = async () => {
  try {
    await detailsFormRef.value.validate()
    
    saving.value = true
    
    // Calculate total quantity from batches
    const totalQuantity = medicineForm.stocks.reduce(
      (sum, batch) => sum + batch.quantity, 0
    )
    
    // Create the medicine object
    const medicine = {
      genericCode: medicineForm.details.genericCode,
      name: medicineForm.details.englishName,
      companyName: medicineForm.details.englishCompanyName,
      quantity: totalQuantity,
      sellingPrice: medicineForm.stocks[0].price, // Using first batch price as selling price
      fda: false, // Default value
      expiryDate: medicineForm.stocks[0].expiryDate, // Using first batch expiry as main expiry
      details: medicineForm.details,
      stocks: medicineForm.stocks,
      insurances: medicineForm.insurances
    }
    
    // Save to store/API
    await medicinesStore.addMedicine(medicine)
    
    ElMessage({
      type: 'success',
      message: 'Medicine added successfully'
    })
    
    router.push({ name: 'MedicinesList' })
  } catch (error) {
    console.error('Form validation failed:', error)
    ElMessage({
      type: 'error',
      message: 'Please check the form for errors'
    })
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push({ name: 'MedicinesList' })
}
</script>

<style scoped>
.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 