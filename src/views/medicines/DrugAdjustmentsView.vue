<template>
  <div class="drug-adjustments-view">
    <div class="page-header">
      <h1 style="font-size: 24px; font-weight: 600;">Drug Adjustments</h1>
      <div class="header-info-row">
      <div class="adjustment-number-container">
          <label class="adjustment-number-label">Number:</label>
        <div class="adjustment-number-controls">
          <el-button 
            size="small" 
            @click="previousAdjustmentNumber"
            :disabled="adjustmentNumber <= 1 || isCheckingAdjustmentExists"
            class="nav-button"
          >
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-input
            v-model="adjustmentNumber"
            type="number"
            :min="1"
            :class="['adjustment-number-input', { 'invalid-adjustment': isAdjustmentNumberInvalid, 'checking-adjustment': isCheckingAdjustmentExists }]"
            @input="onAdjustmentNumberInput"
            @blur="validateAdjustmentNumber"
            @focus="isAdjustmentNumberInvalid = false"
            :disabled="isCheckingAdjustmentExists"
            placeholder="1"
            :validate-event="false"
          />
          <el-button 
            size="small" 
            @click="nextAdjustmentNumber"
            :disabled="isCheckingAdjustmentExists"
            class="nav-button"
          >
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button 
            size="small" 
            type="success"
            @click="createNewAdjustment"
            class="new-adjustment-button"
            :title="'Create a new adjustment session'"
          >
            <el-icon><Plus /></el-icon>
            New Adjustment
          </el-button>
          </div>
        </div>
        
        <div class="timestamp-info">
          <div class="timestamp-field">
            <label class="timestamp-label">{{ showCreated ? 'Created:' : 'Last Updated:' }}</label>
            <span class="timestamp-value">{{ formatTimestamp(showCreated ? createdAt : updatedAt) }}</span>
            <el-button 
              size="small" 
              @click="toggleTimestamp"
              class="timestamp-toggle-button"
              :title="showCreated ? 'Show Last Updated' : 'Show Created'"
            >
              <el-icon><Switch /></el-icon>
            </el-button>
            
            <el-button 
              size="small" 
              class="drug-edit-button"
              @click="handleDrugEdit"
            >
              <el-icon><Edit /></el-icon>
              Drug Edit
            </el-button>
            
            <!-- Status Display Button -->
            <el-button 
              size="small" 
              :type="getStatusButtonType(adjustmentStatus)"
              class="status-display-button"
              @click="showStatusInfo"
              :title="`Current adjustment status: ${drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus)}`"
            >
              <el-icon><InfoFilled /></el-icon>
              {{ drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus) }}
            </el-button>
            
            <el-dropdown @command="handlePrintCommand" class="print-dropdown">
              <el-button size="small" type="primary" class="print-button">
                <el-icon><Printer /></el-icon>
                Print
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="a4">
                    <el-icon><Document /></el-icon>
                    A4 Format
                  </el-dropdown-item>
                  <el-dropdown-item command="roll">
                    <el-icon><Tickets /></el-icon>
                    Roll Format
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <!-- Delete Adjustment Button -->
            <el-button 
              size="small" 
              type="danger"
              @click="deleteEntireAdjustment"
              :disabled="processing || !currentAdjustmentId"
              class="delete-adjustment-button"
              :title="`Delete entire adjustment #${adjustmentNumber} and all its items`"
            >
              <el-icon><Delete /></el-icon>
              Delete Adjustment
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Non-Editable Status Alert -->
    <el-alert
      v-if="!isAdjustmentEditable"
      :title="`This adjustment is ${drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus)} and cannot be modified`"
      type="warning"
      :description="`Adjustment #${adjustmentNumber} has been ${adjustmentStatus}. No further changes can be made to this adjustment.`"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <!-- Real-time Updates Info -->
    <!-- <el-alert
      v-if="isAdjustmentEditable"
      title="Immediate Database Updates"
      type="info"
      description="No need to wait for finalization! Stock quantities are updated in real-time. Finalization only locks the adjustment from further changes."
      show-icon
      :closable="true"
      class="realtime-info-alert"
    /> -->

    <!-- Adjustment Form -->
    <el-card class="adjustment-form-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ isEditing ? 'Edit Adjustment' : 'Add New Adjustment' }}</span>
          <div class="header-buttons">
            <el-button 
              v-if="isEditing"
              @click="cancelEdit"
              size="small"
              class="cancel-button"
            >
              <el-icon><Close /></el-icon> Cancel
            </el-button>
            <el-button 
              type="primary" 
              size="small"
              @click="addOrUpdateAdjustment"
              :disabled="!isFormValid || !isAdjustmentEditable"
              class="add-button"
            >
              <el-icon><Plus v-if="!isEditing" /><Check v-else /></el-icon> 
              {{ isEditing ? 'Update Adjustment' : 'Add to Table' }}
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="adjustmentForm" class="adjustment-form">
        <!-- First Row - 3 columns -->
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item required>
              <template #label>
                <div class="search-field-header">
                  <span>{{ getSearchFieldLabel() }}</span>
                  <!-- Language Toggle Button (visible only in step 1) -->
                  <el-button 
                    v-if="searchStep === 1"
                    size="small" 
                    type="primary" 
                    plain
                    @click="toggleSearchLanguage"
                    class="search-language-toggle"
                    :title="showPersianNamesInSearch ? 'Switch to English names' : 'Switch to Persian names'"
                    :disabled="isEditing"
                  >
                    {{ showPersianNamesInSearch ? 'EN' : 'فا' }}
                  </el-button>
                </div>
              </template>
              
              <!-- Barcode Input (visible when in step 1) -->
              <el-input
                v-if="searchStep === 1 && !currentSearchValue"
                ref="barcodeInputRef"
                v-model="barcodeInput"
                @paste="handleBarcodePaste"
                @input="handleBarcodeInput"
                @keyup.enter="handleBarcodeEnter"
                placeholder="Paste/scan barcode"
                class="barcode-input"
                clearable
                autofocus
                :disabled="!isAdjustmentEditable || isEditing"
                style="margin-bottom: 8px;"
              >
                <template #prefix>
                  <el-icon><Document /></el-icon>
                </template>
              </el-input>
              
              <el-select
                ref="selectRef"
                v-model="currentSearchValue"
                filterable
                remote
                reserve-keyword
                :placeholder="getSearchFieldPlaceholder()"
                :remote-method="handleSearch"
                :loading="searchLoading || batchesLoading"
                style="width: 100%"
                @change="onSearchSelect"
                @clear="handleSearchClear"
                @input="handleGtinInput"
                @blur="searchByGtin"
                @keyup.enter="handleSearchEnter"
                                  clearable
                :disabled="!isAdjustmentEditable || isEditing"
                  :popper-class="getDropdownClass()"
                >
                  <!-- Drug Options (Step 1) -->
                <el-option
                    v-if="searchStep === 1"
                  v-for="drug in searchResults"
                  :key="drug.id"
                    :label="`${showPersianNamesInSearch ? (drug.persian_name || drug.english_name) : (drug.english_name || drug.persian_name)} - ${drug.gtin_code}`"
                  :value="drug.id"
                  >
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <div style="font-weight: 500;">
                          {{ showPersianNamesInSearch 
                            ? (drug.persian_name || drug.english_name || 'N/A')
                            : (drug.english_name || drug.persian_name || 'N/A') 
                          }}
                        </div>
                        <div style="font-size: 12px; color: #999;">
                          GTIN: {{ drug.gtin_code }} | Stock: {{ drug.total_quantity || 0 }}
                        </div>
                      </div>
                    </div>
                  </el-option>
                  
                  <!-- Batch Options (Step 2) -->
                  <el-option
                    v-if="searchStep === 2"
                    v-for="batch in availableBatches"
                    :key="batch.id"
                    :label="`${batch.batch_number} (Exp: ${formatDate(batch.expiry_date)}) - Qty: ${batch.quantity} - Price: ${batch._formattedPrice || 'N/A'}`"
                    :value="batch.id"
                  >
                    <div class="dropdown-option-minimal">
                      <div class="option-content">
                        <div class="option-title">Batch: {{ batch.batch_number }}</div>
                        <div class="option-subtitle">
                          GTIN: {{ batch.gtin_code }} | Price: {{ batch._formattedPrice || 'N/A' }}
                        </div>
                      </div>
                      <div class="quantity-with-expiry">
                        <div class="expiry-date-minimal">{{ formatDate(batch.expiry_date) }} ({{ calculateDaysToExpire(batch.expiry_date) }} days)</div>
                        <div class="quantity-minimal"> <span style="color:black"> Stock: </span>{{ batch.quantity }}</div>
                      </div>
                      <div class="quantity-with-expiry">
                        <div class="expiry-date-minimal"><span style="color:black; font-size:13px; font-weight:bold"> Price: </span> {{ batch._formattedPrice || 'N/A' }}</div>
                      </div>
                    </div>
                  </el-option>
                  
                  <!-- Location Options (Step 3) -->
                  <el-option
                    v-if="searchStep === 3"
                    v-for="location in batchLocations"
                    :key="`${location.storage}-${location.id}`"
                    :label="`${location.storage_name} (Qty: ${getProjectedQuantityDisplay(location)})`"
                    :value="location.id"
                  >
                    <div class="dropdown-option-minimal">
                      <div class="option-content">
                        <div class="option-title">{{ location.storage_name }}</div>
                        <div class="option-subtitle">
                          Storage ID: {{ location.storage }}
                        </div>
                      </div>
                      <div class="quantity-minimal">
                        <span style="color:black"> Stock: </span>
                        <span :class="getProjectedQuantity(location) !== location.quantity ? 'projected-quantity' : ''">
                          {{ getProjectedQuantityDisplay(location) }}
                        </span>
                      </div>
                    </div>
                  </el-option>
              </el-select>
              
              <!-- Dynamic Info Display -->
              <div v-if="getStockInfo()" class="stock-info">
                {{ getStockInfo() }}
                <span v-if="isEditing" class="editing-mode-indicator">
                  (excluding current edit)
                </span>
              </div>
              
              <!-- Editing Mode Indicator for Drug Selection -->
              <div v-if="isEditing" class="field-frozen-indicator">
                <el-icon><Lock /></el-icon>
                Drug selection is locked during editing
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="5">
            <el-form-item :label="getActionFieldLabel()" required>
              <el-select
                ref="actionSelectRef"
                v-model="currentActionValue"
                :placeholder="getActionFieldPlaceholder()"
                style="width: 100%"
                @change="onActionSelect"
                @keyup.enter="handleActionEnter"
                clearable
                :disabled="!isAdjustmentEditable || isEditing"
              >
                <!-- Action Options (Step 1) -->
                <el-option 
                  v-if="actionStep === 1"
                  label="Add Stock" 
                  value="add_stock" 
                />
                <el-option 
                  v-if="actionStep === 1"
                  label="Change Location" 
                  value="change_location" 
                />
                <el-option 
                  v-if="actionStep === 1"
                  label="Delete (Expired)" 
                  value="delete_expired" 
                />
                <el-option 
                  v-if="actionStep === 1"
                  label="Delete (Damage/Loss)" 
                  value="delete_damage" 
                />
                
                <!-- Location Options (Step 2 - only for change_location) -->
                <el-option
                  v-if="actionStep === 2"
                  v-for="location in getAvailableTargetLocations()"
                  :key="location.id"
                  :label="location.name"
                  :value="location.id"
                />
              </el-select>
              
              <!-- Selected Action Tag -->
              <div v-if="adjustmentForm.action" class="selected-action-tag">
                <el-tag 
                  size="small" 
                  :type="getActionTagType(adjustmentForm.action)"
                  :closable="!isEditing"
                  @close="clearActionSelection"
                  style="margin-top: 5px;"
                >
                  {{ getActionLabel(adjustmentForm.action) }}
                  <span v-if="adjustmentForm.action === 'change_location' && selectedLocationName">
                    → {{ selectedLocationName }}
                  </span>
                </el-tag>
              </div>
              
              <!-- Editing Mode Indicator for Action -->
              <div v-if="isEditing" class="field-frozen-indicator">
                <el-icon><Lock /></el-icon>
                Action is locked during editing
              </div>
            </el-form-item>
          </el-col>
                     <el-col :span="4">
             <el-form-item label="Quantity" required>
               <el-input-number
                 ref="quantityInputRef"
                 v-model="adjustmentForm.quantity"
                 :min="0"
                 :max="getMaxQuantity()"
                 placeholder="Enter quantity"
                 style="width: 100%"
                 controls-position="right"
                 :disabled="!isAdjustmentEditable"
                 @keyup.enter="handleQuantityEnter"
               />
               

             </el-form-item>
           </el-col>
          
          <el-col :span="5">
            <el-form-item label="Reason">
              <el-input
                ref="reasonInputRef"
                v-model="adjustmentForm.reason"
                placeholder="Enter reason for adjustment (optional)"
                style="width: 100%"
                :disabled="!isAdjustmentEditable"
                @keyup.enter="handleReasonEnter"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Selection Path Row - Shows all tags in one line under the form fields -->
        <el-row v-if="selectionPath.length > 0 || adjustmentForm.action || getQuantityResult()" :gutter="20">
          <el-col :span="24">
            <div class="selection-path-row">
              <!-- Drug/Batch/Location Selection Path -->
              <div v-if="selectionPath.length > 0" class="selection-path">
                <span class="path-label">Selection:</span>
                <el-tag 
                  v-for="(item, index) in selectionPath" 
                  :key="index" 
                  size="small" 
                  :type="index === selectionPath.length - 1 ? 'primary' : 'info'"
                  :closable="index === selectionPath.length - 1"
                  @close="goBackToStep(index + 1)"
                  @click="goBackToStep(index + 1)"
                  style="margin-right: 5px; cursor: pointer;"
                >
                  {{ item }}
                </el-tag>
                
                <!-- Quantity Result Tag -->
                <el-tag 
                  v-if="getQuantityResult()"
                  size="small" 
                  :type="getResultTagType()"
                  style="margin-left: 10px;"
                >
                  {{ getQuantityResult() }}
                </el-tag>
              </div>
            </div>
          </el-col>
        </el-row>

      </el-form>
    </el-card>

    <!-- Adjustments Table -->
    <el-card class="adjustments-table-card" shadow="hover" v-if="adjustmentHistory.length > 0 || historyLoading">
      <template #header>
        <div class="card-header">
          <span>
            Adjustments Table - #{{ adjustmentNumber }}
            <span v-if="historyLoading" class="loading-indicator">
              <el-icon class="is-loading"><Loading /></el-icon>
              Loading...
            </span>
          </span>
          <div class="table-header-buttons">
            <el-button 
              v-if="adjustmentStatus === 'draft' && adjustmentHistory.length > 0"
              type="success"
              size="small"
              @click="finalizeCurrentAdjustment"
              :loading="processing"
              :disabled="historyLoading"
            >
              <el-icon><Check /></el-icon>
              Finalize Adjustment
            </el-button>
            <el-tag 
              :type="getStatusTagType(adjustmentStatus)"
              size="large"
              style="margin-left: 10px;"
            >
              {{ drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-table
        :data="adjustmentHistory"
        v-loading="historyLoading"
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="#" width="40" align="center" :index="(index) => index + 1" />
        
        <el-table-column prop="drug_name" label="Drug Name" min-width="500">
          <template #header>
            <div class="name-header">
              <span>Drug Name</span>
              <el-button 
                size="small" 
                type="primary" 
                plain
                @click="toggleLanguage"
                class="language-toggle">
                {{ showPersianNames ? 'EN' : 'فا' }}
              </el-button>
            </div>
          </template>
          <template #default="scope">
            <div class="medicine-name">
              {{ showPersianNames 
                ? (scope.row.persian_name || scope.row.english_name || scope.row.drug_name || 'N/A')
                : (scope.row.english_name || scope.row.persian_name || scope.row.drug_name || 'N/A') 
              }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="batch_number" label="Batch Number" width="150" align="center" />
        
        <el-table-column prop="original_location" label="Source Location" width="120" align="center">
          <template #default="scope">
            <span>{{ scope.row.original_location || 'N/A' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="action" label="Action" width="150" align="center">
          <template #default="scope">
            <el-tag :type="getActionTagType(scope.row.action)" >
              {{ getActionLabel(scope.row.action) }}
              <span v-if="scope.row.action === 'change_location' && scope.row.location !== 'N/A'">
                <br/>→ {{ scope.row.location }}
              </span>
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="quantity" label="Quantity" width="80" align="center">
          <template #default="scope">
            <span :class="getQuantityClass(scope.row.action)">
              {{ getQuantityDisplay(scope.row.quantity, scope.row.action) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="unit_price" label="Unit Price" width="100" align="center">
          <template #default="scope">
            <span>{{ formatPrice(scope.row.unit_price || 0) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="Total Price" width="140" align="center">
          <template #default="scope">
            <span :class="getPriceClass(scope.row.action)">
              {{ getPriceDisplay(scope.row.unit_price || 0, scope.row.quantity, scope.row.action) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="150" align="center" fixed="right">
          <template #default="scope">
            <div class="operations-container">
              <!-- Edit button hidden as requested -->
              <!-- <el-button
                size="small"
                type="primary"
                @click="editAdjustment(scope.$index)"
                plain
                :disabled="!isAdjustmentEditable || (isEditing && editingAdjustmentIndex === scope.$index)"
              >
                {{ isEditing && editingAdjustmentIndex === scope.$index ? 'Editing...' : 'Edit' }}
              </el-button> -->
              <el-button
                size="small"
                type="danger"
                plain
                @click="removeAdjustment(scope.$index)"
                :disabled="!isAdjustmentEditable || (isEditing && editingAdjustmentIndex === scope.$index)"
              >
                Delete
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- Price Summary Card -->
    <el-card class="price-summary-card" shadow="hover" v-if="adjustmentHistory.length > 0">
      <template #header>
        <div class="card-header">
          <span>Summary</span>
        </div>
      </template>

      <el-row :gutter="20">
        
        <el-col :span="6">
          <div class="summary-item positive">
            <div class="summary-label">Added Stock:</div>
            <div class="summary-value">+{{ formatPrice(addedStockSummary.totalPrice) }}</div>
            <div class="summary-detail">({{ addedStockSummary.count }} items)</div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="summary-item negative">
            <div class="summary-label">Deleted Stock:</div>
            <div class="summary-value deleted-stock-value">-{{ formatPrice(Math.abs(deletedStockSummary.totalPrice)) }}</div>
            <div class="summary-detail">({{ deletedStockSummary.count }} items)</div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="summary-item neutral">
            <div class="summary-label">Location Changes:</div>
            <div class="summary-value">{{ locationChangeSummary.count }} items</div>
            <div class="summary-detail">(No price impact)</div>
          </div>
        </el-col>
        
        <el-col :span="6">
          <div class="summary-item" :class="netPriceImpact >= 0 ? 'positive' : 'negative'">
            <div class="summary-label">Net Price Impact:</div>
            <div class="summary-value">
              {{ netPriceImpact >= 0 ? '+' : '' }}{{ formatPrice(netPriceImpact) }}
            </div>
            <div class="summary-detail">(Total impact)</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- No Data Message -->
    <div class="no-data-message" v-else-if="!historyLoading">
      <p>No adjustments found for Adjustment #{{ adjustmentNumber }}. Use the form above to add adjustments.</p>
    </div>
    
    <!-- Loading State -->
    <div class="loading-message" v-else-if="historyLoading && adjustmentHistory.length === 0">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <p>Loading adjustment data...</p>
    </div>

    <!-- Add/Edit Medicine Dialog -->
    <AddMedicineDialog
      v-model="editDialogVisible"
      :drug-id="selectedDrugId"
      :mode="selectedDrugId ? 'edit' : 'add'"
      @saved="handleDrugUpdated"
      @deleted="handleDrugDeleted"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Check, Close, ArrowLeft, ArrowRight, Switch, Printer, ArrowDown, Document, Tickets, InfoFilled, Loading, Edit, Lock, Delete } from '@element-plus/icons-vue'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { useStorageStore } from '@/stores/storageStore'
import { useAuthStore } from '@/store/auth'
import AddMedicineDialog from '@/components/medicine/AddMedicineDialog.vue'
import { drugAdjustmentsAPI, drugAdjustmentItemsAPI, drugAdjustmentHelpers, batchLocationsAPI } from '@/api/drugAdjustments'

// Props from parent tabs component
const props = defineProps({
  tabId: {
    type: String,
    required: true
  },
  initialAdjustmentNumber: {
    type: Number,
    default: null
  }
})

// Emits to parent tabs component
const emit = defineEmits(['title-change', 'unsaved-changes', 'navigation-attempt', 'adjustment-deleted'])

const drugStore = usePharmacyDrugStore()
const storageStore = useStorageStore()
const authStore = useAuthStore()

// Adjustment number state
const adjustmentNumber = ref(props.initialAdjustmentNumber || 1)
const lastValidAdjustmentNumber = ref(props.initialAdjustmentNumber || 1) // Track last valid number
const currentAdjustmentId = ref(null)
const adjustmentStatus = ref('draft')
const isValidatingAdjustmentNumber = ref(false) // Flag to prevent title updates during validation
const isAdjustmentNumberInvalid = ref(false) // Flag to show validation error state
const isCheckingAdjustmentExists = ref(false) // Flag to show checking state

// Watch for changes in initialAdjustmentNumber prop
watch(() => props.initialAdjustmentNumber, (newNumber, oldNumber) => {
  if (newNumber && newNumber !== adjustmentNumber.value && newNumber !== oldNumber) {
    adjustmentNumber.value = newNumber
    lastValidAdjustmentNumber.value = newNumber
    // Load the adjustment data for this number
    loadAdjustmentByNumber(newNumber)
  }
})

// Timestamp tracking
const createdAt = ref(new Date().toISOString())
const updatedAt = ref(new Date().toISOString())
const showCreated = ref(true)

// User and pharmacy info from stores
const currentUser = computed(() => authStore.currentUser?.email || authStore.currentUser?.username || 'Unknown User')
const pharmacyName = computed(() => storageStore.pharmacyInfo?.name || 'Unknown Pharmacy')

// Form data
const adjustmentForm = reactive({
  selectedDrug: null,
  selectedBatch: null,
  selectedLocationQuantity: null,
  quantity: 1,
  action: '',
  newLocation: '',
  reason: ''
})

// Search functionality
const searchResults = ref([])
const searchLoading = ref(false)
const selectedDrugInfo = ref(null)

// Batch functionality
const availableBatches = ref([])
const batchesLoading = ref(false)
const selectedBatchInfo = ref(null)

// Location-Quantity functionality
const batchLocations = ref([])
const selectedLocationQuantityInfo = ref(null)

// Progressive search functionality
const searchStep = ref(1) // 1: Drug, 2: Batch, 3: Location
const currentSearchValue = ref(null)
const selectionPath = ref([])
const selectRef = ref(null)

// Form input references for navigation
const barcodeInputRef = ref(null)
const quantityInputRef = ref(null)
const reasonInputRef = ref(null)

// Language toggle functionality
const showPersianNames = ref(false)
const showPersianNamesInSearch = ref(false)

// Medicine dialog state
const editDialogVisible = ref(false)
const selectedDrugId = ref(null)

// Barcode functionality
const barcodeInput = ref('')
const isProcessingBarcode = ref(false)

// Action field progressive functionality
const actionStep = ref(1) // 1: Select Action, 2: Select Location (for change_location)
const currentActionValue = ref(null)
const selectedLocationName = ref('')
const actionSelectRef = ref(null)

// Storage locations from storage store
const storageLocations = computed(() => storageStore.storages || [])

// Editing state
const isEditing = ref(false)
const editingAdjustmentIndex = ref(-1)
const originalAdjustment = ref(null)

// Processing state
const processing = ref(false)

// History data
const adjustmentHistory = ref([])
const historyLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalRecords = ref(0)

// Computed properties
const isAdjustmentEditable = computed(() => {
  return adjustmentStatus.value === 'draft'
})

const isFormValid = computed(() => {
  // If adjustment is not editable, form is never valid
  if (!isAdjustmentEditable.value) {
    return false
  }
  
  const basicValidation = adjustmentForm.selectedDrug && 
         adjustmentForm.selectedBatch &&
         adjustmentForm.selectedLocationQuantity &&
         adjustmentForm.quantity >= 1 && 
         adjustmentForm.action
  
  // Additional validation for change_location action
  if (adjustmentForm.action === 'change_location') {
    const hasTargetLocation = adjustmentForm.newLocation && selectedLocationName.value
    
    // Check that target location is different from source location
    if (hasTargetLocation && selectedLocationQuantityInfo.value) {
      const sourceLocationName = selectedLocationQuantityInfo.value.storage_name
      const targetLocationName = selectedLocationName.value
      const isDifferentLocation = sourceLocationName !== targetLocationName
      
      return basicValidation && hasTargetLocation && isDifferentLocation
    }
    
    return basicValidation && hasTargetLocation
  }
  
  return basicValidation
})

// Price summary computed properties
const addedStockSummary = computed(() => {
  // Ensure adjustmentHistory is available and is an array
  if (!adjustmentHistory.value || !Array.isArray(adjustmentHistory.value)) {
    return {
      count: 0,
      totalPrice: 0
    }
  }
  
  const addedItems = adjustmentHistory.value.filter(item => item && item.action === 'add_stock')
  return {
    count: addedItems.length,
    totalPrice: addedItems.reduce((sum, item) => {
      const itemPrice = parseFloat(item.total_price) || 0
      return sum + itemPrice
    }, 0)
  }
})

const deletedStockSummary = computed(() => {
  // Ensure adjustmentHistory is available and is an array
  if (!adjustmentHistory.value || !Array.isArray(adjustmentHistory.value)) {
    return {
      count: 0,
      totalPrice: 0
    }
  }
  
  const deletedItems = adjustmentHistory.value.filter(item => 
    item && (item.action === 'delete_expired' || item.action === 'delete_damage')
  )
  
  // Ensure proper numeric calculation by converting to numbers
  const totalPrice = deletedItems.reduce((sum, item) => {
    const itemPrice = parseFloat(item.total_price) || 0
    return sum + itemPrice
  }, 0)
  
  return {
    count: deletedItems.length,
    totalPrice: totalPrice
  }
})

const locationChangeSummary = computed(() => {
  // Ensure adjustmentHistory is available and is an array
  if (!adjustmentHistory.value || !Array.isArray(adjustmentHistory.value)) {
    return {
      count: 0,
      totalPrice: 0
    }
  }
  
  const locationChangeItems = adjustmentHistory.value.filter(item => item && item.action === 'change_location')
  return {
    count: locationChangeItems.length,
    totalPrice: 0 // Location changes don't affect price
  }
})

const netPriceImpact = computed(() => {
  // Ensure adjustmentHistory is available and is an array
  if (!adjustmentHistory.value || !Array.isArray(adjustmentHistory.value)) {
    return 0
  }
  
  return adjustmentHistory.value.reduce((sum, item) => {
    if (!item || !item.total_price) return sum
    const itemPrice = parseFloat(item.total_price) || 0
    return sum + itemPrice
  }, 0)
})

// Watchers for parent component communication
watch(adjustmentNumber, (newNumber) => {
  // Only emit title change if we're not in the middle of validation
  if (!isValidatingAdjustmentNumber.value) {
    emit('title-change', {
      tabId: props.tabId,
      title: `Adjustment #${newNumber}`
    })
  }
}, { immediate: true })

watch([adjustmentHistory, isEditing], ([newHistory, newIsEditing]) => {
  // Emit unsaved changes status
  const hasUnsavedChanges = newIsEditing || (newHistory && newHistory.length > 0 && adjustmentStatus.value === 'draft')
  emit('unsaved-changes', {
    tabId: props.tabId,
    hasUnsavedChanges
  })
}, { deep: true, immediate: true })

const getMaxQuantity = () => {
  if (adjustmentForm.action === 'add_stock') {
    return 99999 // No limit for adding stock
  }
  
  if (!selectedLocationQuantityInfo.value) {
    return 9999
  }
  
  const availableQuantity = selectedLocationQuantityInfo.value.quantity || 0
  
  // In editing mode, add back the original quantity since it was already applied
  if (isEditing.value && editingAdjustmentIndex.value >= 0) {
    const currentItem = adjustmentHistory.value[editingAdjustmentIndex.value]
    return availableQuantity + (currentItem.quantity || 0)
  }
  
  return availableQuantity
}

const getQuantityResult = () => {
  if (!adjustmentForm.action || !adjustmentForm.quantity || !selectedLocationQuantityInfo.value) {
    return null
  }

  // In editing mode, exclude the item being edited to show accurate calculation
  const currentQuantity = getProjectedQuantity(selectedLocationQuantityInfo.value, isEditing.value)
  const adjustmentQuantity = adjustmentForm.quantity || 0
  
  switch (adjustmentForm.action) {
    case 'add_stock':
      return `${currentQuantity} + ${adjustmentQuantity} = ${currentQuantity + adjustmentQuantity}`
    
    case 'change_location':
      if (selectedLocationName.value) {
        return `Remaining: ${currentQuantity - adjustmentQuantity}`
      }
      return `${currentQuantity} - ${adjustmentQuantity} = ${currentQuantity - adjustmentQuantity} (moved)`
    
    case 'delete_expired':
    case 'delete_damage':
      return `${currentQuantity} - ${adjustmentQuantity} = ${currentQuantity - adjustmentQuantity} (deleted)`
    
    default:
      return null
  }
}

const getResultClass = () => {
  if (!adjustmentForm.action) return ''
  
  switch (adjustmentForm.action) {
    case 'add_stock':
      return 'result-positive'
    case 'change_location':
      return 'result-neutral'
    case 'delete_expired':
    case 'delete_damage':
      return 'result-negative'
    default:
      return ''
  }
}

const getResultTagType = () => {
  if (!adjustmentForm.action) return 'info'
  
  switch (adjustmentForm.action) {
    case 'add_stock':
      return 'success'
    case 'change_location':
      return 'info'
    case 'delete_expired':
    case 'delete_damage':
      return 'warning'
    default:
      return 'info'
  }
}

// Methods
const searchDrugs = async (query) => {
  if (!query) {
    searchResults.value = []
    return
  }

  searchLoading.value = true
  try {
    // Ensure pharmacy drugs are loaded
    if (drugStore.drugs.length === 0) {
      await drugStore.fetchDrugs()
    }
    
    // Search through pharmacy drugs locally (similar to MedicinesListView)
    const queryLower = query.toLowerCase()
    const results = drugStore.drugs.filter(drug => 
      (drug.english_name && drug.english_name.toLowerCase().includes(queryLower)) ||
      (drug.persian_name && drug.persian_name.toLowerCase().includes(queryLower)) ||
      (drug.gtin_code && drug.gtin_code.toLowerCase().includes(queryLower)) ||
      (drug.generic_code && drug.generic_code.toLowerCase().includes(queryLower)) ||
      (drug.generic_name && drug.generic_name.toLowerCase().includes(queryLower))
    )
    
    // Filter to only show drugs with available stock
    searchResults.value = results.filter(drug => (drug.total_quantity || drug.total_stock || 0) > 0)
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const onDrugSelect = async (drugId) => {
  if (!drugId) {
    // Clear all dependent selections
    selectedDrugInfo.value = null
    availableBatches.value = []
    adjustmentForm.selectedBatch = null
    adjustmentForm.selectedLocationQuantity = null
    selectedBatchInfo.value = null
    batchLocations.value = []
    selectedLocationQuantityInfo.value = null
    return
  }

  const drug = searchResults.value.find(d => d.id === drugId)
  if (drug) {
    
    selectedDrugInfo.value = {
      ...drug,
      name: drug.english_name || drug.persian_name,
      total_quantity: drug.total_quantity || drug.total_stock || 0
    }
    
    // Reset dependent selections
    adjustmentForm.selectedBatch = null
    adjustmentForm.selectedLocationQuantity = null
    selectedBatchInfo.value = null
    batchLocations.value = []
    selectedLocationQuantityInfo.value = null
    
    // Fetch batches for this drug
    await fetchDrugBatches(drugId)
  }
}

const fetchDrugBatches = async (drugId) => {
  batchesLoading.value = true
  try {
    // Get the selected drug to get its GTIN
    const selectedDrug = drugStore.drugs.find(d => d.id === drugId)
    if (!selectedDrug) {
      availableBatches.value = []
      return
    }
    
    // Fetch all batches and filter by GTIN and pharmacy
    // Note: fetchBatches() without drugId gets all batches for the pharmacy
    await drugStore.fetchBatches()
    

    
    // Filter batches by:
    // 1. GTIN number of selected drug
    // 2. Pharmacy (batches should belong to current pharmacy)
    // 3. Available quantity > 0
    const filteredBatches = drugStore.batches.filter(batch => {
      // Try multiple ways to match - GTIN or drug ID
      const gtinMatch = batch.gtin_code === selectedDrug.gtin_code
      const drugIdMatch = batch.drug === selectedDrug.id
      const hasQuantity = batch.quantity > 0
      
      return (gtinMatch || drugIdMatch) && hasQuantity
    })
    

    
    // If no filtered batches found, temporarily show all batches for debugging
    if (filteredBatches.length === 0 && drugStore.batches.length > 0) {
      console.warn('No batches found for GTIN/Drug ID. Showing all batches for debugging:')
      // Temporarily show all batches to debug the issue
      availableBatches.value = drugStore.batches.filter(batch => batch.quantity > 0)
    } else {
      availableBatches.value = filteredBatches
    }
    
    // Pre-compute prices for better performance
    availableBatches.value.forEach(batch => {
      if (!batch._formattedPrice) {
        batch._formattedPrice = getBatchPrice(batch)
      }
    })
    

    
    // If we're in step 2 and have batches, auto-focus the dropdown
    if (searchStep.value === 2 && availableBatches.value.length > 0) {
      await nextTick()
      setTimeout(() => {
        if (selectRef.value) {
          selectRef.value.focus()
        }
      }, 200)
    }
    
  } catch (error) {
    console.error('Failed to fetch batches:', error)
    availableBatches.value = []
  } finally {
    batchesLoading.value = false
  }
}

const onBatchSelect = async (batchId) => {
  if (!batchId) {
    selectedBatchInfo.value = null
    batchLocations.value = []
    adjustmentForm.selectedLocationQuantity = null
    selectedLocationQuantityInfo.value = null
    return
  }

  const batch = availableBatches.value.find(b => b.id === batchId)
  if (batch) {
    selectedBatchInfo.value = batch
    
    // Reset location selection
    adjustmentForm.selectedLocationQuantity = null
    selectedLocationQuantityInfo.value = null
    

    
    // Always call fetchBatchLocations to handle location setup consistently
    await fetchBatchLocations(batchId)
    
    // If we're in step 3 and have locations, auto-focus the dropdown
    if (searchStep.value === 3 && batchLocations.value.length > 0) {
      await nextTick()
      setTimeout(() => {
        if (selectRef.value) {
          selectRef.value.focus()
        }
      }, 200)
    }
  }
}

const fetchBatchLocations = async (batchId) => {
  try {
    // Get the selected batch info
    const selectedBatch = selectedBatchInfo.value
    if (!selectedBatch) {
      batchLocations.value = []
      return
    }
    
    // Ensure storage data is available
    await storageStore.fetchStorages()
    const allStorages = storageStore.storages
    
    // Try to get locations from batch data first (if API provides them)
    if (selectedBatch.batch_locations && Array.isArray(selectedBatch.batch_locations)) {
      // Use the batch_locations from the batch data (already in correct format)
      batchLocations.value = selectedBatch.batch_locations.map(loc => ({
        id: loc.id,  // Use the actual BatchLocation ID
        storage: loc.storage,  // Storage ID (foreign key)
        storage_name: loc.storage_name,
        quantity: loc.quantity
      }))

    } else {
      // Fetch batch locations from API
      try {
        const response = await batchLocationsAPI.getBatchLocations(batchId)
        
        const apiLocations = response.data.results || response.data
        
        if (apiLocations && apiLocations.length > 0) {
          // Convert API response to frontend format (use actual BatchLocation data)
          batchLocations.value = apiLocations.map(loc => ({
            id: loc.id,  // Use the actual BatchLocation ID
            storage: loc.storage,  // Storage ID (foreign key)
            storage_name: loc.storage_name,
            quantity: loc.quantity
          }))

        } else {
          // No locations found in API, create default location

          if (allStorages.length > 0) {
      batchLocations.value = [{
              id: null,  // No BatchLocation ID yet (will be created when needed)
              storage: allStorages[0].id,  // Storage ID
              storage_name: allStorages[0].name,
        quantity: selectedBatch.quantity || 0
      }]
          } else {
            batchLocations.value = []
          }
        }
      } catch (apiError) {
        console.error('Error fetching batch locations from API:', apiError)
        
        // Fallback: create default location
        if (allStorages.length > 0) {
      batchLocations.value = [{
            id: null,  // No BatchLocation ID yet
            storage: allStorages[0].id,  // Storage ID
        storage_name: allStorages[0].name,
        quantity: selectedBatch.quantity || 0
      }]
                  } else {
          batchLocations.value = []
        }
      }
    }
    

    
    // If we're in step 3 and have locations, auto-focus the dropdown
    if (searchStep.value === 3 && batchLocations.value.length > 0) {
      await nextTick()
      setTimeout(() => {
        if (selectRef.value) {
          selectRef.value.focus()
        }
      }, 200)
    }
    
  } catch (error) {
    console.error('Failed to fetch batch locations:', error)
    batchLocations.value = []
  }
}

const onLocationQuantitySelect = (locationId) => {
  if (!locationId) {
    selectedLocationQuantityInfo.value = null
    return
  }

  const location = batchLocations.value.find(l => l.id === locationId)
  if (location) {
    selectedLocationQuantityInfo.value = location
    
    const availableQuantity = location.quantity || 0
    
    // Auto-set quantity based on action type
    if (adjustmentForm.action === 'add_stock') {
      // For add stock, start with 1 (no limit)
      if (adjustmentForm.quantity === 1) {
        adjustmentForm.quantity = 1
      }
    } else {
      // For other actions (remove/change location), limit to available quantity
      // In editing mode, consider the original quantity that will be added back
      let maxQuantity = availableQuantity
      if (isEditing.value && editingAdjustmentIndex.value >= 0) {
        const currentItem = adjustmentHistory.value[editingAdjustmentIndex.value]
        maxQuantity = availableQuantity + (currentItem.quantity || 0)
      }
      
      if (adjustmentForm.quantity === 1 || adjustmentForm.quantity > maxQuantity) {
        adjustmentForm.quantity = Math.min(1, maxQuantity)
      }
    }
    

  }
}

// Progressive selection methods
const onDrugSelectProgressive = async (drugId) => {
  if (!drugId) {
    resetToStep(1)
    return
  }

  // Call original drug select logic
  await onDrugSelect(drugId)
  
  // Update form values
  adjustmentForm.selectedDrug = drugId
  
  // Add to selection path
  const drugName = selectedDrugInfo.value?.name || 'Unknown Drug'
  selectionPath.value = [drugName]
  
  // Move to step 2 (batch selection) and auto-trigger dropdown
  searchStep.value = 2
  currentSearchValue.value = null
  
  // Auto-open the dropdown for batch selection
  await nextTick()
  triggerDropdownOpen()
}

const onBatchSelectProgressive = async (batchId) => {
  if (!batchId) {
    resetToStep(2)
    return
  }

  // Call original batch select logic
  await onBatchSelect(batchId)
  
  // Update form values
  adjustmentForm.selectedBatch = batchId
  
  // Add to selection path
  const batchName = selectedBatchInfo.value?.batch_number || 'Unknown Batch'
  selectionPath.value = [...selectionPath.value, `Batch: ${batchName}`]
  
  // Move to step 3 (location selection) and auto-trigger dropdown
  searchStep.value = 3
  currentSearchValue.value = null
  
  // Auto-open the dropdown for location selection
  await nextTick()
  triggerDropdownOpen()
}

const onLocationSelectProgressive = async (locationId) => {
  if (!locationId) {
    resetToStep(3)
    return
  }

  // Call original location select logic
  onLocationQuantitySelect(locationId)
  
  // Update form values
  adjustmentForm.selectedLocationQuantity = locationId
  
  // Add to selection path
  const locationName = selectedLocationQuantityInfo.value?.storage_name || 'Unknown Location'
  selectionPath.value = [...selectionPath.value, locationName]
  
  // Set current value to the selected location to prevent dropdown from showing options
  currentSearchValue.value = locationId
}

const resetToStep = (step) => {
  searchStep.value = step
  currentSearchValue.value = null
  
  switch (step) {
    case 1:
      // Reset everything
      adjustmentForm.selectedDrug = null
      adjustmentForm.selectedBatch = null
      adjustmentForm.selectedLocationQuantity = null
      selectedDrugInfo.value = null
      selectedBatchInfo.value = null
      selectedLocationQuantityInfo.value = null
      availableBatches.value = []
      batchLocations.value = []
      selectionPath.value = []
      searchResults.value = []
      break
    case 2:
      // Reset batch and location
      adjustmentForm.selectedBatch = null
      adjustmentForm.selectedLocationQuantity = null
      selectedBatchInfo.value = null
      selectedLocationQuantityInfo.value = null
      batchLocations.value = []
      selectionPath.value = selectionPath.value.slice(0, 1)
      break
    case 3:
      // Reset only location
      adjustmentForm.selectedLocationQuantity = null
      selectedLocationQuantityInfo.value = null
      selectionPath.value = selectionPath.value.slice(0, 2)
      // Clear current search value when resetting location
      currentSearchValue.value = null
      break
  }
}

const onActionChange = () => {
  // Reset location when action changes
  adjustmentForm.newLocation = ''
  
  // Adjust quantity limits based on new action
  if (selectedLocationQuantityInfo.value) {
    if (adjustmentForm.action === 'add_stock') {
      // For add stock, no quantity limit
      if (adjustmentForm.quantity === 0) {
        adjustmentForm.quantity = 1
      }
    } else {
      // For other actions, limit to available quantity at location
      const maxQty = selectedLocationQuantityInfo.value.quantity
      if (adjustmentForm.quantity > maxQty) {
        adjustmentForm.quantity = maxQty
      }
    }
  }
}

const isDuplicateAdjustment = () => {
  // Get current selection details
  const currentDrugId = adjustmentForm.selectedDrug
  const currentBatchId = adjustmentForm.selectedBatch
  const currentLocationId = adjustmentForm.selectedLocationQuantity
  const currentAction = adjustmentForm.action
  
  // For change_location action, also check the target location
  const currentNewLocation = adjustmentForm.action === 'change_location' ? adjustmentForm.newLocation : null
  
  // Check if this combination already exists in adjustmentHistory
  return adjustmentHistory.value.some(adjustment => {
    const sameGtin = adjustment.drug_id === currentDrugId
    const sameBatch = adjustment.batch_id === currentBatchId
    const sameLocation = adjustment.location_id === currentLocationId
    const sameAction = adjustment.action === currentAction
    
    // For change_location actions, also compare target locations
    if (currentAction === 'change_location') {
      const targetLocationName = currentNewLocation ? 
        storageLocations.value.find(l => l.id === currentNewLocation)?.name : null
      const sameTargetLocation = adjustment.location === targetLocationName
      return sameGtin && sameBatch && sameLocation && sameAction && sameTargetLocation
    }
    
    return sameGtin && sameBatch && sameLocation && sameAction
  })
}

/* DEPRECATED: isDuplicateAdjustmentForEdit function is no longer used since edit now uses delete-then-add approach
const isDuplicateAdjustmentForEdit = () => {
  // Get current selection details
  const currentDrugId = adjustmentForm.selectedDrug
  const currentBatchId = adjustmentForm.selectedBatch
  const currentLocationId = adjustmentForm.selectedLocationQuantity
  const currentAction = adjustmentForm.action
  
  // For change_location action, also check the target location
  const currentNewLocation = adjustmentForm.action === 'change_location' ? adjustmentForm.newLocation : null
  
  // Check if this combination already exists in adjustmentHistory (excluding the item being edited)
  return adjustmentHistory.value.some((adjustment, index) => {
    // Skip the item currently being edited
    if (index === editingAdjustmentIndex.value) {
      return false
    }
    
    const sameGtin = adjustment.drug_id === currentDrugId
    const sameBatch = adjustment.batch_id === currentBatchId
    const sameLocation = adjustment.location_id === currentLocationId
    const sameAction = adjustment.action === currentAction
    
    // For change_location actions, also compare target locations
    if (currentAction === 'change_location') {
      const targetLocationName = currentNewLocation ? 
        storageLocations.value.find(l => l.id === currentNewLocation)?.name : null
      const sameTargetLocation = adjustment.location === targetLocationName
      return sameGtin && sameBatch && sameLocation && sameAction && sameTargetLocation
    }
    
    return sameGtin && sameBatch && sameLocation && sameAction
  })
}
*/

const addOrUpdateAdjustment = () => {
  if (!isFormValid.value) {
    ElMessage.warning('Please fill in all required fields')
    return
  }

  if (isEditing.value) {
    // Since edit now uses delete-then-add approach, update is just add
    addAdjustmentToTable()
    // Reset editing state after successful add
    isEditing.value = false
    editingAdjustmentIndex.value = -1
    originalAdjustment.value = null
  } else {
    addAdjustmentToTable()
  }
}

const addAdjustmentToTable = async () => {
  // Check if adjustment is editable
  if (!isAdjustmentEditable.value) {
    ElMessage.error(`Cannot add items to a ${adjustmentStatus.value} adjustment. Only draft adjustments can be modified.`)
    return
  }
  
  // Check for duplicate entry
  if (isDuplicateAdjustment()) {
    ElMessage.warning('This adjustment already exists in the table. Cannot add duplicate entries with the same drug, batch, location, and action.')
    return
  }
  
  // Validate quantity against real-time available quantity
  if (selectedLocationQuantityInfo.value && adjustmentForm.action !== 'add_stock') {
    const availableQuantity = selectedLocationQuantityInfo.value.quantity || 0
    if (adjustmentForm.quantity > availableQuantity) {
      ElMessage.error(`Cannot ${adjustmentForm.action.replace('_', ' ')} ${adjustmentForm.quantity} items. Only ${availableQuantity} items available at this location.`)
      return
    }
  }
  
  // Additional validation for change_location action
  if (adjustmentForm.action === 'change_location' && selectedLocationQuantityInfo.value) {
    const sourceLocationName = selectedLocationQuantityInfo.value.storage_name
    const targetLocationName = selectedLocationName.value
    
    if (sourceLocationName === targetLocationName) {
      ElMessage.error('Cannot move items to the same location they are already in. Please select a different target location.')
      return
    }
  }

  // Debug: Log current adjustment session state
  
  
  // Ensure we have a current adjustment session - create one if needed
  if (!currentAdjustmentId.value) {
    console.log('No current adjustment ID found, creating new adjustment session...')
    try {
      const newAdjustmentData = {
        adjustment_number: adjustmentNumber.value,
        status: 'draft'
      }
      
      console.log('Creating adjustment with data:', newAdjustmentData)
      const response = await drugAdjustmentsAPI.createAdjustment(newAdjustmentData)
      const newAdjustment = response.data
      
      currentAdjustmentId.value = newAdjustment.id
      adjustmentStatus.value = 'draft'
      createdAt.value = newAdjustment.created_at
      updatedAt.value = newAdjustment.updated_at
      
      console.log('Successfully created adjustment session:', newAdjustment)
      ElMessage.success(`Created new adjustment session #${adjustmentNumber.value}`)
      
    } catch (createError) {
      console.error('Error creating adjustment session:', createError)
      ElMessage.error(`Failed to create adjustment session: ${createError.response?.data?.error || createError.message}`)
      return
    }
  } else {
    console.log('Using existing adjustment session ID:', currentAdjustmentId.value)
  }
  
  try {
    processing.value = true
  
    // Get unit price from selected batch
    const unitPrice = getBatchPriceValue(selectedBatchInfo.value)
    
    // Debug logging

    
    // Prepare adjustment item data for backend
    const adjustmentItemData = {
      adjustment: currentAdjustmentId.value,
      drug: adjustmentForm.selectedDrug,
      batch: adjustmentForm.selectedBatch,
      source_location: getSourceLocationId(),
      target_location: adjustmentForm.action === 'change_location' ? adjustmentForm.newLocation : null,
      action: adjustmentForm.action,
      quantity: adjustmentForm.quantity,
      unit_price: unitPrice,
      reason: adjustmentForm.reason || 'No reason provided',
      apply_immediately: true // Try to tell backend to apply immediately
    }
    

    
    // Save to backend
    const response = await drugAdjustmentItemsAPI.createAdjustmentItem(adjustmentItemData)
    const savedItem = response.data
    
    // Try multiple approaches to apply the adjustment immediately
    let applied = false
    
    // Approach 1: Check if backend applied it automatically (if apply_immediately was recognized)
    if (savedItem.applied === true) {
      applied = true
    }
    
    // Approach 2: Try to finalize and then set back to draft to force application
    if (!applied) {
      try {
        // Temporarily finalize the adjustment to apply changes
        await drugAdjustmentsAPI.finalizeAdjustment(currentAdjustmentId.value)
        
        // Set it back to draft status so user can continue adding items
        await drugAdjustmentsAPI.patchAdjustment(currentAdjustmentId.value, { status: 'draft' })
        
        applied = true
        
      } catch (finalizeError) {
        // Finalization failed, will try manual approach
      }
    }
    
    // Approach 3: Manual batch location updates as fallback
    if (!applied) {
      const adjustmentDataForApplication = {
        action: adjustmentForm.action,
        quantity: adjustmentForm.quantity,
        sourceLocationId: adjustmentForm.selectedLocationQuantity,
        targetLocationId: adjustmentForm.action === 'change_location' ? adjustmentForm.newLocation : null
      }
      await applyAdjustmentItemImmediately(adjustmentDataForApplication)
    }
    
    // Create local adjustment object for display
    const newAdjustment = {
      id: savedItem.id,
      date: savedItem.created_at,
      drug_name: selectedDrugInfo.value.name || selectedDrugInfo.value.english_name || selectedDrugInfo.value.persian_name,
      english_name: selectedDrugInfo.value.english_name,
      persian_name: selectedDrugInfo.value.persian_name,
      batch_number: selectedBatchInfo.value.batch_number,
      action: adjustmentForm.action,
      quantity: adjustmentForm.quantity,
      unit_price: unitPrice,
      total_price: calculateTotalPrice(unitPrice, adjustmentForm.quantity, adjustmentForm.action),
      location: adjustmentForm.action === 'change_location' && adjustmentForm.newLocation ? 
        storageLocations.value.find(l => l.id === adjustmentForm.newLocation)?.name : 
        selectedLocationQuantityInfo.value?.storage_name || 'N/A',
      reason: adjustmentForm.reason || 'No reason provided',
      user: currentUser.value,
      // Additional info for tracking
      drug_id: adjustmentForm.selectedDrug,
      batch_id: adjustmentForm.selectedBatch,
      location_id: adjustmentForm.selectedLocationQuantity,
      original_location: selectedLocationQuantityInfo.value?.storage_name,
      // Backend fields
      backend_id: savedItem.id,
      applied: true // NEW: Mark as applied since we applied immediately
    }
    
    // Add to table
    adjustmentHistory.value.unshift(newAdjustment)
    totalRecords.value++
    
    // Update timestamp
    updatedAt.value = new Date().toISOString()
    
    // NEW: Refresh drug and batch data to show updated quantities
    await refreshQuantitiesAfterChange()
    
    // Reset form and progressive search
    resetForm()
    resetToStep(1)
    
    ElMessage.success('Adjustment added and applied to database quantities immediately!')
    
  } catch (error) {
    console.error('=== DEBUG: API Error ===')
    console.error('Full error object:', error)
    console.error('Error response:', error.response)
    console.error('Error response data:', error.response?.data)
    console.error('Error message:', error.message)
    
    let errorMessage = 'Failed to save adjustment item'
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage += ': ' + error.response.data
      } else if (error.response.data.error) {
        errorMessage += ': ' + error.response.data.error
      } else if (error.response.data.detail) {
        errorMessage += ': ' + error.response.data.detail
      } else {
        // Show validation errors if available
        const errors = []
        for (const [field, fieldErrors] of Object.entries(error.response.data)) {
          if (Array.isArray(fieldErrors)) {
            errors.push(`${field}: ${fieldErrors.join(', ')}`)
          } else {
            errors.push(`${field}: ${fieldErrors}`)
          }
        }
        if (errors.length > 0) {
          errorMessage += ': ' + errors.join('; ')
        }
      }
    } else {
      errorMessage += ': ' + error.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    processing.value = false
  }
}

/* DEPRECATED: updateAdjustment function is no longer used since edit now uses delete-then-add approach
const updateAdjustment = async () => {
  // Check for duplicate entry (excluding the current editing item)
  if (isDuplicateAdjustmentForEdit()) {
    ElMessage.warning('This adjustment combination already exists in the table. Cannot create duplicate entries with the same drug, batch, location, and action.')
    return
  }
  
  // Validate quantity against real-time available quantity (for editing, we need to add back the original quantity)
  if (selectedLocationQuantityInfo.value && adjustmentForm.action !== 'add_stock') {
    const currentItem = adjustmentHistory.value[editingAdjustmentIndex.value]
    const availableQuantity = selectedLocationQuantityInfo.value.quantity || 0
    // Add back the original quantity since we're editing (it was already subtracted when originally applied)
    const adjustedAvailableQuantity = availableQuantity + (currentItem.quantity || 0)
    
    if (adjustmentForm.quantity > adjustedAvailableQuantity) {
      ElMessage.error(`Cannot ${adjustmentForm.action.replace('_', ' ')} ${adjustmentForm.quantity} items. Only ${adjustedAvailableQuantity} items available at this location (including the ${currentItem.quantity} from the item being edited).`)
      return
    }
  }
  
  // Additional validation for change_location action
  if (adjustmentForm.action === 'change_location' && selectedLocationQuantityInfo.value) {
    const sourceLocationName = selectedLocationQuantityInfo.value.storage_name
    const targetLocationName = selectedLocationName.value
    
    if (sourceLocationName === targetLocationName) {
      ElMessage.error('Cannot move items to the same location they are already in. Please select a different target location.')
      return
    }
  }
  
  try {
    processing.value = true
    
    // Get unit price from selected batch
    const unitPrice = getBatchPriceValue(selectedBatchInfo.value)
    
    // Get the current adjustment item being edited
    const currentItem = adjustmentHistory.value[editingAdjustmentIndex.value]
    
    // Prepare updated adjustment item data for backend
    const updatedAdjustmentItemData = {
      adjustment: currentAdjustmentId.value,
      drug: adjustmentForm.selectedDrug,
      batch: adjustmentForm.selectedBatch,
      source_location: getSourceLocationId(),
      target_location: adjustmentForm.action === 'change_location' ? adjustmentForm.newLocation : null,
      action: adjustmentForm.action,
      quantity: adjustmentForm.quantity,
      unit_price: unitPrice,
      reason: adjustmentForm.reason || 'No reason provided',
      apply_immediately: true // Try to tell backend to apply immediately
    }
    
    // STEP 1: Always reverse the original adjustment first (undo the previous action)
    const originalAdjustmentData = {
      action: currentItem.action,
      quantity: currentItem.quantity,
      sourceLocationId: currentItem.location_id,
      targetLocationId: currentItem.action === 'change_location' ? 
        storageLocations.value.find(l => l.name === currentItem.location)?.id : null,
      batchId: currentItem.batch_id
    }
            await reverseAdjustmentImmediately({ backendId: originalAdjustment.value.backend_id })
    
    // STEP 2: Update the item in backend
    console.log('=== EDIT: STEP 2 - Updating backend ===')
    const response = await drugAdjustmentItemsAPI.updateAdjustmentItem(currentItem.backend_id, updatedAdjustmentItemData)
    const updatedItem = response.data
    
    // STEP 3: Apply the new adjustment (the edited version)
    const newAdjustmentData = {
      action: adjustmentForm.action,
      quantity: adjustmentForm.quantity,
      sourceLocationId: adjustmentForm.selectedLocationQuantity,
      targetLocationId: adjustmentForm.action === 'change_location' ? adjustmentForm.newLocation : null,
      batchId: selectedBatchInfo.value?.id
    }
    
    // Try multiple approaches to apply the new adjustment
    let applied = false
    
    // Approach 1: Check if backend applied it automatically
    if (updatedItem.applied === true) {
      applied = true
    }
    
    // Approach 2: Try to finalize and then set back to draft
    if (!applied) {
      try {
        // Temporarily finalize the adjustment to apply changes
        await drugAdjustmentsAPI.finalizeAdjustment(currentAdjustmentId.value)
        
        // Set it back to draft status so user can continue editing
        await drugAdjustmentsAPI.patchAdjustment(currentAdjustmentId.value, { status: 'draft' })
        
        applied = true
        
      } catch (finalizeError) {
        // Finalization failed, will try manual approach
      }
    }
    
    // Approach 3: Manual application as fallback
    if (!applied) {
      await applyAdjustmentItemImmediately(newAdjustmentData)
    }
    
    // Update the adjustment in the table
    const updatedAdjustment = {
      ...adjustmentHistory.value[editingAdjustmentIndex.value],
      drug_name: selectedDrugInfo.value.name || selectedDrugInfo.value.english_name || selectedDrugInfo.value.persian_name,
      english_name: selectedDrugInfo.value.english_name,
      persian_name: selectedDrugInfo.value.persian_name,
      action: adjustmentForm.action,
      quantity: adjustmentForm.quantity,
      unit_price: unitPrice,
      total_price: calculateTotalPrice(unitPrice, adjustmentForm.quantity, adjustmentForm.action),
      location: adjustmentForm.newLocation ? 
        storageLocations.value.find(l => l.id === adjustmentForm.newLocation)?.name : 
        'N/A',
      reason: adjustmentForm.reason || 'No reason provided',
      applied: true // NEW: Mark as applied since we applied immediately
    }
    
    adjustmentHistory.value[editingAdjustmentIndex.value] = updatedAdjustment
    
    // Update timestamp
    updatedAt.value = new Date().toISOString()
    
    // NEW: Refresh drug and batch data to show updated quantities
    await refreshQuantitiesAfterChange()
    
    // Reset editing state
    cancelEdit()
    
    ElMessage.success('Adjustment updated and applied to database quantities immediately!')
    
  } catch (error) {
    console.error('Error updating adjustment:', error)
    
    let errorMessage = 'Failed to update adjustment item'
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage += ': ' + error.response.data
      } else if (error.response.data.error) {
        errorMessage += ': ' + error.response.data.error
      } else if (error.response.data.detail) {
        errorMessage += ': ' + error.response.data.detail
      }
    } else {
      errorMessage += ': ' + error.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    processing.value = false
  }
}
*/

const editAdjustment = async (index) => {
  // Check if adjustment is editable
  if (!isAdjustmentEditable.value) {
    ElMessage.error(`Cannot edit items in a ${adjustmentStatus.value} adjustment. Only draft adjustments can be modified.`)
    return
  }
  
  // If already editing another adjustment, show warning
  if (isEditing.value && editingAdjustmentIndex.value !== index) {
    ElMessage({
      type: 'warning',
      message: 'Please finish editing the current adjustment first, or cancel the edit.',
      duration: 3000
    })
    return
  }
  
  // Store original adjustment data for cancel functionality
  originalAdjustment.value = JSON.parse(JSON.stringify(adjustmentHistory.value[index]))
  
  try {
    processing.value = true
    
    // STEP 1: Delete the item using exact delete logic
    const adjustmentItem = adjustmentHistory.value[index]
    
    // Ensure we have the correct batch location data for reversal
    if (adjustmentItem.batch_id) {
      try {
        // Fetch batch locations directly using the API
        const response = await batchLocationsAPI.getBatchLocations(adjustmentItem.batch_id)
        const fetchedLocations = response.data.results || response.data || []
        
        // Update batchLocations with the fetched data
        batchLocations.value = fetchedLocations.map(loc => ({
          id: loc.id,
          storage: loc.storage,
          storage_name: loc.storage_name,
          quantity: loc.quantity
        }))
        
      } catch (fetchError) {
        console.error('🔄 EDIT: Failed to fetch batch locations:', fetchError)
        ElMessage.error('Failed to load batch location data for editing')
        return
      }
    } else {
      console.error('🔄 EDIT: No batch ID found in adjustment item')
      ElMessage.error('Cannot edit adjustment: missing batch information')
      return
    }
    
    // Verify we have the location
    let itemLocation = batchLocations.value.find(loc => loc.id === adjustmentItem.location_id)
    
    if (!itemLocation) {
      // Check if the location_id might be referring to a storage ID instead of batch location ID
      const locationByStorageId = batchLocations.value.find(loc => loc.storage === adjustmentItem.location_id)
      if (locationByStorageId) {
        itemLocation = locationByStorageId
      } else {
        console.error('🔄 EDIT: Location not found by storage ID either')
        ElMessage.error(`Cannot find location ID ${adjustmentItem.location_id} for editing. The location may have been deleted or moved to a different batch.`)
        return
      }
    }
    
    // Reverse the adjustment (undo what was applied)
    let targetLocationId = null
    if (adjustmentItem.action === 'change_location') {
      const targetLocationByName = storageLocations.value.find(l => l.name === adjustmentItem.location)
      if (targetLocationByName) {
        targetLocationId = targetLocationByName.id
      } else {
        const targetInBatchLocations = batchLocations.value.find(bl => bl.storage_name === adjustmentItem.location)
        if (targetInBatchLocations) {
          targetLocationId = targetInBatchLocations.storage
        }
      }
    }

    const adjustmentDataForReversal = {
      backendId: adjustmentItem.backend_id
    }
    
    const reversalSuccess = await reverseAdjustmentImmediately(adjustmentDataForReversal)
    
    if (!reversalSuccess) {
      console.error('🔄 EDIT: Reversal failed, aborting edit')
      ElMessage.error('Failed to reverse adjustment quantities. Edit aborted.')
      return
    }
    
    // Delete from backend
    if (adjustmentItem.backend_id) {
      await drugAdjustmentItemsAPI.deleteAdjustmentItem(adjustmentItem.backend_id)
    }

    // Remove from table
    adjustmentHistory.value.splice(index, 1)
    totalRecords.value--
    
    // STEP 2: Set up the form with the original data (add logic)
    const adjustmentToEdit = originalAdjustment.value
    
    // Find the actual drug from the store using the stored drug_id
    const drugId = adjustmentToEdit.drug_id
    let drugInfo = null
    
    if (drugId) {
      drugInfo = drugStore.drugs.find(d => d.id === drugId)
    }
    
    if (!drugInfo) {
      const drugName = adjustmentToEdit.drug_name
      drugInfo = drugStore.drugs.find(d => 
        (d.english_name && d.english_name === drugName) ||
        (d.persian_name && d.persian_name === drugName)
      )
    }
    
    if (!drugInfo) {
      ElMessage.error(`Cannot find drug: ${adjustmentToEdit.drug_name}. The drug may have been deleted.`)
      return
    }
    
    // Set up the drug selection (Step 1)
    selectedDrugInfo.value = {
      ...drugInfo,
      name: drugInfo.english_name || drugInfo.persian_name,
      total_quantity: drugInfo.total_quantity || drugInfo.total_stock || 0
    }
    adjustmentForm.selectedDrug = drugInfo.id
    
    // Set up progressive search state for step 1
    searchStep.value = 1
    selectionPath.value = [selectedDrugInfo.value.name]
    currentSearchValue.value = drugInfo.id
    
    // Fetch and set up batches (Step 2)
    await fetchDrugBatches(drugInfo.id)
    
    // Find and select the batch
    const batchId = adjustmentToEdit.batch_id
    let batchInfo = null
    
    if (batchId) {
      batchInfo = availableBatches.value.find(b => b.id === batchId)
    }
    
    if (!batchInfo) {
      const batchNumber = adjustmentToEdit.batch_number
      batchInfo = availableBatches.value.find(b => b.batch_number === batchNumber)
    }
    
    if (!batchInfo) {
      ElMessage.error(`Cannot find batch: ${adjustmentToEdit.batch_number}. The batch may have been deleted.`)
      return
    }
    
    // Set up the batch selection (Step 2)
    selectedBatchInfo.value = batchInfo
    adjustmentForm.selectedBatch = batchInfo.id
    
    // Update progressive search state for step 2
    searchStep.value = 2
    selectionPath.value = [...selectionPath.value, `Batch: ${batchInfo.batch_number}`]
    
    // Fetch and set up batch locations (Step 3)
    await onBatchSelect(batchInfo.id)
    
    // Find and select the location
    const locationId = adjustmentToEdit.location_id
    let locationInfo = null
    
    if (locationId) {
      locationInfo = batchLocations.value.find(l => l.id === locationId)
    }
    
    if (!locationInfo) {
      const originalLocation = adjustmentToEdit.original_location || adjustmentToEdit.location
      if (originalLocation && originalLocation !== 'N/A') {
        locationInfo = batchLocations.value.find(l => l.storage_name === originalLocation)
      }
    }
    
    if (!locationInfo && batchLocations.value.length > 0) {
      locationInfo = batchLocations.value[0]
      ElMessage.warning('Original location not found, using first available location')
    }
    
    if (!locationInfo) {
      ElMessage.error('Cannot find location information for this batch')
      return
    }
    
    // Set up the location selection (Step 3)
    selectedLocationQuantityInfo.value = locationInfo
    adjustmentForm.selectedLocationQuantity = locationInfo.id
    
    // Update progressive search state for step 3
    searchStep.value = 3
    selectionPath.value = [...selectionPath.value, locationInfo.storage_name]
    currentSearchValue.value = locationInfo.id
    
    // Set up the form fields
    adjustmentForm.quantity = adjustmentToEdit.quantity
    adjustmentForm.action = adjustmentToEdit.action
    adjustmentForm.reason = adjustmentToEdit.reason
    
    // Set up action field state
    if (adjustmentToEdit.action === 'change_location' && adjustmentToEdit.location !== 'N/A') {
      const location = storageLocations.value.find(l => l.name === adjustmentToEdit.location)
      if (location) {
        adjustmentForm.newLocation = location.id
        selectedLocationName.value = location.name
        actionStep.value = 1
        currentActionValue.value = 'change_location'
      }
    } else {
      actionStep.value = 1
      currentActionValue.value = adjustmentToEdit.action
    }
    
    // Set editing state
    isEditing.value = true
    editingAdjustmentIndex.value = index
    
    // Refresh quantities after the delete operation
    await refreshQuantitiesAfterChange()
    
    ElMessage.success('Item deleted and loaded for editing. Make changes and click "Update Adjustment" to save.')
    
  } catch (error) {
    console.error('Error in edit process:', error)
    ElMessage.error('Failed to edit adjustment')
  } finally {
    processing.value = false
  }
}

const cancelEdit = async () => {
  try {
    processing.value = true
    
    // If we have original adjustment data, restore it
    if (originalAdjustment.value) {
      console.log('🔄 CANCEL: Restoring original item:', originalAdjustment.value)
      
      // Re-add the original item using the exact add logic
      const originalItem = originalAdjustment.value
      
      // Ensure we have a current adjustment session
      if (!currentAdjustmentId.value) {
        console.log('🔄 CANCEL: No current adjustment ID found, creating new adjustment session...')
        try {
          const newAdjustmentData = {
            adjustment_number: adjustmentNumber.value,
            status: 'draft'
          }
          
          const response = await drugAdjustmentsAPI.createAdjustment(newAdjustmentData)
          const newAdjustment = response.data
          
          currentAdjustmentId.value = newAdjustment.id
          adjustmentStatus.value = 'draft'
          createdAt.value = newAdjustment.created_at
          updatedAt.value = newAdjustment.updated_at
          
          console.log('🔄 CANCEL: Created new adjustment session:', newAdjustment)
          
        } catch (createError) {
          console.error('🔄 CANCEL: Error creating adjustment session:', createError)
          ElMessage.error(`Failed to create adjustment session: ${createError.response?.data?.error || createError.message}`)
          return
        }
      }
      
      // Get unit price from the original item
      const unitPrice = originalItem.unit_price || 0
      
      // For change_location, find the target location ID
      let targetLocationId = null
      if (originalItem.action === 'change_location' && originalItem.location && originalItem.location !== 'N/A') {
        const targetLocation = storageLocations.value.find(l => l.name === originalItem.location)
        if (targetLocation) {
          targetLocationId = targetLocation.id
        } else {
          console.warn('🔄 CANCEL: Target location not found:', originalItem.location)
        }
      }
      
      // We need to find the correct source_location ID
      // The API expects the storage ID, not the batch location ID
      let sourceLocationId = null
      
      // Try to get the storage ID from the original item
      if (originalItem.location_id) {
        // First, try to fetch batch locations to find the storage ID
        try {
          const batchResponse = await batchLocationsAPI.getBatchLocations(originalItem.batch_id)
          const batchLocations = batchResponse.data.results || batchResponse.data || []
          const batchLocation = batchLocations.find(loc => loc.id === originalItem.location_id)
          
          if (batchLocation && batchLocation.storage) {
            sourceLocationId = batchLocation.storage
            console.log('🔄 CANCEL: Found storage ID from batch location:', sourceLocationId)
          } else {
            console.warn('🔄 CANCEL: Could not find storage ID from batch location')
            // Fallback: use the location_id directly (might be storage ID already)
            sourceLocationId = originalItem.location_id
          }
        } catch (batchError) {
          console.warn('🔄 CANCEL: Failed to fetch batch locations, using location_id directly:', batchError)
          sourceLocationId = originalItem.location_id
        }
      }
      
      // Prepare adjustment item data for backend restoration
      const adjustmentItemData = {
        adjustment: currentAdjustmentId.value,
        drug: originalItem.drug_id,
        batch: originalItem.batch_id,
        source_location: sourceLocationId,
        target_location: targetLocationId,
        action: originalItem.action,
        quantity: originalItem.quantity,
        unit_price: unitPrice,
        reason: originalItem.reason || 'Restored from cancelled edit',
        apply_immediately: true
      }
      
      console.log('🔄 CANCEL: Restoring item with data:', adjustmentItemData)
      console.log('🔄 CANCEL: Original item for reference:', originalItem)
      
      // Save to backend
      const response = await drugAdjustmentItemsAPI.createAdjustmentItem(adjustmentItemData)
      const savedItem = response.data
      
      console.log('🔄 CANCEL: Backend response:', savedItem)
      
      // Apply the adjustment immediately using multiple approaches
      let applied = false
      
      // Approach 1: Check if backend applied it automatically
      if (savedItem.applied === true) {
        applied = true
        console.log('🔄 CANCEL: Backend applied automatically')
      }
      
      // Approach 2: Try finalize and set back to draft approach
      if (!applied) {
        try {
          console.log('🔄 CANCEL: Trying finalize approach')
          await drugAdjustmentsAPI.finalizeAdjustment(currentAdjustmentId.value)
          await drugAdjustmentsAPI.patchAdjustment(currentAdjustmentId.value, { status: 'draft' })
          applied = true
          console.log('🔄 CANCEL: Finalize approach succeeded')
        } catch (finalizeError) {
          console.log('🔄 CANCEL: Finalize approach failed, trying manual approach')
        }
      }
      
      // Approach 3: Manual application as fallback
      if (!applied) {
        console.log('🔄 CANCEL: Applying manually')
        const adjustmentDataForApplication = {
          action: originalItem.action,
          quantity: originalItem.quantity,
          sourceLocationId: originalItem.location_id,
          targetLocationId: targetLocationId,
          batchId: originalItem.batch_id
        }
        
        console.log('🔄 CANCEL: Manual application data:', adjustmentDataForApplication)
        const applicationSuccess = await applyAdjustmentItemImmediately(adjustmentDataForApplication)
        
        if (!applicationSuccess) {
          console.error('🔄 CANCEL: Manual application failed')
          ElMessage.error('Failed to apply restored adjustment quantities')
          return
        }
        
        console.log('🔄 CANCEL: Manual application succeeded')
      }
      
      // Restore the item to the table with updated backend ID
      const restoredAdjustment = {
        ...originalItem,
        backend_id: savedItem.id,
        applied: true,
        date: savedItem.created_at || originalItem.date
      }
      
      console.log('🔄 CANCEL: Restoring to table at index:', editingAdjustmentIndex.value)
      console.log('🔄 CANCEL: Restored adjustment:', restoredAdjustment)
      
      // Add back to table at the original position
      adjustmentHistory.value.splice(editingAdjustmentIndex.value, 0, restoredAdjustment)
      totalRecords.value++
      
      // Update timestamp
      updatedAt.value = new Date().toISOString()
      
      // Refresh quantities
      await refreshQuantitiesAfterChange()
      
      console.log('🔄 CANCEL: Restoration completed successfully')
      ElMessage.success('Edit cancelled and original item restored')
    } else {
      console.log('🔄 CANCEL: No original adjustment data to restore')
      ElMessage.info('Edit cancelled')
    }
    
  } catch (error) {
    console.error('🔄 CANCEL: Error restoring original item:', error)
    console.error('🔄 CANCEL: Error response:', error.response)
    console.error('🔄 CANCEL: Error response data:', error.response?.data)
    
    let errorMessage = 'Failed to restore original item. Edit cancelled without restoration.'
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage += ' Error: ' + error.response.data
      } else if (error.response.data.error) {
        errorMessage += ' Error: ' + error.response.data.error
      } else if (error.response.data.detail) {
        errorMessage += ' Error: ' + error.response.data.detail
      } else {
        // Show validation errors if available
        const errors = []
        for (const [field, fieldErrors] of Object.entries(error.response.data)) {
          if (Array.isArray(fieldErrors)) {
            errors.push(`${field}: ${fieldErrors.join(', ')}`)
          } else {
            errors.push(`${field}: ${fieldErrors}`)
          }
        }
        if (errors.length > 0) {
          errorMessage += ' Validation errors: ' + errors.join('; ')
        }
      }
    }
    
    ElMessage.error(errorMessage)
  } finally {
  // Reset editing state
  isEditing.value = false
  editingAdjustmentIndex.value = -1
  originalAdjustment.value = null
  
  // Reset form and progressive search states
  resetForm()
  resetToStep(1)
  
  // Reset action field states
  resetActionToStep(1)
  
    processing.value = false
  }
}

const removeAdjustment = async (index) => {
  // Check if adjustment is editable
  if (!isAdjustmentEditable.value) {
    ElMessage.error(`Cannot delete items from a ${adjustmentStatus.value} adjustment. Only draft adjustments can be modified.`)
    return
  }
  
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this adjustment? This will immediately reverse the quantity changes in the database. This action cannot be undone.',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const adjustmentItem = adjustmentHistory.value[index]
    
    try {
      processing.value = true
      
      // STEP 1: Reverse the adjustment using backend API
      if (!adjustmentItem.backend_id) {
        console.log('🗑️ DELETE: No backend ID found, skipping reversal')
        ElMessage.error('Cannot reverse adjustment: missing backend ID')
        return
      }

      const adjustmentDataForReversal = {
        backendId: adjustmentItem.backend_id
      }
      
      console.log('🗑️ DELETE: Reversing adjustment using backend API, ID:', adjustmentItem.backend_id)
      const reversalSuccess = await reverseAdjustmentImmediately(adjustmentDataForReversal)
      
      if (!reversalSuccess) {
        console.error('🗑️ DELETE: Reversal failed, aborting deletion')
        ElMessage.error('Failed to reverse adjustment quantities. Deletion aborted.')
        return
      }
      
      console.log('🗑️ DELETE: Reversal completed via backend API')
      
      // STEP 2: Delete from backend
      console.log('🗑️ DELETE: STEP 2 - Deleting from backend')
        await drugAdjustmentItemsAPI.deleteAdjustmentItem(adjustmentItem.backend_id)
        console.log('🗑️ DELETE: Successfully deleted from backend')

      // Remove from table
      adjustmentHistory.value.splice(index, 1)
      totalRecords.value--
      
      // Update timestamp
      updatedAt.value = new Date().toISOString()
      
    ElMessage.success('Adjustment deleted and database quantities restored immediately!')
      
    } catch (backendError) {
      console.error('Error deleting from backend:', backendError)
      
      let errorMessage = 'Failed to delete adjustment from database'
      if (backendError.response?.data) {
        if (typeof backendError.response.data === 'string') {
          errorMessage += ': ' + backendError.response.data
        } else if (backendError.response.data.error) {
          errorMessage += ': ' + backendError.response.data.error
        } else if (backendError.response.data.detail) {
          errorMessage += ': ' + backendError.response.data.detail
        }
      }
      
      ElMessage.error(errorMessage)
    } finally {
      processing.value = false
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting adjustment:', error)
      ElMessage.error('Failed to delete adjustment')
    }
  }
}

// Function to delete the entire adjustment and all its items
const deleteEntireAdjustment = async () => {
  if (!currentAdjustmentId.value) {
    ElMessage.error('No adjustment to delete')
    return
  }

  try {
    processing.value = true
    
    // Call the backend API to delete adjustment with all items ordered by creation time
    ElMessage.info('Deleting adjustment items and reversing quantities...')
    
    await drugAdjustmentsAPI.deleteAdjustmentWithItems(currentAdjustmentId.value)
    
      ElMessage.success(`Adjustment #${adjustmentNumber.value} has been completely deleted!`)
      
      // Emit event to parent to handle tab closure
      emit('adjustment-deleted', {
        tabId: props.tabId,
        adjustmentNumber: adjustmentNumber.value
      })
      
    // Reset the component state
      currentAdjustmentId.value = null
      adjustmentStatus.value = 'draft'
      adjustmentHistory.value = []
      totalRecords.value = 0
      createdAt.value = new Date().toISOString()
      updatedAt.value = new Date().toISOString()
      
      // Reset form
      resetForm()
      
    // Navigate to the last available adjustment
    await navigateToLastAvailableAdjustment()
    
  } catch (error) {
      console.error('Error deleting entire adjustment:', error)
    ElMessage.error('Failed to delete adjustment: ' + (error.response?.data?.error || error.message))
  } finally {
    processing.value = false
  }
}

const resetForm = () => {
  Object.assign(adjustmentForm, {
    selectedDrug: null,
    selectedBatch: null,
    selectedLocationQuantity: null,
    quantity: 1,
    action: '',
    newLocation: '',
    reason: ''
  })
  selectedDrugInfo.value = null
  selectedBatchInfo.value = null
  selectedLocationQuantityInfo.value = null
  searchResults.value = []
  availableBatches.value = []
  batchLocations.value = []
  
  // Reset progressive search state
  searchStep.value = 1
  currentSearchValue.value = null
  selectionPath.value = []
  
  // Reset action field state
  actionStep.value = 1
  currentActionValue.value = null
  selectedLocationName.value = ''
  
  // Reset barcode input field
  barcodeInput.value = ''
  isProcessingBarcode.value = false
  
  // Focus back to barcode field for continuous workflow
  setTimeout(() => {
    focusBarcodeField()
  }, 100)
}

// Function to navigate to the last available adjustment
const navigateToLastAvailableAdjustment = async () => {
  try {
    // Get all adjustments ordered by adjustment_number descending to find the highest number
    const response = await drugAdjustmentsAPI.getAdjustments({ 
      ordering: '-adjustment_number',
      page_size: 1
    })
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const lastAdjustment = response.data.results[0]
      const lastAdjustmentNumber = lastAdjustment.adjustment_number
      
      // Navigate to this adjustment
      adjustmentNumber.value = lastAdjustmentNumber
      await loadAdjustmentByNumber(lastAdjustmentNumber)
      lastValidAdjustmentNumber.value = lastAdjustmentNumber
      
      ElMessage.success(`Navigated to the last available adjustment #${lastAdjustmentNumber}`)
    } else {
      // No adjustments exist - clear the interface instead of creating new
      currentAdjustmentId.value = null
      adjustmentNumber.value = 1
      adjustmentStatus.value = 'draft'
      adjustmentHistory.value = []
      totalRecords.value = 0
      lastValidAdjustmentNumber.value = 1
      
      // Reset form
      resetForm()
      
      ElMessage.info('No adjustments available. Interface cleared.')
    }
  } catch (error) {
    console.error('Error navigating to last available adjustment:', error)
    ElMessage.error('Failed to navigate to last adjustment: ' + (error.response?.data?.error || error.message))
  }
}

const refreshHistory = async () => {
  historyLoading.value = true
  try {
    // Simulate API call to fetch adjustment history
    await new Promise(resolve => setTimeout(resolve, 500))
    // In real implementation, fetch from API
  } catch (error) {
    console.error('Failed to refresh history:', error)
    ElMessage.error('Failed to refresh history')
  } finally {
    historyLoading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const calculateDaysToExpire = (expiryDate) => {
  if (!expiryDate) return 'N/A'
  
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Not set'
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

const getActionTagType = (action) => {
  const types = {
    add_stock: 'success',
    change_location: 'info',
    delete_expired: 'warning',
    delete_damage: 'danger'
  }
  return types[action] || 'info'
}

const getActionLabel = (action) => {
  const labels = {
    add_stock: 'Add Stock',
    change_location: 'Change Location',
    delete_expired: 'Delete (Expired)',
    delete_damage: 'Delete (Damage)'
  }
  return labels[action] || action
}

const getQuantityClass = (action) => {
  return action === 'add_stock' ? 'quantity-positive' : 'quantity-negative'
}

const getQuantityDisplay = (quantity, action) => {
  return action === 'add_stock' ? `+${quantity}` : `-${quantity}`
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  refreshHistory()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  refreshHistory()
}

// Adjustment number navigation methods
const previousAdjustmentNumber = async () => {
  if (adjustmentNumber.value > 1) {
    const targetNumber = adjustmentNumber.value - 1
    
    // Check if this adjustment number is already open in another tab
    const navigationAllowed = await checkNavigationPermission(targetNumber)
    if (!navigationAllowed) {
      return
    }
    
    // Check if adjustment exists before changing the number
    isCheckingAdjustmentExists.value = true
    const adjustmentExists = await checkAdjustmentExists(targetNumber)
    isCheckingAdjustmentExists.value = false
    
    if (!adjustmentExists) {
      ElMessage.warning(`Adjustment #${targetNumber} does not exist`)
      return
    }
    
    // Only change the number if adjustment exists and can be loaded
    adjustmentNumber.value = targetNumber
    const loadSuccess = await loadAdjustmentByNumber(targetNumber)
    if (loadSuccess) {
    lastValidAdjustmentNumber.value = targetNumber
    } else {
      // Revert if load failed
      adjustmentNumber.value = lastValidAdjustmentNumber.value
    }
  }
}

const nextAdjustmentNumber = async () => {
  const targetNumber = adjustmentNumber.value + 1
  
  // Check if this adjustment number is already open in another tab
  const navigationAllowed = await checkNavigationPermission(targetNumber)
  if (!navigationAllowed) {
    return
  }
  
  // Check if adjustment exists before changing the number
  isCheckingAdjustmentExists.value = true
  const adjustmentExists = await checkAdjustmentExists(targetNumber)
  isCheckingAdjustmentExists.value = false
  
  if (!adjustmentExists) {
    ElMessage.warning(`Adjustment #${targetNumber} does not exist`)
    return
  }
  
  // Only change the number if adjustment exists and can be loaded
  adjustmentNumber.value = targetNumber
  const loadSuccess = await loadAdjustmentByNumber(targetNumber)
  if (loadSuccess) {
  lastValidAdjustmentNumber.value = targetNumber
  } else {
    // Revert if load failed
    adjustmentNumber.value = lastValidAdjustmentNumber.value
  }
}

const onAdjustmentNumberInput = async (value) => {
  // Don't change anything during input - wait for validation on blur
  // This prevents the number from changing in the container and tab
}

const validateAdjustmentNumber = async () => {
  const inputValue = parseInt(adjustmentNumber.value)
  
  // Reset invalid state
  isAdjustmentNumberInvalid.value = false
  
  // Validate input range
  if (isNaN(inputValue) || inputValue < 1) {
    // Revert to last valid number for invalid input
      adjustmentNumber.value = lastValidAdjustmentNumber.value
    isAdjustmentNumberInvalid.value = true
    ElMessage.warning('Adjustment number must be at least 1')
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isAdjustmentNumberInvalid.value = false
    }, 2000)
      return
    }
    
  // If the value is the same as current, no need to validate
  if (inputValue === lastValidAdjustmentNumber.value) {
    return
  }
  
    // Check if this adjustment number is already open in another tab
  const navigationAllowed = await checkNavigationPermission(inputValue)
    if (!navigationAllowed) {
      // Revert to last valid adjustment number
      adjustmentNumber.value = lastValidAdjustmentNumber.value
    isAdjustmentNumberInvalid.value = true
      await nextTick() // Ensure DOM is updated
    // Clear invalid state after a delay
    setTimeout(() => {
      isAdjustmentNumberInvalid.value = false
    }, 2000)
      return
    }
  
  // Check if adjustment exists before allowing navigation
  isCheckingAdjustmentExists.value = true
  const adjustmentExists = await checkAdjustmentExists(inputValue)
  isCheckingAdjustmentExists.value = false
  
  if (!adjustmentExists) {
    // Adjustment doesn't exist - revert to last valid number
    adjustmentNumber.value = lastValidAdjustmentNumber.value
    isAdjustmentNumberInvalid.value = true
    ElMessage.warning(`Adjustment #${inputValue} does not exist`)
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isAdjustmentNumberInvalid.value = false
    }, 2000)
    return
  }
  
  // Adjustment exists - try to load it
  const loadSuccess = await loadAdjustmentByNumber(inputValue)
  if (loadSuccess) {
    lastValidAdjustmentNumber.value = inputValue
    isAdjustmentNumberInvalid.value = false
  } else {
    // Load failed for some reason - revert
    adjustmentNumber.value = lastValidAdjustmentNumber.value
    isAdjustmentNumberInvalid.value = true
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isAdjustmentNumberInvalid.value = false
    }, 2000)
  }
}

// Function to check navigation permission from parent
const checkNavigationPermission = (targetAdjustmentNumber) => {
  return new Promise((resolve) => {
    // Emit navigation attempt to parent
    emit('navigation-attempt', {
      tabId: props.tabId,
      targetAdjustmentNumber,
      currentAdjustmentNumber: adjustmentNumber.value,
      callback: resolve
    })
  })
}

// Function to check if an adjustment number exists without loading it
const checkAdjustmentExists = async (adjustmentNum) => {
  try {
    // Search for adjustment with this number across all statuses
    const allAdjustments = []
    
    // Get adjustments from all statuses
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
    
    // Check if adjustment with the specified number exists
    return allAdjustments.some(adj => adj.adjustment_number === adjustmentNum)
  } catch (error) {
    console.error('Error checking adjustment existence:', error)
    return false
  }
}

const loadAdjustmentByNumber = async (adjustmentNum) => {
  try {
    historyLoading.value = true
    isValidatingAdjustmentNumber.value = true
    
    // Search for adjustment with this number across all statuses
    const allAdjustments = []
    
    // Get adjustments from all statuses
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
    
    // Find adjustment with the specified number
    const targetAdjustment = allAdjustments.find(adj => adj.adjustment_number === adjustmentNum)
    
    if (targetAdjustment) {
      // Load existing adjustment
      currentAdjustmentId.value = targetAdjustment.id
      adjustmentStatus.value = targetAdjustment.status
      createdAt.value = targetAdjustment.created_at
      updatedAt.value = targetAdjustment.updated_at
      
      // Load adjustment items
      await loadAdjustmentItems(targetAdjustment.id)
      
      // Clear form and reset editing state when switching adjustments
      resetForm()
      resetToStep(1)
      resetActionToStep(1)
      isEditing.value = false
      editingAdjustmentIndex.value = -1
      originalAdjustment.value = null
      
      return true // Success
    } else {
      // No adjustment found with this number
      return false // Failed - adjustment doesn't exist
    }
    
  } catch (error) {
    console.error('Error loading adjustment:', error)
    ElMessage.error('Failed to load adjustment data')
    
    // Clear data on error
    currentAdjustmentId.value = null
    adjustmentStatus.value = 'draft'
    adjustmentHistory.value = []
    totalRecords.value = 0
    
    return false // Failed due to error
    
  } finally {
    historyLoading.value = false
    isValidatingAdjustmentNumber.value = false
  }
}

const loadAdjustmentItems = async (adjustmentId) => {
  try {
    const response = await drugAdjustmentItemsAPI.getItemsByAdjustment(adjustmentId)
    const items = response.data.results || []
    
    // Ensure we always have an array, even if the response is malformed
    if (!Array.isArray(items)) {
      adjustmentHistory.value = []
      totalRecords.value = 0
      return
    }
    
    // Convert backend items to local format
    adjustmentHistory.value = items.map(item => ({
      id: item.id,
      date: item.created_at,
      drug_name: item.drug_name || 'Unknown Drug',
      english_name: item.drug_english_name,
      persian_name: item.drug_name,
      batch_number: item.batch_number || 'Unknown Batch',
      action: item.action,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      location: item.target_location_name || item.source_location_name || 'N/A',
      reason: item.reason || 'No reason provided',
      user: item.user_name || 'Unknown User',
      // Additional info for tracking
      drug_id: item.drug,
      batch_id: item.batch,
      location_id: item.source_location,
      original_location: item.source_location_name,
      // Backend fields
      backend_id: item.id,
      applied: item.applied !== undefined ? item.applied : true // Default to true for existing items
    }))
    
    totalRecords.value = adjustmentHistory.value.length
    
  } catch (error) {
    console.error('Error loading adjustment items:', error)
    adjustmentHistory.value = []
    totalRecords.value = 0
  }
}

const createNewAdjustment = async () => {
  try {
    // Check if current adjustment has items and is still in draft status
    if (adjustmentHistory.value.length > 0 && adjustmentStatus.value === 'draft') {
      // Only ask to finalize if the adjustment is still in draft status
      try {
        await ElMessageBox.confirm(
          `You have ${adjustmentHistory.value.length} adjustment items in the current session (Adjustment #${adjustmentNumber.value}). Do you want to finalize this adjustment before creating a new one?`,
          'Finalize Current Adjustment',
          {
            confirmButtonText: 'Yes, Finalize & Continue',
            cancelButtonText: 'No, Discard & Continue',
            distinguishCancelAndClose: true,
            type: 'warning',
          }
        )
        
        // User chose to finalize - finalize current adjustment
        if (currentAdjustmentId.value) {
          try {
            await drugAdjustmentsAPI.finalizeAdjustment(currentAdjustmentId.value)
            ElMessage.success(`Adjustment #${adjustmentNumber.value} has been finalized with ${adjustmentHistory.value.length} items.`)
          } catch (finalizeError) {
            console.error('Error finalizing adjustment:', finalizeError)
            ElMessage.error('Failed to finalize current adjustment')
            return
          }
        }
        
      } catch (finalizeError) {
        if (finalizeError === 'cancel') {
          // User chose "No, Discard & Continue" - proceed without confirmation
            ElMessage.warning(`Adjustment #${adjustmentNumber.value} has been discarded.`)
        } else {
          // User closed the dialog - cancel the entire operation
          return
        }
      }
    } else if (adjustmentHistory.value.length > 0 && adjustmentStatus.value !== 'draft') {
      // Current adjustment is already finalized/cancelled, just inform user and proceed
      ElMessage.info(`Current adjustment #${adjustmentNumber.value} is already ${drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus.value)}. Creating new adjustment...`)
    }

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
    
    // Find the first available number starting from 1
    let nextAdjustmentNumber = 1
    while (existingNumbers.has(nextAdjustmentNumber)) {
      nextAdjustmentNumber++
      // Safety check to prevent infinite loop (reasonable limit)
      if (nextAdjustmentNumber > 999999) {
        throw new Error('No available adjustment numbers (reached maximum 999999)')
      }
    }
    
    // Create new adjustment in backend
    const newAdjustmentData = {
      adjustment_number: nextAdjustmentNumber,
      status: 'draft'
    }
    
    const response = await drugAdjustmentsAPI.createAdjustment(newAdjustmentData)
    const newAdjustment = response.data
    
    // Update local state
    currentAdjustmentId.value = newAdjustment.id
    adjustmentNumber.value = nextAdjustmentNumber
    adjustmentStatus.value = 'draft'
    
    // Clear current adjustment data
    adjustmentHistory.value = []
    totalRecords.value = 0
    
    // Reset form and progressive search states
    resetForm()
    resetToStep(1)
    resetActionToStep(1)
    
    // Reset timestamps
    createdAt.value = newAdjustment.created_at
    updatedAt.value = newAdjustment.updated_at
    showCreated.value = true
    
    // Reset editing state
    isEditing.value = false
    editingAdjustmentIndex.value = -1
    originalAdjustment.value = null
    
    ElMessage.success(`New adjustment #${nextAdjustmentNumber} created successfully! Ready to add new items.`)
    
    // Focus on barcode input for immediate use
    setTimeout(() => {
      focusBarcodeField()
    }, 300)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error creating new adjustment:', error)
      ElMessage.error('Failed to create new adjustment: ' + (error.response?.data?.error || error.message))
    }
  }
}

const toggleTimestamp = () => {
  showCreated.value = !showCreated.value
}

// Progressive search helper methods
const getSearchFieldLabel = () => {
  switch (searchStep.value) {
    case 1: return '▌▌▌Search Drug'
    case 2: return 'Select Batch'
    case 3: return 'Select Location'
    default: return '▌▌▌Search'
  }
}

const getSearchFieldPlaceholder = () => {
  switch (searchStep.value) {
    case 1: return 'Search drug or GTIN'
    case 2: return 'Choose batch for selected drug'
    case 3: return 'Choose location for selected batch'
    default: return 'Search...'
  }
}

const getDropdownClass = () => {
  switch (searchStep.value) {
    case 2: return 'batch-dropdown-with-quantity'
    case 3: return 'location-dropdown-with-quantity'
    default: return ''
  }
}

// Quantity projection functions for draft adjustments
const getProjectedQuantity = (location, excludeEditingItem = false) => {
  if (!location) return 0
  
  const originalQuantity = location.quantity || 0
  const pendingAdjustments = getPendingAdjustmentsForLocation(location, excludeEditingItem)
  const incomingAdjustments = getIncomingAdjustmentsForLocation(location, excludeEditingItem)
  
  let projectedQuantity = originalQuantity
  
  // Apply outgoing adjustments (from this location)
  pendingAdjustments.forEach(adjustment => {
    switch (adjustment.action) {
      case 'add_stock':
        projectedQuantity += adjustment.quantity
        break
      case 'delete_expired':
      case 'delete_damage':
        projectedQuantity -= adjustment.quantity
        break
      case 'change_location':
        // If this location is the source, subtract the quantity
        projectedQuantity -= adjustment.quantity
        break
    }
  })
  
  // Apply incoming adjustments (to this location from change_location actions)
  incomingAdjustments.forEach(adjustment => {
    if (adjustment.action === 'change_location') {
      projectedQuantity += adjustment.quantity
    }
  })
  
  return Math.max(0, projectedQuantity) // Ensure non-negative
}

const getPendingAdjustmentsForLocation = (location, excludeEditingItem = false) => {
  if (!location || !selectedBatchInfo.value) return []
  
  // Since adjustments are now applied immediately, we don't need to consider them for projection
  // The actual quantities in the database already reflect all applied adjustments
  // Only return adjustments that are truly pending (not yet applied)
  return adjustmentHistory.value.filter((adjustment, index) => {
    // Exclude the item being edited if in editing mode
    if (excludeEditingItem && isEditing.value && index === editingAdjustmentIndex.value) {
      return false
    }
    
    return adjustment.batch_id === selectedBatchInfo.value.id &&
           adjustment.location_id === location.id &&
           !adjustment.applied // Only count unapplied adjustments (should be none with real-time updates)
  })
}

const getIncomingAdjustmentsForLocation = (location, excludeEditingItem = false) => {
  if (!location || !selectedBatchInfo.value) return []
  
  // Since adjustments are now applied immediately, incoming adjustments are already reflected in quantities
  // Only return adjustments that are truly pending (not yet applied)
  return adjustmentHistory.value.filter((adjustment, index) => {
    // Exclude the item being edited if in editing mode
    if (excludeEditingItem && isEditing.value && index === editingAdjustmentIndex.value) {
      return false
    }
    
    return adjustment.batch_id === selectedBatchInfo.value.id &&
           adjustment.action === 'change_location' &&
           adjustment.location === location.storage_name && // Target location name matches
           !adjustment.applied // Only count unapplied adjustments (should be none with real-time updates)
  })
}

const getProjectedQuantityDisplay = (location) => {
  if (!location) return '0'
  
  const originalQuantity = location.quantity || 0
  // In editing mode, exclude the item being edited to show accurate available quantity
  const projectedQuantity = getProjectedQuantity(location, isEditing.value)
  
  if (originalQuantity === projectedQuantity) {
    return `${projectedQuantity}`
  } else {
    const change = projectedQuantity - originalQuantity
    const changeText = change > 0 ? `+${change}` : `${change}`
    return `${projectedQuantity} (${originalQuantity}${changeText})`
  }
}

const getPendingAdjustmentsInfo = (location) => {
  if (!location) return ''
  
  // In editing mode, exclude the item being edited from pending count
  const pending = getPendingAdjustmentsForLocation(location, isEditing.value)
  const incoming = getIncomingAdjustmentsForLocation(location, isEditing.value)
  const totalPending = pending.length + incoming.length
  
  if (totalPending === 0) return ''
  
  return ` (${totalPending} pending adjustment${totalPending > 1 ? 's' : ''})`
}

const getStockInfo = () => {
  switch (searchStep.value) {
    case 1: 
      return selectedDrugInfo.value ? `Total Stock: ${selectedDrugInfo.value.total_quantity || 0} (Real-time)` : null
    case 2: 
      return selectedBatchInfo.value ? `Batch Stock: ${selectedBatchInfo.value.quantity || 0} (Real-time)` : null
    case 3: 
      return selectedLocationQuantityInfo.value ? 
        `Available: ${selectedLocationQuantityInfo.value.quantity || 0} at ${selectedLocationQuantityInfo.value.storage_name} (Real-time)` : null
    default: return null
  }
}

// Action field helper methods
const getActionFieldLabel = () => {
  switch (actionStep.value) {
    case 1: return 'Action'
    case 2: return 'New Location'
    default: return 'Action'
  }
}

const getActionFieldPlaceholder = () => {
  switch (actionStep.value) {
    case 1: return 'Select action'
    case 2: {
      const sourceLocation = selectedLocationQuantityInfo.value?.storage_name
      return sourceLocation 
        ? `Choose target location (excluding ${sourceLocation})`
        : 'Choose new storage location'
    }
    default: return 'Select action'
  }
}

const getAvailableTargetLocations = () => {
  // For change_location action, exclude the source location from available targets
  if (adjustmentForm.action === 'change_location' && selectedLocationQuantityInfo.value) {
    const sourceLocationName = selectedLocationQuantityInfo.value.storage_name
    return storageLocations.value.filter(location => location.name !== sourceLocationName)
  }
  
  // For other actions or when no source location is selected, return all locations
  return storageLocations.value
}

const handleSearch = (query) => {
  switch (searchStep.value) {
    case 1: return searchDrugs(query)
    case 2: return // Batches are already loaded, no search needed
    case 3: return // Locations are already loaded, no search needed
  }
}

// GTIN handling functions (from MedicineDetailsForm.vue)
let searchTimeout = null

const handleGtinInput = () => {
  // Only handle GTIN input in step 1 (drug search)
  if (searchStep.value !== 1) return
  
  const inputValue = currentSearchValue.value?.toString() || ''
  
  // Check for non-English characters
  if (!isEnglishOnly(inputValue)) {
    showKeyboardAlert()
    return
  }

  // Clear previous state
  searchResults.value = []

  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Set new timeout for debounced search
  searchTimeout = setTimeout(() => {
    const gtinCode = inputValue.trim()
    if (gtinCode && gtinCode.length >= 10) {
      // Only search if we have a reasonable length
      searchByGtin()
    } else if (gtinCode.length > 0) {
      // For shorter inputs, use regular search
      searchDrugs(gtinCode)
    }
  }, 800) // 800ms delay after user stops typing
}

const handleGtinPaste = () => {
  // Only handle paste in step 1 (drug search)
  if (searchStep.value !== 1) return
  
  // Handle paste event - check for non-English characters first
  setTimeout(() => {
    const inputValue = currentSearchValue.value?.toString() || ''
    if (!isEnglishOnly(inputValue)) {
      showKeyboardAlert()
      return
    }

    const gtinCode = inputValue.trim()
    if (gtinCode && gtinCode.length >= 10) {
      searchByGtin()
    }
  }, 100) // Short delay to ensure paste content is processed
}

const searchByGtin = async () => {
  // Only search by GTIN in step 1 (drug search)
  if (searchStep.value !== 1) return
  
  const gtinCode = currentSearchValue.value?.toString()?.trim()
  if (!gtinCode) return

  searchLoading.value = true

  try {
    // Ensure pharmacy drugs are loaded
    if (drugStore.drugs.length === 0) {
      await drugStore.fetchDrugs()
    }
    
    // Search for exact GTIN match first
    const exactMatch = drugStore.drugs.find(drug => 
      drug.gtin_code && drug.gtin_code.toLowerCase() === gtinCode.toLowerCase()
    )
    
    if (exactMatch) {
      // Found exact GTIN match
      searchResults.value = [exactMatch]
      ElMessage.success(`Drug found by GTIN: ${exactMatch.english_name || exactMatch.persian_name}`)
    } else {
      // No exact GTIN match, fall back to regular search
      await searchDrugs(gtinCode)
      if (searchResults.value.length === 0) {
        ElMessage.warning('No drug found with this GTIN code')
      }
    }
  } catch (error) {
    console.error('Error searching by GTIN:', error)
    ElMessage.error('Error searching for drug by GTIN')
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// Function to check if text contains only English characters and numbers
const isEnglishOnly = (text) => {
  if (!text) return true
  // Allow only English letters (a-z, A-Z), numbers (0-9), and common symbols
  const englishOnlyRegex = /^[a-zA-Z0-9\s\-_.,;:!@#$%^&*()+=\[\]{}|\\<>?/~`'"]*$/
  return englishOnlyRegex.test(text)
}

// Function to show keyboard alert
const showKeyboardAlert = () => {
  ElMessage({
    type: 'warning',
    message: 'لطفا کیبورد را به حالت انگلیسی تغییر دهید',
    duration: 4000,
    showClose: true,
  })

  // Clear the input to prevent format issues
  currentSearchValue.value = null
}

// Barcode processing functions
const handleBarcodePaste = async (event) => {
  // Only process barcode in step 1 (drug search)
  if (searchStep.value !== 1 || isProcessingBarcode.value) return
  
  // Get pasted text
  const pastedText = (event.clipboardData || window.clipboardData).getData('text')
  
  console.log('Pasted text:', pastedText, 'Length:', pastedText?.length)
  
  if (pastedText && pastedText.length >= 49) {
    event.preventDefault()
    isProcessingBarcode.value = true
    
    try {
      // Extract GTIN (characters 3-16, so index 2-15)
      const gtinCode = pastedText.substring(2, 16)
      
      // Extract batch number (characters 49 to end, so index 48 onwards)
      const batchNumber = pastedText.substring(48).trim()
      
      console.log('Extracted from barcode:', { gtinCode, batchNumber, fullBarcode: pastedText })
      
      ElMessage.info(`Processing barcode: GTIN ${gtinCode}, Batch ${batchNumber}`)
      
      // Clear the input
      barcodeInput.value = ''
      
      // Step 1: Search and select drug by GTIN
      await processBarcodeStep1(gtinCode, batchNumber)
      
    } catch (error) {
      console.error('Error processing barcode:', error)
      ElMessage.error('Error processing barcode')
    } finally {
      isProcessingBarcode.value = false
    }
  }
  // If not a valid barcode, let the normal input handling process it
}

const handleBarcodeInput = (value) => {
  // Handle regular typing in barcode field
  if (value && value.length >= 10) {
    // Debounce the search
    setTimeout(() => {
      if (barcodeInput.value === value) {
        searchDrugs(value)
      }
    }, 500)
  }
}

const processBarcodeManually = () => {
  // Handle Enter key press
  const value = barcodeInput.value?.trim()
  if (!value) return
  
  if (value.length >= 49) {
    // Try to process as barcode
    const gtinCode = value.substring(2, 16)
    const batchNumber = value.substring(48).trim()
    
    console.log('Manual processing:', { gtinCode, batchNumber })
    ElMessage.info(`Processing: GTIN ${gtinCode}, Batch ${batchNumber}`)
    
    processBarcodeStep1(gtinCode, batchNumber)
  } else {
    // Search as regular query
    searchDrugs(value)
  }
}

const processBarcodeStep1 = async (gtinCode, batchNumber) => {
  try {
    // Ensure pharmacy drugs are loaded
    if (drugStore.drugs.length === 0) {
      await drugStore.fetchDrugs()
    }
    
    // Search for exact GTIN match
    const exactMatch = drugStore.drugs.find(drug => 
      drug.gtin_code && drug.gtin_code === gtinCode
    )
    
    if (exactMatch) {
      // Found drug, select it
      searchResults.value = [exactMatch]
      
      // Auto-select the drug (step 1)
      await onDrugSelectProgressive(exactMatch.id)
      
      ElMessage.success(`Drug found: ${exactMatch.english_name || exactMatch.persian_name}`)
      
      // Wait a bit then proceed to step 2 (batch selection)
      setTimeout(async () => {
        await processBarcodeStep2(batchNumber)
      }, 500)
      
    } else {
      ElMessage.warning(`No drug found with GTIN: ${gtinCode}`)
    }
    
  } catch (error) {
    console.error('Error in barcode step 1:', error)
    ElMessage.error('Error searching for drug by GTIN')
  }
}

const processBarcodeStep2 = async (batchNumber) => {
  try {
    // Wait for batches to be loaded
    let attempts = 0
    while (availableBatches.value.length === 0 && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      attempts++
    }
    
    if (availableBatches.value.length === 0) {
      ElMessage.warning('No batches available for this drug')
      return
    }
    
    // Search for exact batch match
    const exactBatch = availableBatches.value.find(batch => 
      batch.batch_number === batchNumber
    )
    
    if (exactBatch) {
      // Auto-select the batch (step 2)
      await onBatchSelectProgressive(exactBatch.id)
      
      ElMessage.success(`Batch found and selected: ${batchNumber}`)
      
      // Wait for step 3 to be ready, then auto-open location dropdown
      setTimeout(async () => {
        await autoOpenLocationDropdown()
      }, 700)
      
    } else {
      // Show available batches if exact match not found
      ElMessage.warning(`Batch ${batchNumber} not found. Available batches: ${availableBatches.value.map(b => b.batch_number).join(', ')}`)
      
      // Still open the batch dropdown for manual selection
      setTimeout(async () => {
        if (searchStep.value === 2 && selectRef.value) {
          selectRef.value.focus()
        }
      }, 300)
    }
    
  } catch (error) {
    console.error('Error in barcode step 2:', error)
    ElMessage.error('Error selecting batch')
  }
}

const autoOpenLocationDropdown = async () => {
  try {
    // Ensure we're in step 3 and have locations available
    if (searchStep.value !== 3) {
      console.log('Not in step 3, current step:', searchStep.value)
      return
    }
    
    // Wait for locations to be loaded
    let attempts = 0
    while (batchLocations.value.length === 0 && attempts < 10) {
      console.log(`Waiting for locations, attempt ${attempts + 1}`)
      await new Promise(resolve => setTimeout(resolve, 200))
      attempts++
    }
    
    if (batchLocations.value.length === 0) {
      ElMessage.warning('No locations available for this batch')
      return
    }
    
    console.log('Auto-opening location dropdown, locations available:', batchLocations.value.length)
    
    // Auto-focus and open the location dropdown
    await nextTick()
    if (selectRef.value) {
      selectRef.value.focus()
      
      // Try to trigger dropdown opening
      setTimeout(() => {
        if (selectRef.value && selectRef.value.toggleMenu) {
          selectRef.value.toggleMenu()
        }
      }, 200)
    }
    
  } catch (error) {
    console.error('Error opening location dropdown:', error)
  }
}



const onSearchSelect = async (value) => {
  // Handle clearing/null values
  if (!value) {
    handleSearchClear()
    return
  }

  // Prevent selecting another location if one is already selected
  if (searchStep.value === 3 && selectedLocationQuantityInfo.value) {
    ElMessage.warning('Location already selected. Please clear the current selection first using the close button on the breadcrumb.')
    // Reset the select value to prevent change
    currentSearchValue.value = selectedLocationQuantityInfo.value.id
    return
  }

  switch (searchStep.value) {
    case 1: await onDrugSelectProgressive(value); break
    case 2: await onBatchSelectProgressive(value); break
    case 3: await onLocationSelectProgressive(value); break
  }
}

const handleSearchClear = () => {
  // Reset to step 1 and clear all selections
  resetToStep(1)
  
  // Clear the current search value
  currentSearchValue.value = null
  
  // Clear search results
  searchResults.value = []
}

const goBackToStep = (step) => {
  // Allow users to go back to previous steps by clicking on breadcrumb tags
  if (step <= searchStep.value) {
    resetToStep(step)
    
    // If going back to step 1, also clear the search field
    if (step === 1) {
      currentSearchValue.value = null
      searchResults.value = []
    }
  }
}

const onActionSelect = async (value) => {
  if (!value) {
    resetActionToStep(1)
    return
  }

  switch (actionStep.value) {
    case 1: await onActionSelectStep1(value); break
    case 2: await onLocationSelectStep2(value); break
  }
}



const onActionSelectStep1 = async (actionValue) => {
  // Set the action in the form
  adjustmentForm.action = actionValue
  
  if (actionValue === 'change_location') {
    // Move to step 2 (location selection)
    actionStep.value = 2
    currentActionValue.value = null
    
    // Auto-focus the dropdown for location selection using the exact same approach as drug search
    // If we have storage locations available, auto-focus the dropdown
    if (storageLocations.value.length > 0) {
      await nextTick()
      setTimeout(() => {
        if (actionSelectRef.value) {
          actionSelectRef.value.focus()
        }
      }, 200)
    }
  } else {
    // For other actions, we're done - show the action tag
    actionStep.value = 1
    currentActionValue.value = actionValue
    adjustmentForm.newLocation = ''
    selectedLocationName.value = ''
  }
  
  // Call original action change logic
  onActionChange()
}

const onLocationSelectStep2 = async (locationId) => {
  // Find the selected location
  const location = storageLocations.value.find(l => l.id === locationId)
  
  // Check if trying to select the same location as source
  if (selectedLocationQuantityInfo.value && location) {
    const sourceLocationName = selectedLocationQuantityInfo.value.storage_name
    if (location.name === sourceLocationName) {
      ElMessage.warning(`Cannot move items to the same location (${sourceLocationName}). Please select a different target location.`)
      // Reset the dropdown to allow re-selection
      currentActionValue.value = null
      return
    }
  }
  
  // Set the location in the form
  adjustmentForm.newLocation = locationId
  
  // Set the location name for display
  selectedLocationName.value = location ? location.name : ''
  
  // Reset to show the selected location
  actionStep.value = 1
  currentActionValue.value = 'change_location'
}

const resetActionToStep = (step) => {
  actionStep.value = step
  currentActionValue.value = null
  
  if (step === 1) {
    adjustmentForm.action = ''
    adjustmentForm.newLocation = ''
    selectedLocationName.value = ''
  }
}

const clearLocationSelection = () => {
  // Clear the location selection
  adjustmentForm.newLocation = ''
  selectedLocationName.value = ''
  
  // Reset action field back to step 1 (action selection)
  resetActionToStep(1)
}

const clearActionSelection = () => {
  // Clear the entire action selection (both action and location if any)
  adjustmentForm.action = ''
  adjustmentForm.newLocation = ''
  selectedLocationName.value = ''
  
  // Reset action field back to step 1 (action selection)
  resetActionToStep(1)
}

const triggerDropdownOpen = () => {
  if (selectRef.value) {
    // Focus the select element
    selectRef.value.focus()
    
    // Use a small delay to ensure the component is ready
    setTimeout(() => {
      // Try different methods to open the dropdown
      if (selectRef.value.toggleMenu) {
        selectRef.value.toggleMenu()
      } else if (selectRef.value.handleMenuEnter) {
        selectRef.value.handleMenuEnter()
      } else {
        // Fallback: simulate click on the select
        const selectElement = selectRef.value.$el
        if (selectElement) {
          selectElement.click()
        }
      }
    }, 100)
  }
}



const handleDrugEdit = () => {
  // Open the AddMedicineDialog in add mode
  selectedDrugId.value = null
  editDialogVisible.value = true
  ElMessage.info('Opening Add Medicine dialog...')
}

const handleDrugUpdated = (drug) => {
  // Don't close the dialog - keep it open for continuous adding
  // editDialogVisible.value = false
  ElMessage.success('Drug saved successfully! You can continue adding more medicines.')
  
  // Refresh the drugs list to include the new/updated drug
  drugStore.fetchDrugs()
}

const handleDrugDeleted = (drugId) => {
  editDialogVisible.value = false
  ElMessage.success('Drug deleted successfully!')
  
  // Refresh the drugs list to remove the deleted drug
  drugStore.fetchDrugs()
}

const handlePrintCommand = (command) => {
  if (adjustmentHistory.value.length === 0) {
    ElMessage.warning('No adjustments to print')
    return
  }

  if (command === 'a4') {
    printA4Format()
  } else if (command === 'roll') {
    printRollFormat()
  }
}

const printA4Format = () => {
  const printWindow = window.open('', '_blank')
  const adjustmentNum = adjustmentNumber.value
  const created = formatTimestamp(createdAt.value)
  const updated = formatTimestamp(updatedAt.value)
  const status = drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus.value)
  const statusColor = getStatusColor(adjustmentStatus.value)
  
  let tableRows = ''
  adjustmentHistory.value.forEach((item, index) => {
    tableRows += `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.drug_name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.batch_number}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.original_location || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${getActionLabel(item.action)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${getQuantityDisplay(item.quantity, item.action)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatPrice(item.unit_price || 0)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;" class="${getPriceClass(item.action)}">${getPriceDisplay(item.unit_price || 0, item.quantity, item.action)}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.location || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.reason}</td>
      </tr>
    `
  })

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Drug Adjustments - A4 Format</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .pharmacy-info { text-align: center; margin-bottom: 15px; }
        .pharmacy-name { font-size: 18px; font-weight: bold; color: #333; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .info-item { font-size: 14px; }

        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #f5f5f5; padding: 10px; border: 1px solid #ddd; font-weight: bold; }
        td { padding: 8px; border: 1px solid #ddd; }
        .quantity-positive { color: #67c23a; font-weight: bold; }
        .quantity-negative { color: #f56c6c; font-weight: bold; }
        .price-positive { color: #67c23a; font-weight: bold; }
        .price-negative { color: #f56c6c; font-weight: bold; }
        .price-neutral { color: #666; font-weight: bold; }
        .summary-section { margin-top: 30px; background-color: #f9f9f9; padding: 20px; border-radius: 8px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .summary-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 15px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="pharmacy-info">
        <div class="pharmacy-name">${pharmacyName.value}</div>
      </div>
      
      <div class="header">
        <h1>Drug Adjustments Report</h1>
        <h2>Adjustment #${adjustmentNum}</h2>
        <div class="status-badge" style="background-color: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-top: 10px;">
          Status: ${status}
        </div>
      </div>
      
      <div class="info-row">
        <div class="info-item"><strong>Created:</strong> ${created}<br><strong>Created by:</strong> ${currentUser.value}</div>
        <div class="info-item"><strong>Last Updated:</strong> ${updated}<br><strong>Pharmacy:</strong> ${pharmacyName.value}</div>
        <div class="info-item"><strong>Total Records:</strong> ${adjustmentHistory.value.length}<br><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Drug Name</th>
            <th>Batch Number</th>
            <th>Source Location</th>
            <th>Action</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total Price</th>
            <th>Target Location</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="summary-section">
        <h3>Summary</h3>
        <div class="summary-row">
          <span>Total Items:</span>
          <span>${adjustmentHistory.value.length}</span>
        </div>
        <div class="summary-row">
          <span>Added Stock:</span>
          <span class="price-positive">+${formatPrice(addedStockSummary.value.totalPrice)} (${addedStockSummary.value.count} items)</span>
        </div>
        <div class="summary-row">
          <span>Deleted Stock:</span>
          <span class="price-negative">-${formatPrice(Math.abs(deletedStockSummary.value.totalPrice))} (${deletedStockSummary.value.count} items)</span>
        </div>
        <div class="summary-row">
          <span>Location Changes:</span>
          <span class="price-neutral">${locationChangeSummary.value.count} items (No price impact)</span>
        </div>
        <div class="summary-total">
          <div class="summary-row">
            <span>Net Price Impact:</span>
            <span class="${netPriceImpact.value >= 0 ? 'price-positive' : 'price-negative'}">${netPriceImpact.value >= 0 ? '+' : ''}${formatPrice(netPriceImpact.value)}</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  
  ElMessage.success('A4 format print dialog opened')
}

const printRollFormat = () => {
  const printWindow = window.open('', '_blank')
  const adjustmentNum = adjustmentNumber.value
  const timestamp = formatTimestamp(new Date().toISOString())
  const status = drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus.value)
  
  const rollWidth = 32
  const wrapText = (text, maxWidth) => {
    if (!text || text.length <= maxWidth) return text
    const words = text.split(' ')
    let lines = []
    let currentLine = ''
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word.length <= maxWidth ? word : word.substring(0, maxWidth - 3) + '...'
      }
    })
    if (currentLine) lines.push(currentLine)
    return lines.join('\n   ')
  }
  
  let receiptContent = ''
  adjustmentHistory.value.forEach((item, index) => {
    const locationInfo = item.action === 'change_location' && item.location !== 'N/A' ? `\n→ ${wrapText(item.location, rollWidth - 2)}` : ''
    const unitPriceInfo = formatPrice(item.unit_price || 0)
    const totalPriceInfo = getPriceDisplay(item.unit_price || 0, item.quantity, item.action)
    const wrappedDrugName = wrapText(item.drug_name, rollWidth - 3)
    const wrappedBatch = wrapText(item.batch_number, rollWidth - 8)
    const wrappedSource = wrapText(item.original_location || 'N/A', rollWidth - 9)
    const wrappedAction = wrapText(getActionLabel(item.action), rollWidth - 9)
    
    receiptContent += `
${index + 1}. <strong>${wrappedDrugName}</strong>
   <strong>Batch:</strong> ${wrappedBatch}
   <strong>Source:</strong> ${wrappedSource}
   <strong>Action:</strong> ${wrappedAction}${locationInfo}
   <strong>Qty:</strong> ${getQuantityDisplay(item.quantity, item.action)}
   <strong>Unit:</strong> ${unitPriceInfo}
   <strong>Total:</strong> ${totalPriceInfo}
${'='.repeat(rollWidth)}
`
  })

  const priceSummary = `
<strong>SUMMARY</strong>
${'='.repeat(32)}
Status: ${status}
Total Items: ${adjustmentHistory.value.length}
Added Stock: +${formatPrice(addedStockSummary.value.totalPrice)} (${addedStockSummary.value.count})
Deleted Stock: -${formatPrice(Math.abs(deletedStockSummary.value.totalPrice))} (${deletedStockSummary.value.count})
Location Changes: ${locationChangeSummary.value.count} items
${'='.repeat(32)}
<strong>Net Impact: ${netPriceImpact.value >= 0 ? '+' : ''}${formatPrice(netPriceImpact.value)}</strong>
${'='.repeat(32)}
`

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Drug Adjustments - Roll Format</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 11px; 
          margin: 0; 
          padding: 8px;
          width: 280px;
          line-height: 1.2;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .pharmacy-info { text-align: center; margin-bottom: 10px; font-weight: bold; }

        .item { margin-bottom: 10px; }
        .separator { border-top: 1px dashed #000; margin: 10px 0; }
        .footer { text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
        @media print { 
          body { width: auto; }
          @page { size: 80mm auto; margin: 5mm; }
        }
      </style>
    </head>
    <body>
      <div class="pharmacy-info">
        ${wrapText(pharmacyName.value, rollWidth)}
      </div>
      
      <div class="header">
        <strong>DRUG ADJUSTMENTS</strong><br>
        Adjustment #${adjustmentNum}<br>
        Status: ${status}<br>
        ${timestamp.substring(0, 16)}<br>
        <span style="font-size: 10px;">
          By: ${wrapText(currentUser.value, rollWidth - 4)}<br>
          ${wrapText(pharmacyName.value, rollWidth)}
        </span>
      </div>
      
      <pre>${receiptContent}</pre>
      
      <pre>${priceSummary}</pre>
      
      <div class="footer">
        Total Items: ${adjustmentHistory.value.length}<br>
      </div>
    </body>
    </html>
  `
  
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  
  ElMessage.success('Roll format print dialog opened')
}



// Debug function for testing (can be called from browser console)
window.debugBatchPrices = () => {
  console.log('=== MANUAL BATCH PRICE DEBUG ===')
  console.log('Available batches:', availableBatches.value.length)
  
  // Test formatPrice function directly
  console.log('\n=== TESTING formatPrice FUNCTION ===')
  console.log('formatPrice(16000):', formatPrice(16000))
  console.log('formatPrice("16000"):', formatPrice("16000"))
  console.log('formatPrice(0):', formatPrice(0))
  console.log('formatPrice(null):', formatPrice(null))
  
  availableBatches.value.forEach((batch, index) => {
    console.log(`\nBatch ${index + 1}:`)
    console.log('  Batch object:', batch)
    console.log('  getBatchPrice result:', getBatchPrice(batch))
    console.log('  getBatchPriceValue result:', getBatchPriceValue(batch))
  })
  console.log('=== END MANUAL DEBUG ===')
}

// Debug function to check current state
window.debugCurrentState = () => {
  console.log('=== CURRENT STATE DEBUG ===')
  console.log('Search step:', searchStep.value)
  console.log('Selected drug:', selectedDrugInfo.value?.name || 'None')
  console.log('Available batches count:', availableBatches.value.length)
  console.log('Selected batch:', selectedBatchInfo.value?.batch_number || 'None')
  console.log('Current search value:', currentSearchValue.value)
  console.log('Selection path:', selectionPath.value)
  
  if (availableBatches.value.length > 0) {
    console.log('\nBatch details:')
    availableBatches.value.forEach((batch, index) => {
      console.log(`  ${index + 1}. ${batch.batch_number} - Price: ${getBatchPrice(batch)}`)
    })
  }
  console.log('=== END CURRENT STATE DEBUG ===')
}

// Debug function to check adjustment session state
window.debugAdjustmentSession = () => {
  console.log('=== ADJUSTMENT SESSION DEBUG ===')
  console.log('Current adjustment number:', adjustmentNumber.value)
  console.log('Current adjustment ID:', currentAdjustmentId.value)
  console.log('Adjustment status:', adjustmentStatus.value)
  console.log('Is adjustment editable:', isAdjustmentEditable.value)
  console.log('History items count:', adjustmentHistory.value.length)
  console.log('Created at:', createdAt.value)
  console.log('Updated at:', updatedAt.value)
  console.log('=== END ADJUSTMENT SESSION DEBUG ===')
}

// Debug function to check delete process
window.debugDeleteProcess = (index) => {
  console.log('=== DELETE PROCESS DEBUG ===')
  const item = adjustmentHistory.value[index]
  if (!item) {
    console.log('❌ Item not found at index:', index)
    return
  }
  
  console.log('Item to delete:', item)
  console.log('Item action:', item.action)
  console.log('Item quantity:', item.quantity)
  console.log('Item location_id:', item.location_id)
  console.log('Item batch_id:', item.batch_id)
  console.log('Item backend_id:', item.backend_id)
  console.log('Current batch locations count:', batchLocations.value.length)
  console.log('Current batch locations:', batchLocations.value)
  console.log('Storage locations:', storageLocations.value)
  
  // Check if we can find the location by ID
  const locationById = batchLocations.value.find(loc => loc.id === item.location_id)
  console.log('Found location by ID:', locationById)
  
  // Check if we can find the location by storage ID
  const locationByStorageId = batchLocations.value.find(loc => loc.storage === item.location_id)
  console.log('Found location by storage ID:', locationByStorageId)
  
  // Show all location IDs for comparison
  console.log('All batch location IDs:', batchLocations.value.map(loc => loc.id))
  console.log('All batch storage IDs:', batchLocations.value.map(loc => loc.storage))
  
  console.log('=== END DELETE PROCESS DEBUG ===')
}

// Debug function to manually fetch batch locations
window.debugFetchBatchLocations = async (batchId) => {
  console.log('=== DEBUG FETCH BATCH LOCATIONS ===')
  console.log('Fetching for batch ID:', batchId)
  try {
    const response = await batchLocationsAPI.getBatchLocations(batchId)
    console.log('API Response:', response)
    console.log('Locations data:', response.data)
    return response.data
  } catch (error) {
    console.error('Fetch error:', error)
    return null
  }
}

// Debug function to test reversal logic
window.debugReversal = async (adjustmentIndex) => {
  console.log('=== DEBUG REVERSAL LOGIC ===')
  const item = adjustmentHistory.value[adjustmentIndex]
  if (!item) {
    console.error('Item not found at index:', adjustmentIndex)
    return
  }
  
  console.log('Item to reverse:', item)
  
  // Fetch current batch locations
  try {
    const response = await batchLocationsAPI.getBatchLocations(item.batch_id)
    const locations = response.data.results || response.data || []
    console.log('Current batch locations:', locations)
    
    const targetLocation = locations.find(loc => loc.id === item.location_id)
    console.log('Target location for reversal:', targetLocation)
    
    if (!targetLocation) {
      console.error('Target location not found!')
      return
    }
    
    // Calculate what the reversal should do
    console.log('\n--- REVERSAL CALCULATION ---')
    console.log('Original action:', item.action)
    console.log('Original quantity:', item.quantity)
    console.log('Current location quantity:', targetLocation.quantity)
    
    let expectedNewQuantity
    switch (item.action) {
      case 'add_stock':
        expectedNewQuantity = targetLocation.quantity - item.quantity
        console.log('ADD_STOCK reversal: subtract quantity')
        console.log(`Expected: ${targetLocation.quantity} - ${item.quantity} = ${expectedNewQuantity}`)
        break
      case 'delete_expired':
      case 'delete_damage':
        expectedNewQuantity = targetLocation.quantity + item.quantity
        console.log('DELETE reversal: add quantity back')
        console.log(`Expected: ${targetLocation.quantity} + ${item.quantity} = ${expectedNewQuantity}`)
        break
      case 'change_location':
        expectedNewQuantity = targetLocation.quantity + item.quantity
        console.log('CHANGE_LOCATION reversal: add quantity back to source')
        console.log(`Expected: ${targetLocation.quantity} + ${item.quantity} = ${expectedNewQuantity}`)
        break
    }
    
    console.log('Expected new quantity after reversal:', expectedNewQuantity)
    
  } catch (error) {
    console.error('Debug reversal failed:', error)
  }
}

// Debug function to test batch location update
window.debugUpdateBatchLocation = async (locationId, newQuantity) => {
  console.log('=== DEBUG UPDATE BATCH LOCATION ===')
  console.log('Location ID:', locationId)
  console.log('New quantity:', newQuantity)
  
  // First, get the current location data
  try {
    const currentLocation = batchLocations.value.find(loc => loc.id === locationId)
    console.log('Current location object:', currentLocation)
    
    if (!currentLocation) {
      console.error('Location not found in current batch locations')
      return
    }
    
    // Test different payload formats
    const payloads = [
      // Format 1: Just quantity
      { quantity: newQuantity },
      
      // Format 2: All current fields
      {
        batch: currentLocation.batch || selectedBatchInfo.value?.id,
        storage: currentLocation.storage,
        quantity: newQuantity
      },
      
      // Format 3: Minimal with rounded quantity
      { quantity: Math.round(newQuantity) }
    ]
    
    for (let i = 0; i < payloads.length; i++) {
      console.log(`\n--- Testing payload ${i + 1} ---`)
      console.log('Payload:', payloads[i])
      
      try {
        const response = await batchLocationsAPI.updateBatchLocation(locationId, payloads[i])
        console.log(`✅ Payload ${i + 1} SUCCESS:`, response.data)
        return response.data
      } catch (error) {
        console.error(`❌ Payload ${i + 1} FAILED:`, error)
        if (error.response) {
          console.error(`Status: ${error.response.status}`)
          console.error(`Data:`, error.response.data)
        }
      }
    }
    
  } catch (error) {
    console.error('Debug update failed:', error)
  }
}

// Debug function for checking change_location reversal
window.debugChangeLocationReversal = (targetLocationId) => {
  console.log('=== DEBUG CHANGE LOCATION REVERSAL ===')
  console.log('Target Location ID:', targetLocationId, '(type:', typeof targetLocationId, ')')
  console.log('Available batch locations:')
  batchLocations.value.forEach(loc => {
    console.log(`  - ID: ${loc.id}, Storage: ${loc.storage} (type: ${typeof loc.storage}), Name: ${loc.storage_name}, Quantity: ${loc.quantity}`)
  })
  
  const targetLocation = batchLocations.value.find(loc => loc.storage === targetLocationId)
  console.log('Target location found:', targetLocation)
  
  if (!targetLocation) {
    console.log('Trying to find by converting types...')
    const targetLocationStr = String(targetLocationId)
    const targetLocationNum = Number(targetLocationId)
    console.log('As string:', targetLocationStr)
    console.log('As number:', targetLocationNum)
    
    const foundByStr = batchLocations.value.find(loc => String(loc.storage) === targetLocationStr)
    const foundByNum = batchLocations.value.find(loc => Number(loc.storage) === targetLocationNum)
    console.log('Found by string conversion:', foundByStr)
    console.log('Found by number conversion:', foundByNum)
  }
  
  console.log('=== END DEBUG ===')
}

// Debug function to check change_location operation history
window.debugChangeLocationHistory = (adjustmentIndex) => {
  console.log('=== DEBUG CHANGE LOCATION HISTORY ===')
  const item = adjustmentHistory.value[adjustmentIndex]
  if (!item) {
    console.error('Item not found at index:', adjustmentIndex)
    return
  }
  
  console.log('Adjustment item:', item)
  console.log('Action:', item.action)
  console.log('Quantity moved:', item.quantity)
  console.log('Original location:', item.original_location)
  console.log('Target location:', item.location)
  
  if (item.action === 'change_location') {
    console.log('\n--- CHECKING CURRENT QUANTITIES ---')
    
    // Find source location (original_location)
    const sourceLocations = batchLocations.value.filter(loc => loc.storage_name === item.original_location)
    console.log('Source locations found:', sourceLocations)
    
    // Find target location (location)
    const targetLocations = batchLocations.value.filter(loc => loc.storage_name === item.location)
    console.log('Target locations found:', targetLocations)
    
    console.log('\n--- ANALYSIS ---')
    console.log(`If ${item.quantity} items were moved from ${item.original_location} to ${item.location}:`)
    console.log(`- Source should have DECREASED by ${item.quantity}`)
    console.log(`- Target should have INCREASED by ${item.quantity}`)
    
    if (targetLocations.length > 0) {
      const totalTargetQuantity = targetLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0)
      console.log(`Current total quantity in target location: ${totalTargetQuantity}`)
      console.log(`Expected minimum quantity in target: ${item.quantity}`)
      
      if (totalTargetQuantity < item.quantity) {
        console.warn('⚠️ TARGET LOCATION ISSUE: Target has less quantity than expected!')
        console.warn('This suggests the original change_location operation may have failed')
      }
    }
  }
  
  console.log('=== END DEBUG ===')
}

// Debug function to manually test target location update
window.debugTargetLocationUpdate = async (targetLocationId, quantityToRemove) => {
  console.log('=== DEBUG TARGET LOCATION UPDATE ===')
  console.log('Target Location ID:', targetLocationId)
  console.log('Quantity to remove:', quantityToRemove)
  
  // Find the target location
  const targetLocation = batchLocations.value.find(loc => loc.storage == targetLocationId)
  if (!targetLocation) {
    console.error('Target location not found!')
    return
  }
  
  console.log('Found target location:', targetLocation)
  
  const newQuantity = Math.max(0, (targetLocation.quantity || 0) - quantityToRemove)
  const updateData = {
    batch: targetLocation.batch || selectedBatchInfo.value?.id,
    storage: targetLocation.storage,
    quantity: Math.max(0, Math.round(newQuantity))
  }
  
  console.log('Update data:', updateData)
  console.log(`Updating: ${targetLocation.quantity} → ${newQuantity}`)
  
  try {
    const response = await batchLocationsAPI.updateBatchLocation(targetLocation.id, updateData)
    console.log('✅ Update successful:', response.data)
    
    // Refresh the batch locations to see the change
    await refreshQuantitiesAfterChange()
    console.log('✅ Quantities refreshed')
    
  } catch (error) {
    console.error('❌ Update failed:', error)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
  }
}

const loadLastAdjustmentNumber = async () => {
  try {
    historyLoading.value = true
    
    // Get all adjustments from all statuses to find the highest number
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
      
      // Set the adjustment number and load its data
      adjustmentNumber.value = highestAdjustment.adjustment_number
      await loadAdjustmentByNumber(highestAdjustment.adjustment_number)
      
      console.log(`Loaded last adjustment #${highestAdjustment.adjustment_number} (${drugAdjustmentHelpers.getStatusDisplay(highestAdjustment.status)})`)
    } else {
      // No adjustments found, start with adjustment #1
      adjustmentNumber.value = 1
      await loadAdjustmentByNumber(1)
      console.log('No existing adjustments found, starting with adjustment #1')
    }
    
  } catch (error) {
    console.error('Error loading last adjustment number:', error)
    // Fallback to adjustment #1
    adjustmentNumber.value = 1
    await loadAdjustmentByNumber(1)
    ElMessage.warning('Could not load last adjustment, starting with adjustment #1')
  } finally {
    historyLoading.value = false
  }
}

// Initialize
onMounted(async () => {
  // Ensure storage data is available
  await storageStore.fetchStorages()
  
  // Ensure pharmacy drugs are loaded
  if (drugStore.drugs.length === 0) {
    await drugStore.fetchDrugs()
  }
  
  // Only load the last adjustment number if no initial adjustment number was provided
  if (props.initialAdjustmentNumber) {
    // Load the specific adjustment number passed as prop
    await loadAdjustmentByNumber(props.initialAdjustmentNumber)
  } else {
    // Load the last (highest) adjustment number available
    await loadLastAdjustmentNumber()
  }
  
  // Auto-focus on barcode input for better UX
  setTimeout(() => {
    focusBarcodeField()
  }, 300)
})

// Cleanup timeout on component unmount
onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  if (window.adjustmentNumberTimeout) {
    clearTimeout(window.adjustmentNumberTimeout)
  }
})

// Helper functions for backend integration
const getSourceLocationId = () => {
  // Get the source location ID from the selected location info
  if (selectedLocationQuantityInfo.value) {
    const location = selectedLocationQuantityInfo.value
    console.log('=== DEBUG: getSourceLocationId ===')
    console.log('Location object:', location)
    console.log('Location keys:', Object.keys(location))
    
    // The BatchLocationSerializer returns 'storage' field which contains the Storage ID
    if (location.storage) {
      console.log(`Found storage ID in 'storage' field:`, location.storage)
      return location.storage
    }
    
    // Fallback: try other possible field names for storage ID
    const possibleIdFields = ['storage_id', 'location_id']
    
    for (const field of possibleIdFields) {
      const value = location[field]
      if (value !== null && value !== undefined && value !== '') {
        console.log(`Found storage ID in field '${field}':`, value)
        const numericValue = parseInt(value)
        if (!isNaN(numericValue)) {
          return numericValue
        }
        return value
      }
    }
    
    console.log('No valid storage ID found in location object')
  }
  
  console.log('selectedLocationQuantityInfo is null or undefined')
  return null
}

const finalizeCurrentAdjustment = async () => {
  if (!currentAdjustmentId.value) {
    ElMessage.error('No active adjustment to finalize')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to finalize Adjustment #${adjustmentNumber.value}? This will lock the adjustment and prevent further changes. All quantity changes have already been applied to the database.`,
      'Finalize Adjustment',
      {
        confirmButtonText: 'Yes, Finalize',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    processing.value = true

    // Finalize the adjustment in the backend (just changes status, quantities already applied)
    const response = await drugAdjustmentsAPI.finalizeAdjustment(currentAdjustmentId.value)
    
    // Update local state
    adjustmentStatus.value = 'finalized'
    updatedAt.value = new Date().toISOString()
    
    ElMessage.success(`Adjustment #${adjustmentNumber.value} has been finalized successfully! The adjustment is now locked and cannot be modified.`)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error finalizing adjustment:', error)
      ElMessage.error('Failed to finalize adjustment: ' + (error.response?.data?.error || error.message))
    }
  } finally {
    processing.value = false
  }
}

const getStatusTagType = (status) => {
  return drugAdjustmentHelpers.getStatusColor(status)
}

const getStatusColor = (status) => {
  switch (status) {
    case 'finalized':
      return '#67c23a'
    case 'cancelled':
      return '#f56c6c'
    default:
      return '#409eff'
  }
}

// Price helper functions
const getBatchPriceValue = (batch) => {
  if (!batch) return 0
  
  // Try different possible price field names
  const possiblePriceFields = [
    'selling_price',
    'price',
    'unit_price',
    'sale_price',
    'retail_price',
    'cost_price'
  ]
  
  for (const field of possiblePriceFields) {
    const value = batch[field]
    if (value !== null && value !== undefined && value !== '' && !isNaN(value)) {
      return parseFloat(value)
    }
  }
  
  return 0
}

const getBatchPrice = (batch) => {
  const priceValue = getBatchPriceValue(batch)
  return priceValue > 0 ? formatPrice(priceValue) : 'N/A'
}

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '' || isNaN(price)) {
    return 'N/A'
  }
  return parseFloat(price).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

const calculateTotalPrice = (unitPrice, quantity, action) => {
  if (!unitPrice || isNaN(unitPrice) || !quantity) {
    return 0
  }
  
  const price = parseFloat(unitPrice) * parseInt(quantity)
  
  switch (action) {
    case 'add_stock':
      return price // Positive for adding stock
    case 'change_location':
      return 0 // No price impact for location change
    case 'delete_expired':
    case 'delete_damage':
      return -price // Negative for deletions
    default:
      return 0
  }
}

const getPriceClass = (action) => {
  switch (action) {
    case 'add_stock':
      return 'price-positive'
    case 'change_location':
      return 'price-neutral'
    case 'delete_expired':
    case 'delete_damage':
      return 'price-negative'
    default:
      return ''
  }
}

const getPriceDisplay = (unitPrice, quantity, action) => {
  const totalPrice = calculateTotalPrice(unitPrice, quantity, action)
  if (totalPrice === 0) {
    return action === 'change_location' ? '0' : 'N/A'
  }
  return (totalPrice > 0 ? '+' : '') + formatPrice(Math.abs(totalPrice))
}

const toggleLanguage = () => {
  showPersianNames.value = !showPersianNames.value
}

const toggleSearchLanguage = () => {
  showPersianNamesInSearch.value = !showPersianNamesInSearch.value
  ElMessage.success(`Search language switched to ${showPersianNamesInSearch.value ? 'Persian' : 'English'}`)
}

// Keyboard navigation handlers
const handleBarcodeEnter = () => {
  // If barcode has content, process it
  if (barcodeInput.value?.trim()) {
    processBarcodeManually()
  } else {
    // Move to search dropdown
    focusSearchField()
  }
}

const handleSearchEnter = () => {
  // If in step 1 and no value, try to search by GTIN
  if (searchStep.value === 1 && currentSearchValue.value?.toString()?.trim()) {
    searchByGtin()
  } else if (currentSearchValue.value) {
    // If there's a selected value, move to next field
    moveToNextField()
  }
}

const handleActionEnter = () => {
  if (currentActionValue.value) {
    // If action is selected, move to next field
    moveToNextField()
  }
}

const handleQuantityEnter = () => {
  // Move to reason field
  focusReasonField()
}

const handleReasonEnter = () => {
  // Last field - add to table if form is valid
  if (isFormValid.value) {
    addOrUpdateAdjustment()
    ElMessage.success('Item added via Enter key!')
  } else {
    ElMessage.warning('Please complete all required fields before adding to table')
  }
}

// Focus management functions
const focusSearchField = async () => {
  await nextTick()
  if (selectRef.value) {
    selectRef.value.focus()
  }
}

const focusActionField = async () => {
  await nextTick()
  if (actionSelectRef.value) {
    actionSelectRef.value.focus()
  }
}

const focusQuantityField = async () => {
  await nextTick()
  if (quantityInputRef.value) {
    quantityInputRef.value.focus()
  }
}

const focusReasonField = async () => {
  await nextTick()
  if (reasonInputRef.value) {
    reasonInputRef.value.focus()
  }
}

const focusBarcodeField = async () => {
  await nextTick()
  if (barcodeInputRef.value) {
    barcodeInputRef.value.focus()
  }
}

const moveToNextField = () => {
  // Determine next field based on current state
  if (searchStep.value < 3) {
    // Still in progressive search, focus stays on search field
    focusSearchField()
  } else if (!adjustmentForm.action) {
    // Move to action field
    focusActionField()
  } else if (adjustmentForm.action === 'change_location' && actionStep.value === 2) {
    // In location selection for change_location, stay on action field
    focusActionField()
  } else {
    // Move to quantity field
    focusQuantityField()
  }
}

const getStatusButtonType = (status) => {
  switch (status) {
    case 'finalized':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'info'
  }
}

const showStatusInfo = () => {
  ElMessage({
    type: 'info',
    message: `Current adjustment status: ${drugAdjustmentHelpers.getStatusDisplay(adjustmentStatus.value)}`,
    duration: 5000
  })
}

// Function to reverse an adjustment (for editing/deleting) using backend API
const reverseAdjustmentImmediately = async (adjustmentData) => {
  try {
    const { backendId } = adjustmentData
    
    if (!backendId) {
      console.error('No backend ID provided for reversal')
      return false
    }
    
    // Use the backend API to reverse the adjustment item
    const response = await drugAdjustmentItemsAPI.reverseAdjustmentItem(backendId)
    
    console.log('Successfully reversed adjustment using backend API:', response.data)
    
    // Refresh frontend data to show updated quantities immediately
    await refreshQuantitiesAfterChange()
    
      return true
    
  } catch (error) {
    console.error('Error reversing adjustment via backend API:', error)
    if (error.response?.data?.error) {
      console.error('Backend error details:', error.response.data.error)
    }
    return false
  }
}

// NEW: Function to apply adjustment item immediately to database quantities
const applyAdjustmentItemImmediately = async (adjustmentData) => {
  try {
    console.log('Applying adjustment to batch location quantities:', adjustmentData)
    
    const { action, quantity, sourceLocationId, targetLocationId } = adjustmentData
    
    // Get the current batch location to update
    const currentLocation = batchLocations.value.find(loc => loc.id === sourceLocationId)
    if (!currentLocation) {
      console.error('Source location not found:', sourceLocationId)
      return false
    }
    
    let updatePromises = []
    
    switch (action) {
      case 'add_stock':
        // Increase quantity at source location
        const newQuantityAdd = (currentLocation.quantity || 0) + quantity
        const updateDataAdd = {
          batch: currentLocation.batch || selectedBatchInfo.value?.id,
          storage: currentLocation.storage,
          quantity: Math.max(0, Math.round(newQuantityAdd)) // Ensure positive integer
        }
        
        console.log(`Adding ${quantity} to location ${currentLocation.storage_name}: ${currentLocation.quantity} → ${newQuantityAdd}`)
        console.log(`Update data for ADD:`, updateDataAdd)
        
        updatePromises.push(
          batchLocationsAPI.updateBatchLocation(currentLocation.id, updateDataAdd)
        )
        break
        
      case 'delete_expired':
      case 'delete_damage':
        // Decrease quantity at source location
        const newQuantityDelete = Math.max(0, (currentLocation.quantity || 0) - quantity)
        const updateDataDelete = {
          batch: currentLocation.batch || selectedBatchInfo.value?.id,
          storage: currentLocation.storage,
          quantity: Math.max(0, Math.round(newQuantityDelete)) // Ensure positive integer
        }
        
        console.log(`Removing ${quantity} from location ${currentLocation.storage_name}: ${currentLocation.quantity} → ${newQuantityDelete}`)
        console.log(`Update data for DELETE:`, updateDataDelete)
        
        updatePromises.push(
          batchLocationsAPI.updateBatchLocation(currentLocation.id, updateDataDelete)
        )
        break
        
      case 'change_location':
        // Decrease quantity at source location
        const newQuantitySource = Math.max(0, (currentLocation.quantity || 0) - quantity)
        const updateDataSource = {
          batch: currentLocation.batch || selectedBatchInfo.value?.id,
          storage: currentLocation.storage,
          quantity: Math.max(0, Math.round(newQuantitySource)) // Ensure positive integer
        }
        
        console.log(`Moving ${quantity} from location ${currentLocation.storage_name}: ${currentLocation.quantity} → ${newQuantitySource}`)
        console.log(`Update data for MOVE source:`, updateDataSource)
        
        updatePromises.push(
          batchLocationsAPI.updateBatchLocation(currentLocation.id, updateDataSource)
        )
        
        // Increase quantity at target location (if it exists)
        if (targetLocationId) {
          const targetLocation = batchLocations.value.find(loc => loc.storage === targetLocationId)
          if (targetLocation) {
            const newQuantityTarget = (targetLocation.quantity || 0) + quantity
            const updateDataTarget = {
              batch: targetLocation.batch || selectedBatchInfo.value?.id,
              storage: targetLocation.storage,
              quantity: Math.max(0, Math.round(newQuantityTarget)) // Ensure positive integer
            }
            
            console.log(`Moving ${quantity} to location ${targetLocation.storage_name}: ${targetLocation.quantity} → ${newQuantityTarget}`)
            console.log(`Update data for MOVE target:`, updateDataTarget)
            
            updatePromises.push(
              batchLocationsAPI.updateBatchLocation(targetLocation.id, updateDataTarget)
            )
          } else {
            // Create new batch location for target
            const createData = {
              batch: selectedBatchInfo.value.id,
              storage: targetLocationId,
              quantity: Math.max(0, Math.round(quantity)) // Ensure positive integer
            }
            
            console.log(`Creating new location with ${quantity} items`)
            console.log(`Create data for new location:`, createData)
            
            updatePromises.push(
              batchLocationsAPI.createBatchLocation(createData)
            )
          }
        }
        break
        
      default:
        console.warn('Unknown action:', action)
        return false
    }
    
    // Execute all updates
    await Promise.all(updatePromises)
    console.log('Successfully applied adjustment to batch locations')
    return true
    
  } catch (error) {
    console.error('Error applying adjustment to batch locations:', error)
    return false
  }
}

// NEW: Function to refresh quantities after database changes
const refreshQuantitiesAfterChange = async () => {
  try {
    // Refresh drug data to get updated total quantities
    await drugStore.fetchDrugs()
    
    // Refresh batch data to get updated batch quantities
    await drugStore.fetchBatches()
    
    // If we have a selected drug, refresh its batches specifically
    if (selectedDrugInfo.value) {
      await fetchDrugBatches(selectedDrugInfo.value.id)
    }
    
    // If we have a selected batch, refresh its locations
    if (selectedBatchInfo.value) {
      await fetchBatchLocations(selectedBatchInfo.value.id)
    }
    
    console.log('Quantities refreshed after database change')
    
  } catch (error) {
    console.error('Error refreshing quantities:', error)
    // Don't show error message to user as this is a background operation
  }
}
</script>

<style scoped>

.page-header h1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header p {
  margin: 0;
  color: #606266;
}

.header-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 10px;
  gap: 20px;
}

.adjustment-number-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.adjustment-number-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.adjustment-number-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-button {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-color: #ffffff;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background-color: #f0f9ff;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.new-adjustment-button {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #ffffff;
  font-size: 12px;
  padding: 6px 12px;
  height: 28px;
  margin-left: 12px;
  font-weight: bold;
  border-radius: 4px;
}

.new-adjustment-button:hover {
  background-color: #85ce61;
  border-color: #85ce61;
  color: #ffffff;
}

.new-adjustment-button:focus {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #ffffff;
}

.adjustment-number-input {
  width: 80px;
}

.adjustment-number-input :deep(.el-input__inner) {
  text-align: center;
  font-weight: 600;
  color: var(--primary-color);
  /* background-color: #f0f9ff;
  border: 1px solid #e1f5fe; */
  padding: 0 8px;
}

.adjustment-number-input :deep(.el-input__inner):focus {
  border-color: var(--primary-color);
  /* background-color: #ffffff; */
}

.invalid-adjustment :deep(.el-input__inner) {
  border-color: #f56c6c !important;
  background-color: #fef0f0 !important;
  color: #f56c6c !important;
}

.invalid-adjustment :deep(.el-input__inner):focus {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2) !important;
}

.checking-adjustment :deep(.el-input__inner) {
  border-color: #e6a23c !important;
  background-color: #fdf6ec !important;
  color: #e6a23c !important;
}

/* Hide number input spinners in webkit browsers */
.adjustment-number-input :deep(.el-input__inner)::-webkit-outer-spin-button,
.adjustment-number-input :deep(.el-input__inner)::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Hide number input spinners in Firefox */
.adjustment-number-input :deep(.el-input__inner[type=number]) {
  -moz-appearance: textfield;
}

.timestamp-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.timestamp-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timestamp-label {
  font-size: 13px;
  font-weight: 500;
  color: #909399;
  min-width: 80px;
  text-align: right;
}

.timestamp-value {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa;
  padding: 6px 14px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  min-width: 140px;
  text-align: center;
}

.timestamp-toggle-button {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-color: #ffffff;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 1px;
}

.timestamp-toggle-button:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background-color: #f0f9ff;
}

.drug-edit-button {
  background-color: #08C2FF;
  border-color: #ffffff;
  color:#ffffff;
  font-size: 12px;
  padding: 6px 6px;
  height: 28px;
  margin-left: 2px;
  font-weight: bold;
}

.drug-edit-button:hover {
  background-color: #B7E0FF;
  border-color: #B7E0FF;
  color: #133E87;
}

.drug-edit-button:focus {
  background-color: #08C2FF;
  border-color: #08C2FF;
  color: #133E87;
}

.print-dropdown {
  margin-left: 4px;
}

.print-button {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  font-size: 12px;
  padding: 6px 12px;
  height: 28px;
  font-weight: bold;
}

.print-button:hover {
  background-color: #4dabf7;
  border-color: #4dabf7;
}

.adjustment-form-card {
  margin-bottom: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 10px;
}

.table-header-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.adjustment-form {
  width: 100%;
}

.adjustment-form .el-form-item {
  margin-bottom: 5px;
}

.stock-info {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
  font-weight: 500;
}

.form-buttons {
  text-align: center;
  margin-top: 10px;
}

.form-buttons .el-button {
  margin: 0 10px;
  min-width: 120px;
}

.adjustments-table-card {
  margin-top: 20px;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cancel-button {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.cancel-button:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.add-button {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.operations-container {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.no-data-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px dashed #dcdfe6;
}

.loading-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--primary-color);
  background-color: #f0f9ff;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px dashed var(--primary-color);
}

.loading-message p {
  margin-top: 10px;
  font-weight: 500;
}

.loading-indicator {
  color: var(--primary-color);
  font-size: 13px;
  margin-left: 10px;
  font-weight: 500;
}

.loading-indicator .el-icon {
  margin-right: 5px;
}

.projected-quantity {
  color: #e6a23c;
  font-weight: bold;
  font-style: italic;
}

.editing-mode-indicator {
  color: #409eff;
  font-size: 11px;
  font-style: italic;
  margin-left: 5px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.quantity-positive {
  color: #67c23a;
  font-weight: bold;
}

.quantity-negative {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

/* Dropdown options with minimal quantity */
.dropdown-option-minimal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  width: 100%;
  min-width: 450px;
}

.quantity-minimal {
  color: #2e8ceb;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Override for quantity inside quantity-with-expiry */
.quantity-with-expiry .quantity-minimal {
  margin-left: 0;
  margin-bottom: 0;
  padding-bottom: 0;
}

.quantity-with-expiry {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 8px;
}

.expiry-date-minimal {
  color: #666;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.option-content {
  flex: 1;
  min-width: 350px;
  margin-right: 16px;
}

.option-title {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 2px;
}

.option-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
}

/* Custom dropdown styling */
:deep(.batch-dropdown-with-quantity),
:deep(.location-dropdown-with-quantity) {
  min-width: 400px !important;
  max-width: 900px !important;
}

:deep(.batch-dropdown-with-quantity .el-select-dropdown__item),
:deep(.location-dropdown-with-quantity .el-select-dropdown__item) {
  padding: 8px 12px;
  height: auto;
  line-height: normal;
  white-space: normal;
  word-wrap: break-word;
}

:deep(.batch-dropdown-with-quantity .el-select-dropdown__item:hover),
:deep(.location-dropdown-with-quantity .el-select-dropdown__item:hover) {
  background-color: #f5f7fa;
}

:deep(.batch-dropdown-with-quantity .el-select-dropdown__item.selected),
:deep(.location-dropdown-with-quantity .el-select-dropdown__item.selected) {
  background-color: #ecf5ff;
  color: var(--primary-color);
}

:deep(.batch-dropdown-with-quantity .el-select-dropdown__item.selected .quantity-minimal),
:deep(.location-dropdown-with-quantity .el-select-dropdown__item.selected .quantity-minimal) {
  color: #2e8ceb;
  font-weight: 700;
}

/* Selection path row */
.selection-path-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 6px 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-top: 5px;
}

.selection-path, .action-path {
  display: flex;
  align-items: center;
  gap: 8px;
}

.path-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  min-width: 60px;
}

.selection-path .el-tag, .action-path .el-tag {
  transition: all 0.2s ease;
}

.selection-path .el-tag:hover, .action-path .el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Selected action tag */
.selected-action-tag {
  margin-top: 5px;
}

.selected-action-tag .el-tag {
  font-weight: 500;
  transition: all 0.2s ease;
}

.selected-action-tag .el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Quantity result display */
.quantity-result {
  margin-top: 8px;
  padding: 0px 2px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1.6px solid #e9ecef;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 20px;
  margin-top: 13px;
}

.result-label {
  font-weight: 500;
  color: #606266;
  min-width: 45px;
}

.result-value {
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.result-positive {
  color: #67c23a;
}

.result-neutral {
  color: #409eff;
}

.result-negative {
  color: #f56c6c;
}

/* Barcode input styling */
.barcode-input {
  border: 2px dashed #409eff;
  border-radius: 6px;
  background-color: #f0f9ff;
}

.barcode-input:hover {
  border-color: #66b1ff;
  background-color: #ecf5ff;
}

.barcode-input:focus-within {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* Price styling */
.price-positive {
  color: #67c23a;
  font-weight: bold;
}

.price-negative {
  color: #f56c6c;
  font-weight: bold;
}

.price-neutral {
  color: #909399;
  font-weight: bold;
}

/* Price Summary Card */
.price-summary-card {
  margin-top: 20px;
}

.summary-item {
  text-align: center;
  padding: 5px;
  border-radius: 8px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  max-height: max-content;
}

.summary-item.positive {
  background-color: #f0f9f0;
  border-color: #d4edda;
}

.summary-item.negative {
  background-color: #fdf2f2;
  border-color: #f5c6cb;
}

.summary-item.neutral {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.summary-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 3px;
}

.summary-detail {
  font-size: 11px;
  color: #999;
}

.total-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 15px 20px;
  border-radius: 8px;
  border: 2px solid #dee2e6;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.total-value {
  font-size: 20px;
  font-weight: bold;
}

.total-value.positive {
  color: #67c23a;
}

.total-value.negative {
  color: #f56c6c;
}

.name-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.language-toggle {
  margin-left: 8px;
  min-width: 35px;
  font-size: 12px;
  padding: 4px 8px;
  font-family: var(--font-persian);
  font-weight: bold;
}

.medicine-name {
  font-weight: 500;
  direction: ltr;
  text-align: left;
}

/* Persian text styling */
.medicine-name:has-text([\u0600-\u06FF]) {
  direction: rtl;
  text-align: right;
}

/* Search field header with language toggle */
.search-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.search-language-toggle {
  min-width: 35px;
  font-size: 12px;
  padding: 4px 8px;
  font-family: var(--font-persian);
  font-weight: bold;
  height: 24px;
  margin-left: 8px;
}

.status-display-button {
  font-size: 12px;
  padding: 6px 12px;
  height: 28px;
  margin-left: 4px;
  font-weight: bold;
  color: #ffffff;
}

/* Status button colors based on type */
.status-display-button.el-button--info {
  background-color: #4dabf7;
  border-color: #4dabf7;
}

.status-display-button.el-button--info:hover {
  background-color: #3395ff;
  border-color: #3395ff;
}

.status-display-button.el-button--success {
  background-color: #67c23a;
  border-color: #67c23a;
}

.status-display-button.el-button--success:hover {
  background-color: #85ce61;
  border-color: #85ce61;
}

.status-display-button.el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.status-display-button.el-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

.status-alert {
  margin-bottom: 20px;
}

.status-alert :deep(.el-alert__title) {
  font-weight: 600;
  font-size: 14px;
}

.status-alert :deep(.el-alert__description) {
  font-size: 13px;
  margin-top: 5px;
}

.realtime-info-alert {
  margin-bottom: 20px;
}

.realtime-info-alert :deep(.el-alert__title) {
  font-weight: 600;
  font-size: 14px;
}

.realtime-info-alert :deep(.el-alert__description) {
  font-size: 13px;
  margin-top: 5px;
}

/* Delete Adjustment Button */
.delete-adjustment-button {
  margin-left: 2px;
  font-weight: 600;
  height: 28px;
}

.delete-adjustment-button:hover:not(.is-disabled) {
  background-color: #dc3545 !important;
  border-color: #dc3545 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.delete-adjustment-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 