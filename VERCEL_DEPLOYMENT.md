# Deploy AcademIQ to Vercel

AcademIQ is a Vercel-ready Next.js app with the same major features as the previous Streamlit app: multi-agent study packs, chat history, follow-up mentoring, resources, YouTube tutorials, quiz grading, progress tracking, flashcards, projects, exports, mind maps, Google Docs export, and optional Supabase persistence.

## 1. Install Dependencies

```bash
npm install
```

## 2. Local Environment

Create `.env.local` for Next.js local development:

```bash
GROQ_API_KEY=your_real_groq_key
GROQ_MODEL_ID=llama-3.3-70b-versatile
YOUTUBE_API_KEY=your_youtube_data_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
COMPOSIO_API_KEY=your_composio_key
COMPOSIO_CONNECTED_ACCOUNT_ID=your_composio_connected_account_id
```

Required:

- `GROQ_API_KEY`

Optional feature keys:

- `GROQ_MODEL_ID`: choose a Groq model; defaults to `llama-3.3-70b-versatile`.
- `YOUTUBE_API_KEY`: enables YouTube tutorial search.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: enable cloud study-session history.
- `COMPOSIO_API_KEY` and `COMPOSIO_CONNECTED_ACCOUNT_ID`: enable Google Docs export.

The app still works with only `GROQ_API_KEY`; local browser storage is used if Supabase is not configured.

## 3. Supabase Setup

If you want cloud history, open Supabase SQL Editor and run:

```sql
-- See SUPABASE_SCHEMA.sql in this repo.
```

Use the SQL from `SUPABASE_SCHEMA.sql`.

Important: `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side in Vercel environment variables. Do not expose it as `NEXT_PUBLIC_*`.

## 4. Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 5. Test Production Build

```bash
npm run build
```

## 6. Push to GitHub

```bash
git init
git add .
git commit -m "Build AcademIQ Vercel app"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 7. Import Into Vercel

1. Go to Vercel.
2. Choose **Add New Project**.
3. Import the GitHub repo.
4. Framework preset: **Next.js**.
5. Root directory: repository root.
6. Install command: `npm install`.
7. Build command: `npm run build`.

## 8. Add Vercel Environment Variables

Add the same variables from `.env.local` in **Project Settings -> Environment Variables**.

Use Production, Preview, and Development environments if you want all deployments to work.

## 9. Deploy

Click **Deploy**. After deployment, open the Vercel URL and submit a learning request.

## Feature Map

- Study pack generation: `app/api/study-pack/route.ts`
- Mentor follow-up chat: `app/api/mentor/route.ts`
- Google Docs export: `app/api/google-doc/route.ts`
- Supabase session persistence: `app/api/sessions/route.ts`
- Dashboard UI: `app/page.tsx`
