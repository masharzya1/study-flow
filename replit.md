# Penzó — Smart Study Companion

## Overview

Penzó is a React PWA (Progressive Web App) for studying and tracking academic progress. Firebase handles authentication (Google Sign-In), Firestore stores all user data (study state, sessions, files, FCM tokens), and images are hosted on imgbb. A minimal Express backend handles FCM push notification sending (requires server-side Firebase Admin SDK). The app was originally built on Lovable and migrated to Replit.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State**: React Context + Firestore sync + `localStorage` fallback
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firestore (all user data, study sessions, FCM tokens, notifications)
- **Image Upload**: imgbb API
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Backend**: Minimal Express server (port 3001) — only for FCM notification sending
- **PWA**: vite-plugin-pwa (offline support, installable)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: lucide-react + react-icons

## Environment Variables / Secrets

All Firebase and imgbb credentials are stored as Replit secrets (VITE_* prefix for frontend):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_VAPID_KEY` (for FCM push notifications — needs to be set from Firebase Console)
- `VITE_IMGBB_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (server-side, for Firebase Admin SDK)

## Firestore Collections

- `users/{uid}` — user profile (displayName, email, photoURL, isAdmin, createdAt, lastActiveAt)
- `studyData/{uid}` — study state JSON blob (subjects, sessions, plans, XP, settings)
- `studySessions/{auto}` — individual study sessions with uid field (for admin analytics)
- `fcmTokens/{uid}` — FCM push notification tokens
- `notifications/{auto}` — notification history (sent by admin)

## Project Structure

```
src/
  App.tsx               # Root component, providers, routes, auth guard
  main.tsx              # Entry point
  index.css             # Global styles
  lib/
    firebase.ts         # Firebase app, auth, db, googleProvider, messaging
    firestoreService.ts # All Firestore CRUD operations
  contexts/
    StudyContext.tsx     # Main app state (Firestore sync + localStorage fallback)
    LanguageContext.tsx  # i18n support (en/bn)
    AuthContext.tsx      # Firebase auth state, Google sign-in/out, isAdmin
  hooks/
    useFCM.ts           # Firebase Cloud Messaging hook (permission, token registration)
  pages/
    Login.tsx            # Google sign-in page (shown when unauthenticated)
    Dashboard.tsx        # Home screen with stats
    Subjects.tsx         # Subject management
    Timer.tsx            # Study timer (Pomodoro-style)
    StudyPlan.tsx        # AI-generated study plans
    CalendarView.tsx     # Calendar with session history
    Revision.tsx         # Revision topics
    Analytics.tsx        # Charts and analytics
    Files.tsx            # Personal file/image upload (imgbb + Firestore)
    Admin.tsx            # Admin panel (users, notifications, analytics)
    Settings.tsx         # App settings
  components/
    AppLayout.tsx        # Sidebar nav with admin link + notification bell
  types/study.ts        # Core TypeScript types
  data/focusMusic.ts    # Ambient music data
  i18n/translations.ts  # Multilingual strings (en/bn)
server/
  index.ts              # Minimal Express server for FCM notification sending
  firebaseAdmin.ts      # Firebase Admin SDK init (auth, messaging, firestore)
public/
  firebase-messaging-sw.js  # FCM service worker
```

## Running the App

- **Start application** workflow: `npm run dev` — Vite dev server on port 5000
- **Backend Server** workflow: `npx tsx server/index.ts` — Express on port 3001
- Vite proxies `/api/*` requests to the backend server

## Key Notes

- Study data syncs to Firestore with 2-second debounce, falls back to localStorage when offline
- Auth is required — unauthenticated users see the Login page
- Admin users identified by `isAdmin: true` in their Firestore `users/{uid}` document (first admin must be set directly in Firestore)
- Admin panel visible only to admin users (Shield icon in sidebar nav)
- FCM push notifications require `VITE_FIREBASE_VAPID_KEY` from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
- Notification sending goes through the Express backend (server-side Firebase Admin SDK)
- Files page: upload images via imgbb, links stored in Firestore at `users/{uid}/files`
- PWA: installable on mobile and desktop
- Firestore security rules should allow read/write only for authenticated users on their own data paths

## Focus Mode & Distraction Guard

- **StudySession** includes optional `distractionCount` and `focusScore` fields
- **AppSettings** has Focus Guard toggles: `focusGuardFullscreen`, `focusGuardPledge`, `focusGuardAlerts`
- **Timer.tsx**: Page Visibility API tracks tab switches; fullscreen toggle; Focus Pledge modal; focus score = 100 - (distractionCount × 10)
- **VictoryScreen.tsx**: Shows focus score, distraction count, and perfect focus bonus XP
- **Analytics.tsx**: Focus Quality section with avg score, best streak, bar chart
