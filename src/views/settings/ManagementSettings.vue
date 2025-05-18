<template>
  <div class="settings-container">
    <div class="page-header">
      <h1 class="page-title">Management Settings</h1>
    </div>

    <div class="settings-grid">
      <!-- Storage/Shelves Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Storages & Shelves</h2>
            <el-button type="primary" @click="showStorageShelvesModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Manage storage locations and shelves in your pharmacy</p>
      </el-card>

      <!-- Distribution Companies Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Distribution Companies</h2>
            <el-button type="primary" @click="showDistributionCompaniesModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Manage your suppliers and distribution partners</p>
      </el-card>

      <!-- Insurances Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Insurances</h2>
            <el-button type="primary" @click="showInsurancesModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Configure insurance providers and coverage options</p>
      </el-card>
    </div>

    <!-- Modals -->
    <storage-shelve-modal
      :model-value="showStorageShelvesModal"
      @update:model-value="showStorageShelvesModal = $event"
      @close="showStorageShelvesModal = false"
    />

    <distribution-companies-modal
      :model-value="showDistributionCompaniesModal"
      @update:model-value="showDistributionCompaniesModal = $event"
      @close="showDistributionCompaniesModal = false"
    />

    <insurances-modal
      :model-value="showInsurancesModal"
      @update:model-value="showInsurancesModal = $event"
      @close="showInsurancesModal = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StorageShelveModal from '@/components/settings/modals/StorageShelveModal.vue'
import DistributionCompaniesModal from '@/components/settings/modals/DistributionCompaniesModal.vue'
import InsurancesModal from '@/components/settings/modals/InsurancesModal.vue'

// Modal visibility states
const showStorageShelvesModal = ref(false)
const showDistributionCompaniesModal = ref(false)
const showInsurancesModal = ref(false)
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