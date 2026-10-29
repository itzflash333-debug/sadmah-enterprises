import { Buffer } from 'node:buffer'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import process from 'node:process'

const SESSION_COOKIE = 'sadmah_admin_session'
const SESSION_DURATION_SECONDS = 8 * 60 * 60

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(body)
}

function getConfiguration(environment, allowShortPassword) {
  const email = environment.ADMIN_EMAIL?.trim().toLowerCase()
  const password = environment.ADMIN_PASSWORD
  const secret = environment.ADMIN_SESSION_SECRET

  if (!email || !password || (!allowShortPassword && password.length < 12) || !secret || secret.length < 32) {
    return null
  }

  return { email, password, secret }
}

function secureEqual(left, right) {
  const leftHash = createHash('sha256').update(left).digest()
  const rightHash = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

function createSession(email, secret, expiresAt) {
  const payload = Buffer.from(JSON.stringify({ email, expiresAt })).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function getSession(token, secret) {
  if (!token) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return null

  const expected = createHmac('sha256', secret).update(payload).digest('base64url')
  if (!secureEqual(signature, expected)) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (
      typeof session.email !== 'string' ||
      typeof session.expiresAt !== 'number' ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null
    }
    return session
  } catch {
    return null
  }
}

function readCookie(request, name) {
  const cookies = request.headers.cookie || ''
  const entry = cookies.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))
  return entry ? entry.slice(name.length + 1) : ''
}

export function isAdminAuthenticated(request, environment = process.env, options = {}) {
  const configuration = getConfiguration(environment, options.allowShortPassword === true)
  if (!configuration) return false
  const session = getSession(readCookie(request, SESSION_COOKIE), configuration.secret)
  return Boolean(session && secureEqual(session.email, configuration.email))
}

function setSessionCookie(response, token, maxAge) {
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
  )
}

export function handleAuth(request, response, environment = process.env, options = {}) {
  response.setHeader('Cache-Control', 'no-store')
  const configuration = getConfiguration(environment, options.allowShortPassword === true)
  if (!configuration) {
    return sendJson(response, 503, { error: 'Admin authentication is not configured.' })
  }

  if (request.method === 'GET') {
    const session = getSession(readCookie(request, SESSION_COOKIE), configuration.secret)
    if (!session || !secureEqual(session.email, configuration.email)) {
      return sendJson(response, 401, { authenticated: false })
    }
    return sendJson(response, 200, { authenticated: true, email: session.email, expiresAt: session.expiresAt * 1000 })
  }

  if (request.method === 'POST') {
    let body = request.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        return sendJson(response, 400, { error: 'Invalid sign-in request.' })
      }
    }

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!secureEqual(email, configuration.email) || !secureEqual(password, configuration.password)) {
      return sendJson(response, 401, { error: 'Email or password is incorrect.' })
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
    setSessionCookie(response, createSession(configuration.email, configuration.secret, expiresAt), SESSION_DURATION_SECONDS)
    return sendJson(response, 200, { authenticated: true, email: configuration.email, expiresAt: expiresAt * 1000 })
  }

  if (request.method === 'DELETE') {
    setSessionCookie(response, '', 0)
    return sendJson(response, 200, { authenticated: false })
  }

  response.setHeader('Allow', 'GET, POST, DELETE')
  return sendJson(response, 405, { error: 'Method not allowed.' })
}

export default function handler(request, response) {
  return handleAuth(request, response)
}
