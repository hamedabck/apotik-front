// Persian text detection and styling directive

// Function to detect if text contains Persian characters
const containsPersian = (text) => {
  if (!text) return false
  // Persian Unicode range: \u0600-\u06FF (Arabic/Persian block)
  // Extended Persian: \u0750-\u077F, \uFB50-\uFDFF, \uFE70-\uFEFF
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/
  return persianRegex.test(text)
}

// Function to apply Persian styling
const applyPersianStyling = (el, hasPersian) => {
  if (hasPersian) {
    el.classList.add('persian-text')
    el.style.fontFamily = 'var(--font-persian)'
    el.style.direction = 'rtl'
    el.style.textAlign = 'right'
  } else {
    el.classList.remove('persian-text')
    el.style.fontFamily = 'var(--font-mixed)'
    el.style.direction = 'auto'
    el.style.textAlign = 'auto'
  }
}

// Function to check and style element content
const checkAndStyleContent = (el) => {
  const text = el.textContent || el.innerText || ''
  const hasPersian = containsPersian(text)
  applyPersianStyling(el, hasPersian)
}

export default {
  mounted(el, binding) {
    // Check initial content
    checkAndStyleContent(el)
    
    // Set up mutation observer to watch for content changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          checkAndStyleContent(el)
        }
      })
    })
    
    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true
    })
    
    // Store observer for cleanup
    el._persianObserver = observer
  },
  
  updated(el) {
    // Re-check content when component updates
    checkAndStyleContent(el)
  },
  
  beforeUnmount(el) {
    // Clean up observer
    if (el._persianObserver) {
      el._persianObserver.disconnect()
      delete el._persianObserver
    }
  }
} 