# Repository Guidelines

## Project Structure & Module Organization
- Monorepo with npm workspaces:
  - `importer/`: TypeScript script that fetches IANA CSVs, converts to JSON, and writes into the library.
  - `iana-registry-data-lib/`: TypeScript library published to npm; ships generated JSON under `src/registries/*`.
- Tests live in `importer/src/__tests__/` (`*.test.ts`).
- Generated JSON files are written to `iana-registry-data-lib/src/registries/<registry>/<dataset>.json`.

## Build, Test, and Development Commands
- From repo root:
  - `npm install`: Install all workspace deps.
  - `npm run build:importer`: Build `importer` (equivalent to `npm run build -w importer`).
  - `npm run import-data`: Run data import (`node importer/dist/importAndProcessDatasources.js`).
  - `npm run build:lib`: Build the library workspace.
  - `npm run publish-data`: Publish `iana-registry-data-lib` (ensure version bump and npm auth).
- Within `importer/`:
  - `npm run build`: Compile TS → `dist`.
  - `npm run test` | `test:watch` | `test:coverage`: Run Jest.
  - `npm run lint` / `npm run pretty`: Lint and format.

## Coding Style & Naming Conventions
- Language: TypeScript (strict mode enabled).
- Formatting: Prettier (`importer/.prettierrc`): single quotes, trailing commas, width 80; 2‑space indent.
- Linting: ESLint with `@typescript-eslint` + Prettier integration.
- Filenames: TS files use camelCase or kebab-case; tests end with `.test.ts` under `__tests__/`.
- Generated data filenames: lower_snake_case derived via `preparePathFriendlyName()`.

## Testing Guidelines
- Framework: Jest with `ts-jest` (`importer/jest.config.js`).
- Location: `importer/src/__tests__/`.
- Conventions: Name tests `*.test.ts`; prefer unit tests for utilities (`util/*`), plus integration around `importAndProcessDatasources` with network and FS mocked.
- Run: `npm run test -w importer` or inside `importer`.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (e.g., `feat:`, `fix:`, `chore:`) as used in history.
- PRs: Include a clear description, linked issues, and scope (importer vs. lib). Add tests, update docs, and ensure `lint`/`build` pass.
- Data updates: A GitHub Action (`.github/workflows/check-for-new-data-and-create-pr.yml`) runs weekly to import data and open a PR with message “Update data from IANA registries”. Prefer reviewing diffs in `iana-registry-data-lib/src/registries/*`.

## Security & Configuration Tips
- Node.js: Use v20 to match CI.
- Network: Importer fetches live IANA CSVs via `axios`; tests mock network—do not rely on live calls in tests.
- Publishing: Verify versioning and contents before `npm publish` from `iana-registry-data-lib/`.
