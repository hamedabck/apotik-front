<template>
  <div class="invoices-view">
    <div class="page-header">
      <h1 style="font-size: 24px; font-weight: 600;">Invoices</h1>
      <div class="header-info-row">
        <div class="invoice-number-container">
          <label class="invoice-number-label">Number:</label>
          <div class="invoice-number-controls">
            <el-button 
              size="small" 
              @click="previousInvoiceNumber"
              :disabled="invoiceNumber <= 1 || isCheckingInvoiceExists"
              class="nav-button"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-input
              v-model="invoiceNumber"
              type="number"
              :min="1"
              :class="['invoice-number-input', { 'invalid-invoice': isInvoiceNumberInvalid, 'checking-invoice': isCheckingInvoiceExists }]"
              @input="onInvoiceNumberInput"
              @blur="validateInvoiceNumber"
              @focus="isInvoiceNumberInvalid = false"
              :disabled="isCheckingInvoiceExists"
              placeholder="1"
              :validate-event="false"
            />
            <el-button 
              size="small" 
              @click="nextInvoiceNumber"
              :disabled="isCheckingInvoiceExists"
              class="nav-button"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              type="success"
              @click="createNewInvoice"
              class="new-invoice-button"
              :title="'Create a new invoice session'"
            >
              <el-icon><Plus /></el-icon>
              New Invoice
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
              :type="getStatusButtonType(invoiceStatus)"
              class="status-display-button"
              @click="showStatusInfo"
              :title="`Current invoice status: ${invoiceHelpers.getStatusDisplay(invoiceStatus)}`"
            >
              <el-icon><InfoFilled /></el-icon>
              {{ invoiceHelpers.getStatusDisplay(invoiceStatus) }}
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
            
            <!-- Delete Invoice Button -->
            <el-button 
              size="small" 
              type="danger"
              @click="deleteEntireInvoice"
              :disabled="processing || !currentInvoiceId"
              class="delete-invoice-button"
              :title="`Delete entire invoice #${invoiceNumber} and all its items`"
            >
              <el-icon><Delete /></el-icon>
              Delete Invoice
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Non-Editable Status Alert -->
    <el-alert
      v-if="!isInvoiceEditable"
      :title="`This invoice is ${invoiceHelpers.getStatusDisplay(invoiceStatus)} and cannot be modified`"
      type="warning"
      :description="`Invoice #${invoiceNumber} has been ${invoiceStatus}. No further changes can be made to this invoice.`"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <!-- Invoice Header Form -->
    <el-card class="invoice-header-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Invoice Information</span>
        </div>
      </template>

      <el-form :model="headerForm" class="invoice-header-form">
        <!-- Header Fields Row 1 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="invoiceType"
              data-label="Invoice Type"
              :class="{ 'has-value': hasValue(headerForm.invoiceType), 'is-focused': focusedField === 'invoiceType' }"
            >
              <el-select
                v-model="headerForm.invoiceType"
                placeholder=""
                style="width: 100%"
                @focus="focusedField = 'invoiceType'"
                @blur="focusedField = null"
                :disabled="!isInvoiceEditable"
              >
                <el-option
                  v-for="option in invoiceTypeOptions"
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
                :disabled="!isInvoiceEditable"
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
              prop="invoiceNumber"
              data-label="Invoice Number"
              :class="{ 'has-value': hasValue(headerForm.invoiceNumber), 'is-focused': focusedField === 'invoiceNumber' }"
            >
              <el-input
                v-model="headerForm.invoiceNumber"
                placeholder=""
                @focus="focusedField = 'invoiceNumber'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isInvoiceEditable"
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
                :disabled="!isInvoiceEditable"
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
              prop="invoiceBuyDate"
              data-label="Invoice Buy Date"
              :class="{ 'has-value': hasValue(formattedInvoiceBuyDate), 'is-focused': focusedField === 'invoiceBuyDate' }"
            >
              <el-input
                v-model="formattedInvoiceBuyDate"
                placeholder=""
                @input="handleInvoiceBuyDateInput"
                @blur="validateAndFormatInvoiceBuyDate"
                @keyup.enter="validateAndFormatInvoiceBuyDate"
                @focus="focusedField = 'invoiceBuyDate'"
                maxlength="10"
                style="width: 100%"
                class="expiry-date-input"
                :disabled="!isInvoiceEditable"
              />
              <div v-if="jalaliInvoiceBuyDate" class="jalali-date-display">
                {{ jalaliInvoiceBuyDate }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="invoicePaymentDate"
              data-label="Invoice Payment Date"
              :class="{ 'has-value': hasValue(formattedInvoicePaymentDate), 'is-focused': focusedField === 'invoicePaymentDate' }"
            >
              <el-input
                v-model="formattedInvoicePaymentDate"
                placeholder=""
                @input="handleInvoicePaymentDateInput"
                @blur="validateAndFormatInvoicePaymentDate"
                @keyup.enter="validateAndFormatInvoicePaymentDate"
                @focus="focusedField = 'invoicePaymentDate'"
                maxlength="10"
                style="width: 100%"
                class="expiry-date-input"
                :disabled="!isInvoiceEditable"
              />
              <div v-if="jalaliInvoicePaymentDate" class="jalali-date-display">
                {{ jalaliInvoicePaymentDate }}
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
                  :disabled="!isInvoiceEditable"
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
                  :disabled="!isInvoiceEditable"
                />
                <div v-if="headerForm.additionalTax" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Invoice Computed Fields -->
        <el-row :gutter="20" class="computed-fields-section">
          <el-col :span="6">
            <el-form-item 
              prop="totalDiscounts"
              data-label="Total Discounts"
              :class="{ 'has-value': hasValue(invoiceComputedFields.totalDiscounts), 'is-focused': focusedField === 'totalDiscounts' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="invoiceComputedFields.totalDiscounts"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalDiscounts'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="invoiceComputedFields.totalDiscounts" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="totalTax"
              data-label="Total Tax"
              :class="{ 'has-value': hasValue(invoiceComputedFields.totalTax), 'is-focused': focusedField === 'totalTax' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="invoiceComputedFields.totalTax"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalTax'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="invoiceComputedFields.totalTax" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="totalProfit"
              data-label="Total Profit"
              :class="{ 'has-value': hasValue(invoiceComputedFields.totalProfit), 'is-focused': focusedField === 'totalProfit' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="invoiceComputedFields.totalProfit"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalProfit'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="invoiceComputedFields.totalProfit" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="totalNetAmountPaid"
              data-label="Total Net Amount Paid"
              :class="{ 'has-value': hasValue(invoiceComputedFields.totalNetAmountPaid), 'is-focused': focusedField === 'totalNetAmountPaid' }"
            >
              <div class="currency-input-container">
                <el-input
                  v-model="invoiceComputedFields.totalNetAmountPaid"
                  placeholder=""
                  readonly
                  @focus="focusedField = 'totalNetAmountPaid'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  class="computed-field"
                />
                <div v-if="invoiceComputedFields.totalNetAmountPaid" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- Invoice Form -->
    <el-card class="invoice-form-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ isEditing ? 'Edit Invoice Item' : 'Add New Invoice Item' }}</span>
          <div class="header-buttons">
            <el-button 
              v-if="isEditing"
              @click="cancelEdit"
              size="small"
              class="cancel-button"
            >
              <el-icon><Close /></el-icon> Cancel
            </el-button>
            <el-tooltip
              :content="isDuplicateItem ? 'Cannot add duplicate drug with same batch number (already exists in pharmacy or invoice)' : ''"
              :disabled="!isDuplicateItem"
              placement="top"
            >
              <el-button 
                type="primary" 
                size="small"
                @click="addOrUpdateInvoiceItem"
                :disabled="!isFormValid || !isInvoiceEditable || isDuplicateItem"
                class="add-button"
              >
                <el-icon><Plus v-if="!isEditing" /><Check v-else /></el-icon> 
                {{ isEditing ? 'Update Item' : 'Add to Table' }}
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <el-form :model="invoiceForm" class="invoice-form">
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
                  :disabled="!isInvoiceEditable || isEditing"
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
                    <el-icon v-if="ttacDrugsLoaded"><Check /></el-icon>
                    TTAC
                  </el-button>
                </el-tooltip>
                <el-icon v-if="barcodeParseSuccess" class="barcode-success-icon">
                  <CircleCheck />
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
        <div v-if="invoiceForm.selectedDrug" class="drug-info-display">
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
                                    <Check v-if="isDrugExistingInPharmacy" />
                <Plus v-else />
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
                      ? (invoiceForm.selectedDrug.persian_name || 
                         invoiceForm.selectedDrug.persianName || 
                         invoiceForm.selectedDrug.name_persian ||
                         invoiceForm.selectedDrug.english_name ||
                         invoiceForm.selectedDrug.englishName ||
                         invoiceForm.selectedDrug.name_english)
                      : (invoiceForm.selectedDrug.english_name ||
                         invoiceForm.selectedDrug.englishName ||
                         invoiceForm.selectedDrug.name_english ||
                         invoiceForm.selectedDrug.persian_name || 
                         invoiceForm.selectedDrug.persianName || 
                         invoiceForm.selectedDrug.name_persian)
                  }}</span>
                </div>
              </div>
            </el-col>
            <el-col :span="8" class="drug-info-col">
              <div class="company-info">
                <div v-if="invoiceForm.selectedDrug.english_company_name || invoiceForm.selectedDrug.englishCompanyName || invoiceForm.selectedDrug.company_name_english || invoiceForm.selectedDrug.persian_company_name || invoiceForm.selectedDrug.persianCompanyName || invoiceForm.selectedDrug.company_name_persian" class="company-name">
                  <span class="label">Company:</span>
                  <span class="company">{{ 
                    showPersianNamesInDisplay 
                      ? (invoiceForm.selectedDrug.persian_company_name || 
                         invoiceForm.selectedDrug.persianCompanyName || 
                         invoiceForm.selectedDrug.company_name_persian ||
                         invoiceForm.selectedDrug.english_company_name ||
                         invoiceForm.selectedDrug.englishCompanyName ||
                         invoiceForm.selectedDrug.company_name_english)
                      : (invoiceForm.selectedDrug.english_company_name ||
                         invoiceForm.selectedDrug.englishCompanyName ||
                         invoiceForm.selectedDrug.company_name_english ||
                         invoiceForm.selectedDrug.persian_company_name || 
                         invoiceForm.selectedDrug.persianCompanyName || 
                         invoiceForm.selectedDrug.company_name_persian)
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
              <div v-if="isDrugExistingInPharmacy && invoiceForm.selectedDrug.maximum_price" class="price-info">
                <span class="label">Maximum Price:</span>
                <span class="price-value maximum-price">{{ formatPrice(invoiceForm.selectedDrug.maximum_price) }}</span>
              </div>
            </el-col>
            <el-col :span="6" class="drug-info-col">
              <div v-if="isDrugExistingInPharmacy" class="price-info">
                <span class="label">Pharmacy Stock:</span>
                <span class="stock-value">{{ formatNumber(invoiceForm.selectedDrug.total_quantity || 0) }} units</span>
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
                      <el-icon><List /></el-icon>
                      Available Batches ({{ drugBatches.length }})
                    </el-button>
                  </template>
                  
                  <!-- Batches Table in Popover -->
                  <div class="batches-popover-content">
                    <div class="popover-header">
                      <h4>Stock Batches for {{ invoiceForm.selectedDrug.english_name || invoiceForm.selectedDrug.persian_name }}</h4>
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
              data-label="Batch Number"
              :class="{ 
                'has-value': hasValue(invoiceForm.batchNumber), 
                'is-focused': focusedField === 'batchNumber',
                'has-error': isDuplicateItem
              }"
            >
              <el-input
                v-model="invoiceForm.batchNumber"
                placeholder=""
                @focus="focusedField = 'batchNumber'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isInvoiceEditable"
                :class="{ 'is-duplicate': isDuplicateItem }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              data-label="Expiry Date"
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
                :disabled="!isInvoiceEditable"
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
              :class="{ 'has-value': hasValue(invoiceForm.unitsPerBox), 'is-focused': focusedField === 'unitsPerBox' }"
            >
              <el-input-number
                v-model="invoiceForm.unitsPerBox"
                :min="1"
                :controls="false"
                placeholder=""
                @change="calculateTotalQuantity"
                @focus="focusedField = 'unitsPerBox'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isInvoiceEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              data-label="Storage"
              data-required="true"
              :class="{ 'has-value': hasValue(invoiceForm.storage), 'is-focused': focusedField === 'storage' }"
            >
              <el-select
                v-model="invoiceForm.storage"
                placeholder=""
                style="width: 100%"
                @focus="focusedField = 'storage'"
                @blur="focusedField = null"
                :disabled="!isInvoiceEditable"
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
              :class="{ 'has-value': hasValue(invoiceForm.boxes), 'is-focused': focusedField === 'boxes' }"
            >
              <el-input-number
                v-model="invoiceForm.boxes"
                :min="1"
                :controls="false"
                placeholder=""
                @change="calculateTotalQuantity"
                @focus="focusedField = 'boxes'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isInvoiceEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="prizeBoxes"
              data-label="Prize Boxes"
              :class="{ 'has-value': hasValue(invoiceForm.prizeBoxes), 'is-focused': focusedField === 'prizeBoxes' }"
            >
              <el-input-number
                v-model="invoiceForm.prizeBoxes"
                :min="0"
                :controls="false"
                placeholder=""
                @change="calculateTotalQuantity"
                @focus="focusedField = 'prizeBoxes'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isInvoiceEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              data-label="Buy Price (per box)"
              data-required="true"
              :class="{ 'has-value': hasValue(invoiceForm.buyPrice), 'is-focused': focusedField === 'buyPrice' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="invoiceForm.buyPrice ? formatCurrency(invoiceForm.buyPrice) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'buyPrice')"
                  @focus="handleCurrencyFocus('buyPrice')"
                  @blur="handleCurrencyBlur('buyPrice')"
                  style="width: 100%"
                  class="currency-input"
                  :disabled="!isInvoiceEditable"
                />
                <div v-if="invoiceForm.buyPrice" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              data-label="Sell Price (per box)"
              data-required="true"
              :class="{ 'has-value': hasValue(invoiceForm.sellPrice), 'is-focused': focusedField === 'sellPrice' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="invoiceForm.sellPrice ? formatCurrency(invoiceForm.sellPrice) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'sellPrice')"
                  @focus="handleCurrencyFocus('sellPrice')"
                  @blur="handleCurrencyBlur('sellPrice')"
                  style="width: 100%"
                  class="currency-input"
                  :disabled="!isInvoiceEditable"
                />
                <div v-if="invoiceForm.sellPrice" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="discount"
              data-label="Discount"
              :class="{ 'has-value': hasValue(invoiceForm.discount), 'is-focused': focusedField === 'discount' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="invoiceForm.discount ? formatCurrency(invoiceForm.discount) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'discount')"
                  @focus="handleCurrencyFocus('discount')"
                  @blur="handleCurrencyBlur('discount')"
                  style="width: 100%"
                  class="currency-input"
                  :disabled="!isInvoiceEditable"
                />
                <div v-if="invoiceForm.discount" class="currency-display">ریال</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="tax"
              data-label="Tax"
              :class="{ 'has-value': hasValue(invoiceForm.tax), 'is-focused': focusedField === 'tax' }"
            >
              <div class="currency-input-container">
                <el-input
                  :model-value="invoiceForm.tax ? formatCurrency(invoiceForm.tax) : ''"
                  placeholder=""
                  @input="handleCurrencyInput($event, 'tax')"
                  @focus="handleCurrencyFocus('tax')"
                  @blur="handleCurrencyBlur('tax')"
                  style="width: 100%"
                  class="currency-input"
                  :disabled="!isInvoiceEditable"
                />
                <div v-if="invoiceForm.tax" class="currency-display">ریال</div>
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
              :class="{ 'has-value': hasValue(invoiceForm.totalQuantity), 'is-focused': focusedField === 'totalQuantity' }"
            >
              <el-input
                v-model="invoiceForm.totalQuantity"
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

    <!-- Invoice Items Table -->
    <el-card class="invoice-table-card" shadow="hover" v-if="invoiceItems.length > 0 || itemsLoading">
      <template #header>
        <div class="card-header">
          <span>
            Invoice Items - #{{ invoiceNumber }}
            <span v-if="itemsLoading" class="loading-indicator">
              <el-icon class="is-loading"><Loading /></el-icon>
              Loading...
            </span>
          </span>
          <div class="table-header-buttons">
            <el-button 
              v-if="invoiceStatus === 'draft' && invoiceItems.length > 0"
              type="success"
              size="small"
              @click="finalizeCurrentInvoice"
              :loading="processing"
              :disabled="itemsLoading"
            >
              <el-icon><Check /></el-icon>
              Finalize Invoice
            </el-button>
            <el-tag 
              :type="getStatusTagType(invoiceStatus)"
              size="large"
              style="margin-left: 10px;"
            >
              {{ invoiceHelpers.getStatusDisplay(invoiceStatus) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-table
        :data="invoiceItems"
        v-loading="itemsLoading"
        stripe
        style="width: 100%"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column type="index" label="#" width="70" align="center" :index="(index) => index + 1" />
        
        <el-table-column prop="drug_name" label="Drug Name" min-width="350">
          <template #default="scope">
            <div class="medicine-name">
              {{ scope.row.drug_name || 'N/A' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Boxes" width="80" align="center">
          <template #default="scope">
            <span>{{ scope.row.boxes || scope.row.quantity || 0 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Prizes" width="80" align="center">
          <template #default="scope">
            <span>{{ scope.row.prize_boxes || 0 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Units/Box" width="90" align="center">
          <template #default="scope">
            <span>{{ scope.row.units_per_box || 1 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Total Units" width="110" align="center">
          <template #default="scope">
            <span>{{ ((scope.row.boxes || 0) + (scope.row.prize_boxes || 0)) * (scope.row.units_per_box || 1) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Price/Box" width="120" align="center">
          <template #default="scope">
            <span>{{ formatPrice(scope.row.sell_price_per_box || scope.row.unit_price || 0) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Batch" width="100" align="center">
          <template #default="scope">
            <span>{{ scope.row.batch_number || 'N/A' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Total Amount Buy" width="140" align="center">
          <template #default="scope">
            <span>{{ formatPrice(calculateTotalAmountBuy(scope.row)) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="tax" label="Tax" width="100" align="center">
          <template #default="scope">
            <span>{{ formatPrice(scope.row.tax || 0) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="discount" label="Discount" width="100" align="center">
          <template #default="scope">
            <span>{{ formatPrice(scope.row.discount || 0) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Net Amount Paid" width="140" align="center">
          <template #default="scope">
            <span>{{ formatPrice(calculateNetAmountPaid(scope.row)) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Profit" width="120" align="center">
          <template #default="scope">
            <span>{{ formatPrice(calculateProfit(scope.row)) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="Actions" width="150" align="center" fixed="right">
          <template #default="scope">
            <div class="operations-container">
              <el-button
                size="small"
                type="primary"
                @click="editInvoiceItem(scope.$index)"
                plain
                :disabled="!isInvoiceEditable || (isEditing && editingItemIndex === scope.$index)"
              >
                {{ isEditing && editingItemIndex === scope.$index ? 'Editing...' : 'Edit' }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                @click="removeInvoiceItem(scope.$index)"
                :disabled="!isInvoiceEditable || (isEditing && editingItemIndex === scope.$index)"
              >
                Delete
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- No Data Message -->
    <div class="no-data-message" v-else-if="!itemsLoading">
      <p>No items found for Invoice #{{ invoiceNumber }}. Use the form above to add items.</p>
    </div>
    
    <!-- Loading State -->
    <div class="loading-message" v-else-if="itemsLoading && invoiceItems.length === 0">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <p>Loading invoice data...</p>
    </div>

    <!-- Add/Edit Medicine Dialog -->
    <AddMedicineDialog
      v-model="editDialogVisible"
      :drug-id="selectedDrugId"
      :mode="selectedDrugId ? 'edit' : 'add'"
      :initial-ttac-drug="pendingTtacDrug"
      @saved="handleDrugUpdated"
      @deleted="handleDrugDeleted"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Plus, Check, Close, ArrowLeft, ArrowRight, Switch, Printer, ArrowDown, Document, Tickets, InfoFilled, Loading, Edit, Lock, Delete, CircleCheck, List } from '@element-plus/icons-vue'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { useStorageStore } from '@/stores/storageStore'
import { useDistributionCompanyStore } from '@/stores/distributionCompanyStore'
import { useAuthStore } from '@/store/auth'
import { useTtacDrugsStore } from '@/store/ttacDrugs'
import AddMedicineDialog from '@/components/medicine/AddMedicineDialog.vue'
import { invoicesAPI, invoiceItemsAPI, invoiceHelpers } from '@/api/invoices'
import { formatDateJalali } from '@/utils/dateUtils'

// Props from parent tabs component
const props = defineProps({
  tabId: {
    type: String,
    required: true
  },
  initialInvoiceNumber: {
    type: Number,
    default: null
  }
})

// Emits to parent tabs component
const emit = defineEmits(['title-change', 'unsaved-changes', 'navigation-attempt', 'invoice-deleted'])

const drugStore = usePharmacyDrugStore()
const storageStore = useStorageStore()
const distributionCompanyStore = useDistributionCompanyStore()
const authStore = useAuthStore()
const ttacDrugsStore = useTtacDrugsStore()

// Invoice number state
const invoiceNumber = ref(props.initialInvoiceNumber || 1)
const lastValidInvoiceNumber = ref(props.initialInvoiceNumber || 1) // Track last valid number
const currentInvoiceId = ref(null)
const invoiceStatus = ref('draft')
const isValidatingInvoiceNumber = ref(false) // Flag to prevent title updates during validation
const isInvoiceNumberInvalid = ref(false) // Flag to show validation error state
const isCheckingInvoiceExists = ref(false) // Flag to show checking state

// Watch for changes in initialInvoiceNumber prop
watch(() => props.initialInvoiceNumber, (newNumber, oldNumber) => {
  if (newNumber && newNumber !== invoiceNumber.value && newNumber !== oldNumber) {
    invoiceNumber.value = newNumber
    lastValidInvoiceNumber.value = newNumber
    // Load the invoice data for this number
    loadInvoiceByNumber(newNumber)
  }
})

// Timestamp tracking
const createdAt = ref(new Date().toISOString())
const updatedAt = ref(new Date().toISOString())
const showCreated = ref(true)

// User and pharmacy info from stores
const currentUser = computed(() => authStore.currentUser?.email || authStore.currentUser?.username || 'Unknown User')
const pharmacyName = computed(() => storageStore.pharmacyInfo?.name || 'Unknown Pharmacy')

// Medicine dialog state
const editDialogVisible = ref(false)
const selectedDrugId = ref(null)
const pendingTtacDrug = ref(null) // Store TTAC drug data for auto-population

// Processing state
const processing = ref(false)

// Form data
const invoiceForm = reactive({
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

// Header form data
const headerForm = reactive({
  invoiceType: '',
  distributionCompany: null,
  invoiceNumber: '',
  paymentType: '',
  invoiceBuyDate: '',
  invoicePaymentDate: '',
  additionalDiscount: null,
  additionalTax: null
})

// Formatted dates for header
const formattedInvoiceBuyDate = ref('')
const formattedInvoicePaymentDate = ref('')

// Jalali dates for display
const jalaliInvoiceBuyDate = ref('')
const jalaliInvoicePaymentDate = ref('')

// Invoice computed fields for header
const invoiceComputedFields = reactive({
  totalDiscounts: '',
  totalTax: '',
  totalProfit: '',
  totalNetAmountPaid: ''
})

// Invoice type options
const invoiceTypeOptions = [
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

// Formatted expiry date for input
const formattedExpiryDate = ref('')

// Jalali date for display
const jalaliExpiryDate = ref('')

// Computed fields for display
const computedFields = reactive({
  buyPricePerUnit: '',
  sellPricePerUnit: '',
  totalAmountBuy: '',
  netAmountPaid: '',
  profit: '',
  profitPercentage: ''
})

// Available storages
const availableStorages = ref([])

// Auto-populated prices flag
const pricesAutoPopulated = ref(false)

// Unified search functionality
const selectedPharmacyDrug = ref(null)
const pharmacySearchResults = ref([])
const ttacSearchResults = ref([])
const combinedSearchResults = ref([])
const isSearchingPharmacy = ref(false)
const showPersianNamesInSearch = ref(false)
const showPersianNamesInDisplay = ref(true)
const barcodeParseSuccess = ref(false)
const ttacDrugInfo = ref(null)
const ttacDrugsLoaded = ref(false)
const unifiedSearchRef = ref(null)
const extractedGtin = ref('')
const focusedField = ref(null)
let searchTimeout = null
let lastSearchQuery = ''

// Batches state
const drugBatches = ref([])
const batchesLoading = ref(false)

// Legacy search functionality (kept for compatibility)
const searchResults = ref([])
const searchLoading = ref(false)
const selectedDrugInfo = ref(null)

// Invoice items data
const invoiceItems = ref([])
const itemsLoading = ref(false)

// Caching for faster navigation
const invoicesCache = ref(new Map()) // Cache invoices by status
const invoicesCacheTimestamp = ref(new Map()) // Track cache timestamps
const invoiceItemsCache = ref(new Map()) // Cache invoice items by invoice ID
const invoiceItemsCacheTimestamp = ref(new Map()) // Track items cache timestamps
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache duration

// Editing state
const isEditing = ref(false)
const editingItemIndex = ref(-1)
const originalItem = ref(null)

// Computed properties
const isInvoiceEditable = computed(() => {
  return invoiceStatus.value === 'draft'
})

const isFormValid = computed(() => {
  const validations = {
    selectedDrug: !!invoiceForm.selectedDrug && (invoiceForm.selectedDrug.id || invoiceForm.selectedDrug._isTtacDrug),
    storage: !!invoiceForm.storage,
    boxes: invoiceForm.boxes && invoiceForm.boxes > 0,
    buyPrice: invoiceForm.buyPrice !== null && invoiceForm.buyPrice !== '' && invoiceForm.buyPrice >= 0,
    sellPrice: invoiceForm.sellPrice !== null && invoiceForm.sellPrice !== '' && invoiceForm.sellPrice >= 0,
    // Make expiryDate and batchNumber optional
    expiryDate: true, // Always valid - optional field
    batchNumber: true  // Always valid - optional field
  }
  
  return Object.values(validations).every(Boolean)
})

// Check for duplicate drug and batch number combination
const isDuplicateItem = computed(() => {
  if (!invoiceForm.selectedDrug?.id || !invoiceForm.batchNumber) {
    return false
  }
  
  // Check for duplicates within current invoice items
  const duplicateInInvoice = invoiceItems.value.some((item, index) => {
    // Skip the current item being edited
    if (isEditing.value && index === editingItemIndex.value) {
      return false
    }
    
    return item.drug === invoiceForm.selectedDrug.id && 
           item.batch_number === invoiceForm.batchNumber
  })
  
  // Check for duplicates in pharmacy-wide existing batches
  const duplicateInPharmacy = drugStore.batches && drugStore.batches.some(batch => 
    batch.drug === invoiceForm.selectedDrug.id && 
    batch.batch_number === invoiceForm.batchNumber
  )
  
  return duplicateInInvoice || duplicateInPharmacy
})

const duplicateWarningMessage = computed(() => {
  if (!isDuplicateItem.value || !invoiceForm.selectedDrug?.id || !invoiceForm.batchNumber) return ''
  
  const drugName = invoiceForm.selectedDrug.english_name || invoiceForm.selectedDrug.persian_name || 'Unknown Drug'
  
  // Check which type of duplicate it is
  const duplicateInInvoice = invoiceItems.value.some((item, index) => {
    if (isEditing.value && index === editingItemIndex.value) return false
    return item.drug === invoiceForm.selectedDrug.id && item.batch_number === invoiceForm.batchNumber
  })
  
  const duplicateInPharmacy = drugStore.batches && drugStore.batches.some(batch => 
    batch.drug === invoiceForm.selectedDrug.id && batch.batch_number === invoiceForm.batchNumber
  )
  
  if (duplicateInPharmacy) {
    return `Warning: This drug (${drugName}) with batch number "${invoiceForm.batchNumber}" already exists in pharmacy inventory.`
  } else if (duplicateInInvoice) {
    return `Warning: This drug (${drugName}) with batch number "${invoiceForm.batchNumber}" already exists in this invoice.`
  }
  
  return ''
})

// Drug Info Display computed properties
const isDrugExistingInPharmacy = computed(() => {
  return invoiceForm.selectedDrug && 
         invoiceForm.selectedDrug.id && 
         invoiceForm.selectedDrug.total_quantity !== undefined &&
         !invoiceForm.selectedDrug._isTtacDrug
})

// Distribution companies for header form
const distributionCompanies = computed(() => {
  console.log('Computed distribution companies:', distributionCompanyStore.companies)
  return distributionCompanyStore.companies || []
})

// Watchers for parent component communication
watch(invoiceNumber, (newNumber) => {
  // Always emit title change when invoice number changes
  // The isValidatingInvoiceNumber flag is only for preventing input field updates
  emit('title-change', {
    tabId: props.tabId,
    title: `Invoice #${newNumber}`
  })
}, { immediate: true })

watch(invoiceStatus, (newStatus) => {
  // Emit unsaved changes status
  const hasUnsavedChanges = newStatus === 'draft'
  emit('unsaved-changes', {
    tabId: props.tabId,
    hasUnsavedChanges
  })
}, { deep: true, immediate: true })

// Watch for drug selection changes to load batches for duplicate checking
watch(() => invoiceForm.selectedDrug, async (newDrug) => {
  if (newDrug && newDrug.id) {
    // Load batches if not already loaded to enable duplicate checking
    if (!drugStore.batches || drugStore.batches.length === 0) {
      try {
        await drugStore.fetchBatches()
      } catch (error) {
        console.warn('Failed to load batches for duplicate checking:', error)
      }
    }
  }
}, { deep: true })

// Methods
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

// Invoice number navigation methods
const previousInvoiceNumber = async () => {
  if (invoiceNumber.value > 1) {
    const targetNumber = invoiceNumber.value - 1
    
    // Check if this invoice number is already open in another tab
    const navigationAllowed = await checkNavigationPermission(targetNumber)
    if (!navigationAllowed) {
      return
    }
    
    // Try to load the invoice - this will check existence internally
    invoiceNumber.value = targetNumber
    const loadSuccess = await loadInvoiceByNumber(targetNumber)
    if (loadSuccess) {
      lastValidInvoiceNumber.value = targetNumber
      emit('title-change', {
        tabId: props.tabId,
        title: `Invoice #${targetNumber}`
      })
    } else {
      // Revert if load failed and show message
      invoiceNumber.value = lastValidInvoiceNumber.value
      ElMessage.warning(`Invoice #${targetNumber} does not exist`)
    }
  }
}

const nextInvoiceNumber = async () => {
  const targetNumber = invoiceNumber.value + 1
  
  // Check if this invoice number is already open in another tab
  const navigationAllowed = await checkNavigationPermission(targetNumber)
  if (!navigationAllowed) {
    return
  }
  
  // Try to load the invoice - this will check existence internally
  invoiceNumber.value = targetNumber
  const loadSuccess = await loadInvoiceByNumber(targetNumber)
  if (loadSuccess) {
    lastValidInvoiceNumber.value = targetNumber
    emit('title-change', {
      tabId: props.tabId,
      title: `Invoice #${targetNumber}`
    })
  } else {
    // Revert if load failed and show message
    invoiceNumber.value = lastValidInvoiceNumber.value
    ElMessage.warning(`Invoice #${targetNumber} does not exist`)
  }
}

const onInvoiceNumberInput = async (value) => {
  // Don't change anything during input - wait for validation on blur
  // This prevents the number from changing in the container and tab
}

const validateInvoiceNumber = async () => {
  const inputValue = parseInt(invoiceNumber.value)
  
  // Reset invalid state
  isInvoiceNumberInvalid.value = false
  
  // Validate input range
  if (isNaN(inputValue) || inputValue < 1) {
    // Revert to last valid number for invalid input
    invoiceNumber.value = lastValidInvoiceNumber.value
    isInvoiceNumberInvalid.value = true
    ElMessage.warning('Invoice number must be at least 1')
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isInvoiceNumberInvalid.value = false
    }, 2000)
    return
  }
    
  // If the value is the same as current, no need to validate
  if (inputValue === lastValidInvoiceNumber.value) {
    return
  }
  
  // Check if this invoice number is already open in another tab
  const navigationAllowed = await checkNavigationPermission(inputValue)
  if (!navigationAllowed) {
    // Revert to last valid invoice number
    invoiceNumber.value = lastValidInvoiceNumber.value
    isInvoiceNumberInvalid.value = true
    await nextTick() // Ensure DOM is updated
    // Clear invalid state after a delay
    setTimeout(() => {
      isInvoiceNumberInvalid.value = false
    }, 2000)
    return
  }
  
  // Check if invoice exists before allowing navigation
  isCheckingInvoiceExists.value = true
  const invoiceExists = await checkInvoiceExists(inputValue)
  isCheckingInvoiceExists.value = false
  
  if (!invoiceExists) {
    // Invoice doesn't exist - revert to last valid number
    invoiceNumber.value = lastValidInvoiceNumber.value
    isInvoiceNumberInvalid.value = true
    ElMessage.warning(`Invoice #${inputValue} does not exist`)
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isInvoiceNumberInvalid.value = false
    }, 2000)
    return
  }
  
  // Invoice exists - try to load it
  const loadSuccess = await loadInvoiceByNumber(inputValue)
  if (loadSuccess) {
    lastValidInvoiceNumber.value = inputValue
    isInvoiceNumberInvalid.value = false
    // Ensure tab title is updated after successful validation
    emit('title-change', {
      tabId: props.tabId,
      title: `Invoice #${inputValue}`
    })
  } else {
    // Load failed for some reason - revert
    invoiceNumber.value = lastValidInvoiceNumber.value
    isInvoiceNumberInvalid.value = true
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isInvoiceNumberInvalid.value = false
    }, 2000)
  }
}

// Function to check navigation permission from parent
const checkNavigationPermission = (targetInvoiceNumber) => {
  return new Promise((resolve) => {
    // Emit navigation attempt to parent
    emit('navigation-attempt', {
      tabId: props.tabId,
      targetInvoiceNumber,
      currentInvoiceNumber: invoiceNumber.value,
      callback: resolve
    })
  })
}

// Function to get cached invoices or fetch them if cache is expired
const getCachedInvoices = async (status) => {
  const now = Date.now()
  const cacheKey = status
  
  // Check if we have cached data and it's still valid
  if (invoicesCache.value.has(cacheKey) && invoicesCacheTimestamp.value.has(cacheKey)) {
    const cacheTime = invoicesCacheTimestamp.value.get(cacheKey)
    if (now - cacheTime < CACHE_DURATION) {
      return invoicesCache.value.get(cacheKey)
    }
  }
  
  // Fetch fresh data
  try {
    const response = await invoicesAPI.getInvoicesByStatus(status)
    const invoices = response.data.results || []
    
    // Update cache
    invoicesCache.value.set(cacheKey, invoices)
    invoicesCacheTimestamp.value.set(cacheKey, now)
    
    return invoices
  } catch (error) {
    console.warn(`Failed to fetch ${status} invoices:`, error)
    return []
  }
}

// Function to get all invoices from cache or fetch if needed
const getAllInvoicesFromCache = async () => {
  const allInvoices = []
  const statuses = ['draft', 'finalized', 'cancelled']
  
  for (const status of statuses) {
    const invoices = await getCachedInvoices(status)
    allInvoices.push(...invoices)
  }
  
  return allInvoices
}

// Function to invalidate cache when invoices are modified
const invalidateInvoicesCache = () => {
  invoicesCache.value.clear()
  invoicesCacheTimestamp.value.clear()
  invoiceItemsCache.value.clear()
  invoiceItemsCacheTimestamp.value.clear()
}

// Function to invalidate items cache for a specific invoice
const invalidateInvoiceItemsCache = (invoiceId) => {
  const cacheKey = invoiceId.toString()
  invoiceItemsCache.value.delete(cacheKey)
  invoiceItemsCacheTimestamp.value.delete(cacheKey)
}

// Function to check if an invoice number exists without loading it
const checkInvoiceExists = async (invoiceNum) => {
  try {
    // Use cached data for faster checking
    const allInvoices = await getAllInvoicesFromCache()
    
    // Check if invoice with the specified number exists
    return allInvoices.some(inv => inv.invoice_number === invoiceNum)
  } catch (error) {
    console.error('Error checking invoice existence:', error)
    return false
  }
}

const loadInvoiceByNumber = async (invoiceNum) => {
  try {
    const startTime = performance.now()
    isValidatingInvoiceNumber.value = true
    
    // Use cached data for faster loading
    const cacheStartTime = performance.now()
    const allInvoices = await getAllInvoicesFromCache()
    const cacheEndTime = performance.now()
    console.log(`Cache lookup took: ${cacheEndTime - cacheStartTime}ms`)
    
    // Find invoice with the specified number
    const findStartTime = performance.now()
    const targetInvoice = allInvoices.find(inv => inv.invoice_number === invoiceNum)
    const findEndTime = performance.now()
    console.log(`Invoice find took: ${findEndTime - findStartTime}ms`)
    
    if (targetInvoice) {
      // Load existing invoice
      currentInvoiceId.value = targetInvoice.id
      invoiceStatus.value = targetInvoice.status
      createdAt.value = targetInvoice.created_at
      updatedAt.value = targetInvoice.updated_at
      
      // Clear form and reset editing state immediately for faster UI response
      const resetStartTime = performance.now()
      resetForm()
      isEditing.value = false
      editingItemIndex.value = -1
      originalItem.value = null
      const resetEndTime = performance.now()
      console.log(`Form reset took: ${resetEndTime - resetStartTime}ms`)
      
      // Load full invoice details to populate header form
      await loadInvoiceHeaderData(targetInvoice.id)
      
      // Load invoice items in background (don't await for faster UI)
      const itemsStartTime = performance.now()
      loadInvoiceItems().then(() => {
        const itemsEndTime = performance.now()
        console.log(`Items loading took: ${itemsEndTime - itemsStartTime}ms`)
      })
      
      const totalTime = performance.now() - startTime
      console.log(`Total invoice loading took: ${totalTime}ms for invoice #${invoiceNum} (${invoiceHelpers.getStatusDisplay(targetInvoice.status)})`)
      return true // Success
    } else {
      // No invoice found with this number
      return false // Failed - invoice doesn't exist
    }
    
  } catch (error) {
    console.error('Error loading invoice:', error)
    ElMessage.error('Failed to load invoice data')
    
    // Clear data on error
    currentInvoiceId.value = null
    invoiceStatus.value = 'draft'
    
    return false // Failed due to error
    
  } finally {
    isValidatingInvoiceNumber.value = false
  }
}

const createNewInvoice = async () => {
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
    
    // Update local state
    currentInvoiceId.value = newInvoice.id
    invoiceNumber.value = nextInvoiceNumber
    lastValidInvoiceNumber.value = nextInvoiceNumber
    invoiceStatus.value = 'draft'
    
    // Reset timestamps
    createdAt.value = newInvoice.created_at
    updatedAt.value = newInvoice.updated_at
    showCreated.value = true
    
    // Clear invoice items since this is a new empty invoice
    invoiceItems.value = []
    
    // Reset form to clear any existing data
    resetForm()
    
    // Reset header form for new invoice
    Object.assign(headerForm, {
      invoiceType: '',
      distributionCompany: null,
      invoiceNumber: '',
      paymentType: '',
      invoiceBuyDate: '',
      invoicePaymentDate: '',
      additionalDiscount: null,
      additionalTax: null
    })
    formattedInvoiceBuyDate.value = ''
    jalaliInvoiceBuyDate.value = ''
    formattedInvoicePaymentDate.value = ''
    jalaliInvoicePaymentDate.value = ''
    
    ElMessage.success(`New invoice #${nextInvoiceNumber} created successfully!`)
    
    // Invalidate cache after creating new invoice
    invalidateInvoicesCache()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error creating new invoice:', error)
      ElMessage.error('Failed to create new invoice: ' + (error.response?.data?.error || error.message))
    }
  }
}

const deleteEntireInvoice = async () => {
  if (!currentInvoiceId.value) {
    ElMessage.error('No invoice to delete')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete Invoice #${invoiceNumber.value}? This action cannot be undone.`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    processing.value = true
    
    await invoicesAPI.deleteInvoiceWithItems(currentInvoiceId.value)
    
    ElMessage.success(`Invoice #${invoiceNumber.value} has been completely deleted!`)
    
    // Invalidate cache after deleting invoice
    invalidateInvoicesCache()
    
    // Emit event to parent to handle tab closure
    emit('invoice-deleted', {
      tabId: props.tabId,
      invoiceNumber: invoiceNumber.value
    })
    
    // Reset the component state
    currentInvoiceId.value = null
    invoiceStatus.value = 'draft'
    createdAt.value = new Date().toISOString()
    updatedAt.value = new Date().toISOString()
    
    // Navigate to the last available invoice
    await navigateToLastAvailableInvoice()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting entire invoice:', error)
      ElMessage.error('Failed to delete invoice: ' + (error.response?.data?.error || error.message))
    }
  } finally {
    processing.value = false
  }
}

// Function to navigate to the last available invoice
const navigateToLastAvailableInvoice = async () => {
  try {
    // Get all invoices ordered by invoice_number descending to find the highest number
    const response = await invoicesAPI.getInvoices({ 
      ordering: '-invoice_number',
      page_size: 1
    })
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const lastInvoice = response.data.results[0]
      const lastInvoiceNumber = lastInvoice.invoice_number
      
      // Navigate to this invoice
      invoiceNumber.value = lastInvoiceNumber
      await loadInvoiceByNumber(lastInvoiceNumber)
      lastValidInvoiceNumber.value = lastInvoiceNumber
      
      ElMessage.success(`Navigated to the last available invoice #${lastInvoiceNumber}`)
    } else {
      // No invoices exist - clear the interface
      currentInvoiceId.value = null
      invoiceNumber.value = 1
      invoiceStatus.value = 'draft'
      lastValidInvoiceNumber.value = 1
      
      ElMessage.info('No invoices available. Interface cleared.')
    }
  } catch (error) {
    console.error('Error navigating to last available invoice:', error)
    ElMessage.error('Failed to navigate to last invoice: ' + (error.response?.data?.error || error.message))
  }
}

// Create DrugBatch instances from invoice items
const createDrugBatchesFromInvoice = async () => {
  if (!invoiceItems.value || invoiceItems.value.length === 0) {
    console.log('No invoice items to create batches from')
    return
  }

  const pharmacyId = authStore.user?.pharmacy
  if (!pharmacyId) {
    console.error('No pharmacy ID available for batch creation')
    return
  }

  console.log(`Creating drug batches for ${invoiceItems.value.length} invoice items...`)

  for (const item of invoiceItems.value) {
    try {
      // Step 1: Extract data from invoice item
      const drugId = item.drug
      const batchNumber = item.batch_number
      const totalUnits = ((item.boxes || 0) + (item.prize_boxes || 0)) * (item.units_per_box || 1)
      const expiryDate = item.expiry_date
      const sellPricePerUnit = item.sell_price_per_box ? (item.sell_price_per_box / (item.units_per_box || 1)) : 0
      const storageId = item.storage

      // Skip items without essential data
      if (!drugId || !batchNumber || !expiryDate || totalUnits <= 0) {
        console.warn('Skipping item due to missing essential data:', {
          drugId, batchNumber, expiryDate, totalUnits
        })
        continue
      }

      // Check if batch with same drug and batch number already exists in pharmacy
      // Load existing batches if not already loaded
      if (!drugStore.batches || drugStore.batches.length === 0) {
        await drugStore.fetchBatches()
      }

      const existingBatch = drugStore.batches.find(batch => 
        batch.drug === drugId && batch.batch_number === batchNumber
      )

      if (existingBatch) {
        console.log(`Batch already exists in pharmacy for drug ${drugId} with batch number ${batchNumber}, skipping creation`)
        continue
      }

      // Step 2-3: Prepare data for DrugBatch model and create instance
      const batchData = {
        drug: drugId,
        batch_number: batchNumber,
        price: sellPricePerUnit, // Price per unit
        expiry_date: expiryDate,
        locations: storageId ? [{
          storage: storageId,
          quantity: totalUnits
        }] : []
      }

      console.log('Creating batch:', {
        drug: drugId,
        batch_number: batchNumber,
        price: sellPricePerUnit,
        expiry_date: expiryDate,
        totalUnits,
        storage: storageId
      })

      // Create the batch using the pharmacy drug store
      await drugStore.createBatch(batchData)

    } catch (error) {
      console.error('Error creating batch for item:', item, error)
      // Continue with other items even if one fails
    }
  }

  console.log('Finished creating drug batches from invoice')
  
  // Show success message if any batches were created
  const createdBatches = invoiceItems.value.filter(item => 
    item.drug && item.batch_number && item.expiry_date && 
    (((item.boxes || 0) + (item.prize_boxes || 0)) * (item.units_per_box || 1)) > 0
  ).length
  
  if (createdBatches > 0) {
    ElMessage.success(`Drug batches automatically created from invoice items`)
  }
}

const finalizeCurrentInvoice = async () => {
  if (!currentInvoiceId.value) {
    ElMessage.error('No active invoice to finalize')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to finalize Invoice #${invoiceNumber.value}? This will lock the invoice and prevent further changes.`,
      'Finalize Invoice',
      {
        confirmButtonText: 'Yes, Finalize',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    processing.value = true

    // Step 1: Save all Invoice Information header data before finalizing
    const invoiceHeaderData = {
      invoice_type: headerForm.invoiceType || null,
      distribution_company: headerForm.distributionCompany || null,
      invoice_reference_number: headerForm.invoiceNumber || null,
      payment_type: headerForm.paymentType || null,
      invoice_buy_date: headerForm.invoiceBuyDate || null,
      invoice_payment_date: headerForm.invoicePaymentDate || null,
      additional_discount: headerForm.additionalDiscount || 0,
      additional_tax: headerForm.additionalTax || 0
    }

    console.log('Saving Invoice Information header data before finalization:', invoiceHeaderData)

    // Update the invoice with header data
    try {
      await invoicesAPI.patchInvoice(currentInvoiceId.value, invoiceHeaderData)
      console.log('Invoice Information header data saved successfully')
    } catch (headerError) {
      console.error('Error saving invoice header data:', headerError)
      ElMessage.error('Failed to save invoice information: ' + (headerError.response?.data?.error || headerError.message))
      return
    }

    // Step 2: Finalize the invoice in the backend
    const response = await invoicesAPI.finalizeInvoice(currentInvoiceId.value)
    
    // Step 3: Create DrugBatch instances for all invoice items in background
    try {
      await createDrugBatchesFromInvoice()
    } catch (batchError) {
      console.warn('Error creating drug batches (non-critical):', batchError)
      // Don't fail the finalization if batch creation fails
    }
    
    // Update local state
    invoiceStatus.value = 'finalized'
    updatedAt.value = new Date().toISOString()
    
    // Invalidate cache after finalizing invoice
    invalidateInvoicesCache()
    
    ElMessage.success(`Invoice #${invoiceNumber.value} has been finalized successfully! All Invoice Information fields are now locked.`)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error finalizing invoice:', error)
      ElMessage.error('Failed to finalize invoice: ' + (error.response?.data?.error || error.message))
    }
  } finally {
    processing.value = false
  }
}

const toggleTimestamp = () => {
  showCreated.value = !showCreated.value
}

const handleDrugEdit = () => {
  // Open the AddMedicineDialog in add mode
  selectedDrugId.value = null
  editDialogVisible.value = true
  ElMessage.info('Opening Add Medicine dialog...')
}

const handleAddTtacDrugToPharmacy = async (ttacDrug) => {
  try {
    // Show confirmation dialog
    await ElMessageBox.confirm(
      `The drug "${ttacDrug.name_persian || ttacDrug.name_english}" is not in your pharmacy database yet. 
      
Would you like to add it now? The Add Medicine dialog will open with the GTIN code pre-filled.`,
      'Add Drug to Pharmacy',
      {
        confirmButtonText: 'Yes, Add Drug',
        cancelButtonText: 'Cancel',
        type: 'info',
        dangerouslyUseHTMLString: true
      }
    )
    
    // Open the AddMedicineDialog with the GTIN code pre-filled
    selectedDrugId.value = null
    pendingTtacDrug.value = ttacDrug // Store the TTAC drug data
    editDialogVisible.value = true
    
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error handling TTAC drug addition:', error)
    }
    // User cancelled - do nothing
  }
}

const handleDrugUpdated = async (drug) => {
  ElMessage.success('Drug saved successfully!')
  
  // Refresh the drugs list to include the new/updated drug
  await drugStore.fetchDrugs()
  
  // If this was a TTAC drug being added, auto-select it in the form
  if (pendingTtacDrug.value && drug) {
    // Find the newly created drug in the store
    const newDrug = drugStore.drugs.find(d => d.gtin_code === pendingTtacDrug.value.gtin_code)
    if (newDrug) {
      // Auto-select the newly created drug
      invoiceForm.selectedDrug = newDrug
      
      // Fetch batches and TTAC info for the new drug
      if (newDrug.id) {
        await fetchDrugBatches(newDrug.id)
        if (newDrug.gtin_code) {
          await fetchTtacDrugInfo(newDrug.gtin_code)
        }
      }
      
      ElMessage.success('Drug added to pharmacy and automatically selected!')
    }
    
    // Clear the pending TTAC drug
    pendingTtacDrug.value = null
  }
}

const handleDrugDeleted = (drugId) => {
  editDialogVisible.value = false
  ElMessage.success('Drug deleted successfully!')
  
  // Refresh the drugs list to remove the deleted drug
  drugStore.fetchDrugs()
}

const handlePrintCommand = (command) => {
  ElMessage.info(`Print command: ${command}`)
  // TODO: Implement print functionality
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

const getStatusTagType = (status) => {
  return invoiceHelpers.getStatusColor(status)
}

const showStatusInfo = () => {
  ElMessage({
    type: 'info',
    message: `Current invoice status: ${invoiceHelpers.getStatusDisplay(invoiceStatus.value)}`,
    duration: 5000
  })
}

const loadLastInvoiceNumber = async () => {
  try {
    // Use cached data for faster loading
    const allInvoices = await getAllInvoicesFromCache()
    
    if (allInvoices.length > 0) {
      // Find the highest invoice number
      const highestInvoice = allInvoices.reduce((max, current) => {
        return current.invoice_number > max.invoice_number ? current : max
      })
      
      // Set the invoice number and load its data
      invoiceNumber.value = highestInvoice.invoice_number
      await loadInvoiceByNumber(highestInvoice.invoice_number)
      
      console.log(`Loaded last invoice #${highestInvoice.invoice_number} (${invoiceHelpers.getStatusDisplay(highestInvoice.status)})`)
    } else {
      // No invoices found, start with invoice #1
      invoiceNumber.value = 1
      await loadInvoiceByNumber(1)
      console.log('No existing invoices found, starting with invoice #1')
    }
    
  } catch (error) {
    console.error('Error loading last invoice number:', error)
    // Fallback to invoice #1
    invoiceNumber.value = 1
    await loadInvoiceByNumber(1)
    ElMessage.warning('Could not load last invoice, starting with invoice #1')
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
    
    // Search through pharmacy drugs locally
    const queryLower = query.toLowerCase()
    const results = drugStore.drugs.filter(drug => 
      (drug.english_name && drug.english_name.toLowerCase().includes(queryLower)) ||
      (drug.persian_name && drug.persian_name.toLowerCase().includes(queryLower)) ||
      (drug.gtin_code && drug.gtin_code.toLowerCase().includes(queryLower))
    )
    
    // Filter to only show drugs with available stock
    searchResults.value = results.filter(drug => (drug.total_quantity || 0) > 0)
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

const onDrugSelect = (drugId) => {
  if (!drugId) {
    selectedDrugInfo.value = null
    return
  }

  const drug = searchResults.value.find(d => d.id === drugId)
  if (drug) {
    selectedDrugInfo.value = {
      ...drug,
      name: drug.english_name || drug.persian_name,
      total_quantity: drug.total_quantity || 0
    }
    
    // Set a default price if available
    if (drug.latest_price) {
      invoiceForm.unitPrice = parseFloat(drug.latest_price)
    }
  }
}



const addOrUpdateInvoiceItem = async () => {
  if (!isFormValid.value) {
    ElMessage.warning('Please fill in all required fields')
    return
  }

  try {
    processing.value = true
    
    // Ensure we have a current invoice session
    if (!currentInvoiceId.value) {
      await createInvoiceSession()
    }

    // Handle drug field - extract ID for existing drugs or handle TTAC drugs
    let drugId = null
    if (invoiceForm.selectedDrug) {
      if (invoiceForm.selectedDrug.id) {
        // Existing pharmacy drug - use its ID
        drugId = invoiceForm.selectedDrug.id
      } else if (invoiceForm.selectedDrug._isTtacDrug) {
        // New TTAC drug - help user add it to pharmacy
        await handleAddTtacDrugToPharmacy(invoiceForm.selectedDrug)
        return
      } else {
        ElMessage.error('Invalid drug selection. Please select a valid drug.')
        return
      }
    }

    // Check for duplicate drug and batch number combination
    if (drugId && invoiceForm.batchNumber) {
      // Check for duplicates within current invoice items
      const duplicateInInvoice = invoiceItems.value.some((item, index) => {
        // Skip the current item being edited
        if (isEditing.value && index === editingItemIndex.value) {
          return false
        }
        
        return item.drug === drugId && item.batch_number === invoiceForm.batchNumber
      })
      
      // Check for duplicates in pharmacy-wide existing batches
      const duplicateInPharmacy = drugStore.batches && drugStore.batches.some(batch => 
        batch.drug === drugId && batch.batch_number === invoiceForm.batchNumber
      )
      
      const drugName = invoiceForm.selectedDrug.english_name || invoiceForm.selectedDrug.persian_name || 'Unknown Drug'
      
      if (duplicateInPharmacy) {
        ElMessage.error(`This drug (${drugName}) with batch number "${invoiceForm.batchNumber}" already exists in pharmacy inventory. Please select a different batch or drug.`)
        return
      } else if (duplicateInInvoice) {
        ElMessage.error(`This drug (${drugName}) with batch number "${invoiceForm.batchNumber}" already exists in this invoice. Please select a different batch or drug.`)
        return
      }
    }

    const itemData = {
      invoice: currentInvoiceId.value,
      drug: drugId,
      
      // Factor-style fields
      expiry_date: invoiceForm.expiryDate || null,
      units_per_box: invoiceForm.unitsPerBox || null,
      boxes: invoiceForm.boxes || null,
      batch_number: invoiceForm.batchNumber || null,
      prize_boxes: invoiceForm.prizeBoxes || 0,
      buy_price_per_box: invoiceForm.buyPrice || null,
      sell_price_per_box: invoiceForm.sellPrice || null,
      
      // Amount-based tax and discount (not rates)
      tax: invoiceForm.tax || 0,
      discount: invoiceForm.discount || 0,
      
      // Storage and notes
      storage: invoiceForm.storage || null,
      notes: invoiceForm.notes || '',
      
      // Legacy fields for backward compatibility (will be calculated by backend)
      quantity: null,
      unit_price: null,
      tax_rate: null,
      discount_rate: null
    }
    
    console.log('Sending item data:', itemData)

    if (isEditing.value) {
      // Update existing item
      const currentItem = invoiceItems.value[editingItemIndex.value]
      await invoiceItemsAPI.updateInvoiceItem(currentItem.id, itemData)
      ElMessage.success('Invoice item updated successfully!')
    } else {
      // Create new item
      await invoiceItemsAPI.createInvoiceItem(itemData)
      ElMessage.success('Invoice item added successfully!')
    }

    // Invalidate cache for this invoice and reload items
    invalidateInvoiceItemsCache(currentInvoiceId.value)
    await loadInvoiceItems()
    
    // Reset form
    resetForm()
    
  } catch (error) {
    console.error('Error saving invoice item:', error)
    ElMessage.error('Failed to save invoice item: ' + (error.response?.data?.error || error.message))
  } finally {
    processing.value = false
  }
}

const editInvoiceItem = async (index) => {
  if (!isInvoiceEditable.value) {
    ElMessage.error('Cannot edit items in a finalized invoice')
    return
  }

  const item = invoiceItems.value[index]
  originalItem.value = { ...item }
  
  // Find the full drug object from the store
  let drugObject = null
  if (item.drug) {
    drugObject = drugStore.drugs.find(drug => drug.id === item.drug)
    if (!drugObject) {
      ElMessage.warning('Drug not found in store. Please refresh the page.')
      return
    }
  }
  
  // Populate form with item data
  invoiceForm.selectedDrug = drugObject
  
  // Factor-style fields
  invoiceForm.expiryDate = item.expiry_date || ''
  invoiceForm.unitsPerBox = item.units_per_box || null
  invoiceForm.boxes = item.boxes || null
  invoiceForm.batchNumber = item.batch_number || ''
  invoiceForm.prizeBoxes = item.prize_boxes || 0
  invoiceForm.buyPrice = item.buy_price_per_box || null
  invoiceForm.sellPrice = item.sell_price_per_box || null
  invoiceForm.discount = Number(item.discount) || 0
  invoiceForm.tax = Number(item.tax) || 0
  invoiceForm.storage = item.storage || ''
  invoiceForm.notes = item.notes || ''
  
  // Update formatted expiry date
  if (item.expiry_date) {
    formattedExpiryDate.value = item.expiry_date
    jalaliExpiryDate.value = formatDateJalali(item.expiry_date)
  }
  
  isEditing.value = true
  editingItemIndex.value = index
  
  // Fetch batches and TTAC info for the selected drug in edit mode
  if (drugObject && drugObject.id) {
    console.log('Fetching batches for drug in edit mode:', drugObject.id, drugObject.english_name || drugObject.persian_name)
    await fetchDrugBatches(drugObject.id)
    
    // Also fetch TTAC drug information for price comparison
    if (drugObject.gtin_code) {
      await fetchTtacDrugInfo(drugObject.gtin_code)
    }
  } else {
    console.warn('Drug object not found or missing ID for batch fetching:', { drugObject, itemDrugId: item.drug })
  }
  
  // Recalculate computed fields after populating the form and setting edit state
  await nextTick()
  calculateTotalQuantity()
  calculateComputedFields()
}

const removeInvoiceItem = async (index) => {
  if (!isInvoiceEditable.value) {
    ElMessage.error('Cannot delete items from a finalized invoice')
    return
  }

  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this invoice item?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    const item = invoiceItems.value[index]
    await invoiceItemsAPI.deleteInvoiceItem(item.id)
    
    // Invalidate cache for this invoice and reload items
    invalidateInvoiceItemsCache(currentInvoiceId.value)
    await loadInvoiceItems()
    
    ElMessage.success('Invoice item deleted successfully!')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting invoice item:', error)
      ElMessage.error('Failed to delete invoice item')
    }
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editingItemIndex.value = -1
  originalItem.value = null
  resetForm()
}

const resetForm = () => {
  Object.assign(invoiceForm, {
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
  
  formattedExpiryDate.value = ''
  jalaliExpiryDate.value = ''
  extractedGtin.value = ''
  pricesAutoPopulated.value = false
  ttacDrugInfo.value = null
  drugBatches.value = []
  
  selectedDrugInfo.value = null
  searchResults.value = []
  isEditing.value = false
  editingItemIndex.value = -1
  originalItem.value = null
}

const createInvoiceSession = async () => {
  try {
    const newInvoiceData = {
      invoice_number: invoiceNumber.value,
      status: 'draft'
    }
    
    const response = await invoicesAPI.createInvoice(newInvoiceData)
    const newInvoice = response.data
    
    currentInvoiceId.value = newInvoice.id
    invoiceStatus.value = 'draft'
    createdAt.value = newInvoice.created_at
    updatedAt.value = newInvoice.updated_at
    
    ElMessage.success(`Invoice session #${invoiceNumber.value} created`)
    
  } catch (error) {
    console.error('Error creating invoice session:', error)
    throw error
  }
}

const loadInvoiceHeaderData = async (invoiceId) => {
  try {
    console.log('Loading invoice header data for invoice ID:', invoiceId)
    const response = await invoicesAPI.getInvoice(invoiceId)
    const invoiceData = response.data
    
    console.log('Received invoice data:', invoiceData)
    
    // Populate header form with invoice data
    headerForm.invoiceType = invoiceData.invoice_type || ''
    headerForm.distributionCompany = invoiceData.distribution_company || null
    headerForm.invoiceNumber = invoiceData.invoice_reference_number || ''
    headerForm.paymentType = invoiceData.payment_type || ''
    headerForm.invoiceBuyDate = invoiceData.invoice_buy_date || ''
    headerForm.invoicePaymentDate = invoiceData.invoice_payment_date || ''
    headerForm.additionalDiscount = invoiceData.additional_discount || null
    headerForm.additionalTax = invoiceData.additional_tax || null
    
    // Update formatted date fields
    if (invoiceData.invoice_buy_date) {
      formattedInvoiceBuyDate.value = invoiceData.invoice_buy_date.replace(/-/g, '/')
      jalaliInvoiceBuyDate.value = formatDateJalali(new Date(invoiceData.invoice_buy_date))
    } else {
      formattedInvoiceBuyDate.value = ''
      jalaliInvoiceBuyDate.value = ''
    }
    
    if (invoiceData.invoice_payment_date) {
      formattedInvoicePaymentDate.value = invoiceData.invoice_payment_date.replace(/-/g, '/')
      jalaliInvoicePaymentDate.value = formatDateJalali(new Date(invoiceData.invoice_payment_date))
    } else {
      formattedInvoicePaymentDate.value = ''
      jalaliInvoicePaymentDate.value = ''
    }
    
    console.log('Header form populated with invoice data')
  } catch (error) {
    console.error('Error loading invoice header data:', error)
    // Reset header form on error
    Object.assign(headerForm, {
      invoiceType: '',
      distributionCompany: null,
      invoiceNumber: '',
      paymentType: '',
      invoiceBuyDate: '',
      invoicePaymentDate: '',
      additionalDiscount: null,
      additionalTax: null
    })
    formattedInvoiceBuyDate.value = ''
    jalaliInvoiceBuyDate.value = ''
    formattedInvoicePaymentDate.value = ''
    jalaliInvoicePaymentDate.value = ''
  }
}

const loadInvoiceItems = async (invoiceId = null) => {
  const targetInvoiceId = invoiceId || currentInvoiceId.value
  if (!targetInvoiceId) return
  
  try {
    itemsLoading.value = true
    
    // Check cache first
    const now = Date.now()
    const cacheKey = targetInvoiceId.toString()
    
    if (invoiceItemsCache.value.has(cacheKey) && invoiceItemsCacheTimestamp.value.has(cacheKey)) {
      const cacheTime = invoiceItemsCacheTimestamp.value.get(cacheKey)
      if (now - cacheTime < CACHE_DURATION) {
        // Use cached data
        invoiceItems.value = invoiceItemsCache.value.get(cacheKey)
        console.log(`Using cached items for invoice ${targetInvoiceId}`)
        return
      }
    }
    
    // Fetch fresh data
    const response = await invoiceItemsAPI.getItemsByInvoice(targetInvoiceId)
    const items = response.data.results || []
    
    // Update cache
    invoiceItemsCache.value.set(cacheKey, items)
    invoiceItemsCacheTimestamp.value.set(cacheKey, now)
    
    invoiceItems.value = items
    console.log(`Fetched fresh items for invoice ${targetInvoiceId}`)
    
    // Calculate header computed fields
    calculateInvoiceComputedFields()
    
  } catch (error) {
    console.error('Error loading invoice items:', error)
    invoiceItems.value = []
    // Reset computed fields on error
    calculateInvoiceComputedFields()
  } finally {
    itemsLoading.value = false
  }
}

const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Total'
      return
    }
    
    // Handle different column types
    if (column.label === 'Boxes') {
      const totalBoxes = data.reduce((sum, item) => sum + (item.boxes || item.quantity || 0), 0)
      sums[index] = totalBoxes
    } else if (column.label === 'Prizes') {
      const totalPrizeBoxes = data.reduce((sum, item) => sum + (item.prize_boxes || 0), 0)
      sums[index] = totalPrizeBoxes
    } else if (column.label === 'Total Units') {
      const totalUnits = data.reduce((sum, item) => {
        return sum + (((item.boxes || 0) + (item.prize_boxes || 0)) * (item.units_per_box || 1))
      }, 0)
      sums[index] = totalUnits
    } else if (column.label === 'Total Amount Buy') {
      const sum = data.reduce((sum, item) => sum + calculateTotalAmountBuy(item), 0)
      sums[index] = formatPrice(sum)
    } else if (column.label === 'Tax') {
      const sum = data.reduce((sum, item) => sum + Number(item.tax || 0), 0)
      sums[index] = formatPrice(sum)
    } else if (column.label === 'Discount') {
      const sum = data.reduce((sum, item) => sum + Number(item.discount || 0), 0)
      sums[index] = formatPrice(sum)
    } else if (column.label === 'Net Amount Paid') {
      const sum = data.reduce((sum, item) => sum + calculateNetAmountPaid(item), 0)
      sums[index] = formatPrice(sum)
    } else if (column.label === 'Profit') {
      const sum = data.reduce((sum, item) => sum + calculateProfit(item), 0)
      sums[index] = formatPrice(sum)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '' || isNaN(price)) {
    return '0'
  }
  return Math.round(parseFloat(price)).toLocaleString('en-US')
}

// Helper functions for formatting
const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString()
}

// Helper function to check if field has value for floating label
const hasValue = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return !isNaN(value) // Zero is a valid value that should show floating label
  return Boolean(value)
}

// Format currency with thousands separator only (no ریال suffix)
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return ''
  return Number(value).toLocaleString()
}

// Table row calculation functions
const calculateTotalAmountBuy = (row) => {
  const boxes = Number(row.boxes) || 0
  const buyPricePerBox = Number(row.buy_price_per_box) || 0
  return boxes * buyPricePerBox
}

const calculateNetAmountPaid = (row) => {
  const totalAmountBuy = calculateTotalAmountBuy(row)
  const tax = Number(row.tax) || 0
  const discount = Number(row.discount) || 0
  return totalAmountBuy + tax - discount
}

const calculateProfit = (row) => {
  const boxes = Number(row.boxes) || 0
  const prizeBoxes = Number(row.prize_boxes) || 0
  const sellPricePerBox = Number(row.sell_price_per_box) || 0
  const totalAmountBuy = calculateTotalAmountBuy(row)
  
  const totalSellAmount = sellPricePerBox * (boxes + prizeBoxes)
  return totalSellAmount - totalAmountBuy
}

// Currency input handlers
const handleCurrencyInput = (value, field) => {
  // Remove all non-digit characters except commas and periods
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/,/g, '')
  const numericValue = parseFloat(cleanValue) || 0
  
  invoiceForm[field] = numericValue
  
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

// Parse currency value for header form
const parseCurrency = (value) => {
  if (!value) return null
  // Remove all non-digit characters except commas and periods
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/,/g, '')
  const numericValue = parseFloat(cleanValue) || 0
  return numericValue
}

// Calculate invoice computed fields for header
const calculateInvoiceComputedFields = () => {
  if (!invoiceItems.value || invoiceItems.value.length === 0) {
    Object.assign(invoiceComputedFields, {
      totalDiscounts: '',
      totalTax: '',
      totalProfit: '',
      totalNetAmountPaid: ''
    })
    return
  }

  let totalDiscounts = 0
  let totalTax = 0
  let totalProfit = 0
  let totalNetAmountPaid = 0

  // Calculate totals from invoice items using the same functions as table
  invoiceItems.value.forEach(item => {
    const discount = Number(item.discount) || 0
    const tax = Number(item.tax) || 0
    
    // Use the same calculation functions as the table
    const itemNetAmountPaid = calculateNetAmountPaid(item)
    const itemProfit = calculateProfit(item)

    totalDiscounts += discount
    totalTax += tax
    totalProfit += itemProfit
    totalNetAmountPaid += itemNetAmountPaid
  })

  // Add additional header discounts and taxes
  const additionalDiscount = Number(headerForm.additionalDiscount) || 0
  const additionalTax = Number(headerForm.additionalTax) || 0

  totalDiscounts += additionalDiscount
  totalTax += additionalTax
  
  // Total Net Amount Paid = sum of each row's Net Amount Paid + additional tax - additional discount
  totalNetAmountPaid = totalNetAmountPaid + additionalTax - additionalDiscount
  
  // Total Profit = sum of each row's Profit - additional tax + additional discount
  totalProfit = totalProfit - additionalTax + additionalDiscount

  // Update computed fields with formatted values
  invoiceComputedFields.totalDiscounts = totalDiscounts > 0 ? totalDiscounts.toLocaleString('en-US') : ''
  invoiceComputedFields.totalTax = totalTax > 0 ? totalTax.toLocaleString('en-US') : ''
  invoiceComputedFields.totalProfit = totalProfit !== 0 ? totalProfit.toLocaleString('en-US') : ''
  invoiceComputedFields.totalNetAmountPaid = totalNetAmountPaid > 0 ? totalNetAmountPaid.toLocaleString('en-US') : ''
}

// Calculate total quantity
const calculateTotalQuantity = () => {
  const boxes = invoiceForm.boxes || 0
  const prizeBoxes = invoiceForm.prizeBoxes || 0
  const unitsPerBox = invoiceForm.unitsPerBox || 0
  
  if (boxes > 0 || prizeBoxes > 0) {
    const totalBoxes = boxes + prizeBoxes
    invoiceForm.totalQuantity = totalBoxes * unitsPerBox
  } else {
    invoiceForm.totalQuantity = null
  }
  
  // If unitsPerBox changed and we have TTAC data, recalculate prices
  if (ttacDrugInfo.value && invoiceForm.selectedDrug) {
    autopopulatePricesFromTtac(ttacDrugInfo.value)
  }
  
  // Also calculate computed fields
  calculateComputedFields()
}

// Calculate computed fields
const calculateComputedFields = () => {
  const boxes = invoiceForm.boxes || 0
  const prizeBoxes = invoiceForm.prizeBoxes || 0
  const unitsPerBox = invoiceForm.unitsPerBox || 0
  const buyPricePerBox = invoiceForm.buyPrice || 0
  const sellPricePerBox = invoiceForm.sellPrice || 0
  const discount = Number(invoiceForm.discount) || 0
  const tax = Number(invoiceForm.tax) || 0

  // 1. Buy price per unit = (buy price per box) / (units per box)
  if (unitsPerBox > 0 && buyPricePerBox > 0) {
    const buyPricePerUnit = buyPricePerBox / unitsPerBox
    computedFields.buyPricePerUnit = Math.round(buyPricePerUnit).toLocaleString('en-US')
  } else {
    computedFields.buyPricePerUnit = ''
  }

  // 2. Sell price per unit = (sell price per box) / (units per box)
  if (unitsPerBox > 0 && sellPricePerBox > 0) {
    const sellPricePerUnit = sellPricePerBox / unitsPerBox
    computedFields.sellPricePerUnit = Math.round(sellPricePerUnit).toLocaleString('en-US')
  } else {
    computedFields.sellPricePerUnit = ''
  }

  // 3. Total amount buy = (buy price per box) * (boxes)
  if (boxes > 0 && buyPricePerBox > 0) {
    const totalAmountBuy = buyPricePerBox * boxes
    computedFields.totalAmountBuy = Math.round(totalAmountBuy).toLocaleString('en-US')
  } else {
    computedFields.totalAmountBuy = ''
  }

  // 4. Net amount paid = (total amount buy) + (tax) - (discount)
  if (boxes > 0 && buyPricePerBox > 0) {
    const totalAmountBuy = buyPricePerBox * boxes
    const netAmountPaid = totalAmountBuy + tax - discount
    computedFields.netAmountPaid = Math.round(netAmountPaid).toLocaleString('en-US')
  } else {
    computedFields.netAmountPaid = ''
  }

  // 5. Profit = ((sell price per box) * (boxes + prize boxes)) - (Net amount paid)
  if ((boxes > 0 || prizeBoxes > 0) && sellPricePerBox > 0 && buyPricePerBox > 0) {
    const totalSellAmount = sellPricePerBox * (boxes + prizeBoxes)
    const totalAmountBuy = buyPricePerBox * boxes
    const netAmountPaid = totalAmountBuy + tax - discount
    const profit = totalSellAmount - netAmountPaid
    computedFields.profit = Math.round(profit).toLocaleString('en-US')
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

// Auto-populate buy and sell prices from TTAC data
const autopopulatePricesFromTtac = (ttacDrug, forceUpdate = false) => {
  if (!ttacDrug || !invoiceForm.unitsPerBox) {
    return
  }
  
  // Only auto-update if prices haven't been manually set or if forced
  if (!forceUpdate && !pricesAutoPopulated.value && (invoiceForm.buyPrice || invoiceForm.sellPrice)) {
    return
  }
  
  const unitsPerBox = invoiceForm.unitsPerBox
  let pricesUpdated = false
  
  // Auto-populate buy price (buying_price * units_per_box)
  if (ttacDrug.buying_price && ttacDrug.buying_price > 0) {
    const buyPricePerBox = ttacDrug.buying_price * unitsPerBox
    invoiceForm.buyPrice = buyPricePerBox
    pricesUpdated = true
  }
  
  // Auto-populate sell price (selling_price * units_per_box)
  if (ttacDrug.selling_price && ttacDrug.selling_price > 0) {
    const sellPricePerBox = ttacDrug.selling_price * unitsPerBox
    invoiceForm.sellPrice = sellPricePerBox
    pricesUpdated = true
  }
  
  if (pricesUpdated) {
    pricesAutoPopulated.value = true
    
    // Recalculate computed fields after price update
    calculateComputedFields()
  }
}

// Expiry date input handlers
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
        
        // Update the actual date in invoiceForm
        invoiceForm.expiryDate = isoDateString
        
        // Convert to Jalali and display
        jalaliExpiryDate.value = formatDateJalali(parsedDate)
      } else {
        ElMessage.warning('Invalid date. Please check the day is valid for the given month and year.')
        formattedExpiryDate.value = ''
        invoiceForm.expiryDate = ''
        jalaliExpiryDate.value = ''
      }
    } else {
      ElMessage.warning('Invalid date. Year must be 1900-2100, month 1-12, day 1-31.')
      formattedExpiryDate.value = ''
      invoiceForm.expiryDate = ''
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
      invoiceForm.expiryDate = ''
      jalaliExpiryDate.value = ''
    }
  }
  
  focusedField.value = null
}

// Header date handling functions - using same sophisticated logic as expiry date
const handleInvoiceBuyDateInput = (value) => {
  // Remove any non-digit characters except forward slashes
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  // Handle backspace - if user deletes a slash, also remove the preceding character
  if (formattedInvoiceBuyDate.value && value.length < formattedInvoiceBuyDate.value.length) {
    // User is deleting, don't auto-format
    formattedInvoiceBuyDate.value = cleanValue
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
  formattedInvoiceBuyDate.value = cleanValue
}

const validateAndFormatInvoiceBuyDate = () => {
  const dateStr = formattedInvoiceBuyDate.value?.trim()
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
        formattedInvoiceBuyDate.value = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
        
        // Update the actual date in headerForm
        headerForm.invoiceBuyDate = isoDateString
        
        // Convert to Jalali and display
        jalaliInvoiceBuyDate.value = formatDateJalali(parsedDate)
      } else {
        ElMessage.warning('Invalid date. Please check the day is valid for the given month and year.')
        formattedInvoiceBuyDate.value = ''
        headerForm.invoiceBuyDate = ''
        jalaliInvoiceBuyDate.value = ''
      }
    } else {
      ElMessage.warning('Invalid date. Year must be 1900-2100, month 1-12, day 1-31.')
      formattedInvoiceBuyDate.value = ''
      headerForm.invoiceBuyDate = ''
      jalaliInvoiceBuyDate.value = ''
    }
  } else {
    // If the format doesn't match, check if it's incomplete
    if (dateStr.length < 10) {
      // Don't show error for incomplete dates, just wait for user to finish typing
      focusedField.value = null
      return
    } else {
      ElMessage.warning('Invalid date format. Please use YYYY/MM/DD format.')
      formattedInvoiceBuyDate.value = ''
      headerForm.invoiceBuyDate = ''
      jalaliInvoiceBuyDate.value = ''
    }
  }
  
  focusedField.value = null
}

const handleInvoicePaymentDateInput = (value) => {
  // Remove any non-digit characters except forward slashes
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  // Handle backspace - if user deletes a slash, also remove the preceding character
  if (formattedInvoicePaymentDate.value && value.length < formattedInvoicePaymentDate.value.length) {
    // User is deleting, don't auto-format
    formattedInvoicePaymentDate.value = cleanValue
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
  formattedInvoicePaymentDate.value = cleanValue
}

const validateAndFormatInvoicePaymentDate = () => {
  const dateStr = formattedInvoicePaymentDate.value?.trim()
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
        formattedInvoicePaymentDate.value = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`
        
        // Update the actual date in headerForm
        headerForm.invoicePaymentDate = isoDateString
        
        // Convert to Jalali and display
        jalaliInvoicePaymentDate.value = formatDateJalali(parsedDate)
      } else {
        ElMessage.warning('Invalid date. Please check the day is valid for the given month and year.')
        formattedInvoicePaymentDate.value = ''
        headerForm.invoicePaymentDate = ''
        jalaliInvoicePaymentDate.value = ''
      }
    } else {
      ElMessage.warning('Invalid date. Year must be 1900-2100, month 1-12, day 1-31.')
      formattedInvoicePaymentDate.value = ''
      headerForm.invoicePaymentDate = ''
      jalaliInvoicePaymentDate.value = ''
    }
  } else {
    // If the format doesn't match, check if it's incomplete
    if (dateStr.length < 10) {
      // Don't show error for incomplete dates, just wait for user to finish typing
      focusedField.value = null
      return
    } else {
      ElMessage.warning('Invalid date format. Please use YYYY/MM/DD format.')
      formattedInvoicePaymentDate.value = ''
      headerForm.invoicePaymentDate = ''
      jalaliInvoicePaymentDate.value = ''
    }
  }
  
  focusedField.value = null
}

// Header currency handling functions
const handleHeaderCurrencyInput = (value, field) => {
  const numericValue = parseCurrency(value)
  headerForm[field] = numericValue
  // Recalculate computed fields when additional discount or tax changes
  calculateInvoiceComputedFields()
}

const handleHeaderCurrencyFocus = (field) => {
  focusedField.value = field
}

const handleHeaderCurrencyBlur = (field) => {
  focusedField.value = null
  // Recalculate computed fields when user finishes editing
  calculateInvoiceComputedFields()
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
    if (drugStore.drugs.length === 0) {
      await drugStore.fetchDrugs()
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
    
    for (let i = 0; i < drugStore.drugs.length; i++) {
      const drug = drugStore.drugs[i]
      
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
    if (drug._isTtacDrug) {
      // Handle TTAC drug selection (new drug)
      invoiceForm.selectedDrug = {
        gtin_code: drug.gtin_code,
        name_persian: drug.name_persian,
        name_english: drug.name_english,
        company_name_english: drug.company_name_english,
        company_name_persian: drug.company_name_persian,
        units_per_box: drug.units_per_box,
        selling_price: drug.selling_price,
        _isTtacDrug: true
      }
      invoiceForm.unitsPerBox = drug.units_per_box || null
      ttacDrugInfo.value = drug
      
      // Auto-populate prices from TTAC data (per box calculation)
      autopopulatePricesFromTtac(drug, true)
      
      ElMessage.info(`New drug selected from TTAC: ${drug.name_persian || drug.name_english}`)
    } else {
      // Handle pharmacy drug selection (existing drug)
      invoiceForm.selectedDrug = drug
      invoiceForm.unitsPerBox = drug.num_per_box || null
      
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
    await drugStore.fetchBatches(drugId)
    
    // Filter batches for this specific drug
    const allBatches = drugStore.batches
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
  } catch (error) {
    console.error('Error fetching TTAC drug info:', error)
    ttacDrugInfo.value = null
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
      invoiceForm.batchNumber = batchNumber
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

// Initialize
onMounted(async () => {
  // Load available storages
  try {
    await storageStore.fetchStorages()
    availableStorages.value = storageStore.storages
  } catch (error) {
    console.error('Error loading storages:', error)
  }

  // Load distribution companies
  try {
    await distributionCompanyStore.ensureDataAvailable()
    console.log('Distribution companies loaded:', distributionCompanyStore.companies)
  } catch (error) {
    console.error('Error loading distribution companies:', error)
  }
  
  // Ensure pharmacy drugs are loaded
  if (drugStore.drugs.length === 0) {
    await drugStore.fetchDrugs()
  }
  
  // Only load the last invoice number if no initial invoice number was provided
  if (props.initialInvoiceNumber) {
    // Load the specific invoice number passed as prop
    await loadInvoiceByNumber(props.initialInvoiceNumber)
  } else {
    // Load the last (highest) invoice number available
    await loadLastInvoiceNumber()
  }
  
  // Invoice items are now loaded within loadInvoiceByNumber for faster switching
  
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
  
  // Clear invoices cache
  invalidateInvoicesCache()
})
</script>

<style scoped>
.invoices-view {
  padding: 5px;
  padding-bottom: 60px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
}

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

.invoice-form-card {
  margin-bottom: 20px;
}

.invoice-table-card {
  margin-bottom: 40px;
}

.no-data-message,
.loading-message {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.header-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 10px;
  gap: 20px;
}

.invoice-number-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.invoice-number-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.invoice-number-controls {
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

.new-invoice-button {
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

.new-invoice-button:hover {
  background-color: #85ce61;
  border-color: #85ce61;
  color: #ffffff;
}

.new-invoice-button:focus {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #ffffff;
}

.invoice-number-input {
  width: 80px;
}

.invoice-number-input :deep(.el-input__inner) {
  text-align: center;
  font-weight: 600;
  color: var(--primary-color);
  padding: 0 8px;
}

.invoice-number-input :deep(.el-input__inner):focus {
  border-color: var(--primary-color);
}

.invalid-invoice :deep(.el-input__inner) {
  border-color: #f56c6c !important;
  background-color: #fef0f0 !important;
  color: #f56c6c !important;
}

.invalid-invoice :deep(.el-input__inner):focus {
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2) !important;
}

.checking-invoice :deep(.el-input__inner) {
  border-color: #e6a23c !important;
  background-color: #fdf6ec !important;
  color: #e6a23c !important;
}

/* Hide number input spinners in webkit browsers */
.invoice-number-input :deep(.el-input__inner)::-webkit-outer-spin-button,
.invoice-number-input :deep(.el-input__inner)::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Hide number input spinners in Firefox */
.invoice-number-input :deep(.el-input__inner[type=number]) {
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

/* Delete Invoice Button */
.delete-invoice-button {
  margin-left: 2px;
  font-weight: 600;
  height: 28px;
}

.delete-invoice-button:hover:not(.is-disabled) {
  background-color: #dc3545 !important;
  border-color: #dc3545 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.delete-invoice-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.invoice-form-card {
  margin-bottom: 20px;
}

.invoice-table-card {
  margin-top: 20px;
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

.placeholder-content {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.invoice-form {
  padding: 10px 0;
}

.total-display {
  text-align: right;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 10px;
}

.total-label {
  font-weight: 600;
  color: #333;
}

.total-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}

.operations-container {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.medicine-name {
  font-weight: 500;
  color: #333;
}

.loading-indicator {
  color: #999;
  font-size: 12px;
  margin-left: 10px;
}

.no-data-message {
  text-align: center;
  padding: 40px;
  color: #999;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.loading-message {
  text-align: center;
  padding: 40px;
  color: #999;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.add-button {
  background-color: #67c23a;
  border-color: #67c23a;
}

.add-button:hover {
  background-color: #5daf34;
  border-color: #5daf34;
}

.cancel-button {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.cancel-button:hover {
  background-color: #f45454;
  border-color: #f45454;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

/* Unified Search Field Styles */
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

/* Floating label effect for form fields */
.invoice-form .el-form-item {
  position: relative;
  margin-bottom: 20px;
}

.invoice-form .el-form-item .el-input,
.invoice-form .el-form-item .el-select,
.invoice-form .el-form-item .el-date-editor,
.invoice-form .el-form-item .el-input-number {
  position: relative;
}

.invoice-form .el-form-item .el-input__inner,
.invoice-form .el-form-item .el-select .el-input__inner,
.invoice-form .el-form-item .el-date-editor .el-input__inner,
.invoice-form .el-form-item .el-input-number .el-input__inner {
  padding-top: 10px !important;
  height: 40px !important;
}

/* Floating label */
.invoice-form .el-form-item::before {
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
.invoice-form .el-form-item.has-value::before,
.invoice-form .el-form-item.is-focused::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

/* Exclude search fields from floating label effect */
.invoice-form .unified-search-field::before {
  display: none;
}

.invoice-form .unified-search-field .el-input__inner {
  padding-top: 12px !important;
  height: 32px !important;
}

/* Computed field styling */
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
  gap: 2px;
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
.invoice-form .el-form-item {
  position: relative;
  margin-bottom: 20px;
}

.invoice-form .el-form-item .el-input,
.invoice-form .el-form-item .el-select,
.invoice-form .el-form-item .el-date-editor,
.invoice-form .el-form-item .el-input-number {
  position: relative;
}

.invoice-form .el-form-item .el-input__inner,
.invoice-form .el-form-item .el-select .el-input__inner,
.invoice-form .el-form-item .el-date-editor .el-input__inner,
.invoice-form .el-form-item .el-input-number .el-input__inner {
  padding-top: 10px !important;
  height: 40px !important;
}

/* Floating label */
.invoice-form .el-form-item::before {
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
.invoice-form .el-form-item.has-value::before,
.invoice-form .el-form-item.is-focused::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

/* Special handling for number inputs with value 0 */
.invoice-form .el-form-item.has-value[data-label*="Discount"]::before,
.invoice-form .el-form-item.has-value[data-label*="Tax"]::before,
.invoice-form .el-form-item.has-value[data-label*="Prize"]::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

/* For select components */
.invoice-form .el-form-item .el-select .el-input.is-focus .el-input__inner,
.invoice-form .el-form-item .el-input.is-focus .el-input__inner,
.invoice-form .el-form-item .el-date-editor.is-focus .el-input__inner,
.invoice-form .el-form-item .el-input-number.is-focus .el-input__inner {
  border-color: #409eff;
}

/* Hide original placeholder when we have floating label */
.invoice-form .el-form-item .el-input__inner::placeholder,
.invoice-form .el-form-item .el-select .el-input__inner::placeholder,
.invoice-form .el-form-item .el-date-editor .el-input__inner::placeholder {
  opacity: 0;
}

/* Required field indicator */
.invoice-form .el-form-item[data-required="true"]::after {
  content: "*";
  color: #f56c6c;
  position: absolute;
  right: 8px;
  top: -8px;
  font-size: 12px;
  z-index: 11;
}

/* Exclude search fields from floating label effect */
.invoice-form .unified-search-field::before {
  display: none;
}

.invoice-form .unified-search-field .el-input__inner {
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

/* Invoice header card styles */
.invoice-header-card {
  margin-bottom: 20px;
}

.invoice-header-form {
  width: 100%;
}

.invoice-header-form .el-row {
  margin-bottom: 10px;
}

.invoice-header-form .el-form-item {
  position: relative;
  margin-bottom: 20px;
}

/* Apply same floating label styles as invoice form */
.invoice-header-form .el-form-item::before {
  content: attr(data-label);
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a8abb2;
  pointer-events: none;
  transition: all 0.3s ease;
  font-size: 14px;
  z-index: 10;
  background: white;
  padding: 0 4px;
}

.invoice-header-form .el-form-item.has-value::before,
.invoice-header-form .el-form-item.is-focused::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

.invoice-header-form .computed-fields-section .el-form-item::before {
  color: #67c23a;
}

.invoice-header-form .computed-fields-section .el-form-item.has-value::before {
  color: #67c23a;
}

.invoice-header-form .computed-field {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.invoice-header-form .computed-field .el-input__inner {
  background-color: #f5f7fa;
  color: #67c23a;
  font-weight: 600;
}

.invoice-header-form .currency-input-container {
  position: relative;
}

.invoice-header-form .currency-display {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
}

/* Duplicate item warning styles */
.invoice-form .el-form-item.has-error .el-input.is-duplicate .el-input__inner {
  border-color: #e6a23c !important;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
}

.invoice-form .el-form-item.has-error::before {
  color: #ea580c !important;
}

/* Responsive design for mobile */
@media (max-width: 768px) {
  .invoices-view {
    padding: 10px;
  }
}
</style> 