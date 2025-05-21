<template>
  <el-form :model="modelValue" label-width="180px" class="add-medicine-form">
    <div class="insurance-entries">
      <h3 class="form-section-title">
        Insurance Coverage
      </h3>
      
      <!-- Insurance Form Card -->
      <div class="insurance-form-card">
        <div class="insurance-header">
          <h4>Add Insurance Coverage</h4>
          <el-button 
            type="primary" 
            size="small"
            @click="addNewInsuranceToTable"
            class="add-button"
          >
            <el-icon><i-ep-plus /></el-icon> {{ isEditing ? 'Update Batch' : 'Add to Table' }}
          </el-button>
        </div>
        
        <div class="insurance-form-content">
          <!-- First row: Provider and Specialties -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">Insurance Provider</label>
              <el-select 
                v-model="currentInsurance.insuranceId" 
                placeholder="Select provider" 
                @change="handleCurrentInsuranceSelect"
                class="compact-input"
              >
                <el-option 
                  v-for="ins in availableInsurances" 
                  :key="ins.id" 
                  :label="ins.name" 
                  :value="ins.id" 
                />
              </el-select>
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
              <label class="compact-label">Insurance Price</label>
              <el-input 
                v-model="currentInsurance.price" 
                type="number"
                placeholder="Price"
                @input="updateCurrentCoverageAmount"
                class="compact-input"
              />
            </div>
            
            <div class="form-group">
              <label class="compact-label">Coverage %</label>
              <el-input 
                v-model="currentInsurance.percentage" 
                type="number"
                placeholder="Percentage"
                min="0"
                max="100"
                @input="updateCurrentCoverageAmount"
                class="compact-input"
              />
              <span class="help-text" v-if="currentInsurance.price > 0 && currentInsurance.percentage > 0">
                Coverage: {{ currentInsurance.coverageAmount }}
              </span>
            </div>
            
            <div class="form-group">
              <label class="compact-label">ARZ Share</label>
              <el-input 
                v-model="currentInsurance.share" 
                type="number"
                placeholder="Share amount"
                @input="updateCurrentCoverageAmount"
                class="compact-input"
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
                Ins ({{ currentInsurance.coverageAmount }}) + ARZ ({{ currentInsurance.share }})
              </span>
            </div>
          </div>
          
          <!-- Third row: Max Units, Max Age, switches -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">Maximum Units</label>
              <el-input 
                v-model="currentInsurance.numMax" 
                type="number"
                placeholder="Max units"
                class="compact-input"
              />
              <span class="help-text">Max units per prescription</span>
            </div>
            
            <div class="form-group">
              <label class="compact-label">Maximum Age</label>
              <el-input 
                v-model="currentInsurance.ageMax" 
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
              <el-switch v-model="currentInsurance.barcodeRequired" />
            </div>
            
            <div class="form-group switch-group">
              <label class="compact-label">Hospital Required</label>
              <el-switch v-model="currentInsurance.hospitalRequired" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Insurance Table -->
      <div v-if="modelValue.length > 0" class="insurance-table-wrapper">
        <h4 class="table-title">Insurance Coverage Table</h4>
        <el-table 
          :data="modelValue" 
          stripe 
          border
          table-layout="fixed"
          class="insurance-table"
          height="600"
        >
          <el-table-column prop="insuranceName" label="Provider" width="160" />
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
          <el-table-column prop="price" label="Price" width="100" />
          <el-table-column prop="percentage" label="rate %" width="80" />
          <el-table-column prop="coverageAmount" label="Coverage Amount" width="150" />
          <el-table-column prop="share" label="ARZ Share" width="100" />
          <el-table-column prop="total" label="Total" width="100" />
          <el-table-column prop="numMax" label="Max Units" width="100" />
          <el-table-column prop="ageMax" label="Max Age" width="100" />
          <el-table-column label="Needs" width="150">
            <template #default="scope">
              <div class="needs-container">
                <el-tag 
                  size="small" 
                  :type="scope.row.barcodeRequired ? 'danger' : 'info'"
                  class="requirement-tag"
                >
                  {{ scope.row.barcodeRequired ? 'Barcode Required' : 'No Barcode' }}
                </el-tag>
                <el-tag 
                  size="small" 
                  :type="scope.row.hospitalRequired ? 'danger' : 'info'"
                  class="requirement-tag"
                >
                  {{ scope.row.hospitalRequired ? 'Hospital Only' : 'No Hospital' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Operations" width="140" fixed="right">
            <template #default="scope">
              <div class="operations-container">
                <el-button
                  size="small"
                  @click="editInsurance(scope.$index)"
                  type="primary"
                  plain
                >
                  Edit
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  @click="removeInsurance(scope.$index)"
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
import { ref, reactive, defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const specialtyInput = ref('')
const isEditing = ref(false)

// Add the same insurance provider data
const availableInsurances = [
  {
    id: 1,
    name: 'BPJS Health',
    description: 'National health insurance',
    coveragePercentage: 80
  },
  {
    id: 2,
    name: 'Prudential Health',
    description: 'Private health insurance',
    coveragePercentage: 90
  },
  {
    id: 3,
    name: 'Allianz Care',
    description: 'Corporate health insurance',
    coveragePercentage: 85
  }
]

// Add specialty suggestions
const specialtySuggestions = [
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
]

const currentInsurance = reactive({
  insuranceId: null,
  insuranceName: '',
  specialties: [],
  price: 0,
  percentage: 0,
  coverageAmount: 0,
  share: 0,
  total: 0,
  numMax: 0,
  ageMax: 0,
  barcodeRequired: false,
  hospitalRequired: false
})

const updateInsurances = () => {
  emit('update:modelValue', props.modelValue)
  isEditing.value = true
}

const querySpecialtySearch = (queryString, callback) => {
  const results = queryString
    ? specialtySuggestions.filter(item => {
        return item.toLowerCase().includes(queryString.toLowerCase())
      })
    : specialtySuggestions
  
  callback(results.map(item => ({ value: item })))
}

const updateCurrentCoverageAmount = () => {
  currentInsurance.coverageAmount = (currentInsurance.price * currentInsurance.percentage / 100).toFixed(2)
  currentInsurance.total = parseFloat(currentInsurance.coverageAmount) + parseFloat(currentInsurance.share || 0)
}

const handleCurrentInsuranceSelect = (insuranceId) => {
  const selectedInsurance = availableInsurances.find(ins => ins.id === insuranceId)
  if (selectedInsurance) {
    currentInsurance.insuranceName = selectedInsurance.name
    currentInsurance.percentage = selectedInsurance.coveragePercentage
    updateCurrentCoverageAmount()
  }
}

const addCurrentSpecialty = (value = null) => {
  const specialty = value || specialtyInput.value
  if (specialty && !currentInsurance.specialties.includes(specialty)) {
    currentInsurance.specialties.push(specialty)
    if (!specialtySuggestions.includes(specialty)) {
      specialtySuggestions.push(specialty)
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

const addNewInsuranceToTable = () => {
  if (!currentInsurance.insuranceId) {
    ElMessage({
      type: 'warning',
      message: 'Please select an insurance provider'
    })
    return
  }
  
  props.modelValue.push({...currentInsurance})
  updateInsurances()
  
  // Reset current insurance
  Object.assign(currentInsurance, {
    insuranceId: null,
    insuranceName: '',
    specialties: [],
    price: 0,
    percentage: 0,
    coverageAmount: 0,
    share: 0,
    total: 0,
    numMax: 0,
    ageMax: 0,
    barcodeRequired: false,
    hospitalRequired: false
  })
  isEditing.value = false
  specialtyInput.value = ''
}

const editInsurance = (index) => {
  Object.assign(currentInsurance, {...props.modelValue[index]})
  props.modelValue.splice(index, 1)
  updateInsurances()
}

const removeInsurance = (index) => {
  props.modelValue.splice(index, 1)
  updateInsurances()
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
  min-height: 600px;
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
</style> 