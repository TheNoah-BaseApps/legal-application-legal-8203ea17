# Supabase Setup Guide - Quick Start

This scaffold now has complete Supabase integration! Follow these steps to get started.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose a name, database password, and region
4. Wait ~2 minutes for provisioning

### Step 2: Get Your Credentials

1. Go to **Project Settings** > **API**
2. Copy these three values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
   - **service_role key** (long string starting with `eyJ...`) - ⚠️ Keep this secret!

### Step 3: Create Environment File

Create a file named `.env.local` in the root directory:

```bash
# Public keys (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-actual-anon-key

# Service Role Key (SERVER-SIDE ONLY - never expose to browser!)
# Required for server-side CRUD operations that bypass RLS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-actual-service-role-key
```

⚠️ **Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for server-side operations in API routes and Server Components. It bypasses Row Level Security, so keep it secret and never expose it to the browser.

### Step 4: Start Your App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## ✅ What's Included

### Files Created

```
project/
├── lib/supabase/
│   ├── client.ts          # Client-side Supabase client
│   ├── server.ts          # Server-side Supabase client
│   └── middleware.ts      # Middleware helper
├── hooks/
│   └── use-supabase-auth.ts  # Authentication hooks
├── components/
│   └── ui/                         # shadcn/ui components
├── app/api/auth/callback/
│   └── route.ts           # OAuth callback handler
├── middleware.ts          # Next.js middleware
├── SUPABASE.md           # Complete Supabase documentation
├── SETUP_GUIDE.md        # This file
└── env.example           # Environment variable template
```

### Dependencies Added

- `@supabase/supabase-js` - Supabase JavaScript client (already in package.json)
- `@supabase/ssr` - SSR utilities for Next.js (newly added)

## 🎯 Test the Integration

### Test Authentication

Use the authentication hooks in your components:

```typescript
'use client'
import { useSupabaseAuth, useSupabaseSignIn } from '@/hooks/use-supabase-auth'

export default function HomePage() {
  const { user, loading } = useSupabaseAuth()
  const { signIn } = useSupabaseSignIn()

  // Your authentication UI here
}
```

### Test Database Operations

1. Create a test table in Supabase:

Go to **Table Editor** > **New Table** and run this SQL:

```sql
create table your_table_name (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table your_table_name enable row level security;

-- Allow authenticated users to do everything
create policy "Allow all for authenticated users" 
  on your_table_name for all 
  using (auth.role() = 'authenticated');
```

2. Use Supabase client in your components:

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const supabase = createClient()
  // Your database operations here
}
```

## 📚 Usage Examples

### In Client Components

```typescript
'use client'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'

export function MyComponent() {
  const { user, loading, supabase } = useSupabaseAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return <div>Hello, {user.email}</div>
}
```

### In Server Components

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  const { data } = await supabase.from('posts').select('*')

  return <div>{/* Render data */}</div>
}
```

### In API Routes

#### User-Authenticated Operations (with RLS)

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('posts').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

#### Admin Operations (bypassing RLS)

For server-side operations that need to bypass Row Level Security:

```typescript
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  // This bypasses RLS - use only for admin/system operations
  const { data, error } = await supabase.from('posts').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

## 🔐 Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Always use Row Level Security (RLS)** on your tables
3. **Use Server Components** for sensitive operations
4. **Validate user input** before database operations
5. **Keep your Supabase keys secret** - Don't share them
6. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the browser - it bypasses RLS
7. **Use `createAdminClient()` only in API routes and Server Components** - never in client components
8. **Prefer `createClient()` over `createAdminClient()`** - only use admin client when you need to bypass RLS

## 📖 Next Steps

1. **Read the full documentation**: Check `SUPABASE.md` for detailed guides
2. **Configure authentication providers**: Enable Google, GitHub, etc. in Supabase Dashboard
3. **Create your database schema**: Plan and create your tables
4. **Build your app**: Use the hooks and client utilities to integrate Supabase

## 🆘 Troubleshooting

### "Invalid API key" error
- Check your `.env.local` file has the correct credentials
- Restart your dev server after adding environment variables

### "Failed to fetch" error
- Check your Supabase project URL is correct
- Verify your internet connection
- Check Supabase project status in dashboard

### Authentication not working
- Verify email confirmation settings in **Authentication** > **Settings**
- Check redirect URLs in **Authentication** > **URL Configuration**
- Add `http://localhost:3000/api/auth/callback` to allowed redirect URLs

### Database queries failing
- Check Row Level Security policies on your tables
- Verify user is authenticated before querying protected tables
- Check table and column names match your schema

## 💡 Pro Tips

1. **Use the Supabase CLI** for database migrations and local development
2. **Enable database backups** in Supabase dashboard
3. **Monitor your usage** to avoid hitting free tier limits
4. **Use TypeScript types** for better developer experience
5. **Test with different users** to verify RLS policies

## 📞 Support

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)

---

**Ready to build something amazing!** 🎉

