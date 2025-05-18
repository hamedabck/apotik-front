<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Card Reader Management"
    @close="$emit('close')"
  >
    <div class="card-reader-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Card Readers</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Card Reader
        </el-button>
      </div>

      <!-- Data Table or Form -->
      <div v-if="!showForm">
        <!-- Data Table -->
        <data-table
          :columns="columns"
          :items="cardReaders"
          @edit="openForm"
          @delete="confirmDelete"
        >
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
            <label class="form-label">Model</label>
            <el-input
              v-model="form.model"
              placeholder="e.g., VeriFone VX520"
              required
            />
          </div>

          <!-- Serial Number -->
          <div class="form-group">
            <label class="form-label">Serial Number</label>
            <el-input
              v-model="form.serialNumber"
              placeholder="e.g., CR-12345678"
              required
            />
          </div>
          
          <!-- Location -->
          <div class="form-group">
            <label class="form-label">Location</label>
            <el-input
              v-model="form.location"
              placeholder="e.g., Checkout Counter 1"
            />
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
  { key: 'id', label: 'ID', width: '70' },
  { key: 'model', label: 'Model' },
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'location', label: 'Location' }
]

// Dummy data
const cardReaders = ref([
  {
    id: 1,
    model: 'VeriFone VX520',
    serialNumber: 'CR-12345678',
    location: 'Checkout Counter 1'
  },
  {
    id: 2,
    model: 'Ingenico iCT250',
    serialNumber: 'CR-87654321',
    location: 'Checkout Counter 2'
  }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  model: '',
  serialNumber: '',
  location: ''
})

// Computed properties
const isFormValid = computed(() => {
  return form.value.model && form.value.serialNumber
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      model: '',
      serialNumber: '',
      location: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    model: '',
    serialNumber: '',
    location: ''
  }
}

const saveItem = () => {
  if (!isFormValid.value) return

  const readerData = { ...form.value }

  if (editingItem.value) {
    // Update existing item
    const index = cardReaders.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      cardReaders.value[index] = {
        ...cardReaders.value[index],
        ...readerData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...cardReaders.value.map(item => item.id), 0) + 1
    cardReaders.value.push({
      id: newId,
      ...readerData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this card reader?')) {
    cardReaders.value = cardReaders.value.filter(i => i.id !== item.id)
  }
}
</script>

<style scoped>
.card-reader-container {
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

/* Form Panel */
.form-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid rgba(235, 238, 245, 0.5);
}

.form-panel-header {
  padding: 1rem;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
}

.form-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.close-button {
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

.close-button:hover {
  color: #1e293b;
  background-color: #e2e8f0;
}

.form-content {
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
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
</style> 