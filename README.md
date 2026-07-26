# UPSC via PYQs — Next.js Handoff & Architecture Guide

Welcome to the modernized **UPSC via PYQs** application. This project has been fully migrated from a collection of static HTML/JS scripts into a production-ready, performant, and premium **Next.js + TypeScript + Material-UI (MUI)** web application, fully integrated with **Supabase** for database content and authentication.

---

##  Quickstart: Local Development

### 1. Prerequisites
- **Node.js** (v18.x or above)
- **NPM** (v9.x or above)

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Run Development Server
Start the Next.js local server on `http://localhost:3000`:
```bash
npm run dev
```

### 4. Build for Production
Verify typescript compilation and build the optimized production pages:
```bash
npm run build
```

---

##  Architecture & Core Components

The application follows Next.js App Router structure:

```
├── .env.local             # Local Supabase credentials
├── data/                  # Static mock database JSON files
├── public/                # Vendor dependencies, fonts, and icons
├── src/
│   ├── app/               # Next.js App router (prelims, mains, optional, practice, dashboard)
│   ├── components/        # Shared components, Providers, MathContent, and Navbar
│   ├── hooks/             # useContent.ts (React Query hooks for database entities)
│   ├── lib/               # md.ts (markdown parsers and grading), supabase.ts (client)
│   ├── store/             # useStore.ts (Zustand state store for user attempts and bookmarks)
│   └── theme/             # theme.ts (Light and Dark MUI themes)
```

### 1. Hybrid Data Gating (`src/hooks/useContent.ts`)
The app uses a hybrid querying strategy to serve content based on the user's paywall entitlement status:
- **Free content (Public):** Loaded locally from `/public/data/*.json` to ensure blazing-fast SEO rendering.
- **Paid content (PostgreSQL):** Pulled from protected Supabase tables (`paid_prelims`, `paid_mains`, `paid_optional`, `paid_frameworks`) using **Row-Level Security (RLS)** which returns records only if the user holds an active subscription entitlement.

### 2. State & Persistence (`src/store/useStore.ts`)
User stats, bookmark tags, revision flags, themes, and session tracking are managed globally via **Zustand** with persistent local storage.

---

##  Key Features & Improvements Added

### 1. Interactive Mains & Optional Outline Drills
- **"Try first" Action Canvas:** Users can click `✍️ Try first` on any Mains or Optional card to type a study outline instead of immediately looking at the answers. Includes a live word counter.
- **Key-Point Grading Loop:** Upon clicking `Submit & check →`, the app runs an active recall regex keyword scan comparing the user's drafted points against the model answer outline. Hits and misses are displayed as high-contrast chips.
- **High-Contrast Dark Mode Outlines:** Enhanced contrast for dark mode outlines using theme-aware border variables (`rgba(255,255,255,0.15)`) and custom container backgrounds (`#1C2541`) for reading comfort.

### 2. Interactive Practice Test Modules
- **Immediate Submit & Next Mechanics:** In the Prelims practice quiz, selecting an option and clicking `Submit & next →` instantly registers the result and advances to the next question, preserving a real exam-taking flow.
- **Review & Reflect Dashboard:** At the end of the test, the score screen displays the percentage score alongside an accordion review layout. Users can expand each question card to view the exact chosen option, correct answer, and KaTeX mathematical explanation formulas.
- **Mains Multi-Question Configuration:** Configure word limits, topics, question counts (`3`, `5`, `10`), and timed countdown modes prior to launching a multi-question drill session.

### 3. Vercel & Production Build Optimizations
- **SSR Query Client Provider:** Set up query client wrapping inside `Providers.tsx` during static compilation to prevent prerendering bailout failures.
- **Suspense Boundary Wrappers:** Encapsulated page hooks in `<Suspense>` boundaries to ensure static exports compile with no errors.

---
