<template>
  <div class="data-table">
    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <i class="el-icon-search search-icon"></i>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <el-table
        :data="filteredItems"
        stripe
        border
        style="width: 100%"
        :empty-text="'No items found'"
      >
        <el-table-column
          v-for="(column, index) in columns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          align="left"
          :width="column.width || (index === 0 ? '70' : '')"
        >
          <template #default="scope">
            <slot :name="column.key" :item="scope.row">
              {{ scope.row[column.key] }}
            </slot>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="120" align="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                size="small"
                type="primary"
                plain
                @click="$emit('edit', scope.row)"
                icon="el-icon-edit"
              >
                Edit
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                @click="$emit('delete', scope.row)"
                icon="el-icon-delete"
              >
                Delete
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  items: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete'])

const searchQuery = ref('')

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items

  const query = searchQuery.value.toLowerCase()
  return props.items.filter(item => {
    return props.columns.some(column => {
      const value = item[column.key]
      return value && value.toString().toLowerCase().includes(query)
    })
  })
})
</script>

<style scoped>
.data-table {
  width: 100%;
}

.search-container {
  margin-bottom: 1.25rem;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  max-width: 300px;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background-color: #f8fafc;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #4b70e2;
  box-shadow: 0 0 0 3px rgba(75, 112, 226, 0.2);
  background-color: #fff;
}

.table-container {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f8fafc !important;
  color: #64748b;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
}

:deep(.el-table td) {
  padding: 12px 16px;
  font-size: 0.875rem;
  color: #1e293b;
}
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 1px;
  align-items: center;
  justify-content: flex-end;
}

:deep(.el-button--small) {
  padding: 4px 4px;
  height: 20px;
  font-size: 0.9rem;
  min-width: 45px;
  margin-left: 1px;
}

:deep(.el-button [class*="el-icon-"]) {
  margin-right: 0px;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.25rem;
  line-height: 1;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #4b70e2;
  background-color: #4b70e2;
  border: 1px solid #4b70e2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  color: #4b70e2;
  background-color: #4b70e2;
  border-color: #4b70e2;
}
</style> 