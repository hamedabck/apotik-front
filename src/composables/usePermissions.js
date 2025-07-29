import { computed } from 'vue'
import { useRolesStore } from '@/store/roles'
import { PERMISSIONS, ROLES } from '@/store/roles'

export function usePermissions() {
  const rolesStore = useRolesStore()
  
  // Computed properties for common permission checks
  const canViewMedicines = computed(() => rolesStore.hasPermission(PERMISSIONS.VIEW_MEDICINES))
  const canAddMedicines = computed(() => rolesStore.hasPermission(PERMISSIONS.ADD_MEDICINES))
  const canEditMedicines = computed(() => rolesStore.hasPermission(PERMISSIONS.EDIT_MEDICINES))
  const canDeleteMedicines = computed(() => rolesStore.hasPermission(PERMISSIONS.DELETE_MEDICINES))
  const canAdjustStock = computed(() => rolesStore.hasPermission(PERMISSIONS.STOCK_ADJUSTMENT))
  const canViewReports = computed(() => rolesStore.hasPermission(PERMISSIONS.VIEW_REPORTS))
  const canExportReports = computed(() => rolesStore.hasPermission(PERMISSIONS.EXPORT_REPORTS))
  const canAccessFinancialSettings = computed(() => rolesStore.hasPermission(PERMISSIONS.FINANCIAL_SETTINGS))
  const canAccessManagementSettings = computed(() => rolesStore.hasPermission(PERMISSIONS.MANAGEMENT_SETTINGS))
  const canAccessUserSettings = computed(() => rolesStore.hasPermission(PERMISSIONS.USER_SETTINGS))
  
  // Role checks
  const isAdmin = computed(() => rolesStore.currentUserRole === ROLES.ADMIN)
  const isPharmacist = computed(() => rolesStore.currentUserRole === ROLES.PHARMACIST)
  const isStaff = computed(() => rolesStore.currentUserRole === ROLES.STAFF)
  
  // General permission functions
  const hasPermission = (permission) => rolesStore.hasPermission(permission)
  const hasAnyPermission = (permissions) => rolesStore.hasAnyPermission(permissions)
  const hasAllPermissions = (permissions) => rolesStore.hasAllPermissions(permissions)
  const canAccessRoute = (routeName) => rolesStore.canAccessRoute(routeName)
  
  // Helper functions for UI
  const getActionButtons = (context = 'medicines') => {
    const buttons = []
    
    if (context === 'medicines') {
      if (canViewMedicines.value) {
        buttons.push({ action: 'view', label: 'View', type: 'primary', icon: 'i-ep-view' })
      }
      if (canEditMedicines.value) {
        buttons.push({ action: 'edit', label: 'Edit', type: 'warning', icon: 'i-ep-edit' })
      }
      if (canDeleteMedicines.value) {
        buttons.push({ action: 'delete', label: 'Delete', type: 'danger', icon: 'i-ep-delete' })
      }
    }
    
    return buttons
  }
  
  const getPermissionMessage = (permission) => {
    const messages = {
      [PERMISSIONS.VIEW_MEDICINES]: 'You need permission to view medicines',
      [PERMISSIONS.ADD_MEDICINES]: 'You need permission to add medicines',
      [PERMISSIONS.EDIT_MEDICINES]: 'You need permission to edit medicines',
      [PERMISSIONS.DELETE_MEDICINES]: 'You need permission to delete medicines',
      [PERMISSIONS.STOCK_ADJUSTMENT]: 'You need permission to adjust stock',
      [PERMISSIONS.VIEW_REPORTS]: 'You need permission to view reports',
      [PERMISSIONS.EXPORT_REPORTS]: 'You need permission to export reports',
      [PERMISSIONS.FINANCIAL_SETTINGS]: 'You need admin access to financial settings',
      [PERMISSIONS.MANAGEMENT_SETTINGS]: 'You need admin access to management settings',
      [PERMISSIONS.USER_SETTINGS]: 'You need admin access to user settings'
    }
    
    return messages[permission] || 'You do not have permission for this action'
  }
  
  return {
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    
    // Specific permissions
    canViewMedicines,
    canAddMedicines,
    canEditMedicines,
    canDeleteMedicines,
    canAdjustStock,
    canViewReports,
    canExportReports,
    canAccessFinancialSettings,
    canAccessManagementSettings,
    canAccessUserSettings,
    
    // Role checks
    isAdmin,
    isPharmacist,
    isStaff,
    
    // Helper functions
    getActionButtons,
    getPermissionMessage,
    
    // Store access
    rolesStore,
    
    // Constants
    PERMISSIONS,
    ROLES
  }
} 