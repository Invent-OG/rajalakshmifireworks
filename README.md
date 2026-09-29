# Rajalakshmi Fireworks - Sivakasi E-Commerce Platform

A production-ready, full-stack Diwali fireworks e-commerce platform built natively with **Astro SSR** and **React Islands**.

## Key Architecture

- **Framework:** [Astro](https://astro.build) (Server-Side Rendering with `@astrojs/node` standalone adapter)
- **UI & Islands:** [React 19](https://react.dev) islands (`@astrojs/react`)
- **Styling:** Tailwind CSS v4 with bespoke animations and fluid typography
- **State Management & Caching:** `@tanstack/react-query` & persistent cart sync
- **Database & ORM:** PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Authentication:** Edge-ready JOSE JWT session authentication with secure HTTP-only cookies
- **Internationalization:** Multi-locale routing (`/en`, `/ta`) with Tamil language support
- **Notifications & Integrations:** WhatsApp Cloud API for automated dispatch & order tracking

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### Database Setup

```bash
# Push schema migrations
npm run db:push

# Seed catalog, categories, demo products, and manager account
npm run db:seed
```

### Development Server

```bash
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321) to browse the storefront.
Manager / Admin operations desk: [http://localhost:4321/admin](http://localhost:4321/admin)

### Production Build

```bash
# Build the Astro SSR server bundle
npm run build

# Start the standalone server
npm run start
```

### Running Tests

```bash
npm test
```
