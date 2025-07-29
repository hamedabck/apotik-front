# Jalali (Persian) Calendar Implementation Guide

## Overview

This guide documents the implementation of Persian Jalali (Shamsi) calendar support in the Customer Management system. The implementation allows users to input and view dates in the familiar Persian calendar format while maintaining compatibility with the backend's Gregorian calendar requirements.

## Features Implemented

### 1. Birthdate Field
- **Display**: Shows customer birthdates in Jalali format (YYYY/MM/DD) in the data table
- **Input**: Allows users to enter birthdates using Persian calendar dates
- **Auto-formatting**: Automatically adds slashes (/) as users type numbers
- **Real-time validation**: Provides immediate feedback on date validity
- **Input restriction**: Only allows numeric input (prevents invalid characters)
- **Visual feedback**: Green border and checkmark for valid dates, red border for errors
- **Conversion**: Automatically converts Jalali dates to Gregorian format for backend storage

### 2. Insurance Expiry Date Field
- **Display**: Shows insurance expiry dates in Jalali format (YYYY/MM/DD) in the data table
- **Input**: Allows users to enter expiry dates using Persian calendar dates
- **Auto-formatting**: Automatically adds slashes (/) as users type numbers
- **Real-time validation**: Provides immediate feedback on date validity
- **Input restriction**: Only allows numeric input (prevents invalid characters)
- **Visual feedback**: Green border and checkmark for valid dates, red border for errors
- **Conversion**: Automatically converts Jalali dates to Gregorian format for backend storage

### 3. Enhanced User Experience
- **Auto-formatting**: Slashes automatically added as users type (13700515 → 1370/05/15)
- **Input restriction**: Only numbers allowed, special keys (backspace, delete, Ctrl+C/V/X/A) permitted
- **Real-time validation**: Immediate feedback as users type
- **Visual indicators**: 
  - Calendar icon prefix
  - Green checkmark for valid dates
  - Red border for invalid dates
  - Success/error messages below input
- **Persian Font**: Jalali dates displayed using Persian font styling
- **Color Coding**: 
  - Normal dates: Green color (#059669)
  - Expired insurance: Red color (#e11d48)
  - Valid input: Green border with checkmark
  - Invalid input: Red border with error message
- **Format Hints**: Input fields show format examples and help text

## Technical Implementation

### Dependencies
- **moment-jalaali**: Already installed Persian calendar library
- **Configuration**: Configured to use Persian calendar without Persian digits

### File Structure
```
src/
├── utils/
│   └── dateUtils.js          # Jalali calendar utilities
├── stores/
│   └── customerStore.js      # Customer store with Jalali methods
└── components/settings/modals/
    └── CustomersListModal.vue # Updated component
```

### Key Functions

#### dateUtils.js
```javascript
// Core conversion functions
formatDateJalali(date)           // Gregorian → Jalali display
jalaliToGregorian(jalaliString)  // Jalali → Gregorian Date object
gregorianToJalali(gregorianDate) // Gregorian → Jalali string

// Validation and formatting
validateJalaliDate(jalaliString) // Validate Jalali date format
formatJalaliDateInput(input)     // Auto-format as user types
```

#### customerStore.js
```javascript
// Customer-specific methods
formatBirthdateJalali(gregorianDate)        // Format for display
jalaliToGregorianBirthdate(jalaliString)    // Convert for backend
validateJalaliBirthdate(jalaliString)       // Validate birthdate
formatJalaliInput(input)                    // Format user input
```

## Usage Examples

### Date Format Examples
```
Jalali Input:    1370/05/15
Gregorian Output: 1991-08-06

Jalali Input:    1403/12/29
Gregorian Output: 2025-03-20
```

### Validation Rules
- **Format**: YYYY/MM/DD (e.g., 1370/05/15)
- **Year Range**: 1300-1450 (reasonable range for birthdates)
- **Month Range**: 1-12
- **Day Range**: 
  - Months 1-6: 1-31 days
  - Months 7-11: 1-30 days
  - Month 12: 1-29 days (1-30 in leap years)
- **Future Dates**: Birthdates cannot be in the future

### Auto-formatting
As users type, the input automatically formats with enhanced features:
```
User types: 1        → 1
User types: 13       → 13
User types: 137      → 137
User types: 1370     → 1370
User types: 13700    → 1370/0
User types: 137005   → 1370/05
User types: 1370051  → 1370/05/1
User types: 13700515 → 1370/05/15
```

**Key Features:**
- Slashes automatically inserted at correct positions
- Only numeric input allowed (letters and symbols blocked)
- Backspace, delete, and clipboard operations (Ctrl+C/V/X/A) work normally
- Maximum 10 characters (YYYY/MM/DD format)
- Real-time validation as user types

## Component Updates

### CustomersListModal.vue Changes

#### 1. Form Fields
```vue
<!-- Old Gregorian date picker -->
<el-date-picker v-model="form.birthdate" type="date" />

<!-- New Jalali text input -->
<el-input 
  v-model="form.birthdate_jalali"
  placeholder="e.g., 1370/05/15"
  @input="handleJalaliDateInput"
  maxlength="10"
/>
```

#### 2. Table Display
```vue
<!-- Jalali date display with Persian styling -->
<template #birthdate="{ item }">
  <span class="jalali-date">
    {{ item.birthdate ? customerStore.formatBirthdateJalali(item.birthdate) : '' }}
  </span>
</template>
```

#### 3. Data Conversion
```javascript
// Convert Jalali to Gregorian before sending to backend
const gregorianBirthdate = customerStore.jalaliToGregorianBirthdate(
  form.value.birthdate_jalali
)

const customerData = {
  // ... other fields
  birthdate: gregorianBirthdate, // Send Gregorian to backend
}
```

## Styling

### CSS Classes
```css
.jalali-date {
  font-family: var(--font-persian);
  direction: ltr;
  color: #059669;
  font-weight: 500;
}

.jalali-date.expired-insurance {
  color: #e11d48 !important;
}
```

## Backend Compatibility

### Data Flow
1. **Frontend → Backend**: Jalali dates converted to Gregorian (YYYY-MM-DD format)
2. **Backend → Frontend**: Gregorian dates received and converted to Jalali for display
3. **Storage**: All dates stored in Gregorian format in the database

### API Format
```json
{
  "birthdate": "1991-08-06",           // Gregorian format to backend
  "insurance_expiry_date": "2025-03-20" // Gregorian format to backend
}
```

## User Experience

### Input Experience
- Users can type dates in familiar Persian calendar format
- **Auto-formatting**: Slashes automatically added as users type numbers
- **Input restriction**: Only numeric characters allowed (prevents typing errors)
- **Smart input handling**: Supports backspace, delete, and clipboard operations
- **Real-time validation**: Immediate feedback as users type (no need to submit form)
- **Visual feedback**: Green border and checkmark for valid dates
- **Error prevention**: Invalid characters blocked before entry
- **Format hints**: Clear guidance on expected input format
- **Progressive validation**: Validation starts when user has typed enough characters

### Display Experience
- All dates shown in Persian calendar format
- Consistent styling with Persian fonts
- **Visual indicators**:
  - Calendar icon prefix for date inputs
  - Green checkmark suffix for valid dates
  - Color-coded borders (green for valid, red for invalid)
  - Success messages for valid input
  - Clear error messages for invalid input
- Color coding for expired insurance dates
- Clear column headers indicating Persian calendar

## Error Handling

### Validation Errors
- **Incomplete input**: "Please enter complete date (YYYY/MM/DD)"
- **Invalid format**: "Date format should be YYYY/MM/DD"
- **Invalid year**: "Year should be between 1300-1450 (Persian calendar)"
- **Invalid month**: "Month should be between 1-12"
- **Invalid day for months 1-6**: "Month X can have maximum 31 days"
- **Invalid day for months 7-11**: "Month X can have maximum 30 days"
- **Invalid day for month 12 (non-leap)**: "Month 12 in year XXXX can have maximum 29 days (non-leap year)"
- **Invalid day for month 12 (leap)**: "Month 12 in year XXXX can have maximum 30 days (leap year)"
- **Future birthdate**: "Birthdate cannot be in the future"
- **General invalid date**: "Invalid date - please check your input"

### Conversion Errors
- Graceful fallback to empty string for invalid dates
- Console logging for debugging conversion issues
- User-friendly error messages in the UI

## Testing

### Test Cases
1. **Valid Jalali Dates**: 1370/05/15, 1403/12/29
2. **Invalid Formats**: 70/5/15, 1370-05-15, 1370/5/15
3. **Invalid Dates**: 1370/13/01, 1370/12/32, 1370/07/31
4. **Edge Cases**: Leap years, month boundaries, future dates
5. **Conversion**: Jalali ↔ Gregorian accuracy

### Manual Testing
1. Open Customer Management modal
2. Add new customer with Jalali birthdate
3. Verify date displays correctly in table
4. Edit customer and verify date loads in Jalali format
5. Test validation with invalid dates

## Future Enhancements

### Potential Improvements
1. **Date Picker**: Custom Jalali date picker component
2. **Localization**: Full Persian language support
3. **Time Support**: Jalali date-time formatting
4. **Other Dates**: Apply to all date fields in the application
5. **User Preference**: Toggle between Jalali and Gregorian display

### Performance Considerations
- Moment-jalaali library adds ~50KB to bundle size
- Date conversions are fast and cached where possible
- Consider lazy loading for non-Persian users

## Troubleshooting

### Common Issues
1. **Import Errors**: Ensure moment-jalaali is installed
2. **Format Issues**: Check date format validation
3. **Conversion Errors**: Verify Jalali date validity
4. **Display Issues**: Check CSS font variables

### Debug Tips
- Check browser console for conversion errors
- Verify moment-jalaali configuration
- Test with known valid Jalali dates
- Use browser dev tools to inspect date values

## Conclusion

The Jalali calendar implementation provides a seamless experience for Persian users while maintaining full backend compatibility. The system automatically handles all date conversions, validation, and formatting, making it transparent to both users and the backend API. 