<template>
  <div class="ttac-upload-page">
    <!-- Page header with title and upload button -->
    <div class="page-header">
      <h1 class="page-title">TTAC Drugs Management</h1>
      <div class="header-actions">
        <el-button 
          type="danger" 
          @click="showDeleteAllConfirm"
          v-if="authStore.user?.is_staff_member"
          class="delete-all-btn">
          <el-icon><i-ep-delete /></el-icon>
          Delete All
        </el-button>
        <el-button 
          type="primary" 
          @click="showUploadDialog = true"
          v-permission="'ttac_drugs_upload'">
          <el-icon><i-ep-upload /></el-icon>
          Upload Excel File
        </el-button>
      </div>
    </div>

    <!-- Search and filters section -->
    <div class="card filters-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="Search">
          <el-input 
            v-model="searchQuery" 
            placeholder="Search drug name, GTIN, or company" 
            clearable 
            @input="handleSearch" />
        </el-form-item>
        
        <el-form-item label="GTIN Code">
          <el-input 
            v-model="filters.gtinCode" 
            placeholder="Filter by GTIN" 
            clearable 
            @input="applyFilters" />
        </el-form-item>
        
        <el-form-item label="Generic Code">
          <el-input 
            v-model="filters.genericCode" 
            placeholder="Filter by Generic Code" 
            clearable 
            @input="applyFilters" />
        </el-form-item>
        
        <el-form-item label="Company">
          <el-select 
            v-model="filters.company" 
            placeholder="Select company" 
            clearable 
            filterable
            @change="applyFilters">
            <el-option 
              v-for="company in uniqueCompanies" 
              :key="company" 
              :label="company" 
              :value="company" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Price Range">
          <el-select 
            v-model="filters.priceRange" 
            placeholder="Select price range" 
            clearable 
            @change="applyFilters">
            <el-option label="Under 10,000" value="under10000" />
            <el-option label="10,000 - 50,000" value="10000to50000" />
            <el-option label="50,000 - 100,000" value="50000to100000" />
            <el-option label="Over 100,000" value="over100000" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Price Changed">
          <el-select 
            v-model="filters.hasChanged" 
            placeholder="Filter by price changes" 
            clearable 
            @change="applyFilters">
            <el-option label="Yes" value="true" />
            <el-option label="No" value="false" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Last Updated">
          <div class="date-filter-container">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="To"
              start-placeholder="Start date"
              end-placeholder="End date"
              format="YYYY/MM/DD"
              value-format="YYYY-MM-DD"
              clearable
              @change="applyFilters"
              style="width: 240px"
            />
            <div class="quick-date-filters">
              <el-button size="small" @click="setDateRange('today')" plain>Today</el-button>
              <el-button size="small" @click="setDateRange('week')" plain>Last 7 days</el-button>
              <el-button size="small" @click="setDateRange('month')" plain>Last 30 days</el-button>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="applyFilters">Apply Filters</el-button>
          <el-button @click="resetFilters">Reset</el-button>
          <el-button type="success" @click="refreshData">
            <el-icon><i-ep-refresh /></el-icon>
            Refresh
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Active Filters Summary -->
    <div v-if="activeFiltersCount > 0" class="card filters-summary">
      <div class="summary-header">
        <span class="summary-title">
          <el-icon><i-ep-filter /></el-icon>
          Active Filters ({{ activeFiltersCount }})
        </span>
        <el-button size="small" @click="resetFilters" type="danger" plain>
          <el-icon><i-ep-close /></el-icon>
          Clear All
        </el-button>
      </div>
      <div class="summary-tags">
        <el-tag v-if="searchQuery" closable @close="searchQuery = ''; applyFilters()" type="info">
          Search: "{{ searchQuery }}"
        </el-tag>
        <el-tag v-if="filters.gtinCode" closable @close="filters.gtinCode = ''; applyFilters()" type="info">
          GTIN: "{{ filters.gtinCode }}"
        </el-tag>
        <el-tag v-if="filters.genericCode" closable @close="filters.genericCode = ''; applyFilters()" type="info">
          Generic: "{{ filters.genericCode }}"
        </el-tag>
        <el-tag v-if="filters.company" closable @close="filters.company = ''; applyFilters()" type="info">
          Company: "{{ filters.company }}"
        </el-tag>
        <el-tag v-if="filters.priceRange" closable @close="filters.priceRange = ''; applyFilters()" type="info">
          Price Range: {{ filters.priceRange }}
        </el-tag>
        <el-tag v-if="filters.hasChanged" closable @close="filters.hasChanged = ''; applyFilters()" type="info">
          Price Changed: {{ filters.hasChanged === 'true' ? 'Yes' : 'No' }}
        </el-tag>
        <el-tag v-if="dateRangeText" closable @close="filters.dateRange = []; applyFilters()" type="warning">
          Updated: {{ dateRangeText }}
        </el-tag>
      </div>
    </div>

    <!-- TTAC Drugs table -->
    <div class="card table-card">
      <div class="table-header">
        <div class="results-info">
          <span class="results-count">
            Showing {{ paginatedDrugs.length }} of {{ filteredDrugs.length }} records
            <span v-if="filteredDrugs.length !== drugs.length" class="total-count">
              ({{ drugs.length }} total)
            </span>
          </span>
          <div class="quick-actions">
            <el-button 
              size="small" 
              @click="setDateRange('today')" 
              type="primary" 
              plain
              v-if="!filters.dateRange || filters.dateRange.length === 0">
              <el-icon><i-ep-clock /></el-icon>
              Today's Updates
            </el-button>
          </div>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="paginatedDrugs"
        style="width: 100%"
        border
        stripe
        @selection-change="handleSelectionChange">
        
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="Generic Code" width="80">
          <template #default="scope">
            <div class="codes-info">
              <div v-if="scope.row.generic_code">{{ scope.row.generic_code }}</div>
              <div v-if="!scope.row.generic_code"><small>N/A</small></div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Drug Name" width="280">
          <template #default="scope">
            <div>
              <div class="medicine-name">{{ scope.row.name_persian || 'N/A' }}</div>
              <div class="company-name" v-if="scope.row.name_english">{{ scope.row.name_english }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Generic Name" width="280">
          <template #default="scope">
            <div>
              <div class="medicine-name" v-if="scope.row.generic_name">{{ scope.row.generic_name }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Company" width="200">
          <template #default="scope">
            <div>
              <div class="medicine-name">{{ scope.row.company_name_persian || 'N/A' }}</div>
              <div class="company-name" v-if="scope.row.company_name_english">{{ scope.row.company_name_english }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="units_per_box" label="Units/Box" width="100" sortable>
          <template #default="scope">
            {{ scope.row.units_per_box || 'N/A' }}
          </template>
        </el-table-column>
        
        <el-table-column label="Prices" width="130">
          <template #default="scope">
            <div class="price-info"><small>
              <div class="price-display"><strong>Sell:</strong><span class="currency">ریال</span><span class="amount">{{ formatPrice(scope.row.selling_price) }}</span></div>
              <div class="price-display"><strong>Buy:</strong><span class="currency">ریال</span><span class="amount">{{ formatPrice(scope.row.buying_price) }}</span></div>
              <div class="price-display"><strong>Dist:</strong><span class="currency">ریال</span><span class="amount">{{ formatPrice(scope.row.distribution_price) }}</span></div>
            </small></div>
          </template>
        </el-table-column>
        
        <el-table-column label="Last Updated" width="100" sortable>
          <template #default="scope">
            <div>{{ formatDate(scope.row.updated_at) }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="Price Changed" width="100" sortable>
          <template #default="scope">
            <el-tag 
              :type="scope.row.has_changed ? 'warning' : 'success'" 
              size="small">
              {{ scope.row.has_changed ? 'Yes' : 'No' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="gtin_code" label="GTIN Code" sortable width="140">
          <template #default="scope"><small>{{ scope.row.gtin_code || 'N/A' }}</small></template>
        </el-table-column>
        
        <el-table-column label="Actions" fixed="right" width="180">
          <template #default="scope">
            <div class="action-buttons">
              <el-button 
                size="small" 
                @click="viewDrugDetails(scope.row)"
                type="primary"
                plain>
                View
              </el-button>
              <el-button 
                size="small" 
                @click="editDrug(scope.row)"
                type="warning"
                plain
                v-permission="'ttac_drugs_upload'">
                Edit
              </el-button>
              <el-button 
                size="small" 
                @click="deleteDrugConfirm(scope.row)"
                type="danger"
                plain
                v-permission="'ttac_drugs_upload'">
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
          :total="filteredDrugs.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- Upload Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      width="60%"
      destroy-on-close>
      
      <!-- Upload Instructions -->
      <div class="instructions-card">
        <div class="instructions-header">
          <div class="instructions-title">
            <el-icon class="title-icon"><i-ep-info-filled /></el-icon>
            <h3>Upload Instructions</h3>
          </div>
          <el-tag type="info" size="small">Excel Upload Guide</el-tag>
        </div>
        
        <div class="instructions-content">
          <div class="instruction-grid">
            <div class="instruction-item">
              <div class="instruction-icon-wrapper">
                <el-icon class="instruction-icon"><i-ep-document /></el-icon>
              </div>
              <div class="instruction-text">
                <h4>File Format</h4>
                <p>(.xlsx, .xls)</p>
              </div>
            </div>
            
            <div class="instruction-item">
              <div class="instruction-icon-wrapper">
                <el-icon class="instruction-icon"><i-ep-warning /></el-icon>
              </div>
              <div class="instruction-text">
                <h4>File Size</h4>
                <p>Max 10MB</p>
              </div>
            </div>
            
            <div class="instruction-item">
              <div class="instruction-icon-wrapper">
                <el-icon class="instruction-icon"><i-ep-list /></el-icon>
              </div>
              <div class="instruction-text">
                <h4>Required Columns</h4>
                <p>sample file</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Enhanced Template Section -->
        <div class="template-section">
          <div class="template-content">
            <div class="template-info">
              <el-icon class="template-icon"><i-ep-download /></el-icon>
              <div class="template-text">
                <h4>Download Templates & Samples</h4>
              </div>
            </div>
            <div class="template-actions">
              <el-button 
                type="primary" 
                size="large"
                plain
                @click="downloadSampleFile"
                class="sample-btn">
                <el-icon><i-ep-document-copy /></el-icon>
                Sample File
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- Additional Tips -->
        <div class="tips-section">
          <div class="tips-header">
            <el-icon class="tips-icon"><i-ep-lightbulb /></el-icon>
            <span>Pro Tips</span>
          </div>
          <ul class="tips-list">
            <li>Ensure all GTIN codes are unique and properly formatted</li>
            <li>Persian names are required for all entries</li>
            <li>Price fields should contain numeric values only</li>
            <li>Use the template to avoid formatting errors</li>
          </ul>
        </div>
      </div>

      <!-- Upload Section -->
      <div class="upload-section">
        <h3>Upload Excel File</h3>
        
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          :action="uploadUrl"
          :headers="uploadHeaders"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :on-progress="handleUploadProgress"
          :show-file-list="false"
          accept=".xlsx,.xls">
          
          <div class="upload-content">
            <el-icon class="upload-icon" v-if="!uploading">
              <i-ep-upload-filled />
            </el-icon>
            <el-icon class="upload-icon spinning" v-else>
              <i-ep-loading />
            </el-icon>
            
            <div class="upload-text" v-if="!uploading">
              <p>Drop Excel file here or <em>click to upload</em></p>
              <p class="upload-hint">Support .xlsx and .xls files up to 10MB</p>
            </div>
            <div class="upload-text" v-else>
              <p>Uploading and processing file...</p>
              <el-progress 
                :percentage="uploadProgress" 
                :show-text="false"
                class="upload-progress" />
            </div>
          </div>
        </el-upload>
      </div>

      <!-- Results Section -->
      <div class="results-section" v-if="uploadResult">
        <h3>Upload Results</h3>
        
        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-item success">
            <div class="stat-number">{{ uploadResult.stats.processed }}</div>
            <div class="stat-label">Processed</div>
          </div>
          <div class="stat-item info">
            <div class="stat-number">{{ uploadResult.stats.created }}</div>
            <div class="stat-label">Created</div>
          </div>
          <div class="stat-item warning">
            <div class="stat-number">{{ uploadResult.stats.updated }}</div>
            <div class="stat-label">Updated</div>
          </div>
          <div class="stat-item danger">
            <div class="stat-number">{{ uploadResult.stats.errors }}</div>
            <div class="stat-label">Errors</div>
          </div>
          <div class="stat-item warning" v-if="uploadResult.stats.price_changes !== undefined">
            <div class="stat-number">{{ uploadResult.stats.price_changes || 0 }}</div>
            <div class="stat-label">Price Changes</div>
          </div>
          <div class="stat-item info" v-if="uploadResult.stats.no_price_changes !== undefined">
            <div class="stat-number">{{ uploadResult.stats.no_price_changes || 0 }}</div>
            <div class="stat-label">No Price Changes</div>
          </div>
        </div>

        <!-- Errors List -->
        <div v-if="uploadResult.errors && uploadResult.errors.length > 0" class="errors-section">
          <h4>Errors Found ({{ uploadResult.errors.length }} total):</h4>
          <el-scrollbar height="300px">
            <div class="error-list">
              <div 
                v-for="(error, index) in uploadResult.errors" 
                :key="index"
                class="error-item">
                <el-icon class="error-icon"><i-ep-warning /></el-icon>
                <span>{{ error }}</span>
              </div>
            </div>
          </el-scrollbar>
          
          <!-- Download errors as text file option -->
          <div class="error-actions" v-if="uploadResult.errors.length > 20">
            <el-button 
              size="small" 
              type="info" 
              @click="downloadErrors"
              plain>
              <el-icon><i-ep-download /></el-icon>
              Download Error List
            </el-button>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="uploadResult.stats.errors === 0" class="success-message">
          <el-icon><i-ep-circle-check /></el-icon>
          <span>All records processed successfully!</span>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">Close</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Drug Details Dialog -->
    <el-dialog
      v-model="showDetailsDialog"
      title="Drug Details"
      width="60%">
      <div v-if="selectedDrug" class="drug-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="GTIN Code">{{ selectedDrug.gtin_code || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="IRC Code">{{ selectedDrug.irc_code || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Generic Code">{{ selectedDrug.generic_code || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Persian Name"><span class="medicine-persian-name">{{ selectedDrug.name_persian || 'N/A' }}</span></el-descriptions-item>
          <el-descriptions-item label="English Name">{{ selectedDrug.name_english || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Generic Name">{{ selectedDrug.generic_name || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Company (Persian)"><span class="company-persian-name">{{ selectedDrug.company_name_persian || 'N/A' }}</span></el-descriptions-item>
          <el-descriptions-item label="Company (English)">{{ selectedDrug.company_name_english || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Units per Box">{{ selectedDrug.units_per_box || 'N/A' }}</el-descriptions-item>
          <el-descriptions-item label="Selling Price"><span class="price-display"><span class="currency">ریال</span><span class="amount">{{ formatPrice(selectedDrug.selling_price) }}</span></span></el-descriptions-item>
          <el-descriptions-item label="Buying Price"><span class="price-display"><span class="currency">ریال</span><span class="amount">{{ formatPrice(selectedDrug.buying_price) }}</span></span></el-descriptions-item>
          <el-descriptions-item label="Distribution Price"><span class="price-display"><span class="currency">ریال</span><span class="amount">{{ formatPrice(selectedDrug.distribution_price) }}</span></span></el-descriptions-item>
          <el-descriptions-item label="Price Changed">
            <el-tag 
              :type="selectedDrug.has_changed ? 'warning' : 'success'" 
              size="small">
              {{ selectedDrug.has_changed ? 'Yes' : 'No' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Created">{{ formatDate(selectedDrug.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="Updated">{{ formatDate(selectedDrug.updated_at) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useTtacDrugsStore } from '@/store/ttacDrugs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate, formatDateISO, getDaysAgoISO, getTodayISO } from '@/utils/dateUtils'

const authStore = useAuthStore()
const ttacDrugsStore = useTtacDrugsStore()
const uploadRef = ref()
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref(null)
const showUploadDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedDrug = ref(null)
const selectedDrugs = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const filters = ref({
  gtinCode: '',
  company: '',
  priceRange: '',
  genericCode: '',
  hasChanged: '',
  dateRange: []
})

// Use store data instead of local data
const loading = computed(() => ttacDrugsStore.loading)
const drugs = computed(() => ttacDrugsStore.drugs)

// Upload configuration
const uploadUrl = computed(() => `http://localhost:8000/api/pharmacy/ttac-drugs/upload-excel/`)
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${authStore.accessToken}`
}))

// Computed properties
const uniqueCompanies = computed(() => {
  const companies = drugs.value.map(drug => drug.company_name_persian).filter(company => company && company.trim())
  return [...new Set(companies)].sort()
})

const filteredDrugs = computed(() => {
  let filtered = [...drugs.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(drug => 
      (drug.name_persian && drug.name_persian.toLowerCase().includes(query)) || 
      (drug.name_english && drug.name_english.toLowerCase().includes(query)) ||
      (drug.gtin_code && drug.gtin_code.toLowerCase().includes(query)) ||
      (drug.company_name_persian && drug.company_name_persian.toLowerCase().includes(query)) ||
      (drug.company_name_english && drug.company_name_english.toLowerCase().includes(query))
    )
  }
  
  // Apply filters
  if (filters.value.gtinCode) {
    filtered = filtered.filter(drug => 
      drug.gtin_code && drug.gtin_code.toLowerCase().includes(filters.value.gtinCode.toLowerCase())
    )
  }
  
  if (filters.value.genericCode) {
    filtered = filtered.filter(drug => 
      drug.generic_code && drug.generic_code.toLowerCase().includes(filters.value.genericCode.toLowerCase())
    )
  }
  
  if (filters.value.company) {
    filtered = filtered.filter(drug => 
      drug.company_name_persian && drug.company_name_persian === filters.value.company
    )
  }
  
  if (filters.value.priceRange) {
    filtered = filtered.filter(drug => {
      const price = parseFloat(drug.selling_price)
      // Skip drugs with null/undefined/invalid prices
      if (isNaN(price) || drug.selling_price === null || drug.selling_price === undefined) {
        return false
      }
      switch (filters.value.priceRange) {
        case 'under10000':
          return price < 10000
        case '1000to50000':
          return price >= 10000 && price < 50000
        case '50000to100000':
          return price >= 50000 && price < 100000
        case 'over100000':
          return price >= 100000
        default:
          return true
      }
    })
  }
  
  if (filters.value.hasChanged) {
    filtered = filtered.filter(drug => drug.has_changed === (filters.value.hasChanged === 'true'))
  }
  
  // Apply date range filter
  if (filters.value.dateRange && filters.value.dateRange.length === 2) {
    const [startDate, endDate] = filters.value.dateRange
    filtered = filtered.filter(drug => {
      if (!drug.updated_at) return false
      
      // Convert drug's updated_at to date string for comparison
      const drugDate = new Date(drug.updated_at).toISOString().split('T')[0]
      
      return drugDate >= startDate && drugDate <= endDate
    })
  }
  
  return filtered
})

const paginatedDrugs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDrugs.value.slice(start, end)
})

// Active filters summary
const activeFiltersCount = computed(() => {
  let count = 0
  if (searchQuery.value) count++
  if (filters.value.gtinCode) count++
  if (filters.value.genericCode) count++
  if (filters.value.company) count++
  if (filters.value.priceRange) count++
  if (filters.value.hasChanged) count++
  if (filters.value.dateRange && filters.value.dateRange.length === 2) count++
  return count
})

const dateRangeText = computed(() => {
  if (!filters.value.dateRange || filters.value.dateRange.length !== 2) return ''
  const [start, end] = filters.value.dateRange
  return `${start} to ${end}`
})

// Methods
const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return 'N/A'
  }
  return Math.floor(price).toLocaleString()
}

const refreshData = async () => {
  try {
    await ttacDrugsStore.refreshDrugs()
    ElMessage.success('Data refreshed successfully')
  } catch (error) {
    ElMessage.error('Failed to refresh data')
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  filters.value = {
    gtinCode: '',
    company: '',
    priceRange: '',
    genericCode: '',
    hasChanged: '',
    dateRange: []
  }
  currentPage.value = 1
}

const setDateRange = (range) => {
  switch (range) {
    case 'today':
      const today = getTodayISO()
      filters.value.dateRange = [today, today]
      break
    case 'week':
      filters.value.dateRange = [getDaysAgoISO(7), getTodayISO()]
      break
    case 'month':
      filters.value.dateRange = [getDaysAgoISO(30), getTodayISO()]
      break
  }
  
  applyFilters()
}

const handleSelectionChange = (selection) => {
  selectedDrugs.value = selection
}

const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const viewDrugDetails = (drug) => {
  selectedDrug.value = drug
  showDetailsDialog.value = true
}

const editDrug = (drug) => {
  ElMessage.info('Edit functionality coming soon!')
}

const deleteDrugConfirm = async (drug) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${drug.name_persian}"?`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    
    // Use store method that handles both API call and local removal
    await ttacDrugsStore.deleteDrug(drug.id)
    ElMessage.success('Drug deleted successfully')
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Failed to delete drug')
    }
  }
}

// Upload methods
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel' ||
                  file.name.endsWith('.xlsx') || 
                  file.name.endsWith('.xls')
  
  if (!isExcel) {
    ElMessage.error('Please upload Excel files only (.xlsx or .xls)')
    return false
  }

  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('File size cannot exceed 10MB')
    return false
  }

  uploadResult.value = null
  uploading.value = true
  uploadProgress.value = 0

  return true
}

const handleUploadProgress = (event) => {
  uploadProgress.value = Math.round((event.loaded / event.total) * 100)
}

const handleUploadSuccess = (response) => {
  uploading.value = false
  uploadProgress.value = 100
  
  if (response.data && response.data.success) {
    uploadResult.value = response.data
    ElMessage.success('File uploaded and processed successfully!')
    
    // Force refresh the store to get updated timestamps
    ttacDrugsStore.refreshDrugs().then(() => {
      console.log('✅ Store refreshed after upload - updated timestamps loaded')
    }).catch(error => {
      console.error('Failed to refresh store after upload:', error)
      // Fallback to store's fetchDrugs method
      ttacDrugsStore.fetchDrugs()
    })
  } else {
    ElMessage.error('Upload completed but processing failed')
  }
}

const handleUploadError = (error) => {
  uploading.value = false
  uploadProgress.value = 0
  
  let errorMessage = 'Upload failed'
  if (error.response && error.response.data) {
    if (error.response.data.error) {
      errorMessage = error.response.data.error
    } else if (error.response.data.file) {
      errorMessage = error.response.data.file[0]
    }
  }
  
  ElMessage.error(errorMessage)
}

const downloadSampleFile = () => {
  try {
    // Create a link to download the sample file from assets
    const link = document.createElement('a')
    link.href = '/src/assets/sample.xlsx'
    link.download = 'ttac_drugs_sample.xlsx'
    link.click()
    
    ElMessage.success('Sample file download started!')
  } catch (error) {
    console.error('Error downloading sample file:', error)
    ElMessage.error('Failed to download sample file')
  }
}

const downloadErrors = () => {
  try {
    // Create a link to download the errors as a text file
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([uploadResult.value.errors.join('\n')], { type: 'text/plain' }))
    link.download = 'ttac_drugs_errors.txt'
    link.click()
    
    ElMessage.success('Error list downloaded successfully')
  } catch (error) {
    console.error('Error downloading error list:', error)
    ElMessage.error('Failed to download error list')
  }
}

const showDeleteAllConfirm = async () => {
  try {
    // First confirmation
    await ElMessageBox.confirm(
      'This will permanently delete ALL TTAC drug records from the database. This action cannot be undone.',
      'Delete All TTAC Drugs',
      {
        confirmButtonText: 'Continue',
        cancelButtonText: 'Cancel',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        message: `
          <div style="margin-bottom: 15px;">
            <strong style="color: #f56c6c;">⚠️ DANGER: This will delete ALL ${drugs.value.length} TTAC drug records!</strong>
          </div>
          <div style="margin-bottom: 10px;">This action will:</div>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Delete all drug records permanently</li>
            <li>Remove all pricing information</li>
            <li>Clear all company and product data</li>
          </ul>
          <div style="margin-top: 15px; color: #909399;">
            <strong>Are you sure you want to continue?</strong>
          </div>
        `
      }
    )
    
    // Second confirmation with typing requirement
    const { value: confirmText } = await ElMessageBox.prompt(
      'To confirm this dangerous operation, please type "DELETE ALL" in the input below:',
      'Final Confirmation Required',
      {
        confirmButtonText: 'Delete All Records',
        cancelButtonText: 'Cancel',
        inputPattern: /^DELETE ALL$/,
        inputErrorMessage: 'You must type exactly "DELETE ALL" to confirm',
        inputPlaceholder: 'Type: DELETE ALL',
        type: 'error'
      }
    )
    
    if (confirmText === 'DELETE ALL') {
      await deleteAllDrugs()
    }
    
  } catch (error) {
    // User cancelled or validation failed
    if (error !== 'cancel') {
      console.error('Delete all confirmation error:', error)
    }
  }
}

const deleteAllDrugs = async () => {
  try {
    const confirmData = {
      confirm_delete_all: true
    }
    
    // Use store method that handles both API call and local clearing
    const result = await ttacDrugsStore.deleteAllDrugs(confirmData)
    
    ElMessage.success({
      message: `Successfully deleted ${result.deleted_count} TTAC drug records`,
      duration: 5000
    })
    
    // Reset pagination
    currentPage.value = 1
    
  } catch (error) {
    console.error('Error deleting all drugs:', error)
    
    let errorMessage = 'Failed to delete all drugs'
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    }
    
    ElMessage.error({
      message: errorMessage,
      duration: 5000
    })
  }
}

onMounted(() => {
  // Use store's smart loading - only loads if not already available
  ttacDrugsStore.ensureDataAvailable()
})
</script>

<style scoped>
.ttac-upload-page {
  padding: 0px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.delete-all-btn {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
}

.delete-all-btn:hover {
  background-color: var(--danger-color-hover);
  border-color: var(--danger-color-hover);
}

.filters-card {
  margin-bottom: 20px;
}

.filters-summary {
  margin-bottom: 20px;
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-tags .el-tag {
  font-size: 12px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  overflow-x: auto;
}

.table-header {
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  margin: -20px -20px 20px -20px;
}

.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.total-count {
  color: var(--text-tertiary);
  font-weight: normal;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.medicine-name {
  font-weight: 500;
  color: var(--text-primary);
}

.company-name {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.price-info {
  font-size: 0.85rem;
}

.price-info div {
  margin-bottom: 2px;
}

.codes-info {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.codes-info div {
  margin-bottom: 2px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

/* Upload Dialog Styles */
.instructions-card {
  margin-bottom: 25px;
  padding: 0;
  background: white;
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.instructions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.instructions-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
  color: #606266;
}

.instructions-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.instructions-content {
  padding: 20px;
}

.instruction-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.instruction-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  transition: border-color 0.2s ease;
}

.instruction-item:hover {
  border-color: #c6d1f0;
}

.instruction-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #e8f0fe;
  border-radius: 6px;
  flex-shrink: 0;
}

.instruction-icon {
  color: #4b70e2;
  font-size: 16px;
}

.instruction-text h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.instruction-text p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.template-section {
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
}

.template-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.template-icon {
  font-size: 20px;
  color: #67c23a;
}

.template-text h4 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 15px;
  font-weight: 500;
}

.template-text p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.template-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.sample-btn:hover {
  transform: none;
  box-shadow: none;
}

.tips-section {
  padding: 20px;
  background: #f0f9ff;
  border-top: 1px solid #e4e7ed;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.tips-icon {
  font-size: 16px;
  color: #e6a23c;
}

.tips-header span {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.tips-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.tips-list li {
  position: relative;
  margin-bottom: 6px;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  padding-left: 16px;
}

.tips-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #909399;
  font-weight: normal;
}

.upload-section {
  margin-bottom: 25px;
}

.upload-section h3 {
  margin: 0 0 15px 0;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  height: 150px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  background: var(--background-color);
  transition: all 0.3s ease;
}

.upload-dragger :deep(.el-upload-dragger:hover) {
  border-color: var(--primary-color);
  background: rgba(75, 112, 226, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
}

.upload-icon {
  font-size: 36px;
  color: var(--primary-color);
}

.upload-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-text {
  text-align: center;
}

.upload-text p {
  margin: 0 0 5px 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.upload-hint {
  color: var(--text-secondary) !important;
  font-size: 0.85rem !important;
}

.upload-progress {
  width: 200px;
  margin-top: 10px;
}

.results-section h3 {
  margin: 0 0 20px 0;
  color: var(--text-primary);
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid;
}

.stat-item.success {
  border-color: var(--success-color);
  background: rgba(103, 194, 58, 0.1);
}

.stat-item.info {
  border-color: var(--primary-color);
  background: rgba(75, 112, 226, 0.1);
}

.stat-item.warning {
  border-color: var(--warning-color);
  background: rgba(230, 162, 60, 0.1);
}

.stat-item.danger {
  border-color: var(--danger-color);
  background: rgba(245, 108, 108, 0.1);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-item.success .stat-number {
  color: var(--success-color);
}

.stat-item.info .stat-number {
  color: var(--primary-color);
}

.stat-item.warning .stat-number {
  color: var(--warning-color);
}

.stat-item.danger .stat-number {
  color: var(--danger-color);
}

.stat-label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.9rem;
}

.errors-section {
  margin-top: 20px;
}

.errors-section h4 {
  margin: 0 0 10px 0;
  color: var(--danger-color);
}

.error-list {
  padding: 10px;
}

.error-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
}

.error-item:last-child {
  border-bottom: none;
}

.error-icon {
  color: var(--danger-color);
  font-size: 14px;
  margin-top: 2px;
  flex-shrink: 0;
}

.error-actions {
  margin-top: 15px;
  text-align: center;
  padding: 10px;
  border-top: 1px solid var(--border-color);
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px;
  background: rgba(103, 194, 58, 0.1);
  border: 1px solid var(--success-color);
  border-radius: 6px;
  color: var(--success-color);
  font-weight: 500;
  margin-top: 15px;
}

.success-message .el-icon {
  font-size: 18px;
}

.drug-details {
  padding: 10px 0;
}

.date-filter-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-date-filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.quick-date-filters .el-button {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
  min-height: 24px;
}

@media (max-width: 1200px) {
  .instruction-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .filter-form {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .upload-dragger :deep(.el-upload-dragger) {
    height: 120px;
  }
  
  .upload-icon {
    font-size: 28px;
  }
  
  /* Enhanced instructions card responsive styles */
  .instructions-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    padding: 12px 16px;
  }
  
  .instructions-title {
    gap: 6px;
  }
  
  .title-icon {
    font-size: 16px;
  }
  
  .instructions-header h3 {
    font-size: 15px;
  }
  
  .instructions-content {
    padding: 16px;
  }
  
  .instruction-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .instruction-item {
    padding: 12px;
    gap: 10px;
  }
  
  .instruction-icon-wrapper {
    width: 28px;
    height: 28px;
  }
  
  .instruction-icon {
    font-size: 14px;
  }
  
  .instruction-text h4 {
    font-size: 13px;
  }
  
  .instruction-text p {
    font-size: 12px;
  }
  
  .template-section {
    padding: 16px;
  }
  
  .template-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .template-info {
    gap: 10px;
  }
  
  .template-icon {
    font-size: 18px;
  }
  
  .template-text h4 {
    font-size: 14px;
  }
  
  .template-text p {
    font-size: 12px;
  }
  
  .template-actions {
    width: 100%;
    flex-direction: column;
    gap: 6px;
  }
  
  .download-btn, .sample-btn {
    width: 100%;
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .tips-section {
    padding: 16px;
  }
  
  .tips-header {
    gap: 6px;
  }
  
  .tips-icon {
    font-size: 14px;
  }
  
  .tips-header span {
    font-size: 13px;
  }
  
  .tips-list li {
    font-size: 12px;
    padding-left: 14px;
  }
  
  .date-filter-container {
    width: 100%;
  }
  
  .date-filter-container .el-date-editor {
    width: 100% !important;
  }
  
  .quick-date-filters {
    justify-content: flex-start;
  }
  
  .summary-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .summary-tags {
    gap: 6px;
  }
  
  .summary-tags .el-tag {
    font-size: 11px;
  }
  
  .table-header {
    padding: 12px 16px 8px 16px;
    margin: -16px -16px 16px -16px;
  }
  
  .results-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .results-count {
    font-size: 13px;
  }
  
  .quick-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style> 