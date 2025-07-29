<template>
  <el-form :model="modelValue" label-width="180px" class="add-medicine-form">
    <div class="stock-entries">
      <h3 class="form-section-title">
        Stock Batches
      </h3>
      
      <!-- Stock Form Card -->
      <div class="stock-form-card">
        <div class="stock-header">
          <h4>{{ isEditing ? 'Edit Stock Batch' : 'Add Stock Batch' }}</h4>
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
              @click="addNewBatchToTable"
              :disabled="isDuplicateBatch"
              class="add-button"
            >
              <el-icon><i-ep-plus v-if="!isEditing" /><i-ep-check v-else /></el-icon> 
              {{ isEditing ? 'Update Batch' : 'Add to Table' }}
            </el-button>
          </div>
        </div>
        
        <div class="stock-form-content">
          <!-- First row: Batch Number and Price -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">▌▌▌Batch Number</label>
              <div class="batch-input-container">
                <el-input 
                  v-model="currentBatch.batchNumber" 
                  placeholder="Enter/paste batch code (English keyboard only) - extracts automatically"
                  @input="handleBatchInput"
                  @blur="extractBatchInfo"
                  @paste="handleBatchPaste"
                  @keyup.enter="extractBatchInfo"
                  :loading="isExtracting"
                  :class="['compact-input', { 'duplicate-batch': isDuplicateBatch }]"
                />
                <el-icon v-if="batchExtracted" class="batch-success-icon">
                  <i-ep-circle-check />
                </el-icon>
                <el-icon v-if="isDuplicateBatch" class="batch-error-icon">
                  <i-ep-warning />
                </el-icon>
              </div>
              <span v-if="isDuplicateBatch" class="error-text">
                This batch number already exists in the table
              </span>
            </div>
            
            <div class="form-group">
              <label class="compact-label">Price</label>
              <el-input 
                v-model="formattedPrice" 
                placeholder="Price"
                @input="handlePriceInput"
                @blur="formatPriceDisplay"
                class="compact-input price-input"
              />
              <span class="help-text">
                Latest Price on TTAC: 
                <span v-if="medicineDetails.latestPrice" class="price-display">
                  <span class="amount">{{ Number(medicineDetails.latestPrice).toLocaleString() }}</span>
                  <span class="currency">ریال</span>
                </span>
                <span v-else>Not available</span>
              </span>
            </div>

            <div class="form-group">
              <label class="compact-label">Expiry Date</label>
              <el-input 
                v-model="formattedExpiryDate"
                placeholder="YYYY/MM/DD"
                @input="handleExpiryDateInput"
                @blur="validateAndFormatExpiryDate"
                @keyup.enter="validateAndFormatExpiryDate"
                maxlength="10"
                class="compact-input expiry-date-input"
              />
              <span class="help-text">
                Type date in YYYY/MM/DD format (auto-formatted)
              </span>
            </div>
            <div class="form-group">
              <label class="compact-label">Total Quantity</label>
              <el-input 
                v-model="currentBatch.quantity" 
                type="number"
                disabled
                placeholder="Total quantity"
                class="compact-input"
              />
              <span class="help-text">Sum of all location quantities</span>
            </div>

          </div>
          
          <!-- Second row: Locations -->
          <div class="form-row">
            <div class="form-group locations-group">
              <div class="locations-header">
                <label class="compact-label">Storage Locations</label>
                <el-button 
                  type="primary" 
                  size="small"
                  @click="addNewLocation"
                  :disabled="!canAddMoreLocations"
                  circle
                  plain
                >
                  <el-icon><i-ep-plus /> + </el-icon>
                </el-button>
              </div>
              
              <div class="locations-list">
                <div v-for="(location, index) in currentBatch.locations" :key="index" class="location-item">
                  <el-select 
                    v-model="location.storageId" 
                    placeholder="Select storage"
                    class="location-select"
                    @change="handleStorageChange(location.storageId, index)"
                  >
                    <el-option 
                      v-for="storage in getAvailableStoragesForLocation(index)" 
                      :key="storage.id" 
                      :label="storage.name" 
                      :value="storage.id"
                    />
                  </el-select>
                  
                  <el-input-number 
                    v-model="location.quantity" 
                    :min="0"
                    placeholder="Quantity"
                    @change="updateTotalQuantity"
                    class="quantity-input"
                  />
                  
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="removeLocation(index)"
                    :disabled="currentBatch.locations.length === 1"
                    circle
                    plain
                  >
                    <el-icon><i-ep-delete /> - </el-icon>
                  </el-button>
                </div>
                
                <!-- Show warning if no more storage locations available -->
                <div v-if="!canAddMoreLocations && currentBatch.locations.length > 0" class="no-more-locations-warning">
                  <el-icon><i-ep-warning /></el-icon>
                  <span>All available storage locations have been used for this batch</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Third row: Total Quantity -->
          <div class="form-row">

          </div>
        </div>
      </div>
      
      <!-- Stock Table -->
      <div class="stock-table-container" v-if="modelValue.length > 0">
        <h4 class="table-title">Stock Batches Table</h4>
        <el-table :data="modelValue" stripe style="width: 100%" border>
          <el-table-column prop="batchNumber" label="Batch Number" width="150">
            <template #default="scope">
              <div :class="{ 'editing-batch': isEditing && editingBatchIndex === scope.$index }">
                {{ scope.row.batchNumber }}
                <el-tag v-if="isEditing && editingBatchIndex === scope.$index" type="warning" size="small" style="margin-left: 8px">
                  Editing
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="Price" width="120">
            <template #default="scope">
              {{ formatNumber(scope.row.price) }}
            </template>
          </el-table-column>
          <el-table-column prop="expiryDate" label="Expiry Date" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.expiryDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="locations" label="Locations" min-width="300">
            <template #default="scope">
              <el-tag
                v-for="(location, index) in scope.row.locations"
                :key="index"
                size="small"
                effect="light"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ location.storageName }}: {{ location.quantity }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="Total Quantity" width="120" />
          <el-table-column label="Operations" width="200">
            <template #default="scope">
              <div class="operations-container">
                <el-button
                  size="small"
                  @click="editBatch(scope.$index)"
                  type="primary"
                  plain
                  :disabled="isEditing && editingBatchIndex === scope.$index"
                >
                  {{ isEditing && editingBatchIndex === scope.$index ? 'Editing...' : 'Edit' }}
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  @click="removeBatch(scope.$index)"
                  :disabled="isEditing && editingBatchIndex === scope.$index"
                >
                  Delete
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="no-data-message" v-else>
        <p>No stock batches added yet. Use the form above to add batches.</p>
      </div>
    </div>
  </el-form>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStorageStore } from '@/stores/storageStore'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { formatDate } from '@/utils/dateUtils'

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
const isEditing = ref(false)
const editingBatchIndex = ref(-1) // Track which batch is being edited
const editingBatchId = ref(null) // Track the ID of the batch being edited
const originalBatch = ref(null) // Store original batch data for cancel functionality
const storageStore = useStorageStore()
const pharmacyDrugStore = usePharmacyDrugStore()

// Batch extraction variables
const isExtracting = ref(false)
const batchExtracted = ref(false)
let batchTimeout = null

// Get available storage locations from the store
const availableStorages = computed(() => storageStore.storages)

// Get batches from the pharmacy drug store
const drugBatches = computed(() => {
  if (props.medicineDetails.id) {
    return pharmacyDrugStore.batches.filter(batch => batch.drug === props.medicineDetails.id)
  }
  return []
})

const currentBatch = reactive({
  batchNumber: '',
  price: 0,
  expiryDate: '',
  quantity: 0,
  locations: [
    {
      storageId: null, // Use storage ID instead of name
      storageName: '', // Keep name for display
      quantity: 0
    }
  ]
})

const formattedPrice = ref('')
const formattedExpiryDate = ref('')

// Initialize storage data on component mount
onMounted(async () => {
  try {
    await storageStore.ensureDataAvailable()
    
    // Initialize first location with first available storage if available
    if (availableStorages.value.length > 0 && currentBatch.locations.length > 0) {
      const firstStorage = availableStorages.value[0]
      currentBatch.locations[0].storageId = firstStorage.id
      currentBatch.locations[0].storageName = firstStorage.name
    }
    
    // Load existing batches if medicine details are available
    if (props.medicineDetails.id) {
      await loadBatches()
    }
  } catch (error) {
    console.error('Failed to load storage data:', error)
    ElMessage.error('Failed to load storage locations')
  }
})

// Watch for changes in medicine details to load batches
watch(() => props.medicineDetails.id, async (newId) => {
  if (newId) {
    await loadBatches()
  }
})

// Load batches from the database
const loadBatches = async () => {
  if (!props.medicineDetails.id) return
  
  try {
    await pharmacyDrugStore.fetchBatches(props.medicineDetails.id)
    
    // Transform batches to match the expected format for the table
    const transformedBatches = drugBatches.value.map(batch => ({
      id: batch.id,
      batchNumber: batch.batch_number,
      price: batch.price,
      expiryDate: batch.expiry_date,
      quantity: batch.quantity || 0,
      locations: batch.batch_locations?.map(location => ({
        storageId: location.storage,
        storageName: location.storage_name,
        quantity: location.quantity
      })) || []
    }))
    
    // Update the modelValue to reflect the loaded batches
    emit('update:modelValue', transformedBatches)
    
  } catch (error) {
    console.error('Failed to load batches:', error)
    ElMessage.error('Failed to load existing batches')
  }
}

// Computed property to check if current batch number is duplicate
const isDuplicateBatch = computed(() => {
  if (!currentBatch.batchNumber) return false
  return isDuplicateBatchNumber(currentBatch.batchNumber, editingBatchIndex.value)
})

// Computed property to check if more storage locations can be added
const canAddMoreLocations = computed(() => {
  const usedStorageIds = currentBatch.locations
    .map(loc => loc.storageId)
    .filter(storageId => storageId !== null)
  
  return usedStorageIds.length < availableStorages.value.length
})

// Format number with thousands separators
const formatNumber = (num) => {
  if (!num && num !== 0) return ''
  return Number(num).toLocaleString()
}

// Remove formatting and get raw number
const parseFormattedNumber = (str) => {
  if (!str) return 0
  // Remove commas and any non-digit characters except decimal point
  const cleaned = str.replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

// Initialize formatted price from current batch
const initializeFormattedPrice = () => {
  if (currentBatch.price) {
    formattedPrice.value = formatNumber(currentBatch.price)
  }
}

// Handle price input with real-time formatting
const handlePriceInput = (value) => {
  // Remove formatting to get raw number
  const rawNumber = parseFormattedNumber(value)
  
  // Update the actual price in currentBatch
  currentBatch.price = rawNumber
  
  // Format the display value
  if (value && rawNumber > 0) {
    // Only format if there's a valid number
    const formatted = formatNumber(rawNumber)
    if (formatted !== value) {
      // Update the display value if it's different
      formattedPrice.value = formatted
    }
  }
  
  updateStock()
}

// Format price display on blur
const formatPriceDisplay = () => {
  if (currentBatch.price > 0) {
    formattedPrice.value = formatNumber(currentBatch.price)
  } else if (!formattedPrice.value) {
    formattedPrice.value = ''
  }
}

// Watch for changes in currentBatch.price to update formatted display
const updateFormattedPrice = () => {
  formattedPrice.value = currentBatch.price ? formatNumber(currentBatch.price) : ''
}

const updateStock = () => {
  emit('update:modelValue', props.modelValue)
}

const updateTotalQuantity = () => {
  currentBatch.quantity = currentBatch.locations.reduce((sum, location) => sum + (location.quantity || 0), 0)
}

const handleBatchInput = () => {
  // Check for non-English characters
  if (!isEnglishOnly(currentBatch.batchNumber)) {
    showKeyboardAlert()
    return
  }
  
  // Clear previous state
  batchExtracted.value = false
  
  // Clear existing timeout
  if (batchTimeout) {
    clearTimeout(batchTimeout)
  }
  
  // Set new timeout for debounced extraction
  batchTimeout = setTimeout(() => {
    const batchCode = currentBatch.batchNumber?.trim()
    if (batchCode && batchCode.length >= 48) { // Only extract if we have enough characters
      extractBatchInfo()
    }
  }, 800) // 800ms delay after user stops typing
}

const handleBatchPaste = () => {
  // Handle paste event - check for non-English characters first
  setTimeout(() => {
    if (!isEnglishOnly(currentBatch.batchNumber)) {
      showKeyboardAlert()
      return
    }
    
    const batchCode = currentBatch.batchNumber?.trim()
    if (batchCode && batchCode.length >= 48) {
      extractBatchInfo()
    }
  }, 100) // Short delay to ensure paste content is processed
}

// Function to check if text contains only English characters and numbers
const isEnglishOnly = (text) => {
  if (!text) return true
  // Allow only English letters (a-z, A-Z), numbers (0-9), and common symbols
  const englishOnlyRegex = /^[a-zA-Z0-9\s\-_.,;:!@#$%^&*()+=\[\]{}|\\<>?/~`'"]*$/
  return englishOnlyRegex.test(text)
}

// Function to show keyboard alert
const showKeyboardAlert = () => {
  ElMessage({
    type: 'warning',
    message: 'لطفا کیبورد را به حالت انگلیسی تغییر دهید',
    duration: 4000,
    showClose: true
  })
  
  // Clear the input to prevent format issues
  currentBatch.batchNumber = ''
}

const extractBatchInfo = () => {
  const batchCode = currentBatch.batchNumber?.trim()
  if (!batchCode || batchCode.length < 48) return

  isExtracting.value = true
  
  try {
    // Remove first 48 characters - remaining is the batch number
    const extractedBatchNumber = batchCode.substring(48)
    
    // Extract date from characters 41-46 (6 characters: YYMMDD)
    if (batchCode.length >= 46) {
      const dateString = batchCode.substring(40, 46) // 0-based indexing, so 40-45 for positions 41-46
      
      if (dateString.length === 6) {
        // Parse YYMMDD format
        const year = parseInt(dateString.substring(0, 2))
        const month = parseInt(dateString.substring(2, 4))
        const day = parseInt(dateString.substring(4, 6))
        
        // Validate date components
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          // Create date object using ISO format to avoid timezone issues
          const fullYear = 2000 + year
          const isoDateString = `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          const expiryDate = new Date(isoDateString + 'T00:00:00.000Z')
          
          // Update batch number and expiry date
          currentBatch.batchNumber = extractedBatchNumber
          currentBatch.expiryDate = expiryDate
          
          // Update formatted expiry date display
          const displayYear = fullYear
          const displayMonth = month.toString().padStart(2, '0')
          const displayDay = day.toString().padStart(2, '0')
          formattedExpiryDate.value = `${displayYear}/${displayMonth}/${displayDay}`
          
          batchExtracted.value = true
          
          ElMessage.success(`Batch extracted: ${extractedBatchNumber}, Expiry: ${formatDate(expiryDate)}`)
        } else {
          ElMessage.warning('Invalid date found in batch code')
          currentBatch.batchNumber = extractedBatchNumber
          batchExtracted.value = true
        }
      } else {
        // Just extract batch number without date
        currentBatch.batchNumber = extractedBatchNumber
        batchExtracted.value = true
        ElMessage.info(`Batch number extracted: ${extractedBatchNumber}`)
      }
    } else {
      // Code too short for date extraction
      currentBatch.batchNumber = extractedBatchNumber
      batchExtracted.value = true
      ElMessage.info(`Batch number extracted: ${extractedBatchNumber}`)
    }
    
  } catch (error) {
    console.error('Error extracting batch info:', error)
    ElMessage.error('Error extracting batch information')
    batchExtracted.value = false
  } finally {
    isExtracting.value = false
  }
}

const addNewLocation = () => {
  // Check if we can add more locations
  if (!canAddMoreLocations.value) {
    ElMessage({
      type: 'warning',
      message: 'All available storage locations have been used for this batch. Each storage location can only be used once per batch.',
      duration: 4000
    })
    return
  }
  
  // Find the first available storage location
  const usedStorageIds = currentBatch.locations
    .map(loc => loc.storageId)
    .filter(storageId => storageId !== null)
  
  const availableStorage = availableStorages.value.find(storage => 
    !usedStorageIds.includes(storage.id)
  )
  
  currentBatch.locations.push({
    storageId: availableStorage?.id || null,
    storageName: availableStorage?.name || '',
    quantity: 0
  })
}

const removeLocation = (index) => {
  currentBatch.locations.splice(index, 1)
  if (currentBatch.locations.length === 0) {
    addNewLocation()
  }
  updateTotalQuantity()
}

// Handle storage selection change
const handleStorageChange = (storageId, locationIndex) => {
  const selectedStorage = availableStorages.value.find(storage => storage.id === storageId)
  if (selectedStorage) {
    currentBatch.locations[locationIndex].storageId = storageId
    currentBatch.locations[locationIndex].storageName = selectedStorage.name
  }
  updateTotalQuantity()
}

// Check for duplicate batch numbers (excluding current editing batch)
const isDuplicateBatchNumber = (batchNumber, excludeIndex = -1) => {
  return props.modelValue.some((batch, index) => 
    index !== excludeIndex && 
    batch.batchNumber.toLowerCase() === batchNumber.toLowerCase()
  )
}

// Validate batch number for duplicates (with visual feedback)
const validateBatchNumber = () => {
  if (!currentBatch.batchNumber) return true
  
  // When editing, exclude the current batch being edited from duplicate check
  const isDuplicate = isDuplicateBatchNumber(currentBatch.batchNumber, editingBatchIndex.value)
  
  if (isDuplicate) {
    ElMessage({
      type: 'warning',
      message: `Batch number "${currentBatch.batchNumber}" already exists. Please use a unique batch number.`,
      duration: 3000
    })
    return false
  }
  
  return true
}

// Validate storage locations for duplicates
const validateStorageLocations = () => {
  const usedStorageIds = currentBatch.locations
    .map(loc => loc.storageId)
    .filter(storageId => storageId !== null)
  
  const uniqueStorageIds = [...new Set(usedStorageIds)]
  
  if (usedStorageIds.length !== uniqueStorageIds.length) {
    ElMessage({
      type: 'error',
      message: 'Duplicate storage locations detected. Each storage location can only be used once per batch.',
      duration: 4000
    })
    return false
  }
  
  // Check if all locations have a storage selected
  const emptyLocations = currentBatch.locations.filter(loc => !loc.storageId)
  if (emptyLocations.length > 0) {
    ElMessage({
      type: 'warning',
      message: 'Please select a storage location for all entries.',
      duration: 3000
    })
    return false
  }
  
  return true
}

const addNewBatchToTable = async () => {
  // If editing, save the current batch instead of adding new
  if (isEditing.value) {
    return await saveCurrentBatch()
  }
  
  if (!currentBatch.batchNumber) {
    ElMessage({
      type: 'warning',
      message: 'Please enter a batch number'
    })
    return
  }

  if (!currentBatch.price || currentBatch.price <= 0) {
    ElMessage({
      type: 'warning',
      message: 'Please enter a valid price'
    })
    return
  }

  if (!currentBatch.expiryDate) {
    ElMessage({
      type: 'warning',
      message: 'Please enter an expiry date'
    })
    return
  }

  // Check for duplicate batch numbers
  if (!validateBatchNumber()) {
    return
  }

  // Validate storage locations
  if (!validateStorageLocations()) {
    return
  }

  if (!currentBatch.locations.some(loc => loc.quantity > 0)) {
    ElMessage({
      type: 'warning',
      message: 'Please add at least one location with quantity'
    })
    return
  }

  if (!props.medicineDetails.id) {
    ElMessage({
      type: 'warning',
      message: 'Please save the medicine details first'
    })
    return
  }

  try {
    // Format expiry date to YYYY-MM-DD string
    let formattedExpiryDate = null
    if (currentBatch.expiryDate) {
      if (currentBatch.expiryDate instanceof Date) {
        // Convert Date object to YYYY-MM-DD string
        const year = currentBatch.expiryDate.getFullYear()
        const month = String(currentBatch.expiryDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentBatch.expiryDate.getDate()).padStart(2, '0')
        formattedExpiryDate = `${year}-${month}-${day}`
      } else {
        // Assume it's already a string, just ensure it's in the right format
        formattedExpiryDate = currentBatch.expiryDate
      }
    }

    // Prepare batch data for API
    const batchData = {
      drug: props.medicineDetails.id,
      batch_number: currentBatch.batchNumber,
      price: parseFloat(currentBatch.price) || 0,
      expiry_date: formattedExpiryDate,
      locations: currentBatch.locations
        .filter(loc => loc.storageId && loc.quantity > 0)
        .map(loc => ({
          storage: parseInt(loc.storageId), // Ensure storage ID is an integer
          quantity: parseInt(loc.quantity) || 0 // Ensure quantity is an integer
        }))
    }

    // Debug: Log the data being sent
    console.log('Sending batch data:', JSON.stringify(batchData, null, 2))

    // Save to database
    const savedBatch = await pharmacyDrugStore.createBatch(batchData)
    
    // Add to local table data
    const newBatchForTable = {
      id: savedBatch.id,
      batchNumber: currentBatch.batchNumber,
      price: currentBatch.price,
      expiryDate: currentBatch.expiryDate,
      quantity: currentBatch.quantity,
      locations: currentBatch.locations.filter(loc => loc.storageId && loc.quantity > 0)
    }

    const updatedBatches = [...props.modelValue, newBatchForTable]
    emit('update:modelValue', updatedBatches)

    // Reset form
    resetCurrentBatch()
    
    ElMessage.success('Batch saved successfully')
    
  } catch (error) {
    console.error('Error saving batch:', error)
    
    // Handle validation errors from backend
    if (error.response?.data) {
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
        ElMessage.error(errorData || 'Failed to save batch')
      }
    } else {
      ElMessage.error('Failed to save batch')
    }
  }
}

const editBatch = (index) => {
  // If already editing another batch, save it first or cancel the edit
  if (isEditing.value && editingBatchIndex.value !== index) {
    // Restore the form to show the current batch being edited
    ElMessage({
      type: 'warning',
      message: 'Please finish editing the current batch first, or cancel the edit.',
      duration: 3000
    })
    return
  }
  
  // Store original batch data for cancel functionality
  originalBatch.value = JSON.parse(JSON.stringify(props.modelValue[index]))
  
  // Copy batch data to current form
  const batchToEdit = props.modelValue[index]
  
  // Map the batch data to the current form structure
  Object.assign(currentBatch, {
    batchNumber: batchToEdit.batchNumber,
    price: batchToEdit.price,
    expiryDate: batchToEdit.expiryDate,
    quantity: batchToEdit.quantity,
    locations: batchToEdit.locations?.map(location => ({
      storageId: location.storageId,
      storageName: location.storageName,
      quantity: location.quantity
    })) || [
      {
        storageId: availableStorages.value[0]?.id || null,
        storageName: availableStorages.value[0]?.name || '',
        quantity: 0
      }
    ]
  })

  // Update formatted displays
  updateFormattedPrice()
  if (currentBatch.expiryDate) {
    const date = new Date(currentBatch.expiryDate)
    formattedExpiryDate.value = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
  }

  // Set editing state
  isEditing.value = true
  editingBatchIndex.value = index
  editingBatchId.value = batchToEdit.id

  // Don't remove the batch from the table - keep it visible with editing indicator
}

const saveCurrentBatch = async () => {
  if (!validateBatchNumber() || !validateStorageLocations()) {
    return
  }

  if (!currentBatch.price || currentBatch.price <= 0) {
    ElMessage({
      type: 'warning',
      message: 'Please enter a valid price'
    })
    return
  }

  if (!currentBatch.expiryDate) {
    ElMessage({
      type: 'warning',
      message: 'Please enter an expiry date'
    })
    return
  }

  if (!currentBatch.locations.some(loc => loc.quantity > 0)) {
    ElMessage({
      type: 'warning',
      message: 'Please add at least one location with quantity'
    })
    return
  }

  try {
    // Format expiry date to YYYY-MM-DD string
    let formattedExpiryDate = null
    if (currentBatch.expiryDate) {
      if (currentBatch.expiryDate instanceof Date) {
        // Convert Date object to YYYY-MM-DD string
        const year = currentBatch.expiryDate.getFullYear()
        const month = String(currentBatch.expiryDate.getMonth() + 1).padStart(2, '0')
        const day = String(currentBatch.expiryDate.getDate()).padStart(2, '0')
        formattedExpiryDate = `${year}-${month}-${day}`
      } else {
        // Assume it's already a string, just ensure it's in the right format
        formattedExpiryDate = currentBatch.expiryDate
      }
    }

    // Prepare batch data for API
    const batchData = {
      drug: props.medicineDetails.id,
      batch_number: currentBatch.batchNumber,
      price: parseFloat(currentBatch.price) || 0,
      expiry_date: formattedExpiryDate,
      locations: currentBatch.locations
        .filter(loc => loc.storageId && loc.quantity > 0)
        .map(loc => ({
          storage: parseInt(loc.storageId), // Ensure storage ID is an integer
          quantity: parseInt(loc.quantity) || 0 // Ensure quantity is an integer
        }))
    }

    // Debug: Log the data being sent
    console.log('Sending batch data:', JSON.stringify(batchData, null, 2))

    // Update in database
    const updatedBatch = await pharmacyDrugStore.updateBatch(editingBatchId.value, batchData)
    
    // Update local table data in place
    const updatedBatches = [...props.modelValue]
    updatedBatches[editingBatchIndex.value] = {
      id: updatedBatch.id,
      batchNumber: currentBatch.batchNumber,
      price: currentBatch.price,
      expiryDate: currentBatch.expiryDate,
      quantity: currentBatch.quantity,
      locations: currentBatch.locations.filter(loc => loc.storageId && loc.quantity > 0)
    }

    emit('update:modelValue', updatedBatches)

    // Reset editing state
    isEditing.value = false
    editingBatchIndex.value = -1
    editingBatchId.value = null
    originalBatch.value = null
    resetCurrentBatch()
    
    ElMessage.success('Batch updated successfully')
    
  } catch (error) {
    console.error('Error updating batch:', error)
    
    // Handle validation errors from backend
    if (error.response?.data) {
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
        ElMessage.error(errorData || 'Failed to update batch')
      }
    } else {
      ElMessage.error('Failed to update batch')
    }
  }
}

const removeBatch = async (index) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this batch? This action cannot be undone.',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const batchToDelete = props.modelValue[index]
    
    if (batchToDelete.id) {
      // Delete from database
      await pharmacyDrugStore.deleteBatch(batchToDelete.id)
    }

    // Remove from local table
    const updatedBatches = props.modelValue.filter((_, i) => i !== index)
    emit('update:modelValue', updatedBatches)
    
    ElMessage.success('Batch deleted successfully')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting batch:', error)
      ElMessage.error('Failed to delete batch')
    }
  }
}

const resetCurrentBatch = () => {
  Object.assign(currentBatch, {
    batchNumber: '',
    price: 0,
    expiryDate: '',
    quantity: 0,
    locations: [
      {
        storageId: availableStorages.value[0]?.id || null,
        storageName: availableStorages.value[0]?.name || '',
        quantity: 0
      }
    ]
  })
  
  formattedPrice.value = ''
  formattedExpiryDate.value = ''
  batchExtracted.value = false
}

const cancelEdit = () => {
  // Reset editing state without modifying the table since the batch is still there
  isEditing.value = false
  editingBatchIndex.value = -1
  editingBatchId.value = null
  originalBatch.value = null
  resetCurrentBatch()
  
  ElMessage.info('Edit cancelled')
}

const handleExpiryDateInput = (value) => {
  // Remove any non-digit characters except forward slashes
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  // Handle backspace - if user deletes a slash, also remove the preceding character
  if (formattedExpiryDate.value && value.length < formattedExpiryDate.value.length) {
    // User is deleting, don't auto-format
    formattedExpiryDate.value = cleanValue
    return
  }
  
  // Remove extra slashes (keep only the first two)
  const slashCount = (cleanValue.match(/\//g) || []).length
  if (slashCount > 2) {
    // Remove extra slashes from the end
    cleanValue = cleanValue.replace(/\/+$/, '')
    const parts = cleanValue.split('/')
    if (parts.length > 3) {
      cleanValue = parts.slice(0, 3).join('/')
    }
  }
  
  // Auto-format: add slashes after year (4 digits) and month (2 digits)
  if (cleanValue.length === 4 && !cleanValue.includes('/')) {
    // After typing 4 digits (year), add first slash
    cleanValue = cleanValue + '/'
  } else if (cleanValue.length === 7 && cleanValue.split('/').length === 2) {
    // After typing year/month (YYYY/MM), add second slash
    cleanValue = cleanValue + '/'
  }
  
  // Limit the total length to YYYY/MM/DD format (10 characters)
  if (cleanValue.length > 10) {
    cleanValue = cleanValue.substring(0, 10)
  }
  
  // Update the display value
  formattedExpiryDate.value = cleanValue
}

const validateAndFormatExpiryDate = () => {
  const dateStr = formattedExpiryDate.value?.trim()
  if (!dateStr) return

  // Try to parse YYYY/MM/DD format
  let parsedDate = null
  
  // Check if it's in the expected YYYY/MM/DD format
  const dateRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
  const match = dateStr.match(dateRegex)
  
  if (match) {
    const year = parseInt(match[1])
    const month = parseInt(match[2])
    const day = parseInt(match[3])
    
    // Validate date components
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Create date object
      const isoDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      parsedDate = new Date(isoDateString + 'T00:00:00.000Z')
      
      // Validate that the date is actually valid (handles cases like Feb 30)
      if (parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month - 1 && 
          parsedDate.getDate() === day) {
        
        // Update the formatted display to ensure consistent formatting
        formattedExpiryDate.value = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
        
        // Update the actual date in currentBatch
        currentBatch.expiryDate = parsedDate
      } else {
        ElMessage.warning('Invalid date. Please check the day is valid for the given month and year.')
        formattedExpiryDate.value = ''
        currentBatch.expiryDate = ''
      }
    } else {
      ElMessage.warning('Invalid date. Year must be 1900-2100, month 1-12, day 1-31.')
      formattedExpiryDate.value = ''
      currentBatch.expiryDate = ''
    }
  } else {
    // If the format doesn't match, check if it's incomplete
    if (dateStr.length < 10) {
      // Don't show error for incomplete dates, just wait for user to finish typing
      return
    } else {
      ElMessage.warning('Invalid date format. Please use YYYY/MM/DD format.')
      formattedExpiryDate.value = ''
      currentBatch.expiryDate = ''
    }
  }
}

// Initialize formatted expiry date when editing
const initializeFormattedExpiryDate = () => {
  if (currentBatch.expiryDate) {
    const date = new Date(currentBatch.expiryDate)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      formattedExpiryDate.value = `${year}/${month}/${day}`
    } else {
      formattedExpiryDate.value = ''
    }
  } else {
    formattedExpiryDate.value = ''
  }
}

// Cleanup timeout on component unmount
onBeforeUnmount(() => {
  if (batchTimeout) {
    clearTimeout(batchTimeout)
  }
})

const getAvailableStoragesForLocation = (locationIndex) => {
  const usedStorageIds = currentBatch.locations
    .map((loc, index) => index !== locationIndex ? loc.storageId : null)
    .filter(storageId => storageId !== null)
  
  return availableStorages.value.filter(storage => 
    !usedStorageIds.includes(storage.id)
  )
}
</script>

<style scoped>
.stock-form-card {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: white;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.stock-header h4 {
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

.stock-form-content {
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

.locations-group {
  flex: 1;
  min-width: 100%;
}

.locations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.locations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.location-select {
  flex: 2;
}

.quantity-input {
  flex: 1;
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

.help-text {
  display: block;
  font-size: 0.75rem;
  color: #909399;
  margin-top: 3px;
}

.batch-input-container {
  position: relative;
  width: 100%;
}

.batch-success-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
  font-size: 18px;
  z-index: 10;
}

.batch-error-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #f56c6c;
  font-size: 18px;
  z-index: 10;
}

.error-text {
  color: #f56c6c;
  font-size: 0.75rem;
  margin-top: 5px;
  display: block;
}

/* Duplicate batch input styling */
.duplicate-batch :deep(.el-input__inner) {
  border-color: #f56c6c !important;
  background-color: rgba(245, 108, 108, 0.05);
}

.duplicate-batch :deep(.el-input__inner):focus {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2) !important;
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

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-date-editor.el-input) {
  width: 100%;
}

/* Price input styling */
.price-input :deep(.el-input__inner) {
  font-family: var(--font-english);
  font-weight: 500;
}

.price-input :deep(.el-input__inner):focus {
  border-color: var(--primary-color);
  /* box-shadow: 0 0 0 2px rgba(75, 112, 226, 0.2); */
}

/* Price input placeholder */
.price-input :deep(.el-input__inner::placeholder) {
  color: #c0c4cc;
  font-weight: normal;
}

.expiry-date-input :deep(.el-input__inner) {
  font-family: var(--font-english);
  font-weight: 500;
}

.expiry-date-input :deep(.el-input__inner):focus {
  border-color: var(--primary-color);
  /* box-shadow: 0 0 0 2px rgba(75, 112, 226, 0.2); */
}

/* Expiry date input placeholder */
.expiry-date-input :deep(.el-input__inner::placeholder) {
  color: #c0c4cc;
  font-weight: normal;
}

/* No more locations warning */
.no-more-locations-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: rgba(230, 162, 60, 0.1);
  border: 1px solid #e6a23c;
  border-radius: 4px;
  color: #e6a23c;
  font-size: 0.85rem;
  margin-top: 10px;
}

.no-more-locations-warning .el-icon {
  font-size: 16px;
}

/* Editing batch highlight */
.editing-batch {
  font-weight: 600;
  color: var(--warning-color);
}

.operations-container {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style> 