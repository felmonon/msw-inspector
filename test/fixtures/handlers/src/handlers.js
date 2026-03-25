import { http as h, rest } from 'msw'
import * as msw from 'msw'

const USERS_PATH = '/users/:id?view=full#details'
const ORDERS_URL = new URL('/v1/orders?debug=1#top', 'https://api.example.com').toString()
const SEARCH_PATH = `/search/${'active'}`
const LEGACY_REGEX = /https?:\/\/example\.com\/legacy\/.*/
const LOGS_URL = String(new URL('/logs', 'https://api.example.com/base'))
const buildPath = '/dynamic'

export const handlers = [
  h.get(USERS_PATH, () => null),
  rest.post(ORDERS_URL, () => null),
  msw.http.delete(SEARCH_PATH, () => null),
  msw.rest.get(LEGACY_REGEX, () => null),
  rest.all('/health?ping=1#debug', () => null),
  msw.http.head(LOGS_URL, () => null),
  h.put(buildPath, () => null),
  msw.http.patch(new URL('/checkout', 'https://api.example.com'), () => null),
]
