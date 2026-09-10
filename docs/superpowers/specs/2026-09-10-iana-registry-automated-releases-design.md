# Merge-gated IANA registry package releases

**Status:** Approved for implementation in chat on 2026-09-10
**Date:** 2026-09-10
**Repository:** `0xandybarlow/iana-registry-data-importer`

## Context

This repository contains two npm workspaces:

- `importer`, an internal tool that fetches and normalizes IANA registry data.
- `iana-registry-data-lib`, the public npm package produced from that data.

The importer writes directly to `iana-registry-data-lib/src/registries`. Keeping
the producer and its published output in one repository lets generator changes,
schema changes, generated data, tests, and release metadata be reviewed
atomically.

As of 2026-09-10:

- The weekly `Update IANA Data` workflow succeeds and refreshes PR #29.
- CI for the bot-created PR enters GitHub's `action_required` state and starts no
  jobs because the PR is created with `GITHUB_TOKEN`.
- PR #29 is mergeable but `UNSTABLE`, with no completed status checks.
- Data-update PRs do not change the library version or durable package changelog.
- `Tag Library Release` creates tags with `GITHUB_TOKEN`; those tag events do not
  trigger the separate `Release Library` workflow.
- npm's current version is `3.0.1`; there is no recorded `Release Library` run
  for that version and the repository has no GitHub Releases.
- Publishing is configured with a long-lived `NPM_AUTOMATION_TOKEN`, despite
  already requesting an OIDC token for provenance.

GitHub documents both approval-required PR workflows and suppression of most
workflow events created with `GITHUB_TOKEN`:
<https://docs.github.com/en/actions/concepts/security/github_token>.

npm supports workflow-scoped OIDC trusted publishing without a long-lived npm
token:
<https://docs.npmjs.com/trusted-publishers/>.

## Decision

Retain the monorepo and replace the current tag-then-publish chain with a
purpose-built, merge-gated release flow.

A complete weekly registry sweep creates or refreshes one release PR. The PR
contains the generated data, the next patch version, the root lockfile update,
and a durable changelog entry. A repository-scoped GitHub App creates the PR so
CI runs normally. Merging a green PR is the single human publication gate.

After merge, one idempotent workflow publishes to npm through OIDC, verifies the
published artifact, tags the merged commit, and creates the matching GitHub
Release.

Automated registry-data changes always receive the next patch version. API or
schema changes require a normal human-authored PR with an explicitly chosen
minor or major version.

## Goals

- Turn each reviewed registry update into exactly one npm patch release.
- Preserve a single human decision: merging the green release PR.
- Make source fetching and generated-data validation fail closed.
- Publish the exact artifact tested in CI with npm provenance.
- Keep npm, Git tags, and GitHub Releases reconcilable after partial failure.
- Remove long-lived npm publishing credentials after a verified migration.
- Keep routine operation understandable without adopting a general monorepo
  release framework.

## Non-goals

- Automatically merge update PRs.
- Publish the importer as an npm package.
- Split the library into another repository.
- Automatically classify API or schema changes as minor or major releases.
- Automatically unpublish, overwrite, or silently replace a bad npm version.
- Add a second approval after the merge gate.

## System boundaries

### Importer

The importer owns source retrieval, normalization, semantic comparison,
dataset validation, and a structured change summary. It does not own npm or
GitHub credentials.

Source processing becomes two-phase:

1. Fetch, parse, normalize, and validate every configured source in memory.
2. Only when the complete sweep succeeds, calculate semantic differences and
   write changed datasets.

Any source failure aborts the sweep. The importer must not log an error and
continue to produce a releasable partial result.

### Release preparation

A focused repository script consumes the importer's structured summary and:

- Confirms the base library version is valid SemVer.
- Calculates exactly one patch increment for a data-only update.
- Updates `iana-registry-data-lib/package.json` and the root
  `package-lock.json`.
- Prepends a dated `Data` entry to
  `iana-registry-data-lib/CHANGELOG.md` using the structured diff summary.
- Produces the PR body as an ephemeral workflow file rather than committing the
  root `CHANGELOG_UPDATE.md`.
- Refuses automated release preparation if `schema_version` changes or the
  generated diff escapes the approved data-release paths.

The root workspace lockfile becomes authoritative. The redundant
`importer/package-lock.json` and `iana-registry-data-lib/package-lock.json` are
removed so version and dependency state cannot drift across three lockfiles.

### Published library

`iana-registry-data-lib` remains the only publishable workspace. Its committed
source data, public TypeScript entrypoints, package metadata, and changelog are
the release source of truth. Generated `dist` files remain untracked and are
built in CI and the release job.

## Data and version flow

1. The Monday schedule, or a full manual dispatch, checks out `master`.
2. The workflow installs from the root lockfile and builds the importer.
3. The importer performs a complete two-phase IANA sweep.
4. If there are no semantic data changes, the run succeeds without changing a
   version or PR.
5. If data changed, release preparation assigns `patch(current master)` and
   creates the durable changelog entry.
6. Validation and package smoke tests run before any branch is updated.
7. The GitHub App creates or refreshes `chore/update-iana-data` and PR #29.
8. Normal PR CI runs against the generated commit.
9. The maintainer reviews and merges the green PR.
10. The release workflow validates and publishes the merged version, then
    creates the matching tag and GitHub Release.

If an update PR remains open across weekly runs, it is regenerated from current
`master` and keeps the same next patch number. It does not accumulate version
increments. If another release changes the base version, the next refresh
recalculates the patch; stale version/base combinations fail CI.

Filtered manual runs are diagnostic only. They may emit summaries or workflow
artifacts, but they must not update the release branch or create a releasable PR.

## Validation and CI

### Dataset invariants

Every configured dataset must satisfy all of the following:

- Its source completed successfully and was included in the full sweep.
- `schema_version` remains the supported value.
- `registry_id` and `dataset_id` match the configured source.
- `entries` is a non-empty array.
- Every `entry_id` is non-empty and unique within the dataset.
- The resulting JSON passes the library's runtime dataset validation.
- The set of generated datasets matches the configured dataset set.

Removals and large changes are reported prominently but are not rejected by an
arbitrary percentage threshold. The human diff review is the approval boundary
for structurally valid but substantial upstream changes.

### Generated PR path policy

An automated data-release PR may change only:

- `iana-registry-data-lib/src/registries/**`
- `iana-registry-data-lib/package.json`
- `iana-registry-data-lib/CHANGELOG.md`
- `package-lock.json`

Any other changed path makes automated release preparation fail. This keeps
code, schema, workflow, and API changes out of the patch automation.

### Required CI checks

CI runs with read-only repository permissions and performs:

- Root `npm ci` on the pinned release Node/npm toolchain.
- Importer build, lint, unit tests, and integration tests using mocked source
  responses.
- Full validation of every committed dataset.
- Version, lockfile, changelog, and bot-PR path-policy checks.
- Library build.
- Package file-list inspection to prevent missing or unintended files.
- `npm pack` followed by installation into a temporary consumer project.
- JavaScript runtime imports and TypeScript compilation against the packed
  package's public exports.
- Static validation of changed GitHub Actions workflows.

Branch protection requires this CI result before merge.

## Workflows

### `update-data.yml`

Responsibilities:

- Schedule and manual dispatch.
- Serialize runs so manual and scheduled sweeps cannot race.
- Generate, prepare, validate, and smoke-test the candidate release.
- Mint a short-lived GitHub App installation token.
- Create or update the single release PR.
- Write a job summary covering changed datasets, proposed version, PR URL, or
  the no-change result.

The GitHub App is installed only on this repository. Its permissions are limited
to repository contents and pull requests needed to maintain the release branch
and PR. The workflow's ordinary `GITHUB_TOKEN` remains minimally scoped; the App
credential is not available to PR CI or release jobs.

### `ci.yml`

Responsibilities:

- Validate ordinary code PRs and generated data-release PRs.
- Apply the generated-path and version-policy checks only when the PR is an
  automated data release.
- Expose one stable required check name for branch protection.

### `release.yml`

Triggers:

- A push to `master` that changes `iana-registry-data-lib/package.json`.
- A manual recovery dispatch that identifies and validates an exact version and
  repository ref.

Permissions are `contents: write` and `id-token: write`. The job runs on a
GitHub-hosted runner in the `npm` environment, uses Node 24 with an npm CLI new
enough for trusted publishing, and receives no npm publish token. The npm
trusted-publisher record is restricted to this repository, workflow filename,
environment, and `npm publish` action. The environment scopes publishing but has
no required reviewer, because merging the green PR is the one human gate.

The former `tag-library-release.yml` is removed. The disabled legacy
`check-for-new-data-and-create-pr.yml` is also removed to leave one scheduler and
one release path.

## Release transaction and recovery

For the version and commit selected by the triggering event or validated manual
input, the release workflow:

1. Installs, tests, validates, builds, and packs the library.
2. Constructs a canonical manifest of the packed files and their content hashes.
3. Queries npm for the exact version.
4. If absent, publishes the already-tested tarball through OIDC and downloads
   the published package; it does not rebuild during `npm publish`.
5. Compares the published package's canonical content manifest with the local
   tested artifact.
6. If the version already exists, performs the same content comparison before
   treating npm publication as complete.
7. Creates the tag `iana-registry-data-lib@<version>`, or verifies that the
   existing tag points to the selected commit.
8. Creates the GitHub Release from the matching changelog section, or verifies
   that the existing release is associated with the correct tag.

The workflow publishes before creating the tag or GitHub Release so GitHub never
announces a package version that npm rejected. A run that publishes successfully
but fails later can be manually rerun: it verifies the immutable npm artifact
and repairs the missing tag or release without attempting to overwrite npm.

A version collision with different package contents, a tag pointing at another
commit, or a GitHub Release attached to another tag is a hard failure requiring
maintainer investigation.

Release workflow concurrency serializes publication attempts. Automatic
unpublish, force-tagging, release deletion, and version overwrite are forbidden.

## Security model

Assets are the generated registry data, release branch, npm package namespace,
Git tags, and GitHub Releases.

Trust boundaries and controls:

- IANA responses are untrusted external input. Complete-sweep processing,
  structural validation, semantic diffs, CI, and human review protect the
  package from malformed or unexpected changes.
- The GitHub App private key is a long-lived secret, but its installation and
  permissions are limited to this repository and PR maintenance. It has no npm
  authority.
- npm publishing uses a short-lived OIDC credential bound to the repository,
  workflow, environment, and action. No npm token is passed to workflow steps.
- PR code never receives write credentials or environment secrets.
- Only a commit merged to protected `master` with a new package version can
  start automatic publication.
- Publication is traceable through npm provenance, the tested commit, the tag,
  and the GitHub Release.

Residual risk: structurally valid upstream data can still be surprising or
incorrect. The generated diff and explicit merge remain the control for that
risk. GitHub, npm, or IANA outages can delay a release but must not produce a
partial data PR or inconsistent release without a failed workflow signal.

## Error handling and observability

- Source and validation errors name the affected registry/dataset and fail the
  run without updating the PR branch.
- An existing release PR remains unchanged when generation fails.
- No-change runs are successful and clearly reported as such.
- Job summaries identify the proposed or published version, changed datasets,
  and relevant PR/release URLs without including credentials or raw environment
  data.
- GitHub Actions notifications are the initial failure channel; additional
  messaging integrations are not part of this design.
- Manual release recovery is explicit and validates both version and ref before
  taking action.

## Rollout

1. Implement and merge an infrastructure-only PR containing importer
   safeguards, tests, release-preparation code, and workflow changes. It must not
   change the package version or publish anything.
2. Create and install the repository-scoped GitHub App, then configure its App
   ID and private key for `update-data.yml`.
3. Configure `release.yml` as the npm trusted publisher for
   `iana-registry-data-lib`, retaining the existing npm token temporarily but
   leaving it unused by the new workflow.
4. Manually dispatch a complete update sweep. It refreshes PR #29 from `master`,
   proposes `3.0.2`, and starts normal CI.
5. Review and merge PR #29.
6. Verify the first end-to-end release: npm `latest`, provenance, clean consumer
   installation, tag target, GitHub Release, and release notes.
7. Revoke the old npm automation token only after the OIDC release is confirmed.
8. Confirm the next no-change schedule completes without another version or PR.

External GitHub App creation, repository settings, npm trusted-publisher setup,
token revocation, merging, and publishing remain explicit maintainer-authorized
operations. Repository implementation alone cannot complete those gates.

## Rollback and bad-release handling

Before the first publication, revert or disable the new workflows and restore
the former manual release procedure if migration verification fails.

After npm publication, versions are treated as immutable. A bad version is
deprecated manually and corrected in a new patch release. The automation must
not unpublish it. A misleading GitHub Release may be edited after investigation,
but its tag must not be force-moved.

The scheduler or release workflow can be disabled independently while retaining
the generated data and release history. The GitHub App can be uninstalled and
the npm trusted publisher removed without changing package contents.

## Acceptance criteria

- A complete no-change registry sweep succeeds without a commit, PR update, or
  version increment.
- A source or validation failure updates neither the release branch nor PR.
- A semantic registry change creates or refreshes one PR with the next patch
  version, root lockfile update, durable changelog entry, and only approved
  paths.
- CI starts automatically on the App-created PR and all required checks must pass
  before merge.
- Repeated weekly runs against the same open PR retain one patch increment.
- Merging the green PR publishes the exact tested package to npm with OIDC
  provenance, then creates the matching tag and GitHub Release.
- A recovery rerun verifies an existing npm artifact and safely creates missing
  downstream release records.
- Conflicting npm contents or Git references fail closed.
- Filtered diagnostic runs cannot create release PRs.
- Minor and major releases require an explicitly selected version in a normal
  reviewed PR.
- After first-release verification, no long-lived npm publish token remains.

## Reconsider the repository split when

Move `iana-registry-data-lib` to a separate repository only if it gains an
independent maintainer group, independent release cadence, additional producers,
or a source of truth not owned by this importer. Until then, a split adds
cross-repository credentials and coordination while preserving the underlying
producer/output coupling.
