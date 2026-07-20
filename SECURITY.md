# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

1. Use GitHub **Private vulnerability reporting** on this repository, or
2. Email the maintainers (replace with a real address before publish): `security@claimgate.dev`

Include:

- Description and impact
- Reproduction steps
- Affected package versions / commit

We aim to acknowledge within 72 hours and ship a fix or mitigation as quickly as practical.

## Scope notes

- Claimgate runs shell commands declared in `claimgate.yaml` — treat config as trusted code.
- Evidence packs may include stderr tails; avoid leaking secrets into test output.
- Env adapter checks **key presence only** and must never log values.
