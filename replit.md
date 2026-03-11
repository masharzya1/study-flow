# Penzó — Smart Study Companion

## Overview

Penzó is a fully client-side React PWA (Progressive Web App) for studying and tracking academic progress. All data is stored in `localStorage` — no backend or database required. The app was originally built on Lovable and migrated to Replit.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State**: React Context + `localStorage` persistence
- **PWA**: vite-plugin-pwa (offline support, installable)
- **Animations**: Framer Motion
- **Charts**: Recharts

## Project Structure

```
src/
  App.tsx               # Root component, providers, routes
  main.tsx              # Entry point
  index.css             # Global styles
  contexts/
    StudyContext.tsx     # Main app state (subjects, sessions, plans, XP)
    LanguageContext.tsx  # i18n support
  pages/
    Dashboard.tsx        # Home screen with stats
    Subjects.tsx         # Subject management
    Timer.tsx            # Study timer (Pomodoro-style)
    StudyPlan.tsx        # AI-generated study plans
    CalendarView.tsx     # Calendar with session history
    Revision.tsx         # Revision topics
    Analytics.tsx        # Charts and analytics
    Settings.tsx         # App settings
  components/           # Reusable UI components
  types/study.ts        # Core TypeScript types
  data/focusMusic.ts    # Ambient music data
  i18n/translations.ts  # Multilingual strings
public/                 # Static assets (icons, robots.txt)
```

## Running the App

```bash
npm run dev    # Development server on port 5000
npm run build  # Production build
```

## Key Notes

- No backend — all data lives in `localStorage` under the key `studyforge_data`
- No authentication required
- PWA: installable on mobile and desktop
- No environment variables required

## Focus Mode & Distraction Guard (Task #5)

- **StudySession** now includes optional `distractionCount` and `focusScore` fields
- **AppSettings** has three Focus Guard toggles: `focusGuardFullscreen`, `focusGuardPledge`, `focusGuardAlerts` (all default true)
- **Timer.tsx**: Page Visibility API tracks tab switches as distractions; distraction overlay shows on return; fullscreen toggle button; Focus Pledge modal with 3-second countdown before sessions start; focus score = 100 - (distractionCount × 15), minimum 0; bonus +20 XP for perfect (100%) focus score
- **VictoryScreen.tsx**: Shows focus score (color-coded green/yellow/red), distraction count, and perfect focus bonus XP
- **Analytics.tsx**: Focus Quality section with average score, best perfect-focus streak, session count, and last-7-sessions bar chart
- **Settings.tsx**: Focus Guard toggle section with three switches (auto fullscreen, pre-session pledge, distraction alerts)
- **translations.ts**: All new strings added to both `en` and `bn` under `focus.*` namespace
