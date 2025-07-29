<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Customers List"
    @close="$emit('close')"
  >
    <div class="customers-list-container">
      <!-- Loading State -->
      <div v-if="customerStore.isLoading" class="loading-container">
        <el-loading-spinner />
        <p>Loading customers...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="customerStore.hasError" class="error-container">
        <el-alert
          :title="customerStore.error"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button @click="loadCustomers" type="primary" style="margin-top: 1rem;">
          Retry
        </el-button>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Add New Button -->
        <div class="action-header">
          <h3 class="section-title">Customers</h3>
          <el-button 
            type="primary" 
            icon="el-icon-plus"
            @click="openForm()"
            :disabled="customerStore.isLoading"
          >
            Add New Customer
          </el-button>
        </div>

        <!-- Data Table -->
        <data-table
          :columns="displayColumns"
          :items="customerStore.customers"
          @edit="openForm"
          @delete="confirmDelete"
        >
          <template #gender="{ item }">
            {{ formatGender(item.gender) }}
          </template>
          <template #birthdate="{ item }">
            <span class="jalali-date">
              {{ item.birthdate ? customerStore.formatBirthdateJalali(item.birthdate) : '' }}
            </span>
          </template>
          <template #insurance_expiry_date="{ item }">
            <span class="jalali-date" :class="{ 'expired-insurance': customerStore.isInsuranceExpired(item.insurance_expiry_date) }">
              {{ item.insurance_expiry_date ? customerStore.formatBirthdateJalali(item.insurance_expiry_date) : '' }}
            </span>
          </template>
          <template #created_at="{ item }">
            {{ formatDate(item.created_at) }}
          </template>
        </data-table>

        <!-- Form Modal -->
        <div v-if="showForm" class="form-modal-overlay">
          <div class="form-modal">
            <div class="form-modal-header">
              <h3 class="form-modal-title">
                {{ editingItem ? 'Edit Customer' : 'Add New Customer' }}
              </h3>
              <button class="form-close-button" @click="closeForm">
                <i class="el-icon-close"></i>
              </button>
            </div>
            
            <form @submit.prevent="saveItem" class="form-content">
              <!-- Basic Information -->
              <div class="form-section">
                <h4 class="form-section-title">Basic Information</h4>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <el-input
                      v-model="form.name"
                      placeholder="e.g., John Smith"
                      :class="{ 'error': formErrors.name }"
                    />
                    <p v-if="formErrors.name" class="form-error">
                      {{ formErrors.name }}
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">ID Number</label>
                    <el-input
                      v-model="form.id_number"
                      placeholder="e.g., 3173092509900001"
                      :class="{ 'error': formErrors.id_number }"
                    />
                    <p v-if="formErrors.id_number" class="form-error">
                      {{ formErrors.id_number }}
                    </p>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Gender</label>
                    <el-select
                      v-model="form.gender"
                      placeholder="Select gender"
                      style="width: 100%"
                      :class="{ 'error': formErrors.gender }"
                    >
                      <el-option value="male" label="Male" />
                      <el-option value="female" label="Female" />
                    </el-select>
                    <p v-if="formErrors.gender" class="form-error">
                      {{ formErrors.gender }}
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Birthdate</label>
                    <el-input
                      v-model="form.birthdate_jalali"
                      placeholder="e.g., 1370/05/15"
                      @input="handleJalaliDateInput"
                      @keypress="handleJalaliKeypress"
                      :class="{ 
                        'error': formErrors.birthdate,
                        'success': form.birthdate_jalali && !formErrors.birthdate && form.birthdate_jalali.length === 10
                      }"
                      maxlength="10"
                      dir="ltr"
                    >
                      <template #prefix>
                        <i class="el-icon-calendar" style="color: #059669;"></i>
                      </template>
                      <template #suffix v-if="form.birthdate_jalali && !formErrors.birthdate && form.birthdate_jalali.length === 10">
                        <i class="el-icon-check" style="color: #059669;"></i>
                      </template>
                    </el-input>
                    <p v-if="formErrors.birthdate" class="form-error">
                      {{ formErrors.birthdate }}
                    </p>
                    <p v-else-if="form.birthdate_jalali && form.birthdate_jalali.length === 10" class="form-success">
                      ✓ Valid Persian date
                    </p>
                    <p v-else class="form-help">
                      Format: (Persian Calendar)
                    </p>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div class="form-section">
                <h4 class="form-section-title">Contact Information</h4>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <el-input
                      v-model="form.phone"
                      placeholder="e.g., 09123456789"
                      :class="{ 'error': formErrors.phone }"
                    />
                    <p v-if="formErrors.phone" class="form-error">
                      {{ formErrors.phone }}
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <el-input
                      v-model="form.email"
                      placeholder="e.g., john.smith@example.com"
                      type="email"
                      :class="{ 'error': formErrors.email }"
                    />
                    <p v-if="formErrors.email" class="form-error">
                      {{ formErrors.email }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Insurance Information -->
              <div class="form-section">
                <h4 class="form-section-title">Insurance Information</h4>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Insurance ID</label>
                    <el-input
                      v-model="form.insurance_id"
                      placeholder="e.g., BPJS-12345678"
                      :class="{ 'error': formErrors.insurance_id }"
                    />
                    <p v-if="formErrors.insurance_id" class="form-error">
                      {{ formErrors.insurance_id }}
                    </p>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Insurance Expiry Date</label>
                    <el-input
                      v-model="form.insurance_expiry_date_jalali"
                      placeholder="e.g., 1405/12/29"
                      @input="handleInsuranceExpiryDateInput"
                      @keypress="handleJalaliKeypress"
                      :class="{ 
                        'error': formErrors.insurance_expiry_date,
                        'success': form.insurance_expiry_date_jalali && !formErrors.insurance_expiry_date && form.insurance_expiry_date_jalali.length === 10
                      }"
                      maxlength="10"
                      dir="ltr"
                    >
                      <template #prefix>
                        <i class="el-icon-calendar" style="color: #059669;"></i>
                      </template>
                      <template #suffix v-if="form.insurance_expiry_date_jalali && !formErrors.insurance_expiry_date && form.insurance_expiry_date_jalali.length === 10">
                        <i class="el-icon-check" style="color: #059669;"></i>
                      </template>
                    </el-input>
                    <p v-if="formErrors.insurance_expiry_date" class="form-error">
                      {{ formErrors.insurance_expiry_date }}
                    </p>
                    <p v-else-if="form.insurance_expiry_date_jalali && form.insurance_expiry_date_jalali.length === 10" class="form-success">
                      ✓ Valid Persian date
                    </p>
                    <p v-else class="form-help">
                      Format: (Persian Calendar) 
                    </p>
                  </div>
                </div>
              </div>

              <!-- Additional Information -->
              <div class="form-section">
                <h4 class="form-section-title">Additional Information</h4>
                
                <div class="form-group">
                  <label class="form-label">Notes</label>
                  <el-input
                    v-model="form.notes"
                    type="textarea"
                    rows="3"
                    placeholder="Add any additional notes about the customer"
                    :class="{ 'error': formErrors.notes }"
                  />
                  <p v-if="formErrors.notes" class="form-error">
                    {{ formErrors.notes }}
                  </p>
                </div>
              </div>

              <div class="form-actions">
                <el-button @click="closeForm" :disabled="customerStore.isLoading">
                  Cancel
                </el-button>
                <el-button 
                  type="primary" 
                  native-type="submit"
                  :disabled="!isFormValid || customerStore.isLoading"
                  :loading="customerStore.isLoading"
                >
                  {{ editingItem ? 'Update' : 'Save' }}
                </el-button>
              </div>
            </form>
          </div>
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
import { useCustomerStore } from '@/stores/customerStore'
import { formatDate } from '@/utils/dateUtils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Store
const customerStore = useCustomerStore()

// Table configuration - all available columns
const allColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'id_number', label: 'ID Number' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'birthdate', label: 'Birthdate' },
  { key: 'insurance_id', label: 'Insurance ID' },
  { key: 'insurance_expiry_date', label: 'Insurance Expiry' },
  { key: 'created_at', label: 'Created' }
]

// Columns to actually display (subset for compactness)
const displayColumns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'name', label: 'Name', width: '350' },
  // { key: 'gender', label: 'Gender' },
  // { key: 'id_number', label: 'ID Number' },
  { key: 'phone', label: 'Phone' },
  // { key: 'birthdate', label: 'Birthdate (Persian)' },
  { key: 'insurance_expiry_date', label: 'Insurance Expiry', width: '150' },
  // { key: 'created_at', label: 'Created' }
]

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  id_number: '',
  phone: '',
  insurance_id: '',
  insurance_expiry_date_jalali: '',
  gender: '',
  birthdate_jalali: '',
  email: '',
  notes: ''
})

// Form validation
const formErrors = ref({})

// Computed properties
const isFormValid = computed(() => {
  const validation = customerStore.validateCustomer(form.value)
  formErrors.value = validation.errors
  
  // Validate Jalali birthdate
  if (form.value.birthdate_jalali) {
    const jalaliValidation = customerStore.validateJalaliBirthdate(form.value.birthdate_jalali)
    if (!jalaliValidation.isValid) {
      formErrors.value.birthdate = jalaliValidation.error
    }
  }
  
  // Validate Jalali insurance expiry date
  if (form.value.insurance_expiry_date_jalali) {
    const jalaliValidation = customerStore.validateJalaliBirthdate(form.value.insurance_expiry_date_jalali)
    if (!jalaliValidation.isValid) {
      formErrors.value.insurance_expiry_date = jalaliValidation.error
    }
  }
  
  // Check for duplicate ID number
  if (form.value.id_number && customerStore.isIdNumberExists(form.value.id_number, editingItem.value?.id)) {
    formErrors.value.id_number = 'ID number already exists'
  }
  
  return validation.isValid && !formErrors.value.id_number && !formErrors.value.birthdate && !formErrors.value.insurance_expiry_date
})

// Handle Jalali date input formatting
const handleJalaliDateInput = () => {
  // Auto-format with slashes as user types
  form.value.birthdate_jalali = customerStore.formatJalaliInput(form.value.birthdate_jalali)
  
  // Real-time validation
  if (form.value.birthdate_jalali && form.value.birthdate_jalali.length >= 4) {
    const validation = customerStore.validateJalaliBirthdate(form.value.birthdate_jalali)
    if (!validation.isValid) {
      formErrors.value.birthdate = validation.error
    } else {
      // Clear error if validation passes
      delete formErrors.value.birthdate
    }
  } else {
    // Clear error when field is empty or too short
    delete formErrors.value.birthdate
  }
}

// Handle insurance expiry date input formatting
const handleInsuranceExpiryDateInput = () => {
  // Auto-format with slashes as user types
  form.value.insurance_expiry_date_jalali = customerStore.formatJalaliInput(form.value.insurance_expiry_date_jalali)
  
  // Real-time validation
  if (form.value.insurance_expiry_date_jalali && form.value.insurance_expiry_date_jalali.length >= 4) {
    const validation = customerStore.validateJalaliBirthdate(form.value.insurance_expiry_date_jalali)
    if (!validation.isValid) {
      formErrors.value.insurance_expiry_date = validation.error
    } else {
      // Clear error if validation passes
      delete formErrors.value.insurance_expiry_date
    }
  } else {
    // Clear error when field is empty or too short
    delete formErrors.value.insurance_expiry_date
  }
}

// Handle keypress for Jalali date inputs (restrict to numbers only)
const handleJalaliKeypress = (event) => {
  // Allow: backspace, delete, tab, escape, enter
  if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true)) {
    return
  }
  
  // Ensure that it is a number and stop the keypress
  if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
    event.preventDefault()
  }
}

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = {
      name: item.name,
      id_number: item.id_number || '',
      phone: item.phone || '',
      insurance_id: item.insurance_id || '',
      insurance_expiry_date_jalali: item.insurance_expiry_date ? customerStore.formatBirthdateJalali(item.insurance_expiry_date) : '',
      gender: item.gender || '',
      birthdate_jalali: item.birthdate ? customerStore.formatBirthdateJalali(item.birthdate) : '',
      email: item.email || '',
      notes: item.notes || ''
    }
  } else {
    form.value = {
      name: '',
      id_number: '',
      phone: '',
      insurance_id: '',
      insurance_expiry_date_jalali: '',
      gender: '',
      birthdate_jalali: '',
      email: '',
      notes: ''
    }
  }
  formErrors.value = {}
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    name: '',
    id_number: '',
    phone: '',
    insurance_id: '',
    insurance_expiry_date_jalali: '',
    gender: '',
    birthdate_jalali: '',
    email: '',
    notes: ''
  }
  formErrors.value = {}
}

const saveItem = async () => {
  if (!isFormValid.value) return

  try {
    // Convert Jalali birthdate to Gregorian for backend
    let gregorianBirthdate = null
    if (form.value.birthdate_jalali && form.value.birthdate_jalali.trim()) {
      gregorianBirthdate = customerStore.jalaliToGregorianBirthdate(form.value.birthdate_jalali)
      if (!gregorianBirthdate) {
        formErrors.value.birthdate = 'Invalid birthdate format'
        return
      }
    }

    // Convert Jalali insurance expiry date to Gregorian for backend
    let gregorianInsuranceExpiryDate = null
    if (form.value.insurance_expiry_date_jalali && form.value.insurance_expiry_date_jalali.trim()) {
      gregorianInsuranceExpiryDate = customerStore.jalaliToGregorianBirthdate(form.value.insurance_expiry_date_jalali)
      if (!gregorianInsuranceExpiryDate) {
        formErrors.value.insurance_expiry_date = 'Invalid insurance expiry date format'
        return
      }
    }

    const customerData = {
      name: form.value.name.trim(),
      id_number: form.value.id_number.trim() || null,
      phone: form.value.phone.trim() || null,
      email: form.value.email.trim() || null,
      gender: form.value.gender || null,
      birthdate: gregorianBirthdate, // Send Gregorian date to backend
      insurance_id: form.value.insurance_id.trim() || null,
      insurance_expiry_date: gregorianInsuranceExpiryDate, // Send Gregorian date to backend
      notes: form.value.notes.trim() || null
    }

    if (editingItem.value) {
      await customerStore.updateCustomer(editingItem.value.id, customerData)
      ElMessage.success('Customer updated successfully!')
    } else {
      await customerStore.createCustomer(customerData)
      ElMessage.success('Customer created successfully!')
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving customer:', error)
    
    // Handle validation errors from backend
    if (error.response?.data) {
      const backendErrors = error.response.data
      if (typeof backendErrors === 'object') {
        formErrors.value = { ...formErrors.value, ...backendErrors }
      } else {
        ElMessage.error(backendErrors.detail || 'Failed to save customer')
      }
    } else {
      ElMessage.error('Failed to save customer')
    }
  }
}

const confirmDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the customer "${item.name}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await customerStore.deleteCustomer(item.id)
    ElMessage.success('Customer deleted successfully!')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting customer:', error)
      ElMessage.error('Failed to delete customer')
    }
  }
}

const formatGender = (gender) => {
  if (gender === 'male') return 'Male'
  if (gender === 'female') return 'Female'
  if (gender === 'other') return 'Other'
  return ''
}

// Load data
const loadCustomers = async () => {
  try {
    await customerStore.fetchCustomers()
  } catch (error) {
    console.error('Error loading customers:', error)
  }
}

// Watch for modal open/close
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadCustomers()
  }
})

// Load data on mount
onMounted(() => {
  if (props.modelValue) {
    loadCustomers()
  }
})
</script>

<style scoped>
.customers-list-container {
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

.expired-insurance {
  color: rgb(30, 41, 59) !important;
  font-weight: 500;
}

.jalali-date {
  font-family: var(--font-persian);
  direction: ltr;
  color: #059669;
  font-weight: 500;
}

.jalali-date.expired-insurance {
  color: rgb(30, 41, 59) !important;
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
  max-height: 90vh;
  border: 1px solid rgba(235, 238, 245, 0.5);
}

.form-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 1;
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
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.form-close-button:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.form-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.form-help {
  margin-top: 0.375rem;
  color: #059669;
  font-size: 0.75rem;
  font-style: italic;
}

.form-success {
  margin-top: 0.375rem;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.error :deep(.el-input__inner),
.error :deep(.el-select__wrapper),
.error :deep(.el-date-editor.el-input) {
  border-color: #e11d48;
}


@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-modal {
    width: 95%;
    max-height: 95vh;
  }
}
</style> 