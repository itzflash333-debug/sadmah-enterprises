import { siteConfig } from '../siteConfig.js'
import './TestimonialsSection.css'

export function TestimonialsSection() {
  return (
    <section className="testimonials section-pad" id="testimonials">
      <div className="section-kicker"><span>03</span> / KIND WORDS</div>
      <h2>Worn with love.<br /><em>Remembered always.</em></h2>
      <div className="testimonial-grid">
        {siteConfig.testimonials.map((testimonial) => (
          <figure className="testimonial" key={testimonial.name}>
            <span className="quote-mark" aria-hidden="true">“</span>
            <blockquote>{testimonial.quote}</blockquote>
            <figcaption>
              <span className="client-name">{testimonial.name}</span>
              <span className="client-detail">{testimonial.detail}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
