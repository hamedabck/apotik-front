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
      
      <!-- Search input -->
      <div class="sidebar-search" v-if="!isCollapsed">
        <el-input placeholder="Search..." prefix-icon="el-icon-search"></el-input>
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
          
          <el-menu-item index="/">
            <el-icon><i-ep-house /></el-icon>
            <template #title>Dashboard</template>
          </el-menu-item>
          
          <el-menu-item index="/medicines">
            <el-icon><i-ep-medicine-box /></el-icon>
            <template #title>Medicines</template>
          </el-menu-item>
          
          <el-menu-item index="/medicines/add">
            <el-icon><i-ep-plus /></el-icon>
            <template #title>Add New Medicine</template>
          </el-menu-item>
          
          <el-menu-item index="/stock-adjustment">
            <el-icon><i-ep-edit /></el-icon>
            <template #title>Stock Adjustment</template>
          </el-menu-item>
          
          <el-menu-item index="/reporting">
            <el-icon><i-ep-data-analysis /></el-icon>
            <template #title>Reports</template>
          </el-menu-item>

          <el-sub-menu index="settings" popper-append-to-body>
            <template #title>
              <el-icon><i-ep-setting /></el-icon>
              <span>Settings</span>
            </template>
            <el-menu-item index="/settings/financial">
              <el-icon><i-ep-money /></el-icon>
              <span>Financial Settings</span>
            </el-menu-item>
            <el-menu-item index="/settings/management">
              <el-icon><i-ep-management /></el-icon>
              <span>Management Settings</span>
            </el-menu-item>
            <el-menu-item index="/settings/users">
              <el-icon><i-ep-user /></el-icon>
              <span>User Settings</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </nav>
      
      <!-- User profile -->
      <div class="user-profile">
        <img src="@/assets/avatar.png" alt="User Avatar" class="avatar" />
        <div class="user-info" v-if="!isCollapsed">
          <h4 class="user-name">Hamed ABC</h4>
          <p class="user-role">Administrator</p>
        </div>
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
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapsed = ref(true)

// Compute active menu item based on current route
const activeMenu = computed(() => {
  return route.path
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
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
  overflow-y: auto;
  overflow-x: hidden;
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
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.5);
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
}

.user-role {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
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