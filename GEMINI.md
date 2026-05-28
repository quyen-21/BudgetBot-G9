# GEMINI.md - BotUI (AI Money Coach)

## Project Overview
BotUI is an **AI Money Coach** application designed for the FinTech domain. It helps users manage their finances by automatically classifying bank statement transactions (CSV), providing spending insights, and facilitating human-in-the-loop review for uncertain categorizations.

The project is structured as a **monorepo** managed by **Bun** and **Turborepo**.

### Core Architecture
- **Hybrid Multi-Agent System:** Uses a **Supervisor Agent** pattern with **Human-in-the-loop (HITL)**.
- **Classification Engine:**
    - **Tier 1 (Regex/Rule-based):** Fast, low-cost matching for common descriptions (e.g., GRAB -> Transport).
    - **Tier 2 (LLM Supervisor):** Uses LLMs (Local Ollama or AWS Bedrock) for complex descriptions with structured output.
    - **Tier 3 (HITL):** Low-confidence results are flagged for manual user review (`NEEDS_REVIEW` status).

### Tech Stack
- **Frontend:** Next.js 16+ (App Router), React 19, Tailwind CSS 4+, shadcn/ui.
- **Backend:** FastAPI (Python 3.10+).
- **AI Backend:** Ollama (Local llama3.1:8b) or AWS Bedrock (Claude 3.5 Haiku).
- **Database:** SQLite (Local) or PostgreSQL/DynamoDB (Production).
- **Infrastructure:** Terraform (AWS-focused).

## Project Structure
- `apps/web/`: Next.js web application.
- `apps/api/`: FastAPI backend service.
- `packages/ui/`: Shared UI components utilizing shadcn/ui.
- `packages/eslint-config/`: Shared ESLint configurations.
- `packages/typescript-config/`: Shared TypeScript configurations.
- `infra/`: Terraform infrastructure-as-code files.
- `docs/`: Architecture blueprints, cost estimates, and learner guides.

## Building and Running

### Prerequisites
- [Bun](https://bun.sh/)
- [Python 3.10+](https://www.python.org/)
- [Ollama](https://ollama.com/) (for local AI)

### 1. Install Dependencies
```bash
# Root directory
bun install

# API directory
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configuration
Copy `.env.example` to `.env` in `apps/api/` and configure your environment.
```bash
cp apps/api/.env.example apps/api/.env
```

### 3. Start Development Servers
You need to run both the frontend and backend.

**Frontend (Web):**
```bash
bun run dev
# Starts at http://localhost:3000
```

**Backend (API):**
```bash
cd apps/api
source .venv/bin/activate
uvicorn src.app:app --reload --port 8000
# Starts at http://localhost:8000
```

### 4. Running Tests
- **Frontend:** `cd apps/web && bun run test` (if configured) or use Playwright: `npx playwright test`.
- **Backend:** `cd apps/api && pytest`.

## Development Conventions

### UI & Styling
- Use **Tailwind CSS** for styling.
- Prioritize **shadcn/ui** primitives.
- Add shared components via: `bunx --bun shadcn@latest add <component_name> -c apps/web`. This places them in `packages/ui/src/components/`.

### Coding Standards
- **TypeScript:** Strict type checking is enabled. Use the `@workspace/ui` alias for shared components.
- **Python:** Use Pydantic models for request/response validation and API contracts.
- **Formatting:** Prettier is used for root-level and web formatting. Run `bun run format`.
- **Linting:** ESLint is used across the monorepo. Run `bun run lint`.

### State Management & API Calls
- Frontend communicates with the backend via REST API (default `http://localhost:8000`).
- Transactions follow the status lifecycle: `AUTO_APPROVED` -> `NEEDS_REVIEW` -> `MANUAL_APPROVED`.

## Key Files
- `architecture_context.md`: Detailed system design and API contract.
- `apps/api/src/app.py`: FastAPI entry point and routes.
- `apps/web/app/`: Next.js App Router root.
- `packages/ui/components.json`: shadcn/ui configuration.
