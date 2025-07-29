<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Bank Accounts Management"
    @close="$emit('close')"
  >
    <div class="bank-accounts-container">
      <!-- Loading State -->
      <div v-if="bankAccountStore.isLoading" class="loading-container">
        <el-loading-spinner />
        <p>Loading bank accounts...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="bankAccountStore.hasError" class="error-container">
        <el-alert
          :title="bankAccountStore.error"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button @click="loadBankAccounts" type="primary" style="margin-top: 1rem;">
          Retry
        </el-button>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Add New Button -->
        <div class="action-header">
          <h3 class="section-title">Bank Accounts</h3>
          <el-button 
            type="primary" 
            icon="el-icon-plus"
            @click="openForm()"
            :disabled="bankAccountStore.isLoading"
          >
            Add New Bank Account
          </el-button>
        </div>

        <!-- Data Table -->
        <data-table
          :columns="columns"
          :items="bankAccountStore.bankAccounts"
          @edit="openForm"
          @delete="confirmDelete"
        >
          <template #card_number="{ item }">
            <span class="mono-text">{{ bankAccountStore.formatCardNumber(item.card_number) }}</span>
          </template>
          <template #iban="{ item }">
            <span class="mono-text">{{ formatIBAN(item.iban) }}</span>
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
                {{ editingItem ? 'Edit Bank Account' : 'Add New Bank Account' }}
              </h3>
              <button class="form-close-button" @click="closeForm">
                <i class="el-icon-close"></i>
              </button>
            </div>
            
            <form @submit.prevent="saveItem" class="form-content">
              <!-- Account Name -->
              <div class="form-group">
                <label class="form-label">Account Name *</label>
                <el-input
                  v-model="form.account_name"
                  placeholder="e.g., Main Business Account"
                  :class="{ 'error': formErrors.account_name }"
                />
                <p v-if="formErrors.account_name" class="form-error">
                  {{ formErrors.account_name }}
                </p>
              </div>

              <!-- Card Number -->
              <div class="form-group">
                <label class="form-label">Card Number *</label>
                <el-input
                  v-model="form.card_number"
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  @input="formatCardNumberInput"
                  class="mono-input"
                  :class="{ 'error': formErrors.card_number }"
                />
                <p v-if="formErrors.card_number" class="form-error">
                  {{ formErrors.card_number }}
                </p>
              </div>

              <!-- IBAN -->
              <div class="form-group">
                <label class="form-label">IBAN *</label>
                <el-input
                  v-model="form.iban"
                  placeholder="XX00 0000 0000 0000 0000 0000 000"
                  maxlength="34"
                  @input="formatIBANInput"
                  class="mono-input"
                  :class="{ 'error': formErrors.iban }"
                />
                <p v-if="formErrors.iban" class="form-error">
                  {{ formErrors.iban }}
                </p>
              </div>

              <div class="form-actions">
                <el-button @click="closeForm" :disabled="bankAccountStore.isLoading">
                  Cancel
                </el-button>
                <el-button 
                  type="primary" 
                  native-type="submit"
                  :disabled="!isFormValid || bankAccountStore.isLoading"
                  :loading="bankAccountStore.isLoading"
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
import { useBankAccountStore } from '@/stores/bankAccountStore'
import { formatDate } from '@/utils/dateUtils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Store
const bankAccountStore = useBankAccountStore()

// Table configuration
const columns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'account_name', label: 'Account Name' },
  { key: 'card_number', label: 'Card Number' },
  { key: 'iban', label: 'IBAN' },
  { key: 'created_at', label: 'Created' }
]

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  account_name: '',
  card_number: '',
  iban: ''
})

// Form validation
const formErrors = ref({})

// Computed properties
const isFormValid = computed(() => {
  const validation = bankAccountStore.validateBankAccount(form.value)
  formErrors.value = validation.errors
  return validation.isValid && 
         !bankAccountStore.isAccountNameExists(form.value.account_name, editingItem.value?.id) &&
         !bankAccountStore.isCardNumberExists(form.value.card_number?.replace(/\s/g, ''), editingItem.value?.id)
})

// Formatting functions
const formatIBAN = (iban) => {
  if (!iban) return ''
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

// Input formatting
const formatCardNumberInput = () => {
  let value = form.value.card_number.replace(/\D/g, '')
  if (value.length > 16) value = value.slice(0, 16)
  form.value.card_number = bankAccountStore.formatCardNumber(value)
}

const formatIBANInput = () => {
  let value = form.value.iban.replace(/\s/g, '').toUpperCase()
  if (value.length > 34) value = value.slice(0, 34)
  form.value.iban = formatIBAN(value)
}

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = {
      account_name: item.account_name,
      card_number: bankAccountStore.formatCardNumber(item.card_number),
      iban: formatIBAN(item.iban)
    }
  } else {
    form.value = {
      account_name: '',
      card_number: '',
      iban: ''
    }
  }
  formErrors.value = {}
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    account_name: '',
    card_number: '',
    iban: ''
  }
  formErrors.value = {}
}

const saveItem = async () => {
  if (!isFormValid.value) return

  try {
    const accountData = {
      account_name: form.value.account_name.trim(),
      card_number: form.value.card_number.replace(/\s/g, ''),
      iban: form.value.iban.replace(/\s/g, '')
    }

    if (editingItem.value) {
      await bankAccountStore.updateBankAccount(editingItem.value.id, accountData)
      ElMessage.success('Bank account updated successfully!')
    } else {
      await bankAccountStore.createBankAccount(accountData)
      ElMessage.success('Bank account created successfully!')
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving bank account:', error)
    
    // Handle validation errors from backend
    if (error.response?.data) {
      const backendErrors = error.response.data
      if (typeof backendErrors === 'object') {
        formErrors.value = { ...formErrors.value, ...backendErrors }
      } else {
        ElMessage.error(backendErrors.detail || 'Failed to save bank account')
      }
    } else {
      ElMessage.error('Failed to save bank account')
    }
  }
}

const confirmDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the bank account "${item.account_name}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await bankAccountStore.deleteBankAccount(item.id)
    ElMessage.success('Bank account deleted successfully!')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting bank account:', error)
      ElMessage.error('Failed to delete bank account')
    }
  }
}

// Load data
const loadBankAccounts = async () => {
  try {
    await bankAccountStore.fetchBankAccounts()
  } catch (error) {
    console.error('Error loading bank accounts:', error)
  }
}

// Watch for modal open/close
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadBankAccounts()
  }
})

// Load data on mount
onMounted(() => {
  if (props.modelValue) {
    loadBankAccounts()
  }
})
</script>

<style scoped>
.bank-accounts-container {
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
  margin-top: 0.5rem;
}

.mono-input :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.error :deep(.el-input__inner) {
  border-color: #e11d48;
}
</style> 