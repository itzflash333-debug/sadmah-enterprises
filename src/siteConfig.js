import agbadaImage from './assets/catalog-agbada.jpg'
import goldenHourImage from './assets/catalog-golden-hour.jpg'
import modernClassicImage from './assets/catalog-modern-classic.jpg'

export const siteConfig = {
  email: 'itzflash333@gmail.com',
  whatsappNumber: '2347033371354',
  catalog: [
    {
      name: 'The Heritage Agbada',
      description: 'A timeless silhouette, finished by hand in richly woven fabric.',
      image: agbadaImage,
      alt: 'White embroidered agbada displayed on a mannequin',
      category: '01 — Bespoke tailoring',
    },
    {
      name: 'Golden Hour',
      description: 'Sculptural occasionwear with a little light in every detail.',
      image: goldenHourImage,
      alt: 'White embroidered traditional outfit arranged on a hanger',
      category: '02 — Occasionwear',
    },
    {
      name: 'The Modern Classic',
      description: 'Clean lines and considered tailoring, made entirely your own.',
      image: modernClassicImage,
      alt: 'A modern patterned shirt and white trousers laid out together',
      category: '03 — Made to measure',
    },
  ],
  testimonials: [
    {
      quote:
        'The fit, the fabric, the finish — every detail felt like it was made just for me. I have never felt more confident.',
      name: 'Auwal manjos',
      detail: 'Adamawa state ',
    },
    {
      quote:
        'Abubakar took an idea I could barely explain and turned it into the outfit I had imagined. The craftsmanship is exceptional.',
      name: 'Abdullahi Abbas Ribadu',
      detail: 'karewa jimeta',
    },
    {
      quote:
        'From our first conversation to the final fitting, the whole experience felt personal, thoughtful, and truly special.',
      name: 'Auwal Bobbo',
      detail: 'Biapass jimeta ',
    },
  ],
}
