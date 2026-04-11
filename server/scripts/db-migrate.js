const fs = require('fs/promises')
const path = require('path')
const { getPool } = require('../src/config/db')

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

async function getMigrationFiles(migrationsDir) {
  const entries = await fs.readdir(migrationsDir)
  return entries.filter((name) => name.endsWith('.sql')).sort()
}

async function run() {
  const migrationsDir = path.resolve(__dirname, '..', '..', 'database', 'migrations')
  const files = await getMigrationFiles(migrationsDir)
  const pool = getPool()
  const client = await pool.connect()

  try {
    await ensureMigrationsTable(client)

    const existingRows = await client.query('SELECT filename FROM _schema_migrations')
    const executed = new Set(existingRows.rows.map((row) => row.filename))

    for (const filename of files) {
      if (executed.has(filename)) {
        console.log(`Skipping already executed migration: ${filename}`)
        continue
      }

      const fullPath = path.join(migrationsDir, filename)
      const sql = await fs.readFile(fullPath, 'utf8')

      console.log(`Running migration: ${filename}`)
      await client.query(sql)
      await client.query('INSERT INTO _schema_migrations (filename) VALUES ($1)', [filename])
    }

    console.log('Database migrations completed.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error('Migration failed:', error.message)
  process.exit(1)
})
