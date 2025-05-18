<template>
  <div class="settings-container">
    <div class="page-header">
      <h1 class="page-title">User Settings</h1>
    </div>

    <div class="settings-grid">
      <!-- Doctors List Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Doctors List</h2>
            <el-button type="primary" @click="showDoctorsListModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Manage doctors, their specialties and contact information</p>
      </el-card>

      <!-- Customers List Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Customers List</h2>
            <el-button type="primary" @click="showCustomersListModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Manage customer details, insurance information and purchase history</p>
      </el-card>

      <!-- Employees Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Employees</h2>
            <el-button type="primary" @click="showEmployeesModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Manage employees, roles and permissions</p>
      </el-card>

      <!-- Employee Salaries Card -->
      <el-card shadow="hover" class="settings-card">
        <template #header>
          <div class="settings-card-header">
            <h2>Employee Salaries</h2>
            <el-button type="primary" @click="showEmployeeSalariesModal = true">
              Manage
            </el-button>
          </div>
        </template>
        <p class="settings-card-description">Track and manage employee salaries, bonuses and deductions</p>
      </el-card>
    </div>

    <!-- Modals -->
    <doctors-list-modal
      :model-value="showDoctorsListModal"
      @update:model-value="showDoctorsListModal = $event"
      @close="showDoctorsListModal = false"
    />

    <customers-list-modal
      :model-value="showCustomersListModal"
      @update:model-value="showCustomersListModal = $event"
      @close="showCustomersListModal = false"
    />

    <employees-modal
      :model-value="showEmployeesModal"
      @update:model-value="showEmployeesModal = $event"
      @close="showEmployeesModal = false"
    />

    <employee-salaries-modal
      :model-value="showEmployeeSalariesModal"
      @update:model-value="showEmployeeSalariesModal = $event"
      @close="showEmployeeSalariesModal = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DoctorsListModal from '@/components/settings/modals/DoctorsListModal.vue'
import CustomersListModal from '@/components/settings/modals/CustomersListModal.vue'
import EmployeesModal from '@/components/settings/modals/EmployeesModal.vue'
import EmployeeSalariesModal from '@/components/settings/modals/EmployeeSalariesModal.vue'

// Modal visibility states
const showDoctorsListModal = ref(false)
const showCustomersListModal = ref(false)
const showEmployeesModal = ref(false)
const showEmployeeSalariesModal = ref(false)
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