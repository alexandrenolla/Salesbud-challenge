# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Playbook Insights Generator - A full-stack application that analyzes sales meeting transcripts using AI (Groq LLM) to generate actionable playbook suggestions. Users upload transcript files, the system detects win/loss outcomes automatically, and produces insights including engagement moments, effective questions, objection handling, and playbook recommendations.

## Commands

### Development (Docker - Recommended)
```bash
# Start all services (PostgreSQL, backend, frontend)
docker compose up

# Rebuild after dependency changes
docker compose up --build

# Stop all services
docker compose down

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Backend (NestJS)
```bash
cd backend
npm install --legacy-peer-deps
npm run start:dev          # Development with watch mode
npm run build              # Build for production
npm run lint               # ESLint with auto-fix
npm run test               # Run unit tests
npm run test:watch         # Tests in watch mode
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                # Development server (port 5173)
npm run build              # TypeScript check + Vite build
npm run lint               # ESLint
npm run test               # Vitest
npm run test:ui            # Vitest with UI
npm run test:coverage      # Coverage report
```

## Architecture

### Backend Flow
```
Request → Controller → Service → LlmService (Groq API) → Response
                          ↓
                    TypeORM → PostgreSQL
```

**Key modules:**
- `analyses/` - Core analysis pipeline with 3-stage LLM processing (extraction → comparison → playbook generation)
- `uploads/` - File upload handling with validation, returns parsed transcript content
- `llm/` - Groq SDK wrapper with JSON extraction and error handling
- `outcome-detector/` - Automatic win/loss detection from transcript content

**Analysis pipeline (in `analyses.service.ts`):**
1. Outcome detection for each transcript
2. Individual data extraction (questions, engagement moments, objections)
3. Comparative analysis (winning vs losing patterns)
4. Playbook generation from patterns

### Frontend Structure
```
src/
├── components/     # Reusable UI (Button, Card, LoadingSpinner, Toast)
├── features/       # Domain features with co-located components/hooks
│   ├── transcripts/  # TranscriptUploader
│   └── analysis/     # AnalysisResults, useAnalysis hook
├── lib/api.ts      # Axios instance with /api/v1 base
├── contexts/       # ToastContext for notifications
└── types/          # Shared TypeScript types
```

### API Endpoints
- `POST /api/v1/uploads` - Upload .txt transcript file
- `POST /api/v1/analyses` - Create analysis from transcripts
- `GET /api/v1/analyses` - List analyses
- `GET /api/v1/analyses/:id` - Get single analysis
- `DELETE /api/v1/analyses/:id` - Delete analysis

Swagger docs available at `http://localhost:3001/docs`

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `GROQ_API_KEY` - Required for LLM functionality
- `VITE_API_URL` - Frontend API URL (default: http://localhost:3001)
- Database credentials (TYPEORM_* variables)

## Code Conventions

### Backend (NestJS)
- Use `src/*` for cross-module imports, relative paths for same-module
- Guards at class level, not method level
- Services contain business logic; controllers only route
- DTOs: `create-*.dto.ts`, `update-*.dto.ts`, `*-response.dto.ts`
- Entities: snake_case for DB columns, camelCase for properties

### Frontend (React)
- Functional components with TypeScript interfaces for props
- Custom hooks in `features/*/hooks/` or `hooks/`
- Tailwind for styling with `cn()` helper for conditional classes
- State: useState for local, context only for truly global (theme, auth)
