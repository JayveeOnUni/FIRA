const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { env } = require('../src/config/env')

async function run() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required before restoring a database backup')
  }

  if (!env.restoreFile) {
    throw new Error('RESTORE_FILE must point to a SQL backup file before running db:restore')
  }

  const restorePath = path.resolve(process.cwd(), env.restoreFile)
  if (!fs.existsSync(restorePath)) {
    throw new Error(`Restore file does not exist: ${restorePath}`)
  }

  console.log(`Restoring database from ${restorePath}`)
  const child = spawn('psql', [env.databaseUrl, '--file', restorePath], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  child.on('error', (error) => {
    console.error('Unable to start psql. Make sure PostgreSQL client tools are installed and on PATH.')
    console.error(error.message)
    process.exit(1)
  })

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Database restore failed with exit code ${code}`)
      process.exit(code || 1)
    }

    console.log('Database restore completed.')
  })
}

run().catch((error) => {
  console.error('Database restore failed:', error.message)
  process.exit(1)
})
