<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Storages & Shelves Management"
    @close="$emit('close')"
  >
    <div class="storage-shelve-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">
          Storages & Shelves
          <span v-if="storageStore.pharmacyInfo" class="pharmacy-info">
            - {{ storageStore.pharmacyInfo.name }}
          </span>
        </h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
          :loading="storageStore.loading"
        >
          Add New Storage/Shelf
        </el-button>
      </div>

      <!-- Loading State -->
      <div v-if="storageStore.loading && storages.length === 0" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- Error State -->
      <div v-else-if="storageStore.error && storages.length === 0" class="error-container">
        <el-alert
          title="Failed to load storages"
          type="error"
          :description="storageStore.error"
          show-icon
          :closable="false">
        </el-alert>
        <div class="error-actions">
          <el-button @click="loadStorages" type="primary">Try Again</el-button>
        </div>
      </div>

      <!-- Data Table -->
      <data-table
        v-else
        :columns="columns"
        :items="storages"
        @edit="openForm"
        @delete="confirmDelete"
        :loading="storageStore.loading"
      >
        <template #type="{ item }">
          <el-tag :type="item.type === 'storage' ? 'primary' : 'success'" size="small">
            {{ item.type_display || item.type }}
          </el-tag>
        </template>
        <template #created_at="{ item }">
          <span>{{ formatDate(item.created_at) }}</span>
        </template>
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Storage/Shelf' : 'Add New Storage/Shelf' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Name -->
            <div class="form-group">
              <label class="form-label">Name *</label>
              <el-input
                v-model="form.name"
                placeholder="e.g., Main Storage, Shelf A1"
                required
                :disabled="formLoading"
              />
              <div v-if="formErrors.name" class="form-error">
                {{ formErrors.name }}
              </div>
            </div>

            <!-- Type -->
            <div class="form-group">
              <label class="form-label">Type *</label>
              <el-select
                v-model="form.type"
                placeholder="Select type"
                style="width: 100%"
                required
                :disabled="formLoading"
              >
                <el-option value="storage" label="Storage" />
                <el-option value="shelf" label="Shelf" />
              </el-select>
              <div v-if="formErrors.type" class="form-error">
                {{ formErrors.type }}
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">Description</label>
              <el-input
                v-model="form.description"
                type="textarea"
                rows="3"
                placeholder="Optional description"
                :disabled="formLoading"
              />
              <div v-if="formErrors.description" class="form-error">
                {{ formErrors.description }}
              </div>
            </div>

            <!-- General form errors -->
            <div v-if="formErrors.general" class="form-error general-error">
              {{ formErrors.general }}
            </div>

            <div class="form-actions">
              <el-button @click="closeForm" :disabled="formLoading">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                native-type="submit"
                :disabled="!isFormValid || formLoading"
                :loading="formLoading"
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
import { ref, computed, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import BaseModal from '../BaseModal.vue'
import DataTable from '../DataTable.vue'
import { useStorageStore } from '@/stores/storageStore'
import { formatDate } from '@/utils/dateUtils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])
const storageStore = useStorageStore()

// Table configuration
const columns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'created_at', label: 'Created' }
]

// Use store data
const storages = computed(() => storageStore.storages)

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const formLoading = ref(false)
const formErrors = ref({})
const form = ref({
  name: '',
  type: 'shelf',
  description: ''
})

// Computed properties
const isFormValid = computed(() => {
  return form.value.name && form.value.type
})

// Load storages on component mount
onMounted(async () => {
  await loadStorages()
})

// Methods
const loadStorages = async () => {
  try {
    await storageStore.fetchStorages()
  } catch (error) {
    console.error('Failed to load storages:', error)
  }
}

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  formErrors.value = {}
  
  if (item) {
    form.value = { 
      name: item.name,
      type: item.type,
      description: item.description || ''
    }
  } else {
    form.value = {
      name: '',
      type: 'shelf',
      description: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  formErrors.value = {}
  form.value = {
    name: '',
    type: 'shelf',
    description: ''
  }
}

const saveItem = async () => {
  if (!isFormValid.value) return

  formLoading.value = true
  formErrors.value = {}

  try {
    const storageData = { ...form.value }

    if (editingItem.value) {
      // Update existing item
      await storageStore.updateStorage(editingItem.value.id, storageData)
    } else {
      // Add new item
      await storageStore.addStorage(storageData)
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving storage:', error)
    
    // Handle validation errors
    if (error.response?.data) {
      const errorData = error.response.data
      
      // Handle field-specific errors
      Object.keys(errorData).forEach(field => {
        if (Array.isArray(errorData[field])) {
          formErrors.value[field] = errorData[field][0]
        } else if (typeof errorData[field] === 'string') {
          formErrors.value[field] = errorData[field]
        }
      })
      
      // Handle general errors
      if (errorData.detail) {
        formErrors.value.general = errorData.detail
      }
    } else {
      formErrors.value.general = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    await storageStore.deleteStorage(item.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting storage:', error)
    }
  }
}
</script>

<style scoped>
.storage-shelve-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.pharmacy-info {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  margin-left: 0.5rem;
}

/* Form Modal */
.form-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  backdrop-filter: blur(3px);
}

.form-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 750px;
  overflow-y: auto;
  border: 1px solid rgba(235, 238, 245, 0.5);
}

.form-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.form-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.form-close-button {
  font-size: 1.125rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.form-close-button:hover {
  color: #1e293b;
  background-color: #e2e8f0;
}

.form-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  margin-top: 1rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
}

.error-actions {
  margin-top: 1rem;
}
</style> 