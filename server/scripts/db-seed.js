const fs = require('fs/promises')
const path = require('path')
const { getPool } = require('../src/config/db')

async function ensureSeedRunsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _seed_runs (
      id BIGSERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)
}

async function getSeedFiles(seedDir) {
  const entries = await fs.readdir(seedDir)
  return entries.filter((name) => name.endsWith('.sql')).sort()
}

async function run() {
  const seedDir = path.resolve(__dirname, '..', '..', 'database', 'seed')
  const files = await getSeedFiles(seedDir)
  const pool = getPool()
  const client = await pool.connect()

  try {
    await ensureSeedRunsTable(client)

    const existingRows = await client.query('SELECT filename FROM _seed_runs')
    const executed = new Set(existingRows.rows.map((row) => row.filename))

    for (const filename of files) {
      if (executed.has(filename)) {
        console.log(`Skipping already executed seed: ${filename}`)
        continue
      }

      const fullPath = path.join(seedDir, filename)
      const sql = await fs.readFile(fullPath, 'utf8')

      console.log(`Running seed: ${filename}`)
      await client.query(sql)
      await client.query('INSERT INTO _seed_runs (filename) VALUES ($1)', [filename])
    }

    console.log('Database seed completed.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})
