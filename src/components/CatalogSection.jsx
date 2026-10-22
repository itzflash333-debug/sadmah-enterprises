import { siteConfig } from '../siteConfig.js'
import './CatalogSection.css'

export function CatalogSection() {
  return (
    <section className="catalog section-pad" id="catalog">
      <div className="section-heading">
        <div>
          <div className="section-kicker"><span>02</span> / THE COLLECTION</div>
          <h2>Made to <em>make an entrance.</em></h2>
        </div>
        <p>Considered pieces. Unforgettable impressions.</p>
      </div>
      <div className="catalog-grid">
        {siteConfig.catalog.map((item, index) => (
          <article className="catalog-card" key={item.name}>
            <div className="catalog-image-wrap">
              <img src={item.image} alt={item.alt} loading="lazy" />
              <span className="catalog-index">0{index + 1}</span>
            </div>
            <p className="card-category">{item.category}</p>
            <h3>{item.name}</h3>
            <p className="card-description">{item.description}</p>
          </article>
        ))}
      </div>
      <div className="fabric-heading">
        <h3>Fabrics</h3>
        <p>Ask us about colours, availability, and pricing.</p>
      </div>
      <div className="catalog-grid">
        {siteConfig.fabrics.map((fabric, index) => (
          <article className="catalog-card" key={fabric.name}>
            <div className={`catalog-image-wrap${fabric.image ? '' : ' fabric-image-wrap'}`}>
              {fabric.image ? (
                <img src={fabric.image} alt={fabric.alt} loading="lazy" />
              ) : (
                <span className="fabric-swatch-label" aria-hidden="true">FABRIC</span>
              )}
              <span className="catalog-index" aria-hidden="true">0{index + 1}</span>
            </div>
            <p className="card-category">Fabric</p>
            <h3>{fabric.name}</h3>
            <p className="card-description">{fabric.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
