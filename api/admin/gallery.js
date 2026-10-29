import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { head } from '@vercel/blob'
import { isAdminAuthenticated } from './auth.js'
import { readGallery, removeGalleryImage, saveGalleryImage, writeGallery } from '../gallery-storage.js'

const MAX_IMAGE_SIZE = 3 * 1024 * 1024
const MIME_TYPES = {
  'image/jpeg': { extension: 'jpg', matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  'image/png': { extension: 'png', matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/webp': { extension: 'webp', matches: (bytes) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' },
}

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

function validateUpload(body) {
  if (
    typeof body?.name !== 'string' ||
    !body.name.trim() ||
    body.name.length > 100 ||
    typeof body.alt !== 'string' ||
    !body.alt.trim() ||
    body.alt.length > 240 ||
    typeof body.contentType !== 'string' ||
    typeof body.data !== 'string' ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)
  ) {
    return { error: 'Add a title, accessible image description, and a valid image file.' }
  }

  const imageType = MIME_TYPES[body.contentType]
  if (!imageType) return { error: 'Upload a JPEG, PNG, or WebP image.' }

  const contents = Buffer.from(body.data, 'base64')
  if (!contents.length || contents.length > MAX_IMAGE_SIZE) {
    return { error: 'Images must be 3 MB or smaller.' }
  }
  if (contents.toString('base64') !== body.data || !imageType.matches(contents)) {
    return { error: 'The selected file does not match its image format.' }
  }

  return { contents, imageType }
}

function validateMetadata(body) {
  if (
    typeof body?.name !== 'string' ||
    !body.name.trim() ||
    body.name.length > 100 ||
    typeof body.alt !== 'string' ||
    !body.alt.trim() ||
    body.alt.length > 240
  ) {
    return { error: 'Add a title and accessible image description.' }
  }
  return {}
}

export async function handleAdminGallery(request, response, environment = process.env, options = {}) {
  response.setHeader('Cache-Control', 'no-store')
  if (!isAdminAuthenticated(request, environment, { allowShortPassword: options.allowShortPassword })) {
    return sendJson(response, 401, { error: 'Sign in to manage gallery photos.' })
  }

  if (!options.localStoragePath && !environment.BLOB_READ_WRITE_TOKEN) {
    return sendJson(response, 503, { error: 'Configure Vercel Blob before managing gallery photos on the deployed site.' })
  }

  const staticGalleryPath = path.join(process.cwd(), 'public', 'gallery')
  const storeOptions = options.localStoragePath ? { localStoragePath: options.localStoragePath } : {}

  try {
    const items = await readGallery(storeOptions)
    const gallery = items ?? await readGallery({ localStoragePath: staticGalleryPath })

    if (request.method === 'GET') {
      return sendJson(response, 200, { items: gallery })
    }

    if (request.method === 'POST') {
      const body = getRequestBody(request)
      const metadata = validateMetadata(body)
      if (metadata.error) return sendJson(response, 400, { error: metadata.error })

      let item
      if (options.localStoragePath) {
        const validated = validateUpload(body)
        if (validated.error) return sendJson(response, 400, { error: validated.error })
        const id = randomUUID()
        const filename = `${id}.${validated.imageType.extension}`
        item = {
          id,
          name: body.name.trim(),
          alt: body.alt.trim(),
          image: await saveGalleryImage(filename, validated.contents, body.contentType, storeOptions),
        }
      } else {
        if (typeof body.pathname !== 'string' || typeof body.image !== 'string') {
          return sendJson(response, 400, { error: 'Upload the image to Vercel Blob before publishing it.' })
        }
        const match = /^gallery\/([\da-f-]{36})\.(jpg|png|webp)$/i.exec(body.pathname)
        if (!match) return sendJson(response, 400, { error: 'The uploaded image path is invalid.' })

        const blob = await head(body.pathname)
        if (
          blob.pathname !== body.pathname ||
          blob.size > MAX_IMAGE_SIZE ||
          !MIME_TYPES[blob.contentType]
        ) {
          return sendJson(response, 400, { error: 'The uploaded file is not a supported image under 3 MB.' })
        }

        const imageResponse = await fetch(blob.url)
        if (!imageResponse.ok) throw new Error('Could not verify the uploaded gallery image.')
        const contents = Buffer.from(await imageResponse.arrayBuffer())
        const imageType = MIME_TYPES[blob.contentType]
        if (contents.length !== blob.size || !imageType.matches(contents)) {
          return sendJson(response, 400, { error: 'The uploaded file does not match its image format.' })
        }

        const id = match[1]
        if (gallery.some((photo) => photo.id === id)) {
          return sendJson(response, 409, { error: 'This image has already been added to the gallery.' })
        }
        item = {
          id,
          name: body.name.trim(),
          alt: body.alt.trim(),
          image: blob.url,
        }
      }

      try {
        await writeGallery([item, ...gallery], storeOptions)
      } catch (error) {
        await removeGalleryImage(item, storeOptions)
        throw error
      }

      return sendJson(response, 201, { item })
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url || '/', 'http://localhost').searchParams.get('id')
      if (!id || !/^[\da-f-]{36}$/i.test(id)) {
        return sendJson(response, 400, { error: 'Choose a valid gallery photo to remove.' })
      }
      const item = gallery.find((photo) => photo.id === id)
      if (!item) return sendJson(response, 404, { error: 'That photo is no longer in the gallery.' })

      await writeGallery(gallery.filter((photo) => photo.id !== id), storeOptions)
      await removeGalleryImage(item, storeOptions)
      return sendJson(response, 200, { removed: true })
    }

    response.setHeader('Allow', 'GET, POST, DELETE')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  } catch (error) {
    console.error('Could not update the gallery:', error)
    return sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Unexpected gallery storage error.',
    })
  }
}

export default function handler(request, response) {
  return handleAdminGallery(request, response)
}
