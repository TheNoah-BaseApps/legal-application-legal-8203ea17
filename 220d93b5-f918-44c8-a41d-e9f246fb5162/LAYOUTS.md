# Layout System - Quick Reference

## TL;DR

Use predefined layouts instead of creating from scratch:

```tsx
// ✅ Good (5-20 lines)
import { DashboardLayout } from '@/components/layouts';

const navItems = [
  { title: 'Home', href: '/', icon: HomeIcon }
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DashboardLayout appName="My App" navItems={navItems}>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
```

```tsx
// ❌ Bad (200+ lines)
// Manual Sidebar component
// Manual AppBar component  
// Manual responsive logic
// Manual state management
// ...
```

## Available Layouts

1. **DashboardLayout** - Dashboard with sidebar + app bar (most common)
2. **SimpleLayout** - App bar only, no sidebar
3. **AuthLayout** - Centered card for login/register

See [components/layouts/README.md](./components/layouts/README.md) for full documentation.

## Benefits

- **500-1000 tokens saved** per generation
- **Faster generation** (less code to generate)
- **No layout bugs** (pre-tested)
- **Consistent UI** across all apps
- **Responsive by default**

