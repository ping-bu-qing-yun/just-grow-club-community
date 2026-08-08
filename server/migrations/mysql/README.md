# Cloud database migration

These files describe the intended production MySQL schema. Migration commands
read connection settings only from environment variables and default to a
read-only dry run.

Required variables:

```text
MYSQL_HOST
MYSQL_PORT=3306
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE=just_grow_club
MYSQL_SSL=true
REDIS_URL=redis://:<password>@<host>:6379
```

Run `npm run db:migrate -- --dry-run` to inspect the target and planned SQL.
Only an explicit `npm run db:migrate -- --apply` may create or alter tables.
Take a database backup and verify row counts before applying. Never put the
passwords in source, shell history, logs, or committed `.env` files.
