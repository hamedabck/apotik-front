import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useInsuranceStore = defineStore('insurance', () => {
  const insurances = ref([
    {
      id: 1,
      name: 'BPJS Health',
      description: 'National health insurance',
      coveragePercentage: 80
    },
    {
      id: 2,
      name: 'Prudential Health',
      description: 'Private health insurance',
      coveragePercentage: 90
    },
    {
      id: 3,
      name: 'Allianz Care',
      description: 'Corporate health insurance',
      coveragePercentage: 85
    }
  ])

  const addInsurance = (insurance) => {
    insurances.value.push(insurance)
  }

  const updateInsurance = (id, updatedInsurance) => {
    const index = insurances.value.findIndex(ins => ins.id === id)
    if (index !== -1) {
      insurances.value[index] = { ...insurances.value[index], ...updatedInsurance }
    }
  }

  const deleteInsurance = (id) => {
    insurances.value = insurances.value.filter(ins => ins.id !== id)
  }

  return {
    insurances,
    addInsurance,
    updateInsurance,
    deleteInsurance
  }
})
