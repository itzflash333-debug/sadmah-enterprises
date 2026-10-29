# Sadmah Enterprises

A responsive clothing and fashion portfolio built with React and Vite. It includes the brand story, collection, testimonials, contact form, theme switcher, and WhatsApp contact link.

The private admin workspace is available at `/admin`. It uses a server-side authentication endpoint and an HttpOnly session cookie that expires after 8 hours. Configure these environment variables in the Vercel project settings before deploying:

- `ADMIN_EMAIL` — the email address allowed to sign in
- `ADMIN_PASSWORD` — a strong password of at least 12 characters
- `ADMIN_SESSION_SECRET` — a random secret of at least 32 characters

Keep these values private and do not add them to source control. For local development, create a `.env.local` file in the project root with these variables, then run `npm run dev`. The Vite development server runs the same authentication handler locally. Client and expense records are saved in the browser's local storage. Studio gallery photos are saved under `public/gallery/`, so they can be included in a site deployment.

The admin Gallery page accepts JPEG, PNG, and WebP files up to 3 MB each. Upload a title and an accessible description; the photo then appears in the Studio Gallery section on the public homepage. Local uploads are files in `public/gallery/` and should be included when committing changes to publish them. Deployed uploads are sent directly from the browser to Vercel Blob using an authenticated upload token, avoiding the serverless function request-size limit. To add or remove gallery photos from the deployed admin dashboard, connect a Vercel Blob store and configure its `BLOB_READ_WRITE_TOKEN` in the Vercel project settings. Without that token, the deployed site can display gallery files included in the deployment, but cannot modify them.

The local Vite authentication handler allows shorter test passwords only for loopback connections; deployed authentication still requires an `ADMIN_PASSWORD` of at least 12 characters. Use a short password only for local testing.

## Getting started

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

## Available commands

- `npm run dev` — start the local development server
- `npm run build` — create a production build in `dist`
- `npm run preview` — preview the production build locally
- `npm run lint` — check the project with ESLint

## Project structure

- `src/App.jsx` — theme state and application routes
- `src/components/` — page sections and shared interface components, each with its own stylesheet
- `api/admin/auth.js` — single-admin sign-in and signed session endpoint
- `api/admin/gallery.js` — authenticated gallery upload and management endpoint
- `api/admin/gallery-upload.js` — authenticated Vercel Blob browser-upload token endpoint
- `api/gallery.js` — public gallery endpoint
- `public/gallery/` — gallery manifest and locally uploaded images
- `src/siteConfig.js` — contact details, collection items, and testimonials
- `src/assets/` — images used by the site

Update the business contact details and site content in `src/siteConfig.js`.
