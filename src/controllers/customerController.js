import {
  createContactMessage,
  createQuoteRequest,
  createReview,
  listContactMessages,
  listQuoteRequests,
  listReviews,
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
