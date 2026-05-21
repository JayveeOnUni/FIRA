const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { env } = require('../src/config/env')

function timestampForFilename(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

async function run() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required before creating a database backup')
  }

  const backupDirectory = path.resolve(__dirname, '..', '..', env.backupDirectory)
  fs.mkdirSync(backupDirectory, { recursive: true })

  const outputPath = path.join(backupDirectory, `fira-backup-${timestampForFilename()}.sql`)
  const child = spawn('pg_dump', [env.databaseUrl, '--no-owner', '--no-privileges', '--file', outputPath], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('error', (error) => {
    console.error('Unable to start pg_dump. Make sure PostgreSQL client tools are installed and on PATH.')
    console.error(error.message)
    process.exit(1)
  })

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Database backup failed with exit code ${code}`)
      process.exit(code || 1)
    }

    console.log(`Database backup created: ${outputPath}`)
  })
}

run().catch((error) => {
  console.error('Database backup failed:', error.message)
  process.exit(1)
})
