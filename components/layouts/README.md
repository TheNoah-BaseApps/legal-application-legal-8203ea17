# Predefined Layouts

This directory contains production-ready layout components that reduce code generation and ensure consistency across all generated apps.

## Available Layouts

### 1. DashboardLayout (Recommended for most apps)

Full dashboard with sidebar navigation and app bar.

**Features:**
- Fixed sidebar on desktop (left side, 256px width)
- Slide-out drawer on mobile (< 1024px)
- App bar with menu toggle and user profile dropdown
- Auto-active state for current route
- Responsive by default

**Usage:**
```tsx
'use client';

import { DashboardLayout } from '@/components/layouts';
import { Home, Users, Settings, Package } from 'lucide-react';

const navItems = [
  { title: 'Dashboard', href: '/', icon: Home },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Products', href: '/products', icon: Package, badge: '12' },
  { title: 'Settings', href: '/settings', icon: Settings }
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

**NavItem Type:**
```typescript
interface NavItem {
  title: string;      // Display name
  href: string;       // Route path
  icon: LucideIcon;   // Icon component from lucide-react
  badge?: string;     // Optional badge (e.g., "New", "5")
}
```

### 2. SimpleLayout

App bar only, no sidebar. Good for simple apps or content-focused pages.

**Usage:**
```tsx
import { SimpleLayout } from '@/components/layouts';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SimpleLayout appName="My App">
          {children}
        </SimpleLayout>
      </body>
    </html>
  );
}
```

### 3. AuthLayout

Centered card design for authentication pages (login, register, forgot password).

**Usage:**
```tsx
import { AuthLayout } from '@/components/layouts';

export default function AuthLayoutComponent({ children }) {
  return <AuthLayout appName="My App">{children}</AuthLayout>;
}
```

**Example for auth pages:**
```
app/
  (auth)/
    layout.js       <- Use AuthLayout here
    login/
      page.js
    register/
      page.js
```

### 4. Standalone Components

#### AppBar

Application bar with app name, menu toggle, and user profile dropdown.

**Usage:**
```tsx
import { AppBar } from '@/components/layouts';

<AppBar 
  appName="My App"
  onMenuClick={() => setSidebarOpen(true)}
  showMenuButton={true}
/>
```

#### Sidebar

Navigation sidebar with support for desktop (fixed) and mobile (drawer) modes.

**Usage:**
```tsx
import { Sidebar } from '@/components/layouts';

<Sidebar
  items={navItems}
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  isMobile={isMobile}
/>
```

## Benefits

### For Code Generation:
- **Token Savings**: ~500-1000 tokens saved per generation
- **Faster Generation**: Less code to generate (5-20 lines vs 200+ lines)
- **No Layout Bugs**: Pre-tested, production-ready layouts
- **Consistency**: Same professional UI across all apps

### For Developers:
- **Clean Code**: Minimal boilerplate in app files
- **Easy Customization**: Modify layouts in one place
- **Type Safety**: Full TypeScript support
- **Responsive**: Mobile-first design by default

## Layout Selection Guide

| App Type | Recommended Layout | Reason |
|----------|-------------------|--------|
| Multi-page dashboard | DashboardLayout | Sidebar navigation for multiple workflows |
| SaaS application | DashboardLayout | Professional dashboard UI with navigation |
| Admin panel | DashboardLayout | Sidebar for admin sections |
| Single-page app | SimpleLayout | No need for sidebar navigation |
| Blog or content site | SimpleLayout | Focus on content, minimal chrome |
| Marketing site | SimpleLayout | Clean, content-focused |
| Auth pages | AuthLayout | Centered, card-based design |

## User Profile Integration

The AppBar component reads user information from localStorage:

```typescript
// After login, store user info:
localStorage.setItem('user', JSON.stringify({
  name: 'John Doe',
  email: 'john@example.com'
}));

// On logout:
localStorage.removeItem('user');
localStorage.removeItem('token');
```

The profile dropdown automatically:
- Shows user initials in avatar (e.g., "John Doe" → "JD")
- Displays full name and email
- Provides logout button

## Customization

### Custom Layout

If none of the predefined layouts fit your needs:

```tsx
'use client';

import { AppBar, Sidebar } from '@/components/layouts';

export default function CustomLayout({ children }) {
  return (
    <div>
      <AppBar appName="My App" />
      <div className="flex">
        <Sidebar items={navItems} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Styling

All layouts use Tailwind CSS and shadcn/ui components. Customize by:
1. Modifying the layout files in this directory
2. Using Tailwind's theming system
3. Adding custom CSS classes

## Migration from Manual Layouts

If you have existing apps with manual layout code:

**Before (200+ lines):**
```tsx
// Manual Sidebar, AppBar, responsive logic, state management...
// 200+ lines of boilerplate
```

**After (20 lines):**
```tsx
import { DashboardLayout } from '@/components/layouts';
import { Home, Users } from 'lucide-react';

const navItems = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Users', href: '/users', icon: Users }
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

## Dependencies

These layouts use:
- **shadcn/ui components**: Button, Sheet, ScrollArea, DropdownMenu, Avatar
- **lucide-react**: Icons for navigation and UI
- **next/navigation**: usePathname for active states
- **@/hooks/use-mobile**: Responsive breakpoint detection

All dependencies are already included in the scaffold.

