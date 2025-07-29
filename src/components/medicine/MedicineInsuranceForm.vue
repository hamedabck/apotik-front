<template>
  <el-form :model="modelValue" label-width="180px" class="add-medicine-form">
    <div class="insurance-entries">
      <h3 class="form-section-title">
        Insurance Coverage
        <span v-if="medicineDetails.persian_name" class="medicine-name">
          for {{ medicineDetails.persian_name }}
        </span>
      </h3>
      
      <!-- Insurance Form Card -->
      <div class="insurance-form-card">
        <div class="insurance-header">
          <h4>{{ isEditing ? 'Edit Insurance Coverage' : 'Add Insurance Coverage' }}</h4>
          <div class="header-buttons">
            <el-button 
              v-if="isEditing"
              size="small"
              @click="cancelEdit"
              class="cancel-button"
            >
              Cancel
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              @click="saveInsuranceCoverage"
              :loading="pharmacyDrugStore.loading"
              class="add-button"
            >
              <el-icon><i-ep-plus /></el-icon> 
              {{ isEditing ? 'Update Coverage' : 'Add Coverage' }}
            </el-button>
          </div>
        </div>
        
        <div class="insurance-form-content">
          <!-- First row: Provider and Specialties -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">Insurance Provider *</label>
              <el-select 
                v-model="currentInsurance.insurance" 
                placeholder="Select provider" 
                @change="handleInsuranceSelect"
                class="compact-input"
                :disabled="!medicineDetails.id || getAvailableInsurances.length === 0"
              >
                <el-option 
                  v-for="ins in getAvailableInsurances" 
                  :key="ins.id" 
                  :label="ins.name" 
                  :value="ins.id" 
                />
              </el-select>
              <span class="help-text" v-if="!medicineDetails.id">
                Please save the medicine details first
              </span>
              <span class="help-text" v-else-if="getAvailableInsurances.length === 0">
                All available insurance providers have been used for this medicine
              </span>
              <span class="help-text" v-else>
                Select an insurance provider (excludes already used providers)
              </span>
              
              <!-- Warning when no more providers available -->
              <!-- <div v-if="medicineDetails.id && getAvailableInsurances.length === 0" class="no-more-providers-warning">
                <el-icon><i-ep-warning /></el-icon>
                <span>All available insurance providers have been used for this medicine.</span>
              </div> -->
            </div>
            
            <div class="form-group">
              <label class="compact-label">Medicine Specialties</label>
              <div class="specialties-input">
                <div class="tags-container">
                  <el-tag
                    v-for="(specialty, spIndex) in currentInsurance.specialties"
                    :key="specialty"
                    closable
                    @close="removeCurrentSpecialty(spIndex)"
                    size="small"
                    effect="light"
                    class="specialty-tag"
                  >
                    {{ specialty }}
                  </el-tag>
                </div>
                <div class="specialty-input-wrapper">
                  <el-autocomplete
                    v-model="specialtyInput"
                    :fetch-suggestions="querySpecialtySearch"
                    placeholder="Add specialty"
                    @select="handleSelectCurrentSpecialty"
                    @keyup.enter="addCurrentSpecialty"
                    class="compact-input"
                    :trigger-on-focus="false"
                  >
                    <template #default="{ item }">
                      <div>{{ item.value }}</div>
                    </template>
                  </el-autocomplete>
                  <el-button size="small" @click="addCurrentSpecialty">Add</el-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Second row: Price, Coverage %, ARZ Share, Total Coverage -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">Insurance Price *</label>
              <el-input 
                v-model="formattedPrice" 
                placeholder="Price"
                @input="handlePriceInput"
                @blur="formatPriceDisplay"
                class="compact-input price-input"
              />
            </div>
            
            <div class="form-group">
              <label class="compact-label">Coverage % *</label>
              <el-input 
                v-model.number="currentInsurance.percentage" 
                type="number"
                placeholder="Percentage"
                min="0"
                max="100"
                @input="handlePercentageInput"
                @blur="validatePercentage"
                class="compact-input"
                :class="{ 'percentage-error': isPercentageInvalid }"
              />
              <span class="help-text" v-if="currentInsurance.price > 0 && currentInsurance.percentage > 0 && !isPercentageInvalid">
                Coverage: {{ formatNumber(currentInsurance.coverage_amount) }}
              </span>
              <span class="error-text" v-if="isPercentageInvalid">
                Coverage percentage must be between 0 and 100
              </span>
            </div>
            
            <div class="form-group">
              <label class="compact-label">ARZ Share</label>
              <el-input 
                v-model="formattedShare" 
                placeholder="Share amount"
                @input="handleShareInput"
                @blur="formatShareDisplay"
                class="compact-input share-input"
              />
            </div>
            <div class="form-group">
              <label class="compact-label">Total Coverage</label>
              <el-input 
                v-model="currentInsurance.total" 
                type="number"
                placeholder="Total"
                disabled
                class="compact-input"
              />
              <span class="help-text" v-if="currentInsurance.total > 0">
                Ins ({{ formatNumber(currentInsurance.coverage_amount) }}) + ARZ ({{ formatNumber(currentInsurance.share) }})
              </span>
            </div>
          </div>
          
          <!-- Third row: Max Units, Max Age, switches -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">Maximum Units</label>
              <el-input 
                v-model.number="currentInsurance.num_max" 
                type="number"
                placeholder="Max units"
                class="compact-input"
                :min="0"
              />
              <span class="help-text">Max units per prescription</span>
            </div>
            
            <div class="form-group">
              <label class="compact-label">Maximum Age</label>
              <el-input 
                v-model.number="currentInsurance.age_max" 
                type="number"
                placeholder="Max age"
                min="0"
                max="120"
                class="compact-input"
              />
              <span class="help-text">Max patient age</span>
            </div>
            <div class="form-group switch-group">
              <label class="compact-label">Barcode Required</label>
              <el-switch v-model="currentInsurance.barcode_required" />
            </div>
            
            <div class="form-group switch-group">
              <label class="compact-label">Hospital Required</label>
              <el-switch v-model="currentInsurance.hospital_required" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Insurance Table -->
      <div v-if="drugInsurances.length > 0" class="insurance-table-wrapper">
        <h4 class="table-title">Insurance Coverage Table</h4>
        <el-table 
          :data="drugInsurances" 
          stripe 
          border
          table-layout="fixed"
          class="insurance-table"
          :max-height="500"
          v-loading="pharmacyDrugStore.loading"
        >
          <el-table-column prop="insurance_name" label="Provider" width="160" />
          <el-table-column prop="specialties" label="Specialties" width="150">
            <template #default="scope">
              <el-tag
                v-for="(specialty, index) in scope.row.specialties"
                :key="index"
                size="small"
                effect="light"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ specialty }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="Price" width="100">
            <template #default="scope">
              {{ formatCurrency(scope.row.price) }}
            </template>
          </el-table-column>
          <el-table-column prop="percentage" label="Rate %" width="80" />
          <el-table-column prop="coverage_amount" label="Coverage Amount" width="150">
            <template #default="scope">
              {{ formatCurrency(scope.row.coverage_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="share" label="ARZ Share" width="100">
            <template #default="scope">
              {{ formatCurrency(scope.row.share) }}
            </template>
          </el-table-column>
          <el-table-column prop="total" label="Total" width="100">
            <template #default="scope">
              {{ formatCurrency(scope.row.total) }}
            </template>
          </el-table-column>
          <el-table-column prop="num_max" label="Max Units" width="100" />
          <el-table-column prop="age_max" label="Max Age" width="100" />
          <el-table-column label="Requirements" width="150">
            <template #default="scope">
              <div class="needs-container">
                <el-tag 
                  size="small" 
                  :type="scope.row.barcode_required ? 'danger' : 'info'"
                  class="requirement-tag"
                >
                  {{ scope.row.barcode_required ? 'Barcode Required' : 'No Barcode' }}
                </el-tag>
                <el-tag 
                  size="small" 
                  :type="scope.row.hospital_required ? 'danger' : 'info'"
                  class="requirement-tag"
                >
                  {{ scope.row.hospital_required ? 'Hospital Only' : 'No Hospital' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Operations" width="140" fixed="right">
            <template #default="scope">
              <div class="operations-container">
                <el-button
                  size="small"
                  @click="editInsurance(scope.row)"
                  type="primary"
                  plain
                >
                  Edit
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  @click="removeInsurance(scope.row)"
                  :loading="pharmacyDrugStore.loading"
                >
                  Delete
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="no-data-message" v-else>
        <p>No insurance coverage added yet. Use the form above to add coverage.</p>
      </div>
    </div>
  </el-form>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useInsuranceStore } from '@/stores/insuranceStore'
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

const specialtyInput = ref('')
const isEditing = ref(false)
const editingInsuranceId = ref(null)
const insuranceStore = useInsuranceStore()
const pharmacyDrugStore = usePharmacyDrugStore()

// Formatted input values for price and share
const formattedPrice = ref('')
const formattedShare = ref('')

// Validation states
const isPercentageInvalid = ref(false)

// Get insurance data from the store
const availableInsurances = computed(() => insuranceStore.insurances)

// Get drug insurances from the store
const drugInsurances = computed(() => {
  if (props.medicineDetails.id) {
    return pharmacyDrugStore.drugInsurances.filter(
      insurance => insurance.drug === props.medicineDetails.id
    )
  }
  return []
})

// Get available insurances excluding those already in the table
const getAvailableInsurances = computed(() => {
  // Get insurance IDs that are already used in the table
  const usedInsuranceIds = drugInsurances.value.map(insurance => insurance.insurance)
  
  // When editing, exclude the current insurance being edited from the used list
  let filteredUsedIds = usedInsuranceIds
  if (isEditing.value && editingInsuranceId.value) {
    const editingInsurance = drugInsurances.value.find(ins => ins.id === editingInsuranceId.value)
    if (editingInsurance) {
      filteredUsedIds = usedInsuranceIds.filter(id => id !== editingInsurance.insurance)
    }
  }
  
  // Return insurances that are not already used
  return availableInsurances.value.filter(insurance => 
    !filteredUsedIds.includes(insurance.id)
  )
})

// Add specialty suggestions
const specialtySuggestions = ref([
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine',
  'Gynecology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Urology',
  'Pharmacist'
])

const currentInsurance = reactive({
  id: null,
  drug: null,
  insurance: null,
  insurance_name: '',
  specialties: [],
  price: 0,
  percentage: 0,
  coverage_amount: 0,
  share: 0,
  total: 0,
  num_max: null,
  age_max: null,
  barcode_required: false,
  hospital_required: false
})

// Initialize stores on component mount
onMounted(async () => {
  await insuranceStore.fetchInsurances()
  if (props.medicineDetails.id) {
    await pharmacyDrugStore.fetchDrugInsurances(props.medicineDetails.id)
  }
})

// Watch for changes in medicine details
watch(() => props.medicineDetails.id, async (newId) => {
  if (newId) {
    await pharmacyDrugStore.fetchDrugInsurances(newId)
  }
})

const querySpecialtySearch = (queryString, callback) => {
  const results = queryString
    ? specialtySuggestions.value.filter(item => {
        return item.toLowerCase().includes(queryString.toLowerCase())
      })
    : specialtySuggestions.value
  
  callback(results.map(item => ({ value: item })))
}

// Format number with thousands separators (no decimals)
const formatNumber = (num) => {
  if (!num && num !== 0) return ''
  return Math.round(Number(num)).toLocaleString()
}

// Remove formatting and get raw number
const parseFormattedNumber = (str) => {
  if (!str) return 0
  // Remove commas and any non-digit characters
  const cleaned = str.replace(/[^\d]/g, '')
  return parseInt(cleaned) || 0
}

// Handle price input with real-time formatting
const handlePriceInput = (value) => {
  // Remove formatting to get raw number
  const rawNumber = parseFormattedNumber(value)
  
  // Update the actual price in currentInsurance
  currentInsurance.price = rawNumber
  
  // Format the display value
  if (value && rawNumber > 0) {
    // Only format if there's a valid number
    const formatted = formatNumber(rawNumber)
    if (formatted !== value) {
      // Update the display value if it's different
      formattedPrice.value = formatted
    }
  }
  
  updateCurrentCoverageAmount()
}

// Handle share input with real-time formatting
const handleShareInput = (value) => {
  // Remove formatting to get raw number
  const rawNumber = parseFormattedNumber(value)
  
  // Update the actual share in currentInsurance
  currentInsurance.share = rawNumber
  
  // Format the display value
  if (value && rawNumber > 0) {
    // Only format if there's a valid number
    const formatted = formatNumber(rawNumber)
    if (formatted !== value) {
      // Update the display value if it's different
      formattedShare.value = formatted
    }
  }
  
  updateCurrentCoverageAmount()
}

// Format price display on blur
const formatPriceDisplay = () => {
  if (currentInsurance.price > 0) {
    formattedPrice.value = formatNumber(currentInsurance.price)
  } else if (!formattedPrice.value) {
    formattedPrice.value = ''
  }
}

// Format share display on blur
const formatShareDisplay = () => {
  if (currentInsurance.share > 0) {
    formattedShare.value = formatNumber(currentInsurance.share)
  } else if (!formattedShare.value) {
    formattedShare.value = ''
  }
}

const updateCurrentCoverageAmount = () => {
  const price = parseInt(currentInsurance.price) || 0
  const percentage = parseFloat(currentInsurance.percentage) || 0
  const share = parseInt(currentInsurance.share) || 0
  
  currentInsurance.coverage_amount = Math.round(price * percentage / 100)
  currentInsurance.total = currentInsurance.coverage_amount + share
}

const handleInsuranceSelect = (insuranceId) => {
  const selectedInsurance = availableInsurances.value.find(ins => ins.id === insuranceId)
  if (selectedInsurance) {
    currentInsurance.insurance_name = selectedInsurance.name
    // Set default percentage from insurance if not already set
    if (!currentInsurance.percentage) {
      currentInsurance.percentage = selectedInsurance.coverage_percentage || 0
    }
    updateCurrentCoverageAmount()
  }
}

const addCurrentSpecialty = (value = null) => {
  const specialty = value || specialtyInput.value.trim()
  if (specialty && !currentInsurance.specialties.includes(specialty)) {
    currentInsurance.specialties.push(specialty)
    if (!specialtySuggestions.value.includes(specialty)) {
      specialtySuggestions.value.push(specialty)
    }
  }
  specialtyInput.value = ''
}

const handleSelectCurrentSpecialty = (item) => {
  addCurrentSpecialty(item.value)
}

const removeCurrentSpecialty = (specialtyIndex) => {
  currentInsurance.specialties.splice(specialtyIndex, 1)
}

const validateInsuranceForm = () => {
  if (!props.medicineDetails.id) {
    ElMessage.error('Please save the medicine details first')
    return false
  }
  
  if (!currentInsurance.insurance) {
    ElMessage.error('Please select an insurance provider')
    return false
  }
  
  // Check for duplicate insurance provider
  const isDuplicateInsurance = drugInsurances.value.some(insurance => {
    // When editing, exclude the current insurance being edited
    if (isEditing.value && insurance.id === editingInsuranceId.value) {
      return false
    }
    return insurance.insurance === currentInsurance.insurance
  })
  
  if (isDuplicateInsurance) {
    const selectedInsurance = availableInsurances.value.find(ins => ins.id === currentInsurance.insurance)
    ElMessage({
      type: 'warning',
      message: `Insurance provider "${selectedInsurance?.name}" already exists in the table. Each insurance provider can only be used once per medicine.`,
      duration: 4000
    })
    return false
  }
  
  if (!currentInsurance.price || currentInsurance.price <= 0) {
    ElMessage.error('Please enter a valid price')
    return false
  }
  
  if (!currentInsurance.percentage || currentInsurance.percentage < 0 || currentInsurance.percentage > 100) {
    ElMessage.error('Please enter a valid coverage percentage (0-100)')
    return false
  }
  
  // Additional check using the validation state
  if (isPercentageInvalid.value) {
    ElMessage.error('Please enter a valid coverage percentage (0-100)')
    return false
  }
  
  return true
}

const saveInsuranceCoverage = async () => {
  if (!validateInsuranceForm()) {
    return
  }
  
  try {
    const insuranceData = {
      drug: props.medicineDetails.id,
      insurance: currentInsurance.insurance,
      specialties: currentInsurance.specialties,
      price: parseInt(currentInsurance.price) || 0,
      percentage: parseInt(currentInsurance.percentage),
      share: parseInt(currentInsurance.share) || 0,
      num_max: currentInsurance.num_max || null,
      age_max: currentInsurance.age_max || null,
      barcode_required: currentInsurance.barcode_required,
      hospital_required: currentInsurance.hospital_required
    }
    
    if (isEditing.value && editingInsuranceId.value) {
      // Update existing insurance
      await pharmacyDrugStore.updateDrugInsurance(editingInsuranceId.value, insuranceData)
      ElMessage.success('Insurance coverage updated successfully')
    } else {
      // Create new insurance
      await pharmacyDrugStore.createDrugInsurance(insuranceData)
      ElMessage.success('Insurance coverage added successfully')
    }
    
    // Reset form
    resetForm()
    
    // Refresh the insurance list
    await pharmacyDrugStore.fetchDrugInsurances(props.medicineDetails.id)
    
  } catch (error) {
    console.error('Error saving insurance coverage:', error)
    ElMessage.error('Failed to save insurance coverage')
  }
}

const editInsurance = (insurance) => {
  // Populate form with insurance data
  Object.assign(currentInsurance, {
    id: insurance.id,
    drug: insurance.drug,
    insurance: insurance.insurance,
    insurance_name: insurance.insurance_name,
    specialties: [...insurance.specialties],
    price: insurance.price,
    percentage: insurance.percentage,
    coverage_amount: insurance.coverage_amount,
    share: insurance.share,
    total: insurance.total,
    num_max: insurance.num_max,
    age_max: insurance.age_max,
    barcode_required: insurance.barcode_required,
    hospital_required: insurance.hospital_required
  })
  
  // Initialize formatted values
  formattedPrice.value = insurance.price ? formatNumber(insurance.price) : ''
  formattedShare.value = insurance.share ? formatNumber(insurance.share) : ''
  
  // Validate percentage
  validatePercentage()
  
  isEditing.value = true
  editingInsuranceId.value = insurance.id
}

const removeInsurance = async (insurance) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the insurance coverage for ${insurance.insurance_name}?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    await pharmacyDrugStore.deleteDrugInsurance(insurance.id)
    ElMessage.success('Insurance coverage deleted successfully')
    
    // Refresh the insurance list
    await pharmacyDrugStore.fetchDrugInsurances(props.medicineDetails.id)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting insurance:', error)
      ElMessage.error('Failed to delete insurance coverage')
    }
  }
}

const cancelEdit = () => {
  resetForm()
}

const resetForm = () => {
  Object.assign(currentInsurance, {
    id: null,
    drug: null,
    insurance: null,
    insurance_name: '',
    specialties: [],
    price: 0,
    percentage: 0,
    coverage_amount: 0,
    share: 0,
    total: 0,
    num_max: null,
    age_max: null,
    barcode_required: false,
    hospital_required: false
  })
  
  // Clear formatted values
  formattedPrice.value = ''
  formattedShare.value = ''
  
  // Reset validation states
  isPercentageInvalid.value = false
  
  isEditing.value = false
  editingInsuranceId.value = null
  specialtyInput.value = ''
}

const formatCurrency = (amount) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('fa-IR').format(amount)
}

const handlePercentageInput = (value) => {
  // Ensure the percentage is within valid range
  let percentage = parseFloat(value) || 0
  
  // Clamp the value between 0 and 100
  if (percentage < 0) {
    percentage = 0
    currentInsurance.percentage = 0
  } else if (percentage > 100) {
    percentage = 100
    currentInsurance.percentage = 100
  } else {
    currentInsurance.percentage = percentage
  }
  
  // Validate the percentage
  validatePercentage()
  
  // Update coverage calculation
  updateCurrentCoverageAmount()
}

const validatePercentage = () => {
  const percentage = currentInsurance.percentage
  if (percentage < 0 || percentage > 100 || isNaN(percentage)) {
    isPercentageInvalid.value = true
  } else {
    isPercentageInvalid.value = false
  }
}
</script>

<style scoped>
.insurance-form-card {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: white;
}

.insurance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.insurance-header h4 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cancel-button {
  background-color: #f56565;
  border-color: #f56565;
  color: white;
}

.cancel-button:hover {
  background-color: #e53e3e;
  border-color: #e53e3e;
}

.insurance-form-content {
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

.compact-input {
  width: 100%;
}

.specialties-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 32px;
  padding: 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.specialty-input-wrapper {
  display: flex;
  gap: 8px;
}

.switch-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.help-text {
  display: block;
  font-size: 0.75rem;
  color: #909399;
  margin-top: 3px;
}

.specialty-tag {
  margin-right: 2px;
  margin-bottom: 2px;
}

.table-title {
  margin-bottom: 15px;
  font-size: 1rem;
  color: var(--primary-color);
}

.no-data-message {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 30px;
}

.form-section-title {
  margin-top: 30px;
  margin-bottom: 20px;
  font-size: 1.1rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.medicine-name {
  font-size: 0.9rem;
  font-weight: normal;
  color: #67c23a;
  background-color: #f0f9ff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #67c23a;
}

.needs-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.requirement-tag {
  width: fit-content;
}

.insurance-entries {
  max-width: 100%;
  overflow: hidden;
}

.insurance-table-wrapper {
  margin-bottom: 20px;
  max-width: 1200px;
  width: 100%;
  position: relative;
  height: calc(100% - 40px);
  /* min-height: 600px; */
}

.insurance-table {
  width: 100% !important;
  --el-table-border-color: #ebeef5;
  border-radius: 4px;
  height: 100%;
}

/* Table layout fixes */
:deep(.el-table) {
  margin: 0 !important;
  height: 100%;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto !important;
  overflow-x: auto !important;
}

:deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
}

:deep(.el-table__header th) {
  background-color: #f5f7fa !important;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table__cell) {
  text-align: center;
}

/* Custom Scrollbar Styling */
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 16px;
  height: 16px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: #f0f2f5;
  border-radius: 10px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background-color: #409EFF;
  border: 4px solid #f0f2f5;
  border-radius: 10px;
  min-height: 50px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background-color: #66b1ff;
  border: 3px solid #f0f2f5;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-corner) {
  background-color: #f0f2f5;
  border-bottom-right-radius: 4px;
}

/* Firefox Scrollbar */
:deep(.el-table__body-wrapper) {
  scrollbar-width: auto;
  scrollbar-color: #409EFF #f0f2f5;
}

/* Ensure horizontal scrollbar stays visible */
:deep(.el-table__body-wrapper:hover) {
  overflow-x: auto !important;
}

/* Handle both scrollbars corner */
:deep(.el-scrollbar__bar.is-horizontal) {
  height: 16px;
}

:deep(.el-scrollbar__bar.is-vertical) {
  width: 16px;
}

.operations-container {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* Loading state styling */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}

/* Form validation styling */
.compact-input.is-error {
  border-color: #f56c6c;
}

.compact-input.is-error:focus {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

/* Success state styling */
.form-section-title .medicine-name {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-group {
    min-width: 100%;
  }
  
  .insurance-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .header-buttons {
    justify-content: center;
  }
  
  .insurance-table-wrapper {
    min-height: 400px;
  }
}

/* Editing insurance highlight */
.editing-insurance {
  font-weight: 600;
  color: var(--warning-color);
}

/* No more providers warning */
.no-more-providers-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px;
  background-color: rgba(230, 162, 60, 0.1);
  border: 1px solid #e6a23c;
  border-radius: 4px;
  color: #e6a23c;
  font-size: 0.85rem;
  margin-top: 10px;
}

.no-more-providers-warning .el-icon {
  font-size: 16px;
}

/* Price and share input styling */
.price-input :deep(.el-input__inner),
.share-input :deep(.el-input__inner) {
  font-family: var(--font-english);
  font-weight: 500;
}

.price-input :deep(.el-input__inner):focus,
.share-input :deep(.el-input__inner):focus {
  border-color: var(--primary-color);
}

/* Price and share input placeholder */
.price-input :deep(.el-input__inner::placeholder),
.share-input :deep(.el-input__inner::placeholder) {
  color: #c0c4cc;
  font-weight: normal;
}

/* Percentage validation styling */
.percentage-error :deep(.el-input__inner) {
  border-color: #f56c6c !important;
  background-color: rgba(245, 108, 108, 0.05);
}

.percentage-error :deep(.el-input__inner):focus {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2) !important;
}

.error-text {
  color: #f56c6c;
  font-size: 0.75rem;
  margin-top: 3px;
  display: block;
}
</style> 