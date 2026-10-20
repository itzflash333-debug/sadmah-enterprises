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
    </section>
  )
}
