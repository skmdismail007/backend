import {
  createOffer,
  deleteOffer,
  getOfferById,
  listOffers,
  updateOffer,
  validateCoupon,
} from '../services/offerService.js'

export async function getPublicOffers(_request, response) {
  const offers = await listOffers({ publicOnly: true, onProductOnly: true })
  response.json(offers)
}

export async function postValidateCoupon(request, response) {
  const { code, subtotal } = request.validated.body
  const result = await validateCoupon(code, subtotal)
  if (!result.valid) {
    response.status(400).json(result)
    return
  }
  response.json(result)
}

export async function getAdminOffers(_request, response) {
  const offers = await listOffers({ publicOnly: false })
  response.json(offers)
}

export async function getAdminOffer(request, response) {
  const offer = await getOfferById(request.validated.params.id)
  response.json(offer)
}

export async function postAdminOffer(request, response) {
  const offer = await createOffer(request.validated.body)
  response.status(201).json(offer)
}

export async function patchAdminOffer(request, response) {
  const offer = await updateOffer(request.validated.params.id, request.validated.body)
  response.json(offer)
}

export async function removeAdminOffer(request, response) {
  const offer = await deleteOffer(request.validated.params.id)
  response.json(offer)
}
