# WANKR Design System Architecture

## 🎯 **Overview**

This document outlines the centralized design system architecture for the WANKR application. The goal is to maintain consistency, improve maintainability, and enable rapid design changes across the entire application.

## 🏗️ **Architecture Structure**

```
src/app/theme/
├── index.ts          # Main design system exports
├── colors.ts         # Color definitions
├── spacing.ts        # Spacing tokens
└── README.md         # This documentation

src/app/components/ui/
├── index.ts          # UI components exports
├── Button.tsx        # Reusable button component
├── Input.tsx         # Reusable input component
└── Card.tsx          # Reusable card component
```

## 🎨 **Design Tokens**

### **Colors**
All colors are defined in `src/app/theme/colors.ts` and follow the official WANKR brand:

```typescript
// Core Brand Colors
primary: '#7630D9'      // Wankr-Gyatt-3
secondary: '#79F2E6'    // Neon accent
accent: '#F06BF2'       // Pink accent
cyber: '#04588C'        // Borders/UI

// Gradients
gradientHero: 'linear-gradient(90deg, #F06BF2 0%, #7630D9 50%, #79F2E6 100%)'
gradientCTA: 'linear-gradient(135deg, #7630D9 0%, #04588C 100%)'
```

### **Typography**
Typography tokens are defined in the theme:

```typescript
typography: {
  fontFamily: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
    wankr: 'var(--font-mouse-memoirs)',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    // ... more sizes
  }
}
```

### **Spacing & Layout**
Consistent spacing and layout utilities:

```typescript
spacing: {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
}

layout: {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid: {
    '2-cols': 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  }
}
```

## 🧩 **Component System**

### **Reusable UI Components**

#### **Button Component**
```typescript
import { Button } from '../ui'

<Button variant="primary" size="lg" isLoading={isSubmitting}>
  Submit
</Button>
```

**Variants:** `primary`, `secondary`, `outline`, `danger`
**Sizes:** `sm`, `md`, `lg`

#### **Input Component**
```typescript
import { Input } from '../ui'

<Input 
  label="Email Address"
  placeholder="Enter your email"
  error={errors.email}
  helperText="We'll never share your email"
/>
```

#### **Card Component**
```typescript
import { Card } from '../ui'

<Card variant="hover" padding="lg">
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

**Variants:** `base`, `hover`, `interactive`
**Padding:** `sm`, `md`, `lg`, `xl`

### **Component-Specific Styles**

Predefined styles for common patterns:

```typescript
components: {
  button: {
    primary: 'bg-gradient-cta text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105',
    secondary: 'bg-muted border border-border text-muted-foreground px-6 py-3 rounded-xl font-semibold hover:bg-muted/80 transition-all duration-300',
    // ... more variants
  },
  input: {
    base: 'p-3 border border-border rounded-lg bg-input text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200',
    error: 'border-destructive focus:ring-destructive',
  },
  // ... more components
}
```

## 🔄 **Usage Patterns**

### **1. Using Design Tokens**
```typescript
import { tokens, components } from '../../theme'

// Use predefined styles
const buttonClasses = components.button.primary

// Use design tokens
const spacing = tokens.spacing.lg
```

### **2. Using Reusable Components**
```typescript
import { Button, Input, Card } from '../ui'

function MyForm() {
  return (
    <Card padding="lg">
      <Input label="Name" placeholder="Enter your name" />
      <Button variant="primary">Submit</Button>
    </Card>
  )
}
```

### **3. Extending Components**
```typescript
import { Button } from '../ui'

// Extend with additional classes
<Button 
  variant="primary" 
  className="w-full md:w-auto"
>
  Custom Button
</Button>
```

## 🚀 **Benefits of This Architecture**

### **✅ Consistency**
- All components use the same design tokens
- Consistent spacing, colors, and typography
- Unified interaction patterns

### **✅ Maintainability**
- Single source of truth for design decisions
- Easy to update colors, spacing, or typography globally
- Reduced code duplication

### **✅ Scalability**
- Easy to add new components following established patterns
- Consistent API across all UI components
- Type-safe component props

### **✅ Performance**
- Tailwind CSS classes are optimized and purged
- No runtime style calculations
- Minimal bundle size impact

## 🔧 **Making Changes**

### **Updating Colors**
1. Edit `src/app/theme/colors.ts`
2. Update CSS variables in `src/app/globals.css`
3. All components automatically use new colors

### **Adding New Components**
1. Create component in `src/app/components/ui/`
2. Use design tokens from `src/app/theme/`
3. Export from `src/app/components/ui/index.ts`
4. Document in this README

### **Updating Existing Components**
1. Use the centralized design system
2. Avoid inline styles
3. Leverage predefined component variants
4. Test across different screen sizes

## 📋 **Best Practices**

### **✅ Do's**
- Use the centralized design system
- Leverage reusable UI components
- Follow established naming conventions
- Test components in isolation
- Document new patterns

### **❌ Don'ts**
- Don't use inline styles
- Don't create duplicate styling logic
- Don't hardcode colors or spacing
- Don't ignore the design system

## 🎯 **Migration Guide**

### **For Existing Components**
1. Replace inline styles with design tokens
2. Use reusable UI components where possible
3. Update imports to use centralized theme
4. Test thoroughly after changes

### **Example Migration**
```typescript
// Before
<div style={{
  background: 'rgba(255, 107, 107, 0.1)',
  border: '1px solid rgba(255, 107, 107, 0.3)',
  borderRadius: '8px',
  padding: '0.5rem'
}}>

// After
import { Card } from '../ui'
<Card variant="base" padding="sm">
```

## 🔮 **Future Enhancements**

- [ ] Add more UI components (Modal, Dropdown, etc.)
- [ ] Create component playground/storybook
- [ ] Add dark mode support
- [ ] Implement design token validation
- [ ] Add component testing utilities

---

**Remember:** This design system is the foundation for consistent, maintainable, and scalable UI development. Always use it as your first choice for styling decisions.
