<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Card Reader Management"
    @close="$emit('close')"
  >
    <div class="card-reader-container">
      <!-- Loading State -->
      <div v-if="cardReaderStore.isLoading" class="loading-container">
        <el-loading-spinner />
        <p>Loading card readers...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="cardReaderStore.hasError" class="error-container">
        <el-alert
          :title="cardReaderStore.error"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button @click="loadCardReaders" type="primary" style="margin-top: 1rem;">
          Retry
        </el-button>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Add New Button -->
        <div class="action-header">
          <h3 class="section-title">Card Readers</h3>
          <el-button 
            type="primary" 
            icon="el-icon-plus"
            @click="openForm()"
            :disabled="cardReaderStore.isLoading"
          >
            Add New Card Reader
          </el-button>
        </div>

        <!-- Data Table or Form -->
        <div v-if="!showForm">
          <!-- Data Table -->
          <data-table
            :columns="columns"
            :items="cardReaderStore.cardReaders"
            @edit="openForm"
            @delete="confirmDelete"
          >
            <template #created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>
          </data-table>
        </div>
        
        <!-- Form Panel -->
        <div v-else class="form-panel">
          <div class="form-panel-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Card Reader' : 'Add New Card Reader' }}
            </h3>
            <button class="close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Model -->
            <div class="form-group">
              <label class="form-label">Model *</label>
              <el-input
                v-model="form.model"
                placeholder="e.g., VeriFone VX520"
                :class="{ 'error': formErrors.model }"
              />
              <p v-if="formErrors.model" class="form-error">
                {{ formErrors.model }}
              </p>
            </div>

            <!-- Serial Number -->
            <div class="form-group">
              <label class="form-label">Serial Number *</label>
              <el-input
                v-model="form.serial_number"
                placeholder="e.g., CR-12345678"
                :class="{ 'error': formErrors.serial_number }"
              />
              <p v-if="formErrors.serial_number" class="form-error">
                {{ formErrors.serial_number }}
              </p>
            </div>
            
            <!-- Location -->
            <div class="form-group">
              <label class="form-label">Location</label>
              <el-input
                v-model="form.location"
                placeholder="e.g., Checkout Counter 1"
                :class="{ 'error': formErrors.location }"
              />
              <p v-if="formErrors.location" class="form-error">
                {{ formErrors.location }}
              </p>
            </div>

            <div class="form-actions">
              <el-button @click="closeForm" :disabled="cardReaderStore.isLoading">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                native-type="submit"
                :disabled="!isFormValid || cardReaderStore.isLoading"
                :loading="cardReaderStore.isLoading"
              >
                {{ editingItem ? 'Update' : 'Save' }}
              </el-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </base-modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import BaseModal from '../BaseModal.vue'
import DataTable from '../DataTable.vue'
import { useCardReaderStore } from '@/stores/cardReaderStore'
import { formatDate } from '@/utils/dateUtils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Store
const cardReaderStore = useCardReaderStore()

// Table configuration
const columns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'model', label: 'Model' },
  { key: 'serial_number', label: 'Serial Number' },
  { key: 'location', label: 'Location' },
  { key: 'created_at', label: 'Created' }
]

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  model: '',
  serial_number: '',
  location: ''
})

// Form validation
const formErrors = ref({})

// Computed properties
const isFormValid = computed(() => {
  const validation = cardReaderStore.validateCardReader(form.value)
  formErrors.value = validation.errors
  
  // Check for duplicate serial number
  if (cardReaderStore.isSerialNumberExists(form.value.serial_number, editingItem.value?.id)) {
    formErrors.value.serial_number = 'Serial number already exists'
  }
  
  return validation.isValid && !formErrors.value.serial_number
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = {
      model: item.model,
      serial_number: item.serial_number,
      location: item.location || ''
    }
  } else {
    form.value = {
      model: '',
      serial_number: '',
      location: ''
    }
  }
  formErrors.value = {}
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    model: '',
    serial_number: '',
    location: ''
  }
  formErrors.value = {}
}

const saveItem = async () => {
  if (!isFormValid.value) return

  try {
    const readerData = {
      model: form.value.model.trim(),
      serial_number: form.value.serial_number.trim(),
      location: form.value.location.trim() || null
    }

    if (editingItem.value) {
      await cardReaderStore.updateCardReader(editingItem.value.id, readerData)
      ElMessage.success('Card reader updated successfully!')
    } else {
      await cardReaderStore.createCardReader(readerData)
      ElMessage.success('Card reader created successfully!')
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving card reader:', error)
    
    // Handle validation errors from backend
    if (error.response?.data) {
      const backendErrors = error.response.data
      if (typeof backendErrors === 'object') {
        formErrors.value = { ...formErrors.value, ...backendErrors }
      } else {
        ElMessage.error(backendErrors.detail || 'Failed to save card reader')
      }
    } else {
      ElMessage.error('Failed to save card reader')
    }
  }
}

const confirmDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the card reader "${item.model} (${item.serial_number})"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await cardReaderStore.deleteCardReader(item.id)
    ElMessage.success('Card reader deleted successfully!')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting card reader:', error)
      ElMessage.error('Failed to delete card reader')
    }
  }
}

// Load data
const loadCardReaders = async () => {
  try {
    await cardReaderStore.fetchCardReaders()
  } catch (error) {
    console.error('Error loading card readers:', error)
  }
}

// Watch for modal open/close
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadCardReaders()
  }
})

// Load data on mount
onMounted(() => {
  if (props.modelValue) {
    loadCardReaders()
  }
})
</script>

<style scoped>
.card-reader-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.error-container {
  padding: 1rem;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

/* Form Panel */
.form-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.form-panel-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
}

.form-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.form-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: white;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.form-error {
  margin-top: 0.375rem;
  color: #e11d48;
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.error :deep(.el-input__inner) {
  border-color: #e11d48;
}
</style> 