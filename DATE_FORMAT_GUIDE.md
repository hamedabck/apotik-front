# Date Format Implementation Guide

This guide explains the new standardized date formatting system implemented throughout the Apotik application.

## Overview

The application now uses a consistent **YYYY/MM/DD** date format instead of the default browser locale format (MM/DD/YYYY). This provides better readability and consistency across all components.

## Date Format Standard

- **Display Format**: `YYYY/MM/DD` (e.g., `2025/06/17`)
- **API Format**: `YYYY-MM-DD` (e.g., `2025-06-17`)
- **DateTime Format**: `YYYY/MM/DD HH:MM` (e.g., `2025/06/17 14:30`)

## Utility Functions

All date formatting is now handled by the centralized utility file: `/src/utils/dateUtils.js`

### Available Functions

```javascript
import { 
  formatDate,      // YYYY/MM/DD format
  formatDateISO,   // YYYY-MM-DD format (for APIs)
  formatDateTime,  // YYYY/MM/DD HH:MM format
  getTodayISO,     // Today in YYYY-MM-DD format
  getToday,        // Today in YYYY/MM/DD format
  getDaysAgoISO,   // N days ago in YYYY-MM-DD format
  getDaysAgo       // N days ago in YYYY/MM/DD format
} from '@/utils/dateUtils'
```

### Usage Examples

```javascript
// Basic date formatting
const displayDate = formatDate('2025-06-17T10:30:00Z')  // "2025/06/17"
const apiDate = formatDateISO(new Date())               // "2025-06-17"
const fullDateTime = formatDateTime(new Date())         // "2025/06/17 14:30"

// Helper functions
const today = getToday()                                // "2025/06/17"
const weekAgo = getDaysAgo(7)                          // "2025/06/10"
const monthAgoISO = getDaysAgoISO(30)                  // "2025-05-18"
```

## Updated Components

The following components have been updated to use the new date formatting:

### Views
- ✅ `TtacDrugsUploadView.vue`
- ✅ `MedicinesListView.vue`
- ✅ `MedicineDetailView.vue`
- ✅ `StockAdjustmentView.vue`

### Components
- ✅ `MedicineStockForm.vue`
- ✅ `CurrencySettingsModal.vue`

### Changes Made

1. **Removed Local formatDate Functions**: All local `formatDate` functions have been removed
2. **Added Utility Import**: Each component now imports from `@/utils/dateUtils`
3. **Consistent Formatting**: All dates now display in YYYY/MM/DD format
4. **Enhanced DateTime**: Currency settings and detailed views show time information

## Before vs After

### Before (Inconsistent)
```javascript
// Different formats in different components
formatDate = (date) => new Date(date).toLocaleDateString()  // 6/17/2025 (US)
formatDate = (date) => new Date(date).toLocaleDateString()  // 17/6/2025 (EU)
```

### After (Consistent)
```javascript
// Same format everywhere
import { formatDate } from '@/utils/dateUtils'
formatDate('2025-06-17')  // Always: 2025/06/17
```

## Implementation Benefits

1. **🎯 Consistency**: Same date format across all components
2. **🌍 Locale Independence**: Format doesn't change based on user's browser locale
3. **📅 Better Readability**: YYYY/MM/DD is internationally recognized
4. **🔧 Maintainability**: Single source of truth for date formatting
5. **🚀 Performance**: Optimized formatting functions
6. **📱 Mobile Friendly**: Consistent display on all devices

## Date Picker Configuration

Element Plus date pickers are configured to use the new format:

```vue
<el-date-picker
  v-model="dateValue"
  type="daterange"
  format="YYYY/MM/DD"
  value-format="YYYY-MM-DD"
  range-separator="To"
  start-placeholder="Start date"
  end-placeholder="End date"
/>
```

## API Integration

- **Frontend Display**: Uses `formatDate()` for YYYY/MM/DD format
- **API Communication**: Uses `formatDateISO()` for YYYY-MM-DD format
- **Date Ranges**: Filter functions use ISO format for backend compatibility

## Migration Notes

### For Developers

When adding new date displays:

```javascript
// ✅ DO: Use the utility function
import { formatDate } from '@/utils/dateUtils'
const displayDate = formatDate(someDate)

// ❌ DON'T: Use toLocaleDateString()
const displayDate = new Date(someDate).toLocaleDateString()
```

### For New Components

1. Import the date utility: `import { formatDate } from '@/utils/dateUtils'`
2. Use appropriate function based on context:
   - Display: `formatDate()`
   - API calls: `formatDateISO()`
   - With time: `formatDateTime()`

## Testing

All date formatting has been tested with:
- ✅ Different browser locales
- ✅ Various date formats (ISO, timestamp, Date objects)
- ✅ Edge cases (invalid dates, null values)
- ✅ Mobile devices
- ✅ Different timezones

## Future Enhancements

- [ ] Add Persian calendar support
- [ ] Implement relative date formatting ("2 days ago")
- [ ] Add date validation utilities
- [ ] Create date range helpers
- [ ] Add timezone conversion utilities 