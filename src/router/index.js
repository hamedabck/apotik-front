import { createRouter, createWebHistory } from 'vue-router'
import FinancialSettings from '@/views/settings/FinancialSettings.vue'
import ManagementSettings from '@/views/settings/ManagementSettings.vue'
import UserSettings from '@/views/settings/UserSettings.vue'

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
      },
      {
        path: 'settings/financial',
        name: 'financial-settings',
        component: FinancialSettings,
        meta: {
          requiresAuth: true,
          title: 'Financial Settings'
        }
      },
      {
        path: 'settings/management',
        name: 'management-settings',
        component: ManagementSettings,
        meta: {
          requiresAuth: true,
          title: 'Management Settings'
        }
      },
      {
        path: 'settings/users',
        name: 'user-settings',
        component: UserSettings,
        meta: {
          requiresAuth: true,
          title: 'User Settings'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router 