# Next.js 15 

A production-ready Next.js 15 App with App Router, Tailwind CSS 4, predefined layouts, and essential dependencies.

## Features

- ⚡ **Next.js 15.1.5** - Latest Next.js with App Router
- ⚛️ **React 19** - Latest React with concurrent features
- 🎨 **Tailwind CSS 4.1.13** - Utility-first CSS framework
- 🎨 **Predefined Layouts** - Dashboard, Simple, and Auth layouts (NEW!)
- 🧩 **53+ shadcn/ui Components** - Production-ready UI components
- 📚 **API Documentation** - Built-in Swagger UI for API testing
- 🔐 **Authentication Ready** - JWT and bcryptjs configured
- 💾 **Database Ready** - Supabase configured
- 🔐 **Supabase Authentication** - Complete auth setup with hooks
- 💾 **Supabase Database** - Real-time database integration
- ✅ **Validation Ready** - Zod for schema validation
- 📱 **Responsive Design** - Mobile-first approach
- 🔧 **TypeScript Support** - Full TypeScript configuration
- 📦 **Modern Packages** - Latest versions of popular libraries
- 🎣 **Custom Hooks** - Pre-built hooks for common operations

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Required for Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   Get your Supabase credentials from [https://supabase.com/dashboard](https://supabase.com/dashboard)

   **Note:** Only these two variables are required for Supabase authentication.

3. **Choose a layout** (see [LAYOUTS.md](./LAYOUTS.md))

   Edit `app/layout.js` to use a predefined layout:

   ```tsx
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

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

6. **Start production server**
   ```bash
   npm start
   ```

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm start` - Start production server on port 3000
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Documentation

This scaffold includes built-in Swagger/OpenAPI documentation:

- **View Documentation**: Navigate to `/api-docs` in your browser
- **Test APIs**: Interactive interface to test all endpoints
- **Auto-generated**: Automatically updates from your JSDoc comments

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed instructions on documenting your API endpoints.

## Project Structure

```
├── app/
│   ├── api/               # API routes
│   │   ├── swagger/       # Swagger spec endpoint
│   │   └── example/       # Example API with documentation
│   ├── api-docs/          # Swagger UI page
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles with Tailwind
├── components/            # Reusable UI components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── swagger.js         # Swagger configuration
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
│   ├── api/
│   │   └── auth/
│   │       └── callback/   # Supabase auth callback
│   ├── layout.js           # Root layout
│   ├── page.js             # Home page
│   └── globals.css         # Global styles with Tailwind
├── components/
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── use-mobile.ts       # Mobile detection hook
│   └── use-supabase-auth.ts # Supabase auth hooks
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Client-side Supabase client
│   │   ├── server.ts       # Server-side Supabase client
│   │   └── middleware.ts   # Middleware helper
│   └── utils.ts            # Utility functions
├── middleware.ts           # Next.js middleware for auth
├── package.json
├── next.config.js
├── tsconfig.json
└── API_DOCUMENTATION.md   # API documentation guide
└── .env.local              # Environment variables (create this)
```

## Dependencies

### Production

- `next` - Next.js framework
- `react` & `react-dom` - React library
- `tailwindcss` - CSS framework
- `@supabase/supabase-js` - Supabase client
- `@supabase/supabase-js` - Supabase JavaScript client
- `@supabase/ssr` - Supabase SSR utilities
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `zod` - Schema validation
- `axios` - HTTP client
- `react-hook-form` - Form handling
- `swagger-jsdoc` - OpenAPI spec generation
- `swagger-ui-react` - API documentation UI
- `@hookform/resolvers` - Form validation resolvers
- `lucide-react` - Icons
- `react-hot-toast` - Toast notifications
- `sonner` - Toast notifications
- `clsx` & `tailwind-merge` - Utility functions
- `@radix-ui/*` - Headless UI components
- `class-variance-authority` - CSS class management

### Development

- `typescript` - TypeScript support
- `eslint` & `eslint-config-next` - Linting
- `@types/*` - TypeScript definitions

## Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# ============================================
# REQUIRED: Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ============================================
# REQUIRED: Supabase Service Role Key (Server-Side Only)
# ============================================
# ⚠️ SECURITY: This key bypasses Row Level Security (RLS)
# NEVER expose this to the browser or commit it to version control
# Required for server-side CRUD operations in API routes and Server Components
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# OPTIONAL: Only add these if needed
# ============================================

# Only if using custom JWT auth
# JWT_SECRET=your-secret-key

# App name (optional)
# NEXT_PUBLIC_APP_NAME=Your App Name
```

### Supabase Setup

1. **Create a Supabase project** at [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Get your credentials** from Project Settings > API
3. **Add environment variables** to `.env.local`
4. **Configure authentication** in Supabase Dashboard > Authentication > Providers
5. **Create tables** in Supabase Dashboard > Table Editor

### Example Table Schema

For the data example component, create a table:

```sql
create table your_table_name (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table your_table_name enable row level security;

-- Create a policy that allows all operations for authenticated users
create policy "Allow all for authenticated users" on your_table_name
  for all using (auth.role() = 'authenticated');
```

## Supabase Integration

### Client-Side Usage

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data, error } = await supabase.from("your_table").select("*");
```

### Server-Side Usage (Server Components, Server Actions, Route Handlers)

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.from("your_table").select("*");
```

### Authentication Hooks

```typescript
import {
  useSupabaseAuth,
  useSupabaseSignIn,
  useSupabaseSignOut,
} from "@/hooks/use-supabase-auth";

// In your component
const { user, loading } = useSupabaseAuth();
const { signIn } = useSupabaseSignIn();
const { signOut } = useSupabaseSignOut();
```


## Next Steps

This scaffold provides the base structure. You can now:

1. **Add API routes** in `app/api/` with Swagger documentation
2. **Create pages** in `app/` directory
3. **Add components** in `components/` directory
4. **Configure database** connection in `.env.local`
5. **Add utilities** in `lib/` directory
6. **Document APIs** - See `API_DOCUMENTATION.md` for guide
7. **Test APIs** - Visit `/api-docs` to test your endpoints

## Example API Endpoint

Check out `app/api/example/route.js` for a fully documented example showing:

- GET and POST methods
- Request/response schemas
- Error handling
- Swagger annotations

1. Set up your Supabase project and add credentials to `.env.local`
2. Create your database schema in Supabase
3. Build your own pages and components in `app/` directory
5. Add custom hooks in `hooks/` directory
6. Add utilities in `lib/` directory

## License

IVC Ventures International Innovation Pvt Ltd (IVC Ventures) Confidential.
