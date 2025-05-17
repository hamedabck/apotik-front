<template>
  <div>
    <el-table :data="insurances" border style="width: 100%">
      <el-table-column prop="type" label="Insurance Type" width="180">
        <template #default="scope">
          <el-select v-model="scope.row.type" placeholder="Type" size="small" style="width: 150px">
            <el-option label="Basic Insurance" value="Basic Insurance" />
            <el-option label="Supplementary Insurance" value="Supplementary Insurance" />
            <el-option label="Special Coverage" value="Special Coverage" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="speciality" label="Speciality" width="120">
        <template #default="scope">
          <el-select v-model="scope.row.speciality" placeholder="Speciality" size="small" style="width: 100px">
            <el-option label="General" value="General" />
            <el-option label="Cardiac" value="Cardiac" />
            <el-option label="Neurological" value="Neurological" />
            <el-option label="Pediatric" value="Pediatric" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="Price" width="100">
        <template #default="scope">
          <el-input-number v-model="scope.row.price" :min="0" :step="0.01" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="percentage" label="%" width="80">
        <template #default="scope">
          <el-input-number v-model="scope.row.percentage" :min="0" :max="100" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="share" label="Share" width="100">
        <template #default="scope">
          <el-input-number v-model="scope.row.share" :min="0" :step="0.01" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="arz" label="ARZ" width="80">
        <template #default="scope">
          <el-input-number v-model="scope.row.arz" :min="0" :step="0.01" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="total" label="Total" width="100">
        <template #default="scope">
          <el-input-number v-model="scope.row.total" :min="0" :step="0.01" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="numMax" label="Max Num" width="80">
        <template #default="scope">
          <el-input-number v-model="scope.row.numMax" :min="0" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="ageMax" label="Max Age" width="80">
        <template #default="scope">
          <el-input-number v-model="scope.row.ageMax" :min="0" :max="120" size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="barcodeRequired" label="Barcode" width="90">
        <template #default="scope">
          <el-switch v-model="scope.row.barcodeRequired" />
        </template>
      </el-table-column>
      <el-table-column prop="hospitalRequired" label="Hospital" width="90">
        <template #default="scope">
          <el-switch v-model="scope.row.hospitalRequired" />
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="80">
        <template #default="scope">
          <el-button icon="el-icon-delete" type="danger" size="small" @click="removeInsurance(scope.$index)" />
        </template>
      </el-table-column>
    </el-table>
    <el-button type="primary" @click="addInsurance" style="margin-top: 10px;">+ Add Insurance</el-button>
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: Array })
const emit = defineEmits(['update:modelValue'])
const insurances = props.modelValue

const addInsurance = () => {
  insurances.push({
    type: 'Basic Insurance',
    speciality: 'General',
    price: 0,
    percentage: 0,
    share: 0,
    arz: 0,
    total: 0,
    numMax: 0,
    ageMax: 0,
    barcodeRequired: false,
    hospitalRequired: false
  })
  emit('update:modelValue', insurances)
}
const removeInsurance = (idx) => {
  insurances.splice(idx, 1)
  emit('update:modelValue', insurances)
}
</script> 