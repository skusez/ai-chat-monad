# Google Authentication Setup

This project has been updated to use Google OAuth for authentication instead of email/password login.

## Changes Made

1. Removed email/password authentication from the codebase
2. Added Google OAuth authentication using NextAuth.js
3. Updated the login and register pages to use Google authentication
4. Removed the password field from the user schema

## Setup Instructions

To set up Google OAuth authentication, follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add your application name
7. Add authorized JavaScript origins:
   - For development: `http://localhost:3000`
   - For production: Your production URL
8. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-production-url.com/api/auth/callback/google`
9. Click "Create"
10. Copy the Client ID and Client Secret
11. Add them to your `.env.local` file:
    ```
    AUTH_GOOGLE_ID=your_client_id
    AUTH_GOOGLE_SECRET=your_client_secret
    ```

## How It Works

When a user clicks the "Continue with Google" button, they are redirected to Google's authentication page. After successful authentication, Google redirects back to your application with an authentication code. NextAuth.js handles this code exchange and creates a session for the user.

The user's information (name, email, profile picture) is stored in the database, and they are redirected to the home page.

## Files Modified

- `app/(auth)/actions.ts` - Removed email/password authentication
- `app/(auth)/login/page.tsx` - Updated to use Google authentication
- `app/(auth)/register/page.tsx` - Updated to use Google authentication
- `components/auth-form.tsx` - No longer used
- `components/google-auth-button.tsx` - Added for Google authentication
- `components/google-auth-form.tsx` - Added for Google authentication
- `lib/db/schema.ts` - Removed password field from user schema
- `.env.example` - Added Google OAuth credentials
