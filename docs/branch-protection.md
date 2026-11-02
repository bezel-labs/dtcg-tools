# Branch protection for `main`

These settings live in GitHub (Settings → Branches → Branch protection rules → `main`), not in code. Keep this file in sync when they change.

- Require a pull request before merging; at least one approving review; dismiss stale approvals on new commits.
- Require status checks to pass before merging, and require branches to be up to date:
  - `CI / Node 20 on ubuntu-latest`, `Node 22 on ubuntu-latest`, `Node 24 on ubuntu-latest`
  - `CI / Node 22 on windows-latest`
  - `CodeQL / analyze`
  - `Tarball / install-and-import`
- Require conversation resolution before merging.
- Require signed commits (recommended).
- Do not allow force pushes or deletions.
- Restrict who can push to matching branches: maintainers only; everyone else goes through pull requests.

Release automation (the "Version Packages" pull request from changesets) uses the same rules; its checks must pass before it can be merged.
