# FileUp

Income tax filing for salaried people in Pakistan. Users upload their bank
statements and payslips, get an instant AI estimate, our team confirms the
final return, and we file it with FBR on IRIS for a flat fee.

Tax-law background (slabs, what counts as already paid, the wealth
statement): [docs/TAX_RULES.md](docs/TAX_RULES.md).

## Stack

- **frontend/**: React 18 + TypeScript + Vite, on port 3000. The user app lives in
  `src/fileup/`, the admin panel in `src/fileup/admin/`.
- **backend/**: Express + TypeScript, on port 4000. PostgreSQL via `pg`.
  Uploaded documents are read with pdf.js (digital PDFs) and Tesseract OCR
  (photos and scanned PDFs).
- **Database**: PostgreSQL 16 in Docker.

## Setup

Prerequisites: Node.js 20+ and Docker Desktop.

```bash
npm run setup
```

Start the database (the host port is 55432 because Windows reserves 5432–5467):

```bash
docker run -d --name fileup-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tax_filing_db -p 55432:5432 -v fileup_pgdata:/var/lib/postgresql/data postgres:16
```

Create the tables, then apply each migration in order (see
[backend/database/migrations/README.md](backend/database/migrations/README.md)):

```bash
docker exec -i fileup-postgres psql -U postgres -d tax_filing_db -v ON_ERROR_STOP=1 < backend/database/schema.sql
```

Create `backend/.env` (it's git-ignored):

```
JWT_SECRET=<a long random string>
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:55432/tax_filing_db
TEAM_SLA_HOURS=24
```

`TEAM_SLA_HOURS` is the team's turnaround promise shown on the estimate
screen. The frontend reads `VITE_API_URL` (default `http://localhost:4000`).

## Run

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Then open http://localhost:3000. If Docker Desktop isn't running, start it and
run `docker start fileup-postgres`.

## Notes

- `backend/test-fixtures/` holds three **fake** salary slips for testing
  extraction. Real documents can be dropped there for local testing but are
  git-ignored. This repository is public, so never commit anyone's real documents.
- Much of the flow after upload is still mocked in the browser (estimate
  figures, team review, payment verification). The backend currently handles
  sign-up, login, uploads and text extraction.
