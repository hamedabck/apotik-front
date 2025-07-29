<template>
  <div class="add-medicine-page">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            {{ isEditingExisting ? 'Edit Medicine' : 'Add New Medicine' }}
          </h1>
          <div class="operation-indicator">
            <el-tag 
              :type="isEditingExisting ? 'warning' : 'success'" 
              size="large"
              effect="light"
            >
              <el-icon>
                <i-ep-edit v-if="isEditingExisting" />
                <i-ep-plus v-else />
              </el-icon>
              {{ isEditingExisting ? 'Editing Existing Drug' : 'Adding New Drug' }}
            </el-tag>
          </div>
        </div>
        
        <!-- Drug Info Display when editing -->
        <div v-if="isEditingExisting && medicineForm.details.persianName" class="drug-info-display">
          <div class="drug-name">
            <span class="label">Drug:</span>
            <span class="name">{{ medicineForm.details.persianName }}</span>
            <span v-if="medicineForm.details.englishName" class="english-name">
              ({{ medicineForm.details.englishName }}) - {{ medicineForm.details.englishCompanyName }}
            </span>
          </div>
          <div v-if="medicineForm.details.gtinCode" class="drug-gtin">
            <span class="label">GTIN:</span>
            <span class="code">{{ medicineForm.details.gtinCode }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div v-if="loadingDrugs && !drugsLoaded" class="loading-drugs">
        <el-alert
          title="Loading TTAC drugs database in background..."
          type="info"
          :closable="true"
          show-icon>
        </el-alert>
      </div>
      
      <div v-if="!loadingDrugs && drugsLoaded" class="drugs-loaded">
        <el-alert
          :title="`TTAC drugs database loaded successfully (${ttacDrugsStore.drugs.length} drugs available)`"
          type="success"
          :closable="true"
          show-icon
          @close="ttacDrugsLoaded = false">
        </el-alert>
      </div>
      
      <el-tabs tab-position="top" class="medicine-tabs">
        <el-tab-pane label="Details">
          <MedicineDetailsForm 
            v-model="medicineForm.details"
            ref="detailsFormRef"
          />
        </el-tab-pane>
        
        <el-tab-pane label="Stock" :disabled="!medicineForm.details.id">
          <MedicineStockForm 
            v-model="medicineForm.stocks"
            :medicine-details="medicineForm.details"
          />
          <div v-if="!medicineForm.details.id" class="tab-disabled-message">
            <el-alert
              title="Please save the medicine details first before adding stock information"
              type="warning"
              :closable="false"
              show-icon>
            </el-alert>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="Insurance" :disabled="!medicineForm.details.id">
          <MedicineInsuranceForm 
            v-model="medicineForm.insurances"
            :medicine-details="medicineForm.details"
          />
          <div v-if="!medicineForm.details.id" class="tab-disabled-message">
            <el-alert
              title="Please save the medicine details first before adding insurance information"
              type="warning"
              :closable="false"
              show-icon>
            </el-alert>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="Attendant Drugs" :disabled="!medicineForm.details.id">
          <MedicineDrugSelectionForm 
            v-model="medicineForm.drugSelections"
            :medicine-details="medicineForm.details"
          />
          <div v-if="!medicineForm.details.id" class="tab-disabled-message">
            <el-alert
              title="Please save the medicine details first before adding drug selections"
              type="warning"
              :closable="false"
              show-icon>
            </el-alert>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <div class="form-actions">
        <div class="left-actions">
          <el-button 
            v-if="isEditingExisting"
            type="danger" 
            plain
            @click="deleteDrug"
            :loading="pharmacyDrugStore.loading"
          >
            <el-icon><i-ep-delete /></el-icon>
            Delete Drug
          </el-button>
        </div>
        <div class="right-actions">
          <el-button @click="cancel">Cancel</el-button>
          <el-button 
            type="primary" 
            @click="saveMedicine" 
            :loading="pharmacyDrugStore.loading"
          >
            {{ isEditingExisting ? 'Update Medicine' : 'Save New Medicine' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { useTtacDrugsStore } from '@/store/ttacDrugs'
import { ElMessage, ElMessageBox } from 'element-plus'
import MedicineDetailsForm from '@/components/medicine/MedicineDetailsForm.vue'
import MedicineStockForm from '@/components/medicine/MedicineStockForm.vue'
import MedicineInsuranceForm from '@/components/medicine/MedicineInsuranceForm.vue'
import MedicineDrugSelectionForm from '@/components/medicine/MedicineDrugSelectionForm.vue'

const router = useRouter()
const route = useRoute()
const pharmacyDrugStore = usePharmacyDrugStore()
const ttacDrugsStore = useTtacDrugsStore()
const detailsFormRef = ref(null)

// TTAC drugs loading state (using the same approach as FactorsView.vue)
const ttacDrugsLoaded = ref(false)
const ttacDrugsLoading = ref(false)

// Computed properties for UI reactivity
const loadingDrugs = computed(() => ttacDrugsLoading.value)
const drugsLoaded = computed(() => ttacDrugsLoaded.value)

// Initialize form with empty values
const medicineForm = reactive({
  details: {
    id: null,
    gtinCode: '',
    ircCode: '',
    genericCode: '',
    numPerBox: 1,
    englishName: '',
    persianName: '',
    genericName: '',
    englishCompanyName: '',
    persianCompanyName: '',
    category: 'drug', // Default category
    keyword: '',
    technicalEvaluation: false,
    pharmacistDescription: '',
    latestPrice: null,
    barcodes: [],
    existingDrugId: null
  },
  stocks: [],
  insurances: [],
  drugSelections: []
})

// Watch for changes in medicine details to update the ID
watch(() => medicineForm.details.existingDrugId, (newId, oldId) => {
  if (newId) {
    medicineForm.details.id = newId
  }
  
  // Clear drug selections when switching to a different drug
  if (newId !== oldId && oldId !== undefined) {
    medicineForm.drugSelections = []
  }
})

// Form Actions
const saveMedicine = async () => {
  try {
    // Validate the details form
    const isValid = await detailsFormRef.value.validate()
    if (!isValid) {
      ElMessage.error('Please fix the validation errors in the form')
      return
    }
    
    // Prepare drug data for API
    const drugData = {
      gtin_code: medicineForm.details.gtinCode,
      irc_code: medicineForm.details.ircCode,
      generic_code: medicineForm.details.genericCode,
      generic_name: medicineForm.details.genericName,
      english_name: medicineForm.details.englishName,
      persian_name: medicineForm.details.persianName,
      english_company_name: medicineForm.details.englishCompanyName,
      persian_company_name: medicineForm.details.persianCompanyName,
      category: medicineForm.details.category,
      technical_evaluation: medicineForm.details.technicalEvaluation,
      num_per_box: medicineForm.details.numPerBox,
      latest_price: medicineForm.details.latestPrice,
      keyword: medicineForm.details.keyword,
      pharmacist_description: medicineForm.details.pharmacistDescription,
      barcodes: medicineForm.details.barcodes || []
    }
    
    let savedDrug
    
    if (medicineForm.details.existingDrugId) {
      // Update existing drug
      savedDrug = await pharmacyDrugStore.updateDrug(medicineForm.details.existingDrugId, drugData)
      ElMessage.success('Medicine updated successfully')
    } else {
      // Create new drug
      savedDrug = await pharmacyDrugStore.createOrUpdateDrug(drugData)
      ElMessage.success('Medicine saved successfully')
    }
    
    // Update the form with the saved drug ID
    medicineForm.details.id = savedDrug.id
    medicineForm.details.existingDrugId = savedDrug.id
    
    // Stay on the page - don't navigate away
    // This allows users to continue adding stock and insurance information
    
  } catch (error) {
    console.error('Error saving medicine:', error)
    
    // Handle specific error cases
    if (error.response?.status === 400) {
      const errorData = error.response.data
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
      } else {
        ElMessage.error('Validation error: ' + (errorData.detail || 'Please check your input'))
      }
    } else {
      ElMessage.error('Failed to save medicine. Please try again.')
    }
  }
}

const deleteDrug = async () => {
  if (!medicineForm.details.id) {
    ElMessage.warning('No drug selected for deletion')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${medicineForm.details.persianName || medicineForm.details.englishName}"? This action cannot be undone and will also delete all associated stock, insurance, and drug selection data.`,
      'Confirm Delete Drug',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        dangerouslyUseHTMLString: false
      }
    )

    // Delete the drug
    await pharmacyDrugStore.deleteDrug(medicineForm.details.id)
    
    ElMessage.success('Drug deleted successfully')
    
    // Navigate back to medicines list
    router.push({ name: 'MedicinesList' })
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting drug:', error)
      ElMessage.error('Failed to delete drug. Please try again.')
    }
  }
}

const cancel = () => {
  router.push({ name: 'MedicinesList' })
}

// Reset form to initial state
const resetForm = () => {
  Object.assign(medicineForm.details, {
    id: null,
    gtinCode: '',
    ircCode: '',
    genericCode: '',
    numPerBox: 1,
    englishName: '',
    persianName: '',
    genericName: '',
    englishCompanyName: '',
    persianCompanyName: '',
    category: 'drug',
    keyword: '',
    technicalEvaluation: false,
    pharmacistDescription: '',
    latestPrice: null,
    barcodes: [],
    existingDrugId: null
  })
  medicineForm.stocks = []
  medicineForm.insurances = []
  medicineForm.drugSelections = []
}

// Watch for route changes to reset form when navigating to add new medicine
watch(() => route.path, (newPath) => {
  if (newPath === '/medicines/add') {
    resetForm()
  }
}, { immediate: true })

// Background loading of TTAC drugs (same approach as FactorsView.vue)
const loadTtacDrugsInBackground = async () => {
  try {
    ttacDrugsLoading.value = true
    console.log('🔄 Loading TTAC drugs in background...')
    await ttacDrugsStore.ensureDataAvailable()
    ttacDrugsLoaded.value = true
    console.log(`✅ TTAC drugs loaded in background: ${ttacDrugsStore.drugs.length} drugs available for search`)
  } catch (error) {
    console.error('❌ Failed to load TTAC drugs in background:', error)
    ttacDrugsLoaded.value = false
  } finally {
    ttacDrugsLoading.value = false
  }
}

// Reset form when component mounts
onMounted(async () => {
  if (route.path === '/medicines/add') {
    resetForm()
  }
  
  // Start background loading of TTAC drugs (non-blocking)
  loadTtacDrugsInBackground()
})

// Cleanup on component unmount
onBeforeUnmount(() => {
  // Any cleanup if needed
})

// Additional computed properties
const isEditingExisting = computed(() => medicineForm.details.id !== null)
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.operation-indicator {
  display: flex;
  align-items: center;
}

.operation-indicator .el-tag {
  font-size: 0.8rem;
  padding: 8px 25px 0px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.operation-indicator .el-icon {
  /* margin-right: 6px; */
  font-size: 16px;
}

.drug-info-display {
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.1);
  min-width: 300px;
}

.drug-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.drug-gtin {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drug-info-display .label {
  font-size: 0.8rem;
  font-weight: bold;
  color: #2e8ceb;
  min-width: 45px;
}

.drug-info-display .name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
}

.drug-info-display .english-name {
  font-size: 0.8rem;
  color: #64748b;
}

.drug-info-display .code {
  font-size: 0.8rem;
  color: #1e293b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.left-actions {
  display: flex;
  gap: 10px;
}

.right-actions {
  display: flex;
  gap: 10px;
}

.loading-drugs,
.drugs-loaded {
  margin-bottom: 20px;
}

.loading-drugs .el-alert {
  background-color: #f0f9ff;
}

.drugs-loaded .el-alert {
  background-color: #f0fdf4;
}

.tab-disabled-message {
  padding: 20px;
  text-align: center;
}

.tab-disabled-message .el-alert {
  max-width: 600px;
  margin: 0 auto;
}

/* Disabled tab styling */
:deep(.el-tabs__item.is-disabled) {
  color: #c0c4cc;
  cursor: not-allowed;
}

:deep(.el-tabs__item.is-disabled:hover) {
  color: #c0c4cc;
}

/* Responsive design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .drug-info-display {
    min-width: auto;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .left-actions,
  .right-actions {
    justify-content: center;
  }
  
  .left-actions {
    order: 2;
  }
  
  .right-actions {
    order: 1;
  }
}
</style> 