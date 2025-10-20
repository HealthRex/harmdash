# Project AGENTS.md Guide

This document provides guidance for AI coding agents (e.g., OpenAI Codex, Copilot, Claude Code) and human contributors working with this codebase.  
It describes the project structure, coding conventions, and validation requirements.  
Unless otherwise noted, **"Agents"** refers to both AI and automated assistants.

---

## Project Structure

- `/backend`: Python/Django backend
  - Source code for Django apps, APIs, and services
  - `pyproject.toml` defines Python dependencies (managed with `uv`)
  - `tests/`: Backend unit and integration tests
  - Safe to extend models, views, serializers, and add tests
  - **Do not** edit existing migrations without review

- `/frontend`: React/Next.js frontend
  - `package.json` defines Node dependencies (managed with npm/yarn/pnpm)
  - `src/`: Application source code
    - `components/`: React components
    - `pages/`: Next.js route handlers
    - `styles/`: Styling (CSS/SCSS/Tailwind)
    - `utils/`: Reusable utility functions
  - `public/`: Static assets (do not modify directly)
  - `tests/`: Frontend tests (unit + integration)

- `/db`: Database schema, migrations, and seed data
  - Used for Postgres configuration
  - Prefer Django ORM and migrations; avoid raw SQL unless explicitly required

- `/docker-compose.yml`: Defines services (Django backend, Postgres, frontend)  
- `/README.md`: Human-facing project overview  
- `/AGENTS.md`: This document. Update when structure or conventions change  

---

## Coding Conventions

### General
- Use **TypeScript** for all new frontend code  
- Use **PEP8** (autoformat with Black) for Python code  
- Follow existing code style within each file  
- Write meaningful variable and function names  
- Add inline comments for complex logic  

### Frontend (React/Next.js)
- Use **functional components** with React hooks  
- Keep components small and focused  
- Use **PascalCase** for component filenames (`MyComponent.tsx`)  
- Use **Tailwind CSS** for styling (utility-first approach); custom CSS only if necessary  

### Backend (Django)
- Use **Django REST Framework (DRF)** for APIs  
- Keep business logic in **models/services**, not views  
- Add docstrings to all new functions and classes  
- Use `ruff` and `mypy` for linting and type checking  

### Database
- Generate migrations with `python manage.py makemigrations`  
- Never drop or alter production-critical schema without review  
- Use environment variables (`.env`) for database configuration  

---

## Testing Requirements

### Frontend (React/Next.js)
```bash
# Run all frontend tests
npm test

# Run a specific test file
npm test -- path/to/test-file.test.ts

# Run with coverage
npm test -- --coverage
```

### Backend (Django)
```bash
# Run all backend tests
uv run python manage.py test

# Run tests for a specific app
uv run python manage.py test myapp
```

---

## Programmatic Checks

All checks must pass before merging contributions:

### Frontend
```bash
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run build        # Next.js build
```

### Backend
```bash
uv run ruff check .        # Lint (Python)
uv run mypy backend/       # Type checking
uv run python manage.py test   # Run backend tests
```

---

## Pull Request Guidelines

When opening a PR (AI-assisted or human):

1. Provide a clear description of the changes  
2. Reference related issues (if any)  
3. Ensure **all frontend and backend tests** pass  
4. Include **screenshots** for UI changes  
5. Keep PRs focused on a **single concern**  

---

## Environment & Deployment Notes

- Local development uses **Docker Compose** (`docker-compose up`) to run backend, frontend, and Postgres together  
- Do not hardcode secrets or database URLs; always use **environment variables** from `.env`  
- Agents should assume services run in Docker during development  