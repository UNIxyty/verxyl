# Verxyl Ticket Management Platform

A comprehensive ticket management platform for teams with AI prompt and N8N workflow backup capabilities.

## Features

### Ticket Management
- **Create Tickets**: Create new tickets with title, urgency, deadline, details, and assignee
- **My Tickets**: View and manage tickets assigned to you
- **Ticket Workflow**: New → In Progress → Completed with solution tracking
- **Solution Types**: Support for AI Prompts, N8N Workflows, and Other solutions

### Backup Systems
- **AI Prompt Backup**: Save and manage AI prompts with version tracking
- **N8N Project Backup**: Backup and version control N8N workflows
- **JSON Editor**: Built-in Monaco editor for JSON editing with syntax highlighting

### User Management
- **Google Authentication**: Secure login with Google OAuth
- **Profile Management**: Update username, avatar, and Telegram integration
- **Dark Theme**: Modern dark UI with responsive design

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **UI Components**: Headless UI, Heroicons
- **Code Editor**: Monaco Editor
- **Notifications**: React Hot Toast

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google OAuth credentials

### 2. Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Enable Google OAuth in Authentication > Providers
4. Add your domain to the allowed origins

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 5. Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### 6. Database Schema

Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor to create the required tables and policies.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication callbacks
│   ├── dashboard/         # Main dashboard
│   ├── create-ticket/     # Create ticket page
│   ├── my-tickets/        # My tickets page
│   ├── completed/         # Completed tickets page
│   ├── ai-backups/        # AI prompt backups
│   ├── n8n-backups/       # N8N project backups
│   ├── profile/           # User profile page
│   └── login/             # Login page
├── components/            # Reusable components
│   ├── AuthProvider.tsx   # Authentication context
│   ├── Navigation.tsx     # Side navigation
│   ├── Modal.tsx          # Modal component
│   ├── CreateTicketModal.tsx
│   ├── CompleteTicketModal.tsx
│   ├── AIPromptBackupModal.tsx
│   └── N8NProjectBackupModal.tsx
├── lib/                   # Utility functions
│   ├── supabase.ts        # Supabase client
│   ├── auth.ts           # Authentication utilities
│   └── database.ts       # Database operations
└── supabase-schema.sql   # Database schema
```

## Key Features Explained

### Ticket Workflow
1. **Create**: Users create tickets with details and assign them
2. **Assigned**: Tickets appear in "My Tickets" for the assignee
3. **Start Work**: Assignee can start working on the ticket
4. **Complete**: Assignee completes the ticket with solution details

### Backup Systems
- **AI Prompts**: Save prompts with AI model, output logic, and results
- **N8N Workflows**: Backup complete workflow JSON with version tracking
- **Version Control**: Link to previous versions for change tracking

### Authentication Flow
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. After authentication, redirected to Supabase callback
4. User profile created/updated in database
5. Redirected to dashboard

## Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `app/globals.css` for global styles
- Component styles use Tailwind classes

### Database
- Extend `lib/supabase.ts` for additional tables
- Update `lib/database.ts` for new operations
- Modify policies in Supabase for access control

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
- Ensure environment variables are set
- Build command: `npm run build`
- Start command: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
# verxyl
