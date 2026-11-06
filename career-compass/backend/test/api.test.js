import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../src/app.js'
import { UpstreamServiceError } from '../src/errors.js'
import {
  careerAnalysisJsonSchema,
  createCareerAnalysisJsonSchema,
  isCareerAnalysis,
} from '../src/services/careerAnalysisContract.js'
import { validateAssessment } from '../src/validation/assessment.js'
import { hashSessionToken } from '../src/auth.js'

const sampleAssessment = {
  educationLevel: 'College / undergraduate',
  studyArea: 'Computer science & technology',
  interests: ['Technology', 'Design & creativity'],
  strengths: ['Creative problem-solving', 'Research and curiosity'],
  workPriority: 'Room to keep learning',
}

const sampleAnalysis = {
  summary: 'Your curiosity and creative problem-solving suggest several paths worth exploring.',
  careerSuggestions: [
    {
      title: 'UX designer',
      reasoning: 'This combines technology with your interest in design.',
      requiredSkills: ['Prototyping', 'User research', 'Visual design'],
      potentialSkillGaps: [{
        skill: 'Prototyping',
        importance: 'medium',
        assessmentEvidence: 'Your answers do not describe prior prototyping experience.',
        whyItMatters: 'Prototyping helps test ideas before implementation.',
        firstAction: 'Create a paper prototype for a familiar app.',
      }],
    },
    {
      title: 'Product researcher',
      reasoning: 'Your interest in research and curiosity could support user studies.',
      requiredSkills: ['Interviewing', 'Research synthesis', 'Communication'],
      potentialSkillGaps: [{
        skill: 'Interviewing',
        importance: 'medium',
        assessmentEvidence: 'The assessment does not establish interview experience.',
        whyItMatters: 'Interviews can help identify user needs.',
        firstAction: 'Practice writing five open-ended interview questions.',
      }],
    },
    {
      title: 'Digital accessibility specialist',
      reasoning: 'Creative problem-solving can help make digital products easier to use.',
      requiredSkills: ['Accessibility standards', 'Testing', 'Clear documentation'],
      potentialSkillGaps: [{
        skill: 'Accessibility testing',
        importance: 'high',
        assessmentEvidence: 'No accessibility experience was included in the answers.',
        whyItMatters: 'Testing helps uncover barriers for people with disabilities.',
        firstAction: 'Try a keyboard-only walkthrough of a public website.',
      }],
    },
    {
      title: 'Interaction designer',
      reasoning: 'Your design interest and technology studies could translate into designing clear digital interactions.',
      requiredSkills: ['Interaction design', 'Prototyping', 'User research'],
      potentialSkillGaps: [{
        skill: 'Interaction design',
        importance: 'medium',
        assessmentEvidence: 'Your answers show design interest but do not describe interaction design practice.',
        whyItMatters: 'Interaction choices shape how people complete tasks in a digital product.',
        firstAction: 'Sketch two alternative flows for a familiar app task.',
      }],
    },
    {
      title: 'Technical content designer',
      reasoning: 'Your writing and technology interests could combine in clear product instructions and help content.',
      requiredSkills: ['Technical writing', 'Information architecture', 'Product literacy'],
      potentialSkillGaps: [{
        skill: 'Technical writing',
        importance: 'medium',
        assessmentEvidence: 'The assessment does not establish experience writing technical guidance.',
        whyItMatters: 'Clear instructions help people use tools with fewer barriers.',
        firstAction: 'Rewrite a short help article for a beginner and ask someone to follow it.',
      }],
    },
  ],
  sixMonthRoadmap: Array.from({ length: 6 }, (_value, index) => ({
    month: index + 1,
    focus: `Learning focus ${index + 1}`,
    learningGoals: ['Understand a core concept', 'Practice explaining what you learned'],
    activities: ['Complete a beginner lesson', 'Apply it in a short weekly exercise'],
    milestone: 'Save a short reflection and example of your work.',
  })),
  beginnerProjects: [
    { title: 'Paper prototype', description: 'Sketch and test a simple flow.', skillsPracticed: ['Prototyping', 'Listening'], deliverable: 'A short prototype with test notes.', estimatedHours: 5 },
    { title: 'Accessible page review', description: 'Review a page using a keyboard.', skillsPracticed: ['Accessibility testing', 'Documentation'], deliverable: 'A concise findings checklist.', estimatedHours: 4 },
    { title: 'Mini user study', description: 'Ask a volunteer about a task.', skillsPracticed: ['Interviewing', 'Research synthesis'], deliverable: 'A one-page summary of observations.', estimatedHours: 6 },
  ],
}

let server
let baseUrl
let analysisFailure
let receivedAssessment
let savedAssessment
let savedFeedback
let authenticatedHeaders
let createdUser
let progressUserId
let updatedProgress
let latestAssessmentUserId

before(async () => {
  const users = new Map()
  const sessions = new Map()
  const testToken = 'a'.repeat(64)
  sessions.set(hashSessionToken(testToken), { id: 'test-user' })
  const repository = {
    isConfigured: () => true,
    createUser: async (user) => {
      createdUser = user
      users.set(user.email, { id: 'new-user', password_hash: user.passwordHash })
      return 'new-user'
    },
    getUserByEmail: async (email) => users.get(email) ?? null,
    createOrGetGoogleUser: async () => 'google-user',
    createSession: async (tokenHash, userId) => sessions.set(tokenHash, { id: userId }),
    getSessionUser: async (tokenHash) => sessions.get(tokenHash) ?? null,
    deleteSession: async (tokenHash) => sessions.delete(tokenHash),
    saveAssessment: async (userId, answers, analysis) => {
      savedAssessment = { userId, answers, analysis }
      return 'test-assessment-id'
    },
    getLatestAssessment: async (userId) => {
      latestAssessmentUserId = userId
      return savedAssessment
        ? { id: 'test-assessment-id', analysis: savedAssessment.analysis }
        : null
    },
    getProgress: async (userId) => {
      progressUserId = userId
      return [{ month: 1, focus: 'Start exploring', completed: false }]
    },
    setProgress: async (userId, month, completed) => {
      updatedProgress = { userId, month, completed }
      return updatedProgress
    },
    saveFeedback: async (userId, rating, message) => { savedFeedback = { userId, rating, message } },
  }
  const app = createApp({
    repository,
    analysisConfigured: true,
    analyzeCareer: async (assessment) => {
      receivedAssessment = assessment
      if (analysisFailure) throw analysisFailure
      return {
        ...sampleAnalysis,
        careerSuggestions: Array.from({ length: assessment.careerPathCount }, (_value, index) => {
          const career = sampleAnalysis.careerSuggestions[index % sampleAnalysis.careerSuggestions.length]
          return index < sampleAnalysis.careerSuggestions.length
            ? career
            : { ...career, title: `Additional career option ${index + 1}` }
        }),
      }
    },
  })
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
  authenticatedHeaders = { cookie: `margdarshak_session=${testToken}` }
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

test('health endpoint responds successfully', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'ok',
    services: { accountStorage: 'configured', careerAnalysis: 'configured' },
    missingConfiguration: [],
  })
})

test('health endpoint identifies missing production configuration', async () => {
  const unavailableApp = createApp({
    repository: { isConfigured: () => false },
    analysisConfigured: false,
  })
  const unavailableServer = unavailableApp.listen(0)
  await new Promise((resolve) => unavailableServer.once('listening', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${unavailableServer.address().port}/api/health`)
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), {
      status: 'degraded',
      services: { accountStorage: 'missing', careerAnalysis: 'missing' },
      missingConfiguration: ['DATABASE_URL', 'GEMINI_API_KEY'],
    })
  } finally {
    await new Promise((resolve, reject) => {
      unavailableServer.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

test('account service explains when storage is not configured', async () => {
  const unavailableApp = createApp({
    repository: { isConfigured: () => false },
  })
  const unavailableServer = unavailableApp.listen(0)
  await new Promise((resolve) => unavailableServer.once('listening', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${unavailableServer.address().port}/api/auth/session`)
    const body = await response.json()
    assert.equal(response.status, 503)
    assert.match(body.message, /DATABASE_URL/)
    assert.match(body.message, /Google client ID does not replace/)
  } finally {
    await new Promise((resolve, reject) => {
      unavailableServer.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

test('database connection errors during signup return a safe JSON response', async () => {
  const unavailableApp = createApp({
    repository: {
      isConfigured: () => true,
      createUser: async () => {
        throw Object.assign(new Error('private database connection detail'), { code: 'ECONNREFUSED' })
      },
    },
  })
  const unavailableServer = unavailableApp.listen(0)
  await new Promise((resolve) => unavailableServer.once('listening', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${unavailableServer.address().port}/api/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Student Example',
        email: 'student@example.com',
        password: 'a secure password 123',
      }),
    })
    const body = await response.json()
    assert.equal(response.status, 503)
    assert.equal(body.error, 'ACCOUNT_STORAGE_UNAVAILABLE')
    assert.match(body.message, /Supabase DATABASE_URL/)
    assert.equal(JSON.stringify(body).includes('private database connection detail'), false)
  } finally {
    await new Promise((resolve, reject) => {
      unavailableServer.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

test('valid assessment returns generated analysis', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify(sampleAssessment),
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { analysis: sampleAnalysis, assessmentId: 'test-assessment-id' })
  assert.equal(savedAssessment.userId, 'test-user')
  assert.deepEqual(savedAssessment.answers, {
    ...sampleAssessment,
    careerPathCount: 5,
    indiaContext: '',
    indiaStudyStage: '',
    practicalPriorities: [],
    customRequest: '',
  })
  assert.equal(isCareerAnalysis(sampleAnalysis), true)
})

test('assessment can request more than the five-path default', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify({ ...sampleAssessment, careerPathCount: 8 }),
  })

  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(receivedAssessment.careerPathCount, 8)
  assert.equal(body.analysis.careerSuggestions.length, 8)
  assert.equal(isCareerAnalysis(body.analysis, 8), true)
})

test('career analysis requires an account session', async () => {
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`)
  assert.equal(sessionResponse.status, 200)
  assert.deepEqual(await sessionResponse.json(), { authenticated: false })

  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sampleAssessment),
  })

  assert.equal(response.status, 401)
  assert.equal((await response.json()).error, 'AUTHENTICATION_REQUIRED')
})

test('signup hashes passwords and never returns account details', async () => {
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Student Example', email: 'Student@Example.com', password: 'a secure password 123' }),
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  assert.deepEqual(body, { authenticated: true })
  assert.match(createdUser.passwordHash, /^scrypt\$32768\$8\$1\$/)
  assert.notEqual(createdUser.passwordHash, 'a secure password 123')
  assert.equal(createdUser.email, 'student@example.com')
  assert.equal(JSON.stringify(body).includes('Student'), false)
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/)
})

test('login accepts the saved password without returning private account data', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'STUDENT@example.com', password: 'a secure password 123' }),
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { authenticated: true })
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/)

  const sessionCookie = response.headers.get('set-cookie').split(';')[0]
  const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { cookie: sessionCookie },
  })
  assert.equal(logoutResponse.status, 200)
  assert.deepEqual(await logoutResponse.json(), { authenticated: false })
  assert.match(logoutResponse.headers.get('set-cookie'), /Max-Age=0/)
  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { cookie: sessionCookie },
  })
  assert.deepEqual(await sessionResponse.json(), { authenticated: false })
})

test('authenticated progress and feedback are account-scoped', async () => {
  const latestResponse = await fetch(`${baseUrl}/api/assessments/latest`, {
    headers: authenticatedHeaders,
  })
  assert.equal(latestResponse.status, 200)
  assert.equal(latestAssessmentUserId, 'test-user')
  assert.deepEqual((await latestResponse.json()).assessment.analysis, savedAssessment.analysis)

  const progressResponse = await fetch(`${baseUrl}/api/progress`, {
    headers: authenticatedHeaders,
  })
  assert.equal(progressResponse.status, 200)
  assert.equal(progressUserId, 'test-user')
  assert.deepEqual(await progressResponse.json(), {
    months: [{ month: 1, focus: 'Start exploring', completed: false }],
  })

  const updateResponse = await fetch(`${baseUrl}/api/progress/2`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify({ completed: true }),
  })
  assert.equal(updateResponse.status, 200)
  assert.deepEqual(updatedProgress, { userId: 'test-user', month: 2, completed: true })

  const feedbackResponse = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify({ rating: 5, message: 'The roadmap made the next steps much clearer.' }),
  })
  assert.equal(feedbackResponse.status, 201)
  assert.deepEqual(await feedbackResponse.json(), { saved: true })
  assert.deepEqual(savedFeedback, {
    userId: 'test-user',
    rating: 5,
    message: 'The roadmap made the next steps much clearer.',
  })
})

test('feedback is rejected when rating or message is invalid', async () => {
  const response = await fetch(`${baseUrl}/api/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify({ rating: 7, message: 'short' }),
  })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error, 'INVALID_FEEDBACK')
})

test('career analysis schema uses the five-path default and supports requested counts up to ten', () => {
  assert.deepEqual(careerAnalysisJsonSchema.required, ['summary', 'careerSuggestions', 'sixMonthRoadmap', 'beginnerProjects'])
  assert.equal(careerAnalysisJsonSchema.properties.careerSuggestions.minItems, 5)
  assert.equal(careerAnalysisJsonSchema.properties.careerSuggestions.maxItems, 5)
  const eightPathSchema = createCareerAnalysisJsonSchema(8)
  assert.equal(eightPathSchema.properties.careerSuggestions.minItems, 8)
  assert.equal(eightPathSchema.properties.careerSuggestions.maxItems, 8)
  assert.equal(careerAnalysisJsonSchema.properties.sixMonthRoadmap.minItems, 6)
  assert.equal(careerAnalysisJsonSchema.properties.sixMonthRoadmap.maxItems, 6)
  assert.equal(careerAnalysisJsonSchema.properties.beginnerProjects.minItems, 3)
  assert.equal(careerAnalysisJsonSchema.properties.beginnerProjects.maxItems, 3)
  assert.equal(isCareerAnalysis({ ...sampleAnalysis, sixMonthRoadmap: sampleAnalysis.sixMonthRoadmap.slice(0, 5) }), false)
  assert.equal(isCareerAnalysis({ ...sampleAnalysis, careerSuggestions: sampleAnalysis.careerSuggestions.slice(0, 2) }), false)
  assert.equal(isCareerAnalysis({ ...sampleAnalysis, careerSuggestions: [...sampleAnalysis.careerSuggestions, sampleAnalysis.careerSuggestions[0]] }), false)
  assert.equal(isCareerAnalysis(sampleAnalysis, 6), false)
  assert.equal(isCareerAnalysis(sampleAnalysis, 11), false)
  assert.throws(() => createCareerAnalysisJsonSchema(4), RangeError)
})

test('India context and custom guidance preferences are normalized', () => {
  const { data, errors } = validateAssessment({
    ...sampleAssessment,
    indiaContext: 'CBSE',
    indiaStudyStage: 'Class 11–12: science with biology',
    practicalPriorities: ['JEE / engineering entrance pathway', 'Affordable or free learning resources'],
    customRequest: '  Suggest low-cost beginner steps for engineering.  ',
  })

  assert.deepEqual(errors, [])
  assert.equal(data.indiaContext, 'CBSE')
  assert.equal(data.indiaStudyStage, 'Class 11–12: science with biology')
  assert.deepEqual(data.practicalPriorities, [
    'JEE / engineering entrance pathway',
    'Affordable or free learning resources',
  ])
  assert.equal(data.customRequest, 'Suggest low-cost beginner steps for engineering.')
  assert.equal(data.careerPathCount, 5)
})

test('optional Indian guidance fields remain backward compatible', () => {
  const { data, errors } = validateAssessment(sampleAssessment)

  assert.deepEqual(errors, [])
  assert.equal(data.indiaContext, '')
  assert.deepEqual(data.practicalPriorities, [])
  assert.equal(data.customRequest, '')
  assert.equal(data.careerPathCount, 5)
})

test('invalid requested career path counts are rejected', () => {
  for (const careerPathCount of [4, 11, '8', 5.5]) {
    const { errors } = validateAssessment({ ...sampleAssessment, careerPathCount })
    assert.ok(errors.some(({ field }) => field === 'careerPathCount'))
  }
})

test('custom guidance preferences are included in the backend analysis input', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify({
      ...sampleAssessment,
      indiaContext: 'State board',
      indiaStudyStage: 'Class 11–12: science with mathematics',
      careerPathCount: 8,
      practicalPriorities: ['Internships and practical experience'],
      customRequest: 'Help me find practical projects.',
    }),
  })

  assert.equal(response.status, 200)
  assert.equal(receivedAssessment.indiaContext, 'State board')
  assert.equal(receivedAssessment.indiaStudyStage, 'Class 11–12: science with mathematics')
  assert.equal(receivedAssessment.careerPathCount, 8)
  assert.deepEqual(receivedAssessment.practicalPriorities, ['Internships and practical experience'])
  assert.equal(receivedAssessment.customRequest, 'Help me find practical projects.')
})

test('invalid or oversized custom guidance is rejected', () => {
  const { errors } = validateAssessment({
    ...sampleAssessment,
    indiaContext: 'not a supported board',
    indiaStudyStage: 'unsupported school stage',
    practicalPriorities: Array(6).fill('JEE / engineering entrance pathway'),
    customRequest: 'x'.repeat(501),
  })

  assert.deepEqual(errors.map(({ field }) => field), ['indiaContext', 'indiaStudyStage', 'practicalPriorities', 'customRequest'])
})

test('invalid assessment is rejected before analysis', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify({ ...sampleAssessment, educationLevel: 'invented value', interests: [] }),
  })

  assert.equal(response.status, 400)
  const body = await response.json()
  assert.equal(body.error, 'INVALID_ASSESSMENT')
  assert.deepEqual(body.details.map(({ field }) => field), ['educationLevel', 'interests'])
})

test('malformed JSON receives a client error', async () => {
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: '{"educationLevel":',
  })

  assert.equal(response.status, 400)
  assert.equal((await response.json()).error, 'INVALID_JSON')
})

test('Gemini failures return a safe upstream error', async () => {
  analysisFailure = new UpstreamServiceError('provider detail must not be sent to clients')
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify(sampleAssessment),
  })
  analysisFailure = null

  assert.equal(response.status, 502)
  const body = await response.json()
  assert.equal(body.error, 'CAREER_ANALYSIS_FAILED')
  assert.equal(body.message.includes('provider detail'), false)
})

test('invalid Gemini JSON returns a clear response-format error', async () => {
  analysisFailure = new UpstreamServiceError('provider detail must not be sent to clients', {
    cause: new SyntaxError('Unexpected token in private model output'),
  })
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify(sampleAssessment),
  })
  analysisFailure = null

  assert.equal(response.status, 502)
  const body = await response.json()
  assert.equal(body.error, 'INVALID_GEMINI_RESPONSE')
  assert.match(body.message, /not valid JSON/)
  assert.equal(body.message.includes('Unexpected token'), false)
  assert.equal(body.message.includes('private model output'), false)
})

test('Gemini rate limits return an actionable safe error', async () => {
  analysisFailure = new UpstreamServiceError('provider detail must not be sent to clients', {
    cause: Object.assign(new Error('private provider response'), { status: 429 }),
  })
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify(sampleAssessment),
  })
  analysisFailure = null

  assert.equal(response.status, 429)
  const body = await response.json()
  assert.equal(body.error, 'GEMINI_RATE_LIMITED')
  assert.match(body.message, /quota or billing settings/)
  assert.equal(body.message.includes('private provider response'), false)
})

test('unexpected server errors return a generic server error', async () => {
  analysisFailure = new Error('internal detail must not be sent to clients')
  const response = await fetch(`${baseUrl}/api/analyze-career`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authenticatedHeaders },
    body: JSON.stringify(sampleAssessment),
  })
  analysisFailure = null

  assert.equal(response.status, 500)
  const body = await response.json()
  assert.equal(body.error, 'INTERNAL_SERVER_ERROR')
  assert.equal(body.message.includes('internal detail'), false)
})

test('mutating API requests reject untrusted browser origins', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { origin: 'https://untrusted.example' },
  })

  assert.equal(response.status, 403)
  assert.equal((await response.json()).error, 'INVALID_ORIGIN')
})
