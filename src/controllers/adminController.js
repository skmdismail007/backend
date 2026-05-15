import {
  deleteMessage,
  deleteAddressByAdmin,
  deleteOrderByAdmin,
  deleteQuote,
  deleteReview,
  deleteUserByAdmin,
  getDashboardSummary,
  getUserDetails,
  listAddresses,
  listAllReviews,
  listOrders,
  listUsers,
  updateMessageStatus,
  updateAddressByAdmin,
  updateOrderByAdmin,
  updateOrderStatus,
  updateQuoteStatus,
  updateReviewApproval,
  updateUserByAdmin,
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

export async function getAdminUserDetails(request, response) {
  response.json(await getUserDetails(request.validated.params.id))
}

export async function patchAdminUser(request, response) {
  response.json(await updateUserByAdmin(request.validated.params.id, request.validated.body))
}

export async function removeAdminUser(request, response) {
  response.json(await deleteUserByAdmin(request.validated.params.id))
}

export async function getAdminAddresses(_request, response) {
  response.json(await listAddresses())
}

export async function patchAdminAddress(request, response) {
  response.json(await updateAddressByAdmin(request.validated.params.id, request.validated.body))
}

export async function removeAdminAddress(request, response) {
  response.json(await deleteAddressByAdmin(request.validated.params.id))
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

export async function patchAdminOrderDetails(request, response) {
  response.json(await updateOrderByAdmin(request.validated.params.id, request.validated.body))
}

export async function removeAdminOrder(request, response) {
  response.json(await deleteOrderByAdmin(request.validated.params.id))
}
