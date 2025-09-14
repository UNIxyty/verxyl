# Required Environment Variables

## For Vercel Deployment

Make sure you have these environment variables set in your Vercel project:

### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for API routes)
- `WEBHOOK_URL` - Your webhook endpoint URL

### How to get the Service Role Key:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (not the anon key)
4. Add it to your Vercel environment variables as `SUPABASE_SERVICE_ROLE_KEY`

### Why the Service Role Key is needed:
The API routes use the service role key to bypass Row Level Security (RLS) policies when performing server-side operations like deleting, editing, and completing tickets. This ensures the operations work regardless of the user's authentication context.

**Important**: Keep the service role key secure and never expose it in client-side code!
