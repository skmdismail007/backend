import {
  deleteMessage,
  deleteQuote,
  deleteReview,
  getDashboardSummary,
  listAddresses,
  listAllReviews,
  listOrders,
  listUsers,
  updateMessageStatus,
  updateOrderStatus,
  updateQuoteStatus,
  updateReviewApproval,
} from '../services/adminService.js'
import { listContactMessages, listQuoteRequests } from '../services/customerService.js'

export async function getAdminSummary(_request, response) {
  response.json(await getDashboardSummary())
}

export async function getAdminReviews(_request, response) {
  response.json(await listAllReviews())
}

export async function patchAdminReview(request, response) {
  const review = await updateReviewApproval(
    request.validated.params.id,
    request.validated.body.isApproved,
  )
  response.json(review)
}

export async function removeAdminReview(request, response) {
  response.json(await deleteReview(request.validated.params.id))
}

export async function getAdminMessages(_request, response) {
  response.json(await listContactMessages())
}

export async function patchAdminMessage(request, response) {
  const message = await updateMessageStatus(
    request.validated.params.id,
    request.validated.body.status,
  )
  response.json(message)
}

export async function removeAdminMessage(request, response) {
  response.json(await deleteMessage(request.validated.params.id))
}

export async function getAdminQuotes(_request, response) {
  response.json(await listQuoteRequests())
}

export async function patchAdminQuote(request, response) {
  const quote = await updateQuoteStatus(
    request.validated.params.id,
    request.validated.body.status,
  )
  response.json(quote)
}

export async function removeAdminQuote(request, response) {
  response.json(await deleteQuote(request.validated.params.id))
}

export async function getAdminUsers(_request, response) {
  response.json(await listUsers())
}

export async function getAdminAddresses(_request, response) {
  response.json(await listAddresses())
}

export async function getAdminOrders(_request, response) {
  response.json(await listOrders())
}

export async function patchAdminOrder(request, response) {
  const order = await updateOrderStatus(
    request.validated.params.id,
    request.validated.body.status,
  )
  response.json(order)
}
