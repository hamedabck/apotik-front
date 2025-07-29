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
        <h3 class="section-title">
          Doctors
          <span v-if="doctorStore.pharmacyInfo" class="pharmacy-info">
            - {{ doctorStore.pharmacyInfo.name }}
          </span>
        </h3>
        <el-button 
          type="primary" 
          icon="el-icon-plus"
          @click="openForm()"
          :loading="doctorStore.loading"
        >
          Add New Doctor
        </el-button>
      </div>

      <!-- Loading State -->
      <div v-if="doctorStore.loading && doctors.length === 0" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- Error State -->
      <div v-else-if="doctorStore.error && doctors.length === 0" class="error-container">
        <el-alert
          title="Failed to load doctors"
          type="error"
          :description="doctorStore.error"
          show-icon
          :closable="false">
        </el-alert>
        <div class="error-actions">
          <el-button @click="loadDoctors" type="primary">Try Again</el-button>
        </div>
      </div>

      <!-- Data Table -->
      <data-table
        v-else
        :columns="columns"
        :items="doctors"
        @edit="openForm"
        @delete="confirmDelete"
        :loading="doctorStore.loading"
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
        <template #created_at="{ item }">
          <span>{{ formatDate(item.created_at) }}</span>
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
              <label class="form-label">Doctor Name *</label>
              <el-input
                v-model="form.name"
                placeholder="e.g., Dr. John Smith"
                required
                :disabled="formLoading"
              />
              <div v-if="formErrors.name" class="form-error">
                {{ formErrors.name }}
              </div>
            </div>

            <!-- Medical Council Number -->
            <div class="form-group">
              <label class="form-label">Medical Council Number *</label>
              <el-input
                v-model="form.medical_council_number"
                placeholder="e.g., IDM-12345678"
                required
                :disabled="formLoading"
              />
              <div v-if="formErrors.medical_council_number" class="form-error">
                {{ formErrors.medical_council_number }}
              </div>
            </div>

            <!-- Specialties -->
            <div class="form-group">
              <label class="form-label">Specialties *</label>
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
                    :disabled="formLoading"
                  >
                    <template #default="{ item }">
                      <div>{{ item.value }}</div>
                    </template>
                  </el-autocomplete>
                  <el-button 
                    size="small" 
                    @click="addSpecialty"
                    :disabled="formLoading"
                  >
                    Add
                  </el-button>
                </div>
              </div>
              <div v-if="formErrors.specialties" class="form-error">
                {{ formErrors.specialties }}
              </div>
            </div>

            <!-- Contact Info -->
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <el-input
                v-model="form.contact_number"
                placeholder="e.g., +62 812 3456 7890"
                :disabled="formLoading"
              />
              <div v-if="formErrors.contact_number" class="form-error">
                {{ formErrors.contact_number }}
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label">Email</label>
              <el-input
                v-model="form.email"
                placeholder="e.g., doctor@example.com"
                :disabled="formLoading"
              />
              <div v-if="formErrors.email" class="form-error">
                {{ formErrors.email }}
              </div>
            </div>

            <!-- General form errors -->
            <div v-if="formErrors.general" class="form-error general-error">
              {{ formErrors.general }}
            </div>

            <div class="form-actions">
              <el-button @click="closeForm" :disabled="formLoading">
                Cancel
              </el-button>
              <el-button 
                type="primary" 
                native-type="submit"
                :disabled="!isFormValid || formLoading"
                :loading="formLoading"
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
import { ElMessageBox } from 'element-plus'
import BaseModal from '../BaseModal.vue'
import DataTable from '../DataTable.vue'
import { useDoctorStore } from '@/stores/doctorStore'
import { formatDate } from '@/utils/dateUtils'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])
const doctorStore = useDoctorStore()

// Table configuration
const columns = [
  { key: 'id', label: 'ID', width: '70' },
  { key: 'name', label: 'Doctor Name' },
  { key: 'medical_council_number', label: 'Medical Council #' },
  { key: 'specialties', label: 'Specialties' },
  // { key: 'contact_number', label: 'Contact' },
  // { key: 'created_at', label: 'Created' }
]

// Specialty suggestions
const specialtySuggestions = ref([
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
])

// Use store data
const doctors = computed(() => doctorStore.doctors)

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const formLoading = ref(false)
const formErrors = ref({})
const form = ref({
  name: '',
  medical_council_number: '',
  specialties: [],
  contact_number: '',
  email: ''
})
const specialtyInput = ref('')

// Computed properties
const isFormValid = computed(() => {
  return form.value.name && 
         form.value.medical_council_number && 
         form.value.specialties.length > 0
})

// Load doctors on component mount
onMounted(async () => {
  await loadDoctors()
  await loadSpecialtySuggestions()
})

// Methods
const loadDoctors = async () => {
  try {
    await doctorStore.fetchDoctors()
  } catch (error) {
    console.error('Failed to load doctors:', error)
  }
}

// Load specialty suggestions from API
const loadSpecialtySuggestions = async () => {
  try {
    const apiSpecialties = await doctorStore.fetchSpecialties()
    // Merge with default suggestions
    const allSpecialties = [...new Set([...specialtySuggestions.value, ...apiSpecialties])]
    specialtySuggestions.value = allSpecialties.sort()
  } catch (error) {
    console.error('Failed to load specialty suggestions:', error)
    // Continue with default suggestions
  }
}

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  formErrors.value = {}
  
  if (item) {
    form.value = { 
      name: item.name,
      medical_council_number: item.medical_council_number,
      specialties: [...item.specialties], // Make a copy of the array
      contact_number: item.contact_number || '',
      email: item.email || ''
    }
  } else {
    form.value = {
      name: '',
      medical_council_number: '',
      specialties: [],
      contact_number: '',
      email: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  formErrors.value = {}
  form.value = {
    name: '',
    medical_council_number: '',
    specialties: [],
    contact_number: '',
    email: ''
  }
  specialtyInput.value = ''
}

const saveItem = async () => {
  if (!isFormValid.value) return

  formLoading.value = true
  formErrors.value = {}

  try {
    const doctorData = { ...form.value }

    if (editingItem.value) {
      // Update existing item
      await doctorStore.updateDoctor(editingItem.value.id, doctorData)
    } else {
      // Add new item
      await doctorStore.addDoctor(doctorData)
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving doctor:', error)
    
    // Handle validation errors
    if (error.response?.data) {
      const errorData = error.response.data
      
      // Handle field-specific errors
      Object.keys(errorData).forEach(field => {
        if (Array.isArray(errorData[field])) {
          formErrors.value[field] = errorData[field][0]
        } else if (typeof errorData[field] === 'string') {
          formErrors.value[field] = errorData[field]
        }
      })
      
      // Handle general errors
      if (errorData.detail) {
        formErrors.value.general = errorData.detail
      }
    } else {
      formErrors.value.general = 'An unexpected error occurred. Please try again.'
    }
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    await doctorStore.deleteDoctor(item.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting doctor:', error)
    }
  }
}

// Tags handling
const querySpecialtySearch = (queryString, callback) => {
  const results = queryString
    ? specialtySuggestions.value.filter(item => {
        return item.toLowerCase().includes(queryString.toLowerCase())
      })
    : specialtySuggestions.value
  
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
    if (!specialtySuggestions.value.includes(specialty)) {
      specialtySuggestions.value.push(specialty)
      specialtySuggestions.value.sort()
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

.pharmacy-info {
  font-size: 0.875rem;
  font-weight: 400;
  color: #64748b;
  margin-left: 0.5rem;
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.error-actions {
  margin-top: 1rem;
}

.general-error {
  margin-top: 0.375rem;
  color: #e11d48;
  font-size: 0.75rem;
}
</style> 