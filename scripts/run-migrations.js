/* Minimal migration runner for Postgres/Neon
 * Applies SQL files in src/db/migrations in lexical order.
 * Usage: DATABASE_URL=... node scripts/run-migrations.js
 */
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function main() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!url) {
    console.log('No DATABASE_URL/NEON_DATABASE_URL set. Skipping migrations.')
    process.exit(0)
  }

  const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found:', migrationsDir)
    process.exit(0)
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    await client.query(
      'CREATE TABLE IF NOT EXISTS migrations (id serial primary key, filename text unique not null, applied_at timestamptz default now())'
    )

    for (const file of files) {
      const already = await client.query('SELECT 1 FROM migrations WHERE filename = $1', [file])
      if (already.rowCount) {
        console.log('Skipping already applied migration:', file)
        continue
      }
      const full = path.join(migrationsDir, file)
      const sql = fs.readFileSync(full, 'utf8')
      console.log('Applying migration:', file)
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file])
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        console.error('Migration failed:', file, e.message)
        process.exitCode = 1
        break
      }
    }
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('Migration runner error:', e)
  process.exit(1)
})

