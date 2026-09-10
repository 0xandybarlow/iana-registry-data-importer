# IANA Registry Automated Releases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a fail-closed weekly registry sweep that prepares one merge-gated patch release and an idempotent OIDC npm publication workflow.

**Architecture:** The importer first collects and validates a complete in-memory candidate set, then computes and writes semantic changes only after the full sweep succeeds. Focused release modules consume the structured sweep summary to prepare and validate a data-only release, while shared artifact helpers let CI and the release workflow verify the same package shape and canonical contents. GitHub Actions use a repository-scoped GitHub App only for PR maintenance and npm OIDC only for publication after merge.

**Tech Stack:** TypeScript 5.9, Jest 29, npm workspaces/lockfile v3, Node.js 24, npm 11.5.1+, GitHub Actions, GitHub CLI, actionlint 1.7.12.

**Spec:** `docs/superpowers/specs/2026-09-10-iana-registry-automated-releases-design.md`

## Global Constraints

- Keep `iana-registry-data-lib` as the only publishable workspace; never publish `importer`.
- Automated registry updates use exactly `patch(current master)` and may change only `iana-registry-data-lib/src/registries/**`, `iana-registry-data-lib/package.json`, `iana-registry-data-lib/CHANGELOG.md`, and `package-lock.json`.
- A filtered manual run is diagnostic only and cannot write registry files, prepare a release, update the release branch, or create a PR.
- A complete sweep must fetch, parse, normalize, and validate every configured source before any registry file is written.
- Supported generated datasets use `schema_version: 2`; dataset identity must match configuration; entries must be non-empty with non-empty, unique `entry_id` values.
- The infrastructure implementation must leave the library version at `3.0.1` and must not publish, tag, merge, or create a GitHub Release.
- Release publication uses Node 24 and npm CLI 11.5.1 or later, `id-token: write`, no npm token, and publishes the already-tested tarball.
- npm versions, Git tags, and published package contents are immutable; content collisions, wrong tag targets, and release/tag mismatches fail closed.
- External GitHub App creation, branch protection, npm trusted-publisher configuration, first live release verification, npm token revocation, merges, pushes, and publication remain maintainer operations.

---

### Task 1: Atomic complete-sweep importer and dataset validation

**Files:**
- Create: `importer/src/pipeline/validate.ts`
- Create: `importer/src/pipeline/validateCommitted.ts`
- Create: `importer/src/pipeline/sweep.ts`
- Create: `importer/src/__tests__/validate.test.ts`
- Create: `importer/src/__tests__/sweep.test.ts`
- Modify: `importer/src/pipeline/checkAndUpdate.ts`
- Modify: `importer/src/pipeline/sources.ts`
- Modify: `importer/src/pipeline/types.ts`
- Modify: `importer/src/pipeline/changelog.ts`
- Modify: `importer/package.json`
- Modify: `package.json`
- Delete: `importer/src/importAndProcessDatasources.ts`
- Delete: `importer/src/diffRegistryData.ts`
- Delete: `importer/src/interfaces/RegistryJson.ts`

**Interfaces:**
- Produces: `validateDataset(value: unknown, expected: DatasetIdentity): RegistryDataset` and `validateDatasetSet(datasets: RegistryDataset[], expected: DatasourceConfig[]): void`.
- Produces: `validateCommittedDatasets(dataRoot: string, configs: DatasourceConfig[], options?: LegacyValidationOptions): Promise<void>` and its CLI.
- Produces: `collectSweep(configs: DatasourceConfig[], fetchText?: (url: string) => Promise<string>): Promise<RegistryDataset[]>` with no filesystem writes.
- Produces: `UpdateSummaryDocument` with `schema_version: 1`, `complete`, `diagnostic`, `changed`, `generated_at`, and `datasets`.
- Produces: `checkAndUpdate(options?: CheckAndUpdateOptions): Promise<UpdateSummaryDocument>`, where explicit summary/PR-body paths are optional and filtered mode is write-free.
- Consumes: existing `diffDatasets`, `normalizeCsvRecord`, `buildDataset`, `REGISTRIES`, and `getData`.

- [ ] **Step 1: Add failing validation tests**

Add literal fixtures covering a valid dataset and failures for the wrong identity, unsupported schema, empty entries, blank `entry_id`, duplicate `entry_id`, and an incomplete/extra dataset set. Each test must assert the affected `registry_id/dataset_id` appears in the error. Add one transition test proving the committed-data CLI may allow only the exact known duplicate IDs when the library version is exactly `3.0.1`, while the default validator remains strict.

```ts
it('rejects duplicate entry IDs', () => {
  const dataset = makeDataset([
    { entry_id: 'same', name: 'A' },
    { entry_id: 'same', name: 'B' },
  ]);
  expect(() => validateDataset(dataset, identity)).toThrow(
    'test_registry/test_dataset: duplicate entry_id "same"',
  );
});
```

- [ ] **Step 2: Run validation tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/validate.test.ts`

Expected: FAIL because `pipeline/validate` does not exist.

- [ ] **Step 3: Implement strict dataset and configured-set validation**

Validate the complete runtime shape without coercion. Error messages must name the configured identity. `validateDatasetSet` must compare exact `registry_id/dataset_id` sets, not only counts. The committed-data reader uses strict validation by default. Its temporary `3.0.1` compatibility mode recognizes only the currently committed collisions in `json_web_key_parameters`, `oauth_extensions_error_registry`, and `oauth_parameters`; any other duplicate or any later version fails.

```ts
export interface DatasetIdentity {
  registry_id: string;
  dataset_id: string;
}

export const validateDataset = (
  value: unknown,
  expected: DatasetIdentity,
): RegistryDataset => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${expected.registry_id}/${expected.dataset_id}: expected object`);
  }
  const dataset = value as Partial<RegistryDataset>;
  if (dataset.schema_version !== 2) {
    throw new Error(`${expected.registry_id}/${expected.dataset_id}: unsupported schema_version`);
  }
  if (
    dataset.registry_id !== expected.registry_id ||
    dataset.dataset_id !== expected.dataset_id
  ) {
    throw new Error(`${expected.registry_id}/${expected.dataset_id}: identity mismatch`);
  }
  if (!Array.isArray(dataset.entries) || dataset.entries.length === 0) {
    throw new Error(`${expected.registry_id}/${expected.dataset_id}: entries must be non-empty`);
  }
  const ids = new Set<string>();
  for (const entry of dataset.entries) {
    if (typeof entry.entry_id !== 'string' || entry.entry_id.trim() === '') {
      throw new Error(`${expected.registry_id}/${expected.dataset_id}: blank entry_id`);
    }
    if (ids.has(entry.entry_id)) {
      throw new Error(
        `${expected.registry_id}/${expected.dataset_id}: duplicate entry_id "${entry.entry_id}"`,
      );
    }
    ids.add(entry.entry_id);
  }
  return dataset as RegistryDataset;
};
```

- [ ] **Step 4: Add failing atomicity and diagnostic-mode tests**

Use injected fetch/read/write functions and temporary directories. Prove that a later source rejection causes zero writes, a complete no-change sweep writes zero registry files, a changed complete sweep writes only changed datasets after collection, and a filtered run returns `diagnostic: true`, `complete: false` with zero writes.

```ts
it('writes nothing when any source fails', async () => {
  const writes: string[] = [];
  await expect(runSweepFixture({ failDataset: 'second', writes })).rejects.toThrow(
    'test_registry/second',
  );
  expect(writes).toEqual([]);
});
```

- [ ] **Step 5: Run sweep tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/sweep.test.ts`

Expected: FAIL because the collection phase and injectable update orchestration do not exist.

- [ ] **Step 6: Implement collection, comparison, delayed writes, and structured output**

Flatten `REGISTRIES` once, collect every selected source in memory, validate each generated dataset, validate the exact full set for release-capable runs, then read existing datasets, compute summaries, and finally write changed files. Do not catch-and-continue. Write the JSON summary and Markdown PR body only to caller-supplied paths; default local execution logs the Markdown summary but does not create `CHANGELOG_UPDATE.md`.

```ts
export interface CheckAndUpdateOptions {
  filter?: string;
  summaryPath?: string;
  prBodyPath?: string;
  fetchText?: (url: string) => Promise<string>;
  dataRoot?: string;
  now?: () => Date;
}
```

- [ ] **Step 7: Correct configured primary keys and retire fail-open entrypoints**

Use composite keys for the existing collisions: `json_web_key_parameters` uses `parameter_name` plus `used_with_kty_value`; `oauth_extensions_error_registry` uses `name` plus `usage_location`; `oauth_parameters` uses `name` plus `parameter_usage_location`. Point both root `import-data` and importer `generate-data` scripts at the new `checkAndUpdate` CLI, then remove the legacy writer/diff files.

- [ ] **Step 8: Verify Task 1 GREEN**

Run: `npm run test -w importer -- --runInBand && npm run lint -w importer && npm run build:importer`

Expected: all importer tests pass, lint exits 0, and TypeScript compilation exits 0.

- [ ] **Step 9: Commit Task 1**

```bash
git add importer/src importer/package.json package.json
git commit -m "feat: make registry sweeps atomic"
```

---

### Task 2: Data-release preparation and bot-PR policy

**Files:**
- Create: `importer/src/release/semver.ts`
- Create: `importer/src/release/prepareDataRelease.ts`
- Create: `importer/src/release/releasePolicy.ts`
- Create: `importer/src/__tests__/prepareDataRelease.test.ts`
- Create: `importer/src/__tests__/releasePolicy.test.ts`
- Modify: `importer/package.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: `CHANGELOG_UPDATE.md`
- Delete: `importer/CHANGELOG_UPDATE.md`
- Delete: `iana-registry-data-lib/package-lock.json`

**Interfaces:**
- Consumes: Task 1 `UpdateSummaryDocument` and generated Markdown detail.
- Produces: `parseStableVersion(value: string): SemVer`, `nextPatch(value: string): string`.
- Produces: `prepareDataRelease(options: PrepareDataReleaseOptions): Promise<{ version: string; changelogSection: string }>`.
- Produces: `validateAutomatedRelease(options: ReleasePolicyOptions): Promise<void>` for CI and pre-PR use.
- Produces CLI scripts `prepare-data-release` and `validate-data-release` in the importer workspace.

- [ ] **Step 1: Add failing SemVer and preparation tests**

Cover strict stable `major.minor.patch` parsing, patch rollover, rejection of prereleases/build metadata, no-change/incomplete/diagnostic summaries, unsupported schema changes, version/package-lock synchronization, and a dated changelog entry prepended after the Keep a Changelog introduction.

```ts
expect(nextPatch('3.0.1')).toBe('3.0.2');
expect(() => nextPatch('3.0.1-beta.1')).toThrow('stable SemVer');
```

- [ ] **Step 2: Run preparation tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/prepareDataRelease.test.ts`

Expected: FAIL because the release modules do not exist.

- [ ] **Step 3: Implement deterministic patch preparation**

Require a complete, non-diagnostic, changed summary. Confirm every candidate uses schema 2. Calculate exactly one patch from the checked-out library version, update `iana-registry-data-lib/package.json`, invoke `npm install --package-lock-only --ignore-scripts` at the repository root to update only the authoritative lock, and prepend one `### Data` changelog section dated from the injected clock. Write the ephemeral PR body only to the explicit output path.

- [ ] **Step 4: Add failing path/version/changelog policy tests**

Use literal path arrays and base/head fixture files. Prove every approved path passes, each unapproved path fails, a schema change fails, `3.0.1 -> 3.0.2` passes, skipped/double bumps fail, a mismatched lockfile fails, and a missing matching `### Data` section fails.

```ts
expect(() => assertAllowedDataReleasePaths([
  'iana-registry-data-lib/src/registries/oauth_registry/oauth_uri.json',
  'iana-registry-data-lib/package.json',
  'iana-registry-data-lib/CHANGELOG.md',
  'package-lock.json',
])).not.toThrow();
expect(() => assertAllowedDataReleasePaths(['importer/src/index.ts'])).toThrow(
  'unapproved automated release path',
);
```

- [ ] **Step 5: Run policy tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/releasePolicy.test.ts`

Expected: FAIL because policy validation does not exist.

- [ ] **Step 6: Implement release policy and CLIs**

Keep pure policy functions independent from Git. The CLI resolves changed paths from an explicit base ref, reads base files with `git show`, validates head files from disk, and exits non-zero with one actionable message per violation. Add root scripts `prepare-data-release`, `validate-data-release`, and `validate:datasets`.

- [ ] **Step 7: Consolidate lockfiles and remove committed ephemeral changelogs**

Remove both legacy `CHANGELOG_UPDATE.md` files and the library workspace lockfile. Run `npm install --package-lock-only --ignore-scripts` from the repository root and confirm the library remains `3.0.1` in both `package.json` and the root lockfile.

- [ ] **Step 8: Verify Task 2 GREEN**

Run: `npm run test -w importer -- --runInBand && npm run lint -w importer && npm run build:importer && npm ci --ignore-scripts`

Expected: all commands exit 0 and `git diff -- iana-registry-data-lib/package.json` is empty.

- [ ] **Step 9: Commit Task 2**

```bash
git add importer/src importer/package.json package.json package-lock.json CHANGELOG_UPDATE.md importer/CHANGELOG_UPDATE.md iana-registry-data-lib/package-lock.json
git commit -m "feat: prepare merge-gated data releases"
```

---

### Task 3: Package artifact inspection and release reconciliation helpers

**Files:**
- Create: `importer/src/release/packageArtifacts.ts`
- Create: `importer/src/release/changelogSection.ts`
- Create: `importer/src/release/smokePackedPackage.ts`
- Create: `importer/src/__tests__/packageArtifacts.test.ts`
- Create: `importer/src/__tests__/changelogSection.test.ts`
- Modify: `importer/package.json`
- Modify: `package.json`

**Interfaces:**
- Produces: `canonicalManifest(root: string): Promise<PackageManifestEntry[]>`, sorted by POSIX relative path with lowercase SHA-256 hashes.
- Produces: `assertPublishFileList(files: string[]): void` and CLI `inspect-pack` consuming `npm pack --json` output.
- Produces: `extractVersionSection(changelog: string, version: string): string` and CLI `release-notes`.
- Produces CLI `package-manifest <directory>` that emits stable JSON for `diff` comparison.
- Produces CLI `smoke-packed-package <tarball> <typescript-executable>` that installs into a new temporary consumer, runs JavaScript imports, and compiles TypeScript public imports.

- [ ] **Step 1: Add failing manifest and file-list tests**

Create temporary directory fixtures. Prove traversal order does not affect output, changed file content changes only its hash, path separators normalize to `/`, required `package/dist/index.js`, `package/dist/index.d.ts`, README, LICENSE, and package metadata are required, and source/tests/secrets are rejected.

```ts
expect(await canonicalManifest(left)).toEqual(await canonicalManifest(right));
expect(() => assertPublishFileList(['package/package.json', 'package/.env'])).toThrow(
  'unexpected package file: package/.env',
);
```

- [ ] **Step 2: Run artifact tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/packageArtifacts.test.ts`

Expected: FAIL because artifact helpers do not exist.

- [ ] **Step 3: Implement canonical manifests and publish allowlist checks**

Hash file bytes with SHA-256, normalize only relative paths, include every extracted package file, and serialize as pretty JSON ending in a newline. File-list validation allows only `package/package.json`, `package/README.md`, `package/LICENSE.md`, and files below `package/dist/`, while requiring the public JS/type entrypoints and at least one registry JSON file.

- [ ] **Step 4: Add failing changelog extraction tests**

Cover exact version matching, no prefix collision (`3.0.2` versus `3.0.20`), extraction through the next version heading, required `### Data`, duplicate headings, and missing versions.

- [ ] **Step 5: Run changelog tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/changelogSection.test.ts`

Expected: FAIL because changelog extraction does not exist.

- [ ] **Step 6: Implement changelog extraction and command entrypoints**

Return the exact Markdown section starting at `## [<version>] - YYYY-MM-DD` and ending before the next `## [` heading. Reject zero or multiple matches and reject sections without `### Data`. The smoke CLI creates a fresh consumer, installs only the supplied tarball with scripts disabled, requires the three registry namespaces from JavaScript, and invokes the explicitly supplied root `node_modules/.bin/tsc` against public type imports. Add root scripts `inspect-pack`, `package-manifest`, `release-notes`, and `smoke-packed-package`.

- [ ] **Step 7: Verify Task 3 GREEN**

Run: `npm run test -w importer -- --runInBand && npm run lint -w importer && npm run build:importer`

Expected: all commands exit 0.

- [ ] **Step 8: Commit Task 3**

```bash
git add importer/src importer/package.json package.json
git commit -m "feat: verify release package artifacts"
```

---

### Task 4: Required CI and GitHub-App release-PR workflow

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/update-data.yml`
- Delete: `.github/workflows/check-for-new-data-and-create-pr.yml`
- Modify: `README.md`
- Modify: `importer/README.md`

**Interfaces:**
- Consumes: Tasks 1-3 CLIs and root scripts.
- Produces: one stable required CI job named `validate`.
- Produces: serialized `Update IANA Data` runs and one App-maintained branch `chore/update-iana-data`.
- Uses: repository variable `IANA_RELEASE_APP_CLIENT_ID` and secret `IANA_RELEASE_APP_PRIVATE_KEY` only in the full changed update path.

- [ ] **Step 1: Write workflow acceptance assertions before editing YAML**

Add Jest tests in `importer/src/__tests__/workflows.test.ts` that parse workflow text as data and assert stable CI job names, minimal permissions, exact CI/update triggers, update concurrency, full-versus-filtered guards, late App-token use, and removal of the duplicate scheduler. Add `yaml` as an importer dev dependency so tests validate YAML structure rather than grep individual lines. Release-workflow assertions belong to Task 5.

- [ ] **Step 2: Run workflow tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/workflows.test.ts`

Expected: FAIL against the legacy workflow structure.

- [ ] **Step 3: Rewrite `ci.yml` as the stable merge gate**

Use `permissions: contents: read`, `actions/checkout@v6`, `actions/setup-node@v6`, Node `24`, and root `npm ci`. The `validate` job runs importer build/lint/tests, strict generated/committed dataset validation, automated-release policy only for `chore/update-iana-data`, library build, `npm pack --json`, file-list inspection, tarball install into a temporary consumer, JavaScript imports, TypeScript compilation against public exports, and actionlint 1.7.12. Permit only the exact pre-existing duplicate IDs while the committed library version is exactly `3.0.1`; generated candidates and every later version remain strict.

- [ ] **Step 4: Rewrite `update-data.yml` around full and diagnostic paths**

Add workflow concurrency with no cancellation. A filtered manual dispatch runs collection in diagnostic mode, writes summary/PR Markdown only under `${{ runner.temp }}`, uploads the summary artifact, writes the job summary, and never reaches release preparation or App-token creation. A schedule or unfiltered dispatch installs from the root lock, builds, performs the full atomic sweep, prepares one patch only when changed, runs the same validation/smoke gates as CI, then mints `actions/create-github-app-token@v3` credentials and calls `peter-evans/create-pull-request@v8` with only the four approved path groups.

- [ ] **Step 5: Remove the duplicate scheduler and update operational docs**

Delete the disabled legacy workflow. Document the one-scheduler/one-release architecture, App variable/secret names, diagnostic filter behavior, required `validate` branch-protection check, and the external rollout gates. Do not include credentials or steps that create external resources automatically.

- [ ] **Step 6: Verify workflow syntax and Task 4 GREEN**

Run: `npm run test -w importer -- --runInBand && npm run lint -w importer && npm run build:importer && docker run --rm -v "$PWD:/repo" --workdir /repo rhysd/actionlint:1.7.12`

Expected: Jest, lint, TypeScript, and actionlint all exit 0.

- [ ] **Step 7: Commit Task 4**

```bash
git add .github/workflows README.md importer/README.md importer/package.json package-lock.json importer/src/__tests__/workflows.test.ts
git commit -m "ci: gate automated registry release pull requests"
```

---

### Task 5: Idempotent OIDC release transaction and recovery

**Files:**
- Modify: `.github/workflows/release.yml`
- Delete: `.github/workflows/tag-library-release.yml`
- Modify: `README.md`
- Modify: `importer/README.md`
- Modify: `importer/src/__tests__/workflows.test.ts`

**Interfaces:**
- Consumes: Task 3 `inspect-pack`, `package-manifest`, and `release-notes` CLIs.
- Produces: automatic release on `master` package-version changes and manual recovery inputs `version` plus `ref`.
- Produces: tag `iana-registry-data-lib@<version>` and a GitHub Release with the exact matching changelog section.

- [ ] **Step 1: Extend failing workflow tests for the release transaction**

Assert exact push path and required manual inputs, publication concurrency, `contents: write` plus `id-token: write`, environment `npm`, Node 24/npm 11.5.1+, absence of npm secrets, publish-before-tag ordering, manifest comparison on both absent/existing npm versions, exact tag verification, and GitHub Release verification.

- [ ] **Step 2: Run release workflow tests and verify RED**

Run: `npm run test -w importer -- --runInBand src/__tests__/workflows.test.ts`

Expected: FAIL against the tag-triggered token-based release workflow.

- [ ] **Step 3: Select and validate the immutable release target**

For a push, select `github.sha`, require `iana-registry-data-lib/package.json` changed from `github.event.before`, and require a new stable version. For recovery, resolve `inputs.ref` to one commit, require it is an ancestor of `origin/master`, require its package version equals `inputs.version`, and check out that commit. Fail before build or credentials on any mismatch.

- [ ] **Step 4: Build, test, pack once, and reconcile npm**

Run the complete CI gate, build the library, create one tarball with `npm pack --json`, inspect its file list, and install that tarball in a temporary consumer for runtime/type checks. Query the exact npm version while distinguishing E404 from registry/auth/network failures. If absent, publish that tarball through trusted publishing with no `NODE_AUTH_TOKEN`; if present, skip publish. In both cases download the registry tarball, extract local and remote packages, create canonical manifests, and require byte-content equality.

- [ ] **Step 5: Reconcile the tag and GitHub Release after npm verification**

Fetch tags. Create `iana-registry-data-lib@<version>` only if absent; if present require it resolves to the selected commit and never force-move it. Extract exact changelog notes. Create the GitHub Release only if absent; if present require its `tagName` matches the expected tag. Never delete or overwrite releases automatically.

- [ ] **Step 6: Remove the tag-chain workflow and document recovery**

Delete `tag-library-release.yml`. Document manual recovery inputs, collision behavior, publish-before-tag ordering, npm trusted-publisher binding to `.github/workflows/release.yml` and environment `npm`, and the rule that the old token is revoked only after the first verified OIDC release.

- [ ] **Step 7: Verify Task 5 GREEN and the infrastructure-only guard**

Run: `npm run test -w importer -- --runInBand && npm run lint -w importer && npm run build:importer && npm run build:lib && docker run --rm -v "$PWD:/repo" --workdir /repo rhysd/actionlint:1.7.12 && node -e "const p=require('./iana-registry-data-lib/package.json'); if(p.version!=='3.0.1') process.exit(1)"`

Expected: every command exits 0, no workflow references `NPM_AUTOMATION_TOKEN`, and the library version remains `3.0.1`.

- [ ] **Step 8: Commit Task 5**

```bash
git add .github/workflows README.md importer/README.md importer/src/__tests__/workflows.test.ts
git commit -m "ci: publish verified registry releases with OIDC"
```

---

### Task 6: End-to-end repository verification

**Files:**
- Modify only if a preceding verification exposes a defect: files already owned by Tasks 1-5.

**Interfaces:**
- Consumes: the complete implementation.
- Produces: fresh evidence for the acceptance criteria and a documented list of external rollout gates.

- [ ] **Step 1: Run the full local quality gate**

Run: `npm ci --ignore-scripts && npm run build:importer && npm run lint -w importer && npm run test -w importer -- --runInBand && npm run validate:datasets && npm run build:lib`

Expected: all commands exit 0.

- [ ] **Step 2: Pack and smoke-test the actual library artifact**

Run the repository package-smoke command against a fresh tarball and a temporary consumer. The consumer must import `OAuth`, `JOSE`, and `JWT` from JavaScript and compile a TypeScript file importing the package’s public types.

Expected: file-list inspection, installation, runtime imports, and TypeScript compilation all exit 0.

- [ ] **Step 3: Validate every workflow statically**

Run: `docker run --rm -v "$PWD:/repo" --workdir /repo rhysd/actionlint:1.7.12`

Expected: exit 0 with no workflow diagnostics.

- [ ] **Step 4: Verify the branch diff stays infrastructure-only**

Confirm the library version remains `3.0.1`, generated registry JSON is unchanged, no `dist` output is tracked, the two legacy workflows and redundant lock/changelog files are deleted, and no npm token name appears anywhere in active workflows.

- [ ] **Step 5: Commit any verification-only corrections**

If Step 1-4 required code corrections, commit only those reviewed corrections with:

```bash
git add .github/workflows importer/src importer/package.json package.json package-lock.json README.md importer/README.md
git commit -m "fix: complete automated release verification"
```

If no corrections were needed, make no empty commit.
