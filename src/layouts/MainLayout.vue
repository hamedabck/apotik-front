<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-header">
        <img src="@/assets/logo.png" alt="Pharmacy Logo" class="logo" />
        <h1 class="app-name" v-if="!isCollapsed">Apotik System</h1>
        <div class="toggle-button" @click="toggleSidebar">
          <el-icon :class="{ 'rotate-180': isCollapsed }">
            <i-ep-arrow-left />
          </el-icon>
        </div>
      </div>
      
      <!-- Navigation menu -->
      <nav class="sidebar-nav">
        <el-menu 
          :router="true"
          :default-active="activeMenu"
          class="sidebar-menu"
          :collapse="isCollapsed"
          background-color="transparent"
          text-color="#F4EEFF"
          active-text-color="#F4EEFF">
          
          <!-- Dynamic menu items based on user role -->
          <template v-for="item in filteredMenuItems" :key="item.index">
            <!-- Regular menu item -->
            <el-menu-item 
              v-if="item.type !== 'submenu'" 
              :index="item.index">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
            
            <!-- Submenu -->
            <el-sub-menu 
              v-else 
              :index="item.index" 
              popper-append-to-body>
              <template #title>
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.title }}</span>
              </template>
              
              <el-menu-item 
                v-for="child in item.children" 
                :key="child.index"
                :index="child.index">
                <el-icon>
                  <component :is="child.icon" />
                </el-icon>
                <span>{{ child.title }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </nav>
      
      <!-- User profile -->
      <div class="user-profile">
        <el-dropdown @command="handleUserAction" trigger="click" placement="top-start">
          <div class="user-profile-content">
            <div class="avatar-container">
              <el-avatar :size="36" :src="userAvatar">
                <el-icon><i-ep-user /></el-icon>
              </el-avatar>
            </div>
            <div class="user-info" v-if="!isCollapsed">
              <h4 class="user-name">{{ authStore.user?.email || 'User' }}</h4>
              <p class="user-role">{{ authStore.user?.pharmacy?.name || authStore.user?.pharmacy_name || 'No Pharmacy' }}</p>
            </div>
            <el-icon v-if="!isCollapsed" class="dropdown-icon">
              <i-ep-arrow-up />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><i-ep-user /></el-icon>
                Profile
              </el-dropdown-item>
              <el-dropdown-item command="settings" v-if="rolesStore.hasPermission('user_settings')">
                <el-icon><i-ep-setting /></el-icon>
                Settings
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><i-ep-switch-button /></el-icon>
                Logout
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content" :class="{ 'content-expanded': isCollapsed }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useRolesStore } from '@/store/roles'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const rolesStore = useRolesStore()
const isCollapsed = ref(true)

// Compute active menu item based on current route
const activeMenu = computed(() => {
  return route.path
})

// Get filtered menu items based on user role
const filteredMenuItems = computed(() => {
  return rolesStore.getFilteredMenuItems()
})

// User avatar placeholder
const userAvatar = computed(() => {
  // You can implement avatar logic here
  return null // This will show the default icon
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleUserAction = async (command) => {
  switch (command) {
    case 'profile':
      // Navigate to profile page (you can implement this)
      ElMessage.info('Profile page coming soon!')
      break
    case 'settings':
      router.push({ name: 'user-settings' })
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          'Are you sure you want to logout?',
          'Confirm Logout',
          {
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel',
            type: 'warning',
          }
        )
        
        authStore.logout()
        ElMessage.success('Logged out successfully')
        router.push({ name: 'Auth' })
      } catch {
        // User cancelled
      }
      break
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  padding-left: 10px;
  transition: padding 0.3s ease;
}

.app-container:has(.sidebar:not(.is-collapsed)) {
  padding-left: 250px;
}

.sidebar {
  width: 250px;
  background-color: #3586d7;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  transition: all 0.3s ease;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

.sidebar.is-collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.toggle-button {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  z-index: 11;
  transition: all 0.3s ease;
}

.toggle-button:hover {
  background-color: #f0f0f0;
}

.toggle-button .el-icon {
  color: #6c5ce7;
  font-size: 12px;
  transition: transform 0.3s ease;
}

.toggle-button .rotate-180 {
  transform: rotate(180deg);
}

.logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.app-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-search {
  padding: 15px;
}

.sidebar-search :deep(.el-input__inner) {
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  border-radius: 20px;
}

.sidebar-search :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-search :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.6);
}

.sidebar-nav {
  flex: 1 1 auto;
  margin-top: 10px;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
  background-color: transparent !important;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 100%;
}

.sidebar-menu.el-menu--collapse {
  width: 64px;
}

/* Menu item styling */
.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 0;
  border-radius: 0 25px 25px 0;
  margin-right: 16px;
}

.sidebar-menu :deep(.el-menu-item .el-icon),
.sidebar-menu :deep(.el-sub-menu__title .el-icon) {
  color: #fff;
  margin-right: 10px;
  font-size: 18px;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #fff !important;
  color: #409eff !important;
}

.sidebar-menu :deep(.el-menu-item.is-active .el-icon) {
  color: #409eff !important;
}

.sidebar-menu :deep(.el-sub-menu__title) {
  color: #fff !important;
  height: 50px;
  line-height: 50px;
  margin: 4px 0;
  border-radius: 0 25px 25px 0;
  margin-right: 16px;
}

.sidebar-menu :deep(.el-sub-menu__title:hover) {
  /* color: #000000; */
  background-color: rgba(255, 255, 255, 0.1) !important;

}

/* Sub-menu items in collapsed state */
.sidebar.is-collapsed :deep(.el-menu--popup) {
  background-color: #409eff;
  border-radius: 8px;
  min-width: 180px;
  padding: 5px;
  margin-left: 8px;
}

.sidebar.is-collapsed :deep(.el-menu--popup .el-menu-item) {
  color: #fff;
  margin-right: 0;
  border-radius: 5px;
}

.sidebar.is-collapsed :deep(.el-menu--popup .el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.sidebar.is-collapsed :deep(.el-menu--popup .el-menu-item.is-active) {
  background-color: #fff !important;
  color: #409eff !important;
}

.user-profile {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
}

.user-profile-content {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  width: 100%;
}

.user-profile-content:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.avatar-container {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
}

.user-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  text-overflow: ellipsis;
  overflow: hidden;
}

.user-role {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  text-overflow: ellipsis;
  overflow: hidden;
}

.dropdown-icon {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  flex-shrink: 0;
}

/* Dropdown menu styling */
:deep(.el-dropdown-menu) {
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow);
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: var(--text-primary);
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: var(--background-color);
  color: var(--primary-color);
}

:deep(.el-dropdown-menu__item .el-icon) {
  font-size: 16px;
}

.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 0;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.content-expanded {
  margin-left: 64px;
}

@media (max-width: 768px) {
  .app-container {
    padding-left: 0;
  }
  
  .sidebar {
    left: 0;
  }
  
  .sidebar.is-collapsed {
    left: -64px;
  }
  
  .content-expanded {
    margin-left: 0;
  }
}
</style> 