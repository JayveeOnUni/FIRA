const http = require('http')

function createMockAiService(port = 8811) {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          service: 'mock-ai',
          status: 'ok',
          model: 'mock-sbert-phase6',
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
        let payload = {}
        try {
          payload = body ? JSON.parse(body) : {}
        } catch {
          payload = {}
        }

        const candidates = Array.isArray(payload.candidates) ? payload.candidates : []
        const items = candidates.map((candidate, index) => ({
          id: String(candidate.id),
          score: Math.max(0.1, 0.95 - index * 0.08),
          explanation: {
            shared_keywords: ['recruitment', 'api', 'javascript'].slice(0, 3 - (index % 2)),
            summary: 'Mock semantic overlap for Phase 6 validation.',
          },
        }))

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            model: 'mock-sbert-phase6',
            query_text: payload.query_text || '',
            count: items.length,
            items,
          }),
        )
      })
      return
    }

    if (req.method === 'POST' && req.url === '/v1/embeddings') {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })

      req.on('end', () => {
        let payload = {}
        try {
          payload = body ? JSON.parse(body) : {}
        } catch {
          payload = {}
        }

        const texts = Array.isArray(payload.texts) ? payload.texts : []
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            model: 'mock-sbert-phase6',
            dimension: 4,
            count: texts.length,
            items: texts.map((text, index) => ({
              index,
              text_preview: String(text).slice(0, 80),
              embedding: [1, 0, 0, 0],
            })),
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

function createApiSession(baseUrl) {
  let cookie = null

  async function request(method, path, body) {
    const headers = {
      Accept: 'application/json',
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    if (cookie) {
      headers.Cookie = cookie
    }

    const start = Date.now()
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const durationMs = Date.now() - start

    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      cookie = setCookieHeader.split(';')[0]
    }

    const json = await response.json().catch(() => null)
    return {
      status: response.status,
      ok: response.ok,
      durationMs,
      json,
    }
  }

  return { request }
}

function createRecorder() {
  const cases = []
  const defects = []

  function record({
    id,
    module,
    preconditions,
    steps,
    expectedResult,
    actualResult,
    status,
    notes = '',
  }) {
    cases.push({
      id,
      module,
      preconditions,
      steps,
      expectedResult,
      actualResult,
      status,
      notes,
    })
  }

  function defect({
    id,
    description,
    severity,
    module,
    status,
    resolution,
  }) {
    defects.push({
      id,
      description,
      severity,
      module,
      status,
      resolution,
    })
  }

  return {
    cases,
    defects,
    record,
    defect,
  }
}

async function run() {
  const apiPort = 4107
  const aiPort = 8811
  const baseUrl = `http://localhost:${apiPort}/api`
  const aiService = createMockAiService(aiPort)
  const recorder = createRecorder()

  process.env.AI_SERVICE_URL = `http://localhost:${aiPort}`
  process.env.PORT = String(apiPort)
  process.env.NODE_ENV = 'test'

  const { app } = require('../src/app')

  const server = app.listen(apiPort)
  await aiService.start()

  const publicApi = createApiSession(baseUrl)
  const applicantApi = createApiSession(baseUrl)
  const employerApi = createApiSession(baseUrl)
  const staffApi = createApiSession(baseUrl)

  const timestamp = Date.now()
  const applicantEmail = `phase6.applicant.${timestamp}@fira.local`
  const employerEmail = `phase6.employer.${timestamp}@fira.local`
  const applicantPassword = 'Phase6Pass123!'
  const employerPassword = 'Phase6Pass123!'
  const staffEmail = 'staff@fira.local'
  const staffPassword = 'StaffPass123!'

  let createdJobId = null
  let createdApplicationId = null

  try {
    const healthResponse = await publicApi.request('GET', '/health')
    recorder.record({
      id: 'TC-001',
      module: 'Health and Readiness',
      preconditions: 'Server, DB, and AI mock service running',
      steps: 'GET /api/health',
      expectedResult: 'HTTP 200 with status ok and dependency checks',
      actualResult: `HTTP ${healthResponse.status}; status=${healthResponse.json?.status}`,
      status:
        healthResponse.status === 200 &&
        ['ok', 'degraded'].includes(healthResponse.json?.status) &&
        healthResponse.json?.database?.status === 'ok'
          ? 'pass'
          : 'fail',
      notes: `Response time ${healthResponse.durationMs}ms`,
    })

    const applicantRegister = await applicantApi.request('POST', '/auth/register/applicant', {
      email: applicantEmail,
      password: applicantPassword,
      firstName: 'Phase6',
      lastName: 'Applicant',
      phone: '09170000001',
      address: 'Manila',
    })
    recorder.record({
      id: 'TC-002',
      module: 'Authentication',
      preconditions: 'No existing account for applicant email',
      steps: 'POST /api/auth/register/applicant',
      expectedResult: 'Applicant account created and authenticated session returned',
      actualResult: `HTTP ${applicantRegister.status}; role=${applicantRegister.json?.user?.role}`,
      status:
        applicantRegister.status === 201 && applicantRegister.json?.user?.role === 'applicant' ? 'pass' : 'fail',
      notes: `Response time ${applicantRegister.durationMs}ms`,
    })

    const employerRegister = await employerApi.request('POST', '/auth/register/employer', {
      email: employerEmail,
      password: employerPassword,
      firstName: 'Phase6',
      lastName: 'Employer',
      companyName: `Phase6 Company ${timestamp}`,
      companyDescription: 'Phase 6 validation company',
      companyAddress: 'Makati',
      companyWebsite: 'https://phase6.local',
      jobTitle: 'HR Manager',
    })
    recorder.record({
      id: 'TC-003',
      module: 'Authentication',
      preconditions: 'No existing account for employer email',
      steps: 'POST /api/auth/register/employer',
      expectedResult: 'Employer account created and authenticated session returned',
      actualResult: `HTTP ${employerRegister.status}; role=${employerRegister.json?.user?.role}`,
      status:
        employerRegister.status === 201 && employerRegister.json?.user?.role === 'employer' ? 'pass' : 'fail',
      notes: `Response time ${employerRegister.durationMs}ms`,
    })

    const staffLogin = await staffApi.request('POST', '/auth/login', {
      email: staffEmail,
      password: staffPassword,
    })
    recorder.record({
      id: 'TC-004',
      module: 'Authentication',
      preconditions: 'Seeded staff account exists',
      steps: 'POST /api/auth/login',
      expectedResult: 'Agency staff login succeeds',
      actualResult: `HTTP ${staffLogin.status}; role=${staffLogin.json?.user?.role}`,
      status: staffLogin.status === 200 && staffLogin.json?.user?.role === 'agency_staff' ? 'pass' : 'fail',
      notes: `Response time ${staffLogin.durationMs}ms`,
    })

    const roleGuardCheck = await applicantApi.request('GET', '/employers/jobs')
    recorder.record({
      id: 'TC-005',
      module: 'Role-Based Access',
      preconditions: 'Authenticated applicant session',
      steps: 'GET /api/employers/jobs',
      expectedResult: 'Access denied with HTTP 403',
      actualResult: `HTTP ${roleGuardCheck.status}`,
      status: roleGuardCheck.status === 403 ? 'pass' : 'fail',
      notes: 'Confirms route-level role guard enforcement.',
    })

    const jobCreate = await employerApi.request('POST', '/employers/jobs', {
      title: `Phase 6 Backend Engineer ${timestamp}`,
      description: 'Maintain ATS and integration services',
      qualifications: 'Node.js and PostgreSQL',
      requiredSkills: 'JavaScript, REST, Recruitment domain',
      location: 'Makati',
      employmentType: 'full_time',
      salary: '70000',
      status: 'published',
      isPublic: true,
    })
    createdJobId = jobCreate.json?.job?.id
    recorder.record({
      id: 'TC-006',
      module: 'Employer Job Workflow',
      preconditions: 'Authenticated employer session with company profile',
      steps: 'POST /api/employers/jobs',
      expectedResult: 'Job created successfully',
      actualResult: `HTTP ${jobCreate.status}; jobId=${createdJobId}`,
      status: jobCreate.status === 201 && Boolean(createdJobId) ? 'pass' : 'fail',
      notes: `Response time ${jobCreate.durationMs}ms`,
    })

    const publicJobs = await publicApi.request('GET', '/jobs')
    recorder.record({
      id: 'TC-007',
      module: 'Public Job Browsing',
      preconditions: 'At least one published public job exists',
      steps: 'GET /api/jobs',
      expectedResult: 'Public job listing contains created job',
      actualResult: `HTTP ${publicJobs.status}; count=${publicJobs.json?.count}`,
      status:
        publicJobs.status === 200 &&
        Array.isArray(publicJobs.json?.jobs) &&
        publicJobs.json.jobs.some((job) => Number(job.id) === Number(createdJobId))
          ? 'pass'
          : 'fail',
      notes: `Response time ${publicJobs.durationMs}ms`,
    })

    const applyResponse = await applicantApi.request('POST', `/jobs/${createdJobId}/apply`, {})
    createdApplicationId = applyResponse.json?.application?.id
    recorder.record({
      id: 'TC-008',
      module: 'Applicant Application Workflow',
      preconditions: 'Authenticated applicant and published job',
      steps: `POST /api/jobs/${createdJobId}/apply`,
      expectedResult: 'Application created with status Applied',
      actualResult: `HTTP ${applyResponse.status}; applicationId=${createdApplicationId}`,
      status: applyResponse.status === 201 && Boolean(createdApplicationId) ? 'pass' : 'fail',
      notes: `Response time ${applyResponse.durationMs}ms`,
    })

    const duplicateApply = await applicantApi.request('POST', `/jobs/${createdJobId}/apply`, {})
    recorder.record({
      id: 'TC-009',
      module: 'Reliability - Duplicate Prevention',
      preconditions: 'Existing application for applicant/job pair',
      steps: `POST /api/jobs/${createdJobId}/apply again`,
      expectedResult: 'Duplicate prevented with HTTP 409',
      actualResult: `HTTP ${duplicateApply.status}`,
      status: duplicateApply.status === 409 ? 'pass' : 'fail',
      notes: 'Verifies unique application constraint behavior.',
    })

    const staffUpdate = await staffApi.request('PATCH', `/agency-staff/applications/${createdApplicationId}/status`, {
      newStatus: 'Under Review',
      note: 'Phase 6 staff review',
    })
    recorder.record({
      id: 'TC-010',
      module: 'ATS Staff Workflow',
      preconditions: 'Staff authenticated and application exists',
      steps: `PATCH /api/agency-staff/applications/${createdApplicationId}/status`,
      expectedResult: 'Status updates to Under Review',
      actualResult: `HTTP ${staffUpdate.status}; status=${staffUpdate.json?.application?.status}`,
      status:
        staffUpdate.status === 200 && staffUpdate.json?.application?.status === 'Under Review' ? 'pass' : 'fail',
      notes: `Response time ${staffUpdate.durationMs}ms`,
    })

    const staffEndorse = await staffApi.request('POST', `/agency-staff/applications/${createdApplicationId}/endorse`, {
      note: 'Strong fit for role',
    })
    recorder.record({
      id: 'TC-011',
      module: 'Endorsement Workflow',
      preconditions: 'Staff authenticated and application in active ATS flow',
      steps: `POST /api/agency-staff/applications/${createdApplicationId}/endorse`,
      expectedResult: 'Application endorsed and status set to Endorsed',
      actualResult: `HTTP ${staffEndorse.status}; status=${staffEndorse.json?.application?.status}`,
      status: staffEndorse.status === 201 && staffEndorse.json?.application?.status === 'Endorsed' ? 'pass' : 'fail',
      notes: `Response time ${staffEndorse.durationMs}ms`,
    })

    const applicantAppsBeforeMatch = await applicantApi.request('GET', '/applicants/applications')
    const statusBeforeMatch =
      applicantAppsBeforeMatch.json?.applications?.find(
        (item) => Number(item.id) === Number(createdApplicationId),
      )?.status || null

    const applicantRecommendations = await applicantApi.request('GET', '/matching/applicant/recommended-jobs?topN=5')
    recorder.record({
      id: 'TC-012',
      module: 'Applicant Matching Workflow',
      preconditions: 'Applicant authenticated with profile and at least one published job',
      steps: 'GET /api/matching/applicant/recommended-jobs',
      expectedResult: 'Recommendations returned with scores',
      actualResult: `HTTP ${applicantRecommendations.status}; count=${applicantRecommendations.json?.count}`,
      status:
        applicantRecommendations.status === 200 &&
        Array.isArray(applicantRecommendations.json?.recommendations) &&
        applicantRecommendations.json.recommendations.length > 0 &&
        typeof applicantRecommendations.json.recommendations[0]?.match_score === 'number'
          ? 'pass'
          : 'fail',
      notes: `Response time ${applicantRecommendations.durationMs}ms`,
    })

    const employerRanking = await employerApi.request(
      'GET',
      `/matching/employer/jobs/${createdJobId}/ranked-applicants?topN=10`,
    )
    recorder.record({
      id: 'TC-013',
      module: 'Employer Matching Workflow',
      preconditions: 'Employer authenticated and applicants exist for job',
      steps: `GET /api/matching/employer/jobs/${createdJobId}/ranked-applicants`,
      expectedResult: 'Ranked applicants returned with scores',
      actualResult: `HTTP ${employerRanking.status}; count=${employerRanking.json?.count}`,
      status:
        employerRanking.status === 200 &&
        Array.isArray(employerRanking.json?.rankedApplicants) &&
        employerRanking.json.rankedApplicants.length > 0 &&
        typeof employerRanking.json.rankedApplicants[0]?.match_score === 'number'
          ? 'pass'
          : 'fail',
      notes: `Response time ${employerRanking.durationMs}ms`,
    })

    const staffRanking = await staffApi.request('GET', `/matching/staff/jobs/${createdJobId}/ranked-applicants?topN=10`)
    recorder.record({
      id: 'TC-014',
      module: 'Staff Matching Visibility',
      preconditions: 'Staff authenticated and applicants exist for job',
      steps: `GET /api/matching/staff/jobs/${createdJobId}/ranked-applicants`,
      expectedResult: 'Ranked applicants returned for staff with scores',
      actualResult: `HTTP ${staffRanking.status}; count=${staffRanking.json?.count}`,
      status:
        staffRanking.status === 200 &&
        Array.isArray(staffRanking.json?.rankedApplicants) &&
        staffRanking.json.rankedApplicants.length > 0 &&
        typeof staffRanking.json.rankedApplicants[0]?.match_score === 'number'
          ? 'pass'
          : 'fail',
      notes: `Response time ${staffRanking.durationMs}ms`,
    })

    const applicantAppsAfterMatch = await applicantApi.request('GET', '/applicants/applications')
    const statusAfterMatch =
      applicantAppsAfterMatch.json?.applications?.find(
        (item) => Number(item.id) === Number(createdApplicationId),
      )?.status || null

    recorder.record({
      id: 'TC-015',
      module: 'Decision-Support Integrity',
      preconditions: 'Application already endorsed before matching call',
      steps: 'Call matching endpoints and re-check application status',
      expectedResult: 'ATS status remains unchanged by matching calls',
      actualResult: `before=${statusBeforeMatch}; after=${statusAfterMatch}`,
      status: statusBeforeMatch === statusAfterMatch ? 'pass' : 'fail',
      notes: 'Confirms matching does not auto-mutate ATS state.',
    })

    await aiService.stop()
    const matchingUnavailable = await applicantApi.request('GET', '/matching/applicant/recommended-jobs?topN=3')
    recorder.record({
      id: 'TC-016',
      module: 'Reliability - Dependency Failure Handling',
      preconditions: 'AI service intentionally stopped',
      steps: 'GET /api/matching/applicant/recommended-jobs',
      expectedResult: 'Graceful 503 with meaningful message',
      actualResult: `HTTP ${matchingUnavailable.status}; message=${matchingUnavailable.json?.message || matchingUnavailable.json?.detail}`,
      status: matchingUnavailable.status === 503 ? 'pass' : 'fail',
      notes: 'Validates fallback behavior when AI service is unavailable.',
    })

    const failedCases = recorder.cases.filter((item) => item.status === 'fail')
    if (failedCases.length > 0) {
      recorder.defect({
        id: 'DEF-001',
        description: `${failedCases.length} functional checks failed during automated run`,
        severity: 'high',
        module: 'cross-module',
        status: 'open',
        resolution: 'Review failed test IDs and fix before demo.',
      })
    }

    const summary = {
      executedAt: new Date().toISOString(),
      total: recorder.cases.length,
      passed: recorder.cases.filter((item) => item.status === 'pass').length,
      failed: recorder.cases.filter((item) => item.status === 'fail').length,
      cases: recorder.cases,
      defects: recorder.defects,
    }

    console.log(JSON.stringify(summary, null, 2))

    if (summary.failed > 0) {
      process.exitCode = 1
    }
  } finally {
    if (server.listening) {
      await new Promise((resolve) => server.close(resolve))
    }

    try {
      await aiService.stop()
    } catch {
      // no-op
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
