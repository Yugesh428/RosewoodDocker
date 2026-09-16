# Rosewood Pharmacy

Luxury pharmacy e-commerce platform built with Next.js 16, Sequelize, PostgreSQL (Supabase), and NextAuth.

---

## Prerequisites

Make sure you have the following installed before starting:

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher
- Access to a PostgreSQL database (Supabase recommended)

---

## Getting Started

Follow these steps **in order**.

### 1. Clone the repository

```bash
git clone <repository-url>
cd rosewood
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and update the following required fields:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (min 32 chars) — generate with `openssl rand -base64 32` |
| `AUTH_SECRET` | Same value as `NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `STORAGE_PROVIDER` | Keep as `local` for development |

> AWS S3 variables are only required when `STORAGE_PROVIDER=s3` (production).

### 4. Sync the database

Creates all tables that don't exist yet. Safe to run multiple times — it will not drop existing data.

```bash
npm run db:sync
```

### 5. Seed the database

Creates the default admin user. Safe to re-run — it will update the admin password if the account already exists.

```bash
npm run db:seed
```

Default admin credentials after seeding:

```
Email:    admin@rosewood.com
Password: Admin@123
```

> Change the admin password after first login in production.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:sync` | Sync all Sequelize models to the database |
| `npm run db:seed` | Seed default admin user |
| `npm run db:migrate` | Run database migrations |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (admin)/            # Admin dashboard (protected)
│   ├── (customer)/         # Customer auth pages (login, register)
│   ├── about/              # About Us page
│   ├── contact/            # Contact page
│   ├── pharmacy/           # Pharmacy / products page
│   └── api/                # API route handlers
├── components/             # Shared UI components
│   ├── home/               # Homepage sections (Hero, Footer, etc.)
│   ├── admin/              # Admin layout & sidebar
│   └── ui/                 # Base UI primitives
├── features/               # Feature modules (model + controller + routes)
│   ├── products/
│   ├── orders/
│   ├── reviews/
│   ├── wishlist/
│   ├── Ui/                 # CMS-managed UI sections
│   │   ├── HeroSection/
│   │   ├── ourProductCollection/
│   │   ├── testimonials/
│   │   ├── AboutUsPage/
│   │   └── contact/
│   └── ...
└── lib/                    # Shared utilities
    ├── database/           # Sequelize config & sync
    ├── auth/               # NextAuth config
    ├── storage.ts          # File storage (local / S3)
    ├── logger.ts           # App logger
    └── seed/               # Database seeding
```

---

## Default Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@rosewood.com | Admin@123 |

---

## Notes for QA

- File uploads in development are stored in `/public/uploads/` — this folder is created automatically on first upload.
- The map on the contact page uses OpenStreetMap (no API key required).
- All admin routes are under `/admin/*` and require admin login at `/admin/login`.
- Customer routes are under `/account` and require customer login at `/login`.
