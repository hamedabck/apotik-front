<template>
  <el-form :model="form" label-width="120px" ref="formRef">
    <el-form-item label="Name" prop="name" :rules="[{ required: true, message: 'Name is required', trigger: 'blur' }]">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="Company" prop="companyName">
      <el-input v-model="form.companyName" />
    </el-form-item>
    <el-form-item label="Generic Code" prop="genericCode">
      <el-input v-model="form.genericCode" />
    </el-form-item>
    <el-form-item label="Selling Price" prop="sellingPrice">
      <el-input-number v-model="form.sellingPrice" :min="0" :step="0.01" />
    </el-form-item>
    <el-form-item label="Quantity" prop="quantity">
      <el-input-number v-model="form.quantity" :min="0" />
    </el-form-item>
    <el-form-item label="Expiry Date" prop="expiryDate">
      <el-date-picker v-model="form.expiryDate" type="date" style="width: 100%;" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="save" :loading="saving">Save</el-button>
      <el-button @click="$emit('cancel')">Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useMedicinesStore } from '@/store/medicines'
import { ElMessage } from 'element-plus'

const props = defineProps({
  medicineId: Number
})
const emit = defineEmits(['saved', 'cancel'])

const medicinesStore = useMedicinesStore()
const form = ref({
  name: '',
  companyName: '',
  genericCode: '',
  sellingPrice: 0,
  quantity: 0,
  expiryDate: ''
})
const formRef = ref(null)
const saving = ref(false)

const loadMedicine = () => {
  const med = medicinesStore.getMedicineById(props.medicineId)
  if (med) {
    form.value = {
      name: med.name,
      companyName: med.companyName,
      genericCode: med.genericCode,
      sellingPrice: med.sellingPrice,
      quantity: med.quantity,
      expiryDate: med.expiryDate
    }
  }
}

onMounted(loadMedicine)
watch(() => props.medicineId, loadMedicine)

const save = async () => {
  await formRef.value.validate()
  saving.value = true
  try {
    await medicinesStore.updateMedicine(props.medicineId, { ...form.value })
    ElMessage.success('Medicine updated successfully')
    emit('saved')
  } catch (err) {
    ElMessage.error('Failed to update medicine')
  } finally {
    saving.value = false
  }
}
</script>