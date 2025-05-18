<template>
  <div class="reporting-page">
    <div class="page-header">
      <h1 class="page-title">Reports & Analytics</h1>
    </div>
    <el-card>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="Total Medicines" :value="stats.total" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="Low Stock" :value="stats.lowStock" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="Expired" :value="stats.expired" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="Near Expiry" :value="stats.nearExpiry" />
        </el-col>
      </el-row>
    </el-card>
    <el-card style="margin-top: 20px;">
      <el-button type="primary" @click="exportCSV">Export Medicines CSV</el-button>
    </el-card>
    <el-card style="margin-top: 20px;">
      <div id="medicine-chart" style="height: 400px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useMedicinesStore } from '@/store/medicines'
import * as echarts from 'echarts'

const medicinesStore = useMedicinesStore()
const stats = computed(() => {
  const meds = medicinesStore.medicines
  const today = new Date()
  return {
    total: meds.length,
    lowStock: meds.filter(m => m.quantity > 0 && m.quantity < 50).length,
    expired: meds.filter(m => new Date(m.expiryDate) < today).length,
    nearExpiry: meds.filter(m => {
      const d = new Date(m.expiryDate)
      const diff = (d - today) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff < 90
    }).length
  }
})

const exportCSV = () => {
  const rows = [
    ['Name', 'Company', 'Generic Code', 'Quantity', 'Price', 'Expiry Date'],
    ...medicinesStore.medicines.map(m =>
      [m.name, m.companyName, m.genericCode, m.quantity, m.sellingPrice, m.expiryDate]
    )
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'medicines.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  // ECharts: Pie chart for stock status
  const chart = echarts.init(document.getElementById('medicine-chart'))
  const meds = medicinesStore.medicines
  const today = new Date()
  const expired = meds.filter(m => new Date(m.expiryDate) < today).length
  const nearExpiry = meds.filter(m => {
    const d = new Date(m.expiryDate)
    const diff = (d - today) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff < 90
  }).length
  const safe = meds.length - expired - nearExpiry
  chart.setOption({
    title: { text: 'Stock Expiry Status', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: 'Status',
        type: 'pie',
        radius: '60%',
        data: [
          { value: expired, name: 'Expired' },
          { value: nearExpiry, name: 'Near Expiry' },
          { value: safe, name: 'Safe' }
        ],
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }
    ]
  })
})
</script>

<style scoped>
.reporting-page {
  padding-bottom: 30px;
}
</style> 