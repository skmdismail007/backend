import { collectionRef, mapDoc } from './realtimeDataService.js'

function matchesSearch(record, fields, search) {
  return fields
    .map((field) => record[field])
    .join(' ')
    .toLowerCase()
    .includes(search)
}

export async function searchCatalog(query) {
  const search = query.trim().toLowerCase()
  if (!search) return { products: [], services: [], blogPosts: [] }

  const [productSnapshot, serviceSnapshot, blogSnapshot] = await Promise.all([
    collectionRef('products').where('isActive', '==', true).get(),
    collectionRef('services').where('isActive', '==', true).get(),
    collectionRef('blogPosts').where('published', '==', true).get(),
  ])

  const products = productSnapshot.docs
    .map(mapDoc)
    .filter((product) => matchesSearch(product, ['name', 'category', 'short', 'details', 'badge'], search))
    .slice(0, 8)

  const services = serviceSnapshot.docs
    .map(mapDoc)
    .filter((service) => matchesSearch(service, ['name', 'category', 'description', 'summary'], search))
    .slice(0, 8)

  const blogPosts = blogSnapshot.docs
    .map(mapDoc)
    .filter((post) => matchesSearch(post, ['title', 'excerpt', 'content', 'author'], search))
    .slice(0, 8)

  return { products, services, blogPosts }
}
