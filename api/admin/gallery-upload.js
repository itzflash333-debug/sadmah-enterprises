import process from 'node:process'
import { handleUpload } from '@vercel/blob/client'
import { isAdminAuthenticated } from './auth.js'

const MAX_IMAGE_SIZE = 3 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_PATHNAME = /^gallery\/[\da-f-]{36}\.(jpg|png|webp)$/i

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(body)
}

function getRequestBody(request) {
  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body)
    } catch {
      return null
    }
  }
  return request.body
}

export async function handleAdminGalleryUpload(request, response, environment = process.env, options = {}) {
  response.setHeader('Cache-Control', 'no-store')
  if (!isAdminAuthenticated(request, environment, { allowShortPassword: options.allowShortPassword })) {
    return sendJson(response, 401, { error: 'Sign in to upload gallery photos.' })
  }
  if (!environment.BLOB_READ_WRITE_TOKEN) {
    return sendJson(response, 503, { error: 'Connect Vercel Blob to upload photos on the deployed site.' })
  }
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  }

  try {
    const body = getRequestBody(request)
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (typeof pathname !== 'string' || !ALLOWED_PATHNAME.test(pathname)) {
          throw new Error('Invalid gallery image path.')
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: false,
        }
      },
    })
    return sendJson(response, 200, result)
  } catch (error) {
    console.error('Could not authorize a gallery upload:', error)
    return sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Could not authorize this gallery upload.',
    })
  }
}

export default function handler(request, response) {
  return handleAdminGalleryUpload(request, response)
}
