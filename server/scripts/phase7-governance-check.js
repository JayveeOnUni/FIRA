const http = require('http')

function createMockAiService(port = 8824) {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          service: 'mock-ai',
          status: 'ok',
          model: 'mock-sbert-phase7',
          matching_ready: true,
        }),
      )
      return
    }

    if (req.method === 'POST' && req.url === '/v1/match/rank') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })

      req.on('end', () => {
        const payload = body ? JSON.parse(body) : {}
        const candidates = Array.isArray(payload.candidates) ? payload.candidates : []

        const items = candidates.map((candidate, index) => ({
          id: String(candidate.id),
          score: Math.max(0.1, 0.92 - index * 0.08),
          explanation: {
            shared_keywords: ['api', 'node', 'recruitment'].slice(0, 3 - (index % 2)),
            summary: 'Mock semantic overlap for Phase 7 governance validation.',
          },
        }))

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            model: 'mock-sbert-phase7',
            query_text: payload.query_text || '',
            count: items.length,
            items,
          }),
        )
      })
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Not found' }))
  })

  let isRunning = false
  return {
    start: () =>
      new Promise((resolve) => {
        if (isRunning) {
          resolve()
          return
        }
        server.listen(port, () => {
          isRunning = true
          resolve()
        })
      }),
    stop: () =>
      new Promise((resolve) => {
        if (!isRunning) {
          resolve()
          return
        }
        server.close(() => {
          isRunning = false
          resolve()
        })
      }),
  }
}

function createSession(baseUrl) {
  let cookie = null

  async function request(method, path, body) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    if (cookie) {
      headers.Cookie = cookie
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      cookie = setCookie.split(';')[0]
    }

    const text = await response.text()
    let json = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    return {
      status: response.status,
      json,
      text,
    }
  }

  return { request }
}

async function run() {
  const apiPort = 4112
  const aiPort = 8824
  const aiService = createMockAiService(aiPort)
  const baseUrl = `http://localhost:${apiPort}/api`

  process.env.AI_SERVICE_URL = `http://localhost:${aiPort}`
  process.env.PORT = String(apiPort)
  process.env.NODE_ENV = 'test'

  const { app } = require('../src/app')
  const server = app.listen(apiPort)
  await aiService.start()

  const applicant = createSession(baseUrl)
  const employer = createSession(baseUrl)
  const staff = createSession(baseUrl)

  const checks = []
  const timestamp = Date.now()

  try {
    await applicant.request('POST', '/auth/register/applicant', {
      email: `phase7.applicant.${timestamp}@fira.local`,
      password: 'Phase7Pass123!',
      firstName: 'Phase7',
      lastName: 'Applicant',
      skillsSummary: 'node api testing',
    })

    await employer.request('POST', '/auth/register/employer', {
      email: `phase7.employer.${timestamp}@fira.local`,
      password: 'Phase7Pass123!',
      firstName: 'Phase7',
      lastName: 'Employer',
      companyName: `Phase7 Company ${timestamp}`,
    })

    await staff.request('POST', '/auth/login', {
      email: 'staff@fira.local',
      password: 'StaffPass123!',
    })

    const job = await employer.request('POST', '/employers/jobs', {
      title: `Phase7 Governance Engineer ${timestamp}`,
      description: 'Maintain governance and ATS tracking logic',
      requiredSkills: 'node api governance',
      status: 'published',
      isPublic: true,
    })
    const jobId = Number(job.json?.job?.id)

    const application = await applicant.request('POST', `/jobs/${jobId}/apply`, {})
    const applicationId = Number(application.json?.application?.id)

    const ranked = await employer.request('GET', `/matching/employer/jobs/${jobId}/ranked-applicants?topN=5`)
    const rankedApplicant = ranked.json?.rankedApplicants?.[0]
    const applicantId = Number(rankedApplicant?.applicant_id)

    checks.push({
      id: 'P7-001',
      status: ranked.status === 200 && rankedApplicant?.relevance_label ? 'pass' : 'fail',
      actual: `status=${ranked.status}; relevance_label=${rankedApplicant?.relevance_label || null}`,
    })

    const createAction = await employer.request(
      'POST',
      `/matching/jobs/${jobId}/applicants/${applicantId}/review-actions`,
      {
        actionType: 'reviewed',
        note: 'Governance check completed',
        applicationId,
      },
    )
    checks.push({
      id: 'P7-002',
      status: createAction.status === 201 ? 'pass' : 'fail',
      actual: `status=${createAction.status}`,
    })

    const createNote = await employer.request(
      'POST',
      `/matching/jobs/${jobId}/applicants/${applicantId}/review-notes`,
      {
        noteType: 'manual_assessment',
        note: 'Manual reviewer confirms contextual fit',
        applicationId,
      },
    )
    checks.push({
      id: 'P7-003',
      status: createNote.status === 201 ? 'pass' : 'fail',
      actual: `status=${createNote.status}`,
    })

    const timeline = await employer.request('GET', `/matching/jobs/${jobId}/applicants/${applicantId}/review-timeline`)
    checks.push({
      id: 'P7-004',
      status:
        timeline.status === 200 &&
        Array.isArray(timeline.json?.actions) &&
        Array.isArray(timeline.json?.notes) &&
        timeline.json.actions.length > 0 &&
        timeline.json.notes.length > 0
          ? 'pass'
          : 'fail',
      actual: `status=${timeline.status}; actions=${timeline.json?.actions?.length || 0}; notes=${timeline.json?.notes?.length || 0}`,
    })

    const operations = await staff.request('GET', '/matching/operations/summary')
    checks.push({
      id: 'P7-005',
      status: operations.status === 200 && operations.json?.runtime ? 'pass' : 'fail',
      actual: `status=${operations.status}; runtime=${Boolean(operations.json?.runtime)}`,
    })

    const summaryCsv = await employer.request('GET', `/matching/jobs/${jobId}/review-summary?format=csv`)
    checks.push({
      id: 'P7-006',
      status: summaryCsv.status === 200 && summaryCsv.text.includes('latest_review_action') ? 'pass' : 'fail',
      actual: `status=${summaryCsv.status}`,
    })

    const blockedApplicantAction = await applicant.request(
      'POST',
      `/matching/jobs/${jobId}/applicants/${applicantId}/review-actions`,
      {
        actionType: 'reviewed',
      },
    )
    checks.push({
      id: 'P7-007',
      status: blockedApplicantAction.status === 403 ? 'pass' : 'fail',
      actual: `status=${blockedApplicantAction.status}`,
    })

    const failed = checks.filter((item) => item.status === 'fail').length
    const summary = {
      executedAt: new Date().toISOString(),
      total: checks.length,
      passed: checks.length - failed,
      failed,
      checks,
    }

    console.log(JSON.stringify(summary, null, 2))

    if (failed > 0) {
      process.exitCode = 1
    }
  } finally {
    await new Promise((resolve) => server.close(resolve))
    await aiService.stop()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
