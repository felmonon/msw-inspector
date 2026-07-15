import { importedGet } from './wrapper-lib'

function apiGet(url: string) {
  return url
}

const apiPost = (url: string) => url

function apiRequest(url: string) {
  return url
}

function apiDelete(url: string) {
  return url
}

function makeRequest(_method: string) {
  return (url: string) => url
}

const apiPut = makeRequest('PUT')

const dynamicPath = Math.random() > 0.5 ? '/one' : '/two'

function useShadowedName(apiGet: (url: string) => string) {
  apiGet('/shadowed')
}

apiGet('/users?active=1')
apiPost('/orders')
apiRequest('/health')
apiPut('/settings')
apiDelete(dynamicPath)
importedGet('/imported')
useShadowedName((url) => url)
