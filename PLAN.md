# Progno Plan

## Product Summary

Progno is a public, English-first web app that shadows Swiss federal initiatives
with play-point conditional prediction markets.

Users can browse initiatives and crowd charts without an account. Authenticated
users can submit one equal-weight forecast ticket per initiative, with two
conditional predictions:

- the predicted 2036 index score if the initiative passes
- the predicted 2036 index score if the initiative fails

There is no money, no wallet, no payouts, and no gambling mechanic.

## MVP Scope

### Core product

- Next.js 16 app with App Router
- Supabase as database and auth provider
- OpenAI for metric proposal generation
- Polymarket-inspired market board and initiative detail UI
- English UI with official Swiss initiative titles preserved verbatim

### Initial federal initiatives

- `14 June 2026`:
  - `Volksinitiative «Keine 10-Millionen-Schweiz! (Nachhaltigkeitsinitiative)»`
  - `Änderung vom 26. September 2025 des Bundesgesetzes über den zivilen Ersatzdienst (Zivildienstgesetz, ZDG)`

### Market mechanic

- Each user gets one forecast ticket per initiative
- The ticket is not split into points or percentages
- Users submit a `0-100` index prediction for both pass and fail scenarios
- Forecasts remain editable until `00:00 Europe/Zurich` on vote day
- Crowd values are derived from the latest forecast per user
- Chart history is derived from revision history

### Metric system

- Each initiative gets a public welfare metric targeting year `2036`
- Metrics are normalized to a `0-100` scale
- Metrics contain `3-5` weighted components
- Some components are `higher is better`
- Some components are `lower is better`
- Admins can generate metric drafts with OpenAI and approve one public version

### Data + admin flow

- Federal initiatives are fetched from official Swiss government sources
- Import flow supports preview + apply
- Raw import payloads are stored for traceability
- Baseline metrics exist for launch initiatives
- Admins are managed through `user_roles`

### Routes

- Public:
  - `/`
  - `/initiatives/[slug]`
  - `/login`
  - `/auth/callback`
- Protected admin:
  - `/admin/initiatives`
  - `/admin/initiatives/[id]`

### Database entities

- `user_roles`
- `initiatives`
- `initiative_import_runs`
- `metric_versions`
- `forecasts`
- `forecast_revisions`

## Current Implementation Status

- [x] Public homepage market board
- [x] Initiative detail pages
- [x] Supabase auth with email/password
- [x] Supabase auth with Google
- [x] Forecast submission and update flow
- [x] Market close enforcement
- [x] Admin initiative import preview/apply flow
- [x] OpenAI metric draft generation
- [x] Metric approval flow
- [x] Supabase schema + RLS migration
- [x] Seeded federal initiatives
- [x] Baseline launch metrics
- [x] Demo / seeded market history for thin markets
- [x] Unit tests for import parsing, dates, market math, and mock fallback

## TODO

### Deployment and operations

- [ ] Apply the latest Supabase migration in every target environment
- [ ] Configure Google OAuth redirect URLs for `/auth/callback`
- [ ] Add at least one admin user to `user_roles`
- [ ] Set `CRON_SECRET` in Vercel and verify the monthly federal sync cron in production
- [ ] Add monitoring/logging for import runs and OpenAI metric generation failures

### Product polish

- [ ] Add custom chart tooltip and stronger TradingView-style hover feedback
- [ ] Add clearer market legends and last-updated display on all market cards
- [ ] Add a lightweight recent-activity strip or event feed for engagement
- [ ] Improve empty / low-liquidity messaging even further
- [ ] Make homepage and detail-page wording fully consistent around `index score / 100`

### Testing

- [ ] Add integration tests for auth-gated forecasting flows
- [ ] Add integration tests for admin-only permissions
- [ ] Add integration tests for import preview/apply actions
- [ ] Add integration tests for metric approve/reject behavior
- [ ] Add UI smoke tests for homepage cards, initiative page layout, and auth states
- [ ] Run a full manual QA pass for password auth, Google auth, admin review, import refresh, and market-close lockout

### Data and governance

- [ ] Improve metric generation prompts and review workflow for higher-quality public metrics
- [ ] Add an explicit admin override/edit path for metric component copy before approval
- [ ] Add better provenance display for metric source notes
- [ ] Decide how to surface whether a market is `demo`, `seeded`, or fully `live`

## Post-MVP Backlog

- [ ] Cantonal initiative support
- [ ] Multilingual UI
- [ ] Real-time chart updates
- [ ] Public comments or rationale per forecast
- [ ] Leaderboards or participation profiles
- [ ] More advanced conditional market mechanics without introducing gambling features
