import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AboutSection } from './components/AboutSection.jsx'
import { CatalogSection } from './components/CatalogSection.jsx'
import { ContactSection } from './components/ContactSection.jsx'
import { Footer } from './components/Footer.jsx'
import { Header } from './components/Header.jsx'
import { HeroSection } from './components/HeroSection.jsx'
import { TestimonialsSection } from './components/TestimonialsSection.jsx'
import { WhatsAppButton } from './components/WhatsAppButton.jsx'
import './components/shared.css'

function getSavedTheme() {
  return window.localStorage.getItem('sadmah-theme') || 'system'
}

function App() {
  const [theme, setTheme] = useState(getSavedTheme)
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark)

  useEffect(() => {
    if (theme === 'system') {
      delete document.documentElement.dataset.theme
      window.localStorage.removeItem('sadmah-theme')
      return
    }
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('sadmah-theme', theme)
  }, [theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updatePreference = (event) => setSystemPrefersDark(event.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return (
    <SiteLayout
      isDark={isDark}
      onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
    />
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}

function HomePage() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <CatalogSection />
      <TestimonialsSection />
      <ContactSection />
    </main>
  )
}

function SiteLayout({ isDark, onToggleTheme }) {
  return (
    <>
      <ScrollToTop />
      <Header isDark={isDark} onToggleTheme={onToggleTheme} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<main><AboutSection /></main>} />
        <Route path="/catalog" element={<main><CatalogSection /></main>} />
        <Route
          path="/testimonials"
          element={<main><TestimonialsSection /></main>}
        />
        <Route path="/contact" element={<main><ContactSection /></main>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <WhatsAppButton />
    </>
  )
}

export default App
