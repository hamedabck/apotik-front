<template>
  <el-form :model="modelValue" label-width="180px" class="drug-selection-form">
    <div class="drug-selection-entries">
      <h3 class="form-section-title">
        Attendant Drugs Selection
      </h3>
      
      <!-- Drug Selection Form Card -->
      <div class="drug-selection-form-card">
        <div class="selection-header">
          <h4>{{ isEditing ? 'Edit Drug Quantity' : 'Add Drug to List' }}</h4>
          <div class="header-buttons">
            <el-button 
              v-if="isEditing"
              @click="cancelEdit"
              size="small"
              class="cancel-button"
            >
              <el-icon><i-ep-close /></el-icon> Cancel
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              @click="addDrugToList"
              :disabled="!currentSelection.drugId || !currentSelection.quantity || isDuplicateDrug"
              class="add-button"
            >
              <el-icon><i-ep-plus v-if="!isEditing" /><i-ep-check v-else /></el-icon> 
              {{ isEditing ? 'Update Drug' : 'Add to List' }}
            </el-button>
          </div>
        </div>
        
        <div class="selection-form-content">
          <!-- Drug Search and Selection -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">Search & Select Drug</label>
              <el-select
                v-model="currentSelection.drugId"
                filterable
                remote
                reserve-keyword
                placeholder="Search for drugs by name or GTIN..."
                :remote-method="searchDrugs"
                :loading="searchLoading"
                @change="handleDrugSelection"
                class="drug-search-select"
                :class="{ 'duplicate-drug': isDuplicateDrug }"
              >
                <el-option
                  v-for="drug in searchResults"
                  :key="drug.id"
                  :label="`${drug.persian_name || drug.english_name} (${drug.gtin_code})`"
                  :value="drug.id"
                >
                  <div class="drug-option">
                    <div class="drug-name">
                      {{ drug.persian_name || drug.english_name }}
                    </div>
                    <div class="drug-details">
                      GTIN: {{ drug.gtin_code }} | Company: {{ drug.persian_company_name || drug.english_company_name }}
                    </div>
                  </div>
                </el-option>
              </el-select>
              <span v-if="isDuplicateDrug" class="error-text">
                This drug is already in the list
              </span>
            </div>
            
            <div class="form-group">
              <label class="compact-label">Quantity</label>
              <el-input-number
                v-model="currentSelection.quantity"
                :min="1"
                :max="99999"
                placeholder="Enter quantity"
                class="quantity-input"
              />
              <span class="help-text">
                Enter the quantity for this drug
              </span>
            </div>
          </div>
          
          <!-- Selected Drug Display -->
          <div v-if="selectedDrug" class="selected-drug-display">
            <div class="drug-info">
              <div class="drug-name">{{ selectedDrug.persian_name || selectedDrug.english_name }}</div>
              <div class="drug-meta">
                <span class="gtin">GTIN: {{ selectedDrug.gtin_code }}</span>
                <span class="company">{{ selectedDrug.persian_company_name || selectedDrug.english_company_name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Selected Drugs Table -->
      <div class="drugs-table-container" v-if="modelValue.length > 0">
        <h4 class="table-title">Selected Drugs List</h4>
        <el-table :data="modelValue" stripe style="width: 100%" border>
          <el-table-column label="Drug Name" min-width="200">
            <template #default="scope">
              <div class="drug-cell">
                <div class="drug-name">{{ scope.row.drugName }}</div>
                <div class="drug-gtin">GTIN: {{ scope.row.gtinCode }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="Company" width="180">
            <template #default="scope">
              {{ scope.row.companyName }}
            </template>
          </el-table-column>
          
          <el-table-column label="Quantity" width="120">
            <template #default="scope">
              <div :class="{ 'editing-quantity': isEditing && editingIndex === scope.$index }">
                <strong>{{ formatNumber(scope.row.quantity) }}</strong>
                <el-tag v-if="isEditing && editingIndex === scope.$index" type="warning" size="small" style="margin-left: 8px">
                  Editing
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="Operations" width="200">
            <template #default="scope">
              <div class="operations-container">
                <el-button
                  size="small"
                  @click="editDrug(scope.$index)"
                  type="primary"
                  plain
                  :disabled="isEditing && editingIndex === scope.$index"
                >
                  {{ isEditing && editingIndex === scope.$index ? 'Editing...' : 'Edit' }}
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  @click="removeDrug(scope.$index)"
                  :disabled="isEditing && editingIndex === scope.$index"
                >
                  Remove
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="no-data-message" v-else>
        <p>No drugs selected yet. Use the search field above to find and add drugs.</p>
      </div>
    </div>
  </el-form>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  medicineDetails: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const pharmacyDrugStore = usePharmacyDrugStore()
const searchLoading = ref(false)
const searchResults = ref([])
const isEditing = ref(false)
const editingIndex = ref(-1)

const currentSelection = reactive({
  drugId: null,
  quantity: 1
})

const selectedDrug = ref(null)

// Computed property to check if current drug is duplicate
const isDuplicateDrug = computed(() => {
  if (!currentSelection.drugId) return false
  return isDuplicateDrugId(currentSelection.drugId, editingIndex.value)
})

// Search drugs function
const searchDrugs = async (query) => {
  if (!query || query.length < 2) {
    searchResults.value = []
    return
  }
  
  searchLoading.value = true
  try {
    // Search in the existing drugs from the store
    const results = pharmacyDrugStore.drugs.filter(drug => {
      const searchTerm = query.toLowerCase()
      return (
        (drug.persian_name && drug.persian_name.toLowerCase().includes(searchTerm)) ||
        (drug.english_name && drug.english_name.toLowerCase().includes(searchTerm)) ||
        (drug.gtin_code && drug.gtin_code.toLowerCase().includes(searchTerm)) ||
        (drug.generic_name && drug.generic_name.toLowerCase().includes(searchTerm))
      )
    })
    
    searchResults.value = results.slice(0, 20) // Limit to 20 results
  } catch (error) {
    console.error('Error searching drugs:', error)
    ElMessage.error('Failed to search drugs')
  } finally {
    searchLoading.value = false
  }
}

// Handle drug selection
const handleDrugSelection = (drugId) => {
  const drug = pharmacyDrugStore.drugs.find(d => d.id === drugId)
  if (drug) {
    selectedDrug.value = drug
  }
}

// Check for duplicate drug IDs (excluding current editing drug)
const isDuplicateDrugId = (drugId, excludeIndex = -1) => {
  return props.modelValue.some((item, index) => 
    index !== excludeIndex && item.drugId === drugId
  )
}

// Add drug to list
const addDrugToList = async () => {
  if (isEditing.value) {
    return await saveCurrentDrug()
  }
  
  if (!currentSelection.drugId) {
    ElMessage.warning('Please select a drug')
    return
  }
  
  if (!currentSelection.quantity || currentSelection.quantity <= 0) {
    ElMessage.warning('Please enter a valid quantity')
    return
  }
  
  if (isDuplicateDrug.value) {
    ElMessage.warning('This drug is already in the list')
    return
  }
  
  if (!props.medicineDetails.id) {
    ElMessage.warning('Please save the medicine details first')
    return
  }
  
  const drug = pharmacyDrugStore.drugs.find(d => d.id === currentSelection.drugId)
  if (!drug) {
    ElMessage.error('Selected drug not found')
    return
  }
  
  try {
    // Create new drug entry for local display
    const newDrugEntry = {
      drugId: currentSelection.drugId,
      gtinCode: drug.gtin_code,
      drugName: drug.persian_name || drug.english_name,
      companyName: drug.persian_company_name || drug.english_company_name,
      quantity: currentSelection.quantity
    }
    
    // Add to local list first
    const updatedList = [...props.modelValue, newDrugEntry]
    
    // Save to database
    await pharmacyDrugStore.saveDrugSelections(props.medicineDetails.id, updatedList)
    
    // Update local state
    emit('update:modelValue', updatedList)
    
    // Reset form
    resetCurrentSelection()
    ElMessage.success('Drug added and saved successfully')
  } catch (error) {
    console.error('Error saving drug selection:', error)
    ElMessage.error('Failed to save drug selection')
  }
}

// Edit drug
const editDrug = (index) => {
  if (isEditing.value && editingIndex.value !== index) {
    ElMessage.warning('Please finish editing the current drug first, or cancel the edit.')
    return
  }
  
  const drugToEdit = props.modelValue[index]
  
  // Set current selection to the drug being edited
  currentSelection.drugId = drugToEdit.drugId
  currentSelection.quantity = drugToEdit.quantity
  
  // Set selected drug for display
  const drug = pharmacyDrugStore.drugs.find(d => d.id === drugToEdit.drugId)
  selectedDrug.value = drug
  
  // Set editing state
  isEditing.value = true
  editingIndex.value = index
}

// Save current drug (when editing)
const saveCurrentDrug = async () => {
  if (!currentSelection.drugId) {
    ElMessage.warning('Please select a drug')
    return
  }
  
  if (!currentSelection.quantity || currentSelection.quantity <= 0) {
    ElMessage.warning('Please enter a valid quantity')
    return
  }
  
  if (isDuplicateDrug.value) {
    ElMessage.warning('This drug is already in the list')
    return
  }
  
  if (!props.medicineDetails.id) {
    ElMessage.warning('Please save the medicine details first')
    return
  }
  
  const drug = pharmacyDrugStore.drugs.find(d => d.id === currentSelection.drugId)
  if (!drug) {
    ElMessage.error('Selected drug not found')
    return
  }
  
  try {
    const updatedList = [...props.modelValue]
    updatedList[editingIndex.value] = {
      drugId: currentSelection.drugId,
      gtinCode: drug.gtin_code,
      drugName: drug.persian_name || drug.english_name,
      companyName: drug.persian_company_name || drug.english_company_name,
      quantity: currentSelection.quantity
    }
    
    // Save to database
    await pharmacyDrugStore.saveDrugSelections(props.medicineDetails.id, updatedList)
    
    // Update local state
    emit('update:modelValue', updatedList)
    
    // Reset editing state
    isEditing.value = false
    editingIndex.value = -1
    resetCurrentSelection()
    
    ElMessage.success('Drug updated and saved successfully')
  } catch (error) {
    console.error('Error updating drug selection:', error)
    ElMessage.error('Failed to update drug selection')
  }
}

// Remove drug
const removeDrug = async (index) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to remove this drug from the list?',
      'Confirm Remove',
      {
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    if (!props.medicineDetails.id) {
      ElMessage.warning('Please save the medicine details first')
      return
    }
    
    const updatedList = props.modelValue.filter((_, i) => i !== index)
    
    // Save to database
    await pharmacyDrugStore.saveDrugSelections(props.medicineDetails.id, updatedList)
    
    // Update local state
    emit('update:modelValue', updatedList)
    
    ElMessage.success('Drug removed and saved successfully')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error removing drug selection:', error)
      ElMessage.error('Failed to remove drug selection')
    }
  }
}

// Cancel edit
const cancelEdit = () => {
  isEditing.value = false
  editingIndex.value = -1
  resetCurrentSelection()
  ElMessage.info('Edit cancelled')
}

// Reset current selection
const resetCurrentSelection = () => {
  currentSelection.drugId = null
  currentSelection.quantity = 1
  selectedDrug.value = null
}

// Format number with thousands separators
const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return Number(num).toLocaleString()
}

// Load drugs when component mounts
const loadDrugs = async () => {
  if (pharmacyDrugStore.drugs.length === 0) {
    try {
      await pharmacyDrugStore.fetchDrugs()
    } catch (error) {
      console.error('Failed to load drugs:', error)
      ElMessage.error('Failed to load drugs list')
    }
  }
}

// Load existing drug selections for editing
const loadExistingSelections = async () => {
  if (!props.medicineDetails.id) return
  
  try {
    // Fetch the latest drug data to get drug_selections_list
    const response = await pharmacyDrugStore.fetchDrugs()
    const currentDrug = pharmacyDrugStore.drugs.find(d => d.id === props.medicineDetails.id)
    
    if (currentDrug && currentDrug.drug_selections_list && currentDrug.drug_selections_list.length > 0) {
      // Convert backend format to frontend format
      const selections = currentDrug.drug_selections_list.map(selection => {
        // Find the drug details for display
        const drug = pharmacyDrugStore.drugs.find(d => d.gtin_code === selection.gtin_code)
        return {
          drugId: drug ? drug.id : null,
          gtinCode: selection.gtin_code,
          drugName: drug ? (drug.persian_name || drug.english_name) : 'Unknown Drug',
          companyName: drug ? (drug.persian_company_name || drug.english_company_name) : 'Unknown Company',
          quantity: selection.quantity
        }
      }).filter(selection => selection.drugId !== null) // Filter out unknown drugs
      
      emit('update:modelValue', selections)
    }
  } catch (error) {
    console.error('Failed to load existing drug selections:', error)
  }
}

// Watch for changes in medicine details ID to load selections
watch(() => props.medicineDetails.id, (newId, oldId) => {
  // Clear selections when switching between different drugs or when going to a new drug
  if (newId !== oldId) {
    emit('update:modelValue', [])
    resetCurrentSelection()
  }
  
  if (newId) {
    loadExistingSelections()
  }
}, { immediate: true })

// Watch for changes in GTIN code to detect when switching to a different drug
watch(() => props.medicineDetails.gtinCode, (newGtin, oldGtin) => {
  // Clear selections when GTIN changes (indicates different drug)
  if (newGtin !== oldGtin && oldGtin !== undefined) {
    emit('update:modelValue', [])
    resetCurrentSelection()
  }
}, { immediate: false })

// Load drugs on component mount
loadDrugs()
</script>

<style scoped>
.drug-selection-form-card {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: white;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.selection-header h4 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cancel-button {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.cancel-button:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.selection-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
  margin-bottom: 0;
}

.compact-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #606266;
  margin-bottom: 5px;
}

.help-text {
  display: block;
  font-size: 0.75rem;
  color: #909399;
  margin-top: 3px;
}

.error-text {
  color: #f56c6c;
  font-size: 0.75rem;
  margin-top: 5px;
  display: block;
}

.drug-search-select {
  width: 100%;
}

.duplicate-drug :deep(.el-input__inner) {
  border-color: #f56c6c !important;
  background-color: rgba(245, 108, 108, 0.05);
}

.drug-option {
  padding: 5px 0;
}

.drug-option .drug-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.drug-option .drug-details {
  font-size: 0.8rem;
  color: #909399;
}

.selected-drug-display {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  padding: 12px;
  margin-top: 10px;
}

.drug-info .drug-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.drug-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #64748b;
}

.drug-meta .gtin {
  font-weight: 500;
}

.quantity-input {
  width: 100%;
}

.table-title {
  margin-bottom: 15px;
  font-size: 1rem;
  color: var(--primary-color);
}

.drugs-table-container {
  margin-top: 20px;
}

.drug-cell .drug-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.drug-cell .drug-gtin {
  font-size: 0.8rem;
  color: #909399;
}

.editing-quantity {
  font-weight: 600;
  color: var(--warning-color);
}

.operations-container {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.no-data-message {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
}

.form-section-title {
  margin-top: 30px;
  margin-bottom: 20px;
  font-size: 1.1rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}
</style> 