import process from 'node:process'
import { readGallery } from './gallery-storage.js'

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(body)
}

export async function handlePublicGallery(request, response, environment = process.env, options = {}) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  }

  if (!options.localStoragePath && !environment.BLOB_READ_WRITE_TOKEN) {
    return sendJson(response, 404, { error: 'The public gallery has not been published to Blob yet.' })
  }

  try {
    const items = await readGallery(options.localStoragePath ? { localStoragePath: options.localStoragePath } : {})
    if (items === null) return sendJson(response, 404, { error: 'The public gallery has not been published to Blob yet.' })
    return sendJson(response, 200, { items })
  } catch (error) {
    console.error('Could not load the public gallery:', error)
    return sendJson(response, 500, { error: 'Could not load the public gallery.' })
  }
}

export default function handler(request, response) {
  return handlePublicGallery(request, response)
}
