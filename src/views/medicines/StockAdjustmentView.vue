<template>
  <div class="stock-adjustment-page">
    <div class="page-header">
      <h1 class="page-title">Stock Adjustment</h1>
    </div>
    
    <div class="card">
      <el-steps :active="currentStep" finish-status="success" simple style="margin-bottom: 30px">
        <el-step title="Select Medicine" />
        <el-step title="Choose Batch" />
        <el-step title="Adjust Stock" />
        <el-step title="Confirm" />
      </el-steps>
      
      <!-- Step 1: Select Medicine -->
      <div v-if="currentStep === 0">
        <h3 class="step-title">Select Medicine to Adjust</h3>
        
        <el-form :model="adjustmentForm" label-width="120px">
          <el-form-item label="Search">
            <el-input 
              v-model="searchQuery" 
              placeholder="Type medicine name or code" 
              clearable 
              @input="handleSearch" />
          </el-form-item>
          
          <el-table
            v-loading="loading"
            :data="filteredMedicines"
            style="width: 100%"
            @row-click="selectMedicine"
            highlight-current-row
            border>
            
            <el-table-column prop="genericCode" label="Generic Code" width="120" />
            
            <el-table-column label="Medicine - Company" width="250">
              <template #default="scope">
                <div>
                  <div class="medicine-name">{{ scope.row.name }}</div>
                  <div class="company-name">{{ scope.row.companyName }}</div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column prop="quantity" label="Current Stock" width="120" />
            
            <el-table-column label="Action" width="120" fixed="right">
              <template #default="scope">
                <el-button 
                  size="small" 
                  type="primary"
                  @click.stop="selectMedicine(scope.row)">
                  Select
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[5, 10, 20, 50]"
              background
              layout="total, sizes, prev, pager, next"
              :total="filteredMedicines.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange" />
          </div>
        </el-form>
      </div>
      
      <!-- Step 2: Select Batch -->
      <div v-else-if="currentStep === 1">
        <h3 class="step-title">Select Batch to Adjust</h3>
        
        <div class="selected-medicine-info">
          <strong>Selected Medicine:</strong> {{ selectedMedicine.name }} ({{ selectedMedicine.genericCode }})
        </div>
        
        <el-table
          :data="selectedMedicine.stocks"
          style="width: 100%; margin-top: 20px;"
          @row-click="selectBatch"
          highlight-current-row
          border>
          
          <el-table-column prop="batchNumber" label="Batch Number" width="150" />
          
          <el-table-column label="Expiry Date" width="150">
            <template #default="scope">
              <div>{{ formatDate(scope.row.expiryDate) }}</div>
              <div>
                <span :class="['status-pill', getExpiryStatusClass(scope.row.expiryDate)]">
                  {{ getExpiryStatus(scope.row.expiryDate) }}
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="quantity" label="Current Quantity" width="150" />
          
          <el-table-column label="Action" width="120" fixed="right">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary"
                @click.stop="selectBatch(scope.row)">
                Select
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="step-actions">
          <el-button @click="previousStep">Back</el-button>
          <el-button type="primary" @click="createNewBatch">Create New Batch</el-button>
        </div>
      </div>
      
      <!-- Step 3: Adjust Stock -->
      <div v-else-if="currentStep === 2">
        <h3 class="step-title">Adjust Stock Quantity</h3>
        
        <div class="selected-medicine-info">
          <div><strong>Medicine:</strong> {{ selectedMedicine.name }} ({{ selectedMedicine.genericCode }})</div>
          <div>
            <strong>Batch:</strong> {{ selectedBatch.batchNumber }} | 
            <strong>Current Quantity:</strong> {{ selectedBatch.quantity }} units
          </div>
        </div>
        
        <el-form 
          :model="adjustmentForm" 
          :rules="adjustmentRules" 
          ref="adjustmentFormRef"
          label-width="180px"
          class="adjustment-form">
          
          <el-form-item label="Adjustment Type" prop="adjustmentType">
            <el-select v-model="adjustmentForm.adjustmentType" style="width: 100%">
              <el-option label="Add Stock (Restock)" value="add" />
              <el-option label="Remove Stock (Loss/Damage)" value="remove" />
              <el-option label="Remove Stock (Expired)" value="expired" />
              <el-option label="Correction (Stock Count)" value="correction" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Quantity" prop="quantity">
            <el-input-number 
              v-model="adjustmentForm.quantity" 
              :min="1" 
              controls-position="right" />
          </el-form-item>
          
          <el-form-item label="Location" prop="location">
            <el-select v-model="adjustmentForm.location" style="width: 100%">
              <el-option 
                v-for="(location, index) in selectedBatch.locations" 
                :key="index"
                :label="`${location.warehouse} (Current: ${location.quantity})`"
                :value="location.warehouse" />
              <el-option label="New Location" value="new" />
            </el-select>
          </el-form-item>
          
          <el-form-item v-if="adjustmentForm.location === 'new'" label="New Location Name" prop="newLocationName">
            <el-input v-model="adjustmentForm.newLocationName" />
          </el-form-item>
          
          <el-form-item label="Date" prop="date">
            <el-date-picker
              v-model="adjustmentForm.date"
              type="date"
              placeholder="Select date"
              style="width: 100%" />
          </el-form-item>
          
          <el-form-item label="Reason" prop="reason">
            <el-input 
              v-model="adjustmentForm.reason"
              type="textarea"
              rows="3"
              placeholder="Explain the reason for this adjustment" />
          </el-form-item>
        </el-form>
        
        <div class="step-actions">
          <el-button @click="previousStep">Back</el-button>
          <el-button type="primary" @click="validateAdjustmentForm">Next</el-button>
        </div>
      </div>
      
      <!-- Step 4: Confirm -->
      <div v-else-if="currentStep === 3">
        <h3 class="step-title">Confirm Adjustment</h3>
        
        <el-alert 
          v-if="adjustmentPreview.showWarning"
          :title="adjustmentPreview.warningTitle"
          type="warning"
          show-icon
          style="margin-bottom: 20px">
          <p>{{ adjustmentPreview.warningMessage }}</p>
        </el-alert>
        
        <el-descriptions title="Adjustment Summary" :column="1" border>
          <el-descriptions-item label="Medicine">
            {{ selectedMedicine.name }} ({{ selectedMedicine.genericCode }})
          </el-descriptions-item>
          
          <el-descriptions-item label="Batch Number">
            {{ selectedBatch.batchNumber }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Adjustment Type">
            {{ getAdjustmentTypeLabel(adjustmentForm.adjustmentType) }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Quantity">
            <strong>{{ adjustmentForm.quantity }}</strong> units
          </el-descriptions-item>
          
          <el-descriptions-item label="Location">
            {{ adjustmentForm.location === 'new' ? adjustmentForm.newLocationName : adjustmentForm.location }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Date">
            {{ formatDate(adjustmentForm.date) }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Reason">
            {{ adjustmentForm.reason }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Current Stock">
            {{ selectedBatch.quantity }} units
          </el-descriptions-item>
          
          <el-descriptions-item label="New Stock After Adjustment">
            <strong>{{ adjustmentPreview.newQuantity }}</strong> units
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="step-actions">
          <el-button @click="previousStep">Back</el-button>
          <el-button type="success" @click="submitAdjustment" :loading="submitting">Confirm Adjustment</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMedicinesStore } from '@/store/medicines'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const medicinesStore = useMedicinesStore()
const adjustmentFormRef = ref(null)

const loading = ref(true)
const submitting = ref(false)
const currentStep = ref(0)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const selectedMedicine = ref(null)
const selectedBatch = ref(null)

// Initialize form with default values
const adjustmentForm = reactive({
  adjustmentType: 'add',
  quantity: 1,
  location: '',
  newLocationName: '',
  date: new Date(),
  reason: ''
})

// Form validation rules
const adjustmentRules = reactive({
  adjustmentType: [
    { required: true, message: 'Please select adjustment type', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: 'Please enter quantity', trigger: 'blur' },
    { type: 'number', min: 1, message: 'Quantity must be at least 1', trigger: 'blur' }
  ],
  location: [
    { required: true, message: 'Please select location', trigger: 'change' }
  ],
  newLocationName: [
    { 
      required: true, 
      message: 'Please enter new location name', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (adjustmentForm.location === 'new' && !value) {
          callback(new Error('Please enter new location name'))
        } else {
          callback()
        }
      }
    }
  ],
  date: [
    { required: true, message: 'Please select date', trigger: 'change' }
  ],
  reason: [
    { required: true, message: 'Please enter reason', trigger: 'blur' },
    { min: 5, message: 'Reason should be at least 5 characters', trigger: 'blur' }
  ]
})

// Fetch medicines on component mount
onMounted(() => {
  medicinesStore.fetchMedicines().then(() => {
    loading.value = false
    
    // Check if medicineId is passed in query params
    const medicineId = route.query.medicineId
    if (medicineId) {
      const medicine = medicinesStore.getMedicineById(parseInt(medicineId))
      if (medicine) {
        selectMedicine(medicine)
      }
    }
  })
})

// Computed properties for filtered medicines
const filteredMedicines = computed(() => {
  let medicines = [...medicinesStore.medicines]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    medicines = medicines.filter(medicine => 
      medicine.name.toLowerCase().includes(query) || 
      medicine.genericCode.toLowerCase().includes(query)
    )
  }
  
  return medicines
})

// Computed property for adjustment preview
const adjustmentPreview = computed(() => {
  if (!selectedBatch.value) return { newQuantity: 0 }
  
  let newQuantity = selectedBatch.value.quantity
  
  if (adjustmentForm.adjustmentType === 'add') {
    newQuantity += adjustmentForm.quantity
  } else {
    newQuantity -= adjustmentForm.quantity
  }
  
  const showWarning = newQuantity < 0
  
  return {
    newQuantity: Math.max(0, newQuantity), // Don't allow negative quantity
    showWarning,
    warningTitle: 'Stock Quantity Warning',
    warningMessage: showWarning 
      ? `The adjustment will result in negative stock (${newQuantity}). Stock will be set to 0 instead.`
      : ''
  }
})

// Methods
const handleSearch = () => {
  currentPage.value = 1
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const selectMedicine = (medicine) => {
  selectedMedicine.value = medicine
  nextStep()
}

const selectBatch = (batch) => {
  selectedBatch.value = batch
  
  // Set default location
  if (batch.locations && batch.locations.length > 0) {
    adjustmentForm.location = batch.locations[0].warehouse
  } else {
    adjustmentForm.location = 'new'
    adjustmentForm.newLocationName = 'Main Warehouse'
  }
  
  nextStep()
}

const createNewBatch = () => {
  if (!selectedMedicine.value) return
  
  // Create a new batch object
  const newBatch = {
    batchNumber: `B${Date.now().toString().slice(-6)}`,
    price: selectedMedicine.value.sellingPrice,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    quantity: 0,
    locations: [
      { warehouse: 'Main Warehouse', quantity: 0 }
    ]
  }
  
  // Set as selected batch
  selectedBatch.value = newBatch
  
  // Set default location
  adjustmentForm.location = 'Main Warehouse'
  
  nextStep()
}

const validateAdjustmentForm = () => {
  if (!adjustmentFormRef.value) return
  
  adjustmentFormRef.value.validate((valid) => {
    if (valid) {
      nextStep()
    } else {
      ElMessage.error('Please complete all required fields correctly')
    }
  })
}

const submitAdjustment = async () => {
  try {
    submitting.value = true
    
    // Determine quantity change based on adjustment type
    let quantityChange = adjustmentForm.quantity
    if (adjustmentForm.adjustmentType !== 'add') {
      quantityChange = -quantityChange
    }
    
    // Create adjustment data
    const adjustmentData = {
      medicineId: selectedMedicine.value.id,
      batchNumber: selectedBatch.value.batchNumber,
      quantity: quantityChange,
      location: adjustmentForm.location === 'new' ? adjustmentForm.newLocationName : adjustmentForm.location,
      date: adjustmentForm.date,
      reason: adjustmentForm.reason,
      type: adjustmentForm.adjustmentType
    }
    
    // Check if this is a new batch
    const isNewBatch = !selectedMedicine.value.stocks.some(
      stock => stock.batchNumber === selectedBatch.value.batchNumber
    )
    
    if (isNewBatch) {
      // Add new batch to medicine
      selectedMedicine.value.stocks.push(selectedBatch.value)
    }
    
    // Apply adjustment
    await medicinesStore.adjustStock(selectedMedicine.value.id, adjustmentData)
    
    ElMessage({
      type: 'success',
      message: 'Stock adjustment applied successfully'
    })
    
    // Navigate back to medicine detail or list
    router.push({ 
      name: selectedMedicine.value ? 'MedicineDetail' : 'MedicinesList',
      params: selectedMedicine.value ? { id: selectedMedicine.value.id } : {}
    })
    
  } catch (error) {
    ElMessage({
      type: 'error',
      message: `Failed to apply adjustment: ${error.message}`
    })
  } finally {
    submitting.value = false
  }
}

const nextStep = () => {
  currentStep.value++
}

const previousStep = () => {
  currentStep.value--
}

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString()
}

const getExpiryStatus = (dateString) => {
  if (!dateString) return 'Unknown'
  
  const expiryDate = new Date(dateString)
  const today = new Date()
  const diffTime = expiryDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return 'Expired'
  } else if (diffDays < 90) {
    return 'Near Expiry'
  } else {
    return 'Safe'
  }
}

const getExpiryStatusClass = (dateString) => {
  const status = getExpiryStatus(dateString)
  switch (status) {
    case 'Expired':
      return 'status-expired'
    case 'Near Expiry':
      return 'status-near-expiry'
    default:
      return 'status-safe'
  }
}

const getAdjustmentTypeLabel = (type) => {
  switch (type) {
    case 'add':
      return 'Add Stock (Restock)'
    case 'remove':
      return 'Remove Stock (Loss/Damage)'
    case 'expired':
      return 'Remove Stock (Expired)'
    case 'correction':
      return 'Correction (Stock Count)'
    default:
      return type
  }
}
</script>

<style scoped>
.stock-adjustment-page {
  padding-bottom: 30px;
}

.step-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.2rem;
  color: var(--primary-color);
}

.selected-medicine-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: var(--background-color);
  border-radius: 4px;
}

.adjustment-form {
  margin-top: 20px;
  max-width: 600px;
}

.step-actions {
  margin-top: 30px;
  display: flex;
  justify-content: space-between;
}

.medicine-name {
  font-weight: 500;
}

.company-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 