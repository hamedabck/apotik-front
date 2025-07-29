<template>
  <div class="unauthorized-page">
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <div class="error-icon">
          <el-icon size="120" color="#f56c6c">
            <i-ep-lock />
          </el-icon>
        </div>
        
        <h1 class="error-title">Access Denied</h1>
        <p class="error-message">
          You don't have permission to access this page.
        </p>
        
        <div class="user-info">
          <p>Current Role: <strong>{{ rolesStore.getRoleDisplayName() }}</strong></p>
          <p>Contact your administrator if you believe this is an error.</p>
        </div>
        
        <div class="action-buttons">
          <el-button type="primary" @click="goBack">
            <el-icon><i-ep-arrow-left /></el-icon>
            Go Back
          </el-button>
          <el-button @click="goHome">
            <el-icon><i-ep-house /></el-icon>
            Go to Dashboard
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useRolesStore } from '@/store/roles'

const router = useRouter()
const rolesStore = useRolesStore()

const goBack = () => {
  router.go(-1)
}

const goHome = () => {
  router.push({ name: 'Home' })
}
</script>

<style scoped>
.unauthorized-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color);
  padding: 20px;
}

.unauthorized-container {
  max-width: 500px;
  width: 100%;
}

.unauthorized-content {
  background: var(--white);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 60px 40px;
  text-align: center;
}

.error-icon {
  margin-bottom: 30px;
}

.error-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.error-message {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0 0 30px 0;
  line-height: 1.6;
}

.user-info {
  background: var(--background-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.user-info p {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
}

.user-info p:last-child {
  margin-bottom: 0;
}

.user-info strong {
  color: var(--primary-color);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  min-width: 140px;
}

@media (max-width: 480px) {
  .unauthorized-content {
    padding: 40px 20px;
  }
  
  .error-title {
    font-size: 2rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style> 