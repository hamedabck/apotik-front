<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Header with toggle -->
        <div class="auth-header">
          <h1 class="auth-title">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h1>
          <p class="auth-subtitle">
            {{ isLogin ? 'Sign in to your pharmacy management account' : 'Join our pharmacy management system' }}
          </p>
        </div>

        <!-- Toggle buttons -->
        <div class="auth-toggle">
          <button 
            :class="['toggle-btn', { active: isLogin }]" 
            @click="setMode(true)">
            Login
          </button>
          <button 
            :class="['toggle-btn', { active: !isLogin }]" 
            @click="setMode(false)">
            Register
          </button>
        </div>

        <!-- Error message -->
        <el-alert
          v-if="authStore.error"
          :title="authStore.error"
          type="error"
          :closable="false"
          class="auth-error" />

        <!-- Login Form -->
        <el-form
          v-if="isLogin"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="auth-form"
          @submit.prevent="handleLogin">
          
          <el-form-item prop="email">
            <el-input
              v-model="loginForm.email"
              placeholder="Email address"
              size="large"
              prefix-icon="Message">
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="Password"
              size="large"
              prefix-icon="Lock"
              show-password>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="authStore.loading"
              @click="handleLogin"
              class="auth-submit-btn">
              {{ authStore.loading ? 'Signing In...' : 'Sign In' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- Registration Form -->
        <el-form
          v-else
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="auth-form"
          @submit.prevent="handleRegister">
          
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="Email address"
              size="large"
              prefix-icon="Message">
            </el-input>
          </el-form-item>

          <el-form-item prop="pharmacy">
            <el-select
              v-model="registerForm.pharmacy"
              placeholder="Search and select your pharmacy"
              size="large"
              style="width: 100%"
              :loading="pharmaciesLoading"
              filterable
              clearable
              no-data-text="No pharmacies found. Try a different search term."
              :filter-method="filterPharmacies">
              <template #prefix>
                <el-icon><i-ep-search /></el-icon>
              </template>
              <el-option
                v-for="pharmacy in filteredPharmacies"
                :key="pharmacy.id"
                :label="pharmacy.name"
                :value="pharmacy.id">
                <div style="display: flex; flex-direction: column; padding: 4px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500;">{{ pharmacy.name }}</span>
                    <span style="color: #8492a6; font-size: 11px;">{{ pharmacy.license_number }}</span>
                  </div>
                  <div v-if="pharmacy.address" style="color: #8492a6; font-size: 12px; margin-top: 2px;">
                    {{ pharmacy.address }}
                  </div>
                  <div v-if="pharmacy.phone" style="color: #8492a6; font-size: 11px; margin-top: 1px;">
                    📞 {{ pharmacy.phone }}
                  </div>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="Password"
              size="large"
              prefix-icon="Lock"
              show-password>
            </el-input>
          </el-form-item>

          <el-form-item prop="passwordConfirm">
            <el-input
              v-model="registerForm.passwordConfirm"
              type="password"
              placeholder="Confirm password"
              size="large"
              prefix-icon="Lock"
              show-password>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="authStore.loading"
              @click="handleRegister"
              class="auth-submit-btn">
              {{ authStore.loading ? 'Creating Account...' : 'Create Account' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- Footer -->
        <div class="auth-footer">
          <p v-if="isLogin">
            Don't have an account? 
            <button @click="setMode(false)" class="link-btn">Sign up here</button>
          </p>
          <p v-else>
            Already have an account? 
            <button @click="setMode(true)" class="link-btn">Sign in here</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const loginFormRef = ref()
const registerFormRef = ref()

// Pharmacy data
const pharmacies = ref([])
const pharmaciesLoading = ref(false)
const pharmacySearchQuery = ref('')

// Computed property for filtered pharmacies
const filteredPharmacies = computed(() => {
  if (!pharmacySearchQuery.value) {
    return pharmacies.value
  }
  
  const query = pharmacySearchQuery.value.toLowerCase()
  return pharmacies.value.filter(pharmacy => 
    pharmacy.name.toLowerCase().includes(query) ||
    (pharmacy.license_number && pharmacy.license_number.toLowerCase().includes(query)) ||
    (pharmacy.address && pharmacy.address.toLowerCase().includes(query)) ||
    (pharmacy.phone && pharmacy.phone.toLowerCase().includes(query))
  )
})

// Login form data
const loginForm = reactive({
  email: '',
  password: ''
})

// Registration form data
const registerForm = reactive({
  email: '',
  pharmacy: '',
  password: '',
  passwordConfirm: ''
})

// Validation rules
const loginRules = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Please enter your password', trigger: 'blur' }
  ]
}

const registerRules = {
  email: [
    { required: true, message: 'Please enter your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  pharmacy: [
    { required: true, message: 'Please search and select your pharmacy from the list', trigger: 'change' }
  ],
  password: [
    { required: true, message: 'Please enter a password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters', trigger: 'blur' }
  ],
  passwordConfirm: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('Passwords do not match'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// Fetch pharmacies for registration
async function fetchPharmacies() {
  pharmaciesLoading.value = true
  try {
    const response = await axios.get('http://localhost:8000/api/pharmacy/pharmacies/')
    pharmacies.value = response.data
  } catch (error) {
    console.error('Error fetching pharmacies:', error)
    ElMessage.error('Failed to load pharmacies')
  } finally {
    pharmaciesLoading.value = false
  }
}

// Filter pharmacies based on search query
function filterPharmacies(query) {
  pharmacySearchQuery.value = query
}

function setMode(loginMode) {
  isLogin.value = loginMode
  authStore.clearError()
  
  // Reset forms
  if (loginFormRef.value) {
    loginFormRef.value.resetFields()
  }
  if (registerFormRef.value) {
    registerFormRef.value.resetFields()
  }
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  const result = await authStore.login(loginForm)
  
  if (result.success) {
    ElMessage.success('Login successful!')
    router.push({ name: 'Home' })
  }
}

async function handleRegister() {
  if (!registerFormRef.value) return
  
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  const result = await authStore.register(registerForm)
  
  if (result.success) {
    ElMessage.success('Registration successful!')
    router.push({ name: 'Home' })
  }
}

onMounted(() => {
  // Clear any existing errors
  authStore.clearError()
  
  // Fetch pharmacies for registration form
  fetchPharmacies()
  
  // If user is already authenticated, redirect to home
  if (authStore.isAuthenticated) {
    router.push({ name: 'Home' })
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color) 0%, #6c5ce7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-card {
  background: var(--white);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
}

.auth-header {
  margin-bottom: 30px;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.auth-subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.95rem;
}

.auth-toggle {
  display: flex;
  background: var(--background-color);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 30px;
}

.toggle-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background: var(--white);
  color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.auth-error {
  margin-bottom: 20px;
  text-align: left;
}

.auth-form {
  text-align: left;
}

.auth-form .el-form-item {
  margin-bottom: 20px;
}

.auth-submit-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
}

.auth-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.auth-footer p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 500;
  text-decoration: underline;
}

.link-btn:hover {
  color: #3a5bc7;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .auth-card {
    padding: 30px 20px;
  }
  
  .auth-title {
    font-size: 1.75rem;
  }
}
</style> 