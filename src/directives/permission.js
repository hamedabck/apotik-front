import { useRolesStore } from '@/store/roles'

export const permissionDirective = {
  mounted(el, binding) {
    checkPermission(el, binding)
  },
  updated(el, binding) {
    checkPermission(el, binding)
  }
}

function checkPermission(el, binding) {
  const rolesStore = useRolesStore()
  const { value } = binding
  
  if (!value) {
    return
  }
  
  let hasPermission = false
  
  if (typeof value === 'string') {
    // Single permission
    hasPermission = rolesStore.hasPermission(value)
  } else if (Array.isArray(value)) {
    // Multiple permissions - check if user has ANY of them
    hasPermission = rolesStore.hasAnyPermission(value)
  } else if (typeof value === 'object') {
    // Object with options
    const { permissions, requireAll = false } = value
    
    if (Array.isArray(permissions)) {
      hasPermission = requireAll 
        ? rolesStore.hasAllPermissions(permissions)
        : rolesStore.hasAnyPermission(permissions)
    } else if (typeof permissions === 'string') {
      hasPermission = rolesStore.hasPermission(permissions)
    }
  }
  
  if (!hasPermission) {
    // Hide the element
    el.style.display = 'none'
    el.setAttribute('data-permission-hidden', 'true')
  } else {
    // Show the element
    if (el.getAttribute('data-permission-hidden')) {
      el.style.display = ''
      el.removeAttribute('data-permission-hidden')
    }
  }
}

export default permissionDirective 