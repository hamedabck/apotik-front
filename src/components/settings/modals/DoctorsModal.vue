<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Doctors Management"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <!-- Add New Button -->
      <div class="flex justify-end">
        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="openForm()"
        >
          Add New Doctor
        </button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="doctors"
        @edit="openForm"
        @delete="confirmDelete"
      >
        <template #specialty="{ item }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="spec in item.specialties"
              :key="spec"
              class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs"
            >
              {{ spec }}
            </span>
          </div>
        </template>
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingItem ? 'Edit Doctor' : 'Add New Doctor' }}
          </h3>
          
          <form @submit.prevent="saveItem" class="space-y-4">
            <!-- Doctor Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Doctor Name</label>
              <input
                v-model="form.name"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <!-- Medical Council Number -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Medical Council Number</label>
              <input
                v-model="form.medicalCouncilNumber"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <!-- Specialties -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Specialties</label>
              <div class="mt-1">
                <!-- Tag Input -->
                <div class="flex flex-wrap gap-2 p-2 border rounded-md">
                  <span
                    v-for="(specialty, index) in form.specialties"
                    :key="index"
                    class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center"
                  >
                    {{ specialty }}
                    <button
                      type="button"
                      class="ml-1 text-indigo-600 hover:text-indigo-800"
                      @click="removeSpecialty(index)"
                    >
                      &times;
                    </button>
                  </span>
                  <input
                    v-model="newSpecialty"
                    type="text"
                    class="flex-1 min-w-[120px] outline-none"
                    placeholder="Add specialty..."
                    @keydown.enter.prevent="addSpecialty"
                    @keydown.tab.prevent="addSpecialty"
                    @keydown.comma.prevent="addSpecialty"
                  />
                </div>
                <!-- Suggestions -->
                <div
                  v-if="showSuggestions && filteredSuggestions.length > 0"
                  class="mt-1 border rounded-md shadow-lg bg-white"
                >
                  <button
                    v-for="suggestion in filteredSuggestions"
                    :key="suggestion"
                    type="button"
                    class="w-full px-4 py-2 text-left hover:bg-gray-100"
                    @click="selectSuggestion(suggestion)"
                  >
                    {{ suggestion }}
                  </button>
                </div>
              </div>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                class="px-4 py-2 border rounded-lg hover:bg-gray-50"
                @click="closeForm"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {{ editingItem ? 'Update' : 'Save' }}
              </button>
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
  { key: 'medicalCouncilNumber', label: 'Medical Council Number' },
  { key: 'specialty', label: 'Specialties' }
]

// Dummy data
const doctors = ref([
  {
    id: 1,
    name: 'Dr. John Smith',
    medicalCouncilNumber: 'MC12345',
    specialties: ['Cardiology', 'Internal Medicine']
  },
  {
    id: 2,
    name: 'Dr. Sarah Johnson',
    medicalCouncilNumber: 'MC67890',
    specialties: ['Pediatrics', 'Family Medicine']
  }
])

// Common specialties for suggestions
const commonSpecialties = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Family Medicine',
  'Gastroenterology',
  'Internal Medicine',
  'Neurology',
  'Obstetrics',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology'
]

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  medicalCouncilNumber: '',
  specialties: []
})

// Specialty input state
const newSpecialty = ref('')
const showSuggestions = ref(false)

// Computed properties for specialty suggestions
const filteredSuggestions = computed(() => {
  if (!newSpecialty.value) return []
  
  const input = newSpecialty.value.toLowerCase()
  return commonSpecialties.filter(specialty => 
    specialty.toLowerCase().includes(input) &&
    !form.value.specialties.includes(specialty)
  )
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      name: '',
      medicalCouncilNumber: '',
      specialties: []
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
    specialties: []
  }
  newSpecialty.value = ''
  showSuggestions.value = false
}

const addSpecialty = () => {
  const specialty = newSpecialty.value.trim()
  if (specialty && !form.value.specialties.includes(specialty)) {
    form.value.specialties.push(specialty)
  }
  newSpecialty.value = ''
  showSuggestions.value = false
}

const removeSpecialty = (index) => {
  form.value.specialties.splice(index, 1)
}

const selectSuggestion = (suggestion) => {
  if (!form.value.specialties.includes(suggestion)) {
    form.value.specialties.push(suggestion)
  }
  newSpecialty.value = ''
  showSuggestions.value = false
}

const saveItem = () => {
  if (editingItem.value) {
    // Update existing item
    const index = doctors.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      doctors.value[index] = { ...editingItem.value, ...form.value }
    }
  } else {
    // Add new item
    const newId = Math.max(...doctors.value.map(item => item.id), 0) + 1
    doctors.value.push({
      id: newId,
      ...form.value
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this doctor?')) {
    doctors.value = doctors.value.filter(i => i.id !== item.id)
  }
}
</script>

<style scoped>
.specialty-input {
  min-width: 120px;
}
</style> 