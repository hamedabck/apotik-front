<template>
  <div class="invoices-tabs-view">
    <div class="tabs-container">
      <el-tabs 
        v-model="activeTab" 
        type="card" 
        closable
        @tab-remove="removeTab"
        @tab-click="handleTabClick"
        class="invoice-tabs"
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
                <i-ep-document />
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
          
          <!-- Each tab contains an InvoicesView component -->
          <InvoicesView 
            :key="`${tab.id}-${tab.invoiceNumber}`"
            :tab-id="tab.id"
            :initial-invoice-number="tab.invoiceNumber"
            @title-change="updateTabTitle"
            @unsaved-changes="updateUnsavedStatus"
            @navigation-attempt="handleNavigationAttempt"
            @invoice-deleted="handleInvoiceDeleted"
          />
        </el-tab-pane>
        
        <!-- Add button tab -->
        <el-tab-pane name="add-button" disabled>
          <template #label>
            <el-button 
              type="primary" 
              size="small"
              @click="addNewTab"
              class="add-tab-button"
            >
              <el-icon><i-ep-plus /></el-icon>
              New Invoice
            </el-button>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import InvoicesView from './InvoicesView.vue'
import { invoicesAPI } from '@/api/invoices'

// Tab management
const activeTab = ref('')
const tabs = ref([])
let tabCounter = 0

// Generate unique tab ID
const generateTabId = () => {
  tabCounter++
  return `invoice-tab-${tabCounter}`
}

// Add new tab with new invoice creation
const addNewTab = async () => {
  try {
    // Get all existing invoices to find the first available number
    const allInvoices = []
    const statuses = ['draft', 'finalized', 'cancelled']
    
    for (const status of statuses) {
      try {
        const response = await invoicesAPI.getInvoicesByStatus(status)
        const invoices = response.data.results || []
        allInvoices.push(...invoices)
      } catch (error) {
        console.warn(`Failed to fetch ${status} invoices:`, error)
      }
    }
    
    // Extract all existing invoice numbers
    const existingNumbers = new Set(allInvoices.map(inv => inv.invoice_number))
    
    // Find the first available number starting from 1
    let nextInvoiceNumber = 1
    while (existingNumbers.has(nextInvoiceNumber)) {
      nextInvoiceNumber++
      // Safety check to prevent infinite loop
      if (nextInvoiceNumber > 999999) {
        throw new Error('No available invoice numbers (reached maximum 999999)')
      }
    }
    
    // Create new invoice in backend
    const newInvoiceData = {
      invoice_number: nextInvoiceNumber,
      status: 'draft'
    }
    
    const response = await invoicesAPI.createInvoice(newInvoiceData)
    const newInvoice = response.data
    
    // Create new tab with the invoice number
    const tabId = generateTabId()
    const newTab = {
      id: tabId,
      title: `Invoice #${nextInvoiceNumber}`,
      invoiceNumber: nextInvoiceNumber,
      hasUnsavedChanges: false
    }
    
    tabs.value.push(newTab)
    activeTab.value = tabId
    
    // Auto-focus on the new tab
    await nextTick()
    ElMessage.success(`New invoice #${nextInvoiceNumber} created successfully!`)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error creating new invoice:', error)
      ElMessage.error('Failed to create new invoice: ' + (error.response?.data?.error || error.message))
    }
  }
}

// Remove tab
const removeTab = async (targetName) => {
  const tabIndex = tabs.value.findIndex(tab => tab.id === targetName)
  if (tabIndex === -1) return
  
  const tab = tabs.value[tabIndex]
  
  // Check if tab has unsaved changes
  if (tab.hasUnsavedChanges) {
    try {
      await ElMessageBox.confirm(
        `Invoice "${tab.title}" has unsaved changes. Are you sure you want to close this tab?`,
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
  
  // Remove the tab
  tabs.value.splice(tabIndex, 1)
  
  // Switch to another tab if the closed tab was active
  if (activeTab.value === targetName) {
    if (tabs.value.length > 0) {
      // Switch to the previous tab, or first tab if we closed the first one
      const newActiveIndex = Math.max(0, tabIndex - 1)
      activeTab.value = tabs.value[newActiveIndex].id
    } else {
      // No tabs left, create a new one
      await addNewTab()
    }
  }
}

// Handle tab click
const handleTabClick = (tab) => {
  if (tab.name === 'add-button') {
    addNewTab()
    return
  }
  activeTab.value = tab.name
}

// Update tab title when invoice number changes
const updateTabTitle = ({ tabId, title }) => {
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    tab.title = title
    
    // Extract invoice number from title for tracking
    const match = title.match(/Invoice #(\d+)/)
    if (match) {
      tab.invoiceNumber = parseInt(match[1])
    }
  }
}

// Update unsaved changes status
const updateUnsavedStatus = ({ tabId, hasUnsavedChanges }) => {
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    tab.hasUnsavedChanges = hasUnsavedChanges
  }
}

// Handle navigation attempt (prevent duplicate tabs)
const handleNavigationAttempt = ({ tabId, targetInvoiceNumber, currentInvoiceNumber, callback }) => {
  // Check if target invoice is already open in another tab
  const existingTab = tabs.value.find(tab => 
    tab.id !== tabId && tab.invoiceNumber === targetInvoiceNumber
  )
  
  if (existingTab) {
    // Switch to existing tab instead of allowing navigation
    activeTab.value = existingTab.id
    ElMessage.success(`Switched to Invoice #${targetInvoiceNumber} (already open in another tab)`)
    callback(false) // Deny navigation
    return
  }
  
  // Allow navigation
  callback(true)
}

// Handle invoice deletion
const handleInvoiceDeleted = ({ tabId, invoiceNumber }) => {
  // Close the tab since the invoice was deleted
  removeTab(tabId)
  
  // Also close any other tabs that might have the same invoice number
  const tabsToClose = tabs.value.filter(tab => tab.invoiceNumber === invoiceNumber)
  tabsToClose.forEach(tab => {
    if (tab.id !== tabId) {
      removeTab(tab.id)
    }
  })
}

// Add initial tab with last available invoice
const addInitialTab = async () => {
  try {
    // Get all existing invoices to find the highest number
    const allInvoices = []
    const statuses = ['draft', 'finalized', 'cancelled']
    
    for (const status of statuses) {
      try {
        const response = await invoicesAPI.getInvoicesByStatus(status)
        const invoices = response.data.results || []
        allInvoices.push(...invoices)
      } catch (error) {
        console.warn(`Failed to fetch ${status} invoices:`, error)
      }
    }
    
    let initialInvoiceNumber = 1
    let tabTitle = 'Invoice #1'
    
    if (allInvoices.length > 0) {
      // Find the highest invoice number
      const highestInvoice = allInvoices.reduce((max, current) => {
        return current.invoice_number > max.invoice_number ? current : max
      })
      initialInvoiceNumber = highestInvoice.invoice_number
      tabTitle = `Invoice #${initialInvoiceNumber}`
    }
    
    // Create initial tab
    const tabId = generateTabId()
    const newTab = {
      id: tabId,
      title: tabTitle,
      invoiceNumber: initialInvoiceNumber,
      hasUnsavedChanges: false
    }
    
    tabs.value.push(newTab)
    activeTab.value = tabId
    
    await nextTick()
    console.log(`Initial tab loaded with invoice #${initialInvoiceNumber}`)
    
  } catch (error) {
    console.error('Error loading initial invoice:', error)
    // Fallback: create a tab with invoice #1
    const tabId = generateTabId()
    const newTab = {
      id: tabId,
      title: 'Invoice #1',
      invoiceNumber: 1,
      hasUnsavedChanges: false
    }
    
    tabs.value.push(newTab)
    activeTab.value = tabId
  }
}

// Initialize with one tab
onMounted(async () => {
  await addInitialTab()
})
</script>

<style scoped>
.invoices-tabs-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.invoice-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.invoice-tabs :deep(.el-tabs__header) {
  margin: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 10px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.invoice-tabs :deep(.el-tabs__nav-wrap) {
  padding: 5px 0;
}

.invoice-tabs :deep(.el-tabs__content) {
  flex: 1;
  padding: 0;
}

.invoice-tabs :deep(.el-tab-pane) {
  box-sizing: border-box;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  padding: 0 8px;
}

.tab-icon {
  font-size: 14px;
  color: #606266;
}

.tab-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.unsaved-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
}

.unsaved-indicator :deep(.el-badge__content) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.add-tab-button {
  font-size: 12px;
  padding: 4px 8px;
  height: 24px;
  border-radius: 4px;
  background-color: #409eff;
  border-color: #409eff;
  color: #ffffff;
}

.add-tab-button:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.add-tab-button:focus {
  background-color: #409eff;
  border-color: #409eff;
}

.add-tab-button .el-icon {
  font-size: 12px;
  margin-right: 4px;
}

/* Active tab styling */
.invoice-tabs :deep(.el-tabs__item.is-active) {
  background-color: #ffffff;
  border-bottom-color: #ffffff;
}

.invoice-tabs :deep(.el-tabs__item.is-active .tab-icon) {
  color: #409eff;
}

.invoice-tabs :deep(.el-tabs__item.is-active .tab-title) {
  color: #409eff;
  font-weight: 600;
}

/* Tab hover effects */
.invoice-tabs :deep(.el-tabs__item:hover) {
  background-color: #f0f9ff;
}

.invoice-tabs :deep(.el-tabs__item:hover .tab-icon) {
  color: #409eff;
}

.invoice-tabs :deep(.el-tabs__item:hover .tab-title) {
  color: #409eff;
}

/* Close button styling */
.invoice-tabs :deep(.el-tabs__item .el-icon-close) {
  color: #909399;
  font-size: 12px;
  margin-left: 6px;
}

.invoice-tabs :deep(.el-tabs__item .el-icon-close:hover) {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
  border-radius: 50%;
}

/* Responsive design */
@media (max-width: 768px) {
  .tab-title {
    max-width: 100px;
  }
  
  .add-tab-button {
    font-size: 11px;
    padding: 3px 6px;
    height: 22px;
  }
}
</style> 