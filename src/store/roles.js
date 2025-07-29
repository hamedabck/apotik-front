import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

// Define role hierarchy and permissions
export const ROLES = {
  ADMIN: 'admin',
  PHARMACIST: 'pharmacist', 
  STAFF: 'staff'
}

export const PERMISSIONS = {
  // Medicine permissions
  VIEW_MEDICINES: 'view_medicines',
  ADD_MEDICINES: 'add_medicines',
  EDIT_MEDICINES: 'edit_medicines',
  DELETE_MEDICINES: 'delete_medicines',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  TTAC_DRUGS_UPLOAD: 'ttac_drugs_upload',
  SELL: 'sell',
  
  // Reporting permissions
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // Settings permissions
  FINANCIAL_SETTINGS: 'financial_settings',
  MANAGEMENT_SETTINGS: 'management_settings',
  USER_SETTINGS: 'user_settings',
  
  // System permissions
  ADMIN_ACCESS: 'admin_access',
  PHARMACIST_ACCESS: 'pharmacist_access'
}

// Define what permissions each role has
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full access to everything
    PERMISSIONS.VIEW_MEDICINES,
    PERMISSIONS.ADD_MEDICINES,
    PERMISSIONS.EDIT_MEDICINES,
    PERMISSIONS.DELETE_MEDICINES,
    PERMISSIONS.STOCK_ADJUSTMENT,
    PERMISSIONS.TTAC_DRUGS_UPLOAD,
    PERMISSIONS.SELL,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.FINANCIAL_SETTINGS,
    PERMISSIONS.MANAGEMENT_SETTINGS,
    PERMISSIONS.USER_SETTINGS,
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.PHARMACIST_ACCESS
  ],
  [ROLES.PHARMACIST]: [
    // Medicine management and reporting
    PERMISSIONS.VIEW_MEDICINES,
    PERMISSIONS.ADD_MEDICINES,
    PERMISSIONS.EDIT_MEDICINES,
    PERMISSIONS.STOCK_ADJUSTMENT,
    PERMISSIONS.TTAC_DRUGS_UPLOAD,
    PERMISSIONS.SELL,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.PHARMACIST_ACCESS
  ],
  [ROLES.STAFF]: [
    // Basic access - view only
    PERMISSIONS.VIEW_MEDICINES,
    PERMISSIONS.VIEW_REPORTS
  ]
}

export const useRolesStore = defineStore('roles', {
  getters: {
    currentUserRole: () => {
      const authStore = useAuthStore()
      const user = authStore.user
      
      if (!user) return null
      
      // Determine role based on user flags
      if (user.is_staff_member) return ROLES.ADMIN
      if (user.is_pharmacist) return ROLES.PHARMACIST
      return ROLES.STAFF
    },
    
    currentUserPermissions: (state) => {
      const role = state.currentUserRole
      return role ? ROLE_PERMISSIONS[role] || [] : []
    }
  },
  
  actions: {
    hasPermission(permission) {
      return this.currentUserPermissions.includes(permission)
    },
    
    hasAnyPermission(permissions) {
      return permissions.some(permission => this.hasPermission(permission))
    },
    
    hasAllPermissions(permissions) {
      return permissions.every(permission => this.hasPermission(permission))
    },
    
    canAccessRoute(routeName) {
      const routePermissions = this.getRoutePermissions(routeName)
      if (routePermissions.length === 0) return true // No restrictions
      return this.hasAnyPermission(routePermissions)
    },
    
    getRoutePermissions(routeName) {
      const routePermissionMap = {
        // Medicine routes
        'MedicinesList': [PERMISSIONS.VIEW_MEDICINES],
        'AddMedicine': [PERMISSIONS.ADD_MEDICINES],
        'EditMedicine': [PERMISSIONS.EDIT_MEDICINES],
        'MedicineDetail': [PERMISSIONS.VIEW_MEDICINES],
        'StockAdjustment': [PERMISSIONS.STOCK_ADJUSTMENT],
        'DrugAdjustments': [PERMISSIONS.STOCK_ADJUSTMENT],
        'Factors': [PERMISSIONS.STOCK_ADJUSTMENT],
        'Invoices': [PERMISSIONS.STOCK_ADJUSTMENT],
        'Sell': [PERMISSIONS.SELL],
        'TtacDrugsUpload': [PERMISSIONS.TTAC_DRUGS_UPLOAD],
        
        // Reporting
        'Reporting': [PERMISSIONS.VIEW_REPORTS],
        
        // Settings
        'financial-settings': [PERMISSIONS.FINANCIAL_SETTINGS],
        'management-settings': [PERMISSIONS.MANAGEMENT_SETTINGS],
        'user-settings': [PERMISSIONS.USER_SETTINGS],
        
        // Home/Dashboard - accessible to all authenticated users
        'Home': [],
        'Layout': []
      }
      
      return routePermissionMap[routeName] || []
    },
    
    getFilteredMenuItems() {
      const menuItems = [
        {
          index: '/',
          title: 'Dashboard',
          icon: 'i-ep-house',
          permissions: []
        },
        {
          index: '/medicines',
          title: 'Medicines',
          icon: 'i-ep-medicine-box',
          permissions: [PERMISSIONS.VIEW_MEDICINES]
        },
        {
          index: '/medicines/add',
          title: 'Add/Edit Medicine',
          icon: 'i-ep-plus',
          permissions: [PERMISSIONS.ADD_MEDICINES]
        },
        {
          index: '/drug-adjustments',
          title: 'Drug Adjustments',
          icon: 'i-ep-edit',
          permissions: [PERMISSIONS.STOCK_ADJUSTMENT]
        },
        {
          index: '/factors',
          title: 'Factors',
          icon: 'i-ep-document',
          permissions: [PERMISSIONS.STOCK_ADJUSTMENT]
        },
        {
          index: '/invoices',
          title: 'Invoices',
          icon: 'i-ep-receipt',
          permissions: [PERMISSIONS.STOCK_ADJUSTMENT]
        },
        {
          index: '/sell',
          title: 'Sell',
          icon: 'i-ep-shopping-cart',
          permissions: [PERMISSIONS.SELL]
        },
        {
          index: '/ttac-drugs/upload',
          title: 'TTAC Drugs Upload',
          icon: 'i-ep-upload',
          permissions: [PERMISSIONS.TTAC_DRUGS_UPLOAD]
        },
        {
          index: '/reporting',
          title: 'Reports',
          icon: 'i-ep-data-analysis',
          permissions: [PERMISSIONS.VIEW_REPORTS]
        },
        {
          type: 'submenu',
          index: 'settings',
          title: 'Settings',
          icon: 'i-ep-setting',
          children: [
            {
              index: '/settings/financial',
              title: 'Financial Settings',
              icon: 'i-ep-money',
              permissions: [PERMISSIONS.FINANCIAL_SETTINGS]
            },
            {
              index: '/settings/management',
              title: 'Management Settings',
              icon: 'i-ep-management',
              permissions: [PERMISSIONS.MANAGEMENT_SETTINGS]
            },
            {
              index: '/settings/users',
              title: 'User Settings',
              icon: 'i-ep-user',
              permissions: [PERMISSIONS.USER_SETTINGS]
            }
          ]
        }
      ]
      
      return this.filterMenuItems(menuItems)
    },
    
    filterMenuItems(items) {
      return items.filter(item => {
        // Check if user has permission for this item
        if (item.permissions && item.permissions.length > 0) {
          if (!this.hasAnyPermission(item.permissions)) {
            return false
          }
        }
        
        // If it's a submenu, filter its children
        if (item.children) {
          item.children = this.filterMenuItems(item.children)
          // Hide submenu if no children are accessible
          return item.children.length > 0
        }
        
        return true
      })
    },
    
    getRoleDisplayName(role = null) {
      const targetRole = role || this.currentUserRole
      const roleNames = {
        [ROLES.ADMIN]: 'Administrator',
        [ROLES.PHARMACIST]: 'Pharmacist',
        [ROLES.STAFF]: 'Staff Member'
      }
      return roleNames[targetRole] || 'User'
    }
  }
}) 