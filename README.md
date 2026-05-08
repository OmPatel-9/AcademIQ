<div align="center">
  <img src="public/logo.png" alt="AcademIQ logo" width="96" />
  <h1>AcademIQ</h1>
  <p><strong>A focused AI study workspace for lessons, roadmaps, quizzes, flashcards, projects, exports, and saved tutoring sessions.</strong></p>
  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs" />
    <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white" />
    <img alt="Vercel" src="https://img.shields.io/badge/Vercel-ready-000000?logo=vercel" />
  </p>
</div>

## The Idea

AcademIQ turns a topic, question, or pasted notes into a complete learning workspace. Instead of returning one long answer, it builds a structured study pack with specialist sections for teaching, planning, practice, resources, review, and follow-up mentoring.

Use it as a guest for a quick temporary workspace, or sign in with Google to save sessions through Supabase.

## What It Can Do

- Generate full study packs from prompts or readable attachments.
- Switch between specialist agents: Professor, Academic Advisor, Research Librarian, Teaching Assistant, Flashcard Agent, Project Idea Agent, Quiz Generator, and Mentor Agent.
- Build roadmaps, curated resources, practice materials, multiple-choice quizzes, Anki-ready flashcards, portfolio project ideas, and progress checklists.
- Ask follow-up mentor questions using the current study pack as context.
- Search YouTube tutorials when a YouTube Data API key is configured.
- Export study packs as Markdown, Anki CSV, printable PDF, mind map HTML, or Google Docs.
- Save Google-authenticated sessions with Supabase, while guest sessions stay local to the browser.
- Toggle light and dark themes.

## Tech Stack

| Layer | Tools |
| --- | --- |
| App | Next.js 15, React 19, TypeScript |
| UI | Custom CSS, lucide-react icons |
| AI | Groq OpenAI-compatible chat completions |
| Auth and storage | Supabase Auth, Supabase Postgres REST |
| Integrations | YouTube Data API, Composio Google Docs action |
| Hosting | Vercel Analytics, Speed Insights, Vercel deployment config |

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production sanity check:

```bash
npm run typecheck
npm run build
```

## Environment Variables

Create `.env.local` from `.env.example` and fill in what you need:

```bash
GROQ_API_KEY=your_groq_key_here
GROQ_MODEL_ID=llama-3.3-70b-versatile
YOUTUBE_API_KEY=your_youtube_data_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
COMPOSIO_API_KEY=your_composio_key_here
COMPOSIO_CONNECTED_ACCOUNT_ID=your_composio_connected_account_id_here
```

Only `GROQ_API_KEY` is required for the core study-pack and mentor flows. YouTube, Supabase, and Composio unlock optional integrations.

## Supabase Setup

Run [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) in your Supabase SQL editor to create the `academiq_sessions` table and service-role policy.

For Google sign-in, configure Google as a Supabase auth provider and make sure your local and deployed app URLs are allowed redirect URLs in Supabase.

## Useful Scripts

```bash
npm run dev        # Start the local Next.js server
npm run build      # Create a production build
npm run start      # Run the production build
npm run typecheck  # Check TypeScript without emitting files
```

## Project Map

```text
app/
  page.tsx                         Main AcademIQ workspace UI
  layout.tsx                       Metadata, analytics, speed insights
  globals.css                      Application styling and themes
  api/
    study-pack/route.ts            Groq-powered study pack generator
    mentor/route.ts                Follow-up tutoring endpoint
    sessions/route.ts              Supabase-backed session persistence
    google-doc/route.ts            Google Docs export via Composio
    auth/
      google/start/route.ts        Supabase Google OAuth redirect
      profile/route.ts             Signed-in profile lookup
public/
  logo.png                         App logo used by the UI and README
SUPABASE_SCHEMA.sql                Database schema for saved sessions
VERCEL_DEPLOYMENT.md               Deployment checklist
```

## Deployment

This project is Vercel-ready. Add the same environment variables in Vercel Project Settings, deploy, then use [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for the final integration checklist.

## License

Private project. Add a license before publishing publicly.
