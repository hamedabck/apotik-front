<template>
  <div class="medicine-detail-page">
    <div class="page-header">
      <h1 class="page-title">Medicine Details</h1>
      <div class="header-actions">
        <el-button @click="goBack" plain>
          <el-icon><i-ep-arrow-left /></el-icon>
          Back
        </el-button>
        <el-button type="warning" @click="editMedicine">
          <el-icon><i-ep-edit /></el-icon>
          Edit
        </el-button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton style="width: 100%" :rows="10" animated />
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-alert
        title="Failed to load medicine data"
        type="error"
        :description="error"
        show-icon
        :closable="false">
      </el-alert>
      <div class="error-actions">
        <el-button @click="fetchMedicine">Try Again</el-button>
        <el-button @click="goBack">Go Back</el-button>
      </div>
    </div>
    
    <div v-else>
      <!-- Overview Card -->
      <el-card class="detail-card overview-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">Medicine Overview</h2>
            <el-tag 
              :type="medicine.fda ? 'success' : 'warning'"
              effect="dark">
              {{ medicine.fda ? 'FDA Updated' : 'FDA Update Required' }}
            </el-tag>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Medicine Name">
            {{ medicine.name }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Company">
            {{ medicine.companyName }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Generic Code">
            {{ medicine.genericCode }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Generic Name">
            {{ medicine.details.genericName }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Total Stock">
            <span :class="getStockLevelClass(medicine.quantity)">
              {{ medicine.quantity }} units
            </span>
          </el-descriptions-item>
          
          <el-descriptions-item label="Selling Price">
            ${{ medicine.sellingPrice.toFixed(2) }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Next Expiry">
            <span :class="getExpiryStatusClass(medicine.expiryDate)">
              {{ formatDate(medicine.expiryDate) }} - {{ getExpiryStatus(medicine.expiryDate) }}
            </span>
          </el-descriptions-item>
          
          <el-descriptions-item label="Units per Box">
            {{ medicine.details.numPerBox }} units
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- Details Card -->
      <el-card class="detail-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">Additional Details</h2>
          </div>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="GTIN Code" span="1">
            {{ medicine.details.gtinCode }}
          </el-descriptions-item>
          
          <el-descriptions-item label="IRC Code" span="1">
            {{ medicine.details.ircCode }}
          </el-descriptions-item>
          
          <el-descriptions-item label="English Name" span="1">
            {{ medicine.details.englishName }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Persian Name" span="1">
            {{ medicine.details.persianName }}
          </el-descriptions-item>
          
          <el-descriptions-item label="English Company Name" span="1">
            {{ medicine.details.englishCompanyName }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Persian Company Name" span="1">
            {{ medicine.details.persianCompanyName }}
          </el-descriptions-item>
          
          <el-descriptions-item label="Keywords" span="2">
            <el-tag
              v-for="(keyword, index) in getKeywords"
              :key="index"
              class="keyword-tag">
              {{ keyword }}
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="Technical Evaluation" span="2">
            <el-tag :type="medicine.details.technicalEvaluation ? 'success' : 'info'">
              {{ medicine.details.technicalEvaluation ? 'Required' : 'Not Required' }}
            </el-tag>
          </el-descriptions-item>
          
          <el-descriptions-item label="Pharmacist Description" span="2">
            <p class="description-text">{{ medicine.details.pharmacistDescription || 'No description available' }}</p>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      
      <!-- Stock Card -->
      <el-card class="detail-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">Stock Batches</h2>
            <el-button size="small" type="primary" @click="navigateToStockAdjustment">
              <el-icon><i-ep-edit /></el-icon>
              Adjust Stock
            </el-button>
          </div>
        </template>
        
        <el-table :data="medicine.stocks" border stripe style="width: 100%">
          <el-table-column prop="batchNumber" label="Batch Number" width="150" />
          
          <el-table-column label="Price" width="120">
            <template #default="scope">
              ${{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          
          <el-table-column label="Expiry Date" width="150">
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
          
          <el-table-column prop="quantity" label="Quantity" width="120" />
          
          <el-table-column label="Locations" min-width="250">
            <template #default="scope">
              <div v-for="(location, index) in scope.row.locations" :key="index" class="location-item">
                <strong>{{ location.warehouse }}:</strong> {{ location.quantity }} units
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- Insurance Card -->
      <el-card class="detail-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <h2 class="card-title">Insurance Coverage</h2>
          </div>
        </template>
        
        <el-table :data="medicine.insurances" border stripe style="width: 100%">
          <el-table-column prop="type" label="Insurance Type" width="180" />
          
          <el-table-column prop="speciality" label="Speciality" width="150" />
          
          <el-table-column label="Insurance Price" width="150">
            <template #default="scope">
              ${{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          
          <el-table-column label="Coverage" width="120">
            <template #default="scope">
              {{ scope.row.percentage }}%
            </template>
          </el-table-column>
          
          <el-table-column label="Insurance Share" width="150">
            <template #default="scope">
              ${{ scope.row.share.toFixed(2) }}
            </template>
          </el-table-column>
          
          <el-table-column label="Requirements" min-width="200">
            <template #default="scope">
              <div class="requirements-list">
                <div>Max units: {{ scope.row.numMax }}</div>
                <div>Max age: {{ scope.row.ageMax }}</div>
                <div>
                  <el-tag size="small" :type="scope.row.barcodeRequired ? 'danger' : 'info'">
                    {{ scope.row.barcodeRequired ? 'Barcode Required' : 'No Barcode Required' }}
                  </el-tag>
                </div>
                <div>
                  <el-tag size="small" :type="scope.row.hospitalRequired ? 'danger' : 'info'">
                    {{ scope.row.hospitalRequired ? 'Hospital Only' : 'No Hospital Restriction' }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMedicinesStore } from '@/store/medicines'

const route = useRoute()
const router = useRouter()
const medicinesStore = useMedicinesStore()

const medicineId = parseInt(route.params.id)
const medicine = ref(null)
const loading = ref(true)
const error = ref(null)

// Fetch medicine data on component mount
onMounted(() => {
  fetchMedicine()
})

const fetchMedicine = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Get medicine from store
    await medicinesStore.fetchMedicines()
    const foundMedicine = medicinesStore.getMedicineById(medicineId)
    
    if (!foundMedicine) {
      throw new Error('Medicine not found')
    }
    
    medicine.value = foundMedicine
  } catch (err) {
    error.value = err.message || 'Failed to load medicine data'
  } finally {
    loading.value = false
  }
}

// Computed property to transform keywords string into array
const getKeywords = computed(() => {
  if (!medicine.value) return []
  
  const keywordString = medicine.value.details.keyword
  if (!keywordString) return []
  
  return keywordString.split(',').map(keyword => keyword.trim())
})

// Formatting and utility methods
const formatDate = (dateString) => {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString()
}

const getExpiryStatus = (dateString) => {
  if (!dateString) return 'Unknown'
  
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

const getExpiryStatusClass = (dateString) => {
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

const getStockLevelClass = (quantity) => {
  if (quantity <= 0) {
    return 'status-expired' // Reusing the same class for styling
  } else if (quantity < 50) {
    return 'status-near-expiry'
  } else {
    return 'status-safe'
  }
}

// Navigation methods
const editMedicine = () => {
  router.push({ name: 'EditMedicine', params: { id: medicineId } })
}

const navigateToStockAdjustment = () => {
  router.push({ name: 'StockAdjustment', query: { medicineId } })
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.medicine-detail-page {
  padding-bottom: 30px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  margin: 0;
  font-size: 1.3rem;
}

.loading-container, .error-container {
  padding: 40px;
  background: var(--white);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.error-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.keyword-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.description-text {
  white-space: pre-line;
  margin: 0;
  font-style: italic;
  color: var(--text-secondary);
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.location-item {
  margin-bottom: 5px;
}

.location-item:last-child {
  margin-bottom: 0;
}
</style> 