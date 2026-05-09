<div align="center">
  <img src="public/logo.png" alt="AcademIQ logo" width="96" />
  <h1>AcademIQ</h1>
  <p><strong>An AI study workspace that turns prompts, topics, and notes into structured lessons, roadmaps, quizzes, flashcards, projects, exports, and follow-up tutoring.</strong></p>
  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs" />
    <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white" />
    <img alt="Vercel" src="https://img.shields.io/badge/Vercel-ready-000000?logo=vercel" />
  </p>
</div>

## Overview

AcademIQ is a Next.js AI tutor app built around a multi-agent study workflow. A learner can enter a topic, question, or pasted/uploaded notes, choose a difficulty level and learning style, then generate a complete study pack with separate sections for instruction, planning, practice, review, and export.

The app supports guest sessions for quick local use. When Supabase Google auth is configured, signed-in users can save study sessions, reopen recent history, and export study sections to Google Docs through the user's Google provider token.

## Features

- Generate complete study packs from prompts and browser-readable file attachments.
- Choose Beginner, Intermediate, or Advanced output after submitting a topic.
- Switch between specialist agents: Professor, Academic Advisor, Research Librarian, Teaching Assistant, Flashcard Agent, Project Idea Agent, Quiz Generator, and Mentor Agent.
- Review Professor notes, roadmaps, resources, practice exercises, quizzes, progress milestones, project ideas, flashcards, and a mind map.
- Ask streaming follow-up questions with the generated study pack as mentor context.
- Search YouTube tutorials when `YOUTUBE_API_KEY` is configured.
- Export as Markdown, Anki CSV, mind map HTML, print/PDF, or Google Docs.
- Save up to 30 recent authenticated sessions through Supabase.
- Use light and dark themes.

## Tech Stack

| Layer | Tools |
| --- | --- |
| App | Next.js 15, React 19, TypeScript |
| UI | Custom CSS, lucide-react icons |
| AI | Groq OpenAI-compatible chat completions |
| Auth and storage | Supabase Auth, Supabase Postgres REST |
| Integrations | YouTube Data API, Google Drive API for Docs export |
| Hosting | Vercel Analytics, Speed Insights, Vercel config |

## Quick Start

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add at least `GROQ_API_KEY`, then start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Only `GROQ_API_KEY` is required for the core guest-mode study-pack and mentor flows.

```bash
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL_ID=llama-3.3-70b-versatile

YOUTUBE_API_KEY=your_youtube_data_api_key_here

SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

STUDY_PACK_RATE_LIMIT=8
STUDY_PACK_RATE_LIMIT_WINDOW_MS=60000
MENTOR_RATE_LIMIT=20
MENTOR_RATE_LIMIT_WINDOW_MS=60000
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Generates study packs and mentor responses. |
| `GROQ_MODEL_ID` | No | Overrides the Groq model. Defaults to `llama-3.3-70b-versatile`. |
| `YOUTUBE_API_KEY` | No | Enables YouTube tutorial search inside generated resources. |
| `SUPABASE_URL` | No | Enables Google sign-in and cloud session history when paired with the service role key. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-side Supabase key used for auth profile checks and session persistence. |
| `STUDY_PACK_RATE_LIMIT` | No | Requests per rate-limit window for `/api/study-pack`. Defaults to `8`. |
| `STUDY_PACK_RATE_LIMIT_WINDOW_MS` | No | Study-pack rate-limit window in milliseconds. Defaults to `60000`. |
| `MENTOR_RATE_LIMIT` | No | Requests per rate-limit window for `/api/mentor`. Defaults to `20`. |
| `MENTOR_RATE_LIMIT_WINDOW_MS` | No | Mentor rate-limit window in milliseconds. Defaults to `60000`. |

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not expose it with a `NEXT_PUBLIC_` prefix.

## Supabase Setup

Supabase is optional, but it is needed for Google sign-in and saved cloud history.

1. Create a Supabase project.
2. Run [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) in the Supabase SQL editor.
3. Enable Google as an auth provider in Supabase.
4. Add local and deployed app URLs to the allowed redirect URLs, for example:

```text
http://localhost:3000
https://your-vercel-app.vercel.app
```

Google sign-in requests the `email`, `profile`, and `https://www.googleapis.com/auth/drive.file` scopes. The Drive scope is used by `/api/google-doc` to create Google Docs exports for signed-in users.

## Scripts

```bash
npm run dev        # Start the local Next.js server
npm run build      # Create a production build
npm run start      # Run the production build
npm run typecheck  # Check TypeScript without emitting files
```

## Project Map

```text
src/app/
  page.tsx                         Main AcademIQ workspace
  layout.tsx                       Metadata, analytics, speed insights
  globals.css                      Application styling and themes
  api/
    study-pack/route.ts            Groq-powered study pack generator
    mentor/route.ts                Streaming follow-up tutoring endpoint
    sessions/route.ts              Supabase-backed session persistence
    google-doc/route.ts            Google Docs export via Google Drive API
    auth/
      google/start/route.ts        Supabase Google OAuth redirect
      profile/route.ts             Signed-in profile lookup
  components/                      Workspace panels, tabs, modals, and controls
  context/StudyContext.tsx         Shared study session context type
  hooks/useStudySession.ts         Auth, session, generation, quiz, export, and mentor state
  lib/                             Types, constants, export helpers, rate limiting, client utilities

public/
  logo.png                         App logo

SUPABASE_SCHEMA.sql                Database schema for saved sessions
VERCEL_DEPLOYMENT.md               Deployment checklist
```

## Deployment

AcademIQ is ready for Vercel. Add the environment variables in Vercel Project Settings, deploy the Next.js app, then confirm the main flows:

1. Guest study-pack generation works with `GROQ_API_KEY`.
2. Mentor follow-up chat streams a response.
3. YouTube resources appear when `YOUTUBE_API_KEY` is set.
4. Google sign-in works when Supabase is configured.
5. Signed-in study sessions save and reload from Supabase.
6. Google Docs export works after signing in with Google.

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for a longer deployment checklist.

## License

Private project. Add a license before publishing publicly.
