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
        <h3 class="section-title">Storages & Shelves</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Storage/Shelf
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="storages"
        @edit="openForm"
        @delete="confirmDelete"
      >
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
              <label class="form-label">Name</label>
              <el-input
                v-model="form.name"
                placeholder="e.g., Main Storage, Shelf A1"
                required
              />
            </div>

            <!-- Type -->
            <div class="form-group">
              <label class="form-label">Type</label>
              <el-select
                v-model="form.type"
                placeholder="Select type"
                style="width: 100%"
                required
              >
                <el-option value="storage" label="Storage" />
                <el-option value="shelf" label="Shelf" />
              </el-select>
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
import { useStorageStore } from '@/stores/storageStore'

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
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' }
]

// Use store data instead of local data
const storages = computed(() => storageStore.storages)

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  type: 'shelf',
  description: ''
})

// Computed properties
const isFormValid = computed(() => {
  return form.value.name && form.value.type
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
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
  form.value = {
    name: '',
    type: 'shelf',
    description: ''
  }
}

const saveItem = () => {
  if (!isFormValid.value) return

  const storageData = { ...form.value }

  if (editingItem.value) {
    // Update existing item
    storageStore.updateStorage(editingItem.value.id, storageData)
  } else {
    // Add new item
    const newId = Math.max(...storages.value.map(item => item.id), 0) + 1
    storageStore.addStorage({
      id: newId,
      ...storageData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this storage/shelf?')) {
    storageStore.deleteStorage(item.id)
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
</style> 