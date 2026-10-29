import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { upload } from '@vercel/blob/client'
import './AdminDashboard.css'

const STORAGE_KEY = 'sadmah-admin-data'
const EMPTY_DATA = { clients: [], expenses: [] }
const MEASUREMENT_FIELDS = [
  ['chest', 'Chest'],
  ['waist', 'Waist'],
  ['hip', 'Hip'],
  ['shoulder', 'Shoulder'],
  ['sleeve', 'Sleeve'],
  ['length', 'Top length'],
  ['neck', 'Neck'],
  ['trouser', 'Trouser length'],
]

function readSavedData() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return EMPTY_DATA
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed.clients) && Array.isArray(parsed.expenses)) return parsed
    console.error('Saved admin data has an unexpected format.')
  } catch (error) {
    console.error('Could not read saved admin data:', error)
  }
  return EMPTY_DATA
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function money(amount) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

async function readApiResponse(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    const message = response.ok
      ? 'The gallery server returned an invalid response.'
      : `The gallery server rejected the request (HTTP ${response.status}). This may be an upload-size limit; check the Vercel function logs.`
    throw new Error(message)
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getPaid(client) {
  return (client.payments || []).reduce((total, payment) => total + Number(payment.amount), 0)
}

function Icon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    receipt: <><path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2z" /><path d="M8 8h8M8 12h8M8 16h3" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5M12 3v12" /></>,
    back: <><path d="m15 18-6-6 6-6" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function AdminDashboard({ isDark, onToggleTheme }) {
  const [authStatus, setAuthStatus] = useState('checking')
  const [authError, setAuthError] = useState('')
  const [sessionExpiresAt, setSessionExpiresAt] = useState(0)

  useEffect(() => {
    let active = true
    fetch('/api/admin/auth', { credentials: 'same-origin' })
      .then(async (response) => {
        const body = await response.json()
        if (!active) return
        if (response.ok && body.authenticated) {
          setSessionExpiresAt(body.expiresAt)
          setAuthStatus('authenticated')
        } else if (response.status === 401) {
          setAuthStatus('signed-out')
        } else {
          setAuthError(body.error || 'Could not verify your admin session.')
          setAuthStatus('unavailable')
        }
      })
      .catch((error) => {
        console.error('Could not connect to admin authentication:', error)
        if (active) {
          setAuthError('Could not connect to the authentication service. Try again when your site is available.')
          setAuthStatus('unavailable')
        }
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !sessionExpiresAt) return undefined
    const timeoutId = window.setTimeout(() => {
      setAuthError('Your admin session has expired. Sign in again to continue.')
      setAuthStatus('signed-out')
    }, Math.max(sessionExpiresAt - Date.now(), 0))
    return () => window.clearTimeout(timeoutId)
  }, [authStatus, sessionExpiresAt])

  async function signIn(email, password) {
    setAuthError('')
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await response.json()
      if (!response.ok) {
        setAuthError(body.error || 'Could not sign in.')
        if (response.status === 503) setAuthStatus('unavailable')
        return
      }
      setSessionExpiresAt(body.expiresAt)
      setAuthStatus('authenticated')
    } catch (error) {
      console.error('Could not sign in to admin:', error)
      setAuthError('Could not connect to the authentication service. Try again.')
    }
  }

  async function signOut() {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error('The server could not end the admin session.')
      setSessionExpiresAt(0)
      setAuthStatus('signed-out')
    } catch (error) {
      console.error('Could not sign out of admin:', error)
      setAuthError('Could not end the session. Please try again.')
    }
  }

  if (authStatus === 'checking') {
    return <AuthMessage>Checking your admin session…</AuthMessage>
  }
  if (authStatus !== 'authenticated') {
    return <AdminLogin onSubmit={signIn} error={authError} unavailable={authStatus === 'unavailable'} />
  }
  return <AdminWorkspace onSignOut={signOut} authError={authError} isDark={isDark} onToggleTheme={onToggleTheme} />
}

function AdminWorkspace({ onSignOut, authError, isDark, onToggleTheme }) {
  const [data, setData] = useState(readSavedData)
  const dataRef = useRef(data)
  const [activePage, setActivePage] = useState('Overview')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [notice, setNotice] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)

  useEffect(() => {
    if (activePage !== 'Gallery') return undefined

    let active = true
    fetch('/api/admin/gallery', { credentials: 'same-origin' })
      .then(async (response) => {
        const body = await readApiResponse(response)
        if (!response.ok) throw new Error(body.error || 'Could not load gallery photos.')
        if (active) setGalleryPhotos(body.items)
      })
      .catch((error) => {
        console.error('Could not load admin gallery photos:', error)
        if (active) setNotice(error.message)
      })
      .finally(() => {
        if (active) setGalleryLoading(false)
      })

    return () => { active = false }
  }, [activePage])

  function updateData(updater) {
    const next = typeof updater === 'function' ? updater(dataRef.current) : updater
    dataRef.current = next
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setNotice('')
    } catch (error) {
      console.error('Could not save dashboard data:', error)
      setNotice('Could not save your changes. Your browser storage may be full.')
    }
    setData(next)
  }

  const selectedClient = data.clients.find((client) => client.id === selectedClientId)
  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return data.clients
    return data.clients.filter((client) =>
      `${client.name} ${client.phone} ${client.garment}`.toLowerCase().includes(query),
    )
  }, [data.clients, search])

  const totalRevenue = data.clients.reduce((sum, client) => sum + getPaid(client), 0)
  const totalOutstanding = data.clients.reduce(
    (sum, client) => sum + Math.max(Number(client.total) - getPaid(client), 0),
    0,
  )
  const totalExpenses = data.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const openOrders = data.clients.filter((client) => !client.paidComplete).length

  function changePage(page) {
    setActivePage(page)
    setSearch('')
    setMobileNavOpen(false)
    if (page === 'Gallery' && activePage !== 'Gallery') setGalleryLoading(true)
  }

  async function addGalleryPhoto(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const file = values.get('photo')
    if (!(file instanceof File) || !file.size) {
      setNotice('Choose a photo to upload.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice('Upload a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setNotice('Images must be 3 MB or smaller.')
      return
    }

    setGalleryUploading(true)
    try {
      const name = String(values.get('name')).trim()
      const alt = String(values.get('alt')).trim()
      let uploadDetails

      if (import.meta.env.DEV) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
          reader.readAsDataURL(file)
        })
        uploadDetails = {
          contentType: file.type,
          data: String(dataUrl).split(',')[1],
        }
      } else {
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
        const blob = await upload(`gallery/${crypto.randomUUID()}.${extension}`, file, {
          access: 'public',
          contentType: file.type,
          handleUploadUrl: '/api/admin/gallery-upload',
        })
        uploadDetails = { image: blob.url, pathname: blob.pathname }
      }

      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          alt,
          ...uploadDetails,
        }),
      })
      const body = await readApiResponse(response)
      if (!response.ok) throw new Error(body.error || 'Could not upload this photo.')
      setGalleryPhotos((current) => [body.item, ...current])
      setNotice('')
      form.reset()
    } catch (error) {
      console.error('Could not upload gallery photo:', error)
      setNotice(error.message)
    } finally {
      setGalleryUploading(false)
    }
  }

  async function removeGalleryPhoto(photo) {
    if (!window.confirm(`Remove "${photo.name}" from the public gallery?`)) return
    try {
      const response = await fetch(`/api/admin/gallery?id=${encodeURIComponent(photo.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const body = await readApiResponse(response)
      if (!response.ok) throw new Error(body.error || 'Could not remove this photo.')
      setGalleryPhotos((current) => current.filter((item) => item.id !== photo.id))
    } catch (error) {
      console.error('Could not remove gallery photo:', error)
      setNotice(error.message)
    }
  }

  function addClient(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const client = {
      id: makeId(),
      name: String(form.get('name')).trim(),
      phone: String(form.get('phone')).trim(),
      email: String(form.get('email')).trim(),
      garment: String(form.get('garment')).trim(),
      dueDate: String(form.get('dueDate')),
      total: Number(form.get('total')),
      measurements: Object.fromEntries(MEASUREMENT_FIELDS.map(([key]) => [key, String(form.get(key) || '').trim()])),
      payments: [],
      photos: [],
      paidComplete: false,
      createdAt: new Date().toISOString(),
    }
    updateData((current) => ({ ...current, clients: [client, ...current.clients] }))
    setDialog('')
  }

  function addExpense(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const expense = {
      id: makeId(),
      description: String(form.get('description')).trim(),
      category: String(form.get('category')),
      amount: Number(form.get('amount')),
      date: String(form.get('date')),
    }
    updateData((current) => ({ ...current, expenses: [expense, ...current.expenses] }))
    setDialog('')
  }

  function addPayment(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amount = Number(form.get('amount'))
    const payment = {
      id: makeId(),
      amount,
      date: String(form.get('date')),
      note: String(form.get('note')).trim(),
    }
    updateData((current) => ({
      ...current,
      clients: current.clients.map((client) =>
        client.id === selectedClientId
          ? { ...client, payments: [...client.payments, payment] }
          : client,
      ),
    }))
    event.currentTarget.reset()
  }

  async function addPhotos(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setNotice('Choose image files only.')
      return
    }
    if (files.some((file) => file.size > 1024 * 1024)) {
      setNotice('Each photo must be 1 MB or smaller to fit in browser storage.')
      return
    }
    const client = data.clients.find((item) => item.id === selectedClientId)
    if (!client) return
    if (client.photos.length + files.length > 6) {
      setNotice('You can save up to 6 reference photos per client.')
      return
    }
    try {
      const photos = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve({ id: makeId(), name: file.name, src: reader.result })
        reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
        reader.readAsDataURL(file)
      })))
      updateData((current) => ({
        ...current,
        clients: current.clients.map((item) =>
          item.id === selectedClientId
            ? { ...item, photos: [...item.photos, ...photos] }
            : item,
        ),
      }))
    } catch (error) {
      console.error('Could not upload client photos:', error)
      setNotice(error.message)
    }
  }

  function togglePaid(clientId) {
    updateData((current) => ({
      ...current,
      clients: current.clients.map((client) =>
        client.id === clientId
          ? { ...client, paidComplete: !client.paidComplete }
          : client,
      ),
    }))
  }

  function removePhoto(photoId) {
    updateData((current) => ({
      ...current,
      clients: current.clients.map((client) =>
        client.id === selectedClientId
          ? { ...client, photos: client.photos.filter((photo) => photo.id !== photoId) }
          : client,
      ),
    }))
  }

  const navItems = [
    { label: 'Overview', icon: 'grid' },
    { label: 'Clients', icon: 'users', count: data.clients.length },
    { label: 'Expenses', icon: 'receipt' },
    { label: 'Gallery', icon: 'image', count: galleryPhotos.length },
  ]

  return (
    <div className={`admin-shell${isDark ? ' is-dark-mode' : ''}`}>
      <aside className={`admin-sidebar${mobileNavOpen ? ' is-open' : ''}`}>
        <Link to="/" className="admin-brand" aria-label="Sadmah Enterprises homepage">
          <span className="admin-brand-mark">S</span>
          <span>SADMAH<small>STUDIO ADMIN</small></span>
        </Link>
        <p className="admin-nav-label">WORKSPACE</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <button
              className={activePage === item.label ? 'is-active' : ''}
              key={item.label}
              onClick={() => changePage(item.label)}
              type="button"
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.count !== undefined && <span className="admin-nav-count">{item.count}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-sidebar-dot" />
          <span>YOUR WORKSPACE</span>
          <Link to="/" aria-label="View public website">↗</Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-mobile-menu"
            aria-label="Toggle admin menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
          <div className="admin-breadcrumb">Sadmah Studio <span>/</span> {activePage}</div>
          <div className="admin-topbar-right">
            <span className="admin-today">{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <button type="button" className="admin-theme-toggle" aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`} onClick={onToggleTheme}>
              <Icon name={isDark ? 'sun' : 'moon'} />
            </button>
            <div className="admin-avatar" aria-label="Admin">S</div>
            <button type="button" className="admin-signout" onClick={onSignOut}>Sign out</button>
          </div>
        </header>

        <main className="admin-content">
          {authError && <div className="admin-notice" role="alert">{authError}</div>}
          {notice && <div className="admin-notice" role="alert">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><Icon name="close" /></button></div>}
          {activePage === 'Overview' && (
            <Overview
              clients={data.clients}
              expenses={data.expenses}
              revenue={totalRevenue}
              expensesTotal={totalExpenses}
              outstanding={totalOutstanding}
              openOrders={openOrders}
              onPageChange={changePage}
              onClientSelect={setSelectedClientId}
              onClientAdd={() => setDialog('client')}
            />
          )}
          {activePage === 'Clients' && (
            <ClientsPage
              clients={filteredClients}
              search={search}
              onSearch={setSearch}
              onAdd={() => setDialog('client')}
              onClientSelect={setSelectedClientId}
              onTogglePaid={togglePaid}
            />
          )}
          {activePage === 'Expenses' && (
            <ExpensesPage
              expenses={data.expenses}
              total={totalExpenses}
              onAdd={() => setDialog('expense')}
            />
          )}
          {activePage === 'Gallery' && (
            <GalleryPage
              photos={galleryPhotos}
              loading={galleryLoading}
              uploading={galleryUploading}
              onUpload={addGalleryPhoto}
              onRemove={removeGalleryPhoto}
            />
          )}
        </main>
        <footer className="admin-footer">
          <span>© {new Date().getFullYear()} Sadmah Enterprises</span>
          <span>Dashboard data is saved in this browser</span>
        </footer>
      </div>

      {dialog === 'client' && <Modal title="Add a client" onClose={() => setDialog('')}><ClientForm onSubmit={addClient} onCancel={() => setDialog('')} /></Modal>}
      {dialog === 'expense' && <Modal title="Record an expense" onClose={() => setDialog('')}><ExpenseForm onSubmit={addExpense} onCancel={() => setDialog('')} /></Modal>}
      {selectedClient && (
        <Modal title={selectedClient.name} onClose={() => setSelectedClientId('')} wide>
          <ClientDetails
            client={selectedClient}
            onPayment={addPayment}
            onPhotos={addPhotos}
            onTogglePaid={() => togglePaid(selectedClient.id)}
            onRemovePhoto={removePhoto}
            onClose={() => setSelectedClientId('')}
          />
        </Modal>
      )}
    </div>
  )
}

function AuthMessage({ children }) {
  return (
    <AuthScreen>
      <div className="admin-auth-card">
        <p className="admin-eyebrow">PRIVATE WORKSPACE</p>
        <p className="admin-auth-message">{children}</p>
      </div>
    </AuthScreen>
  )
}

function AuthScreen({ children }) {
  return (
    <main className="admin-auth-screen">
      <section className="admin-auth-design">
        <Link to="/" className="admin-auth-wordmark" aria-label="Sadmah Enterprises homepage">
          <span className="admin-brand-mark">S</span>
          <span>SADMAH<small>ENTERPRISES</small></span>
        </Link>
        <div className="admin-auth-design-copy">
          <p>CRAFTED WITH INTENTION</p>
          <h2>Every detail tells a story.</h2>
          <span>A considered space for the people and pieces behind the studio.</span>
        </div>
        <p className="admin-auth-design-footer">SADMAH STUDIO <span>·</span> PRIVATE ADMINISTRATION</p>
      </section>
      <section className="admin-auth-content">
        {children}
      </section>
    </main>
  )
}

function AdminLogin({ onSubmit, error, unavailable }) {
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    await onSubmit(String(form.get('email')), String(form.get('password')))
    setSubmitting(false)
  }

  return (
    <AuthScreen>
      <section className="admin-auth-card">
        <p className="admin-eyebrow">A PRIVATE WORKSPACE</p>
        <h1>Welcome <em>back.</em></h1>
        <p className="admin-auth-copy">Sign in to manage your studio and client records.</p>
        {error && <p className="admin-auth-error" role="alert">{error}</p>}
        {!unavailable && <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label className="admin-field">Admin email<input type="email" name="email" autoComplete="username" required autoFocus /></label>
          <label className="admin-field">Password<input type="password" name="password" autoComplete="current-password" required /></label>
          <button type="submit" className="admin-primary-button" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in securely'}</button>
        </form>}
        {unavailable && <p className="admin-auth-help">Configure <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> in <code>.env.local</code> for local development or your Vercel project settings when deployed, then restart the server or redeploy.</p>}
        <p className="admin-auth-footnote">Only the configured account can access this dashboard.</p>
      </section>
    </AuthScreen>
  )
}

function Overview({ clients, expenses, revenue, expensesTotal, outstanding, openOrders, onPageChange, onClientSelect, onClientAdd }) {
  const stats = [
    { label: 'Total clients', value: clients.length, hint: 'In your workspace', icon: 'users' },
    { label: 'Payments received', value: money(revenue), hint: 'Across all clients', icon: 'arrow' },
    { label: 'Outstanding', value: money(outstanding), hint: 'Remaining balances', icon: 'receipt' },
    { label: 'Expenses', value: money(expensesTotal), hint: 'Total recorded', icon: 'grid' },
  ]

  return (
    <>
      <div className="admin-page-heading">
        <div><p className="admin-eyebrow">YOUR ATELIER, AT A GLANCE</p><h1>Good day<span>.</span></h1><p className="admin-subtitle">A little overview of what’s happening at your studio.</p></div>
        <button type="button" className="admin-primary-button" onClick={onClientAdd}><Icon name="plus" /> Add a client</button>
      </div>
      <section className="admin-stats" aria-label="Business summary">
        {stats.map((stat) => <article className="admin-stat-card" key={stat.label}><div className="admin-stat-top"><span>{stat.label}</span><Icon name={stat.icon} /></div><strong>{stat.value}</strong><small>{stat.hint}</small></article>)}
      </section>
      <div className="admin-overview-grid">
        <section className="admin-panel admin-orders-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">KEEP THINGS MOVING</p><h2>Recent clients</h2></div><button type="button" className="admin-text-button" onClick={() => onPageChange('Clients')}>View all <Icon name="arrow" /></button></div>
          {clients.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CLIENT</th><th>GARMENT</th><th>DUE DATE</th><th>PAYMENT</th><th>STATUS</th></tr></thead><tbody>{clients.slice(0, 5).map((client) => <tr key={client.id} onClick={() => onClientSelect(client.id)}><td><span className="admin-client-cell"><span className="admin-initial">{client.name.charAt(0).toUpperCase()}</span><strong>{client.name}</strong></span></td><td>{client.garment || 'Bespoke'}</td><td>{formatDate(client.dueDate)}</td><td>{money(getPaid(client))} / {money(client.total)}</td><td><span className={`admin-status ${client.paidComplete ? 'is-paid' : 'is-pending'}`}>{client.paidComplete ? 'Paid in full' : 'In progress'}</span></td></tr>)}</tbody></table></div> : <EmptyState title="Your client list starts here" description="Add a client to keep their measurements, photos and payments together." action="Add a client" onClick={onClientAdd} />}
        </section>
        <section className="admin-panel admin-side-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">A QUICK CHECK-IN</p><h2>At a glance</h2></div></div>
          <div className="admin-glance-item"><span className="admin-glance-icon"><Icon name="users" /></span><div><strong>{openOrders} active {openOrders === 1 ? 'order' : 'orders'}</strong><small>Clients not marked paid in full</small></div></div>
          <div className="admin-glance-item"><span className="admin-glance-icon"><Icon name="receipt" /></span><div><strong>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} recorded</strong><small>{money(expensesTotal)} in total spending</small></div></div>
          <div className="admin-glance-note"><span>✦</span>Keep each client’s details close, so the little things never get lost.</div>
        </section>
      </div>
    </>
  )
}

function ClientsPage({ clients, search, onSearch, onAdd, onClientSelect, onTogglePaid }) {
  return (
    <>
      <div className="admin-page-heading">
        <div><p className="admin-eyebrow">THE PEOPLE BEHIND THE PIECES</p><h1>Your clients<span>.</span></h1><p className="admin-subtitle">Measurements, making notes and payments, all in one place.</p></div>
        <button type="button" className="admin-primary-button" onClick={onAdd}><Icon name="plus" /> Add a client</button>
      </div>
      <section className="admin-panel admin-list-panel">
        <div className="admin-list-toolbar">
          <div className="admin-search"><Icon name="search" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search clients..." aria-label="Search clients" /></div>
          <span className="admin-result-count">{clients.length} {clients.length === 1 ? 'client' : 'clients'}</span>
        </div>
        {clients.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CLIENT</th><th>GARMENT</th><th>DUE DATE</th><th>PAID / TOTAL</th><th>PAID IN FULL</th></tr></thead><tbody>{clients.map((client) => <tr key={client.id}><td><button type="button" className="admin-client-cell admin-client-link" onClick={() => onClientSelect(client.id)}><span className="admin-initial">{client.name.charAt(0).toUpperCase()}</span><span><strong>{client.name}</strong><small>{client.phone || 'No phone added'}</small></span></button></td><td>{client.garment || 'Bespoke'}</td><td>{formatDate(client.dueDate)}</td><td><strong className="admin-payment-amount">{money(getPaid(client))}</strong><span className="admin-muted"> / {money(client.total)}</span></td><td><button type="button" role="switch" aria-checked={client.paidComplete} aria-label={`Mark ${client.name} paid in full`} className={`admin-switch${client.paidComplete ? ' is-on' : ''}`} onClick={() => onTogglePaid(client.id)}><span /></button><span className={`admin-status ${client.paidComplete ? 'is-paid' : 'is-pending'}`}>{client.paidComplete ? 'Complete' : 'Pending'}</span></td></tr>)}</tbody></table></div> : <EmptyState title={search ? 'No clients found' : 'No clients just yet'} description={search ? 'Try another name, phone number or garment.' : 'Create your first client record to keep measurements and payment plans organized.'} action={search ? '' : 'Add a client'} onClick={onAdd} />}
      </section>
    </>
  )
}

function GalleryPage({ photos, loading, uploading, onUpload, onRemove }) {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">SHARE YOUR WORK</p>
          <h1>Studio gallery<span>.</span></h1>
          <p className="admin-subtitle">Upload photos to show visitors on your public homepage.</p>
        </div>
      </div>
      <section className="admin-panel admin-gallery-upload-panel">
        <div className="admin-panel-heading">
          <div><p className="admin-eyebrow">ADD A PHOTO</p><h2>Upload to your gallery</h2></div>
        </div>
        <form className="admin-gallery-upload-form" onSubmit={onUpload}>
          <label className="admin-field">Photo title<input name="name" required maxLength="100" placeholder="e.g. A custom occasion outfit" /></label>
          <label className="admin-field">Image description<input name="alt" required maxLength="240" placeholder="Describe what is shown in the photo" /></label>
          <label className="admin-field admin-gallery-file-field">Photo (JPEG, PNG, or WebP; up to 3 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
          <button type="submit" className="admin-primary-button" disabled={uploading}>
            <Icon name="upload" /> {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
        </form>
      </section>
      <section className="admin-gallery-library" aria-label="Public gallery photos">
        <div className="admin-gallery-library-heading">
          <h2>Published photos</h2>
          <span>{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span>
        </div>
        {loading ? (
          <p className="admin-small-empty">Loading gallery photos…</p>
        ) : photos.length ? (
          <div className="admin-gallery-grid">
            {photos.map((photo) => (
              <article className="admin-gallery-card" key={photo.id}>
                <img src={photo.image} alt={photo.alt} />
                <div className="admin-gallery-card-details">
                  <div><strong>{photo.name}</strong><span>{photo.alt}</span></div>
                  <button type="button" className="admin-secondary-button" onClick={() => onRemove(photo)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-small-empty">No photos yet. Upload a photo and it will appear on the public homepage.</p>
        )}
      </section>
    </>
  )
}

function ExpensesPage({ expenses, total, onAdd }) {
  return (
    <>
      <div className="admin-page-heading">
        <div><p className="admin-eyebrow">MIND THE DETAILS</p><h1>Studio expenses<span>.</span></h1><p className="admin-subtitle">A clear record of what goes into every beautiful piece.</p></div>
        <button type="button" className="admin-primary-button" onClick={onAdd}><Icon name="plus" /> Record expense</button>
      </div>
      <section className="admin-expense-summary"><div><span>Total recorded expenses</span><strong>{money(total)}</strong></div><span className="admin-expense-summary-icon"><Icon name="receipt" /></span></section>
      <section className="admin-panel admin-list-panel">
        <div className="admin-panel-heading admin-expense-heading"><div><p className="admin-eyebrow">OUTGOINGS</p><h2>Expense history</h2></div><span className="admin-result-count">{expenses.length} entries</span></div>
        {expenses.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td><strong>{expense.description}</strong></td><td><span className="admin-category-tag">{expense.category}</span></td><td>{formatDate(expense.date)}</td><td><strong>{money(expense.amount)}</strong></td></tr>)}</tbody></table></div> : <EmptyState title="No expenses recorded" description="Keep an eye on your studio spending by adding your first expense." action="Record an expense" onClick={onAdd} />}
      </section>
    </>
  )
}

function ClientForm({ onSubmit, onCancel }) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form-section"><h3>Client details</h3><div className="admin-form-grid">
        <label className="admin-field admin-field-full">Full name<input name="name" required autoFocus placeholder="e.g. Amara Okafor" /></label>
        <label className="admin-field">Phone number<input name="phone" type="tel" placeholder="+234..." /></label>
        <label className="admin-field">Email address<input name="email" type="email" placeholder="name@example.com" /></label>
        <label className="admin-field">Garment / order<input name="garment" placeholder="e.g. Aso-oke set" /></label>
        <label className="admin-field">Fitting / due date<input name="dueDate" type="date" /></label>
        <label className="admin-field admin-field-full">Agreed price (₦)<input name="total" type="number" min="0" step="100" required placeholder="0" /></label>
      </div></div>
      <div className="admin-form-section"><h3>Measurements <span>cm or inches</span></h3><div className="admin-form-grid admin-measurement-grid">{MEASUREMENT_FIELDS.map(([key, label]) => <label className="admin-field" key={key}>{label}<input name={key} inputMode="decimal" placeholder="—" /></label>)}</div></div>
      <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="admin-primary-button">Save client</button></div>
    </form>
  )
}

function ExpenseForm({ onSubmit, onCancel }) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <label className="admin-field admin-field-full">What was it for?<input name="description" required autoFocus placeholder="e.g. Ankara fabric" /></label>
        <label className="admin-field">Category<select name="category" defaultValue="Fabric"><option>Fabric</option><option>Notions & supplies</option><option>Labour</option><option>Delivery</option><option>Utilities</option><option>Other</option></select></label>
        <label className="admin-field">Amount (₦)<input name="amount" type="number" min="1" step="100" required placeholder="0" /></label>
        <label className="admin-field admin-field-full">Date<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
      </div>
      <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onCancel}>Cancel</button><button type="submit" className="admin-primary-button">Save expense</button></div>
    </form>
  )
}

function ClientDetails({ client, onPayment, onPhotos, onTogglePaid, onRemovePhoto, onClose }) {
  const paid = getPaid(client)
  const balance = Math.max(Number(client.total) - paid, 0)
  return (
    <div className="admin-client-details">
      <div className="admin-detail-intro"><span className="admin-detail-avatar">{client.name.charAt(0).toUpperCase()}</span><div><strong>{client.name}</strong><span>{client.phone || 'No phone number'}{client.email ? ` · ${client.email}` : ''}</span></div><span className={`admin-status ${client.paidComplete ? 'is-paid' : 'is-pending'}`}>{client.paidComplete ? 'Paid in full' : 'In progress'}</span></div>
      <div className="admin-detail-grid">
        <section className="admin-detail-section"><div className="admin-detail-section-heading"><h3>Order details</h3><span>{client.garment || 'Bespoke order'}</span></div><div className="admin-detail-fields"><div><span>Agreed price</span><strong>{money(client.total)}</strong></div><div><span>Fitting / due date</span><strong>{formatDate(client.dueDate)}</strong></div><div><span>Total paid</span><strong>{money(paid)}</strong></div><div><span>Balance</span><strong>{money(balance)}</strong></div></div><label className="admin-paid-toggle"><span><strong>Paid in full</strong><small>Show this client as fully paid</small></span><button type="button" role="switch" aria-checked={client.paidComplete} aria-label="Toggle paid in full" className={`admin-switch${client.paidComplete ? ' is-on' : ''}`} onClick={onTogglePaid}><span /></button></label></section>
        <section className="admin-detail-section"><div className="admin-detail-section-heading"><h3>Measurements</h3><span>As recorded</span></div><div className="admin-measurement-list">{MEASUREMENT_FIELDS.filter(([key]) => client.measurements[key]).map(([key, label]) => <div key={key}><span>{label}</span><strong>{client.measurements[key]}</strong></div>)}</div>{!MEASUREMENT_FIELDS.some(([key]) => client.measurements[key]) && <p className="admin-small-empty">No measurements have been added.</p>}</section>
      </div>
      <section className="admin-detail-section admin-installments"><div className="admin-detail-section-heading"><div><h3>Payment plan</h3><span>{client.payments.length} {client.payments.length === 1 ? 'payment' : 'payments'} recorded</span></div></div>{client.payments.length ? <div className="admin-payment-list">{client.payments.map((payment) => <div className="admin-payment-row" key={payment.id}><span className="admin-payment-check"><Icon name="check" /></span><div><strong>{payment.note || 'Installment'}</strong><small>{formatDate(payment.date)}</small></div><strong>{money(payment.amount)}</strong></div>)}</div> : <p className="admin-small-empty">No installments recorded yet.</p>}
        <form className="admin-installment-form" onSubmit={onPayment}><label className="admin-field">Amount received (₦)<input name="amount" type="number" min="1" max={balance || undefined} step="100" required placeholder="0" /></label><label className="admin-field">Date<input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label><label className="admin-field admin-installment-note">Note<input name="note" placeholder="e.g. Deposit, second installment" /></label><button className="admin-primary-button" type="submit" disabled={balance <= 0}><Icon name="plus" /> Record payment</button></form>
      </section>
      <section className="admin-detail-section admin-client-photos"><div className="admin-detail-section-heading"><div><h3>Reference photos</h3><span>{client.photos.length} of 6 photos</span></div><label className="admin-upload-button"><Icon name="upload" /> Add photos<input type="file" accept="image/*" multiple onChange={onPhotos} /></label></div>{client.photos.length ? <div className="admin-photo-grid">{client.photos.map((photo) => <figure key={photo.id}><img src={photo.src} alt={`Reference for ${client.name}: ${photo.name}`} /><figcaption><span>{photo.name}</span><button type="button" onClick={() => onRemovePhoto(photo.id)} aria-label={`Remove ${photo.name}`}><Icon name="close" /></button></figcaption></figure>)}</div> : <p className="admin-small-empty">Add inspiration or fitting reference photos for this client.</p>}</section>
      <div className="admin-detail-footer"><button type="button" className="admin-secondary-button" onClick={onClose}>Close client record</button></div>
    </div>
  )
}

function Modal({ title, onClose, wide, children }) {
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={`admin-modal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><header className="admin-modal-header"><div><p className="admin-eyebrow">SADMAH STUDIO</p><h2>{title}</h2></div><button className="admin-modal-close" type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></header>{children}</section></div>
}

function EmptyState({ title, description, action, onClick }) {
  return <div className="admin-empty-state"><span className="admin-empty-icon"><Icon name="grid" /></span><h3>{title}</h3><p>{description}</p>{action && <button type="button" className="admin-secondary-button" onClick={onClick}><Icon name="plus" /> {action}</button>}</div>
}

export { AdminDashboard }
