<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Employees Management"
    @close="$emit('close')"
  >
    <div class="employees-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Employees</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Employee
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="employees"
        @edit="openForm"
        @delete="confirmDelete"
      >
        <template #role="{ item }">
          <el-tag
            :type="getRoleTagType(item.role)"
            size="small"
            effect="light"
          >
            {{ capitalizeFirst(item.role) }}
          </el-tag>
        </template>

        <template #accessibility="{ item }">
          <span>{{ item.accessibility.length }} pages</span>
        </template>
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Employee' : 'Add New Employee' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Basic Information -->
            <div class="form-section">
              <h4 class="form-section-title">Basic Information</h4>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <el-input
                    v-model="form.name"
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Role</label>
                  <el-select
                    v-model="form.role"
                    placeholder="Select role"
                    style="width: 100%"
                    required
                  >
                    <el-option value="storekeeper" label="Storekeeper" />
                    <el-option value="seller" label="Seller" />
                    <el-option value="manager" label="Manager" />
                    <el-option value="custom" label="Custom" />
                  </el-select>
                </div>
              </div>
            </div>

            <!-- Account Information -->
            <div class="form-section">
              <h4 class="form-section-title">Account Information</h4>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Username</label>
                  <el-input
                    v-model="form.username"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Password</label>
                  <el-input
                    v-model="form.password"
                    placeholder="Enter password"
                    show-password
                    :required="!editingItem"
                  />
                  <p v-if="editingItem" class="form-help">
                    Leave empty to keep current password
                  </p>
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="form-section">
              <h4 class="form-section-title">Contact Information</h4>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <el-input
                    v-model="form.phone"
                    placeholder="e.g., +62 812 3456 7890"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Email</label>
                  <el-input
                    v-model="form.email"
                    placeholder="e.g., employee@company.com"
                    type="email"
                  />
                </div>
              </div>
            </div>

            <!-- Accessibility -->
            <div class="form-section">
              <h4 class="form-section-title">Page Access</h4>
              <p class="form-description">Select which pages this employee can access</p>
              
              <div class="checkbox-grid">
                <el-checkbox
                  v-model="form.accessibility"
                  label="dashboard"
                >
                  Dashboard
                </el-checkbox>
                <el-checkbox
                  v-model="form.accessibility"
                  label="inventory"
                >
                  Inventory
                </el-checkbox>
                <el-checkbox
                  v-model="form.accessibility"
                  label="sales"
                >
                  Sales
                </el-checkbox>
                <el-checkbox
                  v-model="form.accessibility"
                  label="purchases"
                >
                  Purchases
                </el-checkbox>
                <el-checkbox
                  v-model="form.accessibility"
                  label="customers"
                >
                  Customers
                </el-checkbox>
                <el-checkbox
                  v-model="form.accessibility"
                  label="suppliers"
                >
                  Suppliers
                </el-checkbox>
                <el-checkbox
                  v-model="form.accessibility"
                  label="reports"
                >
                  Reports
                </el-checkbox>
                <el-checkbox
                  v-model="form.accessibility"
                  label="settings"
                >
                  Settings
                </el-checkbox>
              </div>
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
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'username', label: 'Username' },
  { key: 'role', label: 'Role' },
  { key: 'accessibility', label: 'Access' }
]

// Dummy data
const employees = ref([
  {
    id: 1,
    name: 'Budi Santoso',
    username: 'budi.s',
    password: '******',
    role: 'manager',
    phone: '+62 812 3456 7890',
    email: 'budi@example.com',
    accessibility: ['dashboard', 'inventory', 'sales', 'purchases', 'customers', 'suppliers', 'reports', 'settings']
  },
  {
    id: 2,
    name: 'Dewi Lestari',
    username: 'dewi.l',
    password: '******',
    role: 'seller',
    phone: '+62 812 9876 5432',
    email: 'dewi@example.com',
    accessibility: ['dashboard', 'sales', 'customers']
  },
  {
    id: 3,
    name: 'Ahmad Riyanto',
    username: 'ahmad.r',
    password: '******',
    role: 'storekeeper',
    phone: '+62 813 1234 5678',
    email: 'ahmad@example.com',
    accessibility: ['dashboard', 'inventory', 'purchases', 'suppliers']
  }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  username: '',
  password: '',
  role: '',
  phone: '',
  email: '',
  accessibility: []
})

// Computed properties
const isFormValid = computed(() => {
  return form.value.name && 
         form.value.username && 
         (editingItem.value || form.value.password) && 
         form.value.role
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { 
      ...item,
      password: '', // Clear password field for security
      accessibility: [...item.accessibility] // Make a copy of the array
    }
  } else {
    form.value = {
      name: '',
      username: '',
      password: '',
      role: '',
      phone: '',
      email: '',
      accessibility: []
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    name: '',
    username: '',
    password: '',
    role: '',
    phone: '',
    email: '',
    accessibility: []
  }
}

const saveItem = () => {
  if (!isFormValid.value) return

  const employeeData = { ...form.value }
  
  // Don't update password if it's empty (when editing)
  if (editingItem.value && !employeeData.password) {
    delete employeeData.password
  }

  if (editingItem.value) {
    // Update existing item
    const index = employees.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      employees.value[index] = {
        ...employees.value[index],
        ...employeeData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...employees.value.map(item => item.id), 0) + 1
    employees.value.push({
      id: newId,
      ...employeeData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this employee?')) {
    employees.value = employees.value.filter(i => i.id !== item.id)
  }
}

const getRoleTagType = (role) => {
  switch (role) {
    case 'manager':
      return 'danger'
    case 'seller':
      return 'success'
    case 'storekeeper':
      return 'primary'
    default:
      return 'info'
  }
}

const capitalizeFirst = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}
</script>

<style scoped>
.employees-container {
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
  max-height: 90vh;
  border: 1px solid rgba(235, 238, 245, 0.5);
}

.form-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 1;
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
  gap: 1.5rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.form-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
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
  position: sticky;
  bottom: 0;
  background-color: white;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
  
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
}
</style> 