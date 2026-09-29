# Stella Spare Part Ltd — POS

A point-of-sale system built for Stella Spare Part Ltd, a spare-parts shop in Tema Station, Accra, serving minibus/trotro and van operators.

Handles product sales, receipt printing, and selective customer credit accounts — designed for a counter tablet and a non-technical operator.

## Stack

- React + TypeScript, built with Vite
- Tailwind CSS
- Supabase (Postgres, Auth, RLS) for data and authentication
- Progressive Web App (installable, offline-aware)

## Getting started

**Requirements:** Node.js 18+

```bash
npm install --legacy-peer-deps
```

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run the dev server:

```bash
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Type-check with `tsc` |

## Project structure

```
src/
  components/   Screens and UI, grouped by feature (pos, products, customers, sales, reports, settings, auth)
  services/     Data layer — product, customer, sales, payment, receipt, and auth services
  hooks/        Shared React hooks
  utils/        Currency, date, and calculation helpers
  types/        Shared TypeScript types
```

Database schema and access policies live in `supabase/`.

## Authentication

Two accounts only — the shop owner and the administrator. New sign-ups are disabled; accounts are provisioned directly in Supabase.

## Status

In active development.