<template>
  <div class="add-medicine-page">
    <div class="page-header">
      <h1 class="page-title">Add New Medicine</h1>
    </div>
    
    <div class="card">
      <el-tabs tab-position="top" class="medicine-tabs">
        <el-tab-pane label="Details">
          <el-form 
            :model="medicineForm.details" 
            :rules="detailsRules" 
            label-width="180px" 
            ref="detailsFormRef"
            class="add-medicine-form">
            
            <h3 class="form-section-title">Basic Information</h3>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="GTIN code" prop="gtinCode">
                  <el-input v-model="medicineForm.details.gtinCode" />
                </el-form-item>
              </el-col>
              
              <el-col :span="12">
                <el-form-item label="IRC code" prop="ircCode">
                  <el-input v-model="medicineForm.details.ircCode" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="Generic code" prop="genericCode" required>
                  <el-input v-model="medicineForm.details.genericCode" />
                </el-form-item>
              </el-col>
              
              <el-col :span="12">
                <el-form-item label="Units per Box" prop="numPerBox">
                  <el-input-number v-model="medicineForm.details.numPerBox" :min="1" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <h3 class="form-section-title">Name Information</h3>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="English Brand Name" prop="englishName" required>
                  <el-input v-model="medicineForm.details.englishName" />
                </el-form-item>
              </el-col>
              
              <el-col :span="12">
                <el-form-item label="Persian Brand Name" prop="persianName">
                  <el-input v-model="medicineForm.details.persianName" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="Generic Name" prop="genericName" required>
              <el-input v-model="medicineForm.details.genericName" />
            </el-form-item>
            
            <h3 class="form-section-title">Manufacturer Information</h3>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="English Company Name" prop="englishCompanyName" required>
                  <el-input v-model="medicineForm.details.englishCompanyName" />
                </el-form-item>
              </el-col>
              
              <el-col :span="12">
                <el-form-item label="Persian Company Name" prop="persianCompanyName">
                  <el-input v-model="medicineForm.details.persianCompanyName" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <h3 class="form-section-title">Additional Information</h3>
            
            <el-form-item label="Keywords" prop="keyword">
              <el-input v-model="medicineForm.details.keyword" placeholder="Separate keywords with commas" />
            </el-form-item>
            
            <el-form-item label="Technical Evaluation" prop="technicalEvaluation">
              <el-switch v-model="medicineForm.details.technicalEvaluation" />
            </el-form-item>
            
            <el-form-item label="Pharmacist Description" prop="pharmacistDescription">
              <el-input 
                v-model="medicineForm.details.pharmacistDescription"
                type="textarea"
                rows="4" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="Stock">
          <el-form :model="medicineForm" label-width="120px" class="add-medicine-form">
            <div class="stock-batches">
              <h3 class="form-section-title">
                Stock Batches 
                <el-button 
                  type="primary" 
                  size="small"
                  @click="addNewBatch"
                  circle
                  plain>
                  <el-icon><i-ep-plus /></el-icon>
                </el-button>
              </h3>
              
              <div v-for="(batch, index) in medicineForm.stocks" :key="index" class="batch-item">
                <div class="batch-header">
                  <h4>Batch #{{ index + 1 }}</h4>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="removeBatch(index)"
                    circle
                    plain>
                    <el-icon><i-ep-delete /></el-icon>
                  </el-button>
                </div>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item :label="'Batch Number'" :prop="'stocks.' + index + '.batchNumber'">
                      <el-input v-model="batch.batchNumber" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item :label="'Price'" :prop="'stocks.' + index + '.price'">
                      <el-input-number v-model="batch.price" :min="0" :precision="2" :step="0.01" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item :label="'Expiry Date'" :prop="'stocks.' + index + '.expiryDate'">
                      <el-date-picker
                        v-model="batch.expiryDate"
                        type="date"
                        placeholder="Select expiry date"
                        style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item :label="'Total Quantity'" :prop="'stocks.' + index + '.quantity'">
                      <el-input-number v-model="batch.quantity" :min="0" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <div class="locations-section">
                  <h5>Quantity Distribution
                    <el-button 
                      type="primary" 
                      size="small"
                      @click="addNewLocation(index)"
                      circle
                      plain>
                      <el-icon><i-ep-plus /></el-icon>
                    </el-button>
                  </h5>
                  
                  <div v-for="(location, locIdx) in batch.locations" :key="locIdx" class="location-row">
                    <el-row :gutter="20">
                      <el-col :span="12">
                        <el-form-item 
                          :label="'Warehouse/Shelf'" 
                          :prop="'stocks.' + index + '.locations.' + locIdx + '.warehouse'">
                          <el-input v-model="location.warehouse" />
                        </el-form-item>
                      </el-col>
                      
                      <el-col :span="10">
                        <el-form-item 
                          :label="'Quantity'" 
                          :prop="'stocks.' + index + '.locations.' + locIdx + '.quantity'">
                          <el-input-number v-model="location.quantity" :min="0" />
                        </el-form-item>
                      </el-col>
                      
                      <el-col :span="2" class="location-actions">
                        <el-button 
                          type="danger" 
                          size="small"
                          @click="removeLocation(index, locIdx)"
                          circle
                          plain>
                          <el-icon><i-ep-delete /></el-icon>
                        </el-button>
                      </el-col>
                    </el-row>
                  </div>
                </div>
              </div>
            </div>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="Insurance">
          <el-form :model="medicineForm" label-width="180px" class="add-medicine-form">
            <div class="insurance-entries">
              <h3 class="form-section-title">
                Insurance Coverage
                <el-button 
                  type="primary" 
                  size="small"
                  @click="addNewInsurance"
                  class="add-button"
                >
                  <el-icon><i-ep-plus /></el-icon> + Add Insurance
                </el-button>
              </h3>
              
              <div v-for="(insurance, index) in medicineForm.insurances" :key="index" class="insurance-item">
                <div class="insurance-header">
                  <h4>Insurance Entry #{{ index + 1 }}</h4>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="removeInsurance(index)"
                    class="remove-button"
                  >
                    <el-icon><i-ep-delete /></el-icon> Remove
                  </el-button>
                </div>
                
                <div class="insurance-content">
                  <div class="form-section">
                    <div class="table-heading">
                      <div class="table-heading-item">Insurance Provider</div>
                      <div class="table-heading-item">Medicine Specialties</div>
                    </div>
                    
                    <div class="form-label">Insurance Provider</div>
                    <el-select 
                      v-model="insurance.insuranceId" 
                      placeholder="Select insurance provider" 
                      style="width: 100%"
                      @change="(val) => handleInsuranceSelect(val, index)"
                    >
                      <el-option 
                        v-for="ins in availableInsurances" 
                        :key="ins.id" 
                        :label="ins.name" 
                        :value="ins.id" 
                      />
                    </el-select>
                  </div>
                  
                  <div class="form-section">
                    <div class="form-label">Medicine Specialties</div>
                    <div class="tags-input-container">
                      <div class="tags-wrapper">
                        <el-tag
                          v-for="(specialty, spIndex) in insurance.specialties"
                          :key="specialty"
                          closable
                          @close="removeSpecialty(index, spIndex)"
                          size="small"
                          effect="light"
                          class="specialty-tag"
                        >
                          {{ specialty }}
                        </el-tag>
                      </div>
                      <div class="tag-input-wrapper">
                        <el-autocomplete
                          v-model="specialtyInputs[index]"
                          :fetch-suggestions="querySpecialtySearch"
                          placeholder="Add specialty"
                          @select="(item) => handleSelectSpecialty(item, index)"
                          @keyup.enter="() => addSpecialty(index)"
                          class="tag-input"
                          :trigger-on-focus="false"
                        >
                          <template #default="{ item }">
                            <div>{{ item.value }}</div>
                          </template>
                        </el-autocomplete>
                        <el-button 
                          size="small" 
                          @click="addSpecialty(index)"
                        >
                          Add
                        </el-button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="form-section">
                    <div class="table-heading">
                      <div class="table-heading-item">Coverage Details</div>
                    </div>
                    
                    <el-row :gutter="20">
                      <el-col :span="8">
                        <div class="compact-form-item">
                          <div class="form-label">Insurance Price</div>
                          <el-input-number 
                            v-model="insurance.price" 
                            :min="0" 
                            :precision="2" 
                            :step="0.01"
                            @change="() => updateCoverageAmount(index)"
                            style="width: 100%"
                          />
                        </div>
                      </el-col>
                      
                      <el-col :span="8">
                        <div class="compact-form-item">
                          <div class="form-label">Coverage %</div>
                          <el-input-number 
                            v-model="insurance.percentage" 
                            :min="0" 
                            :max="100"
                            @change="() => updateCoverageAmount(index)"
                            style="width: 100%"
                          />
                          <p class="form-help" v-if="insurance.price > 0 && insurance.percentage > 0">
                            Coverage: {{ insurance.coverageAmount }}
                          </p>
                        </div>
                      </el-col>
                      
                      <el-col :span="8">
                        <div class="compact-form-item">
                          <div class="form-label">Government Share</div>
                          <el-input-number 
                            v-model="insurance.share" 
                            :min="0" 
                            :precision="2" 
                            :step="0.01"
                            @change="() => updateCoverageAmount(index)"
                            style="width: 100%"
                          />
                        </div>
                      </el-col>
                    </el-row>
                  </div>
                  
                  <div class="form-section">
                    <div class="table-heading">
                      <div class="table-heading-item">Requirements & Limits</div>
                    </div>
                    
                    <el-row :gutter="20">
                      <el-col :span="8">
                        <div class="compact-form-item">
                          <div class="form-label">Total Coverage</div>
                          <el-input-number 
                            v-model="insurance.total" 
                            :min="0" 
                            :precision="2" 
                            :step="0.01" 
                            disabled
                            style="width: 100%"
                          />
                          <p class="form-help" v-if="insurance.total > 0">
                            Ins ({{ insurance.coverageAmount }}) + Gov ({{ insurance.share }})
                          </p>
                        </div>
                      </el-col>
                      
                      <el-col :span="8">
                        <div class="compact-form-item">
                          <div class="form-label">Maximum Number</div>
                          <el-input-number 
                            v-model="insurance.numMax" 
                            :min="0"
                            style="width: 100%"
                          />
                          <p class="form-help">Max units per prescription</p>
                        </div>
                      </el-col>
                      
                      <el-col :span="8">
                        <div class="compact-form-item">
                          <div class="form-label">Maximum Age</div>
                          <el-input-number 
                            v-model="insurance.ageMax" 
                            :min="0" 
                            :max="120"
                            style="width: 100%"
                          />
                          <p class="form-help">Max patient age</p>
                        </div>
                      </el-col>
                    </el-row>
                    
                    <el-row :gutter="20" style="margin-top: 20px;">
                      <el-col :span="12">
                        <div class="compact-form-item">
                          <div class="form-label">Barcode Required</div>
                          <el-switch v-model="insurance.barcodeRequired" />
                          <p class="form-help">Requires barcode verification</p>
                        </div>
                      </el-col>
                      
                      <el-col :span="12">
                        <div class="compact-form-item">
                          <div class="form-label">Hospital Required</div>
                          <el-switch v-model="insurance.hospitalRequired" />
                          <p class="form-help">Only in hospital settings</p>
                        </div>
                      </el-col>
                    </el-row>
                  </div>
                </div>
              </div>
            </div>
          </el-form>
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMedicinesStore } from '@/store/medicines'
import { ElMessage } from 'element-plus'

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
  insurances: [
    {
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
    }
  ]
})

// Form validation rules
const detailsRules = {
  genericCode: [
    { required: true, message: 'Generic code is required', trigger: 'blur' }
  ],
  englishName: [
    { required: true, message: 'English name is required', trigger: 'blur' }
  ],
  genericName: [
    { required: true, message: 'Generic name is required', trigger: 'blur' }
  ],
  englishCompanyName: [
    { required: true, message: 'Company name is required', trigger: 'blur' }
  ]
}

// Methods for Batches (Stocks)
const addNewBatch = () => {
  medicineForm.stocks.push({
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
  })
}

const removeBatch = (index) => {
  medicineForm.stocks.splice(index, 1)
  if (medicineForm.stocks.length === 0) {
    addNewBatch()
  }
}

const addNewLocation = (batchIndex) => {
  medicineForm.stocks[batchIndex].locations.push({
    warehouse: '',
    quantity: 0
  })
}

const removeLocation = (batchIndex, locationIndex) => {
  medicineForm.stocks[batchIndex].locations.splice(locationIndex, 1)
  if (medicineForm.stocks[batchIndex].locations.length === 0) {
    medicineForm.stocks[batchIndex].locations.push({
      warehouse: '',
      quantity: 0
    })
  }
}

// Methods for Insurance
const addNewInsurance = () => {
  medicineForm.insurances.push({
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
  
  // Initialize specialty input for the new insurance entry
  specialtyInputs[medicineForm.insurances.length - 1] = '';
}

const removeInsurance = (index) => {
  medicineForm.insurances.splice(index, 1)
  if (medicineForm.insurances.length === 0) {
    addNewInsurance()
  }
}

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

// Replace specialtyInputs implementation to use an array instead of object for better reactivity
const specialtyInputs = reactive([]);

// Initialize specialtyInputs array when component is mounted
// Since we're in composition API, this doesn't need to be in an onMounted hook for AddMedicineView
// Initialize empty specialty inputs for existing insurance entries
medicineForm.insurances.forEach((_, index) => {
  specialtyInputs[index] = '';
});

// Update the addSpecialty function to match DoctorsListModal.vue
const addSpecialty = (index, value = null) => {
  const specialty = value || specialtyInputs[index];
  if (specialty && !medicineForm.insurances[index].specialties.includes(specialty)) {
    medicineForm.insurances[index].specialties.push(specialty);
    
    // Add to suggestions if it's not already there
    if (!specialtySuggestions.includes(specialty)) {
      specialtySuggestions.push(specialty);
    }
  }
  specialtyInputs[index] = '';
}

// Update handleSelectSpecialty to match DoctorsListModal.vue implementation
const handleSelectSpecialty = (item, index) => {
  addSpecialty(index, item.value);
}

// Update removeSpecialty to match removeTag in DoctorsListModal.vue
const removeSpecialty = (insuranceIndex, specialtyIndex) => {
  const tag = medicineForm.insurances[insuranceIndex].specialties[specialtyIndex];
  medicineForm.insurances[insuranceIndex].specialties = medicineForm.insurances[insuranceIndex].specialties.filter(item => item !== tag);
}

// Add function to query specialty suggestions
const querySpecialtySearch = (queryString, callback) => {
  const results = queryString
    ? specialtySuggestions.filter(item => {
        return item.toLowerCase().includes(queryString.toLowerCase())
      })
    : specialtySuggestions
  
  callback(results.map(item => ({ value: item })))
}

// Add function to update coverage amount whenever price or percentage changes
const updateCoverageAmount = (insuranceIndex) => {
  const insurance = medicineForm.insurances[insuranceIndex]
  
  // Calculate coverage amount based on price and percentage
  insurance.coverageAmount = (insurance.price * insurance.percentage / 100).toFixed(2)
  
  // Update total coverage (insurance + government)
  insurance.total = parseFloat(insurance.coverageAmount) + parseFloat(insurance.share || 0)
}

const handleInsuranceSelect = (insuranceId, index) => {
  const selectedInsurance = availableInsurances.find(ins => ins.id === insuranceId)
  if (selectedInsurance) {
    medicineForm.insurances[index].insuranceName = selectedInsurance.name
    medicineForm.insurances[index].percentage = selectedInsurance.coveragePercentage
    
    // Update coverage amount
    updateCoverageAmount(index)
  }
}

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
.add-medicine-form {
  margin-top: 20px;
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

.batch-item, .insurance-item {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 20px;
}

.batch-header, .insurance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.batch-header h4, .insurance-header h4 {
  margin: 0;
}

.locations-section {
  margin-top: 20px;
  padding: 15px;
  background-color: var(--background-color);
  border-radius: 6px;
}

.locations-section h5 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  margin-bottom: 15px;
}

.location-row {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-hover);
}

.location-row:last-child {
  border-bottom: none;
}

.location-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.insurance-entries {
  margin-top: 20px;
}

.insurance-content {
  padding: 0 10px;
  background-color: #fafafa;
  border-radius: 4px;
}

.form-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.form-section-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1rem;
  color: var(--primary-color);
  font-weight: 500;
}

.table-heading {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.table-heading-item {
  font-weight: 500;
  color: #606266;
  font-size: 0.9rem;
}

.form-label {
  font-weight: 500;
  color: #606266;
  margin-bottom: 5px;
  display: block;
}

.form-help {
  font-size: 0.75rem;
  color: #909399;
  margin-top: 5px;
}

.tags-input-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
  padding: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.tag-input-wrapper {
  display: flex;
  gap: 10px;
}

.tag-input {
  width: 100%;
}

.specialty-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.add-button {
  background-color: #1890ff;
  border-color: #1890ff;
  color: white;
}

.add-button:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

.remove-button {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.remove-button:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

.compact-form-item {
  margin-bottom: 12px;
}
</style> 