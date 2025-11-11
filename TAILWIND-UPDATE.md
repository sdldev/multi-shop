# Tailwind CSS Configuration Update

## Summary of Changes

Updated `tailwind.config.js` and `index.css` to support comprehensive design system with extended features.

## Added Features

### 1. Font Family
```javascript
fontFamily: {
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
  serif: 'var(--font-serif)'
}
```

**Usage:**
```jsx
<div className="font-sans">Default sans-serif text</div>
<code className="font-mono">Monospace code</code>
<p className="font-serif">Serif paragraph</p>
```

### 2. Extended Border Radius
```javascript
borderRadius: {
  sm: 'calc(var(--radius) - 4px)',  // Smaller
  md: 'calc(var(--radius) - 2px)',  // Medium
  lg: 'var(--radius)',               // Default (0.5rem)
  xl: 'calc(var(--radius) + 4px)'   // Larger
}
```

**Usage:**
```jsx
<div className="rounded-xl">Extra rounded corners</div>
```

### 3. Box Shadow System
```javascript
boxShadow: {
  '2xs': 'var(--shadow-2xs)',  // Minimal shadow
  xs: 'var(--shadow-xs)',       // Extra small
  sm: 'var(--shadow-sm)',       // Small
  DEFAULT: 'var(--shadow)',     // Default
  md: 'var(--shadow-md)',       // Medium
  lg: 'var(--shadow-lg)',       // Large
  xl: 'var(--shadow-xl)',       // Extra large
  '2xl': 'var(--shadow-2xl)'   // Maximum shadow
}
```

**Usage:**
```jsx
<Card className="shadow-lg">Large shadow card</Card>
<Button className="shadow-2xs hover:shadow-md">Subtle shadow button</Button>
```

### 4. Sidebar Color System
```javascript
sidebar: {
  DEFAULT: 'hsl(var(--sidebar))',
  foreground: 'hsl(var(--sidebar-foreground))',
  primary: 'hsl(var(--sidebar-primary))',
  'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  accent: 'hsl(var(--sidebar-accent))',
  'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  border: 'hsl(var(--sidebar-border))',
  ring: 'hsl(var(--sidebar-ring))'
}
```

**Usage:**
```jsx
<aside className="bg-sidebar border-sidebar-border">
  <button className="bg-sidebar-accent text-sidebar-accent-foreground">
    Menu Item
  </button>
</aside>
```

## CSS Variables Added

### Light Mode (`:root`)
```css
/* Sidebar Colors */
--sidebar: 0 0% 98%;
--sidebar-foreground: 222.2 84% 4.9%;
--sidebar-primary: 221.2 83.2% 53.3%;
--sidebar-primary-foreground: 210 40% 98%;
--sidebar-accent: 210 40% 96.1%;
--sidebar-accent-foreground: 222.2 47.4% 11.2%;
--sidebar-border: 214.3 31.8% 91.4%;
--sidebar-ring: 221.2 83.2% 53.3%;

/* Fonts */
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, ...;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, ...;
--font-serif: ui-serif, Georgia, Cambria, "Times New Roman", ...;

/* Shadows */
--shadow-2xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-xs: 0 1px 3px 0 rgb(0 0 0 / 0.1), ...;
--shadow-sm: 0 2px 4px -1px rgb(0 0 0 / 0.07), ...;
--shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), ...;
--shadow-md: 0 6px 16px -4px rgb(0 0 0 / 0.1), ...;
--shadow-lg: 0 10px 24px -4px rgb(0 0 0 / 0.1), ...;
--shadow-xl: 0 20px 32px -8px rgb(0 0 0 / 0.12), ...;
--shadow-2xl: 0 24px 48px -12px rgb(0 0 0 / 0.18);
```

### Dark Mode (`.dark`)
- All sidebar colors adjusted for dark theme
- Shadows intensified for better visibility (higher opacity)
- Maintains same structure as light mode

## Component Updates

### Existing Components (Already Compatible)
All UI components in `/src/components/ui/` are already using the correct CSS variable pattern:

✅ **Button** - Uses `bg-primary`, `text-primary-foreground`, etc.
✅ **Card** - Uses `bg-card`, `text-card-foreground`, `shadow-sm`
✅ **Input** - Uses `border-input`, `bg-background`, `ring-ring`
✅ **Dialog** - Uses `bg-card`, `shadow-lg`
✅ **Table** - Uses `border-b`, `bg-muted/50`
✅ **Label** - Uses `text-sm font-medium`

### No Changes Required
Components are already using HSL color functions and variable references correctly.

## Usage Examples

### Creating Sidebar Component
```jsx
<aside className="bg-sidebar border-r border-sidebar-border">
  <nav className="p-4">
    <button className="w-full px-4 py-2 rounded-lg 
      bg-sidebar-accent text-sidebar-accent-foreground
      hover:bg-sidebar-primary hover:text-sidebar-primary-foreground
      focus:ring-2 focus:ring-sidebar-ring">
      Dashboard
    </button>
  </nav>
</aside>
```

### Card with Custom Shadow
```jsx
<Card className="shadow-lg hover:shadow-2xl transition-shadow">
  <CardContent className="font-sans">
    Content with smooth shadow transition
  </CardContent>
</Card>
```

### Typography Variations
```jsx
<div>
  <h1 className="font-sans text-4xl font-bold">Heading</h1>
  <code className="font-mono text-sm bg-muted p-2 rounded">
    const code = "example";
  </code>
  <p className="font-serif text-lg">
    Elegant serif paragraph text
  </p>
</div>
```

## Dark Mode Support

Toggle dark mode by adding/removing `dark` class on root element:

```javascript
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// Enable dark mode
document.documentElement.classList.add('dark');

// Disable dark mode  
document.documentElement.classList.remove('dark');
```

All colors, shadows, and sidebar styles automatically adapt.

## Files Modified

1. **`frontend/tailwind.config.js`**
   - Added `fontFamily` configuration
   - Extended `borderRadius` with `xl` variant
   - Added `boxShadow` system (8 levels)
   - Added `sidebar` color palette

2. **`frontend/src/index.css`**
   - Added sidebar CSS variables (light + dark)
   - Added font family variables
   - Added shadow variables (8 levels, light + dark)
   - Updated `body` to use `var(--font-sans)`

## Benefits

✅ **Consistent Design System** - All spacing, colors, shadows standardized
✅ **Dark Mode Ready** - Full support with automatic switching
✅ **Type Safe** - Tailwind autocomplete for all new utilities
✅ **Maintainable** - Central configuration, no magic values
✅ **Accessible** - High contrast ratios maintained in both modes
✅ **Performance** - CSS variables for runtime theme switching

## Migration Notes

No breaking changes - all existing components remain compatible. New utilities are additive only.
