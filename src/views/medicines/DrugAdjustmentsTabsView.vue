<template>
  <div class="drug-adjustments-tabs-view">
    <div class="tabs-container">
      <el-tabs 
        v-model="activeTab" 
        type="card" 
        closable
        @tab-remove="removeTab"
        @tab-click="handleTabClick"
        class="adjustment-tabs"
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
          
          <!-- Each tab contains a DrugAdjustmentsView component -->
          <DrugAdjustmentsView 
            :key="`${tab.id}-${tab.adjustmentNumber}`"
            :tab-id="tab.id"
            :initial-adjustment-number="tab.adjustmentNumber"
            @title-change="updateTabTitle"
            @unsaved-changes="updateUnsavedStatus"
            @navigation-attempt="handleNavigationAttempt"
            @adjustment-deleted="handleAdjustmentDeleted"
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
              :title="tabs.length >= maxTabs ? `Maximum ${maxTabs} sessions allowed` : 'Add new adjustment session'"
            >
              <el-icon v-if="true"><Plus /></el-icon>
              <span v-else class="plus-text">+</span>
            </el-button>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Warning when approaching max tabs -->
    <el-alert
      v-if="tabs.length >= maxTabs - 1"
      type="warning"
      :description="`You can have up to ${maxTabs} drug adjustment sessions open simultaneously. Close some tabs to open new ones.`"
      show-icon
      :closable="true"
      class="max-tabs-warning"
    />
    
    <!-- Debug info (uncomment for debugging) -->
    <!-- 
    <el-alert
      v-if="openAdjustmentNumbers.length > 0"
      type="info"
      :title="`Open Adjustment Numbers: ${openAdjustmentNumbers.join(', ')}`"
      :closable="true"
      class="debug-info"
    />
    -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import DrugAdjustmentsView from './DrugAdjustmentsView.vue'

// Configuration
const maxTabs = 10 // Maximum number of tabs allowed

// Reactive state
const activeTab = ref('')
const tabs = ref([])
let tabCounter = 0

// Track adjustment numbers to prevent duplicates
const usedAdjustmentNumbers = ref(new Set())

// Tab management functions
const generateTabId = () => {
  tabCounter++
  return `adjustment-${tabCounter}`
}

const generateTabTitle = (index) => {
  return `Adjustment ${index + 1}`
}

const addNewTab = async () => {
  if (tabs.value.length >= maxTabs) {
    ElMessage.warning(`Maximum ${maxTabs} sessions allowed`)
    return
  }

  try {
    // Create a new adjustment session with a unique adjustment number
    const newAdjustmentNumber = await createNewAdjustmentSession()
    
    const newTab = {
      id: generateTabId(),
      title: `Adjustment #${newAdjustmentNumber}`,
      adjustmentNumber: newAdjustmentNumber,
      hasUnsavedChanges: false,
      createdAt: new Date()
    }

    tabs.value.push(newTab)
    activeTab.value = newTab.id
    
    // Track this adjustment number as used
    usedAdjustmentNumbers.value.add(newAdjustmentNumber)
    
    // Force a re-render by updating the key
    await nextTick()
    
    ElMessage.success(`New adjustment session created: ${newTab.title}`)
  } catch (error) {
    console.error('Failed to create new adjustment session:', error)
    if (error.message.includes('already open')) {
      ElMessage.error('This adjustment number is already open in another tab.')
    } else {
      ElMessage.error('Failed to create new adjustment session. Please try again.')
    }
  }
}

const removeTab = async (tabId) => {
  const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return

  const tab = tabs.value[tabIndex]
  
  // Check for unsaved changes
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
      return // User cancelled
    }
  }

  // Remove the tab and its adjustment number from tracking
  tabs.value.splice(tabIndex, 1)
  if (tab.adjustmentNumber) {
    usedAdjustmentNumbers.value.delete(tab.adjustmentNumber)
  }

  // Update active tab if necessary
  if (activeTab.value === tabId) {
    if (tabs.value.length > 0) {
      const newActiveIndex = Math.min(tabIndex, tabs.value.length - 1)
      activeTab.value = tabs.value[newActiveIndex].id
    } else {
      // If no tabs left, load the last existing adjustment (don't create new)
      await createInitialTab()
    }
  }

  ElMessage.success(`${tab.title} closed`)
}

const closeCurrentTab = async () => {
  if (activeTab.value) {
    await removeTab(activeTab.value)
  }
}

const handleTabClick = (tab) => {
  activeTab.value = tab.paneName
}

// Function to create a new adjustment session
const createNewAdjustmentSession = async () => {
  // Import the drugAdjustmentsAPI from the child component's API
  const { drugAdjustmentsAPI } = await import('@/api/drugAdjustments')
  
  try {
    // Get all existing adjustments to find the first available number
    const allAdjustments = []
    const statuses = ['draft', 'finalized', 'cancelled']
    
    for (const status of statuses) {
      try {
        const response = await drugAdjustmentsAPI.getAdjustmentsByStatus(status)
        const adjustments = response.data.results || []
        allAdjustments.push(...adjustments)
      } catch (error) {
        console.warn(`Failed to fetch ${status} adjustments:`, error)
      }
    }
    
    // Extract all existing adjustment numbers
    const existingNumbers = new Set(allAdjustments.map(adj => adj.adjustment_number))
    
    // Also include numbers from currently open tabs
    usedAdjustmentNumbers.value.forEach(num => existingNumbers.add(num))
    
    // Find the first available number starting from 1
    let nextAdjustmentNumber = 1
    while (existingNumbers.has(nextAdjustmentNumber)) {
      nextAdjustmentNumber++
      // Safety check to prevent infinite loop (reasonable limit)
      if (nextAdjustmentNumber > 999999) {
        throw new Error('No available adjustment numbers (reached maximum 999999)')
      }
    }
    
    // Validate that this number is not already in use in current tabs
    if (usedAdjustmentNumbers.value.has(nextAdjustmentNumber)) {
      throw new Error(`Adjustment #${nextAdjustmentNumber} is already open in another tab`)
    }
    
    // Double-check by looking at existing tabs
    const existingTab = tabs.value.find(tab => tab.adjustmentNumber === nextAdjustmentNumber)
    if (existingTab) {
      ElMessage.warning(`Adjustment #${nextAdjustmentNumber} is already open in tab: ${existingTab.title}`)
      throw new Error(`Adjustment #${nextAdjustmentNumber} is already open`)
    }
    
    // Create the new adjustment in the database
    const newAdjustmentData = {
      adjustment_number: nextAdjustmentNumber,
      status: 'draft',
      user: null, // Will be set by backend
      pharmacy: null, // Will be set by backend
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const response = await drugAdjustmentsAPI.createAdjustment(newAdjustmentData)
    
    return nextAdjustmentNumber
  } catch (error) {
    console.error('Error creating new adjustment session:', error)
    throw error
  }
}

// Event handlers from child components
const updateTabTitle = (data) => {
  const { tabId, title } = data
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    tab.title = title
    
    // Extract adjustment number from title to track it
    const match = title.match(/Adjustment #(\d+)/)
    if (match) {
      const adjustmentNumber = parseInt(match[1])
      // Remove old number if it exists
      if (tab.adjustmentNumber && tab.adjustmentNumber !== adjustmentNumber) {
        usedAdjustmentNumbers.value.delete(tab.adjustmentNumber)
      }
      // Add new number
      tab.adjustmentNumber = adjustmentNumber
      usedAdjustmentNumbers.value.add(adjustmentNumber)
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
  const { tabId, targetAdjustmentNumber, currentAdjustmentNumber, callback } = data
  
  // Check if the target adjustment number is already open in another tab
  const existingTab = tabs.value.find(tab => 
    tab.adjustmentNumber === targetAdjustmentNumber && tab.id !== tabId
  )
  
  if (existingTab) {
    // Block navigation and show message
    ElMessage.warning(`Adjustment #${targetAdjustmentNumber} is already open in tab: ${existingTab.title}`)
    callback(false) // Navigation not allowed
  } else {
    // Allow navigation and update the tab's adjustment number
    const currentTab = tabs.value.find(tab => tab.id === tabId)
    if (currentTab) {
      // Remove old adjustment number from tracking
      if (currentTab.adjustmentNumber) {
        usedAdjustmentNumbers.value.delete(currentTab.adjustmentNumber)
      }
      // Add new adjustment number to tracking
      currentTab.adjustmentNumber = targetAdjustmentNumber
      usedAdjustmentNumbers.value.add(targetAdjustmentNumber)
    }
    callback(true) // Navigation allowed
  }
}

const handleAdjustmentDeleted = async (data) => {
  const { tabId, adjustmentNumber } = data
  
  // Find the tab that had the deleted adjustment
  const tabIndex = tabs.value.findIndex(tab => tab.id === tabId)
  if (tabIndex === -1) return

  const tab = tabs.value[tabIndex]
  
  // Remove the adjustment number from tracking
  if (tab.adjustmentNumber) {
    usedAdjustmentNumbers.value.delete(tab.adjustmentNumber)
  }

  // Close the tab since the adjustment has been deleted
  tabs.value.splice(tabIndex, 1)

  // Update active tab if necessary
  if (activeTab.value === tabId) {
    if (tabs.value.length > 0) {
      const newActiveIndex = Math.min(tabIndex, tabs.value.length - 1)
      activeTab.value = tabs.value[newActiveIndex].id
    } else {
      // If no tabs left, create a new initial tab
      await createInitialTab()
    }
  }

  ElMessage.success(`Tab closed: Adjustment #${adjustmentNumber} was deleted from database`)
}

// Keyboard shortcuts
const handleKeyboardShortcuts = async (event) => {
  // Ctrl+T or Cmd+T to add new tab
  if ((event.ctrlKey || event.metaKey) && event.key === 't') {
    event.preventDefault()
    await addNewTab()
  }
  
  // Ctrl+W or Cmd+W to close current tab
  if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
    event.preventDefault()
    if (tabs.value.length > 1) {
      await closeCurrentTab()
    }
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Create initial tab if none exist (load last existing adjustment, don't create new)
  if (tabs.value.length === 0) {
    await createInitialTab()
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

// Function to load the last existing adjustment without creating a new one
const loadLastExistingAdjustment = async () => {
  try {
    // Import the drugAdjustmentsAPI
    const { drugAdjustmentsAPI } = await import('@/api/drugAdjustments')
    
    // Get all existing adjustments to find the highest number
    const allAdjustments = []
    const statuses = ['draft', 'finalized', 'cancelled']
    
    for (const status of statuses) {
      try {
        const response = await drugAdjustmentsAPI.getAdjustmentsByStatus(status)
        const adjustments = response.data.results || []
        allAdjustments.push(...adjustments)
      } catch (error) {
        console.warn(`Failed to fetch ${status} adjustments:`, error)
      }
    }
    
    if (allAdjustments.length > 0) {
      // Find the highest adjustment number
      const highestAdjustment = allAdjustments.reduce((max, current) => {
        return current.adjustment_number > max.adjustment_number ? current : max
      })
      
      return highestAdjustment.adjustment_number
    } else {
      // No adjustments found, return 1 for the first adjustment
      return 1
    }
  } catch (error) {
    console.error('Error loading last adjustment number:', error)
    return 1 // Fallback to 1
  }
}

// Function to create initial tab with last existing adjustment
const createInitialTab = async () => {
  try {
    // Load the last existing adjustment number (don't create new one)
    const lastAdjustmentNumber = await loadLastExistingAdjustment()
    
    const initialTab = {
      id: generateTabId(),
      title: `Adjustment #${lastAdjustmentNumber}`,
      adjustmentNumber: lastAdjustmentNumber,
      hasUnsavedChanges: false,
      createdAt: new Date()
    }

    tabs.value.push(initialTab)
    activeTab.value = initialTab.id
    
    // Track this adjustment number as used
    usedAdjustmentNumbers.value.add(lastAdjustmentNumber)
    
    console.log(`Loaded existing adjustment #${lastAdjustmentNumber}`)
    
    // Show a subtle message that we loaded an existing adjustment
    if (lastAdjustmentNumber > 1) {
      ElMessage({
        message: `Loaded existing adjustment #${lastAdjustmentNumber}`,
        type: 'info',
        duration: 1000,
        showClose: false
      })
    }
  } catch (error) {
    console.error('Failed to create initial tab:', error)
    ElMessage.error('Failed to load adjustment. Please try again.')
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
})

// Computed properties
const currentTab = computed(() => {
  return tabs.value.find(tab => tab.id === activeTab.value)
})

const openAdjustmentNumbers = computed(() => {
  return Array.from(usedAdjustmentNumbers.value).sort((a, b) => a - b)
})
</script>

<style scoped>
.drug-adjustments-tabs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}


.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.adjustment-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.adjustment-tabs .el-tabs__content) {
  flex: 1;
  padding: 0;
}

:deep(.adjustment-tabs .el-tab-pane) {
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

.debug-info {
  margin-top: 16px;
  font-size: 0.9rem;
}

/* Tab styling */
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

:deep(.el-tabs--card > .el-tabs__header .el-tabs__item:hover) {
  background-color: #f0f2f5;
}

:deep(.el-tabs--card > .el-tabs__header .el-tabs__item.is-active:hover) {
  background-color: #ffffff;
}

/* Close button styling */
:deep(.el-tabs__nav-close) {
  color: #909399;
  font-size: 14px;
  margin-left: 8px;
  transition: color 0.3s ease;
}

:deep(.el-tabs__nav-close:hover) {
  color: #f56c6c;
}

/* Add tab button styling */
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

.plus-text {
  font-size: 14px !important;
  color: white !important;
  font-weight: bold;
  line-height: 1;
}

.add-tab-button:hover:not(.is-disabled) {
  background-color: #337ecc !important;
  border-color: #337ecc !important;
  /* transform: scale(1.05); */
}

.add-tab-button.is-disabled {
  background-color: #c0c4cc !important;
  border-color: #c0c4cc !important;
  color: #ffffff !important;
  cursor: not-allowed;
}

/* Style the tab pane containing the add button */
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

/* Responsive design */
@media (max-width: 768px) {
  :deep(.el-tabs--card > .el-tabs__header .el-tabs__item) {
    padding: 6px 8px;
    font-size: 0.7rem;
    max-width: 100px;
  }
  
  .tab-title {
    font-size: 0.7rem;
    max-width: 60px;
  }
  
  .tab-icon {
    font-size: 10px;
  }
}
</style> 