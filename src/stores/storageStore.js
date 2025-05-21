import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStorageStore = defineStore('storage', () => {
  const storages = ref([
    {
      id: 1,
      name: 'Main Storage',
      type: 'storage',
      description: 'Primary storage area for bulk inventory'
    },
    {
      id: 2,
      name: 'Shelf A1',
      type: 'shelf',
      description: 'Front shelf for common medications'
    },
    {
      id: 3,
      name: 'Refrigerated Storage',
      type: 'storage',
      description: 'Temperature controlled storage for sensitive medications'
    }
  ])

  const addStorage = (storage) => {
    storages.value.push(storage)
  }

  const updateStorage = (id, updatedStorage) => {
    const index = storages.value.findIndex(s => s.id === id)
    if (index !== -1) {
      storages.value[index] = { ...storages.value[index], ...updatedStorage }
    }
  }

  const deleteStorage = (id) => {
    storages.value = storages.value.filter(s => s.id !== id)
  }

  return {
    storages,
    addStorage,
    updateStorage,
    deleteStorage
  }
})