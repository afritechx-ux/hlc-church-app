# HLAG Smart Church Management System (HLAG-ChMS)

A comprehensive church management system for Higher Life Assemblies of God.

## Modules

1.  **Backend (NestJS)**: Core API, Auth, Database, Automations.
2.  **Admin Web (Next.js)**: Administration dashboard for staff.
3.  **Mobile App (Expo/React Native)**: Member app for check-in, giving, and profile.

## Prerequisites

-   Node.js (v18+)
-   PostgreSQL (v15+)
-   Docker & Docker Compose (optional, for containerized setup)

## Getting Started

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

**Database Setup:**

Ensure PostgreSQL is running and create a database named `hlag_chms`. Update `.env` with your credentials.

```bash
# Run migrations
npx prisma migrate dev

# Start server
npm run start:dev
```

The API will be available at `http://localhost:3000`.
Swagger documentation: `http://localhost:3000/api`

### 2. Docker Setup

To run the backend and database using Docker:

```bash
# From project root
docker-compose up --build
```

This will start:
-   Postgres on port `5432`
-   Backend on port `3000`

### 3. Automations

The system includes scheduled jobs for:
-   Nightly Engagement Score Calculation
-   Weekly Inactive Member Detection
-   Weekly Service Reminders

You can view automation status at `GET /automations/status` (Admin only).

## Testing

```bash
cd backend
npm run test
```
