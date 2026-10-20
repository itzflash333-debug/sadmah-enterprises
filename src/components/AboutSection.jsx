import './AboutSection.css'

export function AboutSection() {
  return (
    <section className="about section-pad" id="about">
      <div className="section-kicker"><span>01</span> / THE HOUSE</div>
      <div className="about-content">
        <p className="eyebrow">MORE THAN A LABEL</p>
        <h2>Every thread has<br />a <em>story to tell.</em></h2>
        <div className="about-lower">
          <p className="about-lead">
            Sadmah Enterprises is a clothing empire built on one simple belief:
            what you wear should feel unmistakably yours.
          </p>
          <p>
            For five years, Abubakar Sadiq Mahmud has been turning the
            extraordinary into the everyday — transforming carefully chosen
            fabrics into thoughtful, finely crafted designs that draw every eye
            and stay with you long after the occasion.
          </p>
        </div>
      </div>
      <div className="about-mark" aria-hidden="true">S.</div>
    </section>
  )
}
