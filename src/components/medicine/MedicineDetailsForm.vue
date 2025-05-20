<template>
  <el-form 
    :model="modelValue" 
    :rules="detailsRules" 
    label-width="180px" 
    ref="detailsFormRef"
    class="add-medicine-form">
    
    <h3 class="form-section-title">Basic Information</h3>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="GTIN code" prop="gtinCode">
          <el-input v-model="modelValue.gtinCode" @input="updateDetails" />
        </el-form-item>
      </el-col>
      
      <el-col :span="12">
        <el-form-item label="IRC code" prop="ircCode">
          <el-input v-model="modelValue.ircCode" @input="updateDetails" />
        </el-form-item>
      </el-col>
    </el-row>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="Generic code" prop="genericCode" required>
          <el-input v-model="modelValue.genericCode" @input="updateDetails" />
        </el-form-item>
      </el-col>
      
      <el-col :span="12">
        <el-form-item label="Units per Box" prop="numPerBox">
          <el-input-number v-model="modelValue.numPerBox" :min="1" @change="updateDetails" />
        </el-form-item>
      </el-col>
    </el-row>
    
    <h3 class="form-section-title">Name Information</h3>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="English Brand Name" prop="englishName" required>
          <el-input v-model="modelValue.englishName" @input="updateDetails" />
        </el-form-item>
      </el-col>
      
      <el-col :span="12">
        <el-form-item label="Persian Brand Name" prop="persianName">
          <el-input v-model="modelValue.persianName" @input="updateDetails" />
        </el-form-item>
      </el-col>
    </el-row>
    
    <el-form-item label="Generic Name" prop="genericName" required>
      <el-input v-model="modelValue.genericName" @input="updateDetails" />
    </el-form-item>
    
    <h3 class="form-section-title">Manufacturer Information</h3>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="English Company Name" prop="englishCompanyName" required>
          <el-input v-model="modelValue.englishCompanyName" @input="updateDetails" />
        </el-form-item>
      </el-col>
      
      <el-col :span="12">
        <el-form-item label="Persian Company Name" prop="persianCompanyName">
          <el-input v-model="modelValue.persianCompanyName" @input="updateDetails" />
        </el-form-item>
      </el-col>
    </el-row>
    
    <h3 class="form-section-title">Additional Information</h3>
    
    <el-form-item label="Keywords" prop="keyword">
      <el-input v-model="modelValue.keyword" @input="updateDetails" placeholder="Separate keywords with commas" />
    </el-form-item>
    
    <el-form-item label="Technical Evaluation" prop="technicalEvaluation">
      <el-switch v-model="modelValue.technicalEvaluation" @change="updateDetails" />
    </el-form-item>
    
    <el-form-item label="Pharmacist Description" prop="pharmacistDescription">
      <el-input 
        v-model="modelValue.pharmacistDescription"
        @input="updateDetails"
        type="textarea"
        rows="4" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'validate'])

const detailsFormRef = ref(null)

const detailsRules = {
  genericCode: [
    { required: true, message: 'Generic code is required', trigger: 'blur' }
  ],
  englishName: [
    { required: true, message: 'English name is required', trigger: 'blur' }
  ],
  genericName: [
    { required: true, message: 'Generic name is required', trigger: 'blur' }
  ],
  englishCompanyName: [
    { required: true, message: 'Company name is required', trigger: 'blur' }
  ]
}

const updateDetails = () => {
  emit('update:modelValue', props.modelValue)
}

const validate = async () => {
  if (!detailsFormRef.value) return false
  return await detailsFormRef.value.validate()
}

defineExpose({
  validate
})
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
</style> 