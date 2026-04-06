# Branching & PR Guide (Favo)

## Branches
- `main` = stable/demo-ready only
- `dev` = integration branch (all features merge here)
- `feature/<name>-<module>` = each member's working branch

## Rules
- No direct pushes to `main` or `dev`
- Always create a PR into `dev`
- One feature per PR
- Pull latest `dev` before opening a PR

## Branch naming examples
- feature/member1-showcase
- feature/member2-store
- feature/member3-cart-orders
- feature/member4-payment-delivery

## Basic workflow
1. Switch to dev and update:
   - `git checkout dev`
   - `git pull`
2. Create your feature branch:
   - `git checkout -b feature/<name>-<module>`
3. Work + commit + push:
   - `git add .`
   - `git commit -m "feat: <short message>"`
   - `git push -u origin feature/<name>-<module>`
4. Open PR -> merge into `dev`

## PR checklist (before requesting review)
- `npm run lint` passes
- `npm run build` passes
- No secrets in commits (.env.local should never be pushed)