import { siteConfig } from '../siteConfig.js'
import './WhatsAppButton.css'

export function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, '')}`

  return (
    <a
      className="whatsapp-button"
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Sadmah Enterprises on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 3.2A12.6 12.6 0 0 0 5.2 22.3L3.5 28.7l6.6-1.7A12.7 12.7 0 1 0 16 3.2Zm0 22.9a10.3 10.3 0 0 1-5.2-1.4l-.4-.2-3.9 1 1-3.8-.3-.4A10.3 10.3 0 1 1 16 26.1Zm5.7-7.7c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.8-2.1-.2-.3 0-.5.1-.7l.5-.5.3-.6c.1-.2 0-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z" />
      </svg>
    </a>
  )
}
