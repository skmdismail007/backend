import {
  createService,
  deleteService,
  getServiceById,
  listServices,
  updateService,
} from '../services/serviceService.js'

export async function getServices(request, response) {
  const services = await listServices(request.validated.query)
  response.json(services)
}

export async function getService(request, response) {
  const service = await getServiceById(request.validated.params.id)
  response.json(service)
}

export async function postService(request, response) {
  const service = await createService(request.validated.body)
  response.status(201).json(service)
}

export async function patchService(request, response) {
  const service = await updateService(request.validated.params.id, request.validated.body)
  response.json(service)
}

export async function removeService(request, response) {
  const service = await deleteService(request.validated.params.id)
  response.json(service)
}
