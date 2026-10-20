import { siteConfig } from '../siteConfig.js'
import './ContactSection.css'

export function ContactSection() {
  return (
    <section className="contact section-pad" id="contact">
      <div className="contact-intro">
        <div className="section-kicker"><span>04</span> / LET'S MAKE SOMETHING</div>
        <h2>Your vision.<br /><em>Our next story.</em></h2>
        <p>
          Have an occasion, a fabric, or just a feeling in mind? Tell us about
          it. We would love to make it yours.
        </p>
        <div className="contact-note">
          <span className="note-star">✳</span>
          <span>Thoughtfully made, just for you.<br />Every stitch starts with a conversation.</span>
        </div>
      </div>
      <form
        className="contact-form"
        action={`https://formsubmit.co/${siteConfig.email}`}
        method="POST"
        encType="multipart/form-data"
      >
        <input type="hidden" name="_subject" value="A design enquiry from Sadmah Enterprises" />
        <label htmlFor="contact-name">YOUR NAME</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" placeholder="How should we address you?" required />
        <label htmlFor="contact-email">EMAIL ADDRESS</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <label htmlFor="contact-message">TELL US WHAT YOU HAVE IN MIND</label>
        <textarea id="contact-message" name="message" rows="4" placeholder="An occasion, an idea, a little inspiration..." required />
        <label htmlFor="contact-design">UPLOAD YOUR DESIGN (OPTIONAL)</label>
        <input
          id="contact-design"
          name="attachment"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
        />
        <p className="form-hint">Add a JPG, PNG, or PDF file, up to 10 MB.</p>
        <button className="button button-light" type="submit">
          Send your enquiry <span aria-hidden="true">↗</span>
        </button>
        <p className="form-footnote">Your enquiry will be sent directly to our email inbox.</p>
      </form>
    </section>
  )
}
