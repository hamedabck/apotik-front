// Date formatting utilities for consistent date display throughout the application
import moment from 'moment-jalaali'

// Configure moment-jalaali to use Persian calendar
moment.loadPersian({ usePersianDigits: false, dialect: 'persian-modern' })

/**
 * Format date to YYYY/MM/DD format
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string in YYYY/MM/DD format
 */
export const formatDate = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return ''
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  
  return `${year}/${month}/${day}`
}

/**
 * Format date to YYYY-MM-DD format (for API/database usage)
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
export const formatDateISO = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return ''
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Format date with time to YYYY/MM/DD HH:MM format
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string with time
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  
  const dateObj = new Date(date)
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return ''
  
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayISO = () => {
  return formatDateISO(new Date())
}

/**
 * Get today's date in YYYY/MM/DD format
 * @returns {string} Today's date in YYYY/MM/DD format
 */
export const getToday = () => {
  return formatDate(new Date())
}

/**
 * Get date N days ago in YYYY-MM-DD format
 * @param {number} days - Number of days ago
 * @returns {string} Date N days ago in YYYY-MM-DD format
 */
export const getDaysAgoISO = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDateISO(date)
}

/**
 * Get date N days ago in YYYY/MM/DD format
 * @param {number} days - Number of days ago
 * @returns {string} Date N days ago in YYYY/MM/DD format
 */
export const getDaysAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDate(date)
}

// ===== JALALI (PERSIAN) CALENDAR UTILITIES =====

/**
 * Format Gregorian date to Persian Jalali format (YYYY/MM/DD)
 * @param {string|Date} date - Gregorian date string or Date object
 * @returns {string} Formatted Persian date string in YYYY/MM/DD format
 */
export const formatDateJalali = (date) => {
  if (!date) return ''
  
  try {
    const momentDate = moment(date)
    if (!momentDate.isValid()) return ''
    
    return momentDate.format('jYYYY/jMM/jDD')
  } catch (error) {
    console.error('Error formatting Jalali date:', error)
    return ''
  }
}

/**
 * Format Gregorian date to Persian Jalali format with month name (DD MMMM YYYY)
 * @param {string|Date} date - Gregorian date string or Date object
 * @returns {string} Formatted Persian date string with month name
 */
export const formatDateJalaliLong = (date) => {
  if (!date) return ''
  
  try {
    const momentDate = moment(date)
    if (!momentDate.isValid()) return ''
    
    return momentDate.format('jDD jMMMM jYYYY')
  } catch (error) {
    console.error('Error formatting long Jalali date:', error)
    return ''
  }
}

/**
 * Convert Jalali date string (YYYY/MM/DD) to Gregorian Date object
 * @param {string} jalaliDateString - Jalali date string in YYYY/MM/DD format
 * @returns {Date|null} Gregorian Date object or null if invalid
 */
export const jalaliToGregorian = (jalaliDateString) => {
  if (!jalaliDateString) return null
  
  try {
    // Parse Jalali date string
    const parts = jalaliDateString.split('/')
    if (parts.length !== 3) return null
    
    const jYear = parseInt(parts[0])
    const jMonth = parseInt(parts[1])
    const jDay = parseInt(parts[2])
    
    // Validate Jalali date parts
    if (isNaN(jYear) || isNaN(jMonth) || isNaN(jDay)) return null
    if (jMonth < 1 || jMonth > 12) return null
    if (jDay < 1 || jDay > 31) return null
    
    // Create moment with Jalali date
    const momentDate = moment(`${jYear}/${jMonth}/${jDay}`, 'jYYYY/jMM/jDD')
    
    if (!momentDate.isValid()) return null
    
    return momentDate.toDate()
  } catch (error) {
    console.error('Error converting Jalali to Gregorian:', error)
    return null
  }
}

/**
 * Convert Gregorian Date object to Jalali date string (YYYY/MM/DD)
 * @param {Date|string} gregorianDate - Gregorian Date object or date string
 * @returns {string} Jalali date string in YYYY/MM/DD format
 */
export const gregorianToJalali = (gregorianDate) => {
  if (!gregorianDate) return ''
  
  try {
    const momentDate = moment(gregorianDate)
    if (!momentDate.isValid()) return ''
    
    return momentDate.format('jYYYY/jMM/jDD')
  } catch (error) {
    console.error('Error converting Gregorian to Jalali:', error)
    return ''
  }
}

/**
 * Get today's date in Jalali format (YYYY/MM/DD)
 * @returns {string} Today's date in Jalali YYYY/MM/DD format
 */
export const getTodayJalali = () => {
  return moment().format('jYYYY/jMM/jDD')
}

/**
 * Validate Jalali date string format and values
 * @param {string} jalaliDateString - Jalali date string to validate
 * @returns {object} Validation result with isValid boolean and error message
 */
export const validateJalaliDate = (jalaliDateString) => {
  if (!jalaliDateString || !jalaliDateString.trim()) {
    return { isValid: false, error: 'Date is required' }
  }
  
  const trimmed = jalaliDateString.trim()
  
  // Check if input is too short
  if (trimmed.length < 10) {
    return { isValid: false, error: 'Please enter complete date (YYYY/MM/DD)' }
  }
  
  // Check format (YYYY/MM/DD)
  const dateRegex = /^\d{4}\/\d{1,2}\/\d{1,2}$/
  if (!dateRegex.test(trimmed)) {
    return { isValid: false, error: 'Date format should be YYYY/MM/DD' }
  }
  
  const parts = trimmed.split('/')
  const jYear = parseInt(parts[0])
  const jMonth = parseInt(parts[1])
  const jDay = parseInt(parts[2])
  
  // Validate year range (reasonable range for birthdates)
  if (jYear < 1300 || jYear > 1450) {
    return { isValid: false, error: 'Year should be between 1300-1450 (Persian calendar)' }
  }
  
  // Validate month
  if (jMonth < 1 || jMonth > 12) {
    return { isValid: false, error: 'Month should be between 1-12' }
  }
  
  // Validate day based on month
  if (jDay < 1) {
    return { isValid: false, error: 'Day should be at least 1' }
  }
  
  // Check maximum days per month in Jalali calendar
  if (jMonth <= 6 && jDay > 31) {
    return { isValid: false, error: `Month ${jMonth} can have maximum 31 days` }
  }
  
  if (jMonth > 6 && jMonth <= 11 && jDay > 30) {
    return { isValid: false, error: `Month ${jMonth} can have maximum 30 days` }
  }
  
  if (jMonth === 12) {
    // Check if it's a leap year for month 12
    const isLeapYear = moment.jIsLeapYear(jYear)
    if (!isLeapYear && jDay > 29) {
      return { isValid: false, error: `Month 12 in year ${jYear} can have maximum 29 days (non-leap year)` }
    }
    if (isLeapYear && jDay > 30) {
      return { isValid: false, error: `Month 12 in year ${jYear} can have maximum 30 days (leap year)` }
    }
  }
  
  // Try to create a valid moment date
  try {
    const momentDate = moment(`${jYear}/${jMonth}/${jDay}`, 'jYYYY/jMM/jDD')
    if (!momentDate.isValid()) {
      return { isValid: false, error: 'Invalid date - please check your input' }
    }
  } catch (error) {
    return { isValid: false, error: 'Invalid date format' }
  }
  
  return { isValid: true, error: null }
}

/**
 * Format Jalali date input as user types (auto-formatting with slashes)
 * @param {string} input - User input string
 * @returns {string} Formatted Jalali date string
 */
export const formatJalaliDateInput = (input) => {
  if (!input) return ''
  
  // Remove all non-digit characters except existing slashes for cursor position handling
  const digitsOnly = input.replace(/[^\d]/g, '')
  
  // Limit to 8 digits (YYYYMMDD)
  const limited = digitsOnly.slice(0, 8)
  
  // Add slashes as user types with smart formatting
  let formatted = ''
  
  if (limited.length <= 4) {
    // Just the year part
    formatted = limited
  } else if (limited.length <= 6) {
    // Year and month: YYYY/MM
    formatted = `${limited.slice(0, 4)}/${limited.slice(4)}`
  } else {
    // Full date: YYYY/MM/DD
    formatted = `${limited.slice(0, 4)}/${limited.slice(4, 6)}/${limited.slice(6)}`
  }
  
  return formatted
}

/**
 * Get Jalali month names
 * @returns {Array} Array of Jalali month names
 */
export const getJalaliMonthNames = () => {
  return [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]
} 