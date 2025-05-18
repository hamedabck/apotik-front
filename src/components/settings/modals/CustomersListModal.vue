<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Customers List"
    @close="$emit('close')"
  >
    <div class="customers-list-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Customers</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Customer
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="displayColumns"
        :items="customers"
        @edit="openForm"
        @delete="confirmDelete"
      >
        <template #gender="{ item }">
          {{ formatGender(item.gender) }}
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
                  <label class="form-label">Full Name</label>
                  <el-input
                    v-model="form.name"
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">ID Number</label>
                  <el-input
                    v-model="form.idNumber"
                    placeholder="e.g., 3173092509900001"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <el-select
                    v-model="form.gender"
                    placeholder="Select gender"
                    style="width: 100%"
                  >
                    <el-option value="male" label="Male" />
                    <el-option value="female" label="Female" />
                    <el-option value="other" label="Other" />
                  </el-select>
                </div>

                <div class="form-group">
                  <label class="form-label">Birthdate</label>
                  <el-date-picker
                    v-model="form.birthdate"
                    type="date"
                    placeholder="Select date"
                    style="width: 100%"
                  />
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
                    placeholder="e.g., +62 812 3456 7890"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Email</label>
                  <el-input
                    v-model="form.email"
                    placeholder="e.g., john.smith@example.com"
                    type="email"
                  />
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
                    v-model="form.insuranceId"
                    placeholder="e.g., BPJS-12345678"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Insurance Expiry Date</label>
                  <el-date-picker
                    v-model="form.insuranceExpiryDate"
                    type="date"
                    placeholder="Select date"
                    style="width: 100%"
                  />
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
                />
              </div>
            </div>

            <div class="form-actions">
              <el-button @click="closeForm">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                native-type="submit"
                :disabled="!isFormValid"
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
import { ref, computed } from 'vue'
import BaseModal from '../BaseModal.vue'
import DataTable from '../DataTable.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Table configuration - all available columns
const allColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'idNumber', label: 'ID Number' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'birthdate', label: 'Birthdate' },
  { key: 'insuranceId', label: 'Insurance ID' },
  { key: 'insuranceExpiryDate', label: 'Insurance Expiry' }
]

// Columns to actually display (subset for compactness)
const displayColumns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'idNumber', label: 'ID Number' }
]

// Dummy data
const customers = ref([
  {
    id: 1,
    name: 'Budi Santoso',
    idNumber: '3173092509900001',
    phone: '+62 812 3456 7890',
    insuranceId: 'BPJS-12345678',
    insuranceExpiryDate: '2025-12-31',
    gender: 'male',
    birthdate: '1990-09-25',
    email: 'budi.santoso@example.com',
    notes: ''
  },
  {
    id: 2,
    name: 'Dewi Lestari',
    idNumber: '3173096005950002',
    phone: '+62 812 9876 5432',
    insuranceId: 'BPJS-87654321',
    insuranceExpiryDate: '2024-10-15',
    gender: 'female',
    birthdate: '1995-05-20',
    email: 'dewi.lestari@example.com',
    notes: 'Allergic to penicillin'
  }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  idNumber: '',
  phone: '',
  insuranceId: '',
  insuranceExpiryDate: '',
  gender: '',
  birthdate: '',
  email: '',
  notes: ''
})

// Computed properties
const isFormValid = computed(() => {
  return form.value.name
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      name: '',
      idNumber: '',
      phone: '',
      insuranceId: '',
      insuranceExpiryDate: '',
      gender: '',
      birthdate: '',
      email: '',
      notes: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    name: '',
    idNumber: '',
    phone: '',
    insuranceId: '',
    insuranceExpiryDate: '',
    gender: '',
    birthdate: '',
    email: '',
    notes: ''
  }
}

const saveItem = () => {
  if (!isFormValid.value) return

  const customerData = { ...form.value }

  if (editingItem.value) {
    // Update existing item
    const index = customers.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      customers.value[index] = {
        ...customers.value[index],
        ...customerData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...customers.value.map(item => item.id), 0) + 1
    customers.value.push({
      id: newId,
      ...customerData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this customer?')) {
    customers.value = customers.value.filter(i => i.id !== item.id)
  }
}

const formatGender = (gender) => {
  if (gender === 'male') return 'Male'
  if (gender === 'female') return 'Female'
  if (gender === 'other') return 'Other'
  return ''
}
</script>

<style scoped>
.customers-list-container {
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
  display: flex;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
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
  position: sticky;
  bottom: 0;
  background-color: white;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
}
</style> 