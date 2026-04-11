const { query, withTransaction } = require('../config/db')
const { ApiError } = require('../utils/ApiError')
const { hashPassword, comparePassword } = require('../utils/password')
const { logAuditEvent } = require('./audit.service')

function mapSafeUser(row) {
  return {
    id: Number(row.id),
    email: row.email,
    role: row.role_name,
    firstName: row.first_name,
    lastName: row.last_name,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

async function getRole(client, roleName) {
  const result = await client.query('SELECT id, name FROM roles WHERE name = $1 LIMIT 1', [roleName])
  if (!result.rows[0]) {
    throw new ApiError(500, `Role "${roleName}" is not configured in the database`)
  }

  return result.rows[0]
}

async function createUserRecord(client, { email, password, firstName, lastName, roleName }) {
  const role = await getRole(client, roleName)
  const passwordHash = await hashPassword(password)

  try {
    const userResult = await client.query(
      `
      INSERT INTO users (email, password_hash, role_id, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, is_active, created_at
      `,
      [email.toLowerCase(), passwordHash, role.id, firstName, lastName],
    )

    return {
      ...userResult.rows[0],
      role_name: role.name,
    }
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'An account with this email already exists')
    }
    throw error
  }
}

async function registerApplicant(payload) {
  const userRow = await withTransaction(async (client) => {
    const createdUser = await createUserRecord(client, {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      roleName: 'applicant',
    })

    await client.query(
      `
      INSERT INTO applicants (user_id, phone, address, profile_status)
      VALUES ($1, $2, $3, $4)
      `,
      [createdUser.id, payload.phone || null, payload.address || null, 'incomplete'],
    )

    return createdUser
  })

  await logAuditEvent({
    userId: userRow.id,
    action: 'auth.register.applicant',
    entityType: 'users',
    entityId: userRow.id,
  })

  return mapSafeUser(userRow)
}

async function registerEmployer(payload) {
  const userRow = await withTransaction(async (client) => {
    const createdUser = await createUserRecord(client, {
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      roleName: 'employer',
    })

    const companyResult = await client.query(
      `
      INSERT INTO companies (name, description, address, website)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [payload.companyName, payload.companyDescription || null, payload.companyAddress || null, payload.companyWebsite || null],
    )

    await client.query(
      `
      INSERT INTO employers (user_id, company_id, job_title)
      VALUES ($1, $2, $3)
      `,
      [createdUser.id, companyResult.rows[0].id, payload.jobTitle || null],
    )

    return createdUser
  })

  await logAuditEvent({
    userId: userRow.id,
    action: 'auth.register.employer',
    entityType: 'users',
    entityId: userRow.id,
  })

  return mapSafeUser(userRow)
}

async function login({ email, password }) {
  const result = await query(
    `
    SELECT
      u.id,
      u.email,
      u.password_hash,
      u.first_name,
      u.last_name,
      u.is_active,
      u.created_at,
      r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
    `,
    [email],
  )

  const user = result.rows[0]

  if (!user) {
    throw new ApiError(401, 'Invalid email or password')
  }

  const passwordMatch = await comparePassword(password, user.password_hash)
  if (!passwordMatch) {
    throw new ApiError(401, 'Invalid email or password')
  }

  if (!user.is_active) {
    throw new ApiError(403, 'Your account is currently inactive')
  }

  await logAuditEvent({
    userId: user.id,
    action: 'auth.login.success',
    entityType: 'users',
    entityId: user.id,
  })

  return mapSafeUser(user)
}

async function getUserById(userId) {
  const result = await query(
    `
    SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.is_active,
      u.created_at,
      r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId],
  )

  return result.rows[0] ? mapSafeUser(result.rows[0]) : null
}

async function getCurrentUserProfile(user) {
  if (!user) {
    return null
  }

  if (user.role === 'applicant') {
    const result = await query(
      `
      SELECT id, user_id, phone, address, profile_status, created_at, updated_at
      ,
      date_of_birth,
      education_summary,
      work_experience_summary,
      skills_summary,
      preferred_job_category
      FROM applicants
      WHERE user_id = $1
      LIMIT 1
      `,
      [user.id],
    )
    return {
      user,
      profileType: 'applicant',
      profile: result.rows[0] || null,
    }
  }

  if (user.role === 'employer') {
    const result = await query(
      `
      SELECT
        e.id,
        e.user_id,
        e.company_id,
        e.job_title,
        e.created_at,
        e.updated_at,
        c.name AS company_name,
        c.description AS company_description,
        c.address AS company_address,
        c.website AS company_website,
        c.contact_number AS company_contact_number,
        c.country AS company_country
      FROM employers e
      LEFT JOIN companies c ON c.id = e.company_id
      WHERE e.user_id = $1
      LIMIT 1
      `,
      [user.id],
    )
    return {
      user,
      profileType: 'employer',
      profile: result.rows[0] || null,
    }
  }

  if (user.role === 'agency_staff') {
    const result = await query(
      `
      SELECT id, user_id, department, created_at, updated_at
      FROM agency_staff_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [user.id],
    )
    return {
      user,
      profileType: 'agency_staff',
      profile: result.rows[0] || null,
    }
  }

  return {
    user,
    profileType: 'unknown',
    profile: null,
  }
}

module.exports = {
  registerApplicant,
  registerEmployer,
  login,
  getUserById,
  getCurrentUserProfile,
}
