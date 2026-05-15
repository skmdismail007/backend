import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../services/productService.js'

export async function getProducts(request, response) {
  const products = await listProducts(request.validated.query)
  response.json(products)
}

export async function getProduct(request, response) {
  const product = await getProductById(request.validated.params.id)
  response.json(product)
}

export async function postProduct(request, response) {
  const product = await createProduct(request.validated.body)
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
