import { collectionRef, mapDoc, updateDocument } from './realtimeDataService.js'
import { deleteImagesByUrls } from './imageService.js'

const MAX_SITE_HERO_IMAGES = 5
const imageFields = ['heroImage', 'testimonialImageOne', 'testimonialImageTwo']

export const EMPTY_SITE_SETTINGS = {
  heroEyebrow: '',
  heroTitle: '',
  heroCopy: '',
  heroImage: '',
  heroImages: [],
  primaryCtaLabel: '',
  secondaryCtaLabel: '',
  featuredTitle: '',
  servicesTitle: '',
  testimonialEyebrow: '',
  testimonialTitle: '',
  testimonialText: '',
  testimonialImageOne: '',
  testimonialImageTwo: '',
  contactEyebrow: '',
  contactTitle: '',
  contactText: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  businessHours: '',
  productsHeroEyebrow: '',
  productsHeroTitle: '',
  productsHeroText: '',
  productsHeroImage: '',
  servicesHeroEyebrow: '',
  servicesHeroTitle: '',
  servicesHeroText: '',
  servicesHeroImage: '',
  reviewsHeroEyebrow: '',
  reviewsHeroTitle: '',
  reviewsHeroText: '',
  reviewsHeroImage: '',
  contactHeroTitle: '',
  contactHeroText: '',
  footerDescription: '',
}

function normalizeImageList(images) {
  if (!Array.isArray(images)) return []

  return [
    ...new Set(
      images
        .map((image) => (typeof image === 'string' ? image.trim() : ''))
        .filter(Boolean),
    ),
  ].slice(0, MAX_SITE_HERO_IMAGES)
}

export function normalizeSiteSettings(settings = {}) {
  const normalizedEntries = Object.fromEntries(
    Object.entries(settings || {}).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  )

  return {
    ...EMPTY_SITE_SETTINGS,
    ...normalizedEntries,
    heroImages: normalizeImageList(normalizedEntries.heroImages),
  }
}

function getReferencedImages(settings = {}) {
  return [
    ...imageFields.map((field) => settings[field]),
    ...(Array.isArray(settings.heroImages) ? settings.heroImages : []),
  ].filter(Boolean)
}

export async function getSiteSettings() {
  const doc = await collectionRef('siteSettings').doc('home').get()
  return normalizeSiteSettings(doc.exists ? mapDoc(doc) : {})
}

export async function updateSiteSettings(updates) {
  const current = await getSiteSettings()
  const record = normalizeSiteSettings({
    ...current,
    ...updates,
  })

  const doc = await collectionRef('siteSettings').doc('home').get()
  if (!doc.exists) {
    await collectionRef('siteSettings').doc('home').set({
      ...record,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } else {
    await updateDocument('siteSettings', 'home', record)
  }

  const removedImages = getReferencedImages(current).filter((url) => !getReferencedImages(record).includes(url))
  await deleteImagesByUrls(removedImages)
  return getSiteSettings()
}
