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
                  circle
                  plain>
                  <el-icon><i-ep-plus /></el-icon>
                </el-button>
              </h3>
              
              <div v-for="(insurance, index) in medicineForm.insurances" :key="index" class="insurance-item">
                <div class="insurance-header">
                  <h4>Insurance Entry #{{ index + 1 }}</h4>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="removeInsurance(index)"
                    circle
                    plain>
                    <el-icon><i-ep-delete /></el-icon>
                  </el-button>
                </div>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item :label="'Insurance Type'" :prop="'insurances.' + index + '.type'">
                      <el-select v-model="insurance.type" placeholder="Select insurance type" style="width: 100%">
                        <el-option label="Basic Insurance" value="Basic Insurance" />
                        <el-option label="Supplementary Insurance" value="Supplementary Insurance" />
                        <el-option label="Special Coverage" value="Special Coverage" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item :label="'Medicine Speciality'" :prop="'insurances.' + index + '.speciality'">
                      <el-select v-model="insurance.speciality" placeholder="Select speciality" style="width: 100%">
                        <el-option label="General" value="General" />
                        <el-option label="Cardiac" value="Cardiac" />
                        <el-option label="Neurological" value="Neurological" />
                        <el-option label="Pediatric" value="Pediatric" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item :label="'Insurance Price'" :prop="'insurances.' + index + '.price'">
                      <el-input-number v-model="insurance.price" :min="0" :precision="2" :step="0.01" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="8">
                    <el-form-item :label="'Percentage'" :prop="'insurances.' + index + '.percentage'">
                      <el-input-number v-model="insurance.percentage" :min="0" :max="100" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="8">
                    <el-form-item :label="'Insurance Share'" :prop="'insurances.' + index + '.share'">
                      <el-input-number v-model="insurance.share" :min="0" :precision="2" :step="0.01" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item :label="'ARZ'" :prop="'insurances.' + index + '.arz'">
                      <el-input-number v-model="insurance.arz" :min="0" :precision="2" :step="0.01" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="8">
                    <el-form-item :label="'Total'" :prop="'insurances.' + index + '.total'">
                      <el-input-number v-model="insurance.total" :min="0" :precision="2" :step="0.01" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item :label="'Maximum Number'" :prop="'insurances.' + index + '.numMax'">
                      <el-input-number v-model="insurance.numMax" :min="0" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item :label="'Maximum Age'" :prop="'insurances.' + index + '.ageMax'">
                      <el-input-number v-model="insurance.ageMax" :min="0" :max="120" />
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item :label="'Barcode Required'" :prop="'insurances.' + index + '.barcodeRequired'">
                      <el-switch v-model="insurance.barcodeRequired" />
                    </el-form-item>
                  </el-col>
                  
                  <el-col :span="12">
                    <el-form-item :label="'Hospital Required'" :prop="'insurances.' + index + '.hospitalRequired'">
                      <el-switch v-model="insurance.hospitalRequired" />
                    </el-form-item>
                  </el-col>
                </el-row>
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
import { ref, reactive } from 'vue'
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
      type: 'Basic Insurance',
      speciality: 'General',
      price: 0,
      percentage: 0,
      share: 0,
      arz: 0,
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
    type: 'Basic Insurance',
    speciality: 'General',
    price: 0,
    percentage: 0,
    share: 0,
    arz: 0,
    total: 0,
    numMax: 0,
    ageMax: 0,
    barcodeRequired: false,
    hospitalRequired: false
  })
}

const removeInsurance = (index) => {
  medicineForm.insurances.splice(index, 1)
  if (medicineForm.insurances.length === 0) {
    addNewInsurance()
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
</style> 