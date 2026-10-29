import { Buffer } from 'node:buffer'
import process from 'node:process'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { handleAuth } from './api/admin/auth.js'
import { handleAdminGallery } from './api/admin/gallery.js'
import { handlePublicGallery } from './api/gallery.js'
import { defineConfig, loadEnv } from 'vite'

function isLoopbackAddress(address = '') {
  return address === '::1' || address.startsWith('127.') || address.startsWith('::ffff:127.')
}

function localAdminApi(environment) {
  return {
    name: 'local-admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname
        const isAuthRequest = pathname === '/api/admin/auth'
        const isAdminGalleryRequest = pathname === '/api/admin/gallery'
        const isPublicGalleryRequest = pathname === '/api/gallery'
        if (!isAuthRequest && !isAdminGalleryRequest && !isPublicGalleryRequest) {
          next()
          return
        }

        const responseAdapter = {
          status(code) {
            response.statusCode = code
            return this
          },
          setHeader(name, value) {
            response.setHeader(name, value)
            return this
          },
          send(body) {
            response.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
            return this
          },
        }
        const allowShortPassword = isLoopbackAddress(request.socket?.remoteAddress)

        if (isPublicGalleryRequest) {
          handlePublicGallery(request, responseAdapter, environment, {
            localStoragePath: path.join(process.cwd(), 'public', 'gallery'),
          })
          return
        }

        if (!isAuthRequest && !isAdminGalleryRequest) return
        if (request.method !== 'POST') {
          if (isAdminGalleryRequest) {
            handleAdminGallery(request, responseAdapter, environment, {
              allowShortPassword,
              localStoragePath: path.join(process.cwd(), 'public', 'gallery'),
            })
          } else {
            handleAuth(request, responseAdapter, environment, { allowShortPassword })
          }
          return
        }

        const chunks = []
        let size = 0
        let tooLarge = false
        request.on('data', (chunk) => {
          size += chunk.length
          const maximumSize = isAdminGalleryRequest ? 4.1 * 1024 * 1024 : 16 * 1024
          if (size > maximumSize) {
            tooLarge = true
            return
          }
          chunks.push(chunk)
        })
        request.on('end', () => {
          if (tooLarge) {
            response.statusCode = 413
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ error: 'The upload request is too large.' }))
            return
          }
          request.body = Buffer.concat(chunks).toString('utf8')
          if (isAdminGalleryRequest) {
            handleAdminGallery(request, responseAdapter, environment, {
              allowShortPassword,
              localStoragePath: path.join(process.cwd(), 'public', 'gallery'),
            })
          } else {
            handleAuth(request, responseAdapter, environment, { allowShortPassword })
          }
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    localAdminApi({
      ...process.env,
      ...loadEnv(mode, process.cwd(), 'ADMIN_'),
    }),
  ],
}))
