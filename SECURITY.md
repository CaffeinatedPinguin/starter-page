# Security Policy

## Supported versions

Only the **latest released version** receives security fixes. Please upgrade before reporting.

## Reporting a vulnerability

**Do not open a public issue, discussion or pull request.**

Report privately through GitHub: open the affected repository, go to **Security → Report a vulnerability**. This creates a private advisory visible only to the maintainer.

Please include: affected version, impact, a **reproducible proof of concept** against the latest release, and any suggested fix.

## Scope

In scope: code in this repository and the artifacts published in its GitHub Releases.

Out of scope:

- Vulnerabilities in third-party dependencies that are already public – report them upstream.
- Output of automated scanners or AI tools without a working proof of concept.
- Issues that require an already compromised machine, account or configuration file.
- Denial of service by sending large volumes of traffic, and social engineering.

## AI-generated reports

Reports written or found with AI tools are welcome only with a proof of concept you have run yourself. Reports without one are closed without further discussion.

There is no bug bounty.

## What to expect

This project is maintained by one person in their spare time. Reports are read when time allows.

There is no guaranteed response time, no guaranteed acknowledgement and no guaranteed fix. Critical
issues go first. Accepted reports are fixed in a new release and published as a GitHub Security
Advisory (with a CVE when applicable). Reporters are credited unless they prefer otherwise.

Please allow time for a fix to be released before any public disclosure.

## How this project protects its users

- All changes reach the default branch only through pull requests with required CI checks; force pushes and branch deletion are blocked.
- Secret scanning with push protection, CodeQL code scanning, and Dependabot (alerts, security updates and dependency version updates) are enabled.
- GitHub Actions run with a read-only token by default. GitHub-owned actions are allowed, together with a short allowlist of third-party actions and shared workflows from the `templates` repository; every one of them is pinned to a full commit SHA.
- Pull requests from outside contributors are not accepted and no workflow reacts to issue or comment events, so untrusted input never runs in CI.
- Releases are immutable: published tags and assets cannot be changed or replaced.
