<template>
  <el-form :model="modelValue" label-width="180px" class="add-medicine-form">
    <div class="stock-entries">
      <h3 class="form-section-title">
        Stock Batches
      </h3>
      
      <!-- Stock Form Card -->
      <div class="stock-form-card">
        <div class="stock-header">
          <h4>Add Stock Batch</h4>
          <el-button 
            type="primary" 
            size="small"
            @click="addNewBatchToTable"
            class="add-button"
          >
            <el-icon><i-ep-plus /></el-icon> {{ isEditing ? 'Update Batch' : 'Add to Table' }}
          </el-button>
        </div>
        
        <div class="stock-form-content">
          <!-- First row: Batch Number and Price -->
          <div class="form-row">
            <div class="form-group">
              <label class="compact-label">Batch Number</label>
              <el-input 
                v-model="currentBatch.batchNumber" 
                placeholder="Enter batch number"
                class="compact-input"
              />
            </div>
            
            <div class="form-group">
              <label class="compact-label">Price</label>
              <el-input 
                v-model="currentBatch.price" 
                type="number"
                placeholder="Price"
                @input="updateStock"
                class="compact-input"
              />
            </div>

            <div class="form-group">
              <label class="compact-label">Expiry Date</label>
              <el-date-picker
                v-model="currentBatch.expiryDate"
                type="date"
                placeholder="Select expiry date"
                class="compact-input"
              />
            </div>
            <div class="form-group">
              <label class="compact-label">Total Quantity</label>
              <el-input 
                v-model="currentBatch.quantity" 
                type="number"
                disabled
                placeholder="Total quantity"
                class="compact-input"
              />
              <span class="help-text">Sum of all location quantities</span>
            </div>
          </div>
          
          <!-- Second row: Locations -->
          <div class="form-row">
            <div class="form-group locations-group">
              <div class="locations-header">
                <label class="compact-label">Storage Locations</label>
                <el-button 
                  type="primary" 
                  size="small"
                  @click="addNewLocation"
                  circle
                  plain
                >
                  <el-icon><i-ep-plus /> + </el-icon>
                </el-button>
              </div>
              
              <div class="locations-list">
                <div v-for="(location, index) in currentBatch.locations" :key="index" class="location-item">
                  <el-select 
                    v-model="location.warehouse" 
                    placeholder="Select storage"
                    class="location-select"
                  >
                    <el-option 
                      v-for="storage in availableStorages" 
                      :key="storage.id" 
                      :label="storage.name" 
                      :value="storage.name"
                    />
                  </el-select>
                  
                  <el-input-number 
                    v-model="location.quantity" 
                    :min="0"
                    placeholder="Quantity"
                    @change="updateTotalQuantity"
                    class="quantity-input"
                  />
                  
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="removeLocation(index)"
                    circle
                    plain
                  >
                    <el-icon><i-ep-delete /> - </el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Third row: Total Quantity -->
          <div class="form-row">

          </div>
        </div>
      </div>
      
      <!-- Stock Table -->
      <div class="stock-table-container" v-if="modelValue.length > 0">
        <h4 class="table-title">Stock Batches Table</h4>
        <el-table :data="modelValue" stripe style="width: 100%" border>
          <el-table-column prop="batchNumber" label="Batch Number" width="150" />
          <el-table-column prop="price" label="Price" width="120" />
          <el-table-column prop="expiryDate" label="Expiry Date" width="120">
            <template #default="scope">
              {{ formatDate(scope.row.expiryDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="locations" label="Locations" min-width="300">
            <template #default="scope">
              <el-tag
                v-for="(location, index) in scope.row.locations"
                :key="index"
                size="small"
                effect="light"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ location.warehouse }}: {{ location.quantity }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="Total Quantity" width="120" />
          <el-table-column label="Operations" width="200">
            <template #default="scope">
              <el-button
                size="small"
                @click="editBatch(scope.$index)"
                type="primary"
                plain
              >
                Edit
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                @click="removeBatch(scope.$index)"
              >
                Delete
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="no-data-message" v-else>
        <p>No stock batches added yet. Use the form above to add batches.</p>
      </div>
    </div>
  </el-form>
</template>

<script setup>
import { ref, reactive, defineProps, defineEmits, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useStorageStore } from '@/stores/storageStore'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const isEditing = ref(false)
const storageStore = useStorageStore()

// Get available storage locations from the store
const availableStorages = computed(() => storageStore.storages)

const currentBatch = reactive({
  batchNumber: '',
  price: 0,
  expiryDate: '',
  quantity: 0,
  locations: [
    {
      warehouse: availableStorages.value[0]?.name || '',
      quantity: 0
    }
  ]
})

const updateStock = () => {
  emit('update:modelValue', props.modelValue)
}

const updateTotalQuantity = () => {
  currentBatch.quantity = currentBatch.locations.reduce((sum, location) => sum + (location.quantity || 0), 0)
}

const addNewLocation = () => {
  currentBatch.locations.push({
    warehouse: '',
    quantity: 0
  })
}

const removeLocation = (index) => {
  currentBatch.locations.splice(index, 1)
  if (currentBatch.locations.length === 0) {
    addNewLocation()
  }
  updateTotalQuantity()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

const addNewBatchToTable = () => {
  if (!currentBatch.batchNumber) {
    ElMessage({
      type: 'warning',
      message: 'Please enter a batch number'
    })
    return
  }

  if (!currentBatch.locations.some(loc => loc.quantity > 0)) {
    ElMessage({
      type: 'warning',
      message: 'Please add at least one location with quantity'
    })
    return
  }
  
  props.modelValue.push({...currentBatch})
  updateStock()
  
  // Reset current batch
  Object.assign(currentBatch, {
    batchNumber: '',
    price: 0,
    expiryDate: '',
    quantity: 0,
    locations: [
      {
        warehouse: availableStorages.value[0]?.name || '',
        quantity: 0
      }
    ]
  })
  isEditing.value = false
}

const editBatch = (index) => {
  Object.assign(currentBatch, {...props.modelValue[index]})
  props.modelValue.splice(index, 1)
  updateStock()
  isEditing.value = true
}

const removeBatch = (index) => {
  props.modelValue.splice(index, 1)
  updateStock()
}
</script>

<style scoped>
.stock-form-card {
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: white;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.stock-header h4 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.stock-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
  margin-bottom: 0;
}

.locations-group {
  flex: 1;
  min-width: 100%;
}

.locations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.locations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.location-select {
  flex: 2;
}

.quantity-input {
  flex: 1;
}

.compact-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #606266;
  margin-bottom: 5px;
}

.compact-input {
  width: 100%;
}

.help-text {
  display: block;
  font-size: 0.75rem;
  color: #909399;
  margin-top: 3px;
}

.table-title {
  margin-bottom: 15px;
  font-size: 1rem;
  color: var(--primary-color);
}

.no-data-message {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 30px;
}

.form-section-title {
  margin-top: 30px;
  margin-bottom: 20px;
  font-size: 1.1rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-date-editor.el-input) {
  width: 100%;
}
</style> 