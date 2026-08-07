.PHONY: install dev-frontend dev-backend dev-ai test format lint

install:
	poetry install
	npm install

dev-frontend:
	npm run frontend:dev

dev-backend:
	poetry run uvicorn apps.backend.app.main:app --reload --port 8000

dev-ai:
	poetry run python apps/ai_engine/main.py

test:
	poetry run pytest tests/

format:
	poetry run black apps/ libs/ tests/
	poetry run isort apps/ libs/ tests/

lint:
	poetry run mypy apps/ libs/
	npm run frontend:lint
