# Contributing

Thanks for contributing to `@congresswiki/handwritten-signature`.

## Scope

This repo contains:

- the published React package in `src/`
- the demo site in `site/`

Please keep package code small, predictable, and framework-agnostic beyond React itself.

## Local Setup

```bash
yarn install
yarn --cwd site install
```

Local development does not require a GitHub token unless you are installing from or publishing to GitHub Packages.

## Validation

Run these before opening a pull request:

```bash
yarn lint
yarn typecheck
yarn test:run
yarn build
yarn site:typecheck
yarn site:build
```

For iterative package work:

```bash
yarn test
```

## Contribution Guidelines

- Keep API changes intentional and documented.
- Add or update tests when behavior changes.
- Prefer small, focused pull requests.
- Do not commit generated build output or local cache artifacts.
- Do not manually bump the package version for routine PRs. Maintainers handle releases and publishing.

## Pull Requests

Include:

- what changed
- why it changed
- how you verified it
- screenshots or demo notes for visible behavior changes

## Release Process

Releases are published from `main` by GitHub Actions. The workflow handles validation, version bumping, and publishing.
