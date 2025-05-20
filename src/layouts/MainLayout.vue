<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="@/assets/logo.png" alt="Pharmacy Logo" class="logo" />
        <h1 class="app-name">Apotik System</h1>
      </div>
      
      <!-- Search input -->
      <div class="sidebar-search">
        <el-input placeholder="Search..." prefix-icon="el-icon-search"></el-input>
      </div>
      
      <!-- Navigation menu -->
      <nav class="sidebar-nav">
        <el-menu 
          :router="true"
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="transparent"
          text-color="#606266"
          active-text-color="#4b70e2">
          
          <el-menu-item index="/">
            <el-icon><i-ep-house /></el-icon>
            <span>Dashboard</span>
          </el-menu-item>
          
          <el-menu-item index="/medicines">
            <el-icon><i-ep-medicine-box /></el-icon>
            <span>Medicines</span>
          </el-menu-item>
          
          <el-menu-item index="/medicines/add">
            <el-icon><i-ep-plus /></el-icon>
            <span>Add New Medicine</span>
          </el-menu-item>
          
          <el-menu-item index="/stock-adjustment">
            <el-icon><i-ep-edit /></el-icon>
            <span>Stock Adjustment</span>
          </el-menu-item>
          
          <el-menu-item index="/reporting">
            <el-icon><i-ep-data-analysis /></el-icon>
            <span>Reports</span>
          </el-menu-item>

          <el-sub-menu index="settings">
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
        <div class="user-info">
          <h4 class="user-name">Hamed ABC</h4>
          <p class="user-role">Administrator</p>
        </div>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Compute active menu item based on current route
const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #3F72AF;
  box-shadow: var(--shadow);
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(244, 238, 255, 0.2);
  background-color: #3F72AF;
  color: #F4EEFF;
}

.logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.app-name {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #F4EEFF;
}

.sidebar-search {
  padding: 15px;
  background-color: #3F72AF;
}

.sidebar-search :deep(.el-input) {
  background-color: #3F72AF;
}

.sidebar-search :deep(.el-input__inner) {
  background-color: #F4EEFF;
  color: #F4EEFF;
}

.sidebar-search :deep(.el-input__inner::placeholder) {
  color: rgba(1, 0, 9, 0.7);
}

.sidebar-nav {
  flex: 1 1 auto;
  margin-top: 10px;
  background-color: #3F72AF;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu :deep(.el-menu-item) {
  color: #F4EEFF !important;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(244, 238, 255, 0.1) !important;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: rgba(244, 238, 255, 0.15) !important;
  color: #F4EEFF !important;
}

.sidebar-menu :deep(.el-sub-menu__title) {
  color: #F4EEFF !important;
}

.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background-color: rgba(244, 238, 255, 0.1) !important;
}

.user-profile {
  width: 100%;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid rgba(244, 238, 255, 0.2);
  background-color: #3F72AF;
  margin-top: auto;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #F4EEFF;
}

.user-role {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(244, 238, 255, 0.7);
}

@media (max-width: 768px) {
  .user-profile {
    position: relative;
  }
}
</style> 