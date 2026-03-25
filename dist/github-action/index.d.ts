import { C as CoverageReport } from '../types-z3Agcn9m.js';

interface GitHubActionOptions {
    summaryFile: string;
    comment: boolean;
    commentTitle: string;
    githubToken: string;
    commentLimit: number;
}
declare function readCoverageReport(summaryFile: string): Promise<CoverageReport>;
declare function renderJobSummary(report: CoverageReport): string;
declare function renderStickyComment(report: CoverageReport, title?: string, limit?: number): string;
declare function writeJobSummary(report: CoverageReport): Promise<void>;
declare function upsertStickyComment(report: CoverageReport, options: GitHubActionOptions): Promise<string | undefined>;
declare function run(): Promise<void>;

export { type GitHubActionOptions, readCoverageReport, renderJobSummary, renderStickyComment, run, upsertStickyComment, writeJobSummary };
