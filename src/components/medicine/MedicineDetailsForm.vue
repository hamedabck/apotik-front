<template>
  <el-form
    :model="modelValue"
    :rules="detailsRules"
    label-width="180px"
    ref="detailsFormRef"
    class="add-medicine-form"
  >
    <h3 class="form-section-title">Basic Information</h3>

    <el-row :gutter="20">

      <el-col :span="12">
        <!-- Empty column for spacing -->
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Search Pharmacy Drugs" class="pharmacy-search-field">
          <div class="pharmacy-search-container">
                        <el-select
              v-model="selectedPharmacyDrug"
              filterable
              remote
              reserve-keyword
              placeholder="Search existing drugs in your pharmacy"
              :remote-method="searchPharmacyDrugs"
              :loading="isSearchingPharmacy"
              style="width: 100%"
              @change="onPharmacyDrugSelect"
              clearable
              class="pharmacy-drug-search"
            >
              <el-option
                v-for="drug in pharmacySearchResults"
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
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <!-- Empty column for spacing -->
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="▌▌▌GTIN code" prop="gtinCode" required>
          <div class="gtin-input-container">
            <el-input
              v-model="modelValue.gtinCode"
              @input="handleGtinInput"
              @blur="searchByGtin"
              @paste="handleGtinPaste"
              @keyup.enter="searchByGtin"
              :loading="isSearching"
              placeholder="Enter/paste GTIN code (English keyboard only) - searches automatically"
            />
            <el-icon v-if="drugFound" class="gtin-success-icon">
              <i-ep-circle-check />
            </el-icon>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Category" prop="category" required>
          <el-select
            v-model="modelValue.category"
            @change="updateDetails"
            placeholder="Select product category"
            style="width: 100%"
          >
            <el-option
              v-for="category in categoryOptions"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            >
              <span style="float: left">{{ category.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px" class="persian-text">{{ category.labelPersian }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-col>

      <!-- IRC code field is hidden but still exists in the model -->
      <el-col :span="12" style="display: none;">
        <el-form-item label="IRC code" prop="ircCode">
          <el-input v-model="modelValue.ircCode" @input="updateDetails" />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Generic code and Generic Name - only show when category is 'drug' -->
    <el-row :gutter="20" v-if="modelValue.category === 'drug'">
      <el-col :span="12">
        <el-form-item label="Generic code" prop="genericCode" >
          <el-input v-model="modelValue.genericCode" @input="updateDetails" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="Generic Name" prop="genericName" >
          <el-input
            v-model="modelValue.genericName"
            @input="updateDetails"
            class="input-mixed"
            v-persian
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="English Brand Name" prop="englishName" required>
          <el-input v-model="modelValue.englishName" @input="updateDetails" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item label="Persian Brand Name" prop="persianName" required>
          <el-input
            v-model="modelValue.persianName"
            @input="updateDetails"
            class="persian-input"
            placeholder="نام فارسی دارو را وارد کنید"
            v-persian
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item
          label="English Co Name"
          prop="englishCompanyName"
          required
        >
          <el-input
            v-model="modelValue.englishCompanyName"
            @input="updateDetails"
          />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item
          label="Persian Co Name"
          prop="persianCompanyName"
          required
        >
          <el-input
            v-model="modelValue.persianCompanyName"
            @input="updateDetails"
            class="persian-input"
            placeholder="نام فارسی شرکت را وارد کنید"
            v-persian
          />
        </el-form-item>
      </el-col>
    </el-row>

    <h3 class="form-section-title">Additional Information</h3>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Technical Evaluation" prop="technicalEvaluation">
          <el-switch
            v-model="modelValue.technicalEvaluation"
            @change="updateDetails"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Units per Box" prop="numPerBox">
          <el-input-number
            v-model="modelValue.numPerBox"
            :min="1"
            @change="updateDetails"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Keywords" prop="keyword">
          <div class="keywords-container">
            <el-input
              v-model="keywordInput"
              placeholder="Type and press enter to add keywords"
              @keyup.enter="addKeyword"
              class="keyword-input input-mixed"
            />
            <div class="keywords-list">
              <el-tag
                v-for="(keyword, index) in getKeywordsList()"
                :key="index"
                closable
                @close="removeKeyword(index)"
                class="keyword-tag"
                v-persian
              >
                {{ keyword.trim() }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="Latest Price (TTAC)" prop="latestPrice">
          <div class="latest-price-container">
            <span class="latest-price">
              <span v-if="modelValue.latestPrice" class="price-display">
                <span class="amount">{{
                  Number(modelValue.latestPrice).toLocaleString()
                }}</span>
                <span class="currency">ریال</span>
              </span>
              <span v-else class="no-price">اطلاعاتی در دسترس نیست</span>
            </span>
            <el-button
              v-if="modelValue.gtinCode"
              size="small"
              type="primary"
              plain
              @click="refreshLatestPrice"
              :loading="isRefreshingPrice"
              class="refresh-price-btn"
            >
              <el-icon><i-ep-refresh /></el-icon>
              بروزرسانی
            </el-button>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Product Barcodes" prop="barcodes">
          <div class="barcodes-container">
            <el-input
              v-model="barcodeInput"
              placeholder="Type barcode and press enter to add"
              @keyup.enter="addBarcode"
              class="barcode-input"
            />
            <div class="barcodes-list">
              <el-tag
                v-for="(barcode, index) in modelValue.barcodes || []"
                :key="index"
                closable
                @close="removeBarcode(index)"
                class="barcode-tag"
                type="info"
              >
                {{ barcode }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item
          label="Pharmacist Description"
          prop="pharmacistDescription"
        >
          <el-input
            v-model="modelValue.pharmacistDescription"
            @input="updateDetails"
            type="textarea"
            rows="3"
            class="input-mixed"
            placeholder="توضیحات داروساز (فارسی یا انگلیسی)"
            v-persian
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
import { ref, defineProps, defineEmits, onBeforeUnmount, computed, watch } from "vue";
import { useTtacDrugsStore } from "@/store/ttacDrugs";
import { usePharmacyDrugStore } from "@/stores/pharmacyDrugStore";
import { ElMessage } from "element-plus";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "validate"]);

const ttacDrugsStore = useTtacDrugsStore();
const pharmacyDrugStore = usePharmacyDrugStore();
const detailsFormRef = ref(null);
const keywordInput = ref("");
const barcodeInput = ref("");
const isSearching = ref(false);
const drugFound = ref(false);
const isRefreshingPrice = ref(false);
let searchTimeout = null;

// Pharmacy drug search state
const selectedPharmacyDrug = ref(null);
const pharmacySearchResults = ref([]);
const isSearchingPharmacy = ref(false);
const showPersianNamesInSearch = ref(false);

const detailsRules = {
  gtinCode: [
    { required: true, message: "GTIN code is required", trigger: "blur" },
  ],
  ircCode: [],
  genericCode: [
    { 
      required: false, 
      validator: (rule, value, callback) => {
        if (props.modelValue.category === 'drug' && (!value || !value.trim())) {
          callback(new Error('Generic code is required for drug category'));
        } else {
          callback();
        }
      },
      trigger: "blur" 
    },
  ],
  englishName: [
    { required: true, message: "English name is required", trigger: "blur" },
  ],
  persianName: [
    { required: true, message: "Persian name is required", trigger: "blur" },
  ],
  genericName: [
    { 
      required: false, 
      validator: (rule, value, callback) => {
        if (props.modelValue.category === 'drug' && (!value || !value.trim())) {
          callback(new Error('Generic name is required for drug category'));
        } else {
          callback();
        }
      },
      trigger: "blur" 
    },
  ],
  englishCompanyName: [
    {
      required: true,
      message: "English company name is required",
      trigger: "blur",
    },
  ],
  persianCompanyName: [
    {
      required: true,
      message: "Persian company name is required",
      trigger: "blur",
    },
  ],
  category: [
    { required: true, message: "Category is required", trigger: "change" },
  ],
};

// Category options with English and Persian labels
const categoryOptions = [
  { value: 'drug', label: 'Drug', labelPersian: 'دارو' },
  { value: 'milk', label: 'Milk', labelPersian: 'شیر' },
  { value: 'cosmetic', label: 'Cosmetic', labelPersian: 'آرایشی و بهداشتی' },
  { value: 'herbal', label: 'Herbal', labelPersian: 'گیاهی' },
  { value: 'equipment', label: 'Equipment', labelPersian: 'تجهیزات' },
  { value: 'gym_supplements', label: 'GYM Supplements', labelPersian: 'مکمل‌های ورزشی' },
  { value: 'others', label: 'Others', labelPersian: 'سایر' },
];

// Computed property to get keywords as array
const getKeywordsList = () => {
  if (!props.modelValue.keyword) return [];
  return props.modelValue.keyword
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k);
};

const addKeyword = () => {
  if (keywordInput.value.trim()) {
    const currentKeywords = getKeywordsList();
    if (!currentKeywords.includes(keywordInput.value.trim())) {
      currentKeywords.push(keywordInput.value.trim());
      props.modelValue.keyword = currentKeywords.join(",");
      updateDetails();
    }
    keywordInput.value = "";
  }
};

const removeKeyword = (index) => {
  const keywords = getKeywordsList();
  keywords.splice(index, 1);
  props.modelValue.keyword = keywords.join(",");
  updateDetails();
};

const addBarcode = () => {
  if (barcodeInput.value.trim()) {
    // Initialize barcodes array if it doesn't exist
    if (!props.modelValue.barcodes) {
      props.modelValue.barcodes = [];
    }

    // Check for duplicates
    if (!props.modelValue.barcodes.includes(barcodeInput.value.trim())) {
      props.modelValue.barcodes.push(barcodeInput.value.trim());
      updateDetails();
    }
    barcodeInput.value = "";
  }
};

const removeBarcode = (index) => {
  if (props.modelValue.barcodes) {
    props.modelValue.barcodes.splice(index, 1);
    updateDetails();
  }
};

const updateDetails = () => {
  emit("update:modelValue", props.modelValue);
};

const validate = async () => {
  if (!detailsFormRef.value) return false;
  return await detailsFormRef.value.validate();
};

const handleGtinInput = () => {
  // Check for non-English characters
  if (!isEnglishOnly(props.modelValue.gtinCode)) {
    showKeyboardAlert();
    return;
  }

  // Check if GTIN was cleared or significantly changed during editing
  const currentGtin = props.modelValue.gtinCode?.trim();
  if (
    props.modelValue.existingDrugId &&
    (!currentGtin || currentGtin.length < 8)
  ) {
    // GTIN was cleared or made too short during editing - reset editing state and clear fields
    if (!currentGtin) {
      // GTIN completely cleared - clear all fields except GTIN
      clearAllFieldsExceptGtin();
      ElMessage({
        type: "info",
        message: "GTIN cleared - exiting editing mode and clearing all fields",
        duration: 3000,
      });
    } else {
      // GTIN shortened but not cleared - just reset editing state
      const updatedData = {
        ...props.modelValue,
        existingDrugId: null,
        id: null,
      };
      emit("update:modelValue", updatedData);
    }
  }

  // Clear previous state
  drugFound.value = false;
  updateDetails();

  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Set new timeout for debounced search
  searchTimeout = setTimeout(() => {
    const gtinCode = props.modelValue.gtinCode?.trim();
    if (gtinCode && gtinCode.length >= 10) {
      // Only search if we have a reasonable length
      searchByGtin();
    }
  }, 800); // 800ms delay after user stops typing
};

const handleGtinPaste = () => {
  // Handle paste event - check for non-English characters first
  setTimeout(() => {
    if (!isEnglishOnly(props.modelValue.gtinCode)) {
      showKeyboardAlert();
      return;
    }

    const gtinCode = props.modelValue.gtinCode?.trim();
    if (gtinCode && gtinCode.length >= 10) {
      searchByGtin();
    }
  }, 100); // Short delay to ensure paste content is processed
};

// Function to check if text contains only English characters and numbers
const isEnglishOnly = (text) => {
  if (!text) return true;
  // Allow only English letters (a-z, A-Z), numbers (0-9), and common symbols
  const englishOnlyRegex =
    /^[a-zA-Z0-9\s\-_.,;:!@#$%^&*()+=\[\]{}|\\<>?/~`'"]*$/;
  return englishOnlyRegex.test(text);
};

// Function to show keyboard alert
const showKeyboardAlert = () => {
  ElMessage({
    type: "warning",
    message: "لطفا کیبورد را به حالت انگلیسی تغییر دهید",
    duration: 4000,
    showClose: true,
  });

  // Clear the input to prevent format issues
  const updatedData = { ...props.modelValue, gtinCode: "" };
  emit("update:modelValue", updatedData);
};

const searchByGtin = async () => {
  const gtinCode = props.modelValue.gtinCode?.trim();
  if (!gtinCode) return;

  isSearching.value = true;

  try {
    // First, check if this drug already exists in the pharmacy
    const existingDrug = await pharmacyDrugStore.getDrugByGtin(gtinCode);

    if (existingDrug) {
      // Check if we're currently editing a different drug
      if (
        props.modelValue.existingDrugId &&
        props.modelValue.existingDrugId !== existingDrug.id
      ) {
        ElMessage({
          type: "info",
          message: `GTIN changed - switching from editing mode to found drug: ${existingDrug.persian_name}`,
          duration: 4000,
        });
      }

      // Drug exists in pharmacy, populate with pharmacy data
      populateFormFieldsFromPharmacyDrug(existingDrug);
      drugFound.value = true;

      if (props.modelValue.existingDrugId !== existingDrug.id) {
        ElMessage.success(
          `Drug found in your pharmacy: ${existingDrug.persian_name}`
        );
      }
    } else {
      // Check if we were previously editing a drug
      if (props.modelValue.existingDrugId) {
        ElMessage({
          type: "warning",
          message:
            "GTIN changed - exiting editing mode. This will be treated as a new drug.",
          duration: 4000,
        });
      }

      // Drug doesn't exist in pharmacy, search TTAC database
      await ttacDrugsStore.ensureDataAvailable();
      const drugData = ttacDrugsStore.findByGtinWithExtraction(gtinCode);

      if (drugData) {
        // Populate form fields with TTAC data (this will clear existingDrugId)
        populateFormFieldsFromTtac(drugData);
        drugFound.value = true;
        ElMessage.info(`Drug found in TTAC database: ${drugData.name_persian}`);
      } else {
        // Clear editing state for unknown GTIN
        const wasEditing = props.modelValue.existingDrugId !== null;

        if (wasEditing) {
          // If we were editing and no drug found, clear all fields except GTIN
          clearAllFieldsExceptGtin();
        } else {
          // If we weren't editing, just clear the editing state
          const updatedData = {
            ...props.modelValue,
            existingDrugId: null,
            id: null,
          };
          emit("update:modelValue", updatedData);
        }

        drugFound.value = false;
        ElMessage.warning("Drug not found in TTAC database");
      }
    }
  } catch (error) {
    console.error("Error searching for drug:", error);
    drugFound.value = false;
    ElMessage.error("Error searching for drug");
  } finally {
    isSearching.value = false;
  }
};

const populateFormFieldsFromPharmacyDrug = (drugData) => {
  // Map pharmacy drug fields to form fields
  const updatedData = {
    ...props.modelValue,
    gtinCode: drugData.gtin_code || props.modelValue.gtinCode,
    ircCode: drugData.irc_code || "",
    genericCode: drugData.generic_code || "",
    genericName: drugData.generic_name || "",
    englishName: drugData.english_name || "",
    persianName: drugData.persian_name || "",
    englishCompanyName: drugData.english_company_name || "",
    persianCompanyName: drugData.persian_company_name || "",
    category: drugData.category || "drug", // Default to 'drug' if not set
    numPerBox: drugData.num_per_box || null,
    technicalEvaluation: drugData.technical_evaluation || false,
    keyword: drugData.keyword || "",
    pharmacistDescription: drugData.pharmacist_description || "",
    barcodes: drugData.barcodes || [],
    // Store the existing drug ID for updates
    existingDrugId: drugData.id,
  };

  // Always try to get the latest price from TTAC database
  updateLatestPriceFromTtac(drugData.gtin_code, updatedData);
};

const updateLatestPriceFromTtac = async (gtinCode, updatedData) => {
  try {
    // Ensure TTAC data is available
    await ttacDrugsStore.ensureDataAvailable();

    // Search for the drug in TTAC database
    const ttacDrug = ttacDrugsStore.findByGtinWithExtraction(gtinCode);

    if (ttacDrug && ttacDrug.selling_price) {
      // Use TTAC price as latest price
      updatedData.latestPrice = ttacDrug.selling_price;
    } else {
      // No TTAC price available
      updatedData.latestPrice = null;
    }
  } catch (error) {
    console.error("Error fetching latest price from TTAC:", error);
    // If there's an error, keep existing price or set to null
    updatedData.latestPrice = updatedData.latestPrice || null;
  }

  // Emit the updated data
  emit("update:modelValue", updatedData);
};

const populateFormFieldsFromTtac = (drugData) => {
  // When switching from editing mode to TTAC data, we need to clear non-TTAC fields
  const wasEditing = props.modelValue.existingDrugId !== null;

  // Map TTAC drug fields to form fields
  const updatedData = {
    ...props.modelValue,
    gtinCode: drugData.gtin_code || props.modelValue.gtinCode,
    ircCode: drugData.irc_code || "",
    genericCode: drugData.generic_code || "",
    genericName: drugData.generic_name || "",
    englishName: drugData.name_english || "",
    persianName: drugData.name_persian || "",
    englishCompanyName: drugData.company_name_english || "",
    persianCompanyName: drugData.company_name_persian || "",
    category: props.modelValue.category || "drug", // Keep existing category or default to 'drug'
    numPerBox: drugData.units_per_box || null,
    latestPrice: drugData.selling_price || null, // Always use TTAC price
    // Clear editing state since this is TTAC data (new drug for pharmacy)
    existingDrugId: null,
    id: null,
  };

  // If we were editing before, clear the non-TTAC fields
  if (wasEditing) {
    updatedData.technicalEvaluation = false;
    updatedData.keyword = "";
    updatedData.pharmacistDescription = "";
    updatedData.barcodes = [];
    updatedData.category = "drug"; // Reset to default when switching from editing
  } else {
    // Keep existing values for fields not in TTAC database if not switching from editing
    updatedData.technicalEvaluation =
      props.modelValue.technicalEvaluation || false;
    updatedData.keyword = props.modelValue.keyword || "";
    updatedData.pharmacistDescription =
      props.modelValue.pharmacistDescription || "";
    updatedData.barcodes = props.modelValue.barcodes || [];
  }

  emit("update:modelValue", updatedData);
};

const clearAllFieldsExceptGtin = () => {
  // Clear all fields except GTIN when no drug is found and switching from editing mode
  const updatedData = {
    gtinCode: props.modelValue.gtinCode, // Keep the GTIN that was searched
    ircCode: "", // Clear IRC code
    genericCode: "", // Clear Generic code
    genericName: "", // Clear Generic name
    englishName: "",
    persianName: "",
    englishCompanyName: "",
    persianCompanyName: "",
    category: "drug", // Default category
    numPerBox: 1,
    latestPrice: null,
    technicalEvaluation: false,
    keyword: "",
    pharmacistDescription: "",
    barcodes: [],
    existingDrugId: null,
    id: null,
  };

  emit("update:modelValue", updatedData);
};

const refreshLatestPrice = async () => {
  if (!props.modelValue.gtinCode) {
    ElMessage.warning("Please enter a GTIN code first");
    return;
  }

  isRefreshingPrice.value = true;
  try {
    const updatedData = { ...props.modelValue };
    await updateLatestPriceFromTtac(props.modelValue.gtinCode, updatedData);
    ElMessage.success("Latest price refreshed from TTAC database");
  } catch (error) {
    console.error("Error refreshing latest price:", error);
    ElMessage.error("Failed to refresh latest price from TTAC");
  } finally {
    isRefreshingPrice.value = false;
  }
};

// Pharmacy drug search functions
const searchPharmacyDrugs = async (query) => {
  if (!query) {
    pharmacySearchResults.value = []
    return
  }

  isSearchingPharmacy.value = true
  try {
    // Ensure pharmacy drugs are loaded
    if (pharmacyDrugStore.drugs.length === 0) {
      await pharmacyDrugStore.fetchDrugs()
    }
    
    // Search through pharmacy drugs locally (similar to DrugAdjustmentsView)
    const queryLower = query.toLowerCase()
    const results = pharmacyDrugStore.drugs.filter(drug => 
      (drug.english_name && drug.english_name.toLowerCase().includes(queryLower)) ||
      (drug.persian_name && drug.persian_name.toLowerCase().includes(queryLower)) ||
      (drug.gtin_code && drug.gtin_code.toLowerCase().includes(queryLower)) ||
      (drug.generic_code && drug.generic_code.toLowerCase().includes(queryLower)) ||
      (drug.generic_name && drug.generic_name.toLowerCase().includes(queryLower))
    )
    
    // Show all drugs (including those with 0 stock for editing purposes)
    pharmacySearchResults.value = results
  } catch (error) {
    console.error('Pharmacy search failed:', error)
    pharmacySearchResults.value = []
  } finally {
    isSearchingPharmacy.value = false
  }
}

const onPharmacyDrugSelect = async (drugId) => {
  if (!drugId) {
    selectedPharmacyDrug.value = null
    return
  }

  const drug = pharmacySearchResults.value.find(d => d.id === drugId)
  if (drug) {
    // Update the GTIN field with the selected drug's GTIN
    const updatedData = {
      ...props.modelValue,
      gtinCode: drug.gtin_code || ''
    }
    emit("update:modelValue", updatedData)
    
    // Trigger the existing GTIN search logic to populate all fields
    setTimeout(() => {
      searchByGtin()
    }, 100)
    
    ElMessage.success(`Selected drug: ${drug.english_name || drug.persian_name}`)
    
    // Clear the pharmacy search selection
    selectedPharmacyDrug.value = null
  }
}

const toggleSearchLanguage = () => {
  showPersianNamesInSearch.value = !showPersianNamesInSearch.value
  ElMessage.success(`Search language switched to ${showPersianNamesInSearch.value ? 'Persian' : 'English'}`)
}

// Cleanup timeout on component unmount
onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

// Watch for GTIN code changes to trigger auto-search
// This is useful when GTIN is set programmatically (e.g., from AddMedicineDialog)
watch(() => props.modelValue.gtinCode, (newGtin, oldGtin) => {
  // Only trigger search if GTIN actually changed and is not empty
  if (newGtin && newGtin !== oldGtin && newGtin.trim().length > 0) {
    // Check if this looks like a complete GTIN (14 digits)
    const isCompleteGtin = /^\d{14}$/.test(newGtin.trim())
    
    if (isCompleteGtin) {
      // For complete GTIN codes (like when set programmatically), trigger immediately
      console.log('Complete GTIN detected, triggering immediate search:', newGtin)
      searchByGtin()
    } else {
      // For partial GTIN codes (user typing), add a delay
      setTimeout(() => {
        searchByGtin()
      }, 300)
    }
  }
}, { immediate: false });

defineExpose({
  validate,
  searchByGtin,
});
</script>

<style scoped>
.add-medicine-form {
  margin-top: 20px;
}

.form-section-title {
  margin-top: 30px;
  margin-bottom: 20px;
  font-size: 1.1rem;
  color: var(--primary-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.keywords-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.keyword-input {
  width: 400px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.barcodes-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.barcode-input {
  width: 400px;
}

.barcodes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.barcode-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  font-family: "Courier New", monospace;
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

.latest-price {
  /* font-weight: bold; */
  color: #409eff;
  padding: 0px 1px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #d1e7ff;
  display: inline-block;
}

.price-display {
  display: flex;
  align-items: baseline;
}

.amount {
  margin-right: 4px;
}

.currency {
  font-weight: bold;
}

/* Persian input styling */
:deep(.persian-input input) {
  font-family: var(--font-persian);
  direction: rtl;
  text-align: right;
}

:deep(.input-mixed input),
:deep(.input-mixed textarea) {
  font-family: var(--font-mixed);
}

/* Persian placeholder styling */
:deep(.persian-input input::placeholder) {
  font-family: var(--font-persian);
  direction: rtl;
  text-align: right;
  color: #c0c4cc;
}

:deep(.input-mixed input::placeholder),
:deep(.input-mixed textarea::placeholder) {
  font-family: var(--font-mixed);
  color: #c0c4cc;
}

/* Keyword tags with Persian support */
.keyword-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.keyword-tag.persian-text {
  font-family: var(--font-persian);
}

/* Barcode tags */
.barcode-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  font-family: "Courier New", monospace;
}

/* Persian text styling */
.persian-text {
  font-family: var(--font-persian) !important;
  direction: rtl;
}

.latest-price-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.no-price {
  color: #f56c6c;
  font-family: var(--font-persian) !important;
  font-weight: bold;
}

.refresh-price-btn {
  /* margin-top: 5px; */
  font-weight: bold;
  padding: 0px 3px 0px 0px;
  font-size: 0.8rem;
  background-color: #16adb7 !important;
  border-color: #16adb7 !important;
  color: white !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-persian) !important;
}

/* Pharmacy drug search styling */
.pharmacy-search-field {
  margin-bottom: 15px;
}

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

.search-language-toggle {
  min-width: 35px;
  font-size: 12px;
  padding: 4px 8px;
  font-family: var(--font-persian);
  font-weight: bold;
  height: 32px;
  flex-shrink: 0;
}

.pharmacy-drug-search {
  border: 2px dashed #2e8ceb;
  border-radius: 6px;
  background-color: #f0f9ff;
  flex: 1;
}

.pharmacy-drug-search:hover {
  border-color: #66b1ff;
  background-color: #ecf5ff;
}

.pharmacy-drug-search:focus-within {
  border-color: #2e8ceb;
  box-shadow: 0 0 0 2px rgba(46, 140, 235, 0.2);
}
</style>
