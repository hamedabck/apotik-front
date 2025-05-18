<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Insurances Management"
    @close="$emit('close')"
  >
    <div class="insurances-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Insurances</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Insurance
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="insurances"
        @edit="openForm"
        @delete="confirmDelete"
      >
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Insurance' : 'Add New Insurance' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Name -->
            <div class="form-group">
              <label class="form-label">Insurance Name</label>
              <el-input
                v-model="form.name"
                placeholder="e.g., BPJS Health, Prudential"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">Description</label>
              <el-input
                v-model="form.description"
                type="textarea"
                rows="3"
                placeholder="Optional description"
              />
            </div>

            <!-- Coverage Percentage -->
            <div class="form-group">
              <label class="form-label">Coverage Percentage</label>
              <el-input-number
                v-model="form.coveragePercentage"
                :min="0"
                :max="100"
                :precision="0"
                :step="5"
                style="width: 100%"
              />
              <p class="form-help">Percentage of costs covered by this insurance</p>
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

// Table configuration
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'coveragePercentage', label: 'Coverage %' }
]

// Dummy data
const insurances = ref([
  {
    id: 1,
    name: 'BPJS Health',
    description: 'National health insurance',
    coveragePercentage: 80
  },
  {
    id: 2,
    name: 'Prudential Health',
    description: 'Private health insurance',
    coveragePercentage: 90
  },
  {
    id: 3,
    name: 'Allianz Care',
    description: 'Corporate health insurance',
    coveragePercentage: 85
  }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  description: '',
  coveragePercentage: 80
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
      description: '',
      coveragePercentage: 80
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    name: '',
    description: '',
    coveragePercentage: 80
  }
}

const saveItem = () => {
  if (!isFormValid.value) return

  const insuranceData = { ...form.value }

  if (editingItem.value) {
    // Update existing item
    const index = insurances.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      insurances.value[index] = {
        ...insurances.value[index],
        ...insuranceData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...insurances.value.map(item => item.id), 0) + 1
    insurances.value.push({
      id: newId,
      ...insuranceData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this insurance?')) {
    insurances.value = insurances.value.filter(i => i.id !== item.id)
  }
}
</script>

<style scoped>
.insurances-container {
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

.form-help {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0.25rem 0 0 0;
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
</style> 