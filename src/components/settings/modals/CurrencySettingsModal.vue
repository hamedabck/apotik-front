<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Currency Settings"
    @close="$emit('close')"
  >
    <div class="currency-settings-container">
      <!-- Primary Currency Section -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">Primary Currency</h3>
        </div>
        <div class="section-content">
          <form @submit.prevent="savePrimaryCurrency" class="settings-form">
            <div class="form-group">
              <label class="form-label">Select Primary Currency</label>
              <el-select
                v-model="primaryCurrency"
                placeholder="Select currency"
                style="width: 100%"
                required
              >
                <el-option
                  v-for="currency in currencies"
                  :key="currency.code"
                  :label="`${currency.code} - ${currency.name}`"
                  :value="currency.code"
                />
              </el-select>
            </div>

            <div class="form-actions">
              <el-button 
                type="primary" 
                native-type="submit"
              >
                Save Primary Currency
              </el-button>
            </div>
          </form>
        </div>
      </div>

      <!-- Exchange Rates Section -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">Exchange Rates</h3>
          <div class="header-actions">
            <el-button 
              type="primary" 
              icon="el-icon-refresh"
              @click="refreshRates"
            >
              Refresh Rates
            </el-button>
            <el-button 
              type="primary" 
              icon="el-icon-plus"
              @click="openExchangeRateForm()"
            >
              Add Manual Rate
            </el-button>
          </div>
        </div>
        <div class="section-content">
          <data-table
            :columns="exchangeRateColumns"
            :items="exchangeRates"
            @edit="openExchangeRateForm"
            @delete="confirmDeleteRate"
          >
            <template #rate="{ item }">
              <span class="mono-text">{{ formatRate(item.rate) }}</span>
            </template>
            <template #lastUpdated="{ item }">
              <span>{{ formatDate(item.lastUpdated) }}</span>
            </template>
            <template #isManual="{ item }">
              <span class="status-indicator">
                <i v-if="item.isManual" class="el-icon-edit status-warning"></i>
                <span v-else class="status-inactive">-</span>
              </span>
            </template>
          </data-table>
        </div>
      </div>

      <!-- Exchange Rate Form Modal -->
      <div v-if="showExchangeRateForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingRate ? 'Edit Exchange Rate' : 'Add Manual Exchange Rate' }}
            </h3>
            <button class="form-close-button" @click="closeExchangeRateForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveExchangeRate" class="form-content">
            <!-- From Currency -->
            <div class="form-group">
              <label class="form-label">From Currency</label>
              <el-select
                v-model="exchangeRateForm.fromCurrency"
                placeholder="Select currency"
                style="width: 100%"
                required
              >
                <el-option
                  v-for="currency in currencies"
                  :key="currency.code"
                  :label="`${currency.code} - ${currency.name}`"
                  :value="currency.code"
                />
              </el-select>
            </div>

            <!-- To Currency -->
            <div class="form-group">
              <label class="form-label">To Currency</label>
              <el-select
                v-model="exchangeRateForm.toCurrency"
                placeholder="Select currency"
                style="width: 100%"
                required
              >
                <el-option
                  v-for="currency in currencies"
                  :key="currency.code"
                  :label="`${currency.code} - ${currency.name}`"
                  :value="currency.code"
                />
              </el-select>
            </div>

            <!-- Rate -->
            <div class="form-group">
              <label class="form-label">Exchange Rate</label>
              <el-input-number
                v-model="exchangeRateForm.rate"
                :min="0"
                :precision="6"
                :step="0.000001"
                style="width: 100%"
                class="mono-input"
                required
              />
            </div>

            <div class="form-actions">
              <el-button @click="closeExchangeRateForm">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                native-type="submit"
              >
                {{ editingRate ? 'Update' : 'Save' }}
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

// Currencies list
const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'IDR', name: 'Indonesian Rupiah' }
]

// Primary Currency
const primaryCurrency = ref('USD')

// Exchange Rates
const exchangeRateColumns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'fromCurrency', label: 'From' },
  { key: 'toCurrency', label: 'To' },
  { key: 'rate', label: 'Rate' },
  { key: 'lastUpdated', label: 'Last Updated' },
  { key: 'isManual', label: 'Manual' }
]

const exchangeRates = ref([
  {
    id: 1,
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    rate: 0.85,
    lastUpdated: '2024-03-15T10:00:00Z',
    isManual: false
  },
  {
    id: 2,
    fromCurrency: 'EUR',
    toCurrency: 'USD',
    rate: 1.18,
    lastUpdated: '2024-03-15T10:00:00Z',
    isManual: false
  },
  {
    id: 3,
    fromCurrency: 'USD',
    toCurrency: 'IDR',
    rate: 15500,
    lastUpdated: '2024-03-15T10:00:00Z',
    isManual: true
  }
])

// Exchange Rate Form
const showExchangeRateForm = ref(false)
const editingRate = ref(null)
const exchangeRateForm = ref({
  fromCurrency: '',
  toCurrency: '',
  rate: ''
})

// Methods
const savePrimaryCurrency = () => {
  // Here you would typically make an API call to save the primary currency
  console.log('Saving primary currency:', primaryCurrency.value)
}

const refreshRates = () => {
  // Here you would typically fetch the latest exchange rates from an API
  console.log('Refreshing exchange rates')
}

const formatRate = (rate) => {
  return rate.toFixed(6)
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const openExchangeRateForm = (item = null) => {
  editingRate.value = item
  if (item) {
    exchangeRateForm.value = { ...item }
  } else {
    exchangeRateForm.value = {
      fromCurrency: '',
      toCurrency: '',
      rate: ''
    }
  }
  showExchangeRateForm.value = true
}

const closeExchangeRateForm = () => {
  showExchangeRateForm.value = false
  editingRate.value = null
  exchangeRateForm.value = {
    fromCurrency: '',
    toCurrency: '',
    rate: ''
  }
}

const saveExchangeRate = () => {
  const rateData = {
    ...exchangeRateForm.value,
    rate: parseFloat(exchangeRateForm.value.rate),
    lastUpdated: new Date().toISOString(),
    isManual: true
  }

  if (editingRate.value) {
    // Update existing rate
    const index = exchangeRates.value.findIndex(rate => rate.id === editingRate.value.id)
    if (index !== -1) {
      exchangeRates.value[index] = {
        ...exchangeRates.value[index],
        ...rateData
      }
    }
  } else {
    // Add new rate
    const newId = Math.max(...exchangeRates.value.map(rate => rate.id), 0) + 1
    exchangeRates.value.push({
      id: newId,
      ...rateData
    })
  }
  closeExchangeRateForm()
}

const confirmDeleteRate = (item) => {
  if (!item.isManual) {
    alert('Cannot delete automatic exchange rates')
    return
  }
  
  if (confirm('Are you sure you want to delete this exchange rate?')) {
    exchangeRates.value = exchangeRates.value.filter(rate => rate.id !== item.id)
  }
}
</script>

<style scoped>
.currency-settings-container {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
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

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-warning {
  color: var(--warning-color);
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

.mono-input :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style> 