<template>
  <div class="medicines-list-page">
    <!-- Page header with title and add button -->
    <div class="page-header">
      <h1 class="page-title">Medicines List</h1>
      <el-button type="primary" @click="navigateToAddMedicine">
        <el-icon><i-ep-plus /></el-icon>
        Add New Medicine
      </el-button>
    </div>
    
    <!-- Search and filters section -->
    <div class="card filters-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="Search">
          <el-input 
            v-model="searchQuery" 
            placeholder="Search medicine name or code" 
            clearable 
            @input="handleSearch" />
        </el-form-item>
        
        <el-form-item label="Generic Code">
          <el-input 
            v-model="filters.genericCode" 
            placeholder="Filter by code" 
            clearable 
            @input="applyFilters" />
        </el-form-item>
        
        <el-form-item label="Price Range">
          <el-select 
            v-model="filters.priceRange" 
            placeholder="Select price range" 
            clearable 
            @change="applyFilters">
            <el-option label="Under $5" value="under5" />
            <el-option label="$5 - $20" value="5to20" />
            <el-option label="$20 - $50" value="20to50" />
            <el-option label="Over $50" value="over50" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Price Updated">
          <el-select 
            v-model="filters.fdaUpdated" 
            placeholder="Price Updated" 
            clearable 
            @change="applyFilters">
            <el-option label="Yes" :value="true" />
            <el-option label="No" :value="false" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Expiry Status">
          <el-select 
            v-model="filters.expiryStatus" 
            placeholder="Select status" 
            clearable 
            @change="applyFilters">
            <el-option label="Expired" value="expired" />
            <el-option label="Near Expiry" value="near-expiry" />
            <el-option label="Safe" value="safe" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Stock Level">
          <el-select 
            v-model="filters.stockLevel" 
            placeholder="Stock level" 
            clearable 
            @change="applyFilters">
            <el-option label="Low" value="low" />
            <el-option label="Out of Stock" value="out-of-stock" />
            <el-option label="In Stock" value="in-stock" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="applyFilters">Apply Filters</el-button>
          <el-button @click="resetFilters">Reset</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- Medicines table -->
    <div class="card table-card">
      <el-table
        v-loading="medicinesStore.loading"
        :data="filteredMedicines"
        style="width: 100%"
        border
        stripe
        @selection-change="handleSelectionChange">
        
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="genericCode" label="Generic Code" sortable width="120" />
        
        <el-table-column label="Medicine Name" width="250">
          <template #default="scope">
            <div>
              <div class="medicine-name">{{ scope.row.name }}</div>
              <div class="company-name">{{ scope.row.companyName }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="quantity" label="Quantity" width="100" sortable />
        
        <el-table-column prop="sellingPrice" label="Selling Price" width="120" sortable>
          <template #default="scope">
            ${{ scope.row.sellingPrice.toFixed(2) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Updated Price?" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.fda ? 'success' : 'warning'" size="small">
              {{ scope.row.fda ? 'Yes' : 'No' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="Expiry Date" width="150" sortable>
          <template #default="scope">
            <div>{{ formatDate(scope.row.expiryDate) }}</div>
            <div>
              <span 
                :class="['status-pill', getExpiryStatusClass(scope.row.expiryDate)]">
                {{ getExpiryStatus(scope.row.expiryDate) }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" fixed="right" width="180">
          <template #default="scope">
            <div class="action-buttons" style="gap">
              <el-button 
                size="small" 
                @click="viewMedicineDetails(scope.row.id)"
                type="primary"
                plain>
                View
              </el-button>
              <el-button 
                size="small" 
                @click="editMedicine(scope.row.id)"
                type="warning"
                plain>
                Edit
              </el-button>
              <el-button 
                size="small" 
                @click="deleteMedicineConfirm(scope.row)"
                type="danger"
                plain>
                Delete
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredMedicines.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    
    <!-- Medicine Edit Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="Edit Medicine"
      width="80%"
      destroy-on-close>
      <medicine-edit-form 
        v-if="editDialogVisible" 
        :medicine-id="selectedMedicineId" 
        @saved="handleMedicineUpdated"
        @cancel="editDialogVisible = false" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMedicinesStore } from '@/store/medicines'
import MedicineEditForm from '@/components/medicines/MedicineEditForm.vue'

const router = useRouter()
const medicinesStore = useMedicinesStore()

const searchQuery = ref('')
const selectedMedicines = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const editDialogVisible = ref(false)
const selectedMedicineId = ref(null)
const filters = ref({
  genericCode: '',
  priceRange: '',
  fdaUpdated: '',
  expiryStatus: '',
  stockLevel: ''
})

onMounted(() => {
  medicinesStore.fetchMedicines() // This will use your mock data for now
})

const filteredMedicines = computed(() => {
  let medicines = [...medicinesStore.medicines]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    medicines = medicines.filter(medicine => 
      medicine.name.toLowerCase().includes(query) || 
      medicine.genericCode.toLowerCase().includes(query)
    )
  }
  
  // Apply filters
  if (filters.value.genericCode) {
    medicines = medicines.filter(medicine => 
      medicine.genericCode.toLowerCase().includes(filters.value.genericCode.toLowerCase())
    )
  }
  
  if (filters.value.priceRange) {
    medicines = medicines.filter(medicine => {
      const price = medicine.sellingPrice
      switch (filters.value.priceRange) {
        case 'under5':
          return price < 5
        case '5to20':
          return price >= 5 && price < 20
        case '20to50':
          return price >= 20 && price < 50
        case 'over50':
          return price >= 50
        default:
          return true
      }
    })
  }
  
  if (filters.value.fdaUpdated !== '') {
    medicines = medicines.filter(medicine => medicine.fda === filters.value.fdaUpdated)
  }
  
  if (filters.value.expiryStatus) {
    medicines = medicines.filter(medicine => {
      const status = getExpiryStatus(medicine.expiryDate)
      return status.toLowerCase() === filters.value.expiryStatus
    })
  }
  
  if (filters.value.stockLevel) {
    medicines = medicines.filter(medicine => {
      const quantity = medicine.quantity
      switch (filters.value.stockLevel) {
        case 'low':
          return quantity > 0 && quantity < 50
        case 'out-of-stock':
          return quantity <= 0
        case 'in-stock':
          return quantity >= 50
        default:
          return true
      }
    })
  }
  
  return medicines
})

function handleSearch() { currentPage.value = 1 }
function applyFilters() { currentPage.value = 1 }
function resetFilters() {
  searchQuery.value = ''
  filters.value = {
    genericCode: '',
    priceRange: '',
    fdaUpdated: '',
    expiryStatus: '',
    stockLevel: ''
  }
  currentPage.value = 1
}
function handleSelectionChange(selection) { selectedMedicines.value = selection }
function handleSizeChange(size) { pageSize.value = size }
function handleCurrentChange(page) { currentPage.value = page }
function navigateToAddMedicine() { router.push({ name: 'AddMedicine' }) }
function viewMedicineDetails(id) { router.push({ name: 'MedicineDetail', params: { id } }) }
function editMedicine(id) {
  selectedMedicineId.value = id
  editDialogVisible.value = true
}
function deleteMedicineConfirm(medicine) {
  // Use Element Plus MessageBox here, e.g.:
  // import { ElMessageBox, ElMessage } from 'element-plus'
  // ElMessageBox.confirm(...)
}
function handleMedicineUpdated() {
  editDialogVisible.value = false
  medicinesStore.fetchMedicines()
}
function formatDate(dateString) { return new Date(dateString).toLocaleDateString() }
function getExpiryStatus(dateString) {
  const expiryDate = new Date(dateString)
  const today = new Date()
  const diffTime = expiryDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return 'Expired'
  } else if (diffDays < 90) {
    return 'Near Expiry'
  } else {
    return 'Safe'
  }
}
function getExpiryStatusClass(dateString) {
  const status = getExpiryStatus(dateString)
  switch (status) {
    case 'Expired':
      return 'status-expired'
    case 'Near Expiry':
      return 'status-near-expiry'
    default:
      return 'status-safe'
  }
}
</script>

<style scoped>
.filters-card {
  margin-bottom: 20px;
}

.table-card {
  overflow-x: auto;
}

.medicine-name {
  font-weight: 500;
}

.company-name {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 1px;
}
</style> 