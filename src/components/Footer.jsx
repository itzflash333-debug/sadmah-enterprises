import { Link } from 'react-router-dom'
import './Footer.css'

export function Footer() {
  return (
    <footer className="site-footer">
      <Link className="wordmark" to="/">SADMAH<span>®</span></Link>
      <p>© {new Date().getFullYear()} Sadmah Enterprises. Made with intention.</p>
    </footer>
  )
}
