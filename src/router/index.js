import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
      },
      {
        path: 'medicines',
        name: 'MedicinesList',
        component: () => import('@/views/medicines/MedicinesListView.vue')
      },
      {
        path: 'medicines/add',
        name: 'AddMedicine',
        component: () => import('@/views/medicines/AddMedicineView.vue')
      },
      {
        path: 'medicines/:id',
        name: 'MedicineDetail',
        component: () => import('@/views/medicines/MedicineDetailView.vue'),
      },
      {
        path: 'medicines/:id/edit',
        name: 'EditMedicine',
        component: () => import('@/views/medicines/EditMedicineView.vue')
      },
      {
        path: 'stock-adjustment',
        name: 'StockAdjustment',
        component: () => import('@/views/medicines/StockAdjustmentView.vue')
      },
      {
        path: 'reporting',
        name: 'Reporting',
        component: () => import('@/views/ReportingView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router 