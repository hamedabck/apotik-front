<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Customers Management"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <!-- Add New Button -->
      <div class="flex justify-end">
        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="openForm()"
        >
          Add New Customer
        </button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="tableColumns"
        :items="customers"
        @edit="openForm"
        @delete="confirmDelete"
      >
        <template #gender="{ item }">
          <span class="capitalize">{{ item.gender }}</span>
        </template>
      </data-table>

      <!-- Form Modal -->
      <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingItem ? 'Edit Customer' : 'Add New Customer' }}
          </h3>
          
          <form @submit.prevent="saveItem" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <!-- ID Number -->
              <div>
                <label class="block text-sm font-medium text-gray-700">ID Number</label>
                <input
                  v-model="form.idNumber"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <!-- Gender -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  v-model="form.gender"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <!-- Birthdate -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Birthdate</label>
                <input
                  v-model="form.birthdate"
                  type="date"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <!-- Insurance -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Insurance</label>
                <select
                  v-model="form.insuranceId"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select insurance</option>
                  <option
                    v-for="insurance in insurances"
                    :key="insurance.id"
                    :value="insurance.id"
                  >
                    {{ insurance.name }}
                  </option>
                </select>
              </div>

              <!-- Insurance Expiry -->
              <div>
                <label class="block text-sm font-medium text-gray-700">Insurance Expiry Date</label>
                <input
                  v-model="form.insuranceExpiry"
                  type="date"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  :disabled="!form.insuranceId"
                />
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

// Table configuration - compact view
const tableColumns = [
  { key: 'name', label: 'Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'idNumber', label: 'ID Number' }
]

// Dummy data
const customers = ref([
  {
    id: 1,
    name: 'John Doe',
    idNumber: 'ID123456',
    phone: '+1234567890',
    email: 'john@example.com',
    gender: 'male',
    birthdate: '1990-01-01',
    insuranceId: 1,
    insuranceExpiry: '2024-12-31'
  },
  {
    id: 2,
    name: 'Jane Smith',
    idNumber: 'ID789012',
    phone: '+0987654321',
    email: 'jane@example.com',
    gender: 'female',
    birthdate: '1992-05-15',
    insuranceId: 2,
    insuranceExpiry: '2024-06-30'
  }
])

// Dummy insurance data
const insurances = ref([
  { id: 1, name: 'Insurance A' },
  { id: 2, name: 'Insurance B' }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  idNumber: '',
  phone: '',
  email: '',
  gender: '',
  birthdate: '',
  insuranceId: '',
  insuranceExpiry: ''
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = {
      name: '',
      idNumber: '',
      phone: '',
      email: '',
      gender: '',
      birthdate: '',
      insuranceId: '',
      insuranceExpiry: ''
    }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = {
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    gender: '',
    birthdate: '',
    insuranceId: '',
    insuranceExpiry: ''
  }
}

const saveItem = () => {
  if (editingItem.value) {
    // Update existing item
    const index = customers.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      customers.value[index] = { ...editingItem.value, ...form.value }
    }
  } else {
    // Add new item
    const newId = Math.max(...customers.value.map(item => item.id), 0) + 1
    customers.value.push({
      id: newId,
      ...form.value
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this customer?')) {
    customers.value = customers.value.filter(i => i.id !== item.id)
  }
}
</script>