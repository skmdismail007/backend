import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../services/productService.js'
import { env } from '../config/env.js'

export async function getProducts(request, response) {
  const products = await listProducts(request.validated.query)
  response.json(products)
}

export async function getProduct(request, response) {
  const product = await getProductById(request.validated.params.id)
  response.json(product)
}

export async function postProduct(request, response) {
  if (env.nodeEnv !== 'production') {
    console.debug('[backend] POST /api/products received', {
      body: {
        name: request.validated.body.name,
        category: request.validated.body.category,
        price: request.validated.body.price,
        imageCount: request.validated.body.images?.length || 0,
      },
    })
  }
  const product = await createProduct(request.validated.body)
  if (env.nodeEnv !== 'production') console.debug('[backend] product created', { id: product.id })
  response.status(201).json(product)
}

export async function patchProduct(request, response) {
  const product = await updateProduct(request.validated.params.id, request.validated.body)
  response.json(product)
}

export async function removeProduct(request, response) {
  const product = await deleteProduct(request.validated.params.id)
  response.json(product)
}
