import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { del, list, put } from '@vercel/blob'

const MANIFEST_PATH = 'gallery/gallery.json'

export async function readGallery(options = {}) {
  if (options.localStoragePath) {
    try {
      const contents = await readFile(path.join(options.localStoragePath, 'gallery.json'), 'utf8')
      const items = JSON.parse(contents)
      if (!Array.isArray(items)) throw new Error('The saved gallery manifest has an unexpected format.')
      return items
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }
  }

  const { blobs } = await list({ prefix: MANIFEST_PATH, limit: 1 })
  const manifest = blobs.find((blob) => blob.pathname === MANIFEST_PATH)
  if (!manifest) return null

  const response = await fetch(manifest.url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Could not read the public gallery manifest.')
  const items = await response.json()
  if (!Array.isArray(items)) throw new Error('The public gallery manifest has an unexpected format.')
  return items
}

export async function writeGallery(items, options = {}) {
  if (options.localStoragePath) {
    await mkdir(options.localStoragePath, { recursive: true })
    const manifestPath = path.join(options.localStoragePath, 'gallery.json')
    await writeFile(manifestPath, JSON.stringify(items, null, 2))
    return
  }

  await put(MANIFEST_PATH, JSON.stringify(items), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  })
}

export async function saveGalleryImage(filename, contents, contentType, options = {}) {
  if (options.localStoragePath) {
    await mkdir(options.localStoragePath, { recursive: true })
    await writeFile(path.join(options.localStoragePath, filename), contents, { flag: 'wx' })
    return `/gallery/${filename}`
  }

  const blob = await put(`gallery/${filename}`, contents, {
    access: 'public',
    addRandomSuffix: false,
    contentType,
  })
  return blob.url
}

export async function removeGalleryImage(item, options = {}) {
  if (options.localStoragePath) {
    const filename = path.basename(new URL(item.image, 'http://localhost').pathname)
    await rm(path.join(options.localStoragePath, filename), { force: true })
    return
  }

  await del(item.image)
}
