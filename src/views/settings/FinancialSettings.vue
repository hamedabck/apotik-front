<template>
  <div class="settings-container">
    <div class="page-header">
      <h1 class="page-title">Financial Settings</h1>
    </div>

    <div class="settings-grid">
      <!-- Bank Accounts Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Bank Accounts</h2>
            <el-button type="primary" @click="showBankAccountsModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Manage your bank accounts and payment information</p>
      </el-card>

      <!-- POS Devices Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Card Readers</h2>
            <el-button 
              type="primary" 
              @click="showCardReaderModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Manage card reader devices and terminals</p>
      </el-card>
    </div>

    <!-- Modals -->
    <bank-accounts-modal
      :model-value="showBankAccountsModal"
      @update:model-value="showBankAccountsModal = $event"
      @close="showBankAccountsModal = false"
    />

    <card-reader-modal
      :model-value="showCardReaderModal"
      @update:model-value="showCardReaderModal = $event"
      @close="showCardReaderModal = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BankAccountsModal from '@/components/settings/modals/BankAccountsModal.vue'
import CardReaderModal from '@/components/settings/modals/CardReaderModal.vue'

// Modal visibility states
const showBankAccountsModal = ref(false)
const showCardReaderModal = ref(false)
</script>

<style scoped>
.settings-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.settings-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-card-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-card-description {
  color: var(--text-secondary);
  margin-top: 10px;
  margin-bottom: 0;
}
</style> 