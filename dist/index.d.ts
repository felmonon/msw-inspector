import { A as AnalyzerOptions, C as CoverageReport, H as HandlerRecord, a as ApiCallRecord, U as UnsupportedPattern, R as RoutePattern, S as SourceLocation, b as HttpMethod } from './types-MrDLI7W5.js';
export { c as CoverageMatch, d as CoverageSummary, P as PatternKind } from './types-MrDLI7W5.js';

declare function analyzeProject(options: AnalyzerOptions): Promise<CoverageReport>;

declare function buildCoverageReport(input: {
    handlers: HandlerRecord[];
    apiCalls: ApiCallRecord[];
    unsupported?: UnsupportedPattern[];
}): CoverageReport;

declare function formatCoverageReport(report: CoverageReport): string;

declare function normalizeMethod(value: string | undefined): HttpMethod;
declare function createPathPattern(raw: string, baseUrl?: string): RoutePattern;
declare function createRegExpPattern(raw: string): RoutePattern;
declare function createUnknownPattern(raw: string): RoutePattern;
declare function normalizePathname(value: string): string;
declare function createRecordId(parts: string[]): string;
declare function normalizeLocation(filePath: string, line: number, column: number): SourceLocation;

interface ApiCallScanResult {
    apiCalls: ApiCallRecord[];
    unsupported: UnsupportedPattern[];
}
declare function scanApiCalls(options: AnalyzerOptions): Promise<ApiCallScanResult>;

interface HandlerScanResult {
    handlers: HandlerRecord[];
    unsupported: UnsupportedPattern[];
}
declare function scanHandlers(options: AnalyzerOptions): Promise<HandlerScanResult>;

export { AnalyzerOptions, ApiCallRecord, type ApiCallScanResult, CoverageReport, HandlerRecord, type HandlerScanResult, HttpMethod, RoutePattern, SourceLocation, UnsupportedPattern, analyzeProject, buildCoverageReport, createPathPattern, createRecordId, createRegExpPattern, createUnknownPattern, formatCoverageReport, normalizeLocation, normalizeMethod, normalizePathname, scanApiCalls, scanHandlers };
