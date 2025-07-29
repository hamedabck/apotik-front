import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useRolesStore } from '@/store/roles'
import { ElMessage } from 'element-plus'
import FinancialSettings from '@/views/settings/FinancialSettings.vue'
import ManagementSettings from '@/views/settings/ManagementSettings.vue'
import UserSettings from '@/views/settings/UserSettings.vue'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthView.vue'),
    meta: {
      requiresGuest: true,
      title: 'Login'
    }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/views/UnauthorizedView.vue'),
    meta: {
      title: 'Access Denied'
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: {
          title: 'Dashboard'
        }
      },
      {
        path: 'medicines',
        name: 'MedicinesList',
        component: () => import('@/views/medicines/MedicinesListView.vue'),
        meta: {
          title: 'Medicines List',
          requiresPermission: true
        }
      },
      {
        path: 'medicines/add',
        name: 'AddMedicine',
        component: () => import('@/views/medicines/AddMedicineView.vue'),
        meta: {
          title: 'Add Medicine',
          requiresPermission: true
        }
      },
      {
        path: 'medicines/:id',
        name: 'MedicineDetail',
        component: () => import('@/views/medicines/MedicineDetailView.vue'),
        meta: {
          title: 'Medicine Details',
          requiresPermission: true
        }
      },
      {
        path: 'medicines/:id/edit',
        name: 'EditMedicine',
        component: () => import('@/views/medicines/EditMedicineView.vue'),
        meta: {
          title: 'Edit Medicine',
          requiresPermission: true
        }
      },
      {
        path: 'drug-adjustments',
        name: 'DrugAdjustments',
        component: () => import('@/views/medicines/DrugAdjustmentsTabsView.vue'),
        meta: {
          title: 'Drug Adjustments',
          requiresPermission: true
        }
      },
      {
        path: 'factors',
        name: 'Factors',
        component: () => import('@/views/medicines/FactorsTabsView.vue'),
        meta: {
          title: 'Factors',
          requiresPermission: true
        }
      },
      {
        path: 'invoices',
        name: 'Invoices',
        component: () => import('@/views/medicines/InvoicesTabsView.vue'),
        meta: {
          title: 'Invoices',
          requiresPermission: true
        }
      },
      {
        path: 'sell',
        name: 'Sell',
        component: () => import('@/views/medicines/SellView.vue'),
        meta: {
          title: 'Sell',
          requiresPermission: true
        }
      },
      {
        path: 'ttac-drugs/upload',
        name: 'TtacDrugsUpload',
        component: () => import('@/views/medicines/TtacDrugsUploadView.vue'),
        meta: {
          title: 'TTAC Drugs Upload',
          requiresPermission: true
        }
      },
      {
        path: 'reporting',
        name: 'Reporting',
        component: () => import('@/views/ReportingView.vue'),
        meta: {
          title: 'Reporting',
          requiresPermission: true
        }
      },
      {
        path: 'settings/financial',
        name: 'financial-settings',
        component: FinancialSettings,
        meta: {
          requiresAuth: true,
          requiresPermission: true,
          title: 'Financial Settings'
        }
      },
      {
        path: 'settings/management',
        name: 'management-settings',
        component: ManagementSettings,
        meta: {
          requiresAuth: true,
          requiresPermission: true,
          title: 'Management Settings'
        }
      },
      {
        path: 'settings/users',
        name: 'user-settings',
        component: UserSettings,
        meta: {
          requiresAuth: true,
          requiresPermission: true,
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

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const rolesStore = useRolesStore()
  
  // Initialize auth state if not already done
  if (!authStore.user && authStore.accessToken) {
    await authStore.initializeAuth()
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Auth' })
    return
  }
  
  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Home' })
    return
  }
  
  // Check role-based permissions
  if (to.meta.requiresPermission && authStore.isAuthenticated) {
    const canAccess = rolesStore.canAccessRoute(to.name)
    if (!canAccess) {
      ElMessage.error('You do not have permission to access this page')
      next({ name: 'Unauthorized' })
      return
    }
  }
  
  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Pharmacy Management`
  }
  
  next()
})

export default router 