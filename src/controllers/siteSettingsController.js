import { getSiteSettings } from '../services/siteSettingsService.js'

export async function getHomeSiteSettings(_request, response) {
  response.json(await getSiteSettings())
}
