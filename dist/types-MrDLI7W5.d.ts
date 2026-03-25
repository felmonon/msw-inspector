type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'ALL' | 'UNKNOWN';
type PatternKind = 'path' | 'regexp' | 'unknown';
interface SourceLocation {
    filePath: string;
    line: number;
    column: number;
}
interface RoutePattern {
    raw: string;
    kind: PatternKind;
    normalized: string;
    pathname: string | null;
    origin: string | null;
}
interface HandlerRecord {
    id: string;
    method: HttpMethod;
    pattern: RoutePattern;
    location: SourceLocation;
    source: 'msw-http' | 'msw-rest';
}
interface ApiCallRecord {
    id: string;
    method: HttpMethod;
    pattern: RoutePattern;
    location: SourceLocation;
    source: 'fetch' | 'axios';
}
interface UnsupportedPattern {
    kind: 'handler' | 'api-call';
    reason: string;
    location: SourceLocation;
    expressionText: string;
}
interface CoverageSummary {
    mockedCalls: number;
    totalCalls: number;
    usedHandlers: number;
    totalHandlers: number;
    staleHandlers: number;
    unmockedCalls: number;
    percentage: number;
}
interface CoverageMatch {
    callId: string;
    handlerId: string;
}
interface CoverageReport {
    schemaVersion: 1;
    handlers: HandlerRecord[];
    apiCalls: ApiCallRecord[];
    matches: CoverageMatch[];
    mockedCallIds: string[];
    usedHandlerIds: string[];
    staleHandlerIds: string[];
    unmockedCallIds: string[];
    unsupported: UnsupportedPattern[];
    summary: CoverageSummary;
}
interface AnalyzerOptions {
    cwd: string;
    baseUrl?: string;
    handlerGlobs?: string[];
    sourceGlobs?: string[];
    excludeGlobs?: string[];
}

export type { AnalyzerOptions as A, CoverageReport as C, HandlerRecord as H, PatternKind as P, RoutePattern as R, SourceLocation as S, UnsupportedPattern as U, ApiCallRecord as a, HttpMethod as b, CoverageMatch as c, CoverageSummary as d };
