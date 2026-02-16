# 📚 Attendee - Smart Attendance Tracking System

A modern, full-stack attendance tracking application built with Next.js 15, Firebase, and NextAuth.js. Perfect for students to track their class attendance, monitor semester statistics, and ensure they meet minimum attendance requirements.

## ✨ Features

### 📊 **Dashboard**
- **Real-time Statistics**: View overall semester attendance percentage, conducted classes, and attended classes
- **At-Risk Alerts**: Automatic warnings when attendance falls below minimum requirement (default: 75%)
- **Today's Classes**: Quick view of all classes scheduled for today with instant marking capability
- **Subject-wise Breakdown**: Detailed table showing attendance stats for each subject
- **Smart Calculations**: Shows how many classes needed to reach minimum attendance threshold

### 📅 **Calendar View**
- **Monthly Calendar**: Visual representation of attendance across the entire month
- **Color-coded Indicators**: 
  - 🟢 Green dots for present
  - 🔴 Red dots for absent
  - 🔵 Blue for future dates
  - ⚪ Gray for holidays
- **Month Navigation**: Easy navigation between months to review past attendance

### ✅ **Attendance Marking**
- **Quick Actions**: Mark individual classes as present or absent
- **Bulk Operations**: Mark all classes for the day as present with one click
- **Validation**: Prevents marking attendance for holidays
- **Real-time Updates**: Instant reflection of changes across all views

### ⚙️ **Settings & Configuration**
- **Semester Management**: Configure semester start and end dates
- **Timetable Setup**: Define your class schedule by weekday
- **Holiday Management**: Mark individual dates or date ranges as holidays
- **Subject Configuration**: Add/edit subjects with IDs and names
- **Minimum Attendance**: Set custom minimum attendance percentage requirement

### 🔐 **Authentication & Security**
- **Google OAuth**: Secure sign-in with Google accounts
- **Email Whitelisting**: Restrict access to specific email addresses
- **Firestore Security Rules**: Backend data protection with granular permissions
- **Session Management**: Secure session handling with NextAuth.js

### 📱 **Modern UI/UX**
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Server Components**: Fast initial page loads with React Server Components
- **Loading States**: Proper loading indicators and pending states
- **Error Handling**: User-friendly error messages and validation
- **Clean Interface**: Minimalist design for better focus and usability

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Validation**: [Zod](https://zod.dev/)
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm (recommended) / npm / yarn

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **pnpm** (recommended) or npm
  ```bash
  npm install -g pnpm
  ```
- **Firebase Account** ([Create one](https://firebase.google.com/))
- **Google Cloud Project** (for OAuth)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/attendee.git
cd attendee
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 3. Firebase Setup

#### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard
4. Enable **Firestore Database** in the Firebase console
5. Enable **Authentication** > **Google** sign-in provider

#### Get Firebase Credentials

**For Client SDK:**
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Click on the web icon (</>) to create a web app
4. Copy the config values (apiKey, authDomain, projectId, appId)

**For Admin SDK:**
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely (DON'T commit this to git!)
4. Extract: `project_id`, `client_email`, and `private_key`

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**

### 5. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Auth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here  # Generate: openssl rand -base64 32
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALLOWED_EMAILS=your-email@gmail.com,another@gmail.com  # Comma-separated
APP_TIMEZONE=Asia/Kolkata  # Or your timezone

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Important Notes:**
- Replace all placeholder values with your actual credentials
- Keep the newline characters (`\n`) in `FIREBASE_PRIVATE_KEY`
- Never commit `.env.local` to version control
- Use strong, unique values for `NEXTAUTH_SECRET`

### 6. Deploy Firestore Security Rules

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy security rules
firebase deploy --only firestore:rules
```

### 7. Run Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
attendee/
├── app/
│   ├── (protected)/          # Protected routes (requires auth)
│   │   ├── layout.tsx        # Protected layout wrapper
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── calendar/         # Calendar view
│   │   ├── mark/             # Quick attendance marking
│   │   ├── settings/         # App configuration
│   │   └── simulator/        # Testing utilities
│   ├── (public)/             # Public routes
│   │   └── login/            # Login page
│   ├── api/
│   │   ├── auth/             # NextAuth.js routes
│   │   └── health/           # Health check endpoints
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── auth/                 # Authentication utilities
│   ├── calendar/             # Calendar logic
│   ├── config/               # Configuration
│   ├── constants/            # Constants
│   ├── date/                 # Date utilities
│   ├── firebase/             # Firebase setup
│   ├── firestore/            # Firestore operations
│   ├── stats/                # Statistics calculations
│   └── validators/           # Zod schemas
├── public/                   # Static assets
├── scripts/                  # Utility scripts
├── types/                    # TypeScript type definitions
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── auth.ts                   # NextAuth configuration
├── firebase.json             # Firebase config
├── firestore.indexes.json    # Firestore indexes
├── firestore.rules           # Security rules
├── middleware.ts             # Next.js middleware
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

## 📜 Available Scripts

```bash
# Development
pnpm dev              # Start dev server at http://localhost:3000

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking

# Utilities
pnpm holidays:one-time-break  # Mark a date range as holiday
```

### Custom Scripts

**Set Holiday Range:**
```bash
node scripts/set-holiday-range.mjs 2026-02-10 2026-02-17 "Winter Break"
```

## 🔧 Configuration

### Semester Settings
1. Navigate to **Settings** in the app
2. Set semester start and end dates
3. Configure minimum attendance percentage (default: 75%)

### Timetable
1. Go to **Settings** > **Timetable**
2. Add subjects with IDs and names
3. Assign subjects to specific days and time slots

### Holidays
1. Go to **Settings** > **Holidays**
2. Mark individual dates or ranges as holidays
3. Use the script for bulk holiday creation

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com/)
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

Works with any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security

- ✅ Firestore security rules enforce data access control
- ✅ Email whitelisting restricts unauthorized access
- ✅ Server-side validation with Zod schemas
- ✅ Environment variables for sensitive data
- ✅ NextAuth.js for secure authentication
- ✅ HTTPS required in production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and for educational purposes.

## 🐛 Issues

Found a bug? Please open an issue on GitHub with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📧 Support

For questions or support, please create an issue in the repository.

---

**Built with ❤️ using Next.js and Firebase**
