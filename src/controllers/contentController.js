import {
  createFreelanceRequest,
  deleteBanner,
  deleteBlogPost,
  deleteCategory,
  deleteFreelanceRequest,
  getBlogPost,
  listBanners,
  listBlogPosts,
  listCategories,
  listFreelanceRequests,
  saveBanner,
  saveBlogPost,
  saveCategory,
  updateFreelanceRequestStatus,
} from '../services/contentService.js'

export async function getCategories(request, response) {
  response.json(await listCategories(request.validated?.query || request.query))
}

export async function postAdminCategory(request, response) {
  response.status(201).json(await saveCategory(request.validated.body))
}

export async function patchAdminCategory(request, response) {
  response.json(await saveCategory(request.validated.body, request.validated.params.id))
}

export async function removeAdminCategory(request, response) {
  response.json(await deleteCategory(request.validated.params.id))
}

export async function getBanners(request, response) {
  response.json(await listBanners(request.validated?.query || request.query))
}

export async function postAdminBanner(request, response) {
  response.status(201).json(await saveBanner(request.validated.body))
}

export async function patchAdminBanner(request, response) {
  response.json(await saveBanner(request.validated.body, request.validated.params.id))
}

export async function removeAdminBanner(request, response) {
  response.json(await deleteBanner(request.validated.params.id))
}

export async function getBlogPosts(request, response) {
  response.json(await listBlogPosts(request.validated?.query || request.query))
}

export async function getPublicBlogPost(request, response) {
  const post = await getBlogPost(request.validated.params.id)
  if (!post.published) {
    response.status(404).json({ message: 'Record not found' })
    return
  }
  response.json(post)
}

export async function postAdminBlogPost(request, response) {
  response.status(201).json(await saveBlogPost(request.validated.body))
}

export async function patchAdminBlogPost(request, response) {
  response.json(await saveBlogPost(request.validated.body, request.validated.params.id))
}

export async function removeAdminBlogPost(request, response) {
  response.json(await deleteBlogPost(request.validated.params.id))
}

export async function postFreelanceRequest(request, response) {
  response.status(201).json(await createFreelanceRequest(request.validated.body))
}

export async function getAdminFreelanceRequests(_request, response) {
  response.json(await listFreelanceRequests())
}

export async function patchAdminFreelanceRequest(request, response) {
  response.json(
    await updateFreelanceRequestStatus(request.validated.params.id, request.validated.body.status),
  )
}

export async function removeAdminFreelanceRequest(request, response) {
  response.json(await deleteFreelanceRequest(request.validated.params.id))
}
