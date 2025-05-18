<template>
  <base-modal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Storages/Shelves Management"
    @close="$emit('close')"
  >
    <div class="space-y-4">
      <!-- Add New Button -->
      <div class="flex justify-end">
        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          @click="openForm()"
        >
          Add New Storage/Shelf
        </button>
      </div>

      <!-- Data Table -->
      <data-table
        :columns="columns"
        :items="storages"
        @edit="openForm"
        @delete="confirmDelete"
      />

      <!-- Form Modal -->
      <div v-if="showForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4">
            {{ editingItem ? 'Edit Storage/Shelf' : 'Add New Storage/Shelf' }}
          </h3>
          
          <form @submit.prevent="saveItem" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input
                v-model="form.name"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
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
import { ref } from 'vue'
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
  { key: 'name', label: 'Name' }
]

// Dummy data
const storages = ref([
  { id: 1, name: 'Main Storage' },
  { id: 2, name: 'Shelf A' },
  { id: 3, name: 'Shelf B' }
])

// Form state
const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: ''
})

// Form methods
const openForm = (item = null) => {
  editingItem.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = { name: '' }
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
  form.value = { name: '' }
}

const saveItem = () => {
  if (editingItem.value) {
    // Update existing item
    const index = storages.value.findIndex(item => item.id === editingItem.value.id)
    if (index !== -1) {
      storages.value[index] = { ...editingItem.value, ...form.value }
    }
  } else {
    // Add new item
    const newId = Math.max(...storages.value.map(item => item.id), 0) + 1
    storages.value.push({
      id: newId,
      ...form.value
    })
  }
  closeForm()
}

const confirmDelete = (item) => {
  if (confirm('Are you sure you want to delete this item?')) {
    storages.value = storages.value.filter(i => i.id !== item.id)
  }
}
</script>