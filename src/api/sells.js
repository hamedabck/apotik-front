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

// Sells API
export const sellsAPI = {
  // Get all sells for the pharmacy
  getSells(params = {}) {
    return axios.get(`${API_BASE_URL}/sells/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific sell by ID
  getSell(id) {
    return axios.get(`${API_BASE_URL}/sells/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new sell
  createSell(data) {
    return axios.post(`${API_BASE_URL}/sells/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update a sell
  updateSell(id, data) {
    return axios.put(`${API_BASE_URL}/sells/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update a sell
  patchSell(id, data) {
    return axios.patch(`${API_BASE_URL}/sells/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete a sell completely (with all items)
  deleteSellWithItems(id) {
    return axios.delete(`${API_BASE_URL}/sells/${id}/delete_with_items/`, {
      headers: getAuthHeaders()
    })
  },

  // Delete a sell (only draft)
  deleteSell(id) {
    return axios.delete(`${API_BASE_URL}/sells/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Finalize a sell
  finalizeSell(id) {
    return axios.post(`${API_BASE_URL}/sells/${id}/finalize/`, {}, {
      headers: getAuthHeaders()
    })
  },

  // Get sells by status
  getSellsByStatus(status = 'draft') {
    return axios.get(`${API_BASE_URL}/sells/by_status/`, { 
      params: { status },
      headers: getAuthHeaders()
    })
  },

  // Get next available sell number
  getNextSellNumber() {
    return axios.get(`${API_BASE_URL}/sells/next_sell_number/`, {
      headers: getAuthHeaders()
    })
  },

  // Get sell by sell number
  getSellByNumber(sellNumber) {
    return axios.get(`${API_BASE_URL}/sells/by_sell_number/`, {
      params: { sell_number: sellNumber },
      headers: getAuthHeaders()
    })
  }
}

// Sell Items API
export const sellItemsAPI = {
  // Get all sell items for the pharmacy
  getSellItems(params = {}) {
    return axios.get(`${API_BASE_URL}/sell-items/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific sell item by ID
  getSellItem(id) {
    return axios.get(`${API_BASE_URL}/sell-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new sell item
  createSellItem(data) {
    return axios.post(`${API_BASE_URL}/sell-items/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update a sell item
  updateSellItem(id, data) {
    return axios.put(`${API_BASE_URL}/sell-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update a sell item
  patchSellItem(id, data) {
    return axios.patch(`${API_BASE_URL}/sell-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete a sell item
  deleteSellItem(id) {
    return axios.delete(`${API_BASE_URL}/sell-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Get items by sell ID
  getItemsBySell(sellId) {
    return axios.get(`${API_BASE_URL}/sell-items/by_sell/`, {
      params: { sell_id: sellId },
      headers: getAuthHeaders()
    })
  }
}

// Sell helpers
export const sellHelpers = {
  // Get status display text
  getStatusDisplay(status) {
    const statusMap = {
      'draft': 'Draft',
      'finalized': 'Finalized',
      'cancelled': 'Cancelled'
    }
    return statusMap[status] || status
  },

  // Get status color
  getStatusColor(status) {
    const colorMap = {
      'draft': 'info',
      'finalized': 'success',
      'cancelled': 'danger'
    }
    return colorMap[status] || 'info'
  },

  // Format sell number
  formatSellNumber(number) {
    return `Sell #${number}`
  },

  // Calculate total price for a sell item
  calculateTotalPrice(quantity, unitPrice, taxRate = 0, discountRate = 0) {
    const subtotal = quantity * unitPrice
    const taxAmount = (subtotal * taxRate) / 100
    const discountAmount = (subtotal * discountRate) / 100
    return subtotal + taxAmount - discountAmount
  },

  // Validate sell item data
  validateSellItem(item) {
    const errors = []

    if (!item.drug) {
      errors.push('Drug is required')
    }

    if (!item.batch) {
      errors.push('Batch is required')
    }

    if (!item.source_location) {
      errors.push('Source location is required')
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (!item.unit_price || item.unit_price <= 0) {
      errors.push('Unit price must be greater than 0')
    }

    if (item.tax_rate && (item.tax_rate < 0 || item.tax_rate > 100)) {
      errors.push('Tax rate must be between 0 and 100')
    }

    if (item.discount_rate && (item.discount_rate < 0 || item.discount_rate > 100)) {
      errors.push('Discount rate must be between 0 and 100')
    }

    return errors
  },

  // Create sell item payload from form data
  createSellItemPayload(formData) {
    return {
      sell: formData.sell,
      drug: formData.drug,
      batch: formData.batch,
      source_location: formData.source_location,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      tax_rate: parseFloat(formData.tax_rate || 0),
      discount_rate: parseFloat(formData.discount_rate || 0),
      notes: formData.notes || ''
    }
  }
} 