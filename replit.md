# Penzó — Smart Study Companion

## Overview

Penzó is a React PWA (Progressive Web App) for studying and tracking academic progress. Study data is stored in `localStorage`. Firebase handles authentication (Google Sign-In) and Firestore stores per-user file metadata. Images are hosted on imgbb. The app was originally built on Lovable and migrated to Replit.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State**: React Context + `localStorage` persistence
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firestore (per-user file links)
- **Image Upload**: imgbb API
- **PWA**: vite-plugin-pwa (offline support, installable)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: lucide-react + react-icons

## Environment Variables / Secrets

All Firebase and imgbb credentials are stored as Replit secrets (VITE_* prefix for frontend):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_IMGBB_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (server-side, for future backend use)

## Project Structure

```
src/
  App.tsx               # Root component, providers, routes, auth guard
  main.tsx              # Entry point
  index.css             # Global styles
  lib/
    firebase.ts         # Firebase app, auth, db, googleProvider
  contexts/
    StudyContext.tsx     # Main app state (subjects, sessions, plans, XP)
    LanguageContext.tsx  # i18n support (en/bn)
    AuthContext.tsx      # Firebase auth state, Google sign-in/out
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
    Settings.tsx         # App settings
  components/           # Reusable UI components
  types/study.ts        # Core TypeScript types
  data/focusMusic.ts    # Ambient music data
  i18n/translations.ts  # Multilingual strings (en/bn)
public/                 # Static assets (icons, robots.txt)
```

## Running the App

```bash
npm run dev    # Development server on port 5000
npm run build  # Production build
```

## Key Notes

- Study data lives in `localStorage` under the key `studyforge_data`
- Auth is required — unauthenticated users see the Login page
- Files page: upload images via imgbb, links stored in Firestore at `users/{uid}/files`
- PWA: installable on mobile and desktop
- Firestore security rules should be set to allow read/write only for authenticated users on their own `users/{uid}/**` path

## Focus Mode & Distraction Guard (Task #5)

- **StudySession** now includes optional `distractionCount` and `focusScore` fields
- **AppSettings** has three Focus Guard toggles: `focusGuardFullscreen`, `focusGuardPledge`, `focusGuardAlerts` (all default true)
- **Timer.tsx**: Page Visibility API tracks tab switches as distractions (always counted, overlay only when alerts enabled); distraction overlay shows active topic name on return; fullscreen toggle button; Focus Pledge modal with 3-second countdown before sessions start; focus score = 100 - (distractionCount × 10), minimum 0; bonus +20 XP for perfect (100%) focus score
- **VictoryScreen.tsx**: Shows focus score (color-coded green/yellow/red), distraction count, and perfect focus bonus XP
- **Analytics.tsx**: Focus Quality section with avg score (last 7 days), best perfect-focus streak, session count, and last-14-sessions bar chart
- **Settings.tsx**: Focus Guard toggle section with three switches (auto fullscreen, pre-session pledge, distraction alerts)
- **translations.ts**: All new strings added to both `en` and `bn` under `focus.*` namespace
