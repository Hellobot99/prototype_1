# Smart Course Scheduler

An AI-powered course scheduling web application for students at Shibaura Institute of Technology (SIT).

## Features

- **Timetable Builder** — Browse the SIT course catalog and build your semester schedule visually
- **AI Schedule Suggestion** — Describe your academic goals in natural language and get a personalized course recommendation powered by LLaMA 3.3 70B
- **Career Explorer** — Enter a field of interest to discover related career paths, required skills, example companies, and salary ranges in Japan
- **Career Path Courses** — Get course recommendations tailored to your chosen career goal
- **Course Reviews** — Read and submit ratings and comments for courses

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes (serverless)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security + Supabase Auth)
- **AI**: Groq API with LLaMA 3.3 70B

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### Installation

```bash
git clone <repo-url>
cd prototype_1
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/ai/          # AI route handlers (schedule, careers, career-path)
│   ├── career/          # Career Explorer page
│   ├── courses/         # Course catalog page
│   ├── dashboard/       # Timetable & AI schedule builder
│   ├── login/           # Authentication
│   └── reviews/         # Course reviews
├── lib/
│   └── supabase/        # Supabase client (browser + server)
└── proxy.ts
supabase/
└── schema.sql           # Database schema and RLS policies
```
