<template>
  <div class="factors-tabs-view">
    <div class="tabs-container">
      <el-tabs 
        v-model="activeTab" 
        type="card" 
        closable
        @tab-remove="removeTab"
        @tab-click="handleTabClick"
        class="factor-tabs"
      >
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.id"
          :label="tab.title"
          :name="tab.id"
        >
          <template #label>
            <div class="tab-label">
              <el-icon class="tab-icon">
                <i-ep-edit />
              </el-icon>
              <span class="tab-title">{{ tab.title }}</span>
              <el-badge 
                v-if="tab.hasUnsavedChanges" 
                is-dot 
                class="unsaved-indicator"
                :title="'Unsaved changes in this session'"
              />
            </div>
          </template>
          
          <!-- Each tab contains a FactorsView component -->
          <FactorsView 
            :key="`${tab.id}-${tab.factorNumber}`"
            :tab-id="tab.id"
            :initial-factor-number="tab.factorNumber"
            @title-change="updateTabTitle"
            @unsaved-changes="updateUnsavedStatus"
            @navigation-attempt="handleNavigationAttempt"
            @factor-deleted="handleFactorDeleted"
          />
        </el-tab-pane>
        
        <!-- Add button tab -->
        <el-tab-pane name="add-button" disabled>
          <template #label>
            <el-button 
              type="primary" 
              size="small"
              @click="addNewTab"
              :disabled="tabs.length >= maxTabs"
              class="add-tab-button"
              :title="tabs.length >= maxTabs ? `Maximum ${maxTabs} sessions allowed` : 'Add new factor session'"
            >
              <el-icon v-if="true"><Plus /></el-icon>
            </el-button>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Warning when approaching max tabs -->
    <el-alert
      v-if="tabs.length >= maxTabs - 1"
      type="warning"
      :description="`You can have up to ${maxTabs} factor sessions open simultaneously. Close some tabs to open new ones.`"
      show-icon
      :closable="true"
      class="max-tabs-warning"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import FactorsView from './FactorsView.vue'

// Configuration
const maxTabs = 10

// Reactive state
const activeTab = ref('')
const tabs = ref([])
let tabCounter = 0

// Track factor numbers to prevent duplicates
const usedFactorNumbers = ref(new Set())

// Tab management functions
const generateTabId = () => {
  tabCounter++
  return `factor-${tabCounter}`
}

const addNewTab = async () => {
  if (tabs.value.length >= maxTabs) {
    ElMessage.warning(`Maximum ${maxTabs} sessions allowed`)
    return
  }

  try {
    const newFactorNumber = await createNewFactorSession()
    
    const newTab = {
      id: generateTabId(),
      title: `Factor #${newFactorNumber}`,
      factorNumber: newFactorNumber,
      hasUnsavedChanges: false,
      createdAt: new Date()
    }

    tabs.value.push(newTab)
    activeTab.value = newTab.id
    usedFactorNumbers.value.add(newFactorNumber)
    
    await nextTick()
    ElMessage.success(`New factor session created: ${newTab.title}`)
  } catch (error) {
    console.error('Failed to create new factor session:', error)
    ElMessage.error('Failed to create new factor session. Please try again.')
  }
}

const removeTab = async (tabId) => {
  const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return

  const tab = tabs.value[tabIndex]
  
  if (tab.hasUnsavedChanges) {
    try {
      await ElMessageBox.confirm(
        `${tab.title} has unsaved changes. Are you sure you want to close it?`,
        'Unsaved Changes',
        {
          confirmButtonText: 'Close Tab',
          cancelButtonText: 'Cancel',
          type: 'warning',
        }
      )
    } catch {
      return
    }
  }

  tabs.value.splice(tabIndex, 1)
  if (tab.factorNumber) {
    usedFactorNumbers.value.delete(tab.factorNumber)
  }

  if (activeTab.value === tabId) {
    if (tabs.value.length > 0) {
      const newActiveIndex = Math.min(tabIndex, tabs.value.length - 1)
      activeTab.value = tabs.value[newActiveIndex].id
    } else {
      await createInitialTab()
    }
  }

  ElMessage.success(`${tab.title} closed`)
}

const handleTabClick = (tab) => {
  activeTab.value = tab.paneName
}

const createNewFactorSession = async () => {
  const { factorsAPI } = await import('@/api/factors')
  
  try {
    const allFactors = []
    const statuses = ['draft', 'finalized', 'cancelled']
    
    for (const status of statuses) {
      try {
        const response = await factorsAPI.getFactorsByStatus(status)
        const factors = response.data.results || []
        allFactors.push(...factors)
      } catch (error) {
        console.warn(`Failed to fetch ${status} factors:`, error)
      }
    }
    
    const existingNumbers = new Set(allFactors.map(factor => factor.factor_number))
    usedFactorNumbers.value.forEach(num => existingNumbers.add(num))
    
    let nextFactorNumber = 1
    while (existingNumbers.has(nextFactorNumber)) {
      nextFactorNumber++
      if (nextFactorNumber > 999999) {
        throw new Error('No available factor numbers (reached maximum 999999)')
      }
    }
    
    const newFactorData = {
      factor_number: nextFactorNumber.toString(),
      status: 'draft'
    }
    
    await factorsAPI.createFactor(newFactorData)
    return nextFactorNumber
  } catch (error) {
    console.error('Error creating new factor session:', error)
    throw error
  }
}

// Event handlers
const updateTabTitle = (data) => {
  const { tabId, title } = data
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    tab.title = title
    
    const match = title.match(/Factor #(\d+)/)
    if (match) {
      const factorNumber = parseInt(match[1])
      if (tab.factorNumber && tab.factorNumber !== factorNumber) {
        usedFactorNumbers.value.delete(tab.factorNumber)
      }
      tab.factorNumber = factorNumber
      usedFactorNumbers.value.add(factorNumber)
    }
  }
}

const updateUnsavedStatus = (data) => {
  const { tabId, hasUnsavedChanges } = data
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    tab.hasUnsavedChanges = hasUnsavedChanges
  }
}

const handleNavigationAttempt = (data) => {
  const { tabId, targetFactorNumber, callback } = data
  
  const existingTab = tabs.value.find(tab => 
    tab.factorNumber === targetFactorNumber && tab.id !== tabId
  )
  
  if (existingTab) {
    ElMessage.warning(`Factor #${targetFactorNumber} is already open in tab: ${existingTab.title}`)
    callback(false)
  } else {
    const currentTab = tabs.value.find(tab => tab.id === tabId)
    if (currentTab) {
      if (currentTab.factorNumber) {
        usedFactorNumbers.value.delete(currentTab.factorNumber)
      }
      currentTab.factorNumber = targetFactorNumber
      usedFactorNumbers.value.add(targetFactorNumber)
    }
    callback(true)
  }
}

const handleFactorDeleted = async (data) => {
  const { tabId, factorNumber } = data
  
  const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return

  const tab = tabs.value[tabIndex]
  
  if (tab.factorNumber) {
    usedFactorNumbers.value.delete(tab.factorNumber)
  }

  tabs.value.splice(tabIndex, 1)

  if (activeTab.value === tabId) {
    if (tabs.value.length > 0) {
      const newActiveIndex = Math.min(tabIndex, tabs.value.length - 1)
      activeTab.value = tabs.value[newActiveIndex].id
    } else {
      await createInitialTab()
    }
  }

  ElMessage.success(`Tab closed: Factor #${factorNumber} was deleted from database`)
}

const loadLastExistingFactor = async () => {
  try {
    const { factorsAPI } = await import('@/api/factors')
    
    const allFactors = []
    const statuses = ['draft', 'finalized', 'cancelled']
    
    for (const status of statuses) {
      try {
        const response = await factorsAPI.getFactorsByStatus(status)
        const factors = response.data.results || []
        allFactors.push(...factors)
      } catch (error) {
        console.warn(`Failed to fetch ${status} factors:`, error)
      }
    }
    
    if (allFactors.length > 0) {
      const highestFactor = allFactors.reduce((max, current) => {
        return current.factor_number > max.factor_number ? current : max
      })
      return highestFactor.factor_number
    } else {
      return 1
    }
  } catch (error) {
    console.error('Error loading last factor number:', error)
    return 1
  }
}

const createInitialTab = async () => {
  try {
    const lastFactorNumber = await loadLastExistingFactor()
    
    const initialTab = {
      id: generateTabId(),
      title: `Factor #${lastFactorNumber}`,
      factorNumber: lastFactorNumber,
      hasUnsavedChanges: false,
      createdAt: new Date()
    }

    tabs.value.push(initialTab)
    activeTab.value = initialTab.id
    usedFactorNumbers.value.add(lastFactorNumber)
    
    if (lastFactorNumber > 1) {
      ElMessage({
        message: `Loaded existing factor #${lastFactorNumber}`,
        type: 'info',
        duration: 1000,
        showClose: false
      })
    }
  } catch (error) {
    console.error('Failed to create initial tab:', error)
    ElMessage.error('Failed to load factor. Please try again.')
  }
}

// Keyboard shortcuts
const handleKeyboardShortcuts = async (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 't') {
    event.preventDefault()
    await addNewTab()
  }
  
  if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
    event.preventDefault()
    if (tabs.value.length > 1) {
      await removeTab(activeTab.value)
    }
  }
}

// Lifecycle
onMounted(async () => {
  if (tabs.value.length === 0) {
    await createInitialTab()
  }
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})
</script>

<style scoped>
.factors-tabs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.factor-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.factor-tabs .el-tabs__content) {
  flex: 1;
  padding: 0;
}

:deep(.factor-tabs .el-tab-pane) {
  height: 100%;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 1px;
  position: relative;
  max-width: 150px;
}

.tab-icon {
  font-size: 12px;
}

.tab-title {
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.unsaved-indicator {
  position: absolute;
  top: -2px;
  right: -8px;
}

:deep(.unsaved-indicator .el-badge__content) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.max-tabs-warning {
  margin-top: 16px;
}

:deep(.el-tabs--card > .el-tabs__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__nav) {
  border: none;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__item) {
  border: 2px solid #e4e7ed;
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  margin-right: 2px;
  padding: 1px 3px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
  min-width: auto;
  max-width: 170px;
  font-size: 12px;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__item.is-active) {
  background-color: #ffffff;
  border-bottom-color: #ffffff;
  position: relative;
  z-index: 1;
}

.add-tab-button {
  min-width: 20px !important;
  height: 20px !important;
  padding: 0 !important;
  border-radius: 5px !important;
  font-size: 12px;
  border: 1px solid #409eff !important;
  background-color: #409eff !important;
  transition: all 0.3s ease;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.add-tab-button .el-icon {
  font-size: 18px !important;
  color: white !important;
  line-height: 1;
}

.add-tab-button:hover:not(.is-disabled) {
  background-color: #337ecc !important;
  border-color: #337ecc !important;
}

.add-tab-button.is-disabled {
  background-color: #c0c4cc !important;
  border-color: #c0c4cc !important;
  color: #ffffff !important;
  cursor: not-allowed;
}

:deep(.el-tabs__item[id*="add-button"]) {
  background-color: transparent !important;
  border: none !important;
  padding: 4px !important;
  margin-left: 4px !important;
  cursor: default;
}

:deep(.el-tabs__item[id*="add-button"]:hover) {
  background-color: transparent !important;
}
</style> 