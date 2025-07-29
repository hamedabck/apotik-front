import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/pharmacy'

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Factors API
export const factorsAPI = {
  // Get all factors for the pharmacy
  getFactors(params = {}) {
    return axios.get(`${API_BASE_URL}/factors/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific factor by ID
  getFactor(id) {
    return axios.get(`${API_BASE_URL}/factors/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new factor
  createFactor(data) {
    return axios.post(`${API_BASE_URL}/factors/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update a factor
  updateFactor(id, data) {
    return axios.put(`${API_BASE_URL}/factors/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update a factor
  patchFactor(id, data) {
    return axios.patch(`${API_BASE_URL}/factors/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete a factor (only draft)
  deleteFactor(id) {
    return axios.delete(`${API_BASE_URL}/factors/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Delete a factor with all its items in order
  deleteFactorWithItems(id) {
    return axios.delete(`${API_BASE_URL}/factors/${id}/delete_with_items/`, {
      headers: getAuthHeaders()
    })
  },

  // Finalize a factor
  finalizeFactor(id) {
    return axios.post(`${API_BASE_URL}/factors/${id}/finalize/`, {}, {
      headers: getAuthHeaders()
    })
  },

  // Get factors by status
  getFactorsByStatus(status = 'draft') {
    return axios.get(`${API_BASE_URL}/factors/by_status/`, { 
      params: { status },
      headers: getAuthHeaders()
    })
  },

  // Get next available factor number
  getNextFactorNumber() {
    return axios.get(`${API_BASE_URL}/factors/next_factor_number/`, {
      headers: getAuthHeaders()
    })
  }
}

// Factor Items API
export const factorItemsAPI = {
  // Get all factor items for the pharmacy
  getFactorItems(params = {}) {
    return axios.get(`${API_BASE_URL}/factor-items/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific factor item by ID
  getFactorItem(id) {
    return axios.get(`${API_BASE_URL}/factor-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new factor item
  createFactorItem(data) {
    return axios.post(`${API_BASE_URL}/factor-items/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update a factor item
  updateFactorItem(id, data) {
    return axios.put(`${API_BASE_URL}/factor-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update a factor item
  patchFactorItem(id, data) {
    return axios.patch(`${API_BASE_URL}/factor-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete a factor item
  deleteFactorItem(id) {
    return axios.delete(`${API_BASE_URL}/factor-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Get items by factor ID
  getItemsByFactor(factorId) {
    return axios.get(`${API_BASE_URL}/factor-items/by_factor/`, { 
      params: { factor_id: factorId },
      headers: getAuthHeaders()
    })
  },

  // Get items by drug GTIN
  getItemsByDrug(gtinCode) {
    return axios.get(`${API_BASE_URL}/factor-items/by_drug/`, { 
      params: { gtin_code: gtinCode },
      headers: getAuthHeaders()
    })
  }
}

// Helper functions for factors
export const factorHelpers = {
  // Calculate total price for an item
  calculateTotalPrice(quantity, unitPrice) {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)
  },

  // Calculate total quantity (boxes + prize boxes) * units per box
  calculateTotalQuantity(boxes, prizeBoxes, unitsPerBox) {
    const totalBoxes = (parseFloat(boxes) || 0) + (parseFloat(prizeBoxes) || 0)
    return totalBoxes * (parseFloat(unitsPerBox) || 0)
  },

  // Calculate final price with discount and tax
  calculateFinalPrice(basePrice, discount, tax) {
    const price = parseFloat(basePrice) || 0
    const discountAmount = (price * (parseFloat(discount) || 0)) / 100
    const priceAfterDiscount = price - discountAmount
    const taxAmount = (priceAfterDiscount * (parseFloat(tax) || 0)) / 100
    return priceAfterDiscount + taxAmount
  },

  // Format factor number for display
  formatFactorNumber(number) {
    return `#${String(number).padStart(4, '0')}`
  },

  // Get status display text
  getStatusDisplay(status) {
    const statusMap = {
      'draft': 'Draft',
      'finalized': 'Finalized',
      'cancelled': 'Cancelled'
    }
    return statusMap[status] || status
  },

  // Get status color for UI
  getStatusColor(status) {
    const colorMap = {
      'draft': 'warning',
      'finalized': 'success',
      'cancelled': 'danger'
    }
    return colorMap[status] || 'info'
  },

  // Validate factor item data
  validateFactorItem(item) {
    const errors = []

    if (!item.drug) {
      errors.push('Drug is required')
    }

    if (!item.storage) {
      errors.push('Storage is required')
    }

    if (!item.boxes || item.boxes <= 0) {
      errors.push('Number of boxes must be greater than 0')
    }

    if (!item.units_per_box || item.units_per_box <= 0) {
      errors.push('Units per box must be greater than 0')
    }

    if (!item.buy_price || item.buy_price < 0) {
      errors.push('Buy price must be 0 or greater')
    }

    if (!item.sell_price || item.sell_price < 0) {
      errors.push('Sell price must be 0 or greater')
    }

    if (!item.expiry_date) {
      errors.push('Expiry date is required')
    }

    if (!item.batch_number) {
      errors.push('Batch number is required')
    }

    return errors
  },

  // Create factor item payload
  createFactorItemPayload(formData) {
    return {
      factor: formData.factorId,
      drug: formData.drugId,
      storage: formData.storageId,
      boxes: parseInt(formData.boxes),
      prize_boxes: parseInt(formData.prizeBoxes) || 0,
      units_per_box: parseInt(formData.unitsPerBox),
      buy_price_per_box: parseFloat(formData.buyPrice),
      sell_price_per_box: parseFloat(formData.sellPrice),
      discount: parseFloat(formData.discount) || 0,
      tax: parseFloat(formData.tax) || 0,
      expiry_date: formData.expiryDate,
      batch_number: formData.batchNumber
    }
  }
}

export default {
  factorsAPI,
  factorItemsAPI,
  factorHelpers
} 