<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Distribution Companies"
    @close="$emit('close')"
  >
    <div class="distribution-companies-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Distribution Companies</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Company
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="companies"
        @edit="openForm"
        @delete="confirmDelete"
      >
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Company' : 'Add New Company' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Company Name -->
            <div class="form-group">
              <label class="form-label">Company Name</label>
              <el-input
                v-model="form.name"
                placeholder="e.g., Kimia Farma Distribution"
                required
              />
            </div>

            <!-- Contact Person -->
            <div class="form-group">
              <label class="form-label">Contact Person</label>
              <el-input
                v-model="form.contactPerson"
                placeholder="e.g., John Smith"
              />
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label class="form-label">Phone</label>
              <el-input
                v-model="form.phone"
                placeholder="e.g., +62 21 1234567"
              />
            </div>

            <!-- Email -->
            <!-- <div class="form-group">
              <label class="form-label">Email</label>
              <el-input
                v-model="form.email"
                placeholder="e.g., contact@company.com"
              />
            </div> -->

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

// Table configuration
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Company Name' },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'phone', label: 'Phone' },
//   { key: 'email', label: 'Email' }
]

// Dummy data
const companies = ref([
  {
    id: 1,
    name: 'Kimia Farma Distribution',
    contactPerson: 'Budi Santoso',
    phone: '+62 21 1234567',
    // email: 'distribution@kimiafarma.co.id'
  },
  {
    id: 2,
    name: 'Kalbe Farma',
    contactPerson: 'Dewi Lestari',
    phone: '+62 21 7654321',
    // email: 'sales@kalbefarma.com'
  }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  contactPerson: '',
  phone: '',
//   email: ''
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
      contactPerson: '',
      phone: '',
    //   email: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    name: '',
    contactPerson: '',
    phone: '',
    // email: ''
  }
}

const saveItem = () => {
  if (!isFormValid.value) return

  const companyData = { ...form.value }

  if (editingItem.value) {
    // Update existing item
    const index = companies.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      companies.value[index] = {
        ...companies.value[index],
        ...companyData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...companies.value.map(item => item.id), 0) + 1
    companies.value.push({
      id: newId,
      ...companyData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this company?')) {
    companies.value = companies.value.filter(i => i.id !== item.id)
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style> 