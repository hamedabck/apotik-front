<template>
  <div class="sells-view">
    <div class="page-header">
      <h1 style="font-size: 24px; font-weight: 600;">Sells</h1>
      <div class="header-info-row">
        <div class="sell-number-container">
          <label class="sell-number-label">Number:</label>
          <div class="sell-number-controls">
            <el-button 
              size="small" 
              @click="previousSellNumber"
              :disabled="sellNumber <= 1 || isCheckingSellExists"
              class="nav-button"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-input
              v-model="sellNumber"
              type="number"
              :min="1"
              :class="['sell-number-input', { 'invalid-sell': isSellNumberInvalid, 'checking-sell': isCheckingSellExists }]"
              @input="onSellNumberInput"
              @blur="validateSellNumber"
              @focus="isSellNumberInvalid = false"
              :disabled="isCheckingSellExists"
              placeholder="1"
              :validate-event="false"
            />
            <el-button 
              size="small" 
              @click="nextSellNumber"
              :disabled="isCheckingSellExists"
              class="nav-button"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              type="success"
              @click="createNewSell"
              class="new-sell-button"
              :title="'Create a new sell session'"
            >
              <el-icon><Plus /></el-icon>
              New Sell
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
              :type="getStatusButtonType(sellStatus)"
              class="status-display-button"
              @click="showStatusInfo"
              :title="`Current sell status: ${sellHelpers.getStatusDisplay(sellStatus)}`"
            >
              <el-icon><InfoFilled /></el-icon>
              {{ sellHelpers.getStatusDisplay(sellStatus) }}
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
            
            <!-- Delete Sell Button -->
            <el-button 
              size="small" 
              type="danger"
              @click="deleteEntireSell"
              :disabled="processing || !currentSellId"
              class="delete-sell-button"
              :title="`Delete entire sell #${sellNumber} and all its items`"
            >
              <el-icon><Delete /></el-icon>
              Delete Sell
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Non-Editable Status Alert -->
    <el-alert
      v-if="!isSellEditable"
      :title="`This sell is ${sellHelpers.getStatusDisplay(sellStatus)} and cannot be modified`"
      type="warning"
      :description="`Sell #${sellNumber} has been ${sellStatus}. No further changes can be made to this sell.`"
      show-icon
      :closable="false"
      class="status-alert"
    />

    <!-- Sell Header Form -->
    <el-card class="sell-header-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Sell Information</span>
        </div>
      </template>

      <el-form :model="headerForm" class="sell-header-form">
        <!-- First Row: Sell Type + Customer Fields -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="sellType"
              data-label="Type of Sell"
              :class="{ 'has-value': hasValue(headerForm.sellType), 'is-focused': focusedField === 'sellType' }"
            >
              <el-select
                v-model="headerForm.sellType"
                placeholder=""
                style="width: 100%"
                @focus="focusedField = 'sellType'"
                @blur="focusedField = null"
                @change="onSellTypeChange"
                :disabled="!isSellEditable"
              >
                <el-option
                  v-for="option in sellTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="customerId"
              data-label="Customer ID"
              :class="{ 'has-value': hasValue(headerForm.customerId), 'is-focused': focusedField === 'customerId' }"
            >
              <el-input
                v-model="headerForm.customerId"
                placeholder=""
                @focus="focusedField = 'customerId'"
                @blur="focusedField = null"
                @input="onCustomerIdInput"
                style="width: 100%"
                :disabled="!isSellEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="customerName"
              data-label="Customer Name"
              :class="{ 'has-value': hasValue(headerForm.customerName), 'is-focused': focusedField === 'customerName' }"
            >
              <el-input
                v-model="headerForm.customerName"
                placeholder=""
                @focus="focusedField = 'customerName'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isSellEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="customerPhone"
              data-label="Customer Phone"
              :class="{ 'has-value': hasValue(headerForm.customerPhone), 'is-focused': focusedField === 'customerPhone' }"
            >
              <el-input
                v-model="headerForm.customerPhone"
                placeholder=""
                @focus="focusedField = 'customerPhone'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isSellEditable"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Doctor Fields Row (Conditional) -->
        <el-row v-if="showDoctorFields" :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="doctorId"
              data-label="Doctor ID"
              :class="{ 'has-value': hasValue(headerForm.doctorId), 'is-focused': focusedField === 'doctorId' }"
            >
              <el-input
                v-model="headerForm.doctorId"
                placeholder=""
                @focus="focusedField = 'doctorId'"
                @blur="focusedField = null"
                @input="onDoctorIdInput"
                style="width: 100%"
                :disabled="!isSellEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="doctorName"
              data-label="Doctor Name"
              :class="{ 'has-value': hasValue(headerForm.doctorName), 'is-focused': focusedField === 'doctorName' }"
            >
              <el-input
                v-model="headerForm.doctorName"
                placeholder=""
                @focus="focusedField = 'doctorName'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isSellEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="doctorSpeciality"
              data-label="Doctor Speciality"
              :class="{ 'has-value': hasValue(headerForm.doctorSpeciality), 'is-focused': focusedField === 'doctorSpeciality' }"
            >
              <el-input
                v-model="headerForm.doctorSpeciality"
                placeholder=""
                @focus="focusedField = 'doctorSpeciality'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isSellEditable"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="prescriptionDate"
              data-label="Prescription Date"
              :class="{ 'has-value': hasValue(formattedPrescriptionDate), 'is-focused': focusedField === 'prescriptionDate' }"
            >
                <el-input
                v-model="formattedPrescriptionDate"
                  placeholder=""
                @input="handlePrescriptionDateInput"
                @blur="validateAndFormatPrescriptionDate"
                @keyup.enter="validateAndFormatPrescriptionDate"
                @focus="focusedField = 'prescriptionDate'"
                maxlength="10"
                  style="width: 100%"
                class="expiry-date-input"
                  :disabled="!isSellEditable"
                />
              <div v-if="jalaliPrescriptionDate" class="jalali-date-display">
                {{ jalaliPrescriptionDate }}
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Insurance Fields Row (Conditional) -->
        <el-row v-if="showInsuranceFields" :gutter="20">
          <el-col :span="6">
            <el-form-item 
              prop="insuranceId"
              data-label="Insurance ID"
              :class="{ 'has-value': hasValue(headerForm.insuranceId), 'is-focused': focusedField === 'insuranceId' }"
            >
                <el-input
                v-model="headerForm.insuranceId"
                  placeholder=""
                @focus="focusedField = 'insuranceId'"
                  @blur="focusedField = null"
                  style="width: 100%"
                :disabled="!isSellEditable"
                />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="insuranceValidityDate"
              data-label="Insurance Validity Date"
              :class="{ 'has-value': hasValue(formattedInsuranceValidityDate), 'is-focused': focusedField === 'insuranceValidityDate' }"
            >
                <el-input
                v-model="formattedInsuranceValidityDate"
                  placeholder=""
                @input="handleInsuranceValidityDateInput"
                @blur="validateAndFormatInsuranceValidityDate"
                @keyup.enter="validateAndFormatInsuranceValidityDate"
                @focus="focusedField = 'insuranceValidityDate'"
                maxlength="10"
                  style="width: 100%"
                class="expiry-date-input"
                :disabled="!isSellEditable"
                />
              <div v-if="jalaliInsuranceValidityDate" class="jalali-date-display">
                {{ jalaliInsuranceValidityDate }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="birthDate"
              data-label="Birth Date"
              :class="{ 'has-value': hasValue(formattedBirthDate), 'is-focused': focusedField === 'birthDate' }"
            >
                <el-input
                v-model="formattedBirthDate"
                  placeholder=""
                @input="handleBirthDateInput"
                @blur="validateAndFormatBirthDate"
                @keyup.enter="validateAndFormatBirthDate"
                @focus="focusedField = 'birthDate'"
                maxlength="10"
                  style="width: 100%"
                class="expiry-date-input"
                :disabled="!isSellEditable"
                />
              <div v-if="jalaliBirthDate" class="jalali-date-display">
                {{ jalaliBirthDate }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              prop="insurancePage"
              data-label="Insurance Page"
              :class="{ 'has-value': hasValue(headerForm.insurancePage), 'is-focused': focusedField === 'insurancePage' }"
            >
                <el-input
                v-model="headerForm.insurancePage"
                  placeholder=""
                @focus="focusedField = 'insurancePage'"
                  @blur="focusedField = null"
                  style="width: 100%"
                :disabled="!isSellEditable"
                />
            </el-form-item>
          </el-col>
        </el-row>


      </el-form>
    </el-card>

    <!-- Sell Form -->
    <el-card class="sell-form-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ isEditing ? 'Edit Sell Item' : 'Add New Sell Item' }}</span>
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
              :content="isDuplicateItem ? 'Cannot add duplicate drug with same batch number (already exists in pharmacy or sell)' : ''"
              :disabled="!isDuplicateItem"
              placement="top"
            >
            <el-button 
              type="primary" 
              size="small"
                @click="addOrUpdateSellItem"
                :disabled="!isFormValid || !isSellEditable || isDuplicateItem"
              class="add-button"
            >
                <el-icon><Plus v-if="!isEditing" /><Check v-else /></el-icon> 
                {{ isEditing ? 'Update Item' : 'Add to Table' }}
            </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <el-form :model="sellForm" class="sell-form">
                <!-- Unified Search/Barcode Field OR Cascading Dropdowns -->
        <el-row :gutter="20">
          <!-- Step 1: Drug Search (default state) -->
          <template v-if="!showBatchDropdown && !showLocationDropdown">
          <el-col :span="18">
            <el-form-item label="🔍 Search / ▌▌▌" class="unified-search-field">
              <div class="unified-search-container">
                <el-select
                  ref="unifiedSearchRef"
                  v-model="selectedPharmacyDrug"
                  filterable
                  remote
                  reserve-keyword
                    placeholder="Search pharmacy drugs by name, GTIN, or keywords"
                  :remote-method="handleUnifiedSearch"
                  :loading="isSearchingPharmacy"
                  style="width: 100%"
                  @change="onPharmacyDrugSelect"
                  clearable
                  class="unified-search-select"
                  @paste="handleUnifiedPaste"
                  :disabled="!isSellEditable || isEditing"
                >
                  <el-option
                    v-for="drug in combinedSearchResults"
                    :key="drug.id"
                    :label="`${drug.generic_code || 'N/A'} - ${showPersianNamesInSearch ? (drug.persian_name || drug.english_name) : (drug.english_name || drug.persian_name)} - ${getCompanyName(drug)} - Max Price: ${formatPrice(drug.maximum_price)} - Stock: ${drug.total_quantity || 0}`"
                    :value="drug.id"
                    class="drug-option"
                  >
                    <div class="drug-option-two-line">
                      <!-- First Line: Generic Code and Drug Name -->
                      <div class="drug-option-line">
                        <span class="drug-generic">{{ drug.generic_code || 'N/A' }}</span>
                        <div class="drug-info">
                          <span class="drug-separator">|</span>
                          <span class="drug-name">
                            {{ showPersianNamesInSearch 
                              ? (drug.persian_name || drug.english_name || 'N/A')
                              : (drug.english_name || drug.persian_name || 'N/A') 
                            }}
                          </span>
                        </div>
                      </div>
                      <!-- Second Line: Company, Price, and Stock -->
                      <div class="drug-option-line drug-option-second-line">
                        <span class="drug-generic-spacer"></span>
                        <div class="drug-info">
                          <span class="drug-separator">|</span>
                          <span class="drug-company">{{ getCompanyName(drug) || 'N/A' }}</span>
                          <span class="drug-separator">|</span>
                          <span class="drug-price">Max Price: {{ formatPrice(drug.maximum_price) }}</span>
                          <span class="drug-separator">|</span>
                          <span class="drug-stock">Stock: {{ drug.total_quantity || 0 }}</span>
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
                <el-icon v-if="barcodeParseSuccess" class="barcode-success-icon">
                  <CircleCheck />
                </el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item 
              data-label="Quantity"
              data-required="true"
              :class="{ 'has-value': hasValue(sellForm.quantity), 'is-focused': focusedField === 'quantity' }"
            >
              <el-input-number
                v-model="sellForm.quantity"
                :min="1"
                :controls="false"
                placeholder=""
                @focus="focusedField = 'quantity'"
                @blur="focusedField = null"
                style="width: 100%"
                :disabled="!isSellEditable"
              />
            </el-form-item>
          </el-col>
          </template>

          <!-- Step 2: Batch Selection (replaces search field) -->
          <template v-else-if="showBatchDropdown && !showLocationDropdown">
            <el-col :span="18">
              <el-form-item label="📦 Select Batch" class="cascading-dropdown-field">
                <div class="unified-search-container">
                  <el-select
                    v-model="selectedBatch"
                    placeholder="Choose a batch for this drug"
                    style="width: 100%"
                    @change="onBatchSelect"
                    clearable
                    class="batch-select"
                    :disabled="!isSellEditable"
                  >
                    <el-option
                      v-for="batch in availableBatches"
                      :key="batch.id"
                      :label="`${batch.batch_number} - Price: ${formatPrice(batch.price)} - Exp: ${formatDateJalali(batch.expiry_date)} (${getDaysToExpire(batch.expiry_date)} days) - Stock: ${batch.total_quantity}`"
                      :value="batch.id"
                      class="batch-option"
                    >
                      <div class="batch-option-simple">
                        <span class="batch-number">{{ batch.batch_number }}</span>
                        <div class="batch-info">
                          <span class="batch-separator">|</span>
                          <span class="batch-price">Price: {{ formatPrice(batch.price) }}</span>
                          <span class="batch-separator">|</span>
                          <span class="batch-expiry">Exp: {{ formatDateJalali(batch.expiry_date) }} ({{ getDaysToExpire(batch.expiry_date) }}d)</span>
                          <span class="batch-separator">|</span>
                          <span class="batch-stock">Stock: {{ batch.total_quantity }}</span>
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                  <el-button 
                    size="small" 
                    type="warning" 
                    plain
                    @click="resetCascadingDropdowns"
                    class="search-language-toggle"
                    title="Go back to drug search"
                  >
                    ← Back
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item 
                data-label="Quantity"
                data-required="true"
                :class="{ 'has-value': hasValue(sellForm.quantity), 'is-focused': focusedField === 'quantity' }"
              >
                <el-input-number
                  v-model="sellForm.quantity"
                  :min="1"
                  :controls="false"
                  placeholder=""
                  @focus="focusedField = 'quantity'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  :disabled="!isSellEditable"
                />
              </el-form-item>
            </el-col>
          </template>

          <!-- Step 3: Location Selection (replaces search field) -->
          <template v-else-if="showLocationDropdown">
            <el-col :span="18">
              <el-form-item label="📍 Select Location" class="cascading-dropdown-field">
                <div class="unified-search-container">
                  <el-select
                    v-model="selectedLocation"
                    placeholder="Choose a storage location for this batch"
                    style="width: 100%"
                    @change="onLocationSelect"
                    clearable
                    class="location-select"
                    :disabled="!isSellEditable"
                  >
                    <el-option
                      v-for="location in availableLocations"
                      :key="location.id"
                      :label="`${location.storage_name} - Stock: ${location.quantity}`"
                      :value="location.id"
                      class="location-option"
                    >
                      <div class="location-option-simple">
                        <span class="location-name">{{ location.storage_name }}</span>
                        <div class="location-info">
                          <span class="location-separator">|</span>
                          <span class="location-stock">Stock: {{ location.quantity }}</span>
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                  <el-button 
                    size="small" 
                    type="warning" 
                    plain
                    @click="goBackToBatchSelection"
                    class="search-language-toggle"
                    title="Go back to batch selection"
                  >
                    ← Back
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item 
                data-label="Quantity"
                data-required="true"
                :class="{ 'has-value': hasValue(sellForm.quantity), 'is-focused': focusedField === 'quantity' }"
              >
                <el-input-number
                  v-model="sellForm.quantity"
                  :min="1"
                  :controls="false"
                  placeholder=""
                  @focus="focusedField = 'quantity'"
                  @blur="focusedField = null"
                  style="width: 100%"
                  :disabled="!isSellEditable"
                />
              </el-form-item>
            </el-col>
          </template>
        </el-row>

        <!-- Drug Info Display when drug is selected -->
        <div v-if="sellForm.selectedDrug" class="drug-info-display">
          <!-- First Row: 2 Columns -->
          <el-row :gutter="20" class="drug-info-row">
            <el-col :span="1" class="drug-info-col">
              <div class="drug-info-header">
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
                      ? (sellForm.selectedDrug.persian_name || 
                         sellForm.selectedDrug.persianName || 
                         sellForm.selectedDrug.name_persian ||
                         sellForm.selectedDrug.english_name ||
                         sellForm.selectedDrug.englishName ||
                         sellForm.selectedDrug.name_english)
                      : (sellForm.selectedDrug.english_name ||
                         sellForm.selectedDrug.englishName ||
                         sellForm.selectedDrug.name_english ||
                         sellForm.selectedDrug.persian_name || 
                         sellForm.selectedDrug.persianName || 
                         sellForm.selectedDrug.name_persian)
                  }}</span>
                </div>
              </div>
            </el-col>
            <el-col :span="8" class="drug-info-col">
              <div class="company-info">
                <div v-if="sellForm.selectedDrug.english_company_name || sellForm.selectedDrug.englishCompanyName || sellForm.selectedDrug.company_name_english || sellForm.selectedDrug.persian_company_name || sellForm.selectedDrug.persianCompanyName || sellForm.selectedDrug.company_name_persian" class="company-name">
                  <span class="label">Company:</span>
                  <span class="company">{{ 
                    showPersianNamesInDisplay 
                      ? (sellForm.selectedDrug.persian_company_name || 
                         sellForm.selectedDrug.persianCompanyName || 
                         sellForm.selectedDrug.company_name_persian ||
                         sellForm.selectedDrug.english_company_name ||
                         sellForm.selectedDrug.englishCompanyName ||
                         sellForm.selectedDrug.company_name_english)
                      : (sellForm.selectedDrug.english_company_name ||
                         sellForm.selectedDrug.englishCompanyName ||
                         sellForm.selectedDrug.company_name_english ||
                         sellForm.selectedDrug.persian_company_name || 
                         sellForm.selectedDrug.persianCompanyName || 
                         sellForm.selectedDrug.company_name_persian)
                  }}</span>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- Second Row: 3 Columns -->
          <el-row :gutter="20" class="drug-info-row">
            <el-col :span="8" class="drug-info-col">
              <div v-if="isDrugExistingInPharmacy && sellForm.selectedDrug.maximum_price" class="price-info">
                <span class="label">Maximum Price:</span>
                <span class="price-value maximum-price">{{ formatPrice(sellForm.selectedDrug.maximum_price) }}</span>
              </div>
            </el-col>
            <el-col :span="8" class="drug-info-col">
              <div v-if="isDrugExistingInPharmacy" class="price-info">
                <span class="label">Pharmacy Stock:</span>
                <span class="stock-value">{{ formatNumber(sellForm.selectedDrug.total_quantity || 0) }} units</span>
              </div>
            </el-col>
            <el-col :span="8" class="drug-info-col">
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
                      <h4>Stock Batches for {{ sellForm.selectedDrug.english_name || sellForm.selectedDrug.persian_name }}</h4>
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


      </el-form>
    </el-card>

    <!-- Sell Items Table -->
    <el-card class="sell-table-card" shadow="hover" v-if="sellItems.length > 0 || itemsLoading">
      <template #header>
        <div class="card-header">
          <span>
            Sell Items - #{{ sellNumber }}
            <span v-if="itemsLoading" class="loading-indicator">
              <el-icon class="is-loading"><Loading /></el-icon>
              Loading...
            </span>
          </span>
          <div class="table-header-buttons">
            <el-button 
              v-if="sellStatus === 'draft' && sellItems.length > 0"
              type="success"
              size="small"
              @click="finalizeCurrentSell"
              :loading="processing"
              :disabled="itemsLoading"
            >
              <el-icon><Check /></el-icon>
              Finalize Sell
            </el-button>
            <el-tag 
              :type="getStatusTagType(sellStatus)"
              size="large"
              style="margin-left: 10px;"
            >
              {{ sellHelpers.getStatusDisplay(sellStatus) }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-table
        :data="sellItems"
        v-loading="itemsLoading"
        stripe
        style="width: 100%"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column type="index" label="#" width="70" align="center" :index="(index) => index + 1" />
        <el-table-column prop="drug_name" label="Drug Name" min-width="350" />
        <el-table-column prop="quantity" label="Quantity" width="100" align="center" />
        <el-table-column prop="unit_price" label="Unit Price" width="120" align="center" />
        <el-table-column prop="total_price" label="Total Price" width="140" align="center" />
        <el-table-column label="Actions" width="150" align="center" fixed="right">
          <template #default="scope">
            <div class="operations-container">
              <el-button
                size="small"
                type="primary"
                @click="editSellItem(scope.$index)"
                plain
                :disabled="!isSellEditable"
              >
                Edit
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                @click="removeSellItem(scope.$index)"
                :disabled="!isSellEditable"
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
      <p>No items found for Sell #{{ sellNumber }}. Use the form above to add items.</p>
    </div>
    
    <!-- Loading State -->
    <div class="loading-message" v-else-if="itemsLoading && sellItems.length === 0">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <p>Loading sell data...</p>
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
import { 
  ArrowLeft, 
  ArrowRight, 
  Switch, 
  Printer, 
  ArrowDown, 
  Document, 
  Tickets, 
  InfoFilled, 
  Loading, 
  Edit, 
  Delete, 
  Plus,
  Check,
  Close,
  CircleCheck,
  List
} from '@element-plus/icons-vue'
import { usePharmacyDrugStore } from '@/stores/pharmacyDrugStore'
import { useStorageStore } from '@/stores/storageStore'
import { useCustomerStore } from '@/stores/customerStore'
import { useDoctorStore } from '@/stores/doctorStore'
import { useInsuranceStore } from '@/stores/insuranceStore'
import { useAuthStore } from '@/store/auth'
import { useTtacDrugsStore } from '@/store/ttacDrugs'
import AddMedicineDialog from '@/components/medicine/AddMedicineDialog.vue'
import { sellsAPI, sellItemsAPI, sellHelpers } from '@/api/sells'
import { formatDateJalali, jalaliToGregorian, gregorianToJalali, validateJalaliDate } from '@/utils/dateUtils'

// Props from parent tabs component
const props = defineProps({
  tabId: {
    type: String,
    required: true
  },
  initialSellNumber: {
    type: Number,
    default: null
  }
})

// Emits to parent tabs component
const emit = defineEmits(['title-change', 'unsaved-changes', 'navigation-attempt', 'sell-deleted'])

const drugStore = usePharmacyDrugStore()
const storageStore = useStorageStore()
const customerStore = useCustomerStore()
const doctorStore = useDoctorStore()
const insuranceStore = useInsuranceStore()
const authStore = useAuthStore()
const ttacDrugsStore = useTtacDrugsStore()

// Sell number state
const sellNumber = ref(props.initialSellNumber || 1)
const lastValidSellNumber = ref(props.initialSellNumber || 1)
const currentSellId = ref(null)
const sellStatus = ref('draft')
const isSellNumberInvalid = ref(false)
const isCheckingSellExists = ref(false)

// Caching for faster navigation
const sellsCache = ref(new Map()) // Cache sells by status
const sellsCacheTimestamp = ref(new Map()) // Track cache timestamps
const sellItemsCache = ref(new Map()) // Cache sell items by sell ID
const sellItemsCacheTimestamp = ref(new Map()) // Track items cache timestamps
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache duration

// Timestamp tracking
const createdAt = ref(new Date().toISOString())
const updatedAt = ref(new Date().toISOString())
const showCreated = ref(true)

// Processing state
const processing = ref(false)

// Form data
const sellForm = reactive({
  selectedDrug: null,
  quantity: null,
  discount: null,
  tax: null
})

// Header form data
const headerForm = reactive({
  // Sell type
  sellType: '',
  
  // Customer fields
  customerId: '',
  customerName: '',
  customerPhone: '',
  
  // Doctor fields (conditional)
  doctorId: '',
  doctorName: '',
  doctorSpeciality: '',
  
  // Insurance fields (conditional)
  insuranceId: '',
  insuranceValidityDate: '',
  prescriptionDate: '',
  birthDate: '',
  insurancePage: ''
})

// Formatted dates for header
const formattedInsuranceValidityDate = ref('')
const formattedPrescriptionDate = ref('')
const formattedBirthDate = ref('')

// Jalali dates for display
const jalaliInsuranceValidityDate = ref('')
const jalaliPrescriptionDate = ref('')
const jalaliBirthDate = ref('')



// Sell type options
const sellTypeOptions = [
  { value: 'API', label: 'API' },
  { value: '1-OTC', label: '1-OTC' },
  { value: '2-free_prescription', label: '2-Free Prescription' },
  { value: '3-tamin_prescription', label: '3-Tamin Prescription' },
  { value: '4-salamat_prescription', label: '4-Salamat Prescription' },
  { value: '5-mosalah_prescription', label: '5-Mosalah Prescription' },
  { value: '6-banks_prescription', label: '6-Banks Prescription' },
  { value: '7-online_sell', label: '7-Online Sell' },
  { value: '8-cosmetic', label: '8-Cosmetic' },
  { value: '9-equipments', label: '9-Equipments' },
  { value: '10-milks', label: '10-Milks' }
]

// Computed properties for conditional field visibility
const showDoctorFields = computed(() => {
  const prescriptionTypes = [
    '2-free_prescription',
    '3-tamin_prescription', 
    '4-salamat_prescription',
    '5-mosalah_prescription',
    '6-banks_prescription'
  ]
  return prescriptionTypes.includes(headerForm.sellType)
})

const showInsuranceFields = computed(() => {
  const insuranceTypes = [
    '3-tamin_prescription',
    '4-salamat_prescription', 
    '5-mosalah_prescription',
    '6-banks_prescription'
  ]
  return insuranceTypes.includes(headerForm.sellType)
})

// Sell items data
const sellItems = ref([])
const itemsLoading = ref(false)

// Editing state
const isEditing = ref(false)
const editingItemIndex = ref(-1)

// Medicine dialog state
const editDialogVisible = ref(false)
const selectedDrugId = ref(null)
const pendingTtacDrug = ref(null)

// Pharmacy-only search functionality
const selectedPharmacyDrug = ref(null)
const pharmacySearchResults = ref([])
const combinedSearchResults = ref([])
const isSearchingPharmacy = ref(false)
const showPersianNamesInSearch = ref(false)
const showPersianNamesInDisplay = ref(true)
const barcodeParseSuccess = ref(false)
const unifiedSearchRef = ref(null)
const focusedField = ref(null)
let searchTimeout = null
let lastSearchQuery = ''

// Batches state
const drugBatches = ref([])
const batchesLoading = ref(false)

// Cascading dropdown states
const selectedBatch = ref(null)
const selectedLocation = ref(null)
const availableBatches = ref([])
const availableLocations = ref([])
const showBatchDropdown = ref(false)
const showLocationDropdown = ref(false)

// Legacy search functionality (kept for compatibility)
const searchResults = ref([])
const searchLoading = ref(false)
const selectedDrugInfo = ref(null)

const isDuplicateItem = ref(false)

// Computed properties
const isSellEditable = computed(() => {
  return sellStatus.value === 'draft'
})

const isFormValid = computed(() => {
  const validations = {
    selectedDrug: !!sellForm.selectedDrug && sellForm.selectedDrug.id,
    quantity: sellForm.quantity && sellForm.quantity > 0
  }
  
  return Object.values(validations).every(Boolean)
})

// Check for duplicate drug and batch number combination
const isDuplicateItemComputed = computed(() => {
  if (!sellForm.selectedDrug?.id || !sellForm.batchNumber) {
    return false
  }
  
  // Check for duplicates within current sell items
  const duplicateInSell = sellItems.value.some((item, index) => {
    // Skip the current item being edited
    if (isEditing.value && index === editingItemIndex.value) {
      return false
    }
    
    return item.drug === sellForm.selectedDrug.id && 
           item.batch_number === sellForm.batchNumber
  })
  
  // Check for duplicates in pharmacy-wide existing batches
  const duplicateInPharmacy = drugStore.batches && drugStore.batches.some(batch => 
    batch.drug === sellForm.selectedDrug.id && 
    batch.batch_number === sellForm.batchNumber
  )
  
  return duplicateInSell || duplicateInPharmacy
})

// Drug Info Display computed properties
const isDrugExistingInPharmacy = computed(() => {
  return sellForm.selectedDrug && 
         sellForm.selectedDrug.id && 
         sellForm.selectedDrug.total_quantity !== undefined
})

// Watchers for parent component communication
watch(sellNumber, (newNumber) => {
    emit('title-change', {
      tabId: props.tabId,
      title: `Sell #${newNumber}`
    })
}, { immediate: true })

watch(sellStatus, (newStatus) => {
  const hasUnsavedChanges = newStatus === 'draft'
  emit('unsaved-changes', {
    tabId: props.tabId,
    hasUnsavedChanges
  })
}, { deep: true, immediate: true })

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



const getStatusButtonType = (status) => {
  const typeMap = {
    'draft': 'info',
    'finalized': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusTagType = (status) => {
  return sellHelpers.getStatusColor(status)
}

const toggleTimestamp = () => {
  showCreated.value = !showCreated.value
}

const handleDrugEdit = () => {
  selectedDrugId.value = null
  editDialogVisible.value = true
  ElMessage.info('Opening Add Medicine dialog...')
}

const showStatusInfo = () => {
  ElMessage.info(`Current sell status: ${sellHelpers.getStatusDisplay(sellStatus.value)}`)
}

const handlePrintCommand = (command) => {
  ElMessage.info(`Print in ${command} format - functionality will be implemented`)
}

// Navigation methods
const previousSellNumber = async () => {
  if (sellNumber.value > 1) {
    const targetNumber = sellNumber.value - 1
    const navigationAllowed = await checkNavigationPermission(targetNumber)
    if (!navigationAllowed) return
    
    sellNumber.value = targetNumber
    const loadSuccess = await loadSellByNumber(targetNumber)
    if (loadSuccess) {
      lastValidSellNumber.value = targetNumber
    } else {
      // Revert if load failed and show message
      sellNumber.value = lastValidSellNumber.value
      ElMessage.warning(`Sell #${targetNumber} does not exist`)
    }
  }
}

const nextSellNumber = async () => {
  const targetNumber = sellNumber.value + 1
  const navigationAllowed = await checkNavigationPermission(targetNumber)
  if (!navigationAllowed) return
  
  sellNumber.value = targetNumber
  const loadSuccess = await loadSellByNumber(targetNumber)
  if (loadSuccess) {
    lastValidSellNumber.value = targetNumber
  } else {
    // Revert if load failed and show message
    sellNumber.value = lastValidSellNumber.value
    ElMessage.warning(`Sell #${targetNumber} does not exist`)
  }
}

const onSellNumberInput = async (value) => {
  // Don't change anything during input - wait for validation on blur
  // This prevents the number from changing in the container and tab
}

const validateSellNumber = async () => {
  const inputValue = parseInt(sellNumber.value)
  
  // Reset invalid state
  isSellNumberInvalid.value = false
  
  // Validate input range
  if (isNaN(inputValue) || inputValue < 1) {
    // Revert to last valid number for invalid input
    sellNumber.value = lastValidSellNumber.value
    isSellNumberInvalid.value = true
    ElMessage.warning('Sell number must be at least 1')
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isSellNumberInvalid.value = false
    }, 2000)
    return
  }
    
  // If the value is the same as current, no need to validate
  if (inputValue === lastValidSellNumber.value) {
    return
  }
  
  // Check if this sell number is already open in another tab
  const navigationAllowed = await checkNavigationPermission(inputValue)
  if (!navigationAllowed) {
    // Revert to last valid sell number
    sellNumber.value = lastValidSellNumber.value
    isSellNumberInvalid.value = true
    await nextTick() // Ensure DOM is updated
    // Clear invalid state after a delay
    setTimeout(() => {
      isSellNumberInvalid.value = false
    }, 2000)
    return
  }
  
  // Check if sell exists before allowing navigation
  isCheckingSellExists.value = true
  const sellExists = await checkSellExists(inputValue)
  isCheckingSellExists.value = false
  
  if (!sellExists) {
    // Sell doesn't exist - revert to last valid number
    sellNumber.value = lastValidSellNumber.value
    isSellNumberInvalid.value = true
    ElMessage.warning(`Sell #${inputValue} does not exist`)
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isSellNumberInvalid.value = false
    }, 2000)
    return
  }
  
  // Sell exists - try to load it
  const loadSuccess = await loadSellByNumber(inputValue)
  if (loadSuccess) {
    lastValidSellNumber.value = inputValue
    isSellNumberInvalid.value = false
  } else {
    // Load failed for some reason - revert
    sellNumber.value = lastValidSellNumber.value
    isSellNumberInvalid.value = true
    await nextTick()
    // Clear invalid state after a delay
    setTimeout(() => {
      isSellNumberInvalid.value = false
    }, 2000)
  }
}

// Function to invalidate cache when sells are modified
const invalidateSellsCache = () => {
  sellsCache.value.clear()
  sellsCacheTimestamp.value.clear()
  sellItemsCache.value.clear()
  sellItemsCacheTimestamp.value.clear()
}

// Function to invalidate items cache for a specific sell
const invalidateSellItemsCache = (sellId) => {
  const cacheKey = sellId.toString()
  sellItemsCache.value.delete(cacheKey)
  sellItemsCacheTimestamp.value.delete(cacheKey)
}

// Function to get cached sells or fetch them if cache is expired
const getCachedSells = async () => {
  const now = Date.now()
  const cacheKey = 'all_sells'
  
  // Check if we have cached data and it's still valid
  if (sellsCache.value.has(cacheKey) && sellsCacheTimestamp.value.has(cacheKey)) {
    const cacheTime = sellsCacheTimestamp.value.get(cacheKey)
    if (now - cacheTime < CACHE_DURATION) {
      return sellsCache.value.get(cacheKey)
    }
  }
  
  // Fetch fresh data
  try {
    const response = await sellsAPI.getSells()
    const sells = response.data.results || response.data || []
    
    // Update cache
    sellsCache.value.set(cacheKey, sells)
    sellsCacheTimestamp.value.set(cacheKey, now)
    
    return sells
  } catch (error) {
    console.warn('Failed to fetch sells:', error)
    return []
  }
}

// Function to get all sells from cache or fetch if needed
const getAllSellsFromCache = async () => {
  return await getCachedSells()
}

// Function to check if a sell number exists without loading it
const checkSellExists = async (sellNum) => {
  try {
    // Use cached data for faster checking
    const allSells = await getAllSellsFromCache()
    
    // Check if sell with the specified number exists
    return allSells.some(sell => sell.sell_number === sellNum)
  } catch (error) {
    console.error('Error checking sell existence:', error)
    return false
  }
}

const resetForm = () => {
  Object.assign(sellForm, {
    selectedDrug: null,
    quantity: null,
    discount: null,
    tax: null
  })
  
  barcodeParseSuccess.value = false
  isDuplicateItem.value = false
  
  // Reset cascading dropdowns
  resetCascadingDropdowns()
  
  isEditing.value = false
  editingItemIndex.value = -1
}

const createNewSell = async () => {
  try {
    // Use the regular getSells endpoint to get all sells
    let allSells = []
    
    try {
      const response = await sellsAPI.getSells()
      allSells = response.data.results || response.data || []
      console.log(`Fetched ${allSells.length} existing sells`)
    } catch (error) {
      console.warn('Failed to fetch existing sells, will try to create sell #1:', error)
      // If we can't fetch existing sells, we'll try to create sell #1
      allSells = []
    }
    
    // Extract all existing sell numbers
    const existingNumbers = new Set(allSells.map(sell => sell.sell_number))
    console.log('Existing sell numbers:', Array.from(existingNumbers).sort((a, b) => a - b))
    
    // Find the first available number starting from 1
    let nextSellNumber = 1
    while (existingNumbers.has(nextSellNumber)) {
      nextSellNumber++
      // Safety check to prevent infinite loop
      if (nextSellNumber > 999999) {
        throw new Error('No available sell numbers (reached maximum 999999)')
      }
    }
    
    console.log(`Attempting to create sell #${nextSellNumber}`)
    
    // Create new sell in backend with retry logic for UNIQUE constraint errors
    let attempts = 0
    const maxAttempts = 5
    let newSell = null
    
    while (attempts < maxAttempts) {
  try {
    const newSellData = {
          sell_number: nextSellNumber,
      status: 'draft'
    }
    
    const response = await sellsAPI.createSell(newSellData)
        newSell = response.data
        break // Success, exit retry loop
        
      } catch (createError) {
        attempts++
        
        // Check if it's a UNIQUE constraint error
        if (createError.response?.status === 500 && 
            createError.response?.data?.toString().includes('UNIQUE constraint failed')) {
          
          console.warn(`Sell #${nextSellNumber} already exists, trying next number...`)
          
          // Add this number to existing numbers and try next
          existingNumbers.add(nextSellNumber)
          nextSellNumber++
          
          if (nextSellNumber > 999999) {
            throw new Error('No available sell numbers (reached maximum 999999)')
          }
          
          continue // Try again with next number
        } else {
          // Different error, rethrow
          throw createError
        }
      }
    }
    
    if (!newSell) {
      throw new Error(`Failed to create sell after ${maxAttempts} attempts`)
    }
    
    // Update local state
    currentSellId.value = newSell.id
    sellNumber.value = nextSellNumber
    lastValidSellNumber.value = nextSellNumber
    sellStatus.value = 'draft'
    
    // Reset timestamps
    createdAt.value = newSell.created_at
    updatedAt.value = newSell.updated_at
    showCreated.value = true
    
    // Clear sell items since this is a new empty sell
    sellItems.value = []
    
    // Reset form to clear any existing data
    resetForm()
    
    // Reset header form for new sell
    Object.assign(headerForm, {
      sellType: '',
      customerId: '',
      customerName: '',
      customerPhone: '',
      doctorId: '',
      doctorName: '',
      doctorSpeciality: '',
      insuranceId: '',
      insuranceValidityDate: '',
      prescriptionDate: '',
      birthDate: '',
      insurancePage: ''
    })
    
    // Clear formatted dates
    formattedInsuranceValidityDate.value = ''
    formattedPrescriptionDate.value = ''
    formattedBirthDate.value = ''
    jalaliInsuranceValidityDate.value = ''
    jalaliPrescriptionDate.value = ''
    jalaliBirthDate.value = ''
    
    ElMessage.success(`New sell #${nextSellNumber} created successfully!`)
    
    // Invalidate cache after creating new sell
    invalidateSellsCache()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error creating new sell:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create new sell'
      if (error.response?.status === 500) {
        errorMessage += ': Server error occurred'
      } else if (error.response?.status === 400) {
        errorMessage += ': Invalid data provided'
      } else if (error.message) {
        errorMessage += ': ' + error.message
      }
      
      ElMessage.error(errorMessage)
    }
  }
}

const deleteEntireSell = async () => {
  if (!currentSellId.value) {
    ElMessage.error('No sell to delete')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete Sell #${sellNumber.value}? This action cannot be undone.`,
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    processing.value = true
    await sellsAPI.deleteSellWithItems(currentSellId.value)
    
    ElMessage.success(`Sell #${sellNumber.value} has been completely deleted!`)
    
    // Invalidate cache after deleting sell
    invalidateSellsCache()
    
    emit('sell-deleted', {
      tabId: props.tabId,
      sellNumber: sellNumber.value
    })
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting sell:', error)
      ElMessage.error('Failed to delete sell')
    }
  } finally {
    processing.value = false
  }
}

const finalizeCurrentSell = async () => {
  if (!currentSellId.value) {
    ElMessage.error('No active sell to finalize')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Are you sure you want to finalize Sell #${sellNumber.value}? This will lock the sell and prevent further changes.`,
      'Finalize Sell',
      {
        confirmButtonText: 'Yes, Finalize',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    processing.value = true

    // Step 1: Save all Sell Information header data before finalizing
    const sellHeaderData = {
      sell_type: headerForm.sellType || null,
      customer_id: headerForm.customerId || null,
      customer_name: headerForm.customerName || null,
      customer_phone: headerForm.customerPhone || null,
      doctor_id: headerForm.doctorId || null,
      doctor_name: headerForm.doctorName || null,
      doctor_speciality: headerForm.doctorSpeciality || null,
      insurance_id: headerForm.insuranceId || null,
      insurance_validity_date: headerForm.insuranceValidityDate || null,
      prescription_date: headerForm.prescriptionDate || null,
      birth_date: headerForm.birthDate || null,
      insurance_page: headerForm.insurancePage || null
    }

    console.log('Saving Sell Information header data before finalization:', sellHeaderData)

    // Update the sell with header data
    try {
      await sellsAPI.patchSell(currentSellId.value, sellHeaderData)
      console.log('Sell Information header data saved successfully')
    } catch (headerError) {
      console.error('Error saving sell header data:', headerError)
      ElMessage.error('Failed to save sell information: ' + (headerError.response?.data?.error || headerError.message))
      return
    }

    // Step 2: Finalize the sell in the backend
    const response = await sellsAPI.finalizeSell(currentSellId.value)
    
    // Update local state
    sellStatus.value = 'finalized'
    updatedAt.value = new Date().toISOString()
    
    // Invalidate cache after finalizing sell
    invalidateSellsCache()
    
    ElMessage.success(`Sell #${sellNumber.value} has been finalized successfully! All Sell Information fields are now locked.`)
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error finalizing sell:', error)
      ElMessage.error('Failed to finalize sell: ' + (error.response?.data?.error || error.message))
    }
  } finally {
    processing.value = false
  }
}

const addOrUpdateSellItem = async () => {
  ElMessage.info('Add/Update sell item functionality will be implemented')
}

const editSellItem = (index) => {
  ElMessage.info('Edit sell item functionality will be implemented')
}

const removeSellItem = async (index) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this sell item?',
      'Confirm Delete',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    sellItems.value.splice(index, 1)
    ElMessage.success('Sell item deleted successfully!')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting sell item:', error)
      ElMessage.error('Failed to delete sell item')
    }
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editingItemIndex.value = -1
}

const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = 'Total'
    } else if (column.property === 'quantity') {
      const total = data.reduce((sum, item) => sum + (item.quantity || 0), 0)
      sums[index] = total
    } else if (column.property === 'total_price') {
      const total = data.reduce((sum, item) => sum + (item.total_price || 0), 0)
      sums[index] = formatCurrency(total)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

// Helper functions
const checkNavigationPermission = (targetSellNumber) => {
  return new Promise((resolve) => {
    emit('navigation-attempt', {
      tabId: props.tabId,
      targetSellNumber,
      currentSellNumber: sellNumber.value,
      callback: resolve
    })
  })
}

const loadSellByNumber = async (sellNum) => {
  try {
    const startTime = performance.now()
    
    // Use cached data for faster loading
    const cacheStartTime = performance.now()
    const allSells = await getAllSellsFromCache()
    const cacheEndTime = performance.now()
    console.log(`Cache lookup took: ${cacheEndTime - cacheStartTime}ms`)
    
    // Find sell with the specified number
    const findStartTime = performance.now()
    const targetSell = allSells.find(sell => sell.sell_number === sellNum)
    const findEndTime = performance.now()
    console.log(`Sell find took: ${findEndTime - findStartTime}ms`)
    
    if (targetSell) {
      // Load existing sell
      currentSellId.value = targetSell.id
      sellStatus.value = targetSell.status
      createdAt.value = targetSell.created_at
      updatedAt.value = targetSell.updated_at
      
      // Clear form and reset editing state immediately for faster UI response
      const resetStartTime = performance.now()
      resetForm()
      isEditing.value = false
      editingItemIndex.value = -1
      const resetEndTime = performance.now()
      console.log(`Form reset took: ${resetEndTime - resetStartTime}ms`)
      
      // Load full sell details to populate header form
      await loadSellHeaderData(targetSell.id)
      
      // Load sell items in background (don't await for faster UI)
      const itemsStartTime = performance.now()
      loadSellItems().then(() => {
        const itemsEndTime = performance.now()
        console.log(`Items loading took: ${itemsEndTime - itemsStartTime}ms`)
      })
      
      const totalTime = performance.now() - startTime
      console.log(`Total sell loading took: ${totalTime}ms for sell #${sellNum} (${sellHelpers.getStatusDisplay(targetSell.status)})`)
      return true // Success
    } else {
      // No sell found with this number
      return false // Failed - sell doesn't exist
    }
    
      } catch (error) {
    console.error('Error loading sell:', error)
    ElMessage.error('Failed to load sell data')
    
    // Clear data on error
    currentSellId.value = null
    sellStatus.value = 'draft'
    
    return false // Failed due to error
  }
}

const loadSellHeaderData = async (sellId) => {
  try {
    console.log('Loading sell header data for sell ID:', sellId)
    const response = await sellsAPI.getSell(sellId)
    const sellData = response.data
    
    console.log('Received sell data:', sellData)
    
    // Populate header form with sell data
    headerForm.sellType = sellData.sell_type || ''
    headerForm.customerId = sellData.customer_id || ''
    headerForm.customerName = sellData.customer_name || ''
    headerForm.customerPhone = sellData.customer_phone || ''
    headerForm.doctorId = sellData.doctor_id || ''
    headerForm.doctorName = sellData.doctor_name || ''
    headerForm.doctorSpeciality = sellData.doctor_speciality || ''
    headerForm.insuranceId = sellData.insurance_id || ''
    headerForm.insuranceValidityDate = sellData.insurance_validity_date || ''
    headerForm.prescriptionDate = sellData.prescription_date || ''
    headerForm.birthDate = sellData.birth_date || ''
    headerForm.insurancePage = sellData.insurance_page || ''
    
    // Update formatted date fields - convert Gregorian from backend to Jalali for display
    if (sellData.insurance_validity_date) {
      const gregorianDate = new Date(sellData.insurance_validity_date)
      const jalaliDate = gregorianToJalali(gregorianDate)
      formattedInsuranceValidityDate.value = jalaliDate // Display Jalali for editing
      jalaliInsuranceValidityDate.value = sellData.insurance_validity_date // Show Gregorian as confirmation
    } else {
      formattedInsuranceValidityDate.value = ''
      jalaliInsuranceValidityDate.value = ''
    }
    
    if (sellData.prescription_date) {
      const gregorianDate = new Date(sellData.prescription_date)
      const jalaliDate = gregorianToJalali(gregorianDate)
      formattedPrescriptionDate.value = jalaliDate // Display Jalali for editing
      jalaliPrescriptionDate.value = sellData.prescription_date // Show Gregorian as confirmation
    } else {
      formattedPrescriptionDate.value = ''
      jalaliPrescriptionDate.value = ''
    }
    
    if (sellData.birth_date) {
      const gregorianDate = new Date(sellData.birth_date)
      const jalaliDate = gregorianToJalali(gregorianDate)
      formattedBirthDate.value = jalaliDate // Display Jalali for editing
      jalaliBirthDate.value = sellData.birth_date // Show Gregorian as confirmation
    } else {
      formattedBirthDate.value = ''
      jalaliBirthDate.value = ''
    }
    
    console.log('Header form populated with sell data')
  } catch (error) {
    console.error('Error loading sell header data:', error)
    // Reset header form on error
    Object.assign(headerForm, {
      sellType: '',
      customerId: '',
      customerName: '',
      customerPhone: '',
      doctorId: '',
      doctorName: '',
      doctorSpeciality: '',
      insuranceId: '',
      insuranceValidityDate: '',
      prescriptionDate: '',
      birthDate: '',
      insurancePage: ''
    })
    formattedInsuranceValidityDate.value = ''
    formattedPrescriptionDate.value = ''
    formattedBirthDate.value = ''
    jalaliInsuranceValidityDate.value = ''
    jalaliPrescriptionDate.value = ''
    jalaliBirthDate.value = ''
  }
}

const loadSellItems = async (sellId = null) => {
  const targetSellId = sellId || currentSellId.value
  if (!targetSellId) return
  
  try {
    itemsLoading.value = true
    
    // Check cache first
    const now = Date.now()
    const cacheKey = targetSellId.toString()
    
    if (sellItemsCache.value.has(cacheKey) && sellItemsCacheTimestamp.value.has(cacheKey)) {
      const cacheTime = sellItemsCacheTimestamp.value.get(cacheKey)
      if (now - cacheTime < CACHE_DURATION) {
        // Use cached data
        sellItems.value = sellItemsCache.value.get(cacheKey)
        console.log(`Using cached items for sell ${targetSellId}`)
        calculateSellComputedFields()
        return
      }
    }
    
    // Fetch fresh data
    const response = await sellItemsAPI.getItemsBySell(targetSellId)
    const items = response.data.results || []
    
    // Update cache
    sellItemsCache.value.set(cacheKey, items)
    sellItemsCacheTimestamp.value.set(cacheKey, now)
    
    sellItems.value = items
    console.log(`Fetched fresh items for sell ${targetSellId}`)
    
  } catch (error) {
    console.error('Error loading sell items:', error)
    sellItems.value = []
  } finally {
    itemsLoading.value = false
  }
}

const loadLastSellNumber = async () => {
  try {
    // Use cached data for faster loading
    const allSells = await getAllSellsFromCache()
    
    if (allSells.length > 0) {
      // Find the highest sell number
      const highestSell = allSells.reduce((max, current) => {
        return current.sell_number > max.sell_number ? current : max
      })
      
      // Set the sell number and load its data
      sellNumber.value = highestSell.sell_number
      lastValidSellNumber.value = highestSell.sell_number
      await loadSellByNumber(highestSell.sell_number)
      
      console.log(`Loaded last sell #${highestSell.sell_number} (${sellHelpers.getStatusDisplay(highestSell.status)})`)
    } else {
      // No sells found, set up for creating the first sell
      sellNumber.value = 1
      lastValidSellNumber.value = 1
      currentSellId.value = null
      sellStatus.value = 'draft'
      createdAt.value = new Date().toISOString()
      updatedAt.value = new Date().toISOString()
      
      // Clear items and reset forms
      sellItems.value = []
      resetForm()
      
      // Reset header form
      Object.assign(headerForm, {
        sellType: '',
        customerId: '',
        customerName: '',
        customerPhone: '',
        doctorId: '',
        doctorName: '',
        doctorSpeciality: '',
        insuranceId: '',
        insuranceValidityDate: '',
        prescriptionDate: '',
        birthDate: '',
        insurancePage: ''
      })
      formattedInsuranceValidityDate.value = ''
      formattedPrescriptionDate.value = ''
      formattedBirthDate.value = ''
      jalaliInsuranceValidityDate.value = ''
      jalaliPrescriptionDate.value = ''
      jalaliBirthDate.value = ''
      
      console.log('No existing sells found, ready to create sell #1')
    }
    
  } catch (error) {
    console.error('Error loading last sell number:', error)
    // Fallback to sell #1 setup
    sellNumber.value = 1
    lastValidSellNumber.value = 1
    currentSellId.value = null
    sellStatus.value = 'draft'
    ElMessage.warning('Could not load existing sells, starting fresh with sell #1')
  }
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

// Pharmacy search handler
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
      combinedSearchResults.value = []
      return
    }
    
    // Search pharmacy drugs with optimized filtering
    const pharmacyResults = []
    const exactGtinMatches = []
    
    for (let i = 0; i < drugStore.drugs.length; i++) {
      const drug = drugStore.drugs[i]
      
      // Check for exact GTIN match first (highest priority)
      if (isGtinQuery && (drug.gtin_code === query.trim() || drug.gtin === query.trim())) {
        exactGtinMatches.push(drug)
        continue
      }
      
      // Check for barcode match if it's a barcode query
      if (isBarcodeQuery) {
        // Extract GTIN from barcode and check
        const extractedGtin = query.substring(2, 16)
        if (drug.gtin_code === extractedGtin || drug.gtin === extractedGtin) {
          exactGtinMatches.push(drug)
          continue
        }
      }
      
      // Regular flexible text search
      const searchableText = getSearchableText(drug)
      if (flexibleMatch(searchableText, queryTokens)) {
        pharmacyResults.push(drug)
        
        // Limit pharmacy results to prevent UI lag
        if (pharmacyResults.length >= 50) break
      }
    }
    
    // Combine exact matches first, then regular results
    pharmacySearchResults.value = [...exactGtinMatches, ...pharmacyResults]
    
    // Only show pharmacy results (no TTAC drugs)
    combinedSearchResults.value = [...exactGtinMatches, ...pharmacyResults]
    
  } catch (error) {
    console.error('Drug search failed:', error)
    pharmacySearchResults.value = []
    combinedSearchResults.value = []
  } finally {
    isSearchingPharmacy.value = false
  }
}

const onPharmacyDrugSelect = async (drugId) => {
  if (!drugId) {
    selectedPharmacyDrug.value = null
    resetCascadingDropdowns()
    return
  }

  const drug = combinedSearchResults.value.find(d => d.id === drugId)
  if (drug) {
    // Handle pharmacy drug selection (existing drug only)
    sellForm.selectedDrug = drug
    
    // Fetch batches for existing pharmacy drug
    await fetchDrugBatches(drug.id)
    
    // Prepare batches for dropdown
    availableBatches.value = drugBatches.value.map(batch => ({
      ...batch,
      total_quantity: calculateBatchTotalQuantity(batch),
      display_label: `${batch.batch_number} - Exp: ${formatDate(batch.expiry_date)} - Stock: ${calculateBatchTotalQuantity(batch)}`
    }))
    
    // Show batch dropdown and hide location dropdown
    showBatchDropdown.value = true
    showLocationDropdown.value = false
    selectedBatch.value = null
    selectedLocation.value = null
    
    ElMessage.success(`Selected drug: ${drug.english_name || drug.persian_name}. Now select a batch.`)
    
    selectedPharmacyDrug.value = null
  }
}

const onBatchSelect = (batchId) => {
  if (!batchId) {
    selectedBatch.value = null
    showLocationDropdown.value = false
    selectedLocation.value = null
    return
  }

  const batch = availableBatches.value.find(b => b.id === batchId)
  if (batch) {
    selectedBatch.value = batch
    
    // Auto-populate batch number in form
    sellForm.batchNumber = batch.batch_number
    
    // Prepare locations for dropdown
    if (batch.batch_locations && batch.batch_locations.length > 0) {
      availableLocations.value = batch.batch_locations.map(location => ({
        ...location,
        display_label: `${location.storage_name} - Stock: ${location.quantity}`
      }))
      
      // Show location dropdown
      showLocationDropdown.value = true
      selectedLocation.value = null
      
      ElMessage.success(`Selected batch: ${batch.batch_number}. Now select a location.`)
    } else {
      // No locations available
      showLocationDropdown.value = false
      selectedLocation.value = null
      ElMessage.warning(`Batch ${batch.batch_number} has no locations with stock.`)
    }
  }
}

const onLocationSelect = (locationId) => {
  if (!locationId) {
    selectedLocation.value = null
    return
  }

  const location = availableLocations.value.find(l => l.id === locationId)
  if (location) {
    selectedLocation.value = location
    
    // Keep location dropdown visible but hide others
    showBatchDropdown.value = false
    showLocationDropdown.value = true
    
    ElMessage.success(`Selected location: ${location.storage_name} with ${location.quantity} units available. You can now enter quantity.`)
  }
}

const resetCascadingDropdowns = () => {
  selectedBatch.value = null
  selectedLocation.value = null
  availableBatches.value = []
  availableLocations.value = []
  showBatchDropdown.value = false
  showLocationDropdown.value = false
  
  // Also clear the selected drug
  sellForm.selectedDrug = null
}

const goBackToBatchSelection = () => {
  selectedLocation.value = null
  availableLocations.value = []
  showLocationDropdown.value = false
  showBatchDropdown.value = true
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

// Calculate days to expire
const getDaysToExpire = (expiryDateString) => {
  if (!expiryDateString) return 0
  
  const today = new Date()
  const expiryDate = new Date(expiryDateString)
  
  // Reset time to start of day for accurate day calculation
  today.setHours(0, 0, 0, 0)
  expiryDate.setHours(0, 0, 0, 0)
  
  const timeDiff = expiryDate.getTime() - today.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
  
  return daysDiff
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
    
    // Batch number processing removed since batch field was deleted
    
    barcodeParseSuccess.value = true
    
    ElMessage.success(`Barcode parsed successfully! 
      GTIN: ${gtinCode}
      ${expiryDateStr ? `Expiry: ${expiryDateStr}` : ''}`)
    
  } catch (error) {
    console.error('Error parsing barcode:', error)
    barcodeParseSuccess.value = false
    ElMessage.error('Failed to parse barcode data')
  }
}







// Sell type change handler
const onSellTypeChange = (sellType) => {
  // Clear doctor and insurance fields when sell type changes
  if (!showDoctorFields.value) {
    headerForm.doctorId = ''
    headerForm.doctorName = ''
    headerForm.doctorSpeciality = ''
  }
  
  if (!showInsuranceFields.value) {
    headerForm.insuranceId = ''
    headerForm.insuranceValidityDate = ''
    headerForm.prescriptionDate = ''
    headerForm.birthDate = ''
    headerForm.insurancePage = ''
    
    // Clear formatted dates
    formattedInsuranceValidityDate.value = ''
    formattedPrescriptionDate.value = ''
    formattedBirthDate.value = ''
    jalaliInsuranceValidityDate.value = ''
    jalaliPrescriptionDate.value = ''
    jalaliBirthDate.value = ''
  }
}

// Customer ID input handler with auto-population
const onCustomerIdInput = (customerId) => {
  if (!customerId || !customerId.trim()) {
    // Clear customer fields if ID is empty
    headerForm.customerName = ''
    headerForm.customerPhone = ''
    return
  }
  
  // Ensure customers are loaded
  if (!customerStore.customers || customerStore.customers.length === 0) {
    console.log('Customer store is empty, attempting to load customers...')
    customerStore.fetchCustomers().catch(error => {
      console.error('Failed to load customers:', error)
    })
    return
  }
  
  console.log('Searching for customer with ID:', customerId.trim())
  console.log('Available customers:', customerStore.customers.map(c => ({
    id: c.id,
    id_number: c.id_number,
    name: c.name
  })))
  
  // Find customer by ID number or database ID
  const customer = customerStore.customers.find(c => 
    c.id_number === customerId.trim() || 
    c.id === parseInt(customerId.trim())
  )
  
  if (customer) {
    // Auto-populate customer fields
    headerForm.customerName = customer.name || ''
    headerForm.customerPhone = customer.phone || ''
    console.log('Customer auto-populated:', customer.name)
  } else {
    // Clear fields if customer not found
    headerForm.customerName = ''
    headerForm.customerPhone = ''
    console.log('No customer found with ID:', customerId.trim())
  }
}

// Doctor ID input handler with auto-population
const onDoctorIdInput = (doctorId) => {
  if (!doctorId || !doctorId.trim()) {
    // Clear doctor fields if ID is empty
    headerForm.doctorName = ''
    headerForm.doctorSpeciality = ''
    return
  }
  
  // Ensure doctors are loaded
  if (!doctorStore.doctors || doctorStore.doctors.length === 0) {
    console.log('Doctor store is empty, attempting to load doctors...')
    doctorStore.fetchDoctors().catch(error => {
      console.error('Failed to load doctors:', error)
    })
    return
  }
  
  console.log('Searching for doctor with ID:', doctorId.trim())
  console.log('Available doctors:', doctorStore.doctors.map(d => ({
    id: d.id,
    medical_council_number: d.medical_council_number,
    name: d.name
  })))
  
  // Find doctor by medical council number or database ID
  const doctor = doctorStore.doctors.find(d => 
    d.medical_council_number === doctorId.trim() || 
    d.id === parseInt(doctorId.trim())
  )
  
  if (doctor) {
    // Auto-populate doctor fields
    headerForm.doctorName = doctor.name || ''
    // Join specialties array into a string if it exists
    headerForm.doctorSpeciality = Array.isArray(doctor.specialties) 
      ? doctor.specialties.join(', ') 
      : (doctor.specialties || '')
    console.log('Doctor auto-populated:', doctor.name, 'Specialties:', doctor.specialties)
  } else {
    // Clear fields if doctor not found
    headerForm.doctorName = ''
    headerForm.doctorSpeciality = ''
    console.log('No doctor found with ID:', doctorId.trim())
  }
}

// Insurance date handling functions
const handleInsuranceValidityDateInput = (value) => {
  // Remove any non-digit characters except forward slashes
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  // Handle backspace - if user deletes a slash, also remove the preceding character
  if (formattedInsuranceValidityDate.value && value.length < formattedInsuranceValidityDate.value.length) {
    // User is deleting, don't auto-format
    formattedInsuranceValidityDate.value = cleanValue
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
  
  // Update the display value (Jalali input)
  formattedInsuranceValidityDate.value = cleanValue
}

const validateAndFormatInsuranceValidityDate = () => {
  const jalaliDateStr = formattedInsuranceValidityDate.value?.trim()
  if (!jalaliDateStr) {
    focusedField.value = null
    return
  }

  // Validate Jalali date format
  const validation = validateJalaliDate(jalaliDateStr)
  if (!validation.isValid) {
    if (jalaliDateStr.length < 10) {
      // Don't show error for incomplete dates
      focusedField.value = null
      return
    } else {
      ElMessage.warning(validation.error || 'Invalid Jalali date format. Please use YYYY/MM/DD format.')
      formattedInsuranceValidityDate.value = ''
      headerForm.insuranceValidityDate = ''
      jalaliInsuranceValidityDate.value = ''
      focusedField.value = null
      return
    }
  }
  
  // Convert Jalali to Gregorian
  const gregorianDate = jalaliToGregorian(jalaliDateStr)
  if (!gregorianDate) {
    ElMessage.warning('Invalid Jalali date. Please check the date is correct.')
    formattedInsuranceValidityDate.value = ''
    headerForm.insuranceValidityDate = ''
    jalaliInsuranceValidityDate.value = ''
    focusedField.value = null
    return
  }
  
  // Format Gregorian date for backend (YYYY-MM-DD)
  const year = gregorianDate.getFullYear()
  const month = String(gregorianDate.getMonth() + 1).padStart(2, '0')
  const day = String(gregorianDate.getDate()).padStart(2, '0')
  const gregorianDateString = `${year}-${month}-${day}`
  
  // Update the form values
  headerForm.insuranceValidityDate = gregorianDateString // Save Gregorian for backend
  jalaliInsuranceValidityDate.value = gregorianDateString // Display Gregorian as confirmation
  
  console.log('Insurance Validity Date - Jalali input:', jalaliDateStr, 'Gregorian saved:', gregorianDateString)
  
  focusedField.value = null
}

const handlePrescriptionDateInput = (value) => {
  // Same logic as insurance validity date
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  if (formattedPrescriptionDate.value && value.length < formattedPrescriptionDate.value.length) {
    formattedPrescriptionDate.value = cleanValue
    return
  }
  
  const slashCount = (cleanValue.match(/\//g) || []).length
  if (slashCount > 2) {
    cleanValue = cleanValue.replace(/\/+$/, '')
    const parts = cleanValue.split('/')
    if (parts.length > 3) {
      cleanValue = parts.slice(0, 3).join('/')
    }
  }
  
  if (cleanValue.length === 4 && !cleanValue.includes('/')) {
    cleanValue = cleanValue + '/'
  } else if (cleanValue.length === 7 && cleanValue.split('/').length === 2) {
    cleanValue = cleanValue + '/'
  }
  
  if (cleanValue.length > 10) {
    cleanValue = cleanValue.substring(0, 10)
  }
  
  formattedPrescriptionDate.value = cleanValue
}

const validateAndFormatPrescriptionDate = () => {
  const jalaliDateStr = formattedPrescriptionDate.value?.trim()
  if (!jalaliDateStr) {
    focusedField.value = null
    return
  }

  // Validate Jalali date format
  const validation = validateJalaliDate(jalaliDateStr)
  if (!validation.isValid) {
    if (jalaliDateStr.length < 10) {
      // Don't show error for incomplete dates
      focusedField.value = null
      return
    } else {
      ElMessage.warning(validation.error || 'Invalid Jalali date format. Please use YYYY/MM/DD format.')
      formattedPrescriptionDate.value = ''
      headerForm.prescriptionDate = ''
      jalaliPrescriptionDate.value = ''
      focusedField.value = null
      return
    }
  }
  
  // Convert Jalali to Gregorian
  const gregorianDate = jalaliToGregorian(jalaliDateStr)
  if (!gregorianDate) {
    ElMessage.warning('Invalid Jalali date. Please check the date is correct.')
    formattedPrescriptionDate.value = ''
    headerForm.prescriptionDate = ''
    jalaliPrescriptionDate.value = ''
    focusedField.value = null
    return
  }
  
  // Format Gregorian date for backend (YYYY-MM-DD)
  const year = gregorianDate.getFullYear()
  const month = String(gregorianDate.getMonth() + 1).padStart(2, '0')
  const day = String(gregorianDate.getDate()).padStart(2, '0')
  const gregorianDateString = `${year}-${month}-${day}`
  
  // Update the form values
  headerForm.prescriptionDate = gregorianDateString // Save Gregorian for backend
  jalaliPrescriptionDate.value = gregorianDateString // Display Gregorian as confirmation
  
  console.log('Prescription Date - Jalali input:', jalaliDateStr, 'Gregorian saved:', gregorianDateString)
  
  focusedField.value = null
}

const handleBirthDateInput = (value) => {
  // Same logic as other dates
  let cleanValue = value.replace(/[^\d\/]/g, '')
  
  if (formattedBirthDate.value && value.length < formattedBirthDate.value.length) {
    formattedBirthDate.value = cleanValue
    return
  }
  
  const slashCount = (cleanValue.match(/\//g) || []).length
  if (slashCount > 2) {
    cleanValue = cleanValue.replace(/\/+$/, '')
    const parts = cleanValue.split('/')
    if (parts.length > 3) {
      cleanValue = parts.slice(0, 3).join('/')
    }
  }
  
  if (cleanValue.length === 4 && !cleanValue.includes('/')) {
    cleanValue = cleanValue + '/'
  } else if (cleanValue.length === 7 && cleanValue.split('/').length === 2) {
    cleanValue = cleanValue + '/'
  }
  
  if (cleanValue.length > 10) {
    cleanValue = cleanValue.substring(0, 10)
  }
  
  formattedBirthDate.value = cleanValue
}

const validateAndFormatBirthDate = () => {
  const jalaliDateStr = formattedBirthDate.value?.trim()
  if (!jalaliDateStr) {
    focusedField.value = null
    return
  }

  // Validate Jalali date format
  const validation = validateJalaliDate(jalaliDateStr)
  if (!validation.isValid) {
    if (jalaliDateStr.length < 10) {
      // Don't show error for incomplete dates
      focusedField.value = null
      return
    } else {
      ElMessage.warning(validation.error || 'Invalid Jalali date format. Please use YYYY/MM/DD format.')
      formattedBirthDate.value = ''
      headerForm.birthDate = ''
      jalaliBirthDate.value = ''
      focusedField.value = null
      return
    }
  }
  
  // Convert Jalali to Gregorian
  const gregorianDate = jalaliToGregorian(jalaliDateStr)
  if (!gregorianDate) {
    ElMessage.warning('Invalid Jalali date. Please check the date is correct.')
    formattedBirthDate.value = ''
    headerForm.birthDate = ''
    jalaliBirthDate.value = ''
    focusedField.value = null
    return
  }
  
  // Additional validation for birthdate (should not be in future)
  if (gregorianDate > new Date()) {
    ElMessage.warning('Birth date cannot be in the future.')
    formattedBirthDate.value = ''
    headerForm.birthDate = ''
    jalaliBirthDate.value = ''
    focusedField.value = null
    return
  }
  
  // Format Gregorian date for backend (YYYY-MM-DD)
  const year = gregorianDate.getFullYear()
  const month = String(gregorianDate.getMonth() + 1).padStart(2, '0')
  const day = String(gregorianDate.getDate()).padStart(2, '0')
  const gregorianDateString = `${year}-${month}-${day}`
  
  // Update the form values
  headerForm.birthDate = gregorianDateString // Save Gregorian for backend
  jalaliBirthDate.value = gregorianDateString // Display Gregorian as confirmation
  
  console.log('Birth Date - Jalali input:', jalaliDateStr, 'Gregorian saved:', gregorianDateString)
  
  focusedField.value = null
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

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '' || isNaN(price)) {
    return '0'
  }
  return Math.round(parseFloat(price)).toLocaleString('en-US')
}

// Currency input handlers
const handleCurrencyInput = (value, field) => {
  // Remove all non-digit characters except commas and periods
  const cleanValue = value.replace(/[^\d,.-]/g, '').replace(/,/g, '')
  const numericValue = parseFloat(cleanValue) || 0
  
  sellForm[field] = numericValue
}

const handleCurrencyFocus = (field) => {
  focusedField.value = field
}

const handleCurrencyBlur = (field) => {
  focusedField.value = null
}

// Available storages
const availableStorages = ref([])



const handleDrugUpdated = async (drug) => {
  ElMessage.success('Drug saved successfully!')
  
  // Refresh the drugs list to include the new/updated drug
  await drugStore.fetchDrugs()
}

const handleDrugDeleted = (drugId) => {
  editDialogVisible.value = false
  ElMessage.success('Drug deleted successfully!')
  drugStore.fetchDrugs()
}

// Initialize component
onMounted(async () => {
  try {
    // Load available storages
    await storageStore.fetchStorages()
    availableStorages.value = storageStore.storages
    
    // Ensure pharmacy drugs are loaded
    if (drugStore.drugs.length === 0) {
      await drugStore.fetchDrugs()
    }
    
    // Load customer, doctor, and insurance data
    if (customerStore.customers.length === 0) {
      await customerStore.fetchCustomers()
    }
    
    if (doctorStore.doctors.length === 0) {
      await doctorStore.fetchDoctors()
    }
    
    if (insuranceStore.insurances.length === 0) {
      await insuranceStore.fetchInsurances()
    }
    
  if (props.initialSellNumber) {
      // Load the specific sell number passed as prop
    await loadSellByNumber(props.initialSellNumber)
  } else {
      // Load the last (highest) sell number available
      await loadLastSellNumber()
    }
    
  } catch (error) {
    console.error('Error initializing component:', error)
  }
})

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchDebounceTimeout) {
    clearTimeout(searchDebounceTimeout)
  }
  
  // Clear search caches to free memory
  pharmacySearchCache.clear()
  
  // Clear sells cache
  invalidateSellsCache()
})
</script>

<style scoped>
.sells-view {
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

.header-info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 10px;
  gap: 20px;
}

.sell-number-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sell-number-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.sell-number-controls {
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

.new-sell-button {
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

.sell-number-input {
  width: 80px;
}

.sell-number-input :deep(.el-input__inner) {
  text-align: center;
  font-weight: 600;
  color: var(--primary-color);
  padding: 0 8px;
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

.drug-edit-button {
  background-color: #08C2FF;
  border-color: #ffffff;
  color: #ffffff;
  font-size: 12px;
  padding: 6px 6px;
  height: 28px;
  margin-left: 2px;
  font-weight: bold;
}

.status-display-button {
  font-size: 12px;
  padding: 6px 12px;
  height: 28px;
  margin-left: 4px;
  font-weight: bold;
  color: #ffffff;
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

.delete-sell-button {
  margin-left: 2px;
  font-weight: 600;
  height: 28px;
}

.status-alert {
  margin-bottom: 20px;
}

.sell-header-card,
.sell-form-card,
.sell-table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 10px;
}

.header-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.table-header-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.operations-container {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.no-data-message,
.loading-message {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.loading-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-indicator {
  color: #999;
  font-size: 12px;
  margin-left: 10px;
}

/* Floating label effect for form fields */
.sell-form .el-form-item,
.sell-header-form .el-form-item {
  position: relative;
  margin-bottom: 20px;
}

.sell-form .el-form-item::before,
.sell-header-form .el-form-item::before {
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

.sell-form .el-form-item.has-value::before,
.sell-form .el-form-item.is-focused::before,
.sell-header-form .el-form-item.has-value::before,
.sell-header-form .el-form-item.is-focused::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

.unified-search-field::before {
  display: none;
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
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
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

.computed-field :deep(.el-input__inner) {
  background-color: #f8f9fa;
  border-color: #e9ecef;
  color: #343434;
  font-weight: 600;
  text-align: center;
}

.currency-input-container {
  position: relative;
  width: 100%;
}

.currency-input :deep(.el-input__inner) {
  font-weight: 500;
  text-align: center;
  direction: ltr;
}

.currency-display {
  position: absolute;
  right: 12px;
  top: -12px;
  font-size: 14px;
  color: #67c23a;
  background: white;
  padding: 0 4px;
  white-space: nowrap;
  z-index: 10;
  transform: scale(0.85);
  pointer-events: none;
  transition: all 0.3s ease;
}

.computed-fields-section {
  position: relative;
  padding-top: 5px;
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

/* Sell header card styles */
.sell-header-card {
  margin-bottom: 20px;
}

.sell-header-form {
  width: 100%;
}

.sell-header-form .el-row {
  margin-bottom: 10px;
}

.sell-header-form .el-form-item {
  position: relative;
  margin-bottom: 5px;
}

/* Apply same floating label styles as sell form */
.sell-header-form .el-form-item::before {
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

.sell-header-form .el-form-item.has-value::before,
.sell-header-form .el-form-item.is-focused::before {
  top: -8px;
  font-size: 12px;
  color: #409eff;
  transform: scale(0.85);
}

.sell-header-form .computed-fields-section .el-form-item::before {
  color: #67c23a;
}

.sell-header-form .computed-fields-section .el-form-item.has-value::before {
  color: #67c23a;
}

.sell-header-form .computed-field {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.sell-header-form .computed-field .el-input__inner {
  background-color: #f5f7fa;
  color: #67c23a;
  font-weight: 600;
}

.sell-header-form .currency-input-container {
  position: relative;
}

.sell-header-form .currency-display {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
}

/* Jalali date display styles */
.jalali-date-display {
  position: absolute;
  right: 8px;
  bottom: -18px;
  font-size: 12px;
  color: #67c23a;
  background: white;
  padding: 2px 4px;
  border-radius: 2px;
  /* border: 1px solid #e5e7eb; */
  white-space: nowrap;
  z-index: 10;
  transform: scale(0.85);
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
  gap: 1px;
}

/* .drug-status-tag {
  font-size: 0.8rem;
  padding: 4px 14px 0px 0px;
  border-radius: 6px;
  font-weight: 500;
} */

/* .drug-status-tag .el-icon {
  margin-right: 1px;
  font-size: 14px;
} */

.display-language-toggle {
  min-width: 35px;
  font-size: 12px;
  padding: 1px 2px;
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
  gap: 1px;
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

/* Duplicate item warning styles */
.sell-form .el-form-item.has-error .el-input.is-duplicate .el-input__inner {
  border-color: #e6a23c !important;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
}

.sell-form .el-form-item.has-error::before {
  color: #ea580c !important;
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

/* Cascading dropdown styles */
.cascading-dropdown-row {
  margin-top: 15px;
  margin-bottom: 10px;
}

.cascading-dropdown-field :deep(.el-form-item__label) {
  color: #2e8ceb;
  font-weight: 600;
  font-size: 14px;
}

.batch-select,
.location-select {
  border: 2px solid #2e8ceb;
  border-radius: 6px;
  background-color: #f0f9ff;
}

.batch-select :deep(.el-input__inner),
.location-select :deep(.el-input__inner) {
  background-color: #f0f9ff;
  border-color: #2e8ceb;
  font-weight: 500;
}

.batch-select:hover :deep(.el-input__inner),
.location-select:hover :deep(.el-input__inner) {
  border-color: #1e40af;
}

.batch-select.is-focused :deep(.el-input__inner),
.location-select.is-focused :deep(.el-input__inner) {
  border-color: #2e8ceb;
  box-shadow: 0 0 0 2px rgba(46, 140, 235, 0.1);
}

/* Simple batch option styling */
.batch-option-simple {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 0;
}

.batch-number {
  font-weight: 600;
  color: #374151;
  font-family: sans-serif;
  width: 80px;
  flex-shrink: 0;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-price {
  font-size: 13px;
  color: #059669;
  font-weight: bold;
  font-family: sans-serif;
  width: 120px;
  flex-shrink: 0;
}

.batch-expiry {
  font-size: 13px;
  color: #b88230;
  font-weight: bold;
  font-family: sans-serif;
  width: 160px;
  flex-shrink: 0;
}

.batch-separator {
  font-size: 13px;
  color: #9ca3af;
  font-weight: normal;
  font-family: sans-serif;
}

.batch-stock {
  font-size: 13px;
  color: #2e8ceb;
  font-weight: bold;
  font-family: sans-serif;
}

/* Simple location option styling */
.location-option-simple {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 0;
}

.location-name {
  font-weight: 600;
  color: #374151;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
  width: 120px;
  flex-shrink: 0;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
}

.location-separator {
  font-size: 13px;
  color: #9ca3af;
  font-weight: normal;
  font-family: sans-serif;
}

.location-stock {
  font-size: 13px;
  color: #2e8ceb;
  font-weight: bold;
  font-family: sans-serif;
}

/* Simple drug option styling */
.drug-option-simple {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 0;
}

/* Two-line drug option styling */
.drug-option-two-line {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 2px 0;
  min-height: 48px;
}

.drug-option-line {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 3px;
  line-height: 1;
}

.drug-option-second-line {
  margin-bottom: 0;
}

.drug-generic-spacer {
  width: 50px;
  flex-shrink: 0;
}

/* Ensure dropdown options have enough height for two lines */
.unified-search-select :deep(.el-select-dropdown__item) {
  height: auto !important;
  min-height: 50px !important;
  padding: 4px 20px !important;
  line-height: 1.5 !important;
}

.unified-search-select :deep(.el-select-dropdown__item.hover) {
  background-color: #f5f7fa;
}

.drug-generic {
  font-weight: 600;
  color: #374151;
  font-family: sans-serif;
  width: 50px;
  flex-shrink: 0;
  font-size: 13px;
}

.drug-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drug-name {
  font-size: 15px;
  color: #1e293b;
  font-weight: 600;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
  width: 700px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drug-company {
  font-size: 11px;
  color: #475569;
  font-weight: 500;
  font-family: var(--font-persian, 'Vazir', 'Tahoma', sans-serif);
  width: 250px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drug-price {
  font-size: 11px;
  color: #059669;
  font-weight: bold;
  font-family: sans-serif;
  width: 140px;
  flex-shrink: 0;
}

.drug-separator {
  font-size: 11px;
  color: #9ca3af;
  font-weight: normal;
  font-family: sans-serif;
}

.drug-stock {
  font-size: 11px;
  color: #2e8ceb;
  font-weight: bold;
  font-family: sans-serif;
}

/* Cascading dropdown animations */
.cascading-dropdown-row {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .sells-view {
    padding: 10px;
  }
  
  .header-info-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .cascading-dropdown-row {
    margin-top: 10px;
    margin-bottom: 8px;
  }
}
</style> 