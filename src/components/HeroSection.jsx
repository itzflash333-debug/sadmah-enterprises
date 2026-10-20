import heroImage from '../assets/hero-reference.jpg'
import './HeroSection.css'

export function HeroSection() {
  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <p className="eyebrow"><span /> THE ART OF BEING WELL DRESSED</p>
        <h1>Abubakar Sadiq<br /><em>Mahmud.</em></h1>
        <p className="hero-role">Fashion designer <span>·</span> 5 years of making the imagined real</p>
        <p className="hero-brand">Founder of <strong>Sadmah Enterprises</strong></p>
        <p className="hero-tagline">
          Fabric, reimagined. Design, made personal. A little something
          extraordinary in every stitch.
        </p>
        <a className="button button-dark" href="#contact">
          Order your design <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="hero-image-wrap">
        <img
          className="hero-image"
          src={heroImage}
          alt="Two light blue traditional outfits displayed on mannequins"
        />
        <div className="image-caption">
          <span>MADE WITH INTENTION</span>
          <span>01 / 05</span>
        </div>
      </div>
    </section>
  )
}
