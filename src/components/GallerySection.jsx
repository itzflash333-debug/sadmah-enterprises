import { useEffect, useState } from 'react'
import './GallerySection.css'

export function GallerySection() {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    let active = true
    async function loadPhotos() {
      try {
        const response = await fetch('/api/gallery')
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Could not load gallery photos.')
        if (active) setPhotos(body.items)
      } catch (error) {
        try {
          const response = await fetch('/gallery/gallery.json')
          if (!response.ok) {
            console.error('Could not load gallery photos from the API or saved site manifest:', error)
            return
          }
          const items = await response.json()
          if (!Array.isArray(items)) {
            console.error('The saved public gallery has an unexpected format.')
            return
          }
          if (active) setPhotos(items)
        } catch (fallbackError) {
          console.error('Could not load public gallery photos:', error, fallbackError)
        }
      }
    }

    loadPhotos()

    return () => { active = false }
  }, [])

  if (!photos.length) return null

  return (
    <section className="studio-gallery section-pad" id="studio-gallery">
      <div className="studio-gallery-heading">
        <div>
          <div className="section-kicker"><span>03</span> / FROM THE STUDIO</div>
          <h2>A little more <em>inspiration.</em></h2>
        </div>
        <p>More pieces, details, and moments from our atelier.</p>
      </div>
      <div className="studio-gallery-grid">
        {photos.map((photo) => (
          <figure className="studio-gallery-card" key={photo.id}>
            <img src={photo.image} alt={photo.alt} loading="lazy" />
            <figcaption>{photo.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
