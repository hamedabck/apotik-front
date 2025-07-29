<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="76%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
    class="add-medicine-dialog"
    @close="handleClose">
    
    <div class="dialog-content">
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <div class="operation-indicator">
              <el-tag 
                :type="isEditMode ? 'warning' : 'success'" 
                size="large"
                effect="light"
              >
                <el-icon>
                  <i-ep-edit v-if="isEditMode" />
                  <i-ep-plus v-else />
                </el-icon>
                {{ isEditMode ? 'Editing Existing Drug' : 'Adding New Drug' }}
              </el-tag>
            </div>
          </div>
          
          <!-- Drug Info Display when editing -->
          <div v-if="isEditMode && medicineForm.details.persianName" class="drug-info-display">
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
      
      <div v-if="loadingDrugs && !drugsLoaded" class="loading-drugs">
        <el-alert
          title="Loading drugs database in background for GTIN search..."
          type="info"
          :closable="true"
          show-icon>
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
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <div class="left-actions">
          <el-button 
            v-if="isEditMode"
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
          <el-button @click="handleClose">Cancel</el-button>
          <el-button 
            type="primary" 
            @click="saveMedicine" 
            :loading="pharmacyDrugStore.loading"
          >
            {{ isEditMode ? 'Update Medicine' : 'Save New Medicine' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { useTtacDrugsStore } from '@/store/ttacDrugs'
import { ElMessage, ElMessageBox } from 'element-plus'
import MedicineDetailsForm from '@/components/medicine/MedicineDetailsForm.vue'
import MedicineStockForm from '@/components/medicine/MedicineStockForm.vue'
import MedicineInsuranceForm from '@/components/medicine/MedicineInsuranceForm.vue'
import MedicineDrugSelectionForm from '@/components/medicine/MedicineDrugSelectionForm.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  drugId: {
    type: [Number, String],
    default: null
  },
  mode: {
    type: String,
    default: 'add', // 'add' or 'edit'
    validator: (value) => ['add', 'edit'].includes(value)
  },
  initialTtacDrug: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved', 'deleted'])

const pharmacyDrugStore = usePharmacyDrugStore()
const ttacDrugsStore = useTtacDrugsStore()
const detailsFormRef = ref(null)

// Computed properties
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => medicineForm.details.existingDrugId !== null)
const loadingDrugs = computed(() => ttacDrugsStore.loading)
const drugsLoaded = computed(() => ttacDrugsStore.loaded)
const dialogTitle = computed(() => isEditMode.value ? 'Edit Medicine' : 'Add New Medicine')

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
    category: 'drug',
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

// Watch for changes when switching from edit to add mode (when GTIN is not found)
watch(() => medicineForm.details.existingDrugId, (newId, oldId) => {
  if (newId) {
    medicineForm.details.id = newId
  } else if (oldId !== null && newId === null) {
    // Switching from edit to add mode - clear the ID
    medicineForm.details.id = null
  }
  
  // Clear drug selections when switching to a different drug or mode
  if (newId !== oldId && oldId !== undefined) {
    medicineForm.drugSelections = []
  }
})

// Watch for dialog opening and load drug data if editing
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    if (props.mode === 'edit' && props.drugId) {
      await loadDrugForEdit(props.drugId)
    } else {
      resetForm()
      
      // If we have initial TTAC drug data, auto-populate the GTIN field
      if (props.initialTtacDrug) {
        await nextTick() // Wait for form to reset
        await populateFromTtacDrug(props.initialTtacDrug)
      }
    }
  }
})

// Watch for initialTtacDrug changes when dialog is already open
watch(() => props.initialTtacDrug, async (newTtacDrug) => {
  if (newTtacDrug && props.modelValue && props.mode === 'add') {
    await populateFromTtacDrug(newTtacDrug)
  }
})

// Populate form from TTAC drug data
const populateFromTtacDrug = async (ttacDrug) => {
  try {
    console.log('Auto-populating form with TTAC drug data:', ttacDrug)
    
    // Ensure the GTIN field is empty first to guarantee a change is detected
    if (medicineForm.details.gtinCode) {
      medicineForm.details.gtinCode = ''
      await nextTick()
    }
    
    // Set the GTIN code - this will trigger the auto-population logic
    // in MedicineDetailsForm which will properly populate all fields including
    // genericCode and genericName
    medicineForm.details.gtinCode = ttacDrug.gtin_code
    
    console.log('GTIN code set to:', ttacDrug.gtin_code)
    
    // Wait for the reactive update to complete
    await nextTick()
    
    // Directly trigger the search function to ensure immediate auto-population
    if (detailsFormRef.value && detailsFormRef.value.searchByGtin) {
      console.log('Triggering searchByGtin directly...')
      await detailsFormRef.value.searchByGtin()
    } else {
      console.warn('Could not access searchByGtin function, relying on watcher')
      ElMessage.success('GTIN code set! Auto-populating all fields from TTAC database...')
    }
    
  } catch (error) {
    console.error('Error populating from TTAC drug:', error)
    ElMessage.error('Failed to auto-populate drug information')
  }
}

// Load drug data for editing
const loadDrugForEdit = async (drugId) => {
  try {
    // Find the drug in the store
    const drug = pharmacyDrugStore.drugs.find(d => d.id == drugId)
    if (!drug) {
      ElMessage.error('Drug not found')
      return
    }

    // Populate the form with drug data
    Object.assign(medicineForm.details, {
      id: drug.id,
      gtinCode: drug.gtin_code || '',
      ircCode: drug.irc_code || '',
      genericCode: drug.generic_code || '',
      numPerBox: drug.num_per_box || 1,
      englishName: drug.english_name || '',
      persianName: drug.persian_name || '',
      genericName: drug.generic_name || '',
      englishCompanyName: drug.english_company_name || '',
      persianCompanyName: drug.persian_company_name || '',
      category: drug.category || 'drug',
      keyword: drug.keyword || '',
      technicalEvaluation: drug.technical_evaluation || false,
      pharmacistDescription: drug.pharmacist_description || '',
      latestPrice: drug.latest_price || null,
      barcodes: drug.barcodes || [],
      existingDrugId: drug.id
    })

    // Load related data
    medicineForm.stocks = drug.drug_batches || []
    medicineForm.insurances = drug.drug_insurances || []
    medicineForm.drugSelections = drug.drug_selections_list || []

  } catch (error) {
    console.error('Error loading drug for edit:', error)
    ElMessage.error('Failed to load drug data')
  }
}

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
    }
    
    // Update the form with the saved drug ID
    medicineForm.details.id = savedDrug.id
    medicineForm.details.existingDrugId = savedDrug.id
    
    // Emit saved event
    emit('saved', savedDrug)
    
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
    
    // Emit deleted event and close dialog
    emit('deleted', medicineForm.details.id)
    handleClose()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting drug:', error)
      ElMessage.error('Failed to delete drug. Please try again.')
    }
  }
}

const handleClose = () => {
  dialogVisible.value = false
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
</script>

<style scoped>
.add-medicine-dialog {
  --el-dialog-padding-primary: 0;
}

.add-medicine-dialog :deep(.el-dialog) {
  height: 70vh;
  margin-top: 15vh !important;
  margin-bottom: 15vh !important;
  display: flex;
  flex-direction: column;
}

.add-medicine-dialog :deep(.el-dialog__header) {
  flex-shrink: 0;
}

.add-medicine-dialog :deep(.el-dialog__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.add-medicine-dialog :deep(.el-dialog__footer) {
  flex-shrink: 0;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}

.dialog-content {
  padding: 5px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.medicine-tabs {
  flex: 1;
  display: flex;
  flex-direction: column-reverse;
}

.medicine-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  margin-top: 10px;
}

.medicine-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
}

.medicine-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.page-header {
  margin-bottom: 5px;
  padding: 10px;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
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
  font-size: 16px;
}

.drug-info-display {
  background: white;
  padding: 10px;
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

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 0 20px;
}

.left-actions {
  display: flex;
  gap: 10px;
}

.right-actions {
  display: flex;
  gap: 10px;
}

.loading-drugs {
  margin-bottom: 20px;
}

.loading-drugs .el-alert {
  background-color: #f0f9ff;
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
  
  .dialog-footer {
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