<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Distribution Companies Management"
    @close="$emit('close')"
  >
    <div class="distribution-companies-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">
          Distribution Companies
          <span v-if="distributionCompanyStore.pharmacyInfo" class="pharmacy-info">
            - {{ distributionCompanyStore.pharmacyInfo.name }}
          </span>
        </h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
          :loading="distributionCompanyStore.loading"
        >
          Add New Company
        </el-button>
      </div>

      <!-- Loading State -->
      <div v-if="distributionCompanyStore.loading && companies.length === 0" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- Error State -->
      <div v-else-if="distributionCompanyStore.error && companies.length === 0" class="error-container">
        <el-alert
          title="Failed to load distribution companies"
          type="error"
          :description="distributionCompanyStore.error"
          show-icon
          :closable="false">
        </el-alert>
        <div class="error-actions">
          <el-button @click="loadCompanies" type="primary">Try Again</el-button>
        </div>
      </div>

      <!-- Data Table -->
      <data-table
        v-else
        :columns="columns"
        :items="companies"
        @edit="openForm"
        @delete="confirmDelete"
        :loading="distributionCompanyStore.loading"
      >
        <template #created_at="{ item }">
          <span>{{ formatDate(item.created_at) }}</span>
        </template>
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Distribution Company' : 'Add New Distribution Company' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Company Name -->
            <div class="form-group">
              <label class="form-label">Company Name *</label>
              <el-input
                v-model="form.name"
                placeholder="e.g., Kimia Farma Distribution"
                required
                :disabled="formLoading"
              />
              <div v-if="formErrors.name" class="form-error">
                {{ formErrors.name }}
              </div>
            </div>

            <!-- Contact Person -->
            <div class="form-group">
              <label class="form-label">Contact Person</label>
              <el-input
                v-model="form.contact_person"
                placeholder="e.g., John Smith"
                :disabled="formLoading"
              />
              <div v-if="formErrors.contact_person" class="form-error">
                {{ formErrors.contact_person }}
              </div>
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label class="form-label">Phone</label>
              <el-input
                v-model="form.phone"
                placeholder="e.g., +62 21 1234567"
                :disabled="formLoading"
              />
              <div v-if="formErrors.phone" class="form-error">
                {{ formErrors.phone }}
              </div>
            </div>

            <!-- Address -->
            <div class="form-group">
              <label class="form-label">Address</label>
              <el-input
                v-model="form.address"
                type="textarea"
                rows="3"
                placeholder="Company address"
                :disabled="formLoading"
              />
              <div v-if="formErrors.address" class="form-error">
                {{ formErrors.address }}
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
import { useDistributionCompanyStore } from '@/stores/distributionCompanyStore'
import { formatDate } from '@/utils/dateUtils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])
const distributionCompanyStore = useDistributionCompanyStore()

// Table configuration
const columns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'name', label: 'Company Name' },
  { key: 'contact_person', label: 'Contact Person' },
  { key: 'phone', label: 'Phone' },
  { key: 'created_at', label: 'Created' }
]

// Use store data
const companies = computed(() => distributionCompanyStore.companies)

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const formLoading = ref(false)
const formErrors = ref({})
const form = ref({
  name: '',
  contact_person: '',
  phone: '',
  address: ''
})

// Computed properties
const isFormValid = computed(() => {
  return form.value.name && form.value.name.trim()
})

// Load companies on component mount
onMounted(async () => {
  await loadCompanies()
})

// Methods
const loadCompanies = async () => {
  try {
    await distributionCompanyStore.fetchCompanies()
  } catch (error) {
    console.error('Failed to load distribution companies:', error)
  }
}

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  formErrors.value = {}
  
  if (item) {
    form.value = { 
      name: item.name,
      contact_person: item.contact_person || '',
      phone: item.phone || '',
      address: item.address || ''
    }
  } else {
    form.value = {
      name: '',
      contact_person: '',
      phone: '',
      address: ''
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
    contact_person: '',
    phone: '',
    address: ''
  }
}

const saveItem = async () => {
  if (!isFormValid.value) return

  formLoading.value = true
  formErrors.value = {}

  try {
    const companyData = { ...form.value }

    if (editingItem.value) {
      // Update existing item
      await distributionCompanyStore.updateCompany(editingItem.value.id, companyData)
    } else {
      // Add new item
      await distributionCompanyStore.addCompany(companyData)
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving distribution company:', error)
    
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
    
    await distributionCompanyStore.deleteCompany(item.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting distribution company:', error)
    }
  }
}
</script>

<style scoped>
.distribution-companies-container {
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