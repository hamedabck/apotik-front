<template>
  <div class="home-page">
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
    </div>
    
    <!-- Quick stats widgets -->
    <div class="stats-grid">
      <el-card shadow="hover" class="stats-card">
        <template #header>
          <div class="stats-header">
            <span>Total Medicines</span>
            <el-icon class="stats-icon"><i-ep-medicine-box /></el-icon>
          </div>
        </template>
        <div class="stats-value">{{ medicineStats.totalCount }}</div>
        <div class="stats-trend positive">
          <i-ep-arrow-up /> 5% from last month
        </div>
      </el-card>
      
      <el-card shadow="hover" class="stats-card warning">
        <template #header>
          <div class="stats-header">
            <span>Low Stock Items</span>
            <el-icon class="stats-icon"><i-ep-warning /></el-icon>
          </div>
        </template>
        <div class="stats-value">{{ medicineStats.lowStock }}</div>
        <div class="stats-trend negative">
          <i-ep-arrow-up /> 12% from last month
        </div>
      </el-card>
      
      <el-card shadow="hover" class="stats-card danger">
        <template #header>
          <div class="stats-header">
            <span>Expired Items</span>
            <el-icon class="stats-icon"><i-ep-warning-filled /></el-icon>
          </div>
        </template>
        <div class="stats-value">{{ medicineStats.expired }}</div>
        <div class="stats-trend negative">
          <i-ep-arrow-up /> 3% from last month
        </div>
      </el-card>
      
      <el-card shadow="hover" class="stats-card success">
        <template #header>
          <div class="stats-header">
            <span>Sales This Month</span>
            <el-icon class="stats-icon"><i-ep-sell /></el-icon>
          </div>
        </template>
        <div class="stats-value">{{ formatCurrency(medicineStats.monthlySales) }}</div>
        <div class="stats-trend positive">
          <i-ep-arrow-up /> 8% from last month
        </div>
      </el-card>
    </div>
    
    <!-- Charts section -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>Stock Overview</span>
              </div>
            </template>
            <div class="chart-placeholder">
              Stock Category Distribution Chart
              <!-- In a real app, you'd use a chart library like Chart.js or ECharts -->
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="chart-header">
                <span>Monthly Sales</span>
              </div>
            </template>
            <div class="chart-placeholder">
              Monthly Sales Trend Chart
              <!-- In a real app, you'd use a chart library like Chart.js or ECharts -->
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- Recent activity -->
    <el-card shadow="hover" class="recent-activity">
      <template #header>
        <div class="recent-activity-header">
          <span>Recent Activity</span>
          <el-button type="text" @click="loadMoreActivity">View All</el-button>
        </div>
      </template>
      
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in recentActivities"
          :key="index"
          :type="activity.type"
          :timestamp="activity.timestamp">
          {{ activity.content }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
    
    <!-- Quick actions -->
    <div class="quick-actions">
      <el-card shadow="hover">
        <template #header>
          <h3>Quick Actions</h3>
        </template>
        <div class="quick-actions-grid">
          <el-button type="primary" @click="navigateToAddMedicine">
            <el-icon><i-ep-plus /></el-icon>
            Add Medicine
          </el-button>
          
          <el-button type="warning" @click="navigateToStockAdjustment">
            <el-icon><i-ep-edit /></el-icon>
            Stock Adjustment
          </el-button>
          
          <el-button type="info" @click="navigateToMedicinesList">
            <el-icon><i-ep-list /></el-icon>
            View All Medicines
          </el-button>
          
          <el-button>
            <el-icon><i-ep-printer /></el-icon>
            Print Reports
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMedicinesStore } from '@/store/medicines'

const router = useRouter()
const medicinesStore = useMedicinesStore()

// Fetch medicines on component mount
onMounted(() => {
  medicinesStore.fetchMedicines()
})

// Stats data
const medicineStats = computed(() => {
  const medicines = medicinesStore.medicines
  const today = new Date()
  
  // Count expired items
  const expired = medicines.filter(medicine => {
    const expiryDate = new Date(medicine.expiryDate)
    return expiryDate < today
  }).length
  
  // Count low stock items (less than 50 items)
  const lowStock = medicines.filter(medicine => 
    medicine.quantity > 0 && medicine.quantity < 50
  ).length
  
  // Calculate total sales (this would come from a real API)
  const monthlySales = 24750.80
  
  return {
    totalCount: medicines.length,
    lowStock,
    expired,
    monthlySales
  }
})

// Recent activities data
const recentActivities = ref([
  {
    content: 'Added 100 units of Aspirin to stock',
    timestamp: '10 minutes ago',
    type: 'primary'
  },
  {
    content: 'Updated price for Paracetamol',
    timestamp: '30 minutes ago',
    type: 'info'
  },
  {
    content: 'Removed 20 expired units of Amoxicillin',
    timestamp: '2 hours ago',
    type: 'warning'
  },
  {
    content: 'New medicine Ibuprofen added to database',
    timestamp: '5 hours ago',
    type: 'success'
  }
])

// Methods
const navigateToAddMedicine = () => {
  router.push({ name: 'AddMedicine' })
}

const navigateToStockAdjustment = () => {
  router.push({ name: 'StockAdjustment' })
}

const navigateToMedicinesList = () => {
  router.push({ name: 'MedicinesList' })
}

const loadMoreActivity = () => {
  // This would load more activity data from an API
  console.log('Loading more activity...')
}

const formatCurrency = (value) => {
  return `$${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
}
</script>

<style scoped>
.home-page {
  padding-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-icon {
  font-size: 24px;
  opacity: 0.8;
}

.stats-value {
  font-size: 28px;
  font-weight: 600;
  margin: 10px 0;
}

.stats-trend {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.stats-trend.positive {
  color: var(--success-color);
}

.stats-trend.negative {
  color: var(--danger-color);
}

.charts-section {
  margin-bottom: 30px;
}

.chart-placeholder {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
}

.recent-activity {
  margin-bottom: 30px;
}

.recent-activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}
</style> 