import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    currentUser: (state) => state.user
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_BASE_URL}/login/`, {
          email: credentials.email,
          password: credentials.password
        })
        
        const { access, refresh, user } = response.data
        
        this.accessToken = access
        this.refreshToken = refresh
        this.user = user
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', refresh)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
        
        return { success: true, user }
      } catch (error) {
        this.error = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Login failed'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_BASE_URL}/register/`, {
          email: userData.email,
          pharmacy: userData.pharmacy,
          password: userData.password,
          password_confirm: userData.passwordConfirm
        })
        
        const { access, refresh, user } = response.data
        
        this.accessToken = access
        this.refreshToken = refresh
        this.user = user
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', refresh)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
        
        return { success: true, user }
      } catch (error) {
        const errorData = error.response?.data
        if (errorData) {
          // Handle field-specific errors
          if (errorData.email) {
            this.error = `Email: ${errorData.email[0]}`
          } else if (errorData.username) {
            this.error = `Username: ${errorData.username[0]}`
          } else if (errorData.password) {
            this.error = `Password: ${errorData.password[0]}`
          } else if (errorData.non_field_errors) {
            this.error = errorData.non_field_errors[0]
          } else {
            this.error = 'Registration failed'
          }
        } else {
          this.error = 'Registration failed'
        }
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async refreshAccessToken() {
      if (!this.refreshToken) {
        this.logout()
        return false
      }
      
      try {
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: this.refreshToken
        })
        
        this.accessToken = response.data.access
        localStorage.setItem('accessToken', response.data.access)
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`
        
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    async verifyToken() {
      if (!this.accessToken) return false
      
      try {
        await axios.post(`${API_BASE_URL}/token/verify/`, {
          token: this.accessToken
        })
        return true
      } catch (error) {
        return await this.refreshAccessToken()
      }
    },

    logout() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.error = null
      
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      delete axios.defaults.headers.common['Authorization']
    },

    async initializeAuth() {
      const token = localStorage.getItem('accessToken')
      const user = localStorage.getItem('user')
      
      if (token && user) {
        this.accessToken = token
        this.user = JSON.parse(user)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // Verify token is still valid
        const isValid = await this.verifyToken()
        if (!isValid) {
          this.logout()
        }
      }
    },

    clearError() {
      this.error = null
    }
  }
}) 