import './assets/main.css'
import './assets/fonts.css'
import './assets/persian-utils.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import axios from 'axios'
import permissionDirective from './directives/permission'
import persianDirective from './directives/persian'

// Set up axios defaults
axios.defaults.baseURL = 'http://localhost:8000/api'
axios.defaults.headers.common['Content-Type'] = 'application/json'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// Register permission directive
app.directive('permission', permissionDirective)
// Register Persian text directive
app.directive('persian', persianDirective)

// Initialize auth store after pinia is set up
import { useAuthStore } from '@/store/auth'
import { useTtacDrugsStore } from '@/store/ttacDrugs'

// Set up axios interceptors for token handling
axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshed = await authStore.refreshAccessToken()
      if (refreshed) {
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
        return axios(originalRequest)
      } else {
        authStore.logout()
        router.push({ name: 'Auth' })
      }
    }
    
    return Promise.reject(error)
  }
)

// Initialize auth state
const authStore = useAuthStore()
authStore.initializeAuth()

// Initialize TTAC drugs store globally in background
const ttacDrugsStore = useTtacDrugsStore()
// Load drugs data in background after a short delay to not block app startup
setTimeout(async () => {
  try {
    await ttacDrugsStore.fetchDrugs()
    // Optional: Show a subtle notification that data is ready
    console.log(`🚀 TTAC Drugs ready: ${ttacDrugsStore.drugsCount} drugs loaded for instant GTIN search`)
  } catch (error) {
    console.warn('Failed to load TTAC drugs in background:', error)
    // Data will be loaded on-demand when needed
  }
}, 1000) // 1 second delay to let the app load first

app.mount('#app')
