<template>
  <div class="settings-container">
    <h1 class="text-2xl font-bold mb-6">Settings Management</h1>
    
    <!-- Management Settings Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Management Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <settings-card
          title="Storages/Shelves"
          @click="openModal('storage')"
        />
        <settings-card
          title="Distribution Companies"
          @click="openModal('distribution')"
        />
        <settings-card
          title="Insurances"
          @click="openModal('insurance')"
        />
      </div>
    </section>

    <!-- User Settings Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">User Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <settings-card
          title="Doctors List"
          @click="openModal('doctors')"
        />
        <settings-card
          title="Customers List"
          @click="openModal('customers')"
        />
        <settings-card
          title="Employees"
          @click="openModal('employees')"
        />
      </div>
    </section>

    <!-- Financial Settings Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Financial Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <settings-card
          title="Bank Accounts"
          @click="openModal('bankAccounts')"
        />
        <settings-card
          title="Card Readers"
          @click="openModal('cardReaders')"
        />
        <settings-card
          title="Employee Salaries"
          @click="openModal('salaries')"
        />
      </div>
    </section>

    <!-- Modals -->
    <storage-modal
      v-if="activeModal === 'storage'"
      v-model="showModal"
      @close="closeModal"
    />
    <distribution-modal
      v-if="activeModal === 'distribution'"
      v-model="showModal"
      @close="closeModal"
    />
    <insurance-modal
      v-if="activeModal === 'insurance'"
      v-model="showModal"
      @close="closeModal"
    />
    <doctors-modal
      v-if="activeModal === 'doctors'"
      v-model="showModal"
      @close="closeModal"
    />
    <customers-modal
      v-if="activeModal === 'customers'"
      v-model="showModal"
      @close="closeModal"
    />
    <employees-modal
      v-if="activeModal === 'employees'"
      v-model="showModal"
      @close="closeModal"
    />
    <bank-accounts-modal
      v-if="activeModal === 'bankAccounts'"
      v-model="showModal"
      @close="closeModal"
    />
    <card-reader-modal
      v-if="activeModal === 'cardReaders'"
      v-model="showModal"
      @close="closeModal"
    />
    <salaries-modal
      v-if="activeModal === 'salaries'"
      v-model="showModal"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import StorageModal from '@/components/settings/modals/StorageModal.vue'
import DistributionModal from '@/components/settings/modals/DistributionModal.vue'
import InsuranceModal from '@/components/settings/modals/InsuranceModal.vue'
import DoctorsModal from '@/components/settings/modals/DoctorsModal.vue'
import CustomersModal from '@/components/settings/modals/CustomersModal.vue'
import EmployeesModal from '@/components/settings/modals/EmployeesModal.vue'
import BankAccountsModal from '@/components/settings/modals/BankAccountsModal.vue'
import CardReaderModal from '@/components/settings/modals/CardReaderModal.vue'
import SalariesModal from '@/components/settings/modals/SalariesModal.vue'

const showModal = ref(false)
const activeModal = ref(null)

const openModal = (modalType) => {
  activeModal.value = modalType
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  activeModal.value = null
}
</script>

<style scoped>
.settings-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style> 