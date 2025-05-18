<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Doctors List"
    @close="$emit('close')"
  >
    <div class="doctors-list-container">
      <!-- Add New Button -->
      <div class="action-header">
        <h3 class="section-title">Doctors</h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
        >
          Add New Doctor
        </el-button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="doctors"
        @edit="openForm"
        @delete="confirmDelete"
      >
        <template #specialties="{ item }">
          <div class="tags-container">
            <el-tag
              v-for="tag in item.specialties"
              :key="tag"
              size="small"
              effect="light"
              class="specialty-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </template>
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="form-modal-overlay">
        <div class="form-modal">
          <div class="form-modal-header">
            <h3 class="form-modal-title">
              {{ editingItem ? 'Edit Doctor' : 'Add New Doctor' }}
            </h3>
            <button class="form-close-button" @click="closeForm">
              <i class="el-icon-close"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveItem" class="form-content">
            <!-- Doctor Name -->
            <div class="form-group">
              <label class="form-label">Doctor Name</label>
              <el-input
                v-model="form.name"
                placeholder="e.g., Dr. John Smith"
                required
              />
            </div>

            <!-- Medical Council Number -->
            <div class="form-group">
              <label class="form-label">Medical Council Number</label>
              <el-input
                v-model="form.medicalCouncilNumber"
                placeholder="e.g., IDM-12345678"
                required
              />
            </div>

            <!-- Specialties -->
            <div class="form-group">
              <label class="form-label">Specialties</label>
              <div class="tags-input-container">
                <div class="tags-wrapper">
                  <el-tag
                    v-for="tag in form.specialties"
                    :key="tag"
                    closable
                    @close="removeTag(tag)"
                    size="small"
                    class="specialty-tag"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="tag-input-wrapper">
                  <el-autocomplete
                    v-model="specialtyInput"
                    :fetch-suggestions="querySpecialtySearch"
                    placeholder="Add specialty"
                    @select="handleSelectSpecialty"
                    @keyup.enter="addSpecialty"
                    class="tag-input"
                    :trigger-on-focus="false"
                  >
                    <template #default="{ item }">
                      <div>{{ item.value }}</div>
                    </template>
                  </el-autocomplete>
                  <el-button 
                    size="small" 
                    @click="addSpecialty"
                  >
                    Add
                  </el-button>
                </div>
              </div>
            </div>

            <!-- Contact Info -->
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <el-input
                v-model="form.contactNumber"
                placeholder="e.g., +62 812 3456 7890"
              />
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <el-input
                v-model="form.email"
                placeholder="e.g., doctor@example.com"
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
  { key: 'name', label: 'Doctor Name' },
  { key: 'medicalCouncilNumber', label: 'Medical Council #' },
  { key: 'specialties', label: 'Specialties' },
  { key: 'contactNumber', label: 'Contact' }
]

// Specialty suggestions
const specialtySuggestions = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine',
  'Gynecology',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Rheumatology',
  'Urology',
  'Pharmacist'
]

// Dummy data
const doctors = ref([
  {
    id: 1,
    name: 'Dr. Anwar Ibrahim',
    medicalCouncilNumber: 'IDM-12345678',
    specialties: ['Cardiology', 'Internal Medicine'],
    contactNumber: '+62 812 3456 7890',
    email: 'anwar.ibrahim@example.com'
  },
  {
    id: 2,
    name: 'Dr. Siti Nurhaliza',
    medicalCouncilNumber: 'IDM-87654321',
    specialties: ['Pediatrics'],
    contactNumber: '+62 812 9876 5432',
    email: 'siti.nurhaliza@example.com'
  }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  medicalCouncilNumber: '',
  specialties: [],
  contactNumber: '',
  email: ''
})
const specialtyInput = ref('')

// Computed properties
const isFormValid = computed(() => {
  return form.value.name && 
         form.value.medicalCouncilNumber && 
         form.value.specialties.length > 0
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { 
      ...item,
      specialties: [...item.specialties] // Make a copy of the array
    }
  } else {
    form.value = {
      name: '',
      medicalCouncilNumber: '',
      specialties: [],
      contactNumber: '',
      email: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    name: '',
    medicalCouncilNumber: '',
    specialties: [],
    contactNumber: '',
    email: ''
  }
  specialtyInput.value = ''
}

const saveItem = () => {
  if (!isFormValid.value) return

  const doctorData = { ...form.value }

  if (editingItem.value) {
    // Update existing item
    const index = doctors.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      doctors.value[index] = {
        ...doctors.value[index],
        ...doctorData
      }
    }
  } else {
    // Add new item
    const newId = Math.max(...doctors.value.map(item => item.id), 0) + 1
    doctors.value.push({
      id: newId,
      ...doctorData
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this doctor?')) {
    doctors.value = doctors.value.filter(i => i.id !== item.id)
  }
}

// Tags handling
const querySpecialtySearch = (queryString, callback) => {
  const results = queryString
    ? specialtySuggestions.filter(item => {
        return item.toLowerCase().includes(queryString.toLowerCase())
      })
    : specialtySuggestions
  
  // Map to the format expected by el-autocomplete
  callback(results.map(item => ({ value: item })))
}

const handleSelectSpecialty = (item) => {
  addSpecialty(item.value)
  specialtyInput.value = ''
}

const addSpecialty = (value = null) => {
  const specialty = value || specialtyInput.value
  if (specialty && !form.value.specialties.includes(specialty)) {
    form.value.specialties.push(specialty)
    
    // Add to suggestions if it's not already there
    if (!specialtySuggestions.includes(specialty)) {
      specialtySuggestions.push(specialty)
    }
  }
  specialtyInput.value = ''
}

const removeTag = (tag) => {
  form.value.specialties = form.value.specialties.filter(item => item !== tag)
}
</script>

<style scoped>
.doctors-list-container {
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

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.specialty-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.tags-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 32px;
  padding: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.tag-input-wrapper {
  display: flex;
  gap: 8px;
}

.tag-input {
  flex: 1;
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
  margin-top: 1rem;
}
</style> 