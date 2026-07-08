export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'ALL'
  | 'UNKNOWN'

export type PatternKind = 'path' | 'regexp' | 'unknown'
export type ApiCallSource = 'fetch' | 'axios' | 'wrapper'

export interface SourceLocation {
  filePath: string
  line: number
  column: number
}

export interface RoutePattern {
  raw: string
  kind: PatternKind
  normalized: string
  pathname: string | null
  origin: string | null
}

export interface HandlerRecord {
  id: string
  method: HttpMethod
  pattern: RoutePattern
  location: SourceLocation
  source: 'msw-http' | 'msw-rest'
}

export interface ApiCallRecord {
  id: string
  method: HttpMethod
  pattern: RoutePattern
  location: SourceLocation
  source: ApiCallSource
}

export interface UnsupportedPattern {
  kind: 'handler' | 'api-call'
  reason: string
  location: SourceLocation
  expressionText: string
}

export interface CoverageSummary {
  mockedCalls: number
  totalCalls: number
  usedHandlers: number
  totalHandlers: number
  staleHandlers: number
  unmockedCalls: number
  percentage: number
}

export interface CoverageMatch {
  callId: string
  handlerId: string
}

export interface CoverageReport {
  schemaVersion: 1
  handlers: HandlerRecord[]
  apiCalls: ApiCallRecord[]
  matches: CoverageMatch[]
  mockedCallIds: string[]
  usedHandlerIds: string[]
  staleHandlerIds: string[]
  unmockedCallIds: string[]
  unsupported: UnsupportedPattern[]
  summary: CoverageSummary
}

export type WrapperMethodFrom = 'options.method' | 'arg.method'
export type WrapperUrlFrom = 'arg.url' | 'options.url'

export interface ApiWrapperConfig {
  /** Function or property call name, for example request, api.get, client.post. */
  name: string
  /** Fixed HTTP method for method-specific helpers such as api.get. */
  method?: HttpMethod | Lowercase<Exclude<HttpMethod, 'UNKNOWN'>> | string
  /** Argument index that contains the URL string. Defaults to 0. */
  urlArg?: number
  /** Read the URL from an object argument, for example request({ url }). */
  urlFrom?: WrapperUrlFrom
  /** Argument index that contains the HTTP method string. */
  methodArg?: number
  /** Read method from an object argument, for example request('/x', { method }). */
  methodFrom?: WrapperMethodFrom
  /** Argument index for options.url or options.method. Defaults to 1. */
  optionsArg?: number
  /** Optional wrapper-specific base URL. */
  baseUrl?: string
}

export interface MswInspectorConfig {
  handlers?: string[]
  sources?: string[]
  exclude?: string[]
  baseUrl?: string
  apiWrappers?: ApiWrapperConfig[]
}

export interface AnalyzerOptions {
  cwd: string
  baseUrl?: string
  handlerGlobs?: string[]
  sourceGlobs?: string[]
  excludeGlobs?: string[]
  apiWrappers?: ApiWrapperConfig[]
}
