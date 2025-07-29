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

// Drug Adjustments API
export const drugAdjustmentsAPI = {
  // Get all adjustments for the pharmacy
  getAdjustments(params = {}) {
    return axios.get(`${API_BASE_URL}/drug-adjustments/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific adjustment by ID
  getAdjustment(id) {
    return axios.get(`${API_BASE_URL}/drug-adjustments/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new adjustment
  createAdjustment(data) {
    return axios.post(`${API_BASE_URL}/drug-adjustments/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update an adjustment
  updateAdjustment(id, data) {
    return axios.put(`${API_BASE_URL}/drug-adjustments/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update an adjustment
  patchAdjustment(id, data) {
    return axios.patch(`${API_BASE_URL}/drug-adjustments/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete an adjustment (only draft)
  deleteAdjustment(id) {
    return axios.delete(`${API_BASE_URL}/drug-adjustments/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Delete an adjustment with all its items in order
  deleteAdjustmentWithItems(id) {
    return axios.delete(`${API_BASE_URL}/drug-adjustments/${id}/delete_with_items/`, {
      headers: getAuthHeaders()
    })
  },

  // Finalize an adjustment
  finalizeAdjustment(id) {
    return axios.post(`${API_BASE_URL}/drug-adjustments/${id}/finalize/`, {}, {
      headers: getAuthHeaders()
    })
  },

  // Get adjustments by status
  getAdjustmentsByStatus(status = 'draft') {
    return axios.get(`${API_BASE_URL}/drug-adjustments/by_status/`, { 
      params: { status },
      headers: getAuthHeaders()
    })
  },

  // Get next available adjustment number
  getNextAdjustmentNumber() {
    return axios.get(`${API_BASE_URL}/drug-adjustments/next_adjustment_number/`, {
      headers: getAuthHeaders()
    })
  }
}

// Drug Adjustment Items API
export const drugAdjustmentItemsAPI = {
  // Get all adjustment items for the pharmacy
  getAdjustmentItems(params = {}) {
    return axios.get(`${API_BASE_URL}/drug-adjustment-items/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific adjustment item by ID
  getAdjustmentItem(id) {
    return axios.get(`${API_BASE_URL}/drug-adjustment-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new adjustment item
  createAdjustmentItem(data) {
    return axios.post(`${API_BASE_URL}/drug-adjustment-items/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update an adjustment item
  updateAdjustmentItem(id, data) {
    return axios.put(`${API_BASE_URL}/drug-adjustment-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update an adjustment item
  patchAdjustmentItem(id, data) {
    return axios.patch(`${API_BASE_URL}/drug-adjustment-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete an adjustment item
  deleteAdjustmentItem(id) {
    return axios.delete(`${API_BASE_URL}/drug-adjustment-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Get items by adjustment ID
  getItemsByAdjustment(adjustmentId) {
    return axios.get(`${API_BASE_URL}/drug-adjustment-items/by_adjustment/`, { 
      params: { adjustment_id: adjustmentId },
      headers: getAuthHeaders()
    })
  },

  // Get items by drug GTIN
  getItemsByDrug(gtinCode) {
    return axios.get(`${API_BASE_URL}/drug-adjustment-items/by_drug/`, { 
      params: { gtin_code: gtinCode },
      headers: getAuthHeaders()
    })
  },

  // Reverse an adjustment item
  reverseAdjustmentItem(id) {
    return axios.post(`${API_BASE_URL}/drug-adjustment-items/${id}/reverse/`, {}, {
      headers: getAuthHeaders()
    })
  }
}

// Batch Locations API
export const batchLocationsAPI = {
  // Get batch locations for a specific batch
  getBatchLocations(batchId) {
    return axios.get(`${API_BASE_URL}/batch-locations/`, { 
      params: { batch: batchId },
      headers: getAuthHeaders()
    })
  },

  // Get all batch locations
  getAllBatchLocations(params = {}) {
    return axios.get(`${API_BASE_URL}/batch-locations/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Create a new batch location
  createBatchLocation(data) {
    return axios.post(`${API_BASE_URL}/batch-locations/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update a batch location
  updateBatchLocation(id, data) {
    return axios.put(`${API_BASE_URL}/batch-locations/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete a batch location
  deleteBatchLocation(id) {
    return axios.delete(`${API_BASE_URL}/batch-locations/${id}/`, {
      headers: getAuthHeaders()
    })
  }
}

// Helper functions for drug adjustments
export const drugAdjustmentHelpers = {
  // Calculate total price for an item
  calculateTotalPrice(quantity, unitPrice) {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)
  },

  // Format adjustment number for display
  formatAdjustmentNumber(number) {
    return `#${String(number).padStart(4, '0')}`
  },

  // Get action display text
  getActionDisplay(action) {
    const actionMap = {
      'add_stock': 'Add Stock',
      'delete_expired': 'Delete Expired',
      'delete_damage': 'Delete Damaged',
      'change_location': 'Change Location'
    }
    return actionMap[action] || action
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

  // Validate adjustment item data
  validateAdjustmentItem(item) {
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

    if (!item.action) {
      errors.push('Action is required')
    }

    if (item.action === 'change_location' && !item.target_location) {
      errors.push('Target location is required for change location action')
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (!item.unit_price || item.unit_price < 0) {
      errors.push('Unit price must be 0 or greater')
    }

    return errors
  },

  // Create adjustment item payload
  createAdjustmentItemPayload(formData) {
    return {
      adjustment: formData.adjustmentId,
      drug: formData.drugId,
      batch: formData.batchId,
      source_location: formData.sourceLocationId,
      target_location: formData.targetLocationId || null,
      action: formData.action,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unitPrice),
      reason: formData.reason || ''
    }
  }
}

export default {
  drugAdjustmentsAPI,
  drugAdjustmentItemsAPI,
  drugAdjustmentHelpers
} 