# Vercel Deployment Guide

## Environment Variables Setup

To deploy this application to Vercel, you need to configure the following environment variables in your Vercel project:

### Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Example: `https://your-project-id.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in your Supabase project settings under "API"

### How to Add Environment Variables in Vercel

1. **Go to your Vercel project dashboard**
2. **Click on "Settings" tab**
3. **Click on "Environment Variables" in the sidebar**
4. **Add the following variables:**

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key-here` | Production, Preview, Development |

5. **Click "Save"**

### Getting Your Supabase Credentials

1. **Go to your Supabase project dashboard**
2. **Click on "Settings" (gear icon)**
3. **Click on "API"**
4. **Copy the following:**
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon/public** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### After Adding Environment Variables

1. **Redeploy your application** in Vercel
2. **The build should now succeed** without the Supabase environment variable errors

### Database Setup

Make sure you've also set up your Supabase database with the schema from `supabase-schema.sql`:

1. **Go to your Supabase project**
2. **Click on "SQL Editor"**
3. **Run the SQL commands from `supabase-schema.sql`**

### Google OAuth Setup

If you're using Google OAuth:

1. **Configure Google OAuth in Supabase:**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials

2. **Add your domain to Supabase:**
   - Go to Authentication → URL Configuration
   - Add your Vercel domain to "Site URL" and "Redirect URLs"

### Troubleshooting

- **Build still failing?** Make sure the environment variables are added to all environments (Production, Preview, Development)
- **Database errors?** Ensure you've run the SQL schema in your Supabase project
- **Authentication issues?** Check that your Supabase project has Google OAuth configured correctly

## Example Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5ODc2MDAwMCwiZXhwIjoyMDE0MzM2MDAwfQ.example-key-here
```
