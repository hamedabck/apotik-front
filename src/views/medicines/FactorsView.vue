<template>
  <div class="factors-view">
    <div class="page-header">
      <h1 style="font-size: 24px; font-weight: 600;">Factors</h1>
      <div class="header-info-row">
        <div class="factor-number-container">
          <label class="factor-number-label">Number:</label>
          <div class="factor-number-controls">
            <el-button 
              size="small" 
              @click="previousFactorNumber"
              :disabled="factorNumber <= 1 || isCheckingFactorExists"
              class="nav-button"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-input
              v-model="factorNumber"
              type="number"
              :min="1"
              :class="['factor-number-input', { 'invalid-factor': isFactorNumberInvalid, 'checking-factor': isCheckingFactorExists }]"
              @input="onFactorNumberInput"
              @blur="validateFactorNumber"
              @focus="isFactorNumberInvalid = false"
              :disabled="isCheckingFactorExists"
              placeholder="1"
              :validate-event="false"
            />
            <el-button 
              size="small" 
              @click="nextFactorNumber"
              :disabled="isCheckingFactorExists"
              class="nav-button"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              type="success"
              @click="createNewFactor"
              class="new-factor-button"
              :title="'Create a new factor session'"
            >
              <el-icon><Plus /></el-icon>
              New Factor
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
              :type="getStatusButtonType(factorStatus)"
              class="status-display-button"
              @click="showStatusInfo"
              :title="`Current factor status: ${factorHelpers.getStatusDisplay(factorStatus)}`"
            >
              <el-icon><InfoFilled /></el-icon>
              {{ factorHelpers.getStatusDisplay(factorStatus) }}
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
            
            <!-- Delete Factor Button -->
            <el-button 
              size="small" 
              type="danger"
              @click="deleteEntireFactor"
              :disabled="processing || !currentFactorId"
              class="delete-factor-button"
              :title="`Delete entire factor #${factorNumber} and all its items`"
            >
              <el-icon><Delete /></el-icon>
              Delete Factor
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Factor Header Form -->
    <el-card class="factor-header-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Factor Information</span>
        </div>
      </template>

      <el-form :model="headerForm" class="factor-header-form">
        <!-- Header Fields Row 1 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="factorType"
              data-label="Factor Type"
              :class="{ 'has-value': hasValue(headerForm.factorType), 'is-focused': focusedField === 'factorType' }"
            >
              <el-select
                v-model="headerForm.factorType"
                placeholder=""
                style="width: 100%"
                @focus="focusedField = 'factorType'"
                @blur="focusedField = null"
              >
                <el-option
                  v-for="option in factorTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="distributionCompany"
              data-label="Distribution Company"
              :class="{ 'has-value': hasValue(headerForm.distributionCompany), 'is-focused': focusedField === 'distributionCompany' }"
            >
              <el-select
                v-model="headerForm.distributionCompany"
                placeholder=""
                style="width: 100%"
                @focus="focusedField = 'distributionCompany'"
                @blur="focusedField = null"
                :loading="distributionCompanyStore.loading"
                filterable
                clearable
              >
                <el-option
                  v-for="company in distributionCompanies"
                  :key="company.id"
                  :label="company.name"
                  :value="company.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="factorNumber"
              data-label="Factor Number"
              :class="{ 'has-value': hasValue(headerForm.factorNumber), 'is-focused': focusedField === 'factorNumber' }"
            >
              <el-input
                v-model="headerForm.factorNumber"
                placeholder=""
                @focus="focusedField = 'factorNumber'"
                @blur="focusedField = null"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="paymentType"
              data-label="Type of Payment"
              :class="{ 'has-value': hasValue(headerForm.paymentType), 'is-focused': focusedField === 'paymentType' }"
            >
              <el-select
                v-model="headerForm.paymentType"
                placeholder=""
                style="width: 100%"
                @focus="focusedField = 'paymentType'"
                @blur="focusedField = null"
              >
                <el-option
                  v-for="option in paymentTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Header Fields Row 2 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="factorBuyDate"
              data-label="Factor Buy Date"
              :class="{ 'has-value': hasValue(formattedFactorBuyDate), 'is-focused': focusedField === 'factorBuyDate' }"
            >
              <el-input
                v-model="formattedFactorBuyDate"
                placeholder=""
                @input="handleFactorBuyDateInput"
                @blur="validateAndFormatFactorBuyDate"
                @keyup.enter="validateAndFormatFactorBuyDate"
                @focus="focusedField = 'factorBuyDate'"
                maxlength="10"
                style="width: 100%"
                class="expiry-date-input"
              />
              <div v-if="jalaliFactorBuyDate" class="jalali-date-display">
                {{ jalaliFactorBuyDate }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="factorPaymentDate"
              data-label="Factor Payment Date"
              :class="{ 'has-value': hasValue(formattedFactorPaymentDate), 'is-focused': focusedField === 'factorPaymentDate' }"
            >
              <el-input
                v-model="formattedFactorPaymentDate"
                placeholder=""
                @input="handleFactorPaymentDateInput"
                @blur="validateAndFormatFactorPaymentDate"
                @keyup.enter="validateAndFormatFactorPaymentDate"
                @focus="focusedField = 'factorPaymentDate'"
                maxlength="10"
                style="width: 100%"
                class="expiry-date-input"
              />
              <div v-if="jalaliFactorPaymentDate" class="jalali-date-display">
                {{ jalaliFactorPaymentDate }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="additionalDiscount"
              data-label="Additional Discount"
              :class="{ 'has-value': hasValue(headerForm.additionalDiscount), 'is-focused': focusedField === 'additionalDiscount' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="headerForm.additionalDiscount ? formatCurrency(headerForm.additionalDiscount) : ''"
                  placeholder=""
                  @input="handleHeaderCurrencyInput($event, 'additionalDiscount')"
                  @focus="handleHeaderCurrencyFocus('additionalDiscount')"
                  @blur="handleHeaderCurrencyBlur('additionalDiscount')"
                  style="width: 100%"
                  class="currency-input"
                />
                <div v-if="headerForm.additionalDiscount" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="additionalTax"
              data-label="Additional Tax"
              :class="{ 'has-value': hasValue(headerForm.additionalTax), 'is-focused': focusedField === 'additionalTax' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="headerForm.additionalTax ? formatCurrency(headerForm.additionalTax) : ''"
                  placeholder=""
                  @input="handleHeaderCurrencyInput($event, 'additionalTax')"
                  @focus="handleHeaderCurrencyFocus('additionalTax')"
                  @blur="handleHeaderCurrencyBlur('additionalTax')"
                  style="width: 100%"
                  class="currency-input"
                />
                <div v-if="headerForm.additionalTax" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Factor Computed Fields -->
        <el-row :gutter="20" class="computed-fields-section">
          <el-col :span="6">
            <el-form-item 
              prop="totalDiscounts"
              data-label="Total Discounts"
              :class="{ 'has-value': hasValue(factorComputedFields.totalDiscounts), 'is-focused': focusedField === 'totalDiscounts' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="factorComputedFields.totalDiscounts"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalDiscounts'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="factorComputedFields.totalDiscounts" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="totalTax"
              data-label="Total Tax"
              :class="{ 'has-value': hasValue(factorComputedFields.totalTax), 'is-focused': focusedField === 'totalTax' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="factorComputedFields.totalTax"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalTax'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="factorComputedFields.totalTax" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="totalProfit"
              data-label="Total Profit"
              :class="{ 'has-value': hasValue(factorComputedFields.totalProfit), 'is-focused': focusedField === 'totalProfit' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="factorComputedFields.totalProfit"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalProfit'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="factorComputedFields.totalProfit" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="totalNetAmountPaid"
              data-label="Total Net Amount Paid"
              :class="{ 'has-value': hasValue(factorComputedFields.totalNetAmountPaid), 'is-focused': focusedField === 'totalNetAmountPaid' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="factorComputedFields.totalNetAmountPaid"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalNetAmountPaid'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="factorComputedFields.totalNetAmountPaid" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- Non-Editable Status Alert -->
    <el-alert
      v-if="!isFactorEditable"
      :title="`This factor is ${factorHelpers.getStatusDisplay(factorStatus)} and cannot be modified`"
      type="warning"
      :description="`Factor #${factorNumber} has been ${factorStatus}. No further changes can be made to this factor.`"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <!-- Factor Form -->
    <el-card class="factor-form-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ isEditing ? 'Edit Factor Item' : 'Add New Factor Item' }}</span>
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
              @click="addOrUpdateFactorItem"
              :disabled="!isFormValid || !isFactorEditable"
              class="add-button"
            >
              <el-icon><Plus v-if="!isEditing" /><Check v-else /></el-icon> 
              {{ isEditing ? 'Update Item' : 'Add to Table' }}
            </el-button>
          </div>
        </div>
      </template>

      <el-form :model="factorForm" class="factor-form">
        <!-- Unified Search/Barcode Field -->
        <el-row :gutter="20">
          <el-col :span="18">
            <el-form-item label="🔍 Search / ▌▌▌" class="unified-search-field">
              <div class="unified-search-container">
                <el-select
                  ref="unifiedSearchRef"
                  v-model="selectedPharmacyDrug"
                  filterable
                  remote
                  reserve-keyword
                  :placeholder="ttacDrugsLoaded ? 'Search by name, GTIN, keywords OR paste full barcode (30+ chars) for auto-parsing' : 'Unified search & barcode scanner (loading...)'"
                  :remote-method="handleUnifiedSearch"
                  :loading="isSearchingPharmacy"
                  style="width: 100%"
                  @change="onPharmacyDrugSelect"
                  clearable
                  class="unified-search-select"
                  @paste="handleUnifiedPaste"
                >
                  <el-option
                    v-for="drug in combinedSearchResults"
                    :key="drug.id"
                    :label="`${showPersianNamesInSearch ? (drug.persian_name || drug.english_name) : (drug.english_name || drug.persian_name)} - ${drug.gtin_code || drug.gtin || 'No GTIN'}`"
                    :value="drug.id"
                  >
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <div style="font-weight: 500; display: flex; align-items: center; gap: 8px;">
                          <span>
                            {{ showPersianNamesInSearch 
                              ? (drug.persian_name || drug.english_name || 'N/A')
                              : (drug.english_name || drug.persian_name || 'N/A') 
                            }}
                            <span v-if="getCompanyName(drug)" style="font-weight: 400; color: #666; margin-left: 8px;">
                              - {{ getCompanyName(drug) }}
                            </span>
                          </span>
                          <el-tag 
                            v-if="drug._isTtacDrug" 
                            type="warning" 
                            size="small" 
                            effect="light"
                            style="font-size: 10px; padding: 2px 6px;"
                          >
                            NEW
                          </el-tag>
                        </div>
                        <div style="font-size: 12px; color: #999;">
                          GTIN: {{ drug.gtin_code || drug.gtin || 'N/A' }}
                          <span v-if="drug.generic_code"> | Generic: {{ drug.generic_code }}</span>
                          <span v-if="drug.generic_name"> | {{ drug.generic_name }}</span>
                          | {{ drug._isTtacDrug ? 'TTAC Database' : `Stock: ${drug.total_quantity || 0}` }}
                        </div>
                      </div>
                    </div>
                  </el-option>
                </el-select>
                <el-button 
                  size="small" 
                  type="primary" 
                  plain
                  @click="toggleSearchLanguage"
                  class="search-language-toggle"
                  :title="showPersianNamesInSearch ? 'Switch to English names' : 'Switch to Persian names'"
                >
                  {{ showPersianNamesInSearch ? 'EN' : 'فا' }}
                </el-button>
                <el-tooltip 
                  :content="ttacDrugsLoaded ? `TTAC database loaded (${ttacDrugsStore.drugs.length} drugs)` : 'Loading TTAC database...'"
                  placement="top"
                >
                  <el-button 
                    size="small" 
                    :type="ttacDrugsLoaded ? 'success' : 'warning'"
                    plain
                    class="ttac-status-indicator"
                    :loading="!ttacDrugsLoaded"
                  >
                    <el-icon v-if="ttacDrugsLoaded"><i-ep-check /></el-icon>
                    TTAC
                  </el-button>
                </el-tooltip>
                <el-icon v-if="barcodeParseSuccess" class="barcode-success-icon">
                  <i-ep-circle-check />
                </el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="extractedGtin"
              data-label="Extracted GTIN"
              :class="{ 'has-value': hasValue(extractedGtin), 'is-focused': focusedField === 'extractedGtin' }"
            >
              <el-input
                v-model="extractedGtin"
                placeholder=""
                readonly
                @focus="focusedField = 'extractedGtin'"
                @blur="focusedField = null"
                style="width: 100%"
                class="computed-field"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Drug Info Display when drug is selected -->
        <div v-if="factorForm.selectedDrug" class="drug-info-display">

                     <!-- First Row: 2 Columns -->
           <el-row :gutter="20" class="drug-info-row">
             <el-col :span="4" class="drug-info-col">
               <div class="drug-info-header">
                 <el-tag 
                   :type="isDrugExistingInPharmacy ? 'success' : 'warning'" 
                   size="large"
                   effect="light"
                   class="drug-status-tag"
                 >
                   <el-icon>
                     <i-ep-check v-if="isDrugExistingInPharmacy" />
                     <i-ep-plus v-else />
                   </el-icon>
                   {{ isDrugExistingInPharmacy ? 'Existing Drug' : 'New Drug' }}
                 </el-tag>
                 <el-button 
                   size="small" 
                   type="primary" 
                   plain
                   @click="toggleDisplayLanguage"
                   class="display-language-toggle"
                   :title="showPersianNamesInDisplay ? 'Switch to English names' : 'Switch to Persian names'"
                 >
                   {{ showPersianNamesInDisplay ? 'EN' : 'فا' }}
                 </el-button>
               </div>
             </el-col>
            <el-col :span="12" class="drug-info-col">
                               <div class="drug-name-info">
                   <div class="drug-name">
                     <span class="label">Drug:</span>
                     <span class="name">{{ 
                       showPersianNamesInDisplay 
                         ? (factorForm.selectedDrug.persian_name || 
                            factorForm.selectedDrug.persianName || 
                            factorForm.selectedDrug.name_persian ||
                            factorForm.selectedDrug.english_name ||
                            factorForm.selectedDrug.englishName ||
                            factorForm.selectedDrug.name_english)
                         : (factorForm.selectedDrug.english_name ||
                            factorForm.selectedDrug.englishName ||
                            factorForm.selectedDrug.name_english ||
                            factorForm.selectedDrug.persian_name || 
                            factorForm.selectedDrug.persianName || 
                            factorForm.selectedDrug.name_persian)
                     }}</span>
                   </div>
                 </div>
            </el-col>
            <el-col :span="8" class="drug-info-col">
                               <div class="company-info">
                   <div v-if="factorForm.selectedDrug.english_company_name || factorForm.selectedDrug.englishCompanyName || factorForm.selectedDrug.company_name_english || factorForm.selectedDrug.persian_company_name || factorForm.selectedDrug.persianCompanyName || factorForm.selectedDrug.company_name_persian" class="company-name">
                     <span class="label">Company:</span>
                     <span class="company">{{ 
                       showPersianNamesInDisplay 
                         ? (factorForm.selectedDrug.persian_company_name || 
                            factorForm.selectedDrug.persianCompanyName || 
                            factorForm.selectedDrug.company_name_persian ||
                            factorForm.selectedDrug.english_company_name ||
                            factorForm.selectedDrug.englishCompanyName ||
                            factorForm.selectedDrug.company_name_english)
                         : (factorForm.selectedDrug.english_company_name ||
                            factorForm.selectedDrug.englishCompanyName ||
                            factorForm.selectedDrug.company_name_english ||
                            factorForm.selectedDrug.persian_company_name || 
                            factorForm.selectedDrug.persianCompanyName || 
                            factorForm.selectedDrug.company_name_persian)
                     }}</span>
                   </div>
                 </div>
            </el-col>
          </el-row>

          <!-- Second Row: 4 Columns -->
          <el-row :gutter="20" class="drug-info-row">
            <el-col :span="4" class="drug-info-col">
              <div v-if="ttacDrugInfo && ttacDrugInfo.selling_price" class="price-info">
                <span class="label">TTAC Price:</span>
                <span class="price-value ttac-price">{{ formatPrice(ttacDrugInfo.selling_price) }}</span>
              </div>
            </el-col>
            <el-col :span="6" class="drug-info-col">
              <div v-if="isDrugExistingInPharmacy && factorForm.selectedDrug.maximum_price" class="price-info">
                <span class="label">Maximum Price:</span>
                <span class="price-value maximum-price">{{ formatPrice(factorForm.selectedDrug.maximum_price) }}</span>
              </div>
            </el-col>
            <el-col :span="6" class="drug-info-col">
              <div v-if="isDrugExistingInPharmacy" class="price-info">
                <span class="label">Pharmacy Stock:</span>
                <span class="stock-value">{{ formatNumber(factorForm.selectedDrug.total_quantity || 0) }} units</span>
              </div>
            </el-col>
                        <el-col :span="6" class="drug-info-col">
                <div v-if="isDrugExistingInPharmacy">
                  <el-popover
                    placement="bottom"
                    :width="800"
                    trigger="hover"
                    :show-after="300"
                    :hide-after="100"
                    popper-class="batches-popover"
                  >
                    <template #reference>
                      <el-button 
                        size="small" 
                        type="info" 
                        plain
                        class="batches-button"
                        :loading="batchesLoading"
                      >
                        <el-icon><i-ep-list /></el-icon>
                        Available Batches ({{ drugBatches.length }})
                      </el-button>
                    </template>
                    
                    <!-- Batches Table in Popover -->
                    <div class="batches-popover-content">
                      <div class="popover-header">
                        <h4>Stock Batches for {{ factorForm.selectedDrug.english_name || factorForm.selectedDrug.persian_name }}</h4>
                      </div>
                      
                      <div v-if="drugBatches.length > 0" class="batches-table-container">
                        <el-table 
                          :data="drugBatches" 
                          style="width: 100%" 
                          size="small"
                          border
                          stripe
                          max-height="400"
                          empty-text="No batches found">
                          
                          <el-table-column prop="batch_number" label="Batch Number" width="120">
                            <template #default="scope">
                              {{ scope.row.batch_number }}
                            </template>
                          </el-table-column>
                          
                          <el-table-column prop="price" label="Price" width="100">
                            <template #default="scope">
                              {{ formatNumber(scope.row.price) }}
                            </template>
                          </el-table-column>
                          
                          <el-table-column prop="expiry_date" label="Expiry Date" width="100">
                            <template #default="scope">
                              {{ formatDate(scope.row.expiry_date) }}
                            </template>
                          </el-table-column>
                          
                          <el-table-column label="Locations" min-width="250">
                            <template #default="scope">
                              <el-tag
                                v-for="(location, index) in scope.row.batch_locations"
                                :key="index"
                                size="small"
                                effect="light"
                                style="margin-right: 5px; margin-bottom: 5px;">
                                {{ location.storage_name }}: {{ location.quantity }}
                              </el-tag>
                              <span v-if="!scope.row.batch_locations || scope.row.batch_locations.length === 0" 
                                    class="text-muted">
                                No locations
                              </span>
                            </template>
                          </el-table-column>
                          
                          <el-table-column prop="quantity" label="Total Qty" width="80">
                            <template #default="scope">
                              {{ calculateBatchTotalQuantity(scope.row) }}
                            </template>
                          </el-table-column>
                          
                          <el-table-column label="Status" width="100">
                            <template #default="scope">
                              <el-tag :type="getBatchStockStatusType(scope.row)" size="small">
                                {{ getBatchStockStatus(scope.row) }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          
                        </el-table>
                      </div>
                      
                      <div v-else class="no-batches-message">
                        <el-empty description="No stock batches found for this drug" :image-size="80" />
                      </div>
                    </div>
                  </el-popover>
                </div>
              </el-col>
          </el-row>
        </div>

        <!-- All Fields in 4 Columns -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="batchNumber" 
              required
              data-label="Batch Number"
              data-required="true"
              :class="{ 'has-value': hasValue(factorForm.batchNumber), 'is-focused': focusedField === 'batchNumber' }"
            >
              <el-input
                v-model="factorForm.batchNumber"
                placeholder=""
                @focus="focusedField = 'batchNumber'"
                @blur="focusedField = null"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="expiryDate" 
              required
              data-label="Expiry Date"
              data-required="true"
              :class="{ 'has-value': hasValue(formattedExpiryDate), 'is-focused': focusedField === 'expiryDate' }"
            >
              <el-input
                v-model="formattedExpiryDate"
                placeholder=""
                @input="handleExpiryDateInput"
                @blur="validateAndFormatExpiryDate"
                @keyup.enter="validateAndFormatExpiryDate"
                @focus="focusedField = 'expiryDate'"
                maxlength="10"
                style="width: 100%"
                class="expiry-date-input"
              />
              <div v-if="jalaliExpiryDate" class="jalali-date-display">
                {{ jalaliExpiryDate }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="unitsPerBox" 
              required
              data-label="Units per Box"
              data-required="true"
              :class="{ 'has-value': hasValue(factorForm.unitsPerBox), 'is-focused': focusedField === 'unitsPerBox' }"
            >
              <el-input-number
                v-model="factorForm.unitsPerBox"
                :min="1"
                :controls="false"
                placeholder=""
                @change="calculateTotalQuantity"
                @focus="focusedField = 'unitsPerBox'"
                @blur="focusedField = null"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="storage" 
              required
              data-label="Storage"
              data-required="true"
              :class="{ 'has-value': hasValue(factorForm.storage), 'is-focused': focusedField === 'storage' }"
            >
              <el-select
                v-model="factorForm.storage"
                placeholder=""
                style="width: 100%"
                @focus="focusedField = 'storage'"
                @blur="focusedField = null"
              >
                <el-option
                  v-for="storage in availableStorages"
                  :key="storage.id"
                  :label="storage.name"
                  :value="storage.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
            <el-col :span="6">
            <el-form-item 
              prop="boxes" 
              required
              data-label="Boxes"
              data-required="true"
              :class="{ 'has-value': hasValue(factorForm.boxes), 'is-focused': focusedField === 'boxes' }"
            >
              <el-input-number
                v-model="factorForm.boxes"
                :min="1"
                :controls="false"
                placeholder=""
                @change="calculateTotalQuantity"
                @focus="focusedField = 'boxes'"
                @blur="focusedField = null"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="prizeBoxes"
              data-label="Prize Boxes"
              :class="{ 'has-value': hasValue(factorForm.prizeBoxes), 'is-focused': focusedField === 'prizeBoxes' }"
            >
              <el-input-number
                v-model="factorForm.prizeBoxes"
                :min="0"
                :controls="false"
                placeholder=""
                @change="calculateTotalQuantity"
                @focus="focusedField = 'prizeBoxes'"
                @blur="focusedField = null"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="buyPrice" 
              required
              data-label="Buy Price (per box)"
              data-required="true"
              :class="{ 'has-value': hasValue(factorForm.buyPrice), 'is-focused': focusedField === 'buyPrice' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="factorForm.buyPrice ? formatCurrency(factorForm.buyPrice) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'buyPrice')"
                  @focus="handleCurrencyFocus('buyPrice')"
                  @blur="handleCurrencyBlur('buyPrice')"
                  style="width: 100%"
                  class="currency-input"
                />
                <div v-if="factorForm.buyPrice" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="sellPrice" 
              required
              data-label="Sell Price (per box)"
              data-required="true"
              :class="{ 'has-value': hasValue(factorForm.sellPrice), 'is-focused': focusedField === 'sellPrice' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="factorForm.sellPrice ? formatCurrency(factorForm.sellPrice) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'sellPrice')"
                  @focus="handleCurrencyFocus('sellPrice')"
                  @blur="handleCurrencyBlur('sellPrice')"
                  style="width: 100%"
                  class="currency-input"
                />
                <div v-if="factorForm.sellPrice" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <!-- Empty column for spacing/future use -->
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="discount"
              data-label="Discount"
              :class="{ 'has-value': hasValue(factorForm.discount), 'is-focused': focusedField === 'discount' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="factorForm.discount ? formatCurrency(factorForm.discount) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'discount')"
                  @focus="handleCurrencyFocus('discount')"
                  @blur="handleCurrencyBlur('discount')"
                  style="width: 100%"
                  class="currency-input"
                />
                <div v-if="factorForm.discount" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="tax"
              data-label="Tax"
              :class="{ 'has-value': hasValue(factorForm.tax), 'is-focused': focusedField === 'tax' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="factorForm.tax ? formatCurrency(factorForm.tax) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'tax')"
                  @focus="handleCurrencyFocus('tax')"
                  @blur="handleCurrencyBlur('tax')"
                  style="width: 100%"
                  class="currency-input"
                />
                <div v-if="factorForm.tax" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <!-- Empty column for spacing/future use -->
          </el-col>
        </el-row>

        <!-- Computed Fields Row 1 -->
        <el-row :gutter="20" class="computed-fields-section">
          <el-col :span="6">
            <el-form-item 
              prop="totalQuantity"
              data-label="Total Quantity"
              :class="{ 'has-value': hasValue(factorForm.totalQuantity), 'is-focused': focusedField === 'totalQuantity' }"
            >
              <el-input
                v-model="factorForm.totalQuantity"
                placeholder=""
                readonly
                @focus="focusedField = 'totalQuantity'"
                @blur="focusedField = null"
                style="width: 100%"
                class="computed-field"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="buyPricePerUnit"
              data-label="Buy Price per Unit"
              :class="{ 'has-value': hasValue(computedFields.buyPricePerUnit), 'is-focused': focusedField === 'buyPricePerUnit' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="computedFields.buyPricePerUnit"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'buyPricePerUnit'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="computedFields.buyPricePerUnit" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="sellPricePerUnit"
              data-label="Sell Price per Unit"
              :class="{ 'has-value': hasValue(computedFields.sellPricePerUnit), 'is-focused': focusedField === 'sellPricePerUnit' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="computedFields.sellPricePerUnit"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'sellPricePerUnit'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="computedFields.sellPricePerUnit" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="totalAmountBuy"
              data-label="Total Amount Buy"
              :class="{ 'has-value': hasValue(computedFields.totalAmountBuy), 'is-focused': focusedField === 'totalAmountBuy' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="computedFields.totalAmountBuy"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalAmountBuy'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="computedFields.totalAmountBuy" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="netAmountPaid"
              data-label="Net Amount Paid"
              :class="{ 'has-value': hasValue(computedFields.netAmountPaid), 'is-focused': focusedField === 'netAmountPaid' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="computedFields.netAmountPaid"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'netAmountPaid'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="computedFields.netAmountPaid" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="profit"
              data-label="Profit"
              :class="{ 'has-value': hasValue(computedFields.profit), 'is-focused': focusedField === 'profit' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="computedFields.profit"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'profit'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="computedFields.profit" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="profitPercentage"
              data-label="Profit Percentage"
              :class="{ 'has-value': hasValue(computedFields.profitPercentage), 'is-focused': focusedField === 'profitPercentage' }"
            >
              <el-input
                v-model="computedFields.profitPercentage"
                placeholder=""
                readonly
                @focus="focusedField = 'profitPercentage'"
                @blur="focusedField = null"
                style="width: 100%"
                class="computed-field"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Computed Fields Row 2 -->
        <el-row :gutter="20">

          <el-col :span="6">
            <!-- Empty column for spacing/future use -->
          </el-col>
          <el-col :span="6">
            <!-- Empty column for spacing/future use -->
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- Factor Items Table -->
    <el-card class="factor-history-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Factor Items ({{ totalRecords }})</span>
          <div class="header-buttons">
            <el-button 
              size="small" 
              type="success"
              @click="finalizeFactor"
              :disabled="!isFactorEditable || factorHistory.length === 0"
              class="finalize-button"
            >
              <el-icon><Check /></el-icon>
              Finalize Factor
            </el-button>
          </div>
        </div>
      </template>

      <el-table 
        :data="factorHistory" 
        stripe 
        style="width: 100%"
        :loading="historyLoading"
        empty-text="No factor items added yet"
      >
        <el-table-column prop="drug_name" label="Drug" width="200" />
        <el-table-column prop="gtin_code" label="GTIN" width="120" />
        <el-table-column prop="storage_name" label="Storage" width="120" />
        <el-table-column prop="boxes" label="Boxes" width="80" align="center" />
        <el-table-column prop="prize_boxes" label="Prize" width="80" align="center" />
        <el-table-column prop="units_per_box" label="Units/Box" width="100" align="center" />
        <el-table-column prop="total_quantity" label="Total Qty" width="100" align="center" />
        <el-table-column prop="buy_price_per_box" label="Buy Price" width="120" align="right">
          <template #default="scope">
            {{ formatPrice(scope.row.buy_price_per_box) }}
          </template>
        </el-table-column>
        <el-table-column prop="sell_price_per_box" label="Sell Price" width="120" align="right">
          <template #default="scope">
            {{ formatPrice(scope.row.sell_price_per_box) }}
          </template>
        </el-table-column>
        <el-table-column prop="batch_number" label="Batch" width="120" />
        <el-table-column prop="expiry_date" label="Expiry" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.expiry_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="Discount" width="100" align="right">
          <template #default="scope">
            {{ scope.row.discount ? formatPrice(scope.row.discount) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="tax" label="Tax" width="100" align="right">
          <template #default="scope">
            {{ scope.row.tax ? formatPrice(scope.row.tax) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" align="center">
          <template #default="scope">
            <el-button 
              size="small" 
              @click="editFactorItem(scope.$index)"
              :disabled="!isFactorEditable"
            >
              Edit
            </el-button>
            <el-button 
              size="small" 
              type="danger"
              @click="deleteFactorItem(scope.$index)"
              :disabled="!isFactorEditable"
            >
              Delete
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

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
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, ArrowRight, Plus, Switch, InfoFilled, Printer, 
  ArrowDown, Document, Tickets, Delete, Close, Check, Edit 
} from '@element-plus/icons-vue'
import { factorsAPI, factorHelpers } from '@/api/factors'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { useStorageStore } from '@/stores/storageStore'
import { useDistributionCompanyStore } from '@/stores/distributionCompanyStore'
import { useTtacDrugsStore } from '@/store/ttacDrugs'
import { formatDateJalali } from '@/utils/dateUtils'
import AddMedicineDialog from '@/components/medicine/AddMedicineDialog.vue'

const props = defineProps({
  tabId: String,
  initialFactorNumber: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['title-change', 'unsaved-changes', 'navigation-attempt', 'factor-deleted'])

// Stores
const pharmacyDrugStore = usePharmacyDrugStore()
const storageStore = useStorageStore()
const distributionCompanyStore = useDistributionCompanyStore()
const ttacDrugsStore = useTtacDrugsStore()

// Reactive state
const factorNumber = ref(props.initialFactorNumber || 1)
const currentFactorId = ref(null)
const factorStatus = ref('draft')
const factorHistory = ref([])
const totalRecords = ref(0)
const processing = ref(false)
const historyLoading = ref(false)
const isEditing = ref(false)
const editingFactorIndex = ref(-1)

// Timestamps
const createdAt = ref(new Date().toISOString())
const updatedAt = ref(new Date().toISOString())
const showCreated = ref(true)

// Form state
const factorForm = reactive({
  gtinCode: '',
  selectedDrug: null,
  storage: null,
  boxes: null,
  prizeBoxes: null,
  unitsPerBox: null,
  totalQuantity: null,
  buyPrice: null,
  sellPrice: null,
  discount: null,
  tax: null,
  expiryDate: '',
  batchNumber: ''
})

// Drug search state
const selectedPharmacyDrug = ref(null)
const pharmacySearchResults = ref([])
const ttacSearchResults = ref([])
const combinedSearchResults = ref([])
const isSearchingPharmacy = ref(false)
const showPersianNamesInSearch = ref(false)
const showPersianNamesInDisplay = ref(true)
const isSearching = ref(false)
const drugFound = ref(false)
const barcodeParseSuccess = ref(false)
const ttacDrugInfo = ref(null)
const ttacDrugsLoaded = ref(false)
const pricesAutoPopulated = ref(false) // Track if prices were auto-populated
let searchTimeout = null
let lastSearchQuery = ''

// Validation state
const isFactorNumberInvalid = ref(false)
const isCheckingFactorExists = ref(false)
const lastValidFactorNumber = ref(1)

// Focus tracking for floating labels
const focusedField = ref(null)

// Formatted expiry date for input
const formattedExpiryDate = ref('')

// Computed fields for display
const computedFields = reactive({
  buyPricePerUnit: '',
  sellPricePerUnit: '',
  totalAmountBuy: '',
  netAmountPaid: '',
  profit: '',
  profitPercentage: ''
})

// Factor computed fields for header
const factorComputedFields = reactive({
  totalDiscounts: '',
  totalTax: '',
  totalProfit: '',
  totalNetAmountPaid: ''
})

// Available storages
const availableStorages = ref([])

// Header form data
const headerForm = reactive({
  factorType: '',
  distributionCompany: null,
  factorNumber: '',
  paymentType: '',
  factorBuyDate: '',
  factorPaymentDate: '',
  additionalDiscount: null,
  additionalTax: null
})

// Formatted dates for header
const formattedFactorBuyDate = ref('')
const formattedFactorPaymentDate = ref('')

// Jalali dates for display
const jalaliFactorBuyDate = ref('')
const jalaliFactorPaymentDate = ref('')
const jalaliExpiryDate = ref('')

// Factor type options
const factorTypeOptions = [
  { value: 'drug', label: 'Drug' },
  { value: 'cosmetic', label: 'Cosmetic' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'herbal', label: 'Herbal' },
  { value: 'others', label: 'Others' }
]

// Payment type options
const paymentTypeOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'non-cash', label: 'Non-Cash' }
]

// Dialog state
const editDialogVisible = ref(false)
const selectedDrugId = ref(null)

// Unified search field ref
const unifiedSearchRef = ref(null)

// Extracted GTIN from barcode
const extractedGtin = ref('')

// Batches state
const drugBatches = ref([])
const batchesLoading = ref(false)

// Computed properties
const isFactorEditable = computed(() => factorStatus.value === 'draft')
const isFormValid = computed(() => {
  return factorForm.gtinCode && 
         factorForm.selectedDrug && 
         factorForm.storage && 
         factorForm.boxes && factorForm.boxes > 0 && 
         factorForm.unitsPerBox && factorForm.unitsPerBox > 0 && 
         factorForm.buyPrice !== null && factorForm.buyPrice >= 0 && 
         factorForm.sellPrice !== null && factorForm.sellPrice >= 0 && 
         factorForm.expiryDate && 
         factorForm.batchNumber
})

// Computed property for distribution companies to ensure reactivity
const distributionCompanies = computed(() => {
  console.log('Computed distribution companies:', distributionCompanyStore.companies)
  return distributionCompanyStore.companies || []
})

// Drug Info Display computed properties
const isDrugExistingInPharmacy = computed(() => {
  return factorForm.selectedDrug && 
         factorForm.selectedDrug.id && 
         factorForm.selectedDrug.total_quantity !== undefined &&
         !factorForm.selectedDrug._isTtacDrug
})

// Helper functions for formatting
const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString()
}

const formatPrice = (value) => {
  if (value === null || value === undefined) return 'N/A'
  return Number(value).toLocaleString() + ' ریال'
}

// Format currency with thousands separator only (no ریال suffix)
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return ''
  return Number(value).toLocaleString()
}

// Format number with thousands separator only
const formatNumberWithSeparator = (value) => {
  if (value === null || value === undefined || value === '') return ''
  return Number(value).toLocaleString()
}

// Currency input handlers
const handleCurrencyInput = (value, field) => {
  // Remove all non-digit characters except commas and periods
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/,/g, '')
  const numericValue = parseFloat(cleanValue) || 0
  
  factorForm[field] = numericValue
  
  // If user manually changes buy or sell price, reset auto-population flag
  if (field === 'buyPrice' || field === 'sellPrice') {
    pricesAutoPopulated.value = false
  }
  
  calculateComputedFields()
}

const handleCurrencyFocus = (field) => {
  focusedField.value = field
}

const handleCurrencyBlur = (field) => {
  focusedField.value = null
}

// Header form currency input handlers
const handleHeaderCurrencyInput = (value, field) => {
  // Remove all non-digit characters except commas and periods
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/,/g, '')
  const numericValue = parseFloat(cleanValue) || 0
  
  headerForm[field] = numericValue
  
  // Recalculate factor computed fields when additional discount/tax changes
  calculateFactorComputedFields()
}

const handleHeaderCurrencyFocus = (field) => {
  focusedField.value = field
}

const handleHeaderCurrencyBlur = (field) => {
  focusedField.value = null
}

// Helper function to check if field has value for floating label
const hasValue = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return !isNaN(value) // Only valid numbers count as having value
  return Boolean(value)
}

// Methods
const calculateTotalQuantity = () => {
  const boxes = factorForm.boxes || 0
  const prizeBoxes = factorForm.prizeBoxes || 0
  const unitsPerBox = factorForm.unitsPerBox || 0
  
  if (boxes > 0 || prizeBoxes > 0) {
    const totalBoxes = boxes + prizeBoxes
    factorForm.totalQuantity = totalBoxes * unitsPerBox
  } else {
    factorForm.totalQuantity = null
  }
  
  // If unitsPerBox changed and we have TTAC data, recalculate prices
  if (ttacDrugInfo.value && factorForm.selectedDrug) {
    autopopulatePricesFromTtac(ttacDrugInfo.value)
  }
  
  // Also calculate computed fields
  calculateComputedFields()
}

const calculateComputedFields = () => {
  const boxes = factorForm.boxes || 0
  const prizeBoxes = factorForm.prizeBoxes || 0
  const unitsPerBox = factorForm.unitsPerBox || 0
  const buyPricePerBox = factorForm.buyPrice || 0
  const sellPricePerBox = factorForm.sellPrice || 0
  const discount = factorForm.discount || 0
  const tax = factorForm.tax || 0

  // 1. Buy price per unit = (buy price per box) / (units per box)
  if (unitsPerBox > 0 && buyPricePerBox > 0) {
    const buyPricePerUnit = buyPricePerBox / unitsPerBox
    computedFields.buyPricePerUnit = buyPricePerUnit.toLocaleString('en-US')
  } else {
    computedFields.buyPricePerUnit = ''
  }

  // 2. Sell price per unit = (sell price per box) / (units per box)
  if (unitsPerBox > 0 && sellPricePerBox > 0) {
    const sellPricePerUnit = sellPricePerBox / unitsPerBox
    computedFields.sellPricePerUnit = sellPricePerUnit.toLocaleString('en-US')
  } else {
    computedFields.sellPricePerUnit = ''
  }

  // 3. Total amount buy = (buy price per box) * (boxes)
  if (boxes > 0 && buyPricePerBox > 0) {
    const totalAmountBuy = buyPricePerBox * boxes
    computedFields.totalAmountBuy = totalAmountBuy.toLocaleString('en-US')
  } else {
    computedFields.totalAmountBuy = ''
  }

  // 4. Net amount paid = (total amount buy) + (tax) - (discount)
  if (boxes > 0 && buyPricePerBox > 0) {
    const totalAmountBuy = buyPricePerBox * boxes
    const netAmountPaid = totalAmountBuy + tax - discount
    computedFields.netAmountPaid = netAmountPaid.toLocaleString('en-US')
  } else {
    computedFields.netAmountPaid = ''
  }

  // 5. Profit = ((sell price per box) * (boxes + prize boxes)) - (Net amount paid)
  if ((boxes > 0 || prizeBoxes > 0) && sellPricePerBox > 0 && buyPricePerBox > 0) {
    const totalSellAmount = sellPricePerBox * (boxes + prizeBoxes)
    const totalAmountBuy = buyPricePerBox * boxes
    const netAmountPaid = totalAmountBuy + tax - discount
    const profit = totalSellAmount - netAmountPaid
    computedFields.profit = profit.toLocaleString('en-US')
  } else {
    computedFields.profit = ''
  }

  // 6. Profit percentage = ((sell price per unit - buy price per unit) / buy price per unit) * 100
  if (unitsPerBox > 0 && buyPricePerBox > 0 && sellPricePerBox > 0) {
    const buyPricePerUnit = buyPricePerBox / unitsPerBox
    const sellPricePerUnit = sellPricePerBox / unitsPerBox
    
    // Calculate profit margin percentage
    const profitMargin = ((sellPricePerUnit - buyPricePerUnit) / buyPricePerUnit) * 100
    
    // Format the percentage with proper decimal places
    if (isFinite(profitMargin)) {
      computedFields.profitPercentage = profitMargin.toFixed(2) + '%'
    } else {
      computedFields.profitPercentage = '0.0%'
    }
  } else {
    computedFields.profitPercentage = ''
  }
}

// Calculate factor computed fields
const calculateFactorComputedFields = () => {
  // Sum all discounts from factor items
  const itemsDiscount = factorHistory.value.reduce((sum, item) => {
    return sum + (item.discount || 0)
  }, 0)
  
  // Sum all taxes from factor items
  const itemsTax = factorHistory.value.reduce((sum, item) => {
    return sum + (item.tax || 0)
  }, 0)
  
  // Sum all profits from factor items
  const itemsProfit = factorHistory.value.reduce((sum, item) => {
    const boxes = item.boxes || 0
    const prizeBoxes = item.prize_boxes || 0
    const sellPrice = item.sell_price_per_box || 0
    const buyPrice = item.buy_price_per_box || 0
    const discount = item.discount || 0
    const tax = item.tax || 0
    
    const totalSellAmount = sellPrice * (boxes + prizeBoxes)
    const totalBuyAmount = buyPrice * boxes
    const netAmountPaid = totalBuyAmount + tax - discount
    const profit = totalSellAmount - netAmountPaid
    
    return sum + profit
  }, 0)
  
  // Sum all net amount paid from factor items
  const itemsNetAmountPaid = factorHistory.value.reduce((sum, item) => {
    const boxes = item.boxes || 0
    const buyPrice = item.buy_price_per_box || 0
    const discount = item.discount || 0
    const tax = item.tax || 0
    
    const totalBuyAmount = buyPrice * boxes
    const netAmountPaid = totalBuyAmount + tax - discount
    
    return sum + netAmountPaid
  }, 0)
  
  // Calculate totals including additional amounts
  const additionalDiscount = headerForm.additionalDiscount || 0
  const additionalTax = headerForm.additionalTax || 0
  
  // 1. Total discounts = items discounts + additional discount
  const totalDiscounts = itemsDiscount + additionalDiscount
  factorComputedFields.totalDiscounts = totalDiscounts > 0 ? totalDiscounts.toLocaleString('en-US') : ''
  
  // 2. Total tax = items tax + additional tax
  const totalTax = itemsTax + additionalTax
  factorComputedFields.totalTax = totalTax > 0 ? totalTax.toLocaleString('en-US') : ''
  
  // 3. Total profit = items profit - additional tax + additional discount
  const totalProfit = itemsProfit - additionalTax + additionalDiscount
  factorComputedFields.totalProfit = totalProfit !== 0 ? totalProfit.toLocaleString('en-US') : ''
  
  // 4. Total net amount paid = items net amount paid - additional discount + additional tax
  const totalNetAmountPaid = itemsNetAmountPaid - additionalDiscount + additionalTax
  factorComputedFields.totalNetAmountPaid = totalNetAmountPaid > 0 ? totalNetAmountPaid.toLocaleString('en-US') : ''
}

// Pre-computed search cache for pharmacy drugs
const pharmacySearchCache = new Map()

// Fast flexible search function with early exit optimization
const flexibleMatch = (searchText, queryTokens) => {
  if (!searchText || queryTokens.length === 0) return false
  
  // Early exit: check shortest token first (most likely to fail fast)
  const sortedTokens = queryTokens.slice().sort((a, b) => a.length - b.length)
  
  for (let i = 0; i < sortedTokens.length; i++) {
    if (!searchText.includes(sortedTokens[i])) {
      return false // Exit immediately on first non-match
    }
  }
  return true
}

// Create and cache searchable text from drug data
const getSearchableText = (drug) => {
  const drugId = drug.id || drug.gtin_code
  if (!drugId) return ''
  
  // Check cache first
  if (pharmacySearchCache.has(drugId)) {
    return pharmacySearchCache.get(drugId)
  }
  
  // Create searchable text only if not cached
  const parts = [
    drug.english_name,
    drug.persian_name,
    drug.gtin_code,
    drug.gtin,
    drug.generic_code,
    drug.generic_name,
    drug.english_company_name,
    drug.englishCompanyName,
    drug.company_name_english,
    drug.persian_company_name,
    drug.persianCompanyName,
    drug.company_name_persian,
    // Add barcode-related fields for comprehensive search
    drug.barcode,
    drug.barcode_data,
    drug.ean_code,
    drug.upc_code
  ]
  
  const searchText = parts.filter(Boolean).join(' ').toLowerCase()
  
  // Cache the result
  pharmacySearchCache.set(drugId, searchText)
  return searchText
}

// Pre-processed TTAC search cache
const ttacSearchCache = new Map()

// Pre-process TTAC drugs for faster searching
const preprocessTtacDrugs = () => {
  if (!ttacDrugsLoaded.value || ttacDrugsStore.drugs.length === 0) return
  
  ttacDrugsStore.drugs.forEach(ttacDrug => {
    if (!ttacSearchCache.has(ttacDrug.gtin_code)) {
      const searchableText = [
        ttacDrug.name_persian,
        ttacDrug.name_english,
        ttacDrug.gtin_code,
        ttacDrug.generic_code,
        ttacDrug.company_name_persian,
        ttacDrug.company_name_english,
        // Add barcode-related fields for TTAC drugs
        ttacDrug.barcode,
        ttacDrug.barcode_data,
        ttacDrug.ean_code,
        ttacDrug.upc_code
      ].filter(Boolean).join(' ').toLowerCase()
      
      ttacSearchCache.set(ttacDrug.gtin_code, {
        searchableText,
        processedDrug: {
          ...ttacDrug,
          _isTtacDrug: true,
          id: `ttac_${ttacDrug.gtin_code}`,
          english_name: ttacDrug.name_english,
          persian_name: ttacDrug.name_persian,
          total_quantity: 0
        }
      })
    }
  })
}

// Debounced search function
let searchDebounceTimeout = null
const debouncedSearchPharmacyDrugs = (query) => {
  // Clear previous timeout
  if (searchDebounceTimeout) {
    clearTimeout(searchDebounceTimeout)
  }
  
  // Set new timeout for debounced search
  searchDebounceTimeout = setTimeout(() => {
    searchPharmacyDrugs(query)
  }, 150) // 150ms debounce - faster than before
}

// Unified search handler that detects barcode vs search
const handleUnifiedSearch = (query) => {
  if (!query) {
    combinedSearchResults.value = []
    return
  }
  
  // Check if input is a barcode (more than 30 characters)
  if (query.length > 30) {
    // Treat as barcode - parse it
    parseUnifiedBarcode(query)
  } else {
    // Treat as regular search
    debouncedSearchPharmacyDrugs(query)
  }
}

// Handle paste events in unified search field
const handleUnifiedPaste = (event) => {
  // Let the paste happen first, then check the content
  nextTick(() => {
    const pastedText = event.clipboardData?.getData('text') || ''
    if (pastedText.length > 30) {
      // It's a barcode, parse it
      parseUnifiedBarcode(pastedText)
    }
  })
}

const searchPharmacyDrugs = async (query) => {
  if (!query) {
    pharmacySearchResults.value = []
    ttacSearchResults.value = []
    combinedSearchResults.value = []
    lastSearchQuery = ''
    return
  }

  // Skip search if query hasn't changed (debouncing)
  if (query === lastSearchQuery) {
    return
  }
  lastSearchQuery = query

  isSearchingPharmacy.value = true
  try {
    // Load pharmacy drugs if not already loaded
    if (pharmacyDrugStore.drugs.length === 0) {
      await pharmacyDrugStore.fetchDrugs()
    }
    
    // Check if query looks like a GTIN code (14 digits) or barcode
    const isGtinQuery = /^\d{14}$/.test(query.trim())
    const isBarcodeQuery = query.length > 15 && /^\d+$/.test(query.trim())
    
    // Pre-process query tokens once
    const queryTokens = query.toLowerCase().split(/\s+/).filter(token => token.length > 0)
    if (queryTokens.length === 0) {
      pharmacySearchResults.value = []
      ttacSearchResults.value = []
      combinedSearchResults.value = []
      return
    }
    
    // Search pharmacy drugs with optimized filtering
    const pharmacyResults = []
    const exactGtinMatches = []
    const pharmacyGtins = new Set() // Track GTINs to avoid duplicates in TTAC search
    
    for (let i = 0; i < pharmacyDrugStore.drugs.length; i++) {
      const drug = pharmacyDrugStore.drugs[i]
      
      // Check for exact GTIN match first (highest priority)
      if (isGtinQuery && (drug.gtin_code === query.trim() || drug.gtin === query.trim())) {
        exactGtinMatches.push(drug)
        if (drug.gtin_code) {
          pharmacyGtins.add(drug.gtin_code)
        }
        continue
      }
      
             // Check for barcode match if it's a barcode query
       if (isBarcodeQuery) {
         // Extract GTIN from barcode and check
         const extractedGtin = query.substring(2, 16)
        if (drug.gtin_code === extractedGtin || drug.gtin === extractedGtin) {
          exactGtinMatches.push(drug)
          if (drug.gtin_code) {
            pharmacyGtins.add(drug.gtin_code)
          }
          continue
        }
      }
      
      // Regular flexible text search
      const searchableText = getSearchableText(drug)
      if (flexibleMatch(searchableText, queryTokens)) {
        pharmacyResults.push(drug)
        if (drug.gtin_code) {
          pharmacyGtins.add(drug.gtin_code)
        }
        
        // Limit pharmacy results to prevent UI lag
        if (pharmacyResults.length >= 50) break
      }
    }
    
    // Combine exact matches first, then regular results
    pharmacySearchResults.value = [...exactGtinMatches, ...pharmacyResults]
    
    // Search TTAC drugs if loaded (minimum 2 characters for TTAC search)
    let ttacResults = []
    const exactTtacMatches = []
    
    if (ttacDrugsLoaded.value && query.length >= 2) {
      // Ensure TTAC drugs are pre-processed
      if (ttacSearchCache.size === 0) {
        preprocessTtacDrugs()
      }
      
      // Search pre-processed TTAC cache
      for (const [gtinCode, cached] of ttacSearchCache) {
        // Skip if already exists in pharmacy
        if (pharmacyGtins.has(gtinCode)) continue
        
        // Check for exact GTIN match first
        if (isGtinQuery && gtinCode === query.trim()) {
          exactTtacMatches.push(cached.processedDrug)
          continue
        }
        
                 // Check for barcode match if it's a barcode query
         if (isBarcodeQuery) {
           const extractedGtin = query.substring(2, 16)
          if (gtinCode === extractedGtin) {
            exactTtacMatches.push(cached.processedDrug)
            continue
          }
        }
        
        // Regular flexible text search
        if (flexibleMatch(cached.searchableText, queryTokens)) {
          ttacResults.push(cached.processedDrug)
          
          // Limit TTAC results to prevent UI lag
          if (ttacResults.length >= 20) break
        }
      }
    }
    
    ttacSearchResults.value = [...exactTtacMatches, ...ttacResults]
    
    // Combine results: exact matches first, then pharmacy drugs, then TTAC drugs
    combinedSearchResults.value = [
      ...exactGtinMatches,
      ...exactTtacMatches,
      ...pharmacyResults,
      ...ttacResults
    ]
    
  } catch (error) {
    console.error('Drug search failed:', error)
    pharmacySearchResults.value = []
    ttacSearchResults.value = []
    combinedSearchResults.value = []
  } finally {
    isSearchingPharmacy.value = false
  }
}

const onPharmacyDrugSelect = async (drugId) => {
  if (!drugId) {
    selectedPharmacyDrug.value = null
    return
  }

  const drug = combinedSearchResults.value.find(d => d.id === drugId)
  if (drug) {
    factorForm.gtinCode = drug.gtin_code || ''
    
    if (drug._isTtacDrug) {
      // Handle TTAC drug selection (new drug)
      factorForm.selectedDrug = {
        gtin_code: drug.gtin_code,
        name_persian: drug.name_persian,
        name_english: drug.name_english,
        company_name_english: drug.company_name_english,
        company_name_persian: drug.company_name_persian,
        units_per_box: drug.units_per_box,
        selling_price: drug.selling_price,
        _isTtacDrug: true
      }
      factorForm.unitsPerBox = drug.units_per_box || null
      ttacDrugInfo.value = drug
      drugFound.value = true
      
      // Auto-populate prices from TTAC data (per box calculation)
      autopopulatePricesFromTtac(drug, true)
      
      ElMessage.info(`New drug selected from TTAC: ${drug.name_persian || drug.name_english}`)
    } else {
      // Handle pharmacy drug selection (existing drug)
      factorForm.selectedDrug = drug
      factorForm.unitsPerBox = drug.num_per_box || null
      drugFound.value = true
      
      // Fetch TTAC drug information for price comparison
      await fetchTtacDrugInfo(drug.gtin_code)
      
      // Auto-populate prices from TTAC data if available
      if (ttacDrugInfo.value) {
        autopopulatePricesFromTtac(ttacDrugInfo.value, true)
      }
      
      // Fetch batches for existing pharmacy drug
      await fetchDrugBatches(drug.id)
      
      ElMessage.success(`Selected existing drug: ${drug.english_name || drug.persian_name}`)
    }
    
    selectedPharmacyDrug.value = null
  }
}

const toggleSearchLanguage = () => {
  showPersianNamesInSearch.value = !showPersianNamesInSearch.value
}

const toggleDisplayLanguage = () => {
  showPersianNamesInDisplay.value = !showPersianNamesInDisplay.value
}

// Get company name based on language preference and drug type
const getCompanyName = (drug) => {
  if (!drug) return ''
  
  if (showPersianNamesInSearch.value) {
    // Show Persian company name first, fallback to English
    return drug.persian_company_name || 
           drug.persianCompanyName || 
           drug.company_name_persian ||
           drug.english_company_name ||
           drug.englishCompanyName ||
           drug.company_name_english ||
           ''
  } else {
    // Show English company name first, fallback to Persian
    return drug.english_company_name ||
           drug.englishCompanyName ||
           drug.company_name_english ||
           drug.persian_company_name || 
           drug.persianCompanyName || 
           drug.company_name_persian ||
           ''
  }
}

// Batch-related methods
const fetchDrugBatches = async (drugId) => {
  if (!drugId) {
    drugBatches.value = []
    return
  }

  batchesLoading.value = true
  try {
    await pharmacyDrugStore.fetchBatches(drugId)
    
    // Filter batches for this specific drug
    const allBatches = pharmacyDrugStore.batches
    drugBatches.value = allBatches.filter(batch => {
      const batchDrugId = batch.drug
      const currentDrugId = parseInt(drugId)
      return batchDrugId === currentDrugId
    })
    
    console.log(`Fetched ${drugBatches.value.length} batches for drug ID ${drugId}`)
  } catch (error) {
    console.error('Error fetching drug batches:', error)
    drugBatches.value = []
  } finally {
    batchesLoading.value = false
  }
}

// Calculate total quantity for a batch from its locations
const calculateBatchTotalQuantity = (batch) => {
  if (!batch.batch_locations || batch.batch_locations.length === 0) {
    return batch.quantity || 0
  }
  
  return batch.batch_locations.reduce((total, location) => {
    return total + (location.quantity || 0)
  }, 0)
}

// Get stock status for a batch
const getBatchStockStatus = (batch) => {
  const quantity = calculateBatchTotalQuantity(batch)
  
  if (!quantity || quantity <= 0) {
    return 'Out of Stock'
  } else if (quantity < 50) {
    return 'Low Stock'
  } else {
    return 'In Stock'
  }
}

// Get stock status type for styling
const getBatchStockStatusType = (batch) => {
  const quantity = calculateBatchTotalQuantity(batch)
  
  if (!quantity || quantity <= 0) {
    return 'danger'
  } else if (quantity < 50) {
    return 'warning'
  } else {
    return 'success'
  }
}

// Format date utility
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const fetchTtacDrugInfo = async (gtinCode) => {
  if (!gtinCode) {
    ttacDrugInfo.value = null
    return
  }
  
  try {
    await ttacDrugsStore.ensureDataAvailable()
    const ttacDrug = ttacDrugsStore.findByGtinWithExtraction(gtinCode)
    ttacDrugInfo.value = ttacDrug
    
    // Auto-populate prices when TTAC data is fetched
    if (ttacDrug) {
      autopopulatePricesFromTtac(ttacDrug, true)
    }
  } catch (error) {
    console.error('Error fetching TTAC drug info:', error)
    ttacDrugInfo.value = null
  }
}

// Auto-populate buy and sell prices from TTAC data
const autopopulatePricesFromTtac = (ttacDrug, forceUpdate = false) => {
  if (!ttacDrug || !factorForm.unitsPerBox) {
    return
  }
  
  // Only auto-update if prices haven't been manually set or if forced
  if (!forceUpdate && !pricesAutoPopulated.value && (factorForm.buyPrice || factorForm.sellPrice)) {
    return
  }
  
  const unitsPerBox = factorForm.unitsPerBox
  let pricesUpdated = false
  
  // Auto-populate buy price (buying_price * units_per_box)
  if (ttacDrug.buying_price && ttacDrug.buying_price > 0) {
    const buyPricePerBox = ttacDrug.buying_price * unitsPerBox
    factorForm.buyPrice = buyPricePerBox
    pricesUpdated = true
  }
  
  // Auto-populate sell price (selling_price * units_per_box)
  if (ttacDrug.selling_price && ttacDrug.selling_price > 0) {
    const sellPricePerBox = ttacDrug.selling_price * unitsPerBox
    factorForm.sellPrice = sellPricePerBox
    pricesUpdated = true
  }
  
  if (pricesUpdated) {
    pricesAutoPopulated.value = true
    
    // Recalculate computed fields after price update
    calculateComputedFields()
    
    // Create detailed message about which prices were updated
    const buyPrice = ttacDrug.buying_price ? `Buy: ${(ttacDrug.buying_price * unitsPerBox).toLocaleString()} ریال` : ''
    const sellPrice = ttacDrug.selling_price ? `Sell: ${(ttacDrug.selling_price * unitsPerBox).toLocaleString()} ریال` : ''
    const priceInfo = [buyPrice, sellPrice].filter(Boolean).join(', ')

  }
}

// Unified barcode parsing function
const parseUnifiedBarcode = (barcodeData) => {
  if (!barcodeData) {
    barcodeParseSuccess.value = false
    return
  }

  try {
    // Step 1: Extract GTIN code (characters 3-16, 0-indexed: 2-16)
    const gtinCode = barcodeData.substring(2, 16)
    
    // Step 2: Extract expiry date (characters 41-46, 0-indexed: 40-46)
    let expiryDateStr = ''
    if (barcodeData.length >= 46) {
      const yymmdd = barcodeData.substring(40, 46)
      if (yymmdd.length === 6 && /^\d{6}$/.test(yymmdd)) {
        const yy = yymmdd.substring(0, 2)
        const mm = yymmdd.substring(2, 4)
        const dd = yymmdd.substring(4, 6)
        
        // Convert YY to 20YY format
        const year = `20${yy}`
        expiryDateStr = `${year}/${mm}/${dd}`
      }
    }
    
    // Step 3: Extract batch number (characters 49 to end, 0-indexed: 48 to end)
    let batchNumber = ''
    if (barcodeData.length >= 49) {
      batchNumber = barcodeData.substring(48).trim()
    }
    
    // Auto-populate fields
    if (gtinCode) {
      // Store extracted GTIN for display
      extractedGtin.value = gtinCode
      
      // Clear the search field and populate with GTIN for search
      nextTick(() => {
        if (unifiedSearchRef.value) {
          // Clear the current search value
          selectedPharmacyDrug.value = null
          
          // Trigger search with the GTIN code to populate dropdown
          debouncedSearchPharmacyDrugs(gtinCode)
          
          // Set the input value to show the GTIN code in the search field
          setTimeout(() => {
            const searchInput = unifiedSearchRef.value.$el.querySelector('.el-select__input')
            if (searchInput) {
              searchInput.value = gtinCode
              // Trigger input event to make it behave like user typed it
              searchInput.dispatchEvent(new Event('input', { bubbles: true }))
            }
          }, 100)
        }
      })
    }
    
    if (expiryDateStr) {
      formattedExpiryDate.value = expiryDateStr
      validateAndFormatExpiryDate()
    }
    
    if (batchNumber) {
      factorForm.batchNumber = batchNumber
    }
    
    barcodeParseSuccess.value = true
    
    ElMessage.success(`Barcode parsed successfully! 
      GTIN: ${gtinCode}
      ${expiryDateStr ? `Expiry: ${expiryDateStr}` : ''}
      ${batchNumber ? `Batch: ${batchNumber}` : ''}`)
    
  } catch (error) {
    console.error('Error parsing barcode:', error)
    barcodeParseSuccess.value = false
    ElMessage.error('Failed to parse barcode data')
  }
}

// Legacy barcode parsing function (kept for compatibility)
const parseBarcode = () => {
  const barcodeData = factorForm.gtinCode?.trim()
  parseUnifiedBarcode(barcodeData)
}

const searchDrugByGtin = async (gtinCode) => {
  if (!gtinCode) return

  try {
    // First, check if this drug already exists in the pharmacy
    const existingDrug = await pharmacyDrugStore.getDrugByGtin(gtinCode)

    if (existingDrug) {
      // Drug exists in pharmacy, populate with pharmacy data
      factorForm.selectedDrug = existingDrug
      factorForm.unitsPerBox = existingDrug.num_per_box || null
      drugFound.value = true
      
      // Also fetch TTAC drug info for price comparison
      await fetchTtacDrugInfo(gtinCode)

      // Fetch batches for existing pharmacy drug
      await fetchDrugBatches(existingDrug.id)

      ElMessage.success(`Drug found in your pharmacy: ${existingDrug.persian_name || existingDrug.english_name}`)
    } else {
      // Drug doesn't exist in pharmacy, search TTAC database
      await ttacDrugsStore.ensureDataAvailable()
      const drugData = ttacDrugsStore.findByGtinWithExtraction(gtinCode)

      if (drugData) {
        // Populate form fields with TTAC data (this will be a new drug)
        factorForm.selectedDrug = {
          gtin_code: drugData.gtin_code,
          name_persian: drugData.name_persian,
          name_english: drugData.name_english,
          company_name_english: drugData.company_name_english,
          company_name_persian: drugData.company_name_persian,
          units_per_box: drugData.units_per_box,
          selling_price: drugData.selling_price
        }
        factorForm.unitsPerBox = drugData.units_per_box || null
        ttacDrugInfo.value = drugData
        drugFound.value = true
        ElMessage.info(`New drug found in TTAC database: ${drugData.name_persian || drugData.name_english}`)
      } else {
        // Clear drug selection for unknown GTIN
        factorForm.selectedDrug = null
        ttacDrugInfo.value = null
        drugFound.value = false
        ElMessage.warning('Drug not found in TTAC database')
      }
    }
  } catch (error) {
    console.error('Error searching for drug:', error)
    drugFound.value = false
    factorForm.selectedDrug = null
    ttacDrugInfo.value = null
    ElMessage.error('Error searching for drug')
  }
}

// Legacy barcode input handlers (kept for compatibility but not used in unified field)
const handleBarcodeInput = () => {
  // Clear previous state
  barcodeParseSuccess.value = false
  
  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Set new timeout for debounced parsing
  searchTimeout = setTimeout(() => {
    const barcodeData = factorForm.gtinCode?.trim()
    if (barcodeData && barcodeData.length >= 16) {
      // Only parse if we have enough characters for GTIN
      parseBarcode()
    }
  }, 500) // 500ms delay after user stops typing
}

const handleBarcodePaste = () => {
  // Handle paste event
  setTimeout(() => {
    const barcodeData = factorForm.gtinCode?.trim()
    if (barcodeData && barcodeData.length >= 16) {
      parseBarcode()
    }
  }, 100) // Short delay to ensure paste content is processed
}

const handleExpiryDateInput = (value) => {
  // Remove any non-digit characters except forward slashes
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  // Handle backspace - if user deletes a slash, also remove the preceding character
  if (formattedExpiryDate.value && value.length < formattedExpiryDate.value.length) {
    // User is deleting, don't auto-format
    formattedExpiryDate.value = cleanValue
    return
  }
  
  // Remove extra slashes (keep only the first two)
  const slashCount = (cleanValue.match(/\//g) || []).length
  if (slashCount > 2) {
    // Remove extra slashes from the end
    cleanValue = cleanValue.replace(/\/+$/, '')
    const parts = cleanValue.split('/')
    if (parts.length > 3) {
      cleanValue = parts.slice(0, 3).join('/')
    }
  }
  
  // Auto-format: add slashes after year (4 digits) and month (2 digits)
  if (cleanValue.length === 4 && !cleanValue.includes('/')) {
    // After typing 4 digits (year), add first slash
    cleanValue = cleanValue + '/'
  } else if (cleanValue.length === 7 && cleanValue.split('/').length === 2) {
    // After typing year/month (YYYY/MM), add second slash
    cleanValue = cleanValue + '/'
  }
  
  // Limit the total length to YYYY/MM/DD format (10 characters)
  if (cleanValue.length > 10) {
    cleanValue = cleanValue.substring(0, 10)
  }
  
  // Update the display value
  formattedExpiryDate.value = cleanValue
}

const validateAndFormatExpiryDate = () => {
  const dateStr = formattedExpiryDate.value?.trim()
  if (!dateStr) {
    focusedField.value = null
    return
  }

  // Try to parse YYYY/MM/DD format
  let parsedDate = null
  
  // Check if it's in the expected YYYY/MM/DD format
  const dateRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
  const match = dateStr.match(dateRegex)
  
  if (match) {
    const year = parseInt(match[1])
    const month = parseInt(match[2])
    const day = parseInt(match[3])
    
    // Validate date components
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Create date object
      const isoDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      parsedDate = new Date(isoDateString + 'T00:00:00.000Z')
      
      // Validate that the date is actually valid (handles cases like Feb 30)
      if (parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month - 1 && 
          parsedDate.getDate() === day) {
        
        // Update the formatted display to ensure consistent formatting
        formattedExpiryDate.value = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
        
        // Update the actual date in factorForm
        factorForm.expiryDate = isoDateString
        
        // Convert to Jalali and display
        jalaliExpiryDate.value = formatDateJalali(parsedDate)
      } else {
              ElMessage.warning('Invalid date. Please check the day is valid for the given month and year.')
      formattedExpiryDate.value = ''
      factorForm.expiryDate = ''
      jalaliExpiryDate.value = ''
      }
    } else {
      ElMessage.warning('Invalid date. Year must be 1900-2100, month 1-12, day 1-31.')
      formattedExpiryDate.value = ''
      factorForm.expiryDate = ''
      jalaliExpiryDate.value = ''
    }
  } else {
    // If the format doesn't match, check if it's incomplete
    if (dateStr.length < 10) {
      // Don't show error for incomplete dates, just wait for user to finish typing
      focusedField.value = null
      return
    } else {
      ElMessage.warning('Invalid date format. Please use YYYY/MM/DD format.')
      formattedExpiryDate.value = ''
      factorForm.expiryDate = ''
      jalaliExpiryDate.value = ''
    }
  }
  
  focusedField.value = null
}

// Header date input handlers
const handleFactorBuyDateInput = (value) => {
  // Remove any non-digit characters except forward slashes
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  // Handle backspace - if user deletes a slash, also remove the preceding character
  if (formattedFactorBuyDate.value && value.length < formattedFactorBuyDate.value.length) {
    // User is deleting, don't auto-format
    formattedFactorBuyDate.value = cleanValue
    return
  }
  
  // Remove extra slashes (keep only the first two)
  const slashCount = (cleanValue.match(/\//g) || []).length
  if (slashCount > 2) {
    // Remove extra slashes from the end
    cleanValue = cleanValue.replace(/\/+$/, '')
    const parts = cleanValue.split('/')
    if (parts.length > 3) {
      cleanValue = parts.slice(0, 3).join('/')
    }
  }
  
  // Auto-format: add slashes after year (4 digits) and month (2 digits)
  if (cleanValue.length === 4 && !cleanValue.includes('/')) {
    // After typing 4 digits (year), add first slash
    cleanValue = cleanValue + '/'
  } else if (cleanValue.length === 7 && cleanValue.split('/').length === 2) {
    // After typing year/month (YYYY/MM), add second slash
    cleanValue = cleanValue + '/'
  }
  
  // Limit the total length to YYYY/MM/DD format (10 characters)
  if (cleanValue.length > 10) {
    cleanValue = cleanValue.substring(0, 10)
  }
  
  // Update the display value
  formattedFactorBuyDate.value = cleanValue
}

const validateAndFormatFactorBuyDate = () => {
  const dateStr = formattedFactorBuyDate.value?.trim()
  if (!dateStr) {
    focusedField.value = null
    return
  }

  // Try to parse YYYY/MM/DD format
  let parsedDate = null
  
  // Check if it's in the expected YYYY/MM/DD format
  const dateRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
  const match = dateStr.match(dateRegex)
  
  if (match) {
    const year = parseInt(match[1])
    const month = parseInt(match[2])
    const day = parseInt(match[3])
    
    // Validate date components
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Create date object
      const isoDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      parsedDate = new Date(isoDateString + 'T00:00:00.000Z')
      
      // Validate that the date is actually valid (handles cases like Feb 30)
      if (parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month - 1 && 
          parsedDate.getDate() === day) {
        
        // Update the formatted display to ensure consistent formatting
        formattedFactorBuyDate.value = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
        
        // Update the actual date in headerForm
        headerForm.factorBuyDate = isoDateString
        
        // Convert to Jalali and display
        jalaliFactorBuyDate.value = formatDateJalali(parsedDate)
      } else {
              ElMessage.warning('Invalid date. Please check the day is valid for the given month and year.')
      formattedFactorBuyDate.value = ''
      headerForm.factorBuyDate = ''
      jalaliFactorBuyDate.value = ''
      }
    } else {
      ElMessage.warning('Invalid date. Year must be 1900-2100, month 1-12, day 1-31.')
      formattedFactorBuyDate.value = ''
      headerForm.factorBuyDate = ''
      jalaliFactorBuyDate.value = ''
    }
  } else {
    // If the format doesn't match, check if it's incomplete
    if (dateStr.length < 10) {
      // Don't show error for incomplete dates, just wait for user to finish typing
      focusedField.value = null
      return
    } else {
      ElMessage.warning('Invalid date format. Please use YYYY/MM/DD format.')
      formattedFactorBuyDate.value = ''
      headerForm.factorBuyDate = ''
      jalaliFactorBuyDate.value = ''
    }
  }
  
  focusedField.value = null
}

const handleFactorPaymentDateInput = (value) => {
  // Remove any non-digit characters except forward slashes
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  // Handle backspace - if user deletes a slash, also remove the preceding character
  if (formattedFactorPaymentDate.value && value.length < formattedFactorPaymentDate.value.length) {
    // User is deleting, don't auto-format
    formattedFactorPaymentDate.value = cleanValue
    return
  }
  
  // Remove extra slashes (keep only the first two)
  const slashCount = (cleanValue.match(/\//g) || []).length
  if (slashCount > 2) {
    // Remove extra slashes from the end
    cleanValue = cleanValue.replace(/\/+$/, '')
    const parts = cleanValue.split('/')
    if (parts.length > 3) {
      cleanValue = parts.slice(0, 3).join('/')
    }
  }
  
  // Auto-format: add slashes after year (4 digits) and month (2 digits)
  if (cleanValue.length === 4 && !cleanValue.includes('/')) {
    // After typing 4 digits (year), add first slash
    cleanValue = cleanValue + '/'
  } else if (cleanValue.length === 7 && cleanValue.split('/').length === 2) {
    // After typing year/month (YYYY/MM), add second slash
    cleanValue = cleanValue + '/'
  }
  
  // Limit the total length to YYYY/MM/DD format (10 characters)
  if (cleanValue.length > 10) {
    cleanValue = cleanValue.substring(0, 10)
  }
  
  // Update the display value
  formattedFactorPaymentDate.value = cleanValue
}

const validateAndFormatFactorPaymentDate = () => {
  const dateStr = formattedFactorPaymentDate.value?.trim()
  if (!dateStr) {
    focusedField.value = null
    return
  }

  // Try to parse YYYY/MM/DD format
  let parsedDate = null
  
  // Check if it's in the expected YYYY/MM/DD format
  const dateRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
  const match = dateStr.match(dateRegex)
  
  if (match) {
    const year = parseInt(match[1])
    const month = parseInt(match[2])
    const day = parseInt(match[3])
    
    // Validate date components
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Create date object
      const isoDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      parsedDate = new Date(isoDateString + 'T00:00:00.000Z')
      
      // Validate that the date is actually valid (handles cases like Feb 30)
      if (parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month - 1 && 
          parsedDate.getDate() === day) {
        
        // Update the formatted display to ensure consistent formatting
        formattedFactorPaymentDate.value = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
        
        // Update the actual date in headerForm
        headerForm.factorPaymentDate = isoDateString
        
        // Convert to Jalali and display
        jalaliFactorPaymentDate.value = formatDateJalali(parsedDate)
      } else {
              ElMessage.warning('Invalid date. Please check the day is valid for the given month and year.')
      formattedFactorPaymentDate.value = ''
      headerForm.factorPaymentDate = ''
      jalaliFactorPaymentDate.value = ''
      }
    } else {
      ElMessage.warning('Invalid date. Year must be 1900-2100, month 1-12, day 1-31.')
      formattedFactorPaymentDate.value = ''
      headerForm.factorPaymentDate = ''
      jalaliFactorPaymentDate.value = ''
    }
  } else {
    // If the format doesn't match, check if it's incomplete
    if (dateStr.length < 10) {
      // Don't show error for incomplete dates, just wait for user to finish typing
      focusedField.value = null
      return
    } else {
      ElMessage.warning('Invalid date format. Please use YYYY/MM/DD format.')
      formattedFactorPaymentDate.value = ''
      headerForm.factorPaymentDate = ''
      jalaliFactorPaymentDate.value = ''
    }
  }
  
  focusedField.value = null
}

const addOrUpdateFactorItem = async () => {
  if (!isFormValid.value) {
    ElMessage.error('Please fill all required fields')
    return
  }

  try {
    processing.value = true
    
    const itemData = factorHelpers.createFactorItemPayload({
      factorId: currentFactorId.value,
      drugId: factorForm.selectedDrug.id,
      storageId: factorForm.storage,
      boxes: factorForm.boxes,
      prizeBoxes: factorForm.prizeBoxes,
      unitsPerBox: factorForm.unitsPerBox,
      buyPrice: factorForm.buyPrice,
      sellPrice: factorForm.sellPrice,
      discount: factorForm.discount,
      tax: factorForm.tax,
      expiryDate: factorForm.expiryDate,
      batchNumber: factorForm.batchNumber
    })

    if (isEditing.value) {
      // Update existing item
      await factorItemsAPI.updateFactorItem(factorHistory.value[editingFactorIndex.value].id, itemData)
      ElMessage.success('Factor item updated successfully')
    } else {
      // Create new item
      await factorItemsAPI.createFactorItem(itemData)
      ElMessage.success('Factor item added successfully')
    }

    await loadFactorItems()
    resetForm()
    
  } catch (error) {
    console.error('Error saving factor item:', error)
    ElMessage.error('Failed to save factor item')
  } finally {
    processing.value = false
  }
}

const editFactorItem = (index) => {
  const item = factorHistory.value[index]
  isEditing.value = true
  editingFactorIndex.value = index
  
  // Populate form with item data
  Object.assign(factorForm, {
    gtinCode: item.gtin_code,
    selectedDrug: { id: item.drug_id, name: item.drug_name },
    storage: item.storage_id,
    boxes: item.boxes,
    prizeBoxes: item.prize_boxes,
    unitsPerBox: item.units_per_box,
    totalQuantity: item.total_quantity,
    buyPrice: item.buy_price_per_box,
    sellPrice: item.sell_price_per_box,
    discount: item.discount,
    tax: item.tax,
    expiryDate: item.expiry_date,
    batchNumber: item.batch_number
  })
  
  // Format expiry date for display
  if (item.expiry_date) {
    const date = new Date(item.expiry_date)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      formattedExpiryDate.value = `${year}/${month}/${day}`
      // Also set Jalali date
      jalaliExpiryDate.value = formatDateJalali(date)
    } else {
      formattedExpiryDate.value = ''
      jalaliExpiryDate.value = ''
    }
  } else {
    formattedExpiryDate.value = ''
    jalaliExpiryDate.value = ''
  }
  
  // Calculate computed fields for the loaded data
  calculateComputedFields()
}

const deleteFactorItem = async (index) => {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this factor item?', 'Confirm Delete', {
      type: 'warning'
    })
    
    const item = factorHistory.value[index]
    await factorItemsAPI.deleteFactorItem(item.id)
    
    ElMessage.success('Factor item deleted successfully')
    await loadFactorItems()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting factor item:', error)
      ElMessage.error('Failed to delete factor item')
    }
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editingFactorIndex.value = -1
  resetForm()
}

const resetForm = () => {
  Object.assign(factorForm, {
    gtinCode: '',
    selectedDrug: null,
    storage: null,
    boxes: null,
    prizeBoxes: null,
    unitsPerBox: null,
    totalQuantity: null,
    buyPrice: null,
    sellPrice: null,
    discount: null,
    tax: null,
    expiryDate: '',
    batchNumber: ''
  })
  
  // Reset computed fields
  Object.assign(computedFields, {
    buyPricePerUnit: '',
    sellPricePerUnit: '',
    totalAmountBuy: '',
    netAmountPaid: '',
    profit: '',
    profitPercentage: ''
  })
  
  // Reset factor computed fields
  Object.assign(factorComputedFields, {
    totalDiscounts: '',
    totalTax: '',
    totalProfit: '',
    totalNetAmountPaid: ''
  })
  
  formattedExpiryDate.value = ''
  formattedFactorBuyDate.value = ''
  formattedFactorPaymentDate.value = ''
  jalaliExpiryDate.value = ''
  jalaliFactorBuyDate.value = ''
  jalaliFactorPaymentDate.value = ''
  extractedGtin.value = ''
  drugFound.value = false
  barcodeParseSuccess.value = false
  pricesAutoPopulated.value = false
  ttacDrugInfo.value = null
  drugBatches.value = []
  
  // Clear search timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
}

const loadFactorItems = async () => {
  if (!currentFactorId.value) return
  
  try {
    historyLoading.value = true
    const response = await factorItemsAPI.getItemsByFactor(currentFactorId.value)
    factorHistory.value = response.data.results || []
    totalRecords.value = factorHistory.value.length
    
    // Calculate factor computed fields after loading items
    calculateFactorComputedFields()
  } catch (error) {
    console.error('Error loading factor items:', error)
  } finally {
    historyLoading.value = false
  }
}

const createNewFactor = async () => {
  try {
    const response = await factorsAPI.createFactor({
      factor_number: factorNumber.value.toString(),
      status: 'draft'
    })
    
    currentFactorId.value = response.data.factor_db_number
    factorStatus.value = 'draft'
    factorHistory.value = []
    totalRecords.value = 0
    
    // Reset header form
    Object.assign(headerForm, {
      factorType: 'drug',
      distributionCompany: null,
      factorNumber: factorNumber.value.toString(),
      paymentType: 'cash',
      factorBuyDate: '',
      factorPaymentDate: '',
      additionalDiscount: null,
      additionalTax: null
    })
    
    ElMessage.success(`New factor #${factorNumber.value} created successfully`)
    
  } catch (error) {
    console.error('Error creating new factor:', error)
    ElMessage.error('Failed to create new factor')
  }
}

const deleteEntireFactor = async () => {
  if (!currentFactorId.value) {
    ElMessage.error('No factor to delete')
    return
  }

  try {
    processing.value = true
    
    await factorsAPI.deleteFactorWithItems(currentFactorId.value)
    
    ElMessage.success(`Factor #${factorNumber.value} has been completely deleted!`)
    
    emit('factor-deleted', {
      tabId: props.tabId,
      factorNumber: factorNumber.value
    })
    
    currentFactorId.value = null
    factorStatus.value = 'draft'
    factorHistory.value = []
    totalRecords.value = 0
    resetForm()
    
    await navigateToLastAvailableFactor()
    
  } catch (error) {
    console.error('Error deleting entire factor:', error)
    ElMessage.error('Failed to delete factor: ' + (error.response?.data?.error || error.message))
  } finally {
    processing.value = false
  }
}

const navigateToLastAvailableFactor = async () => {
  try {
    const response = await factorsAPI.getFactors({ 
      ordering: '-factor_number',
      page_size: 1
    })
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const lastFactor = response.data.results[0]
      const lastFactorNumber = lastFactor.factor_number
      
      factorNumber.value = lastFactorNumber
      await loadFactorByNumber(lastFactorNumber)
      lastValidFactorNumber.value = lastFactorNumber
      
      ElMessage.success(`Navigated to the last available factor #${lastFactorNumber}`)
    } else {
      currentFactorId.value = null
      factorNumber.value = 1
      factorStatus.value = 'draft'
      factorHistory.value = []
      totalRecords.value = 0
      lastValidFactorNumber.value = 1
      
      resetForm()
      
      ElMessage.info('No factors available. Interface cleared.')
    }
  } catch (error) {
    console.error('Error navigating to last available factor:', error)
    ElMessage.error('Failed to navigate to last factor: ' + (error.response?.data?.error || error.message))
  }
}

const finalizeFactor = async () => {
  if (factorHistory.value.length === 0) {
    ElMessage.error('Cannot finalize empty factor')
    return
  }

  try {
    await ElMessageBox.confirm('Are you sure you want to finalize this factor? This action cannot be undone.', 'Confirm Finalization', {
      type: 'warning'
    })
    
    await factorsAPI.finalizeFactor(currentFactorId.value)
    factorStatus.value = 'finalized'
    
    ElMessage.success(`Factor #${factorNumber.value} has been finalized`)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error finalizing factor:', error)
      ElMessage.error('Failed to finalize factor')
    }
  }
}

// Navigation methods
const previousFactorNumber = async () => {
  if (factorNumber.value > 1) {
    const targetNumber = factorNumber.value - 1
    if (await checkFactorExists(targetNumber)) {
      factorNumber.value = targetNumber
      await loadFactorByNumber(targetNumber)
    }
  }
}

const nextFactorNumber = async () => {
  const targetNumber = factorNumber.value + 1
  if (await checkFactorExists(targetNumber)) {
    factorNumber.value = targetNumber
    await loadFactorByNumber(targetNumber)
  }
}

const checkFactorExists = async (number) => {
  try {
    isCheckingFactorExists.value = true
    const response = await factorsAPI.getFactors({ factor_number: number })
    return response.data.results && response.data.results.length > 0
  } catch (error) {
    return false
  } finally {
    isCheckingFactorExists.value = false
  }
}

const loadFactorByNumber = async (number) => {
  try {
    const response = await factorsAPI.getFactors({ factor_number: number })
    if (response.data.results && response.data.results.length > 0) {
      const factor = response.data.results[0]
      currentFactorId.value = factor.factor_db_number
      factorStatus.value = factor.status
      createdAt.value = factor.created_at
      updatedAt.value = factor.updated_at
      
      // Update header form with factor data
      headerForm.factorType = factor.factor_type || ''
      headerForm.distributionCompany = factor.distribution_company || null
      headerForm.factorNumber = factor.factor_number || ''
      headerForm.paymentType = factor.payment_type || ''
      headerForm.factorBuyDate = factor.factor_buy_date || ''
      headerForm.factorPaymentDate = factor.factor_payment_date || ''
      headerForm.additionalDiscount = factor.factor_discount || null
      headerForm.additionalTax = factor.factor_tax || null
      
      // Format dates for display
      if (factor.factor_buy_date) {
        formattedFactorBuyDate.value = factor.factor_buy_date.replace(/-/g, '/')
        const buyDate = new Date(factor.factor_buy_date)
        jalaliFactorBuyDate.value = formatDateJalali(buyDate)
      }
      
      if (factor.factor_payment_date) {
        formattedFactorPaymentDate.value = factor.factor_payment_date.replace(/-/g, '/')
        const paymentDate = new Date(factor.factor_payment_date)
        jalaliFactorPaymentDate.value = formatDateJalali(paymentDate)
      }
      
      await loadFactorItems()
      return true
    }
    return false
  } catch (error) {
    console.error('Error loading factor:', error)
    return false
  }
}

const validateFactorNumber = async () => {
  const inputValue = parseInt(factorNumber.value)
  
  if (isNaN(inputValue) || inputValue < 1) {
    factorNumber.value = lastValidFactorNumber.value
    isFactorNumberInvalid.value = true
    ElMessage.warning('Factor number must be at least 1')
    setTimeout(() => {
      isFactorNumberInvalid.value = false
    }, 2000)
    return
  }

  if (inputValue === lastValidFactorNumber.value) {
    return
  }

  isCheckingFactorExists.value = true
  
  try {
    const exists = await checkFactorExists(inputValue)
    if (exists) {
      const success = await loadFactorByNumber(inputValue)
      if (success) {
        lastValidFactorNumber.value = inputValue
        emit('title-change', { tabId: props.tabId, title: `Factor #${inputValue}` })
      } else {
        factorNumber.value = lastValidFactorNumber.value
        ElMessage.error(`Failed to load factor #${inputValue}`)
      }
    } else {
      factorNumber.value = lastValidFactorNumber.value
      isFactorNumberInvalid.value = true
      ElMessage.warning(`Factor #${inputValue} does not exist`)
      setTimeout(() => {
        isFactorNumberInvalid.value = false
      }, 2000)
    }
  } catch (error) {
    factorNumber.value = lastValidFactorNumber.value
    ElMessage.error('Error validating factor number')
  } finally {
    isCheckingFactorExists.value = false
  }
}

const onFactorNumberInput = () => {
  // Do nothing during typing to prevent temporary changes
}

// Utility methods
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

const toggleTimestamp = () => {
  showCreated.value = !showCreated.value
}

const getStatusButtonType = (status) => {
  const typeMap = {
    'draft': 'warning',
    'finalized': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || 'info'
}

const showStatusInfo = () => {
  ElMessage.info(`Current factor status: ${factorHelpers.getStatusDisplay(factorStatus.value)}`)
}

const handlePrintCommand = (command) => {
  ElMessage.info(`Print ${command} format - Not implemented yet`)
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
  pharmacyDrugStore.fetchDrugs()
}

const handleDrugDeleted = (drugId) => {
  editDialogVisible.value = false
  ElMessage.success('Drug deleted successfully!')
  
  // Refresh the drugs list to remove the deleted drug
  pharmacyDrugStore.fetchDrugs()
}

// Background loading of TTAC drugs
const loadTtacDrugsInBackground = async () => {
  try {
    console.log('🔄 Loading TTAC drugs in background...')
    await ttacDrugsStore.ensureDataAvailable()
    ttacDrugsLoaded.value = true
    console.log(`✅ TTAC drugs loaded in background: ${ttacDrugsStore.drugs.length} drugs available for search`)
    
    // Pre-process TTAC drugs for faster searching
    console.log('🔄 Pre-processing TTAC drugs for search optimization...')
    preprocessTtacDrugs()
    console.log(`✅ TTAC search cache built: ${ttacSearchCache.size} entries`)
  } catch (error) {
    console.error('❌ Failed to load TTAC drugs in background:', error)
    ttacDrugsLoaded.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Load available storages
  try {
    await storageStore.fetchStorages()
    availableStorages.value = storageStore.storages
  } catch (error) {
    console.error('Error loading storages:', error)
  }

  // Load available distribution companies
  try {
    await distributionCompanyStore.ensureDataAvailable()
    console.log('Distribution companies loaded:', distributionCompanyStore.companies)
  } catch (error) {
    console.error('Error loading distribution companies:', error)
  }

  // Load initial factor
  if (props.initialFactorNumber) {
    factorNumber.value = props.initialFactorNumber
    lastValidFactorNumber.value = props.initialFactorNumber
    await loadFactorByNumber(props.initialFactorNumber)
  } else {
    await createNewFactor()
  }

  // Emit initial title
  emit('title-change', { tabId: props.tabId, title: `Factor #${factorNumber.value}` })

  // Start background loading of TTAC drugs (non-blocking)
  loadTtacDrugsInBackground()
})

// Cleanup timeout and caches on component unmount
onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchDebounceTimeout) {
    clearTimeout(searchDebounceTimeout)
  }
  
  // Clear search caches to free memory
  pharmacySearchCache.clear()
  ttacSearchCache.clear()
})
</script>

<style scoped>
/* Copy styles from DrugAdjustmentsView but replace "adjustment" with "factor" */
.factors-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px;
  background-color: #f5f7fa;
}

.page-header {
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.factor-number-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.factor-number-label {
  font-weight: 600;
  color: #606266;
}

.factor-number-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.factor-number-input {
  width: 80px;
}

.factor-number-input.invalid-factor :deep(.el-input__inner) {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.factor-number-input.checking-factor :deep(.el-input__inner) {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.nav-button {
  padding: 8px;
}

.new-factor-button {
  margin-left: 10px;
}

.timestamp-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.timestamp-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.timestamp-label {
  font-size: 12px;
  color: #909399;
}

.timestamp-value {
  font-size: 12px;
  color: #606266;
  font-family: monospace;
}

.factor-header-card {
  margin-bottom: 15px;
}

.factor-form-card {
  margin-bottom: 15px;
}

.factor-history-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 4px;
}

.status-alert {
  margin-bottom: 10px;
}

.unified-search-field :deep(.el-form-item__label) {
  color: #2e8ceb;
  font-weight: 600;
  font-size: 14px;
}

.unified-search-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  position: relative;
}

.search-language-toggle {
  min-width: 35px;
  font-size: 12px;
  padding: 4px 8px;
  font-weight: bold;
  height: 32px;
  flex-shrink: 0;
  font-family: var(--font-persian);
}

.ttac-status-indicator {
  min-width: 50px;
  font-size: 10px;
  padding: 4px 8px;
  font-weight: bold;
  height: 32px;
  flex-shrink: 0;
}

.unified-search-select {
  border: 2px dashed #2e8ceb;
  border-radius: 6px;
  background-color: #f0f9ff;
  flex: 1;
}

.barcode-success-icon {
  position: absolute;
  right: 120px;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
  font-size: 18px;
  z-index: 10;
}

/* Legacy styles for compatibility */
.pharmacy-search-field :deep(.el-form-item__label) {
  color: #2e8ceb;
  font-weight: 600;
  font-size: 14px;
}

.pharmacy-search-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.pharmacy-drug-search {
  border: 2px dashed #2e8ceb;
  border-radius: 6px;
  background-color: #f0f9ff;
  flex: 1;
}

.gtin-input-container {
  position: relative;
  width: 100%;
}

.gtin-success-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
  font-size: 18px;
  z-index: 10;
}

.drug-edit-button {
  background-color: #08C2FF;
  border-color: #ffffff;
  color:#ffffff;
  font-size: 12px;
  padding: 6px 6px;
  height: 25px;
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

/* Expiry date input styling */
.expiry-date-input :deep(.el-input__inner) {
  font-family: var(--font-english);
  font-weight: 500;
}

.expiry-date-input :deep(.el-input__inner):focus {
  border-color: var(--primary-color);
}

.expiry-date-input :deep(.el-input__inner::placeholder) {
  color: #c0c4cc;
  font-weight: normal;
}

/* Computed fields styling */
.computed-field :deep(.el-input__inner) {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  color: #343434;
  font-weight: 600;
  font-family: var(--font-english);
  text-align: center;
}

.computed-field :deep(.el-input__inner):focus {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  box-shadow: none;
}

/* Currency input container */
.currency-input-container {
  position: relative;
  width: 100%;
}

/* Currency input styling */
.currency-input :deep(.el-input__inner) {
  font-family: var(--font-english);
  font-weight: 500;
  text-align: center;
  direction: ltr;
}

.currency-input :deep(.el-input__inner):focus {
  border-color: var(--primary-color);
}

/* Currency display styling - positioned like jalali dates */
.currency-display {
  position: absolute;
  right: 12px;
  top: -12px;
  font-size: 14px;
  color: #67c23a;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
  background: white;
  padding: 0 4px;
  white-space: nowrap;
  z-index: 10;
  transform: scale(0.85);
  pointer-events: none;
  transition: all 0.3s ease;
}

/* Separator line between input fields and computed fields */
.computed-fields-section {
  position: relative;
  padding-top: 20px;
}

.computed-fields-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, 
    transparent 0%, 
    #d1d5db 10%, 
    #d1d5db 90%, 
    transparent 100%
  );
  border-top: 1px dashed #d1d5db;
  opacity: 0.7;
}

/* Floating label effect for form fields */
.factor-form .el-form-item,
.factor-header-form .el-form-item {
  position: relative;
  margin-bottom: 20px;
}

.factor-form .el-form-item .el-input,
.factor-form .el-form-item .el-select,
.factor-form .el-form-item .el-date-editor,
.factor-form .el-form-item .el-input-number,
.factor-header-form .el-form-item .el-input,
.factor-header-form .el-form-item .el-select,
.factor-header-form .el-form-item .el-date-editor,
.factor-header-form .el-form-item .el-input-number {
  position: relative;
}

.factor-form .el-form-item .el-input__inner,
.factor-form .el-form-item .el-select .el-input__inner,
.factor-form .el-form-item .el-date-editor .el-input__inner,
.factor-form .el-form-item .el-input-number .el-input__inner,
.factor-header-form .el-form-item .el-input__inner,
.factor-header-form .el-form-item .el-select .el-input__inner,
.factor-header-form .el-form-item .el-date-editor .el-input__inner,
.factor-header-form .el-form-item .el-input-number .el-input__inner {
  padding-top: 10px !important;
  height: 40px !important;
}

/* Floating label */
.factor-form .el-form-item::before,
.factor-header-form .el-form-item::before {
  content: attr(data-label);
  position: absolute;
  left: 12px;
  top: 12px;
  color: #a8abb2;
  font-size: 14px;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 10;
  background: white;
  padding: 0 4px;
  white-space: nowrap;
}

/* When field has value or is focused */
.factor-form .el-form-item.has-value::before,
.factor-form .el-form-item.is-focused::before,
.factor-header-form .el-form-item.has-value::before,
.factor-header-form .el-form-item.is-focused::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

/* Special handling for number inputs with value 0 */
.factor-form .el-form-item.has-value[data-label*="Discount"]::before,
.factor-form .el-form-item.has-value[data-label*="Tax"]::before,
.factor-form .el-form-item.has-value[data-label*="Prize"]::before,
.factor-header-form .el-form-item.has-value[data-label*="Discount"]::before,
.factor-header-form .el-form-item.has-value[data-label*="Tax"]::before,
.factor-header-form .el-form-item.has-value[data-label*="Additional"]::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

/* For select components */
.factor-form .el-form-item .el-select .el-input.is-focus .el-input__inner,
.factor-form .el-form-item .el-input.is-focus .el-input__inner,
.factor-form .el-form-item .el-date-editor.is-focus .el-input__inner,
.factor-form .el-form-item .el-input-number.is-focus .el-input__inner,
.factor-header-form .el-form-item .el-select .el-input.is-focus .el-input__inner,
.factor-header-form .el-form-item .el-input.is-focus .el-input__inner,
.factor-header-form .el-form-item .el-date-editor.is-focus .el-input__inner,
.factor-header-form .el-form-item .el-input-number.is-focus .el-input__inner {
  border-color: #409eff;
}

/* Hide original placeholder when we have floating label */
.factor-form .el-form-item .el-input__inner::placeholder,
.factor-form .el-form-item .el-select .el-input__inner::placeholder,
.factor-form .el-form-item .el-date-editor .el-input__inner::placeholder,
.factor-header-form .el-form-item .el-input__inner::placeholder,
.factor-header-form .el-form-item .el-select .el-input__inner::placeholder,
.factor-header-form .el-form-item .el-date-editor .el-input__inner::placeholder {
  opacity: 0;
}

/* Required field indicator */
.factor-form .el-form-item[data-required="true"]::after,
.factor-header-form .el-form-item[data-required="true"]::after {
  content: "*";
  color: #f56c6c;
  position: absolute;
  right: 8px;
  top: -8px;
  font-size: 12px;
  z-index: 11;
}

/* Exclude search and GTIN fields from floating label effect */
.factor-form .unified-search-field,
.factor-form .pharmacy-search-field,
.factor-form .el-form-item[prop="gtinCode"] {
  margin-bottom: 20px;
}

.factor-form .unified-search-field::before,
.factor-form .pharmacy-search-field::before,
.factor-form .el-form-item[prop="gtinCode"]::before {
  display: none;
}

.factor-form .unified-search-field .el-input__inner,
.factor-form .pharmacy-search-field .el-input__inner,
.factor-form .el-form-item[prop="gtinCode"] .el-input__inner {
  padding-top: 12px !important;
  height: 32px !important;
}

/* Jalali date display styling - positioned like floating labels */
.jalali-date-display {
  position: absolute;
  right: 12px;
  top: -12px;
  font-size: 14px;
  color: #67c23a;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
  background: white;
  padding: 0 4px;
  white-space: nowrap;
  z-index: 10;
  transform: scale(0.85);
  pointer-events: none;
  transition: all 0.3s ease;
}

/* Drug Info Display styling */
.drug-info-display {
  margin: 0px 0px 15px 0px;
  padding: 10px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.drug-info-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.drug-status-tag {
  font-size: 0.8rem;
  padding: 4px 14px 0px 0px;
  border-radius: 6px;
  font-weight: 500;
}

.drug-status-tag .el-icon {
  margin-right: 1px;
  font-size: 14px;
}

.display-language-toggle {
  min-width: 35px;
  font-size: 12px;
  padding: 4px 8px;
  font-weight: bold;
  height: 28px;
  flex-shrink: 0;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
}

/* Table-like row styling */
.drug-info-row {
  margin-bottom: 8px;
}

.drug-info-row:last-child {
  margin-bottom: 0;
}

.drug-info-col {
  display: flex;
  align-items: center;
  min-height: 32px;
}

/* Drug name and company info styling */
.drug-name-info,
.company-info {
  width: 100%;
}

.drug-name,
.company-name {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.drug-info-display .label {
  font-size: 0.75rem;
  font-weight: bold;
  color: #2e8ceb;
  min-width: 50px;
  flex-shrink: 0;
}

.drug-info-display .name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
}

.drug-info-display .english-name {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.drug-info-display .persian-name {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
}

.drug-info-display .company {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 500;
}

/* Price info styling */
.price-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.stock-value {
  font-size: 0.8rem;
  color: #059669;
  font-weight: bold;
  background: #f0fdf4;
  padding: 2px 6px;
  border-radius: 3px;
}

.price-value {
  font-size: 0.8rem;
  color: #0f172a;
  font-weight: bold;
  background: #f8fafc;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
}

.ttac-price {
  color: #ea580c;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.maximum-price {
  color: #7c3aed;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  font-weight: 600;
}

/* Batches button and popover styling */
.batches-button {
  font-size: 12px;
  padding: 4px 6px;
  height: 28px;
  font-weight: bold;
}

.batches-popover-content {
  padding: 0;
}

.popover-header {
  padding-left: 12px;
  /* border-bottom: 1px solid #ebeef5; */
}

.popover-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.batches-table-container {
  padding: 6px 2px 0px 2px;
}

.no-batches-message {
  padding: 20px;
  text-align: center;
}

.text-muted {
  color: #909399;
  font-size: 12px;
  font-style: italic;
}

/* Batches table styling */
.batches-popover-content :deep(.el-table) {
  font-size: 12px;
}

.batches-popover-content :deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 12px;
  padding: 6px 0;
}

.batches-popover-content :deep(.el-table td) {
  padding: 6px 0;
  font-size: 12px;
}

.batches-popover-content :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafbfc;
}

.batches-popover-content .el-tag {
  margin: 1px;
  font-size: 11px;
}

/* Responsive design for drug info display */
@media (max-width: 768px) {
  .drug-info-row .el-col {
    margin-bottom: 8px;
  }
  
  .drug-info-col {
    min-height: auto;
  }
  
  .drug-name,
  .company-name {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .price-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .batches-button {
    font-size: 10px;
    padding: 2px 6px;
    height: 24px;
  }
}
</style> 