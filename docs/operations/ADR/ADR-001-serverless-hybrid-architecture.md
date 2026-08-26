# ADR-001: Serverless/Client-Side Hybrid Architecture

## Status
**Accepted**

## Context
Static web applications hosted on GitHub Pages cannot securely store secret database credentials or host persistent relational database servers. Traditional backend hosting introduces recurring cloud bills, complex DevOps pipelines, and maintenance overhead for indie and open-source games.

## Decision
Adopt a **Serverless/Client-Side Hybrid Model**:
1. **Frontend Hosting:** Static GitHub Pages CDN serving HTML5, CSS3, and Vanilla JavaScript.
2. **Persistence Layer:** Google Sheets accessed via a deployed Google Apps Script Web App acting as a secure REST API endpoint.
3. **Data Communication:** Client sends JSON payloads using `fetch()` with `mode: 'no-cors'`.
4. **Offline Resilience:** Local memory buffering handles offline play when network is unreachable.

## Consequences
### Positive
- **\$0.00 / month infrastructure cost:** Completely free hosting and database tier.
- **Instant deployment:** Updates are published instantly via `git push`.
- **Direct data visibility:** Stakeholders can inspect and query real-time player data in Google Sheets GUI.

### Negative / Trade-offs
- Google Apps Script execution time limits (6 minutes max).
- `no-cors` mode in browser prevents direct reading of response bodies in cross-origin setups (mitigated by asynchronous event dispatching).
