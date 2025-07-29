# Persian Fonts Implementation Guide

This guide explains how to use Persian fonts effectively in the Apotik application.

## Overview

The application now supports beautiful Persian text rendering using **Vazirmatn** as the primary Persian font, with **Noto Sans Arabic** as a fallback. The system automatically handles mixed Persian-English content and provides utilities for consistent styling.

## Fonts Used

- **Primary Persian Font**: [Vazirmatn](https://github.com/rastikerdar/vazirmatn) - A modern, clean Persian font
- **Fallback Persian Font**: Noto Sans Arabic - Google's comprehensive Arabic/Persian font
- **English Font**: Inter - Modern, readable English font
- **System Fallbacks**: Tahoma, Arial, sans-serif

## CSS Variables

The following CSS variables are available throughout the application:

```css
--font-persian: 'Vazirmatn', 'Noto Sans Arabic', 'Tahoma', 'Arial', sans-serif
--font-english: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
--font-mixed: 'Vazirmatn', 'Inter', 'Noto Sans Arabic', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
```

## Usage Methods

### 1. Automatic Detection (Recommended)

Use the `v-persian` directive for automatic Persian text detection and styling:

```vue
<template>
  <!-- Automatically detects and styles Persian content -->
  <div v-persian>{{ someText }}</div>
  
  <!-- Works with dynamic content -->
  <span v-persian>{{ medicine.persianName }}</span>
</template>
```

### 2. CSS Classes

#### Basic Persian Text
```vue
<template>
  <!-- For pure Persian text -->
  <div class="persian">نام دارو</div>
  
  <!-- For inline Persian text -->
  <span class="persian-inline">شرکت داروسازی</span>
  
  <!-- For mixed content -->
  <div class="mixed">Medicine Name: نام دارو</div>
</template>
```

#### Specific Use Cases
```vue
<template>
  <!-- Medicine names -->
  <span class="medicine-persian-name">{{ medicine.persianName }}</span>
  
  <!-- Company names -->
  <span class="company-persian-name">{{ company.persianName }}</span>
  
  <!-- Price display -->
  <div class="price-display">
    <span class="amount">{{ formatPrice(price) }}</span>
    <span class="currency">ریال</span>
  </div>
</template>
```

#### Typography Weights
```vue
<template>
  <div class="persian-light">Light Persian text</div>
  <div class="persian-normal">Normal Persian text</div>
  <div class="persian-medium">Medium Persian text</div>
  <div class="persian-semibold">Semibold Persian text</div>
  <div class="persian-bold">Bold Persian text</div>
</template>
```

### 3. Element Plus Components

#### Tables
```vue
<template>
  <el-table-column label="Persian Name">
    <template #default="scope">
      <div class="table-persian">{{ scope.row.persianName }}</div>
    </template>
  </el-table-column>
</template>
```

#### Forms
```vue
<template>
  <!-- Persian input -->
  <el-input 
    v-model="persianText" 
    class="persian-input"
    placeholder="نام دارو را وارد کنید"
  />
  
  <!-- Mixed content input -->
  <el-input 
    v-model="mixedText" 
    class="input-mixed"
  />
</template>
```

#### Descriptions
```vue
<template>
  <el-descriptions-item label="Persian Name">
    <span class="persian-content">{{ drug.persianName }}</span>
  </el-descriptions-item>
</template>
```

## Price Display Best Practices

For consistent price display with Persian Rial:

```vue
<template>
  <!-- Recommended approach -->
  <div class="price-display">
    <span class="amount">{{ formatPrice(price) }}</span>
    <span class="currency">ریال</span>
  </div>
  
  <!-- For RTL layout -->
  <div class="price-display rtl">
    <span class="currency">ریال</span>
    <span class="amount">{{ formatPrice(price) }}</span>
  </div>
</template>
```

## Utility Classes

### Direction Control
```vue
<template>
  <div class="dir-rtl">Right-to-left content</div>
  <div class="dir-ltr">Left-to-right content</div>
  <div class="dir-auto">Auto-direction content</div>
</template>
```

### Font Family Control
```vue
<template>
  <div class="text-persian">Persian font only</div>
  <div class="text-english">English font only</div>
  <div class="text-mixed">Mixed font stack</div>
</template>
```

## Examples from the Codebase

### Medicine Names in Tables
```vue
<!-- Before -->
<div>{{ scope.row.name_persian }}</div>

<!-- After -->
<div class="medicine-persian-name">{{ scope.row.name_persian }}</div>
```

### Price Display
```vue
<!-- Before -->
<div>ریال{{ formatPrice(price) }}</div>

<!-- After -->
<div class="price-display">
  <span class="amount">{{ formatPrice(price) }}</span>
  <span class="currency">ریال</span>
</div>
```

### Company Names
```vue
<!-- Before -->
<span>{{ company.persianName }}</span>

<!-- After -->
<span class="company-persian-name">{{ company.persianName }}</span>
```

## Performance Considerations

1. **Font Loading**: Fonts are loaded from Google Fonts CDN for optimal performance
2. **Fallbacks**: Multiple fallback fonts ensure text is always readable
3. **Automatic Detection**: The `v-persian` directive uses efficient mutation observers
4. **CSS Variables**: Allow for easy theme customization

## Browser Support

- **Modern Browsers**: Full support with web fonts
- **Older Browsers**: Graceful fallback to system fonts
- **Mobile**: Optimized for mobile devices with responsive adjustments

## Troubleshooting

### Font Not Loading
If Persian fonts don't appear:
1. Check internet connection (fonts load from Google Fonts)
2. Verify CSS imports in `main.js`
3. Check browser console for font loading errors

### Text Direction Issues
If text direction is incorrect:
1. Use explicit direction classes (`dir-rtl`, `dir-ltr`)
2. Check for conflicting CSS styles
3. Use the `v-persian` directive for automatic detection

### Mixed Content Problems
For mixed Persian-English content:
1. Use the `mixed` class or `--font-mixed` variable
2. Consider using `v-persian` directive for automatic handling
3. Test with various content combinations

## Future Enhancements

- [ ] Add support for Persian number formatting
- [ ] Implement Persian calendar integration
- [ ] Add more Persian font options
- [ ] Create Persian text input validation
- [ ] Add Persian keyboard layout detection 