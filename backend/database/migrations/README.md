# Database migrations

Incremental schema changes, applied **after** the baseline `../schema.sql`.

## Order

1. `../schema.sql` — baseline tables (users, documents, tax_forms, sessions).
2. Every file in this folder, in numeric order (`001_...`, `002_...`, ...).

Each migration is idempotent (uses `IF NOT EXISTS` / `DROP ... IF EXISTS`), so
re-running one is safe.

## Apply to the local Docker database

From the project root, with the `fileup-postgres` container running:

```bash
docker exec -i fileup-postgres psql -U postgres -d tax_filing_db -v ON_ERROR_STOP=1 < backend/database/migrations/001_cases_roles_documents.sql
```

## Migrations

| File | What it adds |
|------|--------------|
| `001_cases_roles_documents.sql` | User CNIC/phone/role, `tax_cases` with status flow, document typing + case link, `case_notes`, `case_audit_log` |
