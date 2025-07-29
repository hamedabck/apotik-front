<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="90%"
    top="5vh"
    destroy-on-close
    @close="handleClose">
    
    <div v-loading="loading" class="drug-detail-container">
      <div v-if="drug" class="drug-details">
        <!-- Drug Basic Information -->
        <el-card class="detail-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>Drug Information</h3>
              <el-button 
                size="small" 
                type="primary" 
                plain
                @click="toggleLanguage"
                class="language-toggle">
                {{ showPersian ? 'EN' : 'فا' }}
              </el-button>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="Drug Name">
                  <strong>{{ displayName }}</strong>
                </el-descriptions-item>
                <el-descriptions-item label="Company">
                  {{ displayCompany }}
                </el-descriptions-item>
                <el-descriptions-item label="Generic Code">
                  {{ drug.generic_code || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item label="Generic Name">
                  {{ drug.generic_name || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item label="GTIN">
                  {{ displayGtin }}
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
            <el-col :span="12">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="Total Quantity">
                  <el-tag :type="getStockStatusType(totalQuantity)" size="large">
                    {{ totalQuantity }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Selling Price">
                  <strong>ریال {{ formatNumber(maxSellingPrice) }}</strong>
                </el-descriptions-item>
                <el-descriptions-item label="Stock Status">
                  <el-tag :type="getStockStatusType(totalQuantity)">
                    {{ getStockStatus(totalQuantity) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Created Date">
                  {{ formatDate(drug.created_at) }}
                </el-descriptions-item>
                <el-descriptions-item label="Updated Date">
                  {{ formatDate(drug.updated_at) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-col>
          </el-row>
        </el-card>

        <!-- Batches Information -->
        <el-card class="detail-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>Stock Batches ({{ batches.length }})</h3>
              <el-button 
                type="primary" 
                size="small"
                @click="refreshBatches">
                <el-icon><i-ep-refresh /></el-icon>
                Refresh
              </el-button>
            </div>
          </template>
          
          <div v-if="batches.length > 0" class="batches-table-container">
            <el-table 
              :data="batches" 
              style="width: 100%" 
              border
              stripe
              empty-text="No batches found">
              
              <el-table-column prop="batch_number" label="Batch Number" width="150">
                <template #default="scope">
                  {{ scope.row.batch_number }}
                </template>
              </el-table-column>
              
              <el-table-column prop="price" label="Price" width="120">
                <template #default="scope">
                  {{ formatNumber(scope.row.price) }}
                </template>
              </el-table-column>
              
              <el-table-column prop="expiry_date" label="Expiry Date" width="120">
                <template #default="scope">
                  {{ formatDate(scope.row.expiry_date) }}
                </template>
              </el-table-column>
              
              <el-table-column label="Locations" min-width="300">
                <template #default="scope">
                  <el-tag
                    v-for="(location, index) in scope.row.batch_locations"
                    :key="index"
                    size="small"
                    effect="light"
                    style="margin-right: 5px; margin-bottom: 5px;">
                    {{ location.storage_name }}: {{ location.quantity }}
                  </el-tag>
                  <span v-if="!scope.row.batch_locations || scope.row.batch_locations.length === 0" 
                        class="text-muted">
                    No locations
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="quantity" label="Total Quantity" width="120">
                <template #default="scope">
                  {{ calculateBatchTotalQuantity(scope.row) }}
                </template>
              </el-table-column>
              
              <el-table-column label="Stock Status" width="120">
                <template #default="scope">
                  <el-tag :type="getBatchStockStatusType(scope.row)" size="small">
                    {{ getBatchStockStatus(scope.row) }}
                  </el-tag>
                </template>
              </el-table-column>
              
            </el-table>
          </div>
          
          <div v-else class="no-batches-message">
            <el-empty description="No stock batches found for this drug" />
          </div>
        </el-card>

        <!-- Insurance Information -->
        <el-card class="detail-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <h3>Insurance Coverage ({{ insurances.length }})</h3>
              <el-button 
                type="primary" 
                size="small"
                @click="refreshInsurances">
                <el-icon><i-ep-refresh /></el-icon>
                Refresh
              </el-button>
            </div>
          </template>
          
          <div v-if="insurances.length > 0" class="insurance-table-container">
            <el-table 
              :data="insurances" 
              style="width: 100%" 
              border
              stripe
              table-layout="fixed"
              class="insurance-table"
              :max-height="400"
              empty-text="No insurance coverage found">
              
              <el-table-column prop="insurance_name" label="Provider" width="160" />
              
              <el-table-column prop="specialties" label="Specialties" width="150">
                <template #default="scope">
                  <el-tag
                    v-for="(specialty, index) in scope.row.specialties"
                    :key="index"
                    size="small"
                    effect="light"
                    style="margin-right: 5px; margin-bottom: 5px;">
                    {{ specialty }}
                  </el-tag>
                  <span v-if="!scope.row.specialties || scope.row.specialties.length === 0" 
                        class="text-muted">
                    No specialties
                  </span>
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
                      class="requirement-tag">
                      {{ scope.row.barcode_required ? 'Barcode Required' : 'No Barcode' }}
                    </el-tag>
                    <el-tag 
                      size="small" 
                      :type="scope.row.hospital_required ? 'danger' : 'info'"
                      class="requirement-tag">
                      {{ scope.row.hospital_required ? 'Hospital Only' : 'No Hospital' }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              
            </el-table>
          </div>
          
          <div v-else class="no-insurance-message">
            <el-empty description="No insurance coverage found for this drug" />
          </div>
        </el-card>
      </div>
      
      <div v-else-if="!loading" class="no-data">
        <el-empty description="Drug not found" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Close</el-button>
        <el-button type="primary" @click="editDrug" v-if="drug">
          Edit Drug
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { formatDate } from '@/utils/dateUtils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  drugId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'edit-drug'])

const pharmacyDrugStore = usePharmacyDrugStore()
const loading = ref(false)
const showPersian = ref(false)
const drug = ref(null)
const batches = ref([])
const insurances = ref([])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dialogTitle = computed(() => {
  if (!drug.value) return 'Drug Details'
  const name = showPersian.value 
    ? (drug.value.persian_name || drug.value.english_name)
    : (drug.value.english_name || drug.value.persian_name)
  return `Drug Details - ${name || 'Unknown'}`
})

const displayName = computed(() => {
  if (!drug.value) return 'N/A'
  return showPersian.value 
    ? (drug.value.persian_name || drug.value.english_name || 'N/A')
    : (drug.value.english_name || drug.value.persian_name || 'N/A')
})

const displayCompany = computed(() => {
  if (!drug.value) return 'N/A'
  return showPersian.value 
    ? (drug.value.persian_company_name || drug.value.english_company_name || 'N/A')
    : (drug.value.english_company_name || drug.value.persian_company_name || 'N/A')
})

const totalQuantity = computed(() => {
  if (!drug.value) return 0
  
  // Always calculate from batches for this specific drug to ensure accuracy
  if (batches.value.length > 0) {
    const calculatedTotal = batches.value.reduce((total, batch) => {
      // Calculate quantity from batch locations if available
      const batchQuantity = calculateBatchTotalQuantity(batch)
      console.log(`Batch ${batch.batch_number}: quantity = ${batchQuantity}`)
      return total + batchQuantity
    }, 0)
    
    console.log(`Total quantity calculated from ${batches.value.length} batches: ${calculatedTotal}`)
    return calculatedTotal
  }
  
  // If no batches exist for this drug, the total quantity should be 0
  // regardless of what's stored in the drug record
  console.log(`No batches found for drug ID ${props.drugId}, total quantity = 0`)
  return 0
})

const displayGtin = computed(() => {
  if (!drug.value) return 'N/A'
  return drug.value.gtin || 
         drug.value.gtin_code || 
         drug.value.gtinCode || 
         'N/A'
})

const maxSellingPrice = computed(() => {
  if (!batches.value || batches.value.length === 0) {
    return drug.value?.selling_price || 0
  }
  
  // Find the maximum price from all batches
  const prices = batches.value
    .map(batch => batch.price || 0)
    .filter(price => price > 0)
  
  if (prices.length === 0) {
    return drug.value?.selling_price || 0
  }
  
  return Math.max(...prices)
})

// Watch for drugId changes to fetch data
watch(() => props.drugId, async (newId) => {
  if (newId && props.modelValue) {
    await fetchDrugDetails()
  }
}, { immediate: true })

// Watch for modal visibility
watch(() => props.modelValue, async (isVisible) => {
  if (isVisible && props.drugId) {
    await fetchDrugDetails()
  }
})

const fetchDrugDetails = async () => {
  if (!props.drugId) return
  
  loading.value = true
  
  // Clear previous data to avoid showing data from previous drug
  batches.value = []
  insurances.value = []
  
  try {
    // Find drug in store
    drug.value = pharmacyDrugStore.drugs.find(d => d.id == props.drugId)
    
    if (!drug.value) {
      // If not found in store, refresh drugs
      await pharmacyDrugStore.fetchDrugs()
      drug.value = pharmacyDrugStore.drugs.find(d => d.id == props.drugId)
    }
    
    // Debug: Log the drug data to see what fields are available
    console.log('Drug data for ID', props.drugId, ':', drug.value)
    
    // Fetch batches and insurances for this specific drug
    // We need batches first to calculate total quantity accurately
    await fetchBatches()
    await fetchInsurances()
    
    // Debug: Log after fetching data
    console.log('Final drug data:', drug.value)
    console.log('Filtered batches for drug:', batches.value)
    console.log('Filtered insurances for drug:', insurances.value)
    console.log('Calculated total quantity:', totalQuantity.value)
  } catch (error) {
    console.error('Error fetching drug details:', error)
  } finally {
    loading.value = false
  }
}

const fetchBatches = async () => {
  try {
    // Clear existing batches first
    batches.value = []
    
    // Fetch batches for the specific drug
    console.log('Fetching batches for drug ID:', props.drugId)
    await pharmacyDrugStore.fetchBatches(props.drugId)
    
    // The store should already filter by drug ID, but let's double-check
    const allBatches = pharmacyDrugStore.batches
    console.log('All batches from store:', allBatches)
    
    // Filter batches to only include those for this specific drug
    batches.value = allBatches.filter(batch => {
      const batchDrugId = batch.drug
      const currentDrugId = parseInt(props.drugId)
      const matches = batchDrugId === currentDrugId
      console.log(`Batch ${batch.id}: drug=${batchDrugId}, current=${currentDrugId}, matches=${matches}`)
      return matches
    })
    
    console.log(`Filtered to ${batches.value.length} batches for drug ID ${props.drugId}`)
  } catch (error) {
    console.error('Error fetching batches:', error)
    batches.value = []
  }
}

const fetchInsurances = async () => {
  try {
    // Clear existing insurances first
    insurances.value = []
    
    // Fetch insurances for the specific drug
    console.log('Fetching insurances for drug ID:', props.drugId)
    await pharmacyDrugStore.fetchDrugInsurances(props.drugId)
    
    // The store should already filter by drug ID, but let's double-check
    const allInsurances = pharmacyDrugStore.drugInsurances
    console.log('All insurances from store:', allInsurances)
    
    // Filter insurances to only include those for this specific drug
    insurances.value = allInsurances.filter(insurance => {
      const insuranceDrugId = insurance.drug
      const currentDrugId = parseInt(props.drugId)
      const matches = insuranceDrugId === currentDrugId
      console.log(`Insurance ${insurance.id}: drug=${insuranceDrugId}, current=${currentDrugId}, matches=${matches}`)
      return matches
    })
    
    console.log(`Filtered to ${insurances.value.length} insurances for drug ID ${props.drugId}`)
  } catch (error) {
    console.error('Error fetching insurances:', error)
    insurances.value = []
  }
}

const refreshBatches = async () => {
  console.log('Refreshing batches for drug ID:', props.drugId)
  await fetchBatches()
}

const refreshInsurances = async () => {
  console.log('Refreshing insurances for drug ID:', props.drugId)
  await fetchInsurances()
}

const toggleLanguage = () => {
  showPersian.value = !showPersian.value
}

const handleClose = () => {
  visible.value = false
  // Clear data when closing
  drug.value = null
  batches.value = []
  insurances.value = []
}

const editDrug = () => {
  emit('edit-drug', props.drugId)
}

// Utility functions
const getStockStatus = (quantity) => {
  if (!quantity || quantity <= 0) return 'Out of Stock'
  if (quantity < 50) return 'Low Stock'
  return 'In Stock'
}

const getStockStatusType = (quantity) => {
  if (!quantity || quantity <= 0) return 'danger'
  if (quantity < 50) return 'warning'
  return 'success'
}

const getExpiryStatus = (dateString) => {
  if (!dateString) return 'Unknown'
  const expiryDate = new Date(dateString)
  const today = new Date()
  const diffTime = expiryDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Expired'
  if (diffDays < 90) return 'Near Expiry'
  return 'Safe'
}

const getExpiryStatusType = (dateString) => {
  const status = getExpiryStatus(dateString)
  switch (status) {
    case 'Expired': return 'danger'
    case 'Near Expiry': return 'warning'
    default: return 'success'
  }
}

// Format number with thousands separators
const formatNumber = (num) => {
  if (!num && num !== 0) return ''
  return Number(num).toLocaleString()
}

// Calculate total quantity for a batch from its locations
const calculateBatchTotalQuantity = (batch) => {
  if (!batch.batch_locations || batch.batch_locations.length === 0) {
    return batch.quantity || 0
  }
  
  return batch.batch_locations.reduce((total, location) => {
    return total + (location.quantity || 0)
  }, 0)
}

// Format currency with Persian number formatting
const formatCurrency = (amount) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('fa-IR').format(amount)
}

// Get stock status for a batch
const getBatchStockStatus = (batch) => {
  const quantity = calculateBatchTotalQuantity(batch)
  
  if (!quantity || quantity <= 0) {
    return 'Out of Stock'
  } else if (quantity < 50) {
    return 'Low Stock'
  } else {
    return 'In Stock'
  }
}

// Get stock status type for styling
const getBatchStockStatusType = (batch) => {
  const quantity = calculateBatchTotalQuantity(batch)
  
  if (!quantity || quantity <= 0) {
    return 'danger'
  } else if (quantity < 50) {
    return 'warning'
  } else {
    return 'success'
  }
}
</script>

<style scoped>
.drug-detail-container {
  min-height: 400px;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.language-toggle {
  font-family: var(--font-persian);
  font-weight: bold;
  min-width: 35px;
}

.price-source {
  font-size: 0.75rem;
  color: var(--el-text-color-placeholder);
  font-weight: normal;
  margin-left: 8px;
}

.location-tag {
  margin: 2px;
}

.requirements {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.requirements .el-tag {
  margin: 1px;
}

.text-muted {
  color: var(--el-text-color-placeholder);
  font-size: 0.9em;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Batches table styling */
.batches-table-container {
  margin-top: 1px;
}

.no-batches-message {
  padding: 40px 20px;
  text-align: center;
}

/* Insurance table styling */
.insurance-table-container {
  margin-top: 10px;
  max-width: 100%;
  overflow: hidden;
}

.no-insurance-message {
  padding: 40px 20px;
  text-align: center;
}

.insurance-table {
  width: 100% !important;
  --el-table-border-color: #ebeef5;
  border-radius: 4px;
}

/* Insurance table layout fixes */
.insurance-table-container :deep(.el-table) {
  margin: 0 !important;
  font-size: 0.9rem;
}

.insurance-table-container :deep(.el-table__body-wrapper) {
  overflow-y: auto !important;
  overflow-x: auto !important;
}

.insurance-table-container :deep(.el-table__header-wrapper) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
}

.insurance-table-container :deep(.el-table__header th) {
  background-color: #f8f9fa !important;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #ebeef5;
}

.insurance-table-container :deep(.el-table td) {
  padding: 8px 0;
  text-align: center;
}

.insurance-table-container :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafbfc;
}

/* Requirements styling */
.needs-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.requirement-tag {
  width: fit-content;
  font-size: 0.75rem;
}

/* Location tags styling */
.batches-table-container .el-tag {
  margin: 2px;
  font-size: 0.8rem;
}

/* Table styling to match MedicineStockForm */
.batches-table-container :deep(.el-table) {
  font-size: 0.9rem;
}

.batches-table-container :deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.batches-table-container :deep(.el-table td) {
  padding: 8px 0;
}

.batches-table-container :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafbfc;
}

/* Responsive design */
@media (max-width: 768px) {
  .el-col {
    margin-bottom: 20px;
  }
  
  .batches-table-container {
    overflow-x: auto;
  }
  
  .insurance-table-container {
    overflow-x: auto;
  }
}
</style> 