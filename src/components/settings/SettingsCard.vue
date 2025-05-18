<template>
  <div
    class="settings-card p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    @click="$emit('click')"
  >
    <h3 class="text-lg font-medium text-gray-800">{{ title }}</h3>
    <p class="text-sm text-gray-600 mt-2">Click to manage settings</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
})

defineEmits(['click'])
</script>

<style scoped>
.settings-card {
  border: 1px solid #e5e7eb;
}
</style> 