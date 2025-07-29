<template>
  <div class="medicines-list-page">
    <!-- Page header with title and add button -->
    <div class="page-header">
      <h1 class="page-title">Medicines List</h1>
      <div class="header-actions">
        <el-button 
          v-if="selectedDrugs.length > 0"
          type="warning" 
          @click="updateSelectedDrugsPrices"
          :loading="updatingPrices">
          <el-icon><i-ep-refresh /></el-icon>
          Update {{ selectedDrugs.length }} Drug(s) to TTAC Price
        </el-button>
        <el-button 
          type="primary" 
          @click="openAddMedicineDialog"
          v-permission="'add_medicines'">
          <el-icon><i-ep-plus /></el-icon>
          Add New Medicine
        </el-button>
      </div>
    </div>
    
    <!-- Search and filters section -->
    <div class="card filters-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="Search">
                  <el-input 
          v-model="searchQuery" 
          placeholder="Search medicine name or generic code" 
          clearable 
          @input="handleSearch" />
        </el-form-item>
        
        <el-form-item label="Generic Code">
          <el-input 
            v-model="filters.genericCode" 
            placeholder="Filter by generic code" 
            clearable 
            @input="applyFilters" />
        </el-form-item>
        
        <el-form-item label="Days to Expire">
          <el-input 
            v-model.number="filters.daysToExpire" 
            type="number"
            placeholder="Max days to expire" 
            clearable 
            @input="applyFilters"
            style="width: 100px;"
            />
        </el-form-item>
        
        <el-form-item label="Stock Level">
          <el-select 
            v-model="filters.stockLevel" 
            placeholder="Stock level" 
            clearable
            style="width: 130px;" 
            @change="applyFilters">
            <el-option label="Low" value="low" />
            <el-option label="Out of Stock" value="out-of-stock" />
            <el-option label="In Stock" value="in-stock" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Price Status">
          <el-select 
            v-model="filters.priceStatus" 
            placeholder="Price change status" 
            clearable
            style="width: 140px;"
            @change="applyFilters">
            <el-option label="Need to Update" value="need-to-update" />
            <el-option label="Above TTAC" value="above-ttac" />
            <el-option label="Unchanged" value="unchanged" />
            <el-option label="No Price" value="no-price" />
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
        v-loading="pharmacyDrugStore.loading"
        :data="paginatedDrugs"
        style="width: 100%"
        border
        stripe
        @selection-change="handleSelectionChange">
        
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="generic_code" label="Generic Code" width="80" />
        
        <el-table-column label="Medicine Name" width="280">
          <template #header>
            <div class="name-header">
              <span>Medicine Name</span>
              <el-button 
                size="small" 
                type="primary" 
                plain
                @click="toggleLanguage"
                class="language-toggle">
                {{ showPersianNames ? 'EN' : 'فا' }}
              </el-button>
            </div>
          </template>
          <template #default="scope">
            <div>
              <div class="medicine-name">
                {{ showPersianNames 
                  ? (scope.row.persian_name || scope.row.english_name || 'N/A')
                  : (scope.row.english_name || scope.row.persian_name || 'N/A') 
                }}
              </div>
              <div class="company-name">
                {{ showPersianNames 
                  ? (scope.row.persian_company_name || scope.row.english_company_name || 'N/A')
                  : (scope.row.english_company_name || scope.row.persian_company_name || 'N/A') 
                }}
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Stock Info" width="140" sortable>
          <template #default="scope">
            <div class="stock-info">
              <div class="quantity-display">
                <strong>{{ scope.row.total_quantity || 0 }}</strong>
              </div>
              <el-tag :type="getStockStatusType(scope.row.total_quantity)" size="small">
                {{ getStockStatus(scope.row.total_quantity) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="selling_price" label="Selling Price" width="120" sortable>
          <template #default="scope">
            <small>ریال</small>{{ formatNumber(scope.row.selling_price || 0) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Generic Name" width="200">
          <template #default="scope">
            <span class="generic-name-text">{{ scope.row.generic_name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Expiry Status" width="140">
          <template #default="scope">
            <div v-if="scope.row.nearest_expiry_date">
              <el-tag :type="getExpiryStatusType(scope.row.days_to_expire)">
                {{ getExpiryStatus(scope.row.days_to_expire) }}
              </el-tag>
              <div class="expiry-date">
                <!-- {{ formatDate(scope.row.nearest_expiry_date) }} -->
                <span> <strong>{{ scope.row.days_to_expire }}</strong> days to expire</span>
              </div>
            </div>
            <el-tag v-else type="info">No Batches</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Price Status" width="140" sortable>
          <template #default="scope">
            <div class="ttac-price-status">
              <div class="ttac-price">
                <span v-if="scope.row.latest_price">
                  <small>ریال</small> {{ formatNumber(scope.row.latest_price) }}
                </span>
                <span v-else class="no-price-text">No TTAC Price</span>
              </div>
              <div class="price-status">
                <el-tag 
                  :type="getPriceChangeType(scope.row)" 
                  :class="['price-change-tag', getPriceChangeStatus(scope.row).toLowerCase().replace(' ', '-')]"
                  size="small">
                  {{ getPriceChangeStatus(scope.row) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Actions" fixed="right" width="130">
          <template #default="scope">
            <div class="action-buttons" style="gap">
              <el-button 
                size="small" 
                @click="viewDrugDetails(scope.row.id)"
                type="primary"
                plain>
                View
              </el-button>
              <el-button 
                size="small" 
                @click="editDrug(scope.row.id)"
                type="warning"
                plain
                v-permission="'edit_medicines'">
                Edit
              </el-button>
              <!-- <el-button 
                size="small" 
                @click="deleteDrugConfirm(scope.row)"
                type="danger"
                plain
                v-permission="'delete_medicines'">
                Delete
              </el-button> -->
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
          :total="filteredDrugs.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    
    <!-- Drug Detail Modal -->
    <drug-detail-modal
      v-model="detailModalVisible"
      :drug-id="selectedDrugForDetail"
      @edit-drug="handleEditFromDetail"
      width="70%" 
      />

    <!-- Add/Edit Medicine Dialog -->
    <add-medicine-dialog
      v-model="editDialogVisible"
      :drug-id="selectedDrugId"
      :mode="selectedDrugId ? 'edit' : 'add'"
      @saved="handleDrugUpdated"
      @deleted="handleDrugDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { useRolesStore } from '@/store/roles'
import { formatDate } from '@/utils/dateUtils'
import { ElMessageBox, ElMessage } from 'element-plus'
import DrugDetailModal from '@/components/drugs/DrugDetailModal.vue'
import AddMedicineDialog from '@/components/medicine/AddMedicineDialog.vue'

const router = useRouter()
const pharmacyDrugStore = usePharmacyDrugStore()
const rolesStore = useRolesStore()

const searchQuery = ref('')
const selectedDrugs = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const editDialogVisible = ref(false)
const selectedDrugId = ref(null)
const showPersianNames = ref(false)
const detailModalVisible = ref(false)
const selectedDrugForDetail = ref(null)
const updatingPrices = ref(false)
const filters = ref({
  genericCode: '',
  stockLevel: '',
  priceStatus: '',
  daysToExpire: ''
})

onMounted(() => {
  pharmacyDrugStore.fetchDrugs()
})

const filteredDrugs = computed(() => {
  let drugs = [...pharmacyDrugStore.drugs]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    drugs = drugs.filter(drug => 
      (drug.english_name && drug.english_name.toLowerCase().includes(query)) ||
      (drug.persian_name && drug.persian_name.toLowerCase().includes(query)) ||
      (drug.generic_code && drug.generic_code.toLowerCase().includes(query)) ||
      (drug.generic_name && drug.generic_name.toLowerCase().includes(query))
    )
  }
  
  // Apply filters
  if (filters.value.genericCode) {
    drugs = drugs.filter(drug => 
      drug.generic_code && drug.generic_code.toLowerCase().includes(filters.value.genericCode.toLowerCase())
    )
  }
  
  if (filters.value.daysToExpire !== '' && filters.value.daysToExpire !== null) {
    drugs = drugs.filter(drug => {
      const daysToExpire = drug.days_to_expire
      // Only filter drugs that have expiry data and are within the specified days
      return daysToExpire !== null && daysToExpire !== undefined && daysToExpire <= filters.value.daysToExpire
    })
  }
  
  if (filters.value.stockLevel) {
    drugs = drugs.filter(drug => {
      const quantity = drug.total_quantity || 0
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
  
  if (filters.value.priceStatus) {
    drugs = drugs.filter(drug => {
      const status = getPriceChangeStatus(drug)
      const filterValue = filters.value.priceStatus
      
      switch (filterValue) {
        case 'need-to-update':
          return status === 'Need to Update'
        case 'above-ttac':
          return status === 'Above TTAC'
        case 'unchanged':
          return status === 'Unchanged'
        case 'no-price':
          return status === 'No Price'
        default:
          return true
      }
    })
  }
  
  return drugs
})

const paginatedDrugs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDrugs.value.slice(start, end)
})

function handleSearch() { currentPage.value = 1 }
function applyFilters() { currentPage.value = 1 }
function resetFilters() {
  searchQuery.value = ''
  filters.value = {
    genericCode: '',
    stockLevel: '',
    priceStatus: '',
    daysToExpire: ''
  }
  currentPage.value = 1
}
function handleSelectionChange(selection) { selectedDrugs.value = selection }
function handleSizeChange(size) { pageSize.value = size }
function handleCurrentChange(page) { currentPage.value = page }
function openAddMedicineDialog() {
  selectedDrugId.value = null
  editDialogVisible.value = true
}
function viewDrugDetails(id) { 
  selectedDrugForDetail.value = id
  detailModalVisible.value = true
}
function editDrug(id) {
  selectedDrugId.value = id
  editDialogVisible.value = true
}

async function deleteDrugConfirm(drug) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${drug.english_name || drug.persian_name}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    await pharmacyDrugStore.deleteDrug(drug.id)
    ElMessage.success('Drug deleted successfully')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete drug')
    }
  }
}

function handleDrugUpdated() {
  editDialogVisible.value = false
  pharmacyDrugStore.fetchDrugs()
}

function handleDrugDeleted() {
  pharmacyDrugStore.fetchDrugs()
}

function getStockStatus(quantity) {
  if (!quantity || quantity <= 0) {
    return 'Out of Stock'
  } else if (quantity < 50) {
    return 'Low Stock'
  } else {
    return 'In Stock'
  }
}

function getStockStatusType(quantity) {
  if (!quantity || quantity <= 0) {
    return 'danger'
  } else if (quantity < 50) {
    return 'warning'
  } else {
    return 'success'
  }
}

function toggleLanguage() {
  showPersianNames.value = !showPersianNames.value
}

function handleEditFromDetail(drugId) {
  detailModalVisible.value = false
  editDrug(drugId)
}

async function updateSelectedDrugsPrices() {
  if (selectedDrugs.value.length === 0) {
    ElMessage.warning('Please select drugs to update')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to update ${selectedDrugs.value.length} drug(s) batch prices to their latest TTAC prices?`,
      'Confirm Price Update',
      {
        confirmButtonText: 'Update Prices',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    updatingPrices.value = true
    
    // Filter drugs that have latest_price and need updating
    const drugsToUpdate = selectedDrugs.value.filter(drug => {
      return drug.latest_price && drug.latest_price > 0
    })

    if (drugsToUpdate.length === 0) {
      ElMessage.warning('None of the selected drugs have valid TTAC prices to update to')
      return
    }

    // Update each drug's batch prices
    const updatePromises = drugsToUpdate.map(drug => 
      pharmacyDrugStore.updateDrugBatchesToTtacPrice(drug.id, drug.latest_price)
    )

    await Promise.all(updatePromises)
    
    // Refresh the drugs list to show updated data
    await pharmacyDrugStore.fetchDrugs()
    
    // Clear selection
    selectedDrugs.value = []
    
    ElMessage.success(`Successfully updated ${drugsToUpdate.length} drug(s) batch prices to TTAC prices`)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error updating drug prices:', error)
      ElMessage.error('Failed to update drug prices')
    }
  } finally {
    updatingPrices.value = false
  }
}

// Format number with thousands separators
function formatNumber(num) {
  if (!num && num !== 0) return '0'
  return Number(num).toLocaleString()
}

// Expiry status functions
function getExpiryStatus(daysToExpire) {
  if (daysToExpire === null || daysToExpire === undefined) return 'Unknown'
  if (daysToExpire < 0) return 'Expired'
  if (daysToExpire <= 30) return 'Near Expiry'
  if (daysToExpire <= 90) return 'Expiring Soon'
  return 'Safe'
}

function getExpiryStatusType(daysToExpire) {
  if (daysToExpire === null || daysToExpire === undefined) return 'info'
  if (daysToExpire < 0) return 'danger'
  if (daysToExpire <= 30) return 'danger'
  if (daysToExpire <= 90) return 'warning'
  return 'success'
}

// Price change status functions
function getPriceChangeStatus(drug) {
  const latestPrice = drug.latest_price || 0
  const sellingPrice = drug.selling_price || drug.maximum_price || 0
  
  // If no TTAC price available
  if (!latestPrice) return 'No Price'
  
  // If no selling price available
  if (!sellingPrice) return 'No Price'
  
  // Compare latest price with selling price
  if (latestPrice > sellingPrice) {
    return 'Need to Update'
  } else if (sellingPrice > latestPrice) {
    return 'Above TTAC'
  }
  
  return 'Unchanged'
}

function getPriceChangeType(drug) {
  const status = getPriceChangeStatus(drug)
  
  switch (status) {
    case 'Need to Update':
      return 'warning'
    case 'Above TTAC':
      return 'primary'
    case 'Unchanged':
      return 'success'
    case 'No Price':
      return 'info'
    default:
      return 'info'
  }
}
</script>

<style scoped>
.filters-card {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 0;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

.name-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.language-toggle {
  margin-left: 8px;
  min-width: 35px;
  font-size: 12px;
  padding: 4px 8px;
  font-family: var(--font-persian);
  font-weight: bold;
}

.medicine-name {
  font-weight: 500;
  direction: ltr;
  text-align: left;
}

.company-name {
  font-size: 0.65rem;
  color: var(--text-secondary);
  direction: ltr;
  text-align: left;
}

/* Persian text styling */
.medicine-name:has-text([\u0600-\u06FF]),
.company-name:has-text([\u0600-\u06FF]) {
  direction: rtl;
  text-align: right;
}

.generic-name-text {
  font-size: 0.7rem;
  color: var(--el-text-color-regular);
  font-weight: bold;
  font-family: var(--font-persian);
}

.expiry-date {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.stock-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.quantity-display {
  font-size: 1rem;
  color: var(--el-text-color-primary);
}

.price-change-tag {
  font-weight: 500;
  font-size: 0.75rem;
}

.price-change-tag.need-to-update {
  background-color: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  border-color: var(--el-color-warning-light-5);
}

.price-change-tag.above-ttac {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.price-change-tag.unchanged {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
  border-color: var(--el-color-success-light-5);
}

.price-change-tag.no-price {
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);
  border-color: var(--el-color-info-light-5);
}

.no-price-text {
  color: var(--el-text-color-placeholder);
  font-style: italic;
  font-size: 0.85rem;
}

.ttac-price-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.ttac-price {
  font-size: 0.85rem;
  color: var(--el-text-color-primary);
}

.price-status {
  display: flex;
  justify-content: center;
}
</style> 