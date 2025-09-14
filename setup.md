# Quick Setup Guide

## ✅ Your Environment is Ready!

Your `.env.local` file is already configured with your Supabase credentials. Now you just need to:

### 1. Set up your Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/pdxaxlyghadmsuixeaha
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to create all tables and policies

### 2. Configure Google OAuth in Supabase

1. In your Supabase dashboard, go to **Authentication > Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Get these from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials if you haven't already
   - Add redirect URI: `https://pdxaxlyghadmsuixeaha.supabase.co/auth/v1/callback`

### 3. Start the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. Test the Application

1. Visit http://localhost:3000
2. Click "Sign in with Google"
3. Complete the OAuth flow
4. You should be redirected to the dashboard

## 🎉 You're All Set!

Your ticket management platform is now ready to use with:
- ✅ Google Authentication
- ✅ Dark theme UI
- ✅ Ticket management workflow
- ✅ AI prompt backups
- ✅ N8N project backups
- ✅ User profiles with Telegram integration

## 🔧 Troubleshooting

If you encounter any issues:

1. **Database errors**: Make sure you ran the SQL schema
2. **Auth errors**: Check your Google OAuth configuration in Supabase
3. **Build errors**: Run `npm install` again
4. **TypeScript errors**: Run `npx tsc --noEmit` to check

## 📱 Features Available

- **Create Tickets**: Assign tickets to team members
- **My Tickets**: View and manage assigned tickets
- **Completed Tickets**: Track completed work with solutions
- **AI Prompts**: Backup and version control AI prompts
- **N8N Projects**: Backup and manage N8N workflows
- **Profile**: Manage username and Telegram integration
