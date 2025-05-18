<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Tax Settings"
    @close="$emit('close')"
  >
    <div class="tax-settings-container">
      <!-- Tax Information Section -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">Tax Information</h3>
        </div>
        <div class="section-content">
          <form @submit.prevent="saveTaxInfo" class="settings-form">
            <!-- Tax ID -->
            <div class="form-group">
              <label class="form-label">Tax ID / VAT Number</label>
              <el-input
                v-model="taxInfo.taxId"
                placeholder="e.g., DE123456789"
                required
              />
            </div>

            <!-- Tax Registration Date -->
            <div class="form-group">
              <label class="form-label">Tax Registration Date</label>
              <el-date-picker
                v-model="taxInfo.registrationDate"
                type="date"
                placeholder="Select date"
                style="width: 100%"
                required
              />
            </div>

            <!-- Tax Office -->
            <div class="form-group">
              <label class="form-label">Tax Office</label>
              <el-input
                v-model="taxInfo.taxOffice"
                placeholder="e.g., Finanzamt Berlin-Mitte"
                required
              />
            </div>

            <div class="form-actions">
              <el-button 
                type="primary" 
                native-type="submit"
              >
                Save Tax Information
              </el-button>
            </div>
          </form>
        </div>
      </div>

      <!-- Tax Rates Section -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">Tax Rates</h3>
          <el-button 
            type="primary" 
            icon="el-icon-plus"
            @click="openTaxRateForm()"
          >
            Add Tax Rate
          </el-button>
        </div>
        <div class="section-content">
          <data-table
            :columns="taxRateColumns"
            :items="taxRates"
            @edit="openTaxRateForm"
            @delete="confirmDeleteTaxRate"
          >
            <template #rate="{ item }">
              <span>{{ item.rate }}%</span>
            </template>
            <template #isDefault="{ item }">
              <span class="status-indicator">
                <i v-if="item.isDefault" class="el-icon-check status-success"></i>
                <span v-else class="status-inactive">-</span>
              </span>
            </template>
          </data-table>
        </div>
      </div>

      <!-- Tax Rate Form Modal -->
      <div v-if="showTaxRateForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingTaxRate ? 'Edit Tax Rate' : 'Add New Tax Rate' }}
            </h3>
            <button class="form-close-button" @click="closeTaxRateForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveTaxRate" class="form-content">
            <!-- Name -->
            <div class="form-group">
              <label class="form-label">Name</label>
              <el-input
                v-model="taxRateForm.name"
                placeholder="e.g., Standard VAT"
                required
              />
            </div>

            <!-- Rate -->
            <div class="form-group">
              <label class="form-label">Rate (%)</label>
              <el-input-number
                v-model="taxRateForm.rate"
                :min="0"
                :max="100"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">Description</label>
              <el-input
                v-model="taxRateForm.description"
                type="textarea"
                rows="3"
                placeholder="Optional description"
              />
            </div>

            <!-- Is Default -->
            <div class="form-group checkbox-group">
              <el-checkbox v-model="taxRateForm.isDefault">
                Set as default tax rate
              </el-checkbox>
            </div>

            <div class="form-actions">
              <el-button @click="closeTaxRateForm">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                native-type="submit"
              >
                {{ editingTaxRate ? 'Update' : 'Save' }}
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

// Tax Information
const taxInfo = ref({
  taxId: '',
  registrationDate: '',
  taxOffice: ''
})

// Tax Rates
const taxRateColumns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'name', label: 'Name' },
  { key: 'rate', label: 'Rate' },
  { key: 'description', label: 'Description' },
  { key: 'isDefault', label: 'Default' }
]

const taxRates = ref([
  {
    id: 1,
    name: 'Standard VAT',
    rate: 19,
    description: 'Standard value-added tax rate',
    isDefault: true
  },
  {
    id: 2,
    name: 'Reduced Rate',
    rate: 7,
    description: 'Reduced VAT rate for specific goods',
    isDefault: false
  }
])

// Tax Rate Form
const showTaxRateForm = ref(false)
const editingTaxRate = ref(null)
const taxRateForm = ref({
  name: '',
  rate: '',
  description: '',
  isDefault: false
})

// Methods
const saveTaxInfo = () => {
  // Here you would typically make an API call to save the tax information
  console.log('Saving tax information:', taxInfo.value)
}

const openTaxRateForm = (item = null) => {
  editingTaxRate.value = item
  if (item) {
    taxRateForm.value = { ...item }
  } else {
    taxRateForm.value = {
      name: '',
      rate: '',
      description: '',
      isDefault: false
    }
  }
  showTaxRateForm.value = true
}

const closeTaxRateForm = () => {
  showTaxRateForm.value = false
  editingTaxRate.value = null
  taxRateForm.value = {
    name: '',
    rate: '',
    description: '',
    isDefault: false
  }
}

const saveTaxRate = () => {
  const rateData = {
    ...taxRateForm.value,
    rate: parseFloat(taxRateForm.value.rate)
  }

  if (rateData.isDefault) {
    // Remove default status from other rates
    taxRates.value.forEach(rate => {
      if (rate.id !== editingTaxRate.value?.id) {
        rate.isDefault = false
      }
    })
  }

  if (editingTaxRate.value) {
    // Update existing rate
    const index = taxRates.value.findIndex(rate => rate.id === editingTaxRate.value.id)
    if (index !== -1) {
      taxRates.value[index] = {
        ...taxRates.value[index],
        ...rateData
      }
    }
  } else {
    // Add new rate
    const newId = Math.max(...taxRates.value.map(rate => rate.id), 0) + 1
    taxRates.value.push({
      id: newId,
      ...rateData
    })
  }
  closeTaxRateForm()
}

const confirmDeleteTaxRate = (item) => {
  if (item.isDefault) {
    alert('Cannot delete the default tax rate')
    return
  }
  
  if (confirm('Are you sure you want to delete this tax rate?')) {
    taxRates.value = taxRates.value.filter(rate => rate.id !== item.id)
  }
}
</script>

<style scoped>
.tax-settings-container {
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