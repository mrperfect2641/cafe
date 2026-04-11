## Project Overview

`app-next` is a production-ready Next.js (App Router) starter for a cafe management system:
authentication (NextAuth + bcrypt), Prisma + PostgreSQL models, Prisma seed data, role-based route protection,
and a modern SaaS dashboard shell.

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS (v4) + shadcn/ui
- Prisma + PostgreSQL
- NextAuth (JWT sessions) + bcrypt (password hashing)
- Zustand, react-hook-form, zod, recharts (added for feature-by-feature development)

## Setup Instructions

1. Install dependencies:

   ```bash
   cd app-next
   npm install
   ```

2. Create environment variables:
   - `app-next/.env`
     ```env
     DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
     ```
   - `app-next/.env.local`
     ```env
     NEXTAUTH_URL=http://localhost:3000
     NEXTAUTH_SECRET=change-me-in-production
     ```

3. Initialize the database:

   ```bash
   npm run db:setup
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build Next.js app
- `npm run start` - Start Next.js production server
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier
- `npm run format:check` - Prettier check

Prisma:

- `npm run db:generate` - `prisma generate`
- `npm run db:migrate` - `prisma migrate dev`
- `npm run db:push` - `prisma db push`
- `npm run db:studio` - `prisma studio`
- `npm run db:seed` - `tsx prisma/seed.ts`
- `npm run db:reset` - `prisma migrate reset`
- `npm run db:setup` - generate + migrate + seed

## Default Login Credentials

After running `npm run db:setup`, log in with:

- `admin@example.com` / `admin123` (ADMIN)
- `manager@example.com` / `manager123` (MANAGER)
- `staff@example.com` / `staff123` (STAFF)

## Deployment Notes

- Ensure the host environment includes: `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`.
- Run database migrations + seed before first production start:
  `npm run db:setup` (or `db:migrate` + `db:seed`).
- Keep `NEXTAUTH_SECRET` stable across redeploys to avoid invalidating JWT sessions.
