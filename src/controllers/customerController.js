import {
  createContactMessage,
  createQuoteRequest,
  createReview,
  createUserAddress,
  createUserOrder,
  deleteUserAddress,
  listContactMessages,
  listQuoteRequests,
  listReviews,
  listUserAddresses,
  listUserOrders,
  loginUser,
  registerUser,
  setUserDefaultAddress,
  updateUser,
} from '../services/customerService.js'

export async function getReviews(_request, response) {
  response.json(await listReviews())
}

export async function postReview(request, response) {
  const review = await createReview(request.validated.body)
  response.status(201).json(review)
}

export async function postContactMessage(request, response) {
  const message = await createContactMessage(request.validated.body)
  response.status(201).json(message)
}

export async function getContactMessages(_request, response) {
  response.json(await listContactMessages())
}

export async function postQuoteRequest(request, response) {
  const quote = await createQuoteRequest(request.validated.body)
  response.status(201).json(quote)
}

export async function getQuoteRequests(_request, response) {
  response.json(await listQuoteRequests())
}

export async function postUserRegister(request, response) {
  const user = await registerUser(request.validated.body)
  response.status(201).json(user)
}

export async function postUserLogin(request, response) {
  const user = await loginUser(request.validated.body.email, request.validated.body.password)
  response.json(user)
}

export async function patchUser(request, response) {
  const user = await updateUser(request.validated.params.id, request.validated.body)
  response.json(user)
}

export async function getUserAddresses(request, response) {
  response.json(await listUserAddresses(request.validated.params.id))
}

export async function postUserAddress(request, response) {
  const address = await createUserAddress(request.validated.params.id, request.validated.body)
  response.status(201).json(address)
}

export async function patchUserDefaultAddress(request, response) {
  const address = await setUserDefaultAddress(
    request.validated.params.id,
    request.validated.params.addressId,
  )
  response.json(address)
}

export async function removeUserAddress(request, response) {
  const address = await deleteUserAddress(request.validated.params.id, request.validated.params.addressId)
  response.json(address)
}

export async function getUserOrders(request, response) {
  response.json(await listUserOrders(request.validated.params.id))
}

export async function postUserOrder(request, response) {
  const order = await createUserOrder(request.validated.params.id, request.validated.body)
  response.status(201).json(order)
}
