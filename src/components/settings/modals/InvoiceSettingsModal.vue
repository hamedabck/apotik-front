<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Invoice Settings"
    @close="$emit('close')"
  >
    <div class="invoice-settings-container">
      <!-- Invoice Numbering Section -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">Invoice Numbering</h3>
        </div>
        <div class="section-content">
          <form @submit.prevent="saveNumberingSettings" class="settings-form">
            <!-- Prefix -->
            <div class="form-group">
              <label class="form-label">Invoice Prefix</label>
              <el-input
                v-model="numberingSettings.prefix"
                placeholder="e.g., INV-"
                maxlength="10"
              />
            </div>

            <!-- Starting Number -->
            <div class="form-group">
              <label class="form-label">Starting Number</label>
              <el-input-number
                v-model="numberingSettings.startingNumber"
                :min="1"
                style="width: 100%"
                required
              />
            </div>

            <!-- Number Padding -->
            <div class="form-group">
              <label class="form-label">Number Padding</label>
              <el-input-number
                v-model="numberingSettings.padding"
                :min="0"
                :max="10"
                style="width: 100%"
                required
              />
              <p class="form-help">
                Number of zeros to pad the invoice number (e.g., 3 for 001, 002, etc.)
              </p>
            </div>

            <!-- Reset Yearly -->
            <div class="form-group checkbox-group">
              <el-checkbox v-model="numberingSettings.resetYearly">
                Reset numbering at the start of each year
              </el-checkbox>
            </div>

            <div class="form-actions">
              <el-button 
                type="primary" 
                native-type="submit"
              >
                Save Numbering Settings
              </el-button>
            </div>
          </form>
        </div>
      </div>

      <!-- Default Settings Section -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">Default Settings</h3>
        </div>
        <div class="section-content">
          <form @submit.prevent="saveDefaultSettings" class="settings-form">
            <!-- Payment Terms -->
            <div class="form-group">
              <label class="form-label">Default Payment Terms (days)</label>
              <el-input-number
                v-model="defaultSettings.paymentTerms"
                :min="0"
                style="width: 100%"
                required
              />
            </div>

            <!-- Due Date Calculation -->
            <div class="form-group">
              <label class="form-label">Due Date Calculation</label>
              <el-select
                v-model="defaultSettings.dueDateCalculation"
                placeholder="Select calculation method"
                style="width: 100%"
                required
              >
                <el-option value="end_of_month" label="End of Month" />
                <el-option value="days_after_issue" label="Days After Issue" />
                <el-option value="days_after_delivery" label="Days After Delivery" />
              </el-select>
            </div>

            <!-- Default Notes -->
            <div class="form-group">
              <label class="form-label">Default Notes</label>
              <el-input
                v-model="defaultSettings.defaultNotes"
                type="textarea"
                rows="3"
                placeholder="Default notes to appear on all invoices"
              />
            </div>

            <div class="form-actions">
              <el-button 
                type="primary" 
                native-type="submit"
              >
                Save Default Settings
              </el-button>
            </div>
          </form>
        </div>
      </div>

      <!-- Invoice Templates Section -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">Invoice Templates</h3>
          <el-button 
            type="primary" 
            icon="el-icon-plus"
            @click="openTemplateForm()"
          >
            Add Template
          </el-button>
        </div>
        <div class="section-content">
          <data-table
            :columns="templateColumns"
            :items="templates"
            @edit="openTemplateForm"
            @delete="confirmDeleteTemplate"
          >
            <template #isDefault="{ item }">
              <span class="status-indicator">
                <i v-if="item.isDefault" class="el-icon-check status-success"></i>
                <span v-else class="status-inactive">-</span>
              </span>
            </template>
          </data-table>
        </div>
      </div>

      <!-- Template Form Modal -->
      <div v-if="showTemplateForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingTemplate ? 'Edit Template' : 'Add New Template' }}
            </h3>
            <button class="form-close-button" @click="closeTemplateForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveTemplate" class="form-content">
            <!-- Name -->
            <div class="form-group">
              <label class="form-label">Template Name</label>
              <el-input
                v-model="templateForm.name"
                placeholder="e.g., Standard Template"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">Description</label>
              <el-input
                v-model="templateForm.description"
                type="textarea"
                rows="3"
                placeholder="Template description"
              />
            </div>

            <!-- Is Default -->
            <div class="form-group checkbox-group">
              <el-checkbox v-model="templateForm.isDefault">
                Set as default template
              </el-checkbox>
            </div>

            <div class="form-actions">
              <el-button @click="closeTemplateForm">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                native-type="submit"
              >
                {{ editingTemplate ? 'Update' : 'Save' }}
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

// Invoice Numbering Settings
const numberingSettings = ref({
  prefix: 'INV-',
  startingNumber: 1,
  padding: 3,
  resetYearly: true
})

// Default Settings
const defaultSettings = ref({
  paymentTerms: 30,
  dueDateCalculation: 'end_of_month',
  defaultNotes: ''
})

// Templates
const templateColumns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'isDefault', label: 'Default' }
]

const templates = ref([
  {
    id: 1,
    name: 'Standard Template',
    description: 'Default invoice template with company logo and standard layout',
    isDefault: true
  },
  {
    id: 2,
    name: 'Simple Template',
    description: 'Minimalist template without logo',
    isDefault: false
  }
])

// Template Form
const showTemplateForm = ref(false)
const editingTemplate = ref(null)
const templateForm = ref({
  name: '',
  description: '',
  isDefault: false
})

// Methods
const saveNumberingSettings = () => {
  // Here you would typically make an API call to save the numbering settings
  console.log('Saving numbering settings:', numberingSettings.value)
}

const saveDefaultSettings = () => {
  // Here you would typically make an API call to save the default settings
  console.log('Saving default settings:', defaultSettings.value)
}

const openTemplateForm = (item = null) => {
  editingTemplate.value = item
  if (item) {
    templateForm.value = { ...item }
  } else {
    templateForm.value = {
      name: '',
      description: '',
      isDefault: false
    }
  }
  showTemplateForm.value = true
}

const closeTemplateForm = () => {
  showTemplateForm.value = false
  editingTemplate.value = null
  templateForm.value = {
    name: '',
    description: '',
    isDefault: false
  }
}

const saveTemplate = () => {
  const templateData = {
    ...templateForm.value
  }

  if (templateData.isDefault) {
    // Remove default status from other templates
    templates.value.forEach(template => {
      if (template.id !== editingTemplate.value?.id) {
        template.isDefault = false
      }
    })
  }

  if (editingTemplate.value) {
    // Update existing template
    const index = templates.value.findIndex(template => template.id === editingTemplate.value.id)
    if (index !== -1) {
      templates.value[index] = {
        ...templates.value[index],
        ...templateData
      }
    }
  } else {
    // Add new template
    const newId = Math.max(...templates.value.map(template => template.id), 0) + 1
    templates.value.push({
      id: newId,
      ...templateData
    })
  }
  closeTemplateForm()
}

const confirmDeleteTemplate = (item) => {
  if (item.isDefault) {
    alert('Cannot delete the default template')
    return
  }
  
  if (confirm('Are you sure you want to delete this template?')) {
    templates.value = templates.value.filter(template => template.id !== item.id)
  }
}
</script>

<style scoped>
.invoice-settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.section-content {
  padding: 1.25rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-group {
  margin-top: 0.5rem;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-success {
  color: var(--success-color);
  font-size: 1.125rem;
}

.status-inactive {
  color: var(--text-secondary);
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
  max-width: 500px;
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
</style> 