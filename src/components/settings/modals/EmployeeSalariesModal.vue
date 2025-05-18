<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Employee Salaries Management"
    @close="$emit('close')"
  >
    <div class="employee-salaries-container">
      <!-- Month/Year Selector -->
      <div class="period-selector">
        <el-date-picker
          v-model="selectedPeriod"
          type="month"
          placeholder="Select month/year"
          format="MMMM yyyy"
          value-format="yyyy-MM"
          @change="loadSalariesForPeriod"
        />
      </div>

      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Employee Salaries</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Salary Record
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="salaries"
        @edit="openForm"
        @delete="confirmDelete"
      >
      </data-table>
      
      <!-- Debug info -->
      <div v-if="salaries.length === 0" class="debug-info">
        <p>No salary records found for the selected period ({{ formatPeriod(selectedPeriod) }}).</p>
        <p>Try adding a record using the button above.</p>
      </div>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Salary Record' : 'Add New Salary Record' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Employee -->
            <div class="form-group">
              <label class="form-label">Employee</label>
              <el-select
                v-model="form.employeeId"
                placeholder="Select Employee"
                style="width: 100%"
                required
              >
                <el-option
                  v-for="employee in employees"
                  :key="employee.id"
                  :label="employee.name"
                  :value="employee.id"
                />
              </el-select>
            </div>

            <!-- Month/Year -->
            <div class="form-group">
              <label class="form-label">Period</label>
              <el-date-picker
                v-model="form.period"
                type="month"
                placeholder="Select month/year"
                format="MMMM yyyy"
                value-format="yyyy-MM"
                style="width: 100%"
                required
              />
            </div>

            <!-- Monthly Salary -->
            <div class="form-group">
              <label class="form-label">Monthly Salary</label>
              <el-input-number
                v-model="form.monthlySalary"
                :min="0"
                :precision="2"
                :step="100"
                style="width: 100%"
                required
              />
            </div>

            <!-- Insurance -->
            <div class="form-group">
              <label class="form-label">Insurance</label>
              <el-input-number
                v-model="form.insurance"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                required
              />
            </div>

            <!-- Reward -->
            <div class="form-group">
              <label class="form-label">Reward</label>
              <el-input-number
                v-model="form.reward"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                required
              />
            </div>

            <!-- Penalty -->
            <div class="form-group">
              <label class="form-label">Penalty</label>
              <el-input-number
                v-model="form.penalty"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
                required
              />
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
import { ref, computed, onMounted } from 'vue'
import BaseModal from '../BaseModal.vue'
import DataTable from '../DataTable.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Current period
const selectedPeriod = ref(new Date().toISOString().slice(0, 7)) // Current month in YYYY-MM format

// Table configuration
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'monthlySalary', label: 'Monthly Salary' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'reward', label: 'Reward' },
  { key: 'penalty', label: 'Penalty' },
  { key: 'total', label: 'Total' }
]

// Dummy employees data
const employees = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Robert Johnson' }
]

// Dummy salaries data
const allSalaries = ref([
  {
    id: 1,
    employeeId: 1,
    employeeName: 'John Doe',
    period: '2024-05',
    monthlySalary: 3000,
    insurance: 300,
    reward: 200,
    penalty: 50,
    total: 2850 // monthlySalary + reward - insurance - penalty
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: 'Jane Smith',
    period: '2024-05',
    monthlySalary: 3500,
    insurance: 350,
    reward: 300,
    penalty: 0,
    total: 3450
  }
])

const salaries = ref([])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  employeeId: '',
  period: '',
  monthlySalary: 0,
  insurance: 0,
  reward: 0,
  penalty: 0
})

// Computed properties
const isFormValid = computed(() => {
  return form.value.employeeId && 
         form.value.period && 
         form.value.monthlySalary >= 0;
})

// Methods
const loadSalariesForPeriod = () => {
  console.log("Loading salaries for period:", selectedPeriod.value)
  console.log("All available salaries:", allSalaries.value)
  salaries.value = allSalaries.value.filter(salary => salary.period === selectedPeriod.value)
  console.log("Filtered salaries:", salaries.value)
}

const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      employeeId: '',
      period: selectedPeriod.value, // Always use the currently selected period
      monthlySalary: 0,
      insurance: 0,
      reward: 0,
      penalty: 0
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    employeeId: '',
    period: selectedPeriod.value,
    monthlySalary: 0,
    insurance: 0,
    reward: 0,
    penalty: 0
  }
}

const saveItem = () => {
  if (!isFormValid.value) return

  const employeeData = employees.find(e => e.id === form.value.employeeId)
  if (!employeeData) return

  // Ensure we're using the selected period if not editing
  if (!editingItem.value) {
    form.value.period = selectedPeriod.value
  }

  const salaryData = {
    ...form.value,
    employeeName: employeeData.name,
    total: calculateTotal(form.value)
  }

  console.log("Saving salary data:", salaryData)

  if (editingItem.value) {
    // Update existing item
    const index = allSalaries.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      allSalaries.value[index] = {
        ...allSalaries.value[index],
        ...salaryData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...allSalaries.value.map(item => item.id), 0) + 1
    const newRecord = {
      id: newId,
      ...salaryData
    }
    console.log("Adding new record:", newRecord)
    allSalaries.value.push(newRecord)
  }
  
  // Force Vue to recognize the change
  allSalaries.value = [...allSalaries.value]
  
  console.log("Updated allSalaries:", allSalaries.value)
  loadSalariesForPeriod() // Refresh the displayed salaries
  console.log("After refresh, displayed salaries:", salaries.value)
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this salary record?')) {
    const index = allSalaries.value.findIndex(salary => salary.id === item.id)
    if (index !== -1) {
      allSalaries.value.splice(index, 1)
      loadSalariesForPeriod() // Refresh the displayed salaries
    }
  }
}

const calculateTotal = (salaryRecord) => {
  return salaryRecord.monthlySalary + salaryRecord.reward - salaryRecord.insurance - salaryRecord.penalty
}

const formatPeriod = (period) => {
  if (!period) return '';
  const [year, month] = period.split('-');
  const date = new Date(`${year}-${month}-01`);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Load initial data
onMounted(() => {
  loadSalariesForPeriod()
})
</script>

<style scoped>
.employee-salaries-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.period-selector {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
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
  max-width: 500px;
  max-height: 80vh;
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
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group:nth-child(1),
.form-group:nth-child(2) {
  grid-column: span 2;
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
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.debug-info {
  padding: 1rem;
  margin: 1rem 0;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  color: #0369a1;
}
</style> 