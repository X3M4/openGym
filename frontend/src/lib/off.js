// Open Food Facts (world.openfoodfacts.org): a product by barcode, and a text search run on
// request (never as you type — the API forbids it). Data © Open Food Facts contributors, Open
// Database License; the app says so wherever a food came from there.
//
// The API's own rules (openfoodfacts.github.io/openfoodfacts-server/api): 15 product reads and 10
// searches per minute per IP, and a User-Agent of the form "AppName/Version (contact)". The phone
// sends that header from native code (CapacitorHttp); a browser cannot set User-Agent at all and
// sends its own. The limits are kept here, on the device, before a request goes out.
import { nativeFetch } from './capacitor-fetch.js'
import { MOBILE } from './mobile.js'
import { foodFromOff } from './nutrition.js'

// The contact OFF asks for in the User-Agent. Set at build time (VITE_OFF_CONTACT, kept in the
// untracked frontend/.env.local) so the address never lands in the public repository; a build
// without it names the fork's page instead.
export const OFF_CONTACT = import.meta.env.VITE_OFF_CONTACT || 'https://github.com/X3M4/openGym'
const UA = `SuperOpenGym/${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} (${OFF_CONTACT})`
const BASE = 'https://world.openfoodfacts.org'
const FIELDS = 'code,product_name,product_name_es,generic_name,brands,serving_quantity,nutriments'
export const LIMITS = { product: 15, search: 10 }

export class OffLimitError extends Error {
  constructor(waitSec) { super('rate-limit'); this.waitSec = waitSec }
}

const recent = { product: [], search: [] }
/** Count a request against its per-minute limit, or throw with the seconds left to wait. */
export function takeSlot(kind, now = Date.now()) {
  const q = recent[kind]
  while (q.length && now - q[0] >= 60000) q.shift()
  if (q.length >= LIMITS[kind]) throw new OffLimitError(Math.ceil((60000 - (now - q[0])) / 1000))
  q.push(now)
}
export function resetSlots() { recent.product.length = 0; recent.search.length = 0 }

async function getJson(url) {
  const init = { headers: MOBILE ? { 'User-Agent': UA, Accept: 'application/json' } : { Accept: 'application/json' } }
  const res = await (MOBILE ? nativeFetch(url, init) : fetch(url, init))
  if (!res.ok && res.status !== 404) throw new Error('off-http-' + res.status)
  return res.json()
}

/** The product with this barcode as a food, or null when OFF does not have it (or not its energy). */
export async function productByCode(code) {
  const clean = String(code || '').replace(/\D/g, '')
  if (!clean) return null
  takeSlot('product')
  const data = await getJson(`${BASE}/api/v2/product/${clean}.json?fields=${FIELDS}`)
  return data?.status === 1 ? foodFromOff(data.product) : null
}

/** Up to `size` foods matching the words, only those with their energy per 100 g. */
export async function searchFoods(query, size = 20) {
  const q = String(query || '').trim()
  if (q.length < 2) return []
  takeSlot('search')
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=${size}&fields=${FIELDS}`
  const data = await getJson(url)
  return (data?.products || []).map(p => foodFromOff(p)).filter(Boolean)
}
