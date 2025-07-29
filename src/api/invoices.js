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

// Invoices API
export const invoicesAPI = {
  // Get all invoices for the pharmacy
  getInvoices(params = {}) {
    return axios.get(`${API_BASE_URL}/invoices/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific invoice by ID
  getInvoice(id) {
    return axios.get(`${API_BASE_URL}/invoices/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new invoice
  createInvoice(data) {
    return axios.post(`${API_BASE_URL}/invoices/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update an invoice
  updateInvoice(id, data) {
    return axios.put(`${API_BASE_URL}/invoices/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update an invoice
  patchInvoice(id, data) {
    return axios.patch(`${API_BASE_URL}/invoices/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete an invoice (only draft)
  deleteInvoice(id) {
    return axios.delete(`${API_BASE_URL}/invoices/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Delete an invoice with all its items in order
  deleteInvoiceWithItems(id) {
    return axios.delete(`${API_BASE_URL}/invoices/${id}/delete_with_items/`, {
      headers: getAuthHeaders()
    })
  },

  // Finalize an invoice
  finalizeInvoice(id) {
    return axios.post(`${API_BASE_URL}/invoices/${id}/finalize/`, {}, {
      headers: getAuthHeaders()
    })
  },

  // Get invoices by status
  getInvoicesByStatus(status = 'draft') {
    return axios.get(`${API_BASE_URL}/invoices/by_status/`, { 
      params: { status },
      headers: getAuthHeaders()
    })
  },

  // Get next available invoice number
  getNextInvoiceNumber() {
    return axios.get(`${API_BASE_URL}/invoices/next_invoice_number/`, {
      headers: getAuthHeaders()
    })
  }
}

// Invoice Items API
export const invoiceItemsAPI = {
  // Get all invoice items for the pharmacy
  getInvoiceItems(params = {}) {
    return axios.get(`${API_BASE_URL}/invoice-items/`, { 
      params,
      headers: getAuthHeaders()
    })
  },

  // Get a specific invoice item by ID
  getInvoiceItem(id) {
    return axios.get(`${API_BASE_URL}/invoice-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Create a new invoice item
  createInvoiceItem(data) {
    return axios.post(`${API_BASE_URL}/invoice-items/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Update an invoice item
  updateInvoiceItem(id, data) {
    return axios.put(`${API_BASE_URL}/invoice-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Partially update an invoice item
  patchInvoiceItem(id, data) {
    return axios.patch(`${API_BASE_URL}/invoice-items/${id}/`, data, {
      headers: getAuthHeaders()
    })
  },

  // Delete an invoice item
  deleteInvoiceItem(id) {
    return axios.delete(`${API_BASE_URL}/invoice-items/${id}/`, {
      headers: getAuthHeaders()
    })
  },

  // Get items by invoice ID
  getItemsByInvoice(invoiceId) {
    return axios.get(`${API_BASE_URL}/invoice-items/by_invoice/`, { 
      params: { invoice_id: invoiceId },
      headers: getAuthHeaders()
    })
  },

  // Get items by drug GTIN
  getItemsByDrug(gtinCode) {
    return axios.get(`${API_BASE_URL}/invoice-items/by_drug/`, { 
      params: { gtin_code: gtinCode },
      headers: getAuthHeaders()
    })
  },

  // Reverse an invoice item (for editing/deleting)
  reverseInvoiceItem(id) {
    return axios.post(`${API_BASE_URL}/invoice-items/${id}/reverse/`, {}, {
      headers: getAuthHeaders()
    })
  }
}

// Helper functions for invoices
export const invoiceHelpers = {
  // Calculate total price for an item
  calculateTotalPrice(quantity, unitPrice) {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)
  },

  // Calculate final price with discount and tax
  calculateFinalPrice(basePrice, discount, tax) {
    const price = parseFloat(basePrice) || 0
    const discountAmount = (price * (parseFloat(discount) || 0)) / 100
    const priceAfterDiscount = price - discountAmount
    const taxAmount = (priceAfterDiscount * (parseFloat(tax) || 0)) / 100
    return priceAfterDiscount + taxAmount
  },

  // Format invoice number for display
  formatInvoiceNumber(number) {
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

  // Validate invoice item data
  validateInvoiceItem(item) {
    const errors = []

    if (!item.drug) {
      errors.push('Drug is required')
    }

    if (!item.batch) {
      errors.push('Batch is required')
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push('Quantity must be greater than 0')
    }

    if (!item.unit_price || item.unit_price < 0) {
      errors.push('Unit price must be 0 or greater')
    }

    return errors
  },

  // Create invoice item payload
  createInvoiceItemPayload(formData) {
    return {
      invoice: formData.invoiceId,
      drug: formData.drugId,
      batch: formData.batchId,
      source_location: formData.sourceLocationId,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unitPrice),
      discount: parseFloat(formData.discount) || 0,
      tax: parseFloat(formData.tax) || 0,
      reason: formData.reason || ''
    }
  }
}

export default {
  invoicesAPI,
  invoiceItemsAPI,
  invoiceHelpers
} 