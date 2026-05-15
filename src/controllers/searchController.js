import { searchCatalog } from '../services/searchService.js'

export async function getSearchResults(request, response) {
  const results = await searchCatalog(request.validated.query.q)
  response.json(results)
}
