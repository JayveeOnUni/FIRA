const { Pool } = require('pg')
const { env } = require('./env')

let pool

function getPool() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
    })
  }

  return pool
}

async function query(text, params = []) {
  const dbPool = getPool()
  return dbPool.query(text, params)
}

async function withTransaction(callback) {
  const dbPool = getPool()
  const client = await dbPool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = { getPool, query, withTransaction }
