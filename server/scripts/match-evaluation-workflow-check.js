const http = require('http')

function createMockAiService(port = 8831) {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ service: 'mock-ai', status: 'ok', model: 'mock-eval', matching_ready: true }))
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
        const items = candidates
          .map((candidate, index) => ({
            id: String(candidate.id),
            score: Math.max(0.05, 0.9 - index * 0.07),
            explanation: { shared_keywords: ['recruitment'], summary: 'Mock eval rank' },
          }))
          .sort((a, b) => b.score - a.score)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ model: 'mock-eval', query_text: payload.query_text || '', count: items.length, items }))
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
        if (isRunning) return resolve()
        server.listen(port, () => {
          isRunning = true
          resolve()
        })
      }),
    stop: () =>
      new Promise((resolve) => {
        if (!isRunning) return resolve()
        server.close(() => {
          isRunning = false
          resolve()
        })
      }),
  }
}

function createSession(baseUrl) {
  let cookie = null

  return {
    async request(method, path, body) {
      const headers = { Accept: 'application/json' }
      if (body !== undefined) headers['Content-Type'] = 'application/json'
      if (cookie) headers.Cookie = cookie

      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      const setCookie = response.headers.get('set-cookie')
      if (setCookie) cookie = setCookie.split(';')[0]

      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text()
      return { status: response.status, json: payload, text: typeof payload === 'string' ? payload : null }
    },
  }
}

async function run() {
  const apiPort = 4112
  const aiPort = 8831
  const baseUrl = `http://localhost:${apiPort}/api`
  const aiService = createMockAiService(aiPort)

  process.env.AI_SERVICE_URL = `http://localhost:${aiPort}`
  process.env.PORT = String(apiPort)
  process.env.NODE_ENV = 'test'

  const { app } = require('../src/app')
  const server = app.listen(apiPort)
  await aiService.start()

  const staffApi = createSession(baseUrl)
  const applicantApi = createSession(baseUrl)
  const results = []

  function record(name, pass, details = '') {
    results.push({ name, pass, details })
  }

  try {
    const staffLogin = await staffApi.request('POST', '/auth/login', {
      email: 'staff@fira.local',
      password: 'StaffPass123!',
    })
    record('staff login', staffLogin.status === 200, `status=${staffLogin.status}`)

    const deniedForApplicant = await applicantApi.request('GET', '/matching-evaluation/datasets')
    record(
      'applicant denied on evaluation routes',
      deniedForApplicant.status === 401 || deniedForApplicant.status === 403,
      `status=${deniedForApplicant.status}`,
    )

    const datasetCreate = await staffApi.request('POST', '/matching-evaluation/datasets', {
      name: `Eval Dataset ${Date.now()}`,
      version: 'v1',
      description: 'Workflow validation dataset',
      status: 'active',
    })
    const datasetId = datasetCreate.json?.dataset?.id
    record('create dataset', datasetCreate.status === 201 && datasetId, `datasetId=${datasetId}`)

    let jobs = await staffApi.request('GET', '/agency-staff/jobs')
    let applicants = await staffApi.request('GET', '/agency-staff/applicants')
    let jobId = jobs.json?.jobs?.[0]?.id
    let applicantId = applicants.json?.applicants?.[0]?.applicant_id || applicants.json?.applicants?.[0]?.id

    if (!jobId || !applicantId) {
      const timestamp = Date.now()
      const employerApi = createSession(baseUrl)
      const applicantApi = createSession(baseUrl)

      await employerApi.request('POST', '/auth/register/employer', {
        email: `eval.employer.${timestamp}@fira.local`,
        password: 'EvalPass123!',
        firstName: 'Eval',
        lastName: 'Employer',
        companyName: `Eval Company ${timestamp}`,
        companyDescription: 'Evaluation workflow fixture employer',
        companyAddress: 'Manila',
        companyWebsite: 'https://eval.local',
        jobTitle: 'HR Manager',
      })

      await applicantApi.request('POST', '/auth/register/applicant', {
        email: `eval.applicant.${timestamp}@fira.local`,
        password: 'EvalPass123!',
        firstName: 'Eval',
        lastName: 'Applicant',
        phone: '09170000999',
        address: 'Manila',
      })

      await applicantApi.request('PATCH', '/applicants/profile', {
        preferredJobCategory: 'Domestic Helper',
        skillsSummary: 'childcare, housekeeping, cooking',
        workExperienceSummary: '3 years overseas domestic work',
        educationSummary: 'High school graduate',
      })

      const jobCreate = await employerApi.request('POST', '/employers/jobs', {
        title: 'Domestic Helper',
        description: 'Housekeeping and childcare support for family residence',
        qualifications: 'At least 2 years relevant experience',
        requiredSkills: 'childcare, housekeeping',
        location: 'Hong Kong',
        employmentType: 'Full-time',
        salary: 'Negotiable',
        status: 'published',
        isPublic: true,
      })

      jobId = jobCreate.json?.job?.id
      applicants = await staffApi.request('GET', '/agency-staff/applicants')
      applicantId = applicants.json?.applicants?.[0]?.applicant_id || applicants.json?.applicants?.[0]?.id
    }

    if (jobId && applicantId) {
      await staffApi.request('POST', `/matching-evaluation/datasets/${datasetId}/jobs`, { jobIds: [jobId] })
      await staffApi.request('POST', `/matching-evaluation/datasets/${datasetId}/applicants`, {
        applicantIds: [applicantId],
      })

      const labelSave = await staffApi.request('POST', `/matching-evaluation/datasets/${datasetId}/labels`, {
        jobId,
        applicantId,
        relevanceLabel: 'relevant',
        labelNotes: 'Workflow validation label',
      })
      record('upsert relevance label', labelSave.status === 200, `status=${labelSave.status}`)

      const runExecute = await staffApi.request('POST', `/matching-evaluation/datasets/${datasetId}/runs`, {
        runName: 'Workflow baseline comparison',
        methods: ['keyword_overlap', 'tfidf', 'sbert'],
      })
      const runId = runExecute.json?.run?.id
      record(
        'execute evaluation run',
        runExecute.status === 201 && runId && runExecute.json?.summary?.methods,
        `runId=${runId}; status=${runExecute.json?.run?.status}`,
      )

      const runJson = await staffApi.request('GET', `/matching-evaluation/runs/${runId}`)
      record(
        'retrieve run summary json',
        runJson.status === 200 && runJson.json?.metrics?.length > 0,
        `metrics=${runJson.json?.metrics?.length || 0}`,
      )

      const runCsv = await staffApi.request('GET', `/matching-evaluation/runs/${runId}?format=csv`)
      record(
        'export run summary csv',
        runCsv.status === 200 && typeof runCsv.json === 'string' && runCsv.json.includes('precision_at_5'),
        `bytes=${(runCsv.json || '').length}`,
      )
    } else {
      record('seeded job/applicant available', false, 'Missing seeded records for workflow run')
    }

    const passed = results.filter((item) => item.pass).length
    const failed = results.filter((item) => !item.pass)

    console.log(
      JSON.stringify(
        {
          message: failed.length ? 'Matching evaluation workflow checks failed' : 'Matching evaluation workflow checks passed',
          passed,
          total: results.length,
          results,
        },
        null,
        2,
      ),
    )

    process.exitCode = failed.length ? 1 : 0
  } finally {
    await aiService.stop()
    await new Promise((resolve) => server.close(resolve))
  }
}

run().catch((error) => {
  console.error(JSON.stringify({ message: 'Workflow check crashed', error: error.message }, null, 2))
  process.exit(1)
})
