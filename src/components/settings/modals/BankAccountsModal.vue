<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Bank Accounts Management"
    @close="$emit('close')"
  >
    <div class="bank-accounts-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Bank Accounts</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Bank Account
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="bankAccounts"
        @edit="openForm"
        @delete="confirmDelete"
      >
        <template #cardNumber="{ item }">
          <span class="mono-text">{{ formatCardNumber(item.cardNumber) }}</span>
        </template>
        <template #iban="{ item }">
          <span class="mono-text">{{ formatIBAN(item.iban) }}</span>
        </template>
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Bank Account' : 'Add New Bank Account' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Account Name -->
            <div class="form-group">
              <label class="form-label">Account Name</label>
              <el-input
                v-model="form.accountName"
                placeholder="e.g., Main Business Account"
                required
              />
            </div>

            <!-- Card Number -->
            <div class="form-group">
              <label class="form-label">Card Number</label>
              <el-input
                v-model="form.cardNumber"
                placeholder="1234 5678 9012 3456"
                maxlength="19"
                @input="formatCardNumberInput"
                class="mono-input"
              />
              <p v-if="cardNumberError" class="form-error">
                {{ cardNumberError }}
              </p>
            </div>

            <!-- IBAN -->
            <div class="form-group">
              <label class="form-label">IBAN</label>
              <el-input
                v-model="form.iban"
                placeholder="XX00 0000 0000 0000 0000 0000 000"
                maxlength="34"
                @input="formatIBANInput"
                class="mono-input"
              />
              <p v-if="ibanError" class="form-error">
                {{ ibanError }}
              </p>
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
  { key: 'id', label: 'ID', width: '70' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'cardNumber', label: 'Card Number' },
  { key: 'iban', label: 'IBAN' }
]

// Dummy data
const bankAccounts = ref([
  {
    id: 1,
    accountName: 'Main Business Account',
    cardNumber: '1234567890123456',
    iban: 'DE89370400440532013000'
  },
  {
    id: 2,
    accountName: 'Secondary Account',
    cardNumber: '9876543210987654',
    iban: 'GB29NWBK60161331926819'
  }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  accountName: '',
  cardNumber: '',
  iban: ''
})

// Validation state
const cardNumberError = ref('')
const ibanError = ref('')

// Computed properties
const isFormValid = computed(() => {
  return form.value.accountName &&
         form.value.cardNumber &&
         form.value.iban &&
         !cardNumberError.value &&
         !ibanError.value
})

// Formatting functions
const formatCardNumber = (number) => {
  if (!number) return ''
  return number.replace(/(\d{4})/g, '$1 ').trim()
}

const formatIBAN = (iban) => {
  if (!iban) return ''
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

// Input formatting
const formatCardNumberInput = (event) => {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 16) value = value.slice(0, 16)
  form.value.cardNumber = formatCardNumber(value)
  
  // Validation
  if (value.length !== 16) {
    cardNumberError.value = 'Card number must be 16 digits'
  } else {
    cardNumberError.value = ''
  }
}

const formatIBANInput = (event) => {
  let value = event.target.value.replace(/\s/g, '').toUpperCase()
  form.value.iban = formatIBAN(value)
  
  // Basic IBAN validation
  if (value.length < 15 || value.length > 34) {
    ibanError.value = 'IBAN must be between 15 and 34 characters'
  } else if (!/^[A-Z0-9]+$/.test(value)) {
    ibanError.value = 'IBAN can only contain letters and numbers'
  } else {
    ibanError.value = ''
  }
}

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      accountName: '',
      cardNumber: '',
      iban: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    accountName: '',
    cardNumber: '',
    iban: ''
  }
  cardNumberError.value = ''
  ibanError.value = ''
}

const saveItem = () => {
  if (!isFormValid.value) return

  const accountData = {
    ...form.value,
    cardNumber: form.value.cardNumber.replace(/\s/g, ''),
    iban: form.value.iban.replace(/\s/g, '')
  }

  if (editingItem.value) {
    // Update existing item
    const index = bankAccounts.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      bankAccounts.value[index] = {
        ...bankAccounts.value[index],
        ...accountData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...bankAccounts.value.map(item => item.id), 0) + 1
    bankAccounts.value.push({
      id: newId,
      ...accountData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this bank account?')) {
    bankAccounts.value = bankAccounts.value.filter(i => i.id !== item.id)
  }
}
</script>

<style scoped>
.bank-accounts-container {
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

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
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
  gap: 0.45rem;
  margin-top: 0.5rem;
}

.mono-input :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style> 