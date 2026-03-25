#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli.ts
var import_promises3 = require("fs/promises");
var import_node_path2 = __toESM(require("path"));
var import_commander = require("commander");

// src/core/compare.ts
var import_path_to_regexp = require("path-to-regexp");
function patternCandidates(pattern) {
  if (pattern.kind !== "path") {
    return [];
  }
  const values = /* @__PURE__ */ new Set();
  if (pattern.pathname) {
    values.add(pattern.pathname);
  }
  values.add(pattern.normalized);
  return [...values];
}
function matchesPath(call, handler) {
  if (handler.pattern.kind !== "path" || call.pattern.kind !== "path") {
    return false;
  }
  if (handler.pattern.origin && call.pattern.origin && handler.pattern.origin !== call.pattern.origin) {
    return false;
  }
  const handlerCandidates = patternCandidates(handler.pattern);
  const callCandidates = patternCandidates(call.pattern);
  for (const handlerCandidate of handlerCandidates) {
    const matcher = compilePathMatcher(handlerCandidate);
    if (!matcher) {
      continue;
    }
    for (const callCandidate of callCandidates) {
      const { origin, path: path3 } = splitOriginAndPath(callCandidate);
      if (handler.pattern.origin && origin && handler.pattern.origin !== origin) {
        continue;
      }
      if (matcher(path3)) {
        return true;
      }
    }
  }
  return false;
}
function compilePathMatcher(pattern) {
  try {
    const matcher = (0, import_path_to_regexp.match)(coerceWildcardParams(normalizePath(pattern)), {
      decode: false,
      sensitive: false
    });
    return (value) => Boolean(matcher(normalizePath(value)));
  } catch {
    return null;
  }
}
function coerceWildcardParams(pattern) {
  let index = 0;
  return pattern.replace(/(^|\/)\*\*?(?=\/|$)/g, (_, prefix) => `${prefix}*wildcard${++index}`);
}
function splitOriginAndPath(value) {
  try {
    const url = new URL(value);
    return {
      origin: url.origin,
      path: url.pathname
    };
  } catch {
    return {
      origin: null,
      path: normalizePath(value)
    };
  }
}
function normalizePath(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "/";
  }
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
}
function matchesRegExp(call, handler) {
  if (handler.pattern.kind !== "regexp") {
    return false;
  }
  try {
    const expression = handler.pattern.raw;
    const lastSlash = expression.lastIndexOf("/");
    const source = expression.slice(1, lastSlash);
    const flags = expression.slice(lastSlash + 1);
    const regex = new RegExp(source, flags);
    return patternCandidates(call.pattern).some((candidate) => regex.test(candidate));
  } catch {
    return false;
  }
}
function methodsMatch(call, handler) {
  return handler.method === "ALL" || call.method === handler.method;
}
function findMatch(call, handlers) {
  return handlers.find((handler) => {
    if (!methodsMatch(call, handler)) {
      return false;
    }
    if (handler.pattern.kind === "path") {
      return matchesPath(call, handler);
    }
    if (handler.pattern.kind === "regexp") {
      return matchesRegExp(call, handler);
    }
    return false;
  });
}
function percentage(numerator, denominator) {
  if (denominator === 0) {
    return 100;
  }
  return Math.round(numerator / denominator * 1e3) / 10;
}
function buildCoverageReport(input) {
  const matches = [];
  const mockedCallIds = /* @__PURE__ */ new Set();
  const usedHandlerIds = /* @__PURE__ */ new Set();
  for (const call of input.apiCalls) {
    const handler = findMatch(call, input.handlers);
    if (!handler) {
      continue;
    }
    matches.push({
      callId: call.id,
      handlerId: handler.id
    });
    mockedCallIds.add(call.id);
    usedHandlerIds.add(handler.id);
  }
  const unmockedCallIds = input.apiCalls.filter((call) => !mockedCallIds.has(call.id)).map((call) => call.id);
  const staleHandlerIds = input.handlers.filter((handler) => !usedHandlerIds.has(handler.id)).map((handler) => handler.id);
  return {
    schemaVersion: 1,
    handlers: input.handlers,
    apiCalls: input.apiCalls,
    matches,
    mockedCallIds: [...mockedCallIds],
    usedHandlerIds: [...usedHandlerIds],
    staleHandlerIds,
    unmockedCallIds,
    unsupported: input.unsupported ?? [],
    summary: {
      mockedCalls: mockedCallIds.size,
      totalCalls: input.apiCalls.length,
      usedHandlers: usedHandlerIds.size,
      totalHandlers: input.handlers.length,
      staleHandlers: staleHandlerIds.length,
      unmockedCalls: unmockedCallIds.length,
      percentage: percentage(mockedCallIds.size, input.apiCalls.length)
    }
  };
}

// src/core/scan-api-calls.ts
var import_promises = __toESM(require("fs/promises"));
var import_fast_glob = __toESM(require("fast-glob"));
var import_ts_morph = require("ts-morph");

// src/core/defaults.ts
var DEFAULT_HANDLER_GLOBS = [
  "**/*.{ts,tsx,js,jsx,mts,mjs,cjs}"
];
var DEFAULT_SOURCE_GLOBS = [
  "**/*.{ts,tsx,js,jsx,mts,mjs,cjs}"
];
var DEFAULT_EXCLUDE_GLOBS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/build/**",
  "**/*.d.ts",
  "**/*.{test,spec}.{ts,tsx,js,jsx,mts,mjs,cjs}"
];

// src/core/normalize.ts
var import_node_path = __toESM(require("path"));
var ABSOLUTE_PROTOCOL = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;
function normalizeMethod(value) {
  if (!value) {
    return "GET";
  }
  const normalized = value.toUpperCase();
  switch (normalized) {
    case "GET":
    case "POST":
    case "PUT":
    case "PATCH":
    case "DELETE":
    case "HEAD":
    case "OPTIONS":
    case "ALL":
      return normalized;
    default:
      return "UNKNOWN";
  }
}
function createPathPattern(raw) {
  const trimmed = raw.trim();
  if (ABSOLUTE_PROTOCOL.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pathname2 = url.pathname;
      return {
        raw,
        kind: "path",
        normalized: `${url.origin}${pathname2}`,
        pathname: pathname2,
        origin: url.origin
      };
    } catch {
      return {
        raw,
        kind: "unknown",
        normalized: trimmed,
        pathname: null,
        origin: null
      };
    }
  }
  const pathname = normalizePathname(trimmed);
  return {
    raw,
    kind: "path",
    normalized: pathname,
    pathname,
    origin: null
  };
}
function createRegExpPattern(raw) {
  return {
    raw,
    kind: "regexp",
    normalized: raw,
    pathname: null,
    origin: null
  };
}
function normalizePathname(value) {
  if (value === "*") {
    return value;
  }
  const cleaned = stripSearchAndHash(value.trim()).replace(/\\/g, "/");
  if (cleaned.startsWith("/")) {
    return cleaned;
  }
  if (cleaned.startsWith("./") || cleaned.startsWith("../")) {
    return cleaned;
  }
  return `/${cleaned}`;
}
function stripSearchAndHash(value) {
  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  const stopIndex = [queryIndex, hashIndex].filter((index) => index >= 0).sort((left, right) => left - right)[0];
  if (stopIndex === void 0) {
    return value;
  }
  return value.slice(0, stopIndex);
}
function createRecordId(parts) {
  return parts.join(":");
}
function normalizeLocation(filePath, line, column) {
  return {
    filePath: import_node_path.default.normalize(filePath),
    line,
    column
  };
}

// src/core/scan-api-calls.ts
var AXIOS_HTTP_METHODS = /* @__PURE__ */ new Set(["get", "post", "put", "patch", "delete", "head", "options"]);
var FETCH_ROOTS = /* @__PURE__ */ new Set(["window", "globalThis", "self", "global"]);
async function scanApiCalls(options) {
  const cwd = options.cwd;
  const sourceGlobs = options.sourceGlobs?.length ? options.sourceGlobs : DEFAULT_SOURCE_GLOBS;
  const excludeGlobs = options.excludeGlobs?.length ? options.excludeGlobs : DEFAULT_EXCLUDE_GLOBS;
  const files = await (0, import_fast_glob.default)(sourceGlobs, {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: excludeGlobs
  });
  const project = new import_ts_morph.Project({
    skipAddingFilesFromTsConfig: true
  });
  const sourceFiles = await Promise.all(
    files.map(async (filePath) => {
      const text = await import_promises.default.readFile(filePath, "utf8");
      return project.createSourceFile(filePath, text, { overwrite: true });
    })
  );
  const apiCalls = [];
  const unsupported = [];
  for (const sourceFile of sourceFiles) {
    const bindings = collectImportBindings(sourceFile);
    const context = {
      sourceFile,
      stringCache: /* @__PURE__ */ new Map(),
      objectCache: /* @__PURE__ */ new Map(),
      axiosTargetCache: /* @__PURE__ */ new Map(),
      visiting: /* @__PURE__ */ new Set()
    };
    for (const call of sourceFile.getDescendantsOfKind(import_ts_morph.SyntaxKind.CallExpression)) {
      const meta = identifyApiCall(call, bindings, context);
      if (!meta) {
        continue;
      }
      const resolved = resolveApiCall(call, meta, context);
      if (!resolved) {
        unsupported.push(buildUnsupported(call, `unable to statically resolve ${meta.source} URL`));
        continue;
      }
      const location = getLocation(sourceFile, call);
      const pattern = createPathPattern(stripQueryAndHash(resolved.url));
      apiCalls.push({
        id: createRecordId([location.filePath, String(location.line), String(location.column), meta.source, resolved.method, pattern.normalized]),
        method: resolved.method,
        pattern,
        location,
        source: meta.source
      });
    }
  }
  apiCalls.sort(compareRecords);
  unsupported.sort(compareUnsupported);
  return {
    apiCalls,
    unsupported
  };
}
function collectImportBindings(sourceFile) {
  const axios = /* @__PURE__ */ new Set();
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() !== "axios") {
      continue;
    }
    const defaultImport = declaration.getDefaultImport();
    if (defaultImport) {
      axios.add(defaultImport.getText());
    }
    const namespaceImport = declaration.getNamespaceImport();
    if (namespaceImport) {
      axios.add(namespaceImport.getText());
    }
  }
  for (const statement of sourceFile.getVariableStatements()) {
    for (const declaration of statement.getDeclarations()) {
      const initializer = declaration.getInitializer();
      if (!initializer || !import_ts_morph.Node.isCallExpression(initializer)) {
        continue;
      }
      if (!isRequireCall(initializer, "axios")) {
        continue;
      }
      if (import_ts_morph.Node.isIdentifier(declaration.getNameNode())) {
        axios.add(declaration.getNameNode().getText());
      }
    }
  }
  return { axios };
}
function identifyApiCall(call, bindings, context) {
  const expression = call.getExpression();
  if (import_ts_morph.Node.isIdentifier(expression) && expression.getText() === "fetch" && isGlobalFetchIdentifier(expression)) {
    return {
      kind: "fetch",
      source: "fetch"
    };
  }
  if (import_ts_morph.Node.isPropertyAccessExpression(expression) && expression.getName() === "fetch" && isFetchRoot(expression.getExpression())) {
    return {
      kind: "fetch",
      source: "fetch"
    };
  }
  if (import_ts_morph.Node.isIdentifier(expression)) {
    const target2 = resolveAxiosTarget(expression, bindings, context);
    if (target2) {
      return {
        kind: "axios-call",
        source: "axios",
        target: target2
      };
    }
  }
  if (!import_ts_morph.Node.isPropertyAccessExpression(expression)) {
    return null;
  }
  const target = resolveAxiosTarget(expression.getExpression(), bindings, context);
  if (!target) {
    return null;
  }
  const name = expression.getName();
  if (AXIOS_HTTP_METHODS.has(name)) {
    return {
      kind: "axios-verb",
      source: "axios",
      target,
      method: normalizeMethod(name)
    };
  }
  if (name === "request") {
    return {
      kind: "axios-request",
      source: "axios",
      target
    };
  }
  return null;
}
function resolveApiCall(call, meta, context) {
  if (meta.kind === "fetch") {
    return resolveFetchCall(call, context);
  }
  if (meta.kind === "axios-verb") {
    return resolveAxiosVerbCall(call, meta.target, meta.method, context);
  }
  if (meta.kind === "axios-request") {
    return resolveAxiosConfigCall(call.getArguments()[0], meta.target, context);
  }
  return resolveAxiosDirectCall(call, meta.target, context);
}
function resolveFetchCall(call, context) {
  const [input, initArg] = call.getArguments();
  const url = resolveString(input, context);
  if (!url) {
    return null;
  }
  if (!initArg) {
    return { url, method: "GET" };
  }
  const init = resolveObjectLiteral(initArg, context);
  if (!init) {
    return { url, method: "UNKNOWN" };
  }
  return {
    url,
    method: resolveMethodFromObject(init, context) ?? "GET"
  };
}
function resolveAxiosDirectCall(call, target, context) {
  const [firstArg, secondArg] = call.getArguments();
  const config = resolveObjectLiteral(firstArg, context);
  if (config) {
    return resolveAxiosConfigObject(config, target, context);
  }
  const url = resolveString(firstArg, context);
  if (!url) {
    return null;
  }
  if (!secondArg) {
    return {
      url: joinUrl(target.baseUrl, url),
      method: "GET"
    };
  }
  const secondConfig = resolveObjectLiteral(secondArg, context);
  if (!secondConfig) {
    return {
      url: joinUrl(target.baseUrl, url),
      method: "UNKNOWN"
    };
  }
  return {
    url: joinUrl(resolveBaseUrlFromObject(secondConfig, context) ?? target.baseUrl, url),
    method: resolveMethodFromObject(secondConfig, context) ?? "GET"
  };
}
function resolveAxiosVerbCall(call, target, method, context) {
  const [input, , configArg] = call.getArguments();
  const url = resolveString(input, context);
  if (!url) {
    return null;
  }
  const secondArg = call.getArguments()[1];
  const configNode = method === "POST" || method === "PUT" || method === "PATCH" ? configArg : secondArg;
  const config = configNode ? resolveObjectLiteral(configNode, context) : null;
  return {
    url: joinUrl(config ? resolveBaseUrlFromObject(config, context) ?? target.baseUrl : target.baseUrl, url),
    method
  };
}
function resolveAxiosConfigCall(arg, target, context) {
  if (!arg) {
    return null;
  }
  const config = resolveObjectLiteral(arg, context);
  if (!config) {
    return null;
  }
  return resolveAxiosConfigObject(config, target, context);
}
function resolveAxiosConfigObject(config, target, context) {
  const url = resolveUrlFromObject(config, context);
  if (!url) {
    return null;
  }
  return {
    url: joinUrl(resolveBaseUrlFromObject(config, context) ?? target.baseUrl, url),
    method: resolveMethodFromObject(config, context) ?? "GET"
  };
}
function resolveMethodFromObject(node, context) {
  const value = getPropertyValue(node, "method");
  if (!value) {
    return null;
  }
  const resolved = resolveString(value, context);
  return resolved ? normalizeMethod(resolved) : "UNKNOWN";
}
function resolveUrlFromObject(node, context) {
  const value = getPropertyValue(node, "url");
  return value ? resolveString(value, context) : null;
}
function resolveBaseUrlFromObject(node, context) {
  const value = getPropertyValue(node, "baseURL");
  return value ? resolveString(value, context) : null;
}
function getPropertyValue(node, name) {
  const property = node.getProperty(name);
  if (!property || !import_ts_morph.Node.isPropertyAssignment(property)) {
    return void 0;
  }
  return property.getInitializer();
}
function resolveAxiosTarget(node, bindings, context) {
  if (import_ts_morph.Node.isParenthesizedExpression(node) || import_ts_morph.Node.isAsExpression(node) || import_ts_morph.Node.isNonNullExpression(node)) {
    return resolveAxiosTarget(node.getExpression(), bindings, context);
  }
  if (!import_ts_morph.Node.isIdentifier(node)) {
    if (import_ts_morph.Node.isCallExpression(node)) {
      const expression2 = node.getExpression();
      if (import_ts_morph.Node.isPropertyAccessExpression(expression2) && expression2.getName() === "create") {
        const parentTarget2 = resolveAxiosTarget(expression2.getExpression(), bindings, context);
        if (!parentTarget2) {
          return null;
        }
        const config2 = resolveObjectLiteral(node.getArguments()[0], context);
        return {
          baseUrl: config2 ? resolveBaseUrlFromObject(config2, context) ?? parentTarget2.baseUrl : parentTarget2.baseUrl
        };
      }
    }
    return null;
  }
  const cacheKey = getIdentifierCacheKey(node);
  if (context.axiosTargetCache.has(cacheKey)) {
    return context.axiosTargetCache.get(cacheKey) ?? null;
  }
  if (isAxiosBindingIdentifier(node, bindings)) {
    const root = { baseUrl: null };
    context.axiosTargetCache.set(cacheKey, root);
    return root;
  }
  if (context.visiting.has(cacheKey)) {
    return null;
  }
  const declaration = resolveConstDeclaration(node);
  const initializer = declaration?.getInitializer();
  if (!initializer) {
    context.axiosTargetCache.set(cacheKey, null);
    return null;
  }
  if (import_ts_morph.Node.isIdentifier(initializer)) {
    context.visiting.add(cacheKey);
    const aliasTarget = resolveAxiosTarget(initializer, bindings, context);
    context.visiting.delete(cacheKey);
    context.axiosTargetCache.set(cacheKey, aliasTarget);
    return aliasTarget;
  }
  if (!import_ts_morph.Node.isCallExpression(initializer)) {
    context.axiosTargetCache.set(cacheKey, null);
    return null;
  }
  const expression = initializer.getExpression();
  if (!import_ts_morph.Node.isPropertyAccessExpression(expression) || expression.getName() !== "create") {
    context.axiosTargetCache.set(cacheKey, null);
    return null;
  }
  context.visiting.add(cacheKey);
  const parentTarget = resolveAxiosTarget(expression.getExpression(), bindings, context);
  context.visiting.delete(cacheKey);
  if (!parentTarget) {
    context.axiosTargetCache.set(cacheKey, null);
    return null;
  }
  const config = resolveObjectLiteral(initializer.getArguments()[0], context);
  const resolved = {
    baseUrl: config ? resolveBaseUrlFromObject(config, context) ?? parentTarget.baseUrl : parentTarget.baseUrl
  };
  context.axiosTargetCache.set(cacheKey, resolved);
  return resolved;
}
function resolveObjectLiteral(node, context) {
  if (!node) {
    return null;
  }
  if (import_ts_morph.Node.isParenthesizedExpression(node) || import_ts_morph.Node.isAsExpression(node) || import_ts_morph.Node.isNonNullExpression(node)) {
    return resolveObjectLiteral(node.getExpression(), context);
  }
  if (import_ts_morph.Node.isObjectLiteralExpression(node)) {
    return node;
  }
  if (!import_ts_morph.Node.isIdentifier(node)) {
    return null;
  }
  const cacheKey = getIdentifierCacheKey(node);
  if (context.objectCache.has(cacheKey)) {
    return context.objectCache.get(cacheKey) ?? null;
  }
  if (context.visiting.has(cacheKey)) {
    return null;
  }
  const declaration = resolveConstDeclaration(node);
  const initializer = declaration?.getInitializer();
  if (!initializer) {
    context.objectCache.set(cacheKey, null);
    return null;
  }
  context.visiting.add(cacheKey);
  const resolved = resolveObjectLiteral(initializer, context);
  context.visiting.delete(cacheKey);
  context.objectCache.set(cacheKey, resolved);
  return resolved;
}
function resolveString(node, context) {
  if (!node) {
    return null;
  }
  if (import_ts_morph.Node.isParenthesizedExpression(node) || import_ts_morph.Node.isAsExpression(node) || import_ts_morph.Node.isNonNullExpression(node)) {
    return resolveString(node.getExpression(), context);
  }
  if (import_ts_morph.Node.isStringLiteral(node) || import_ts_morph.Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralText();
  }
  if (import_ts_morph.Node.isTemplateExpression(node)) {
    let result = node.getHead().getLiteralText();
    for (const span of node.getTemplateSpans()) {
      const value = resolveString(span.getExpression(), context);
      if (value === null) {
        return null;
      }
      result += value + span.getLiteral().getLiteralText();
    }
    return result;
  }
  if (import_ts_morph.Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === import_ts_morph.SyntaxKind.PlusToken) {
    const left = resolveString(node.getLeft(), context);
    const right = resolveString(node.getRight(), context);
    if (left === null || right === null) {
      return null;
    }
    return left + right;
  }
  const urlValue = resolveUrlExpression(node, context);
  if (urlValue !== null) {
    return urlValue;
  }
  if (import_ts_morph.Node.isCallExpression(node) && isStringConstructor(node)) {
    return resolveString(node.getArguments()[0], context);
  }
  if (!import_ts_morph.Node.isIdentifier(node)) {
    return null;
  }
  const cacheKey = getIdentifierCacheKey(node);
  if (context.stringCache.has(cacheKey)) {
    return context.stringCache.get(cacheKey) ?? null;
  }
  if (context.visiting.has(cacheKey)) {
    return null;
  }
  const declaration = resolveConstDeclaration(node);
  const initializer = declaration?.getInitializer();
  if (!initializer) {
    context.stringCache.set(cacheKey, null);
    return null;
  }
  context.visiting.add(cacheKey);
  const resolved = resolveString(initializer, context);
  context.visiting.delete(cacheKey);
  context.stringCache.set(cacheKey, resolved);
  return resolved;
}
function resolveUrlExpression(node, context) {
  if (import_ts_morph.Node.isParenthesizedExpression(node) || import_ts_morph.Node.isAsExpression(node) || import_ts_morph.Node.isNonNullExpression(node)) {
    return resolveUrlExpression(node.getExpression(), context);
  }
  if (import_ts_morph.Node.isPropertyAccessExpression(node) && node.getName() === "href") {
    return resolveUrlExpression(node.getExpression(), context);
  }
  if (import_ts_morph.Node.isCallExpression(node) && isToStringCall(node)) {
    const expression = node.getExpression();
    if (import_ts_morph.Node.isPropertyAccessExpression(expression)) {
      return resolveUrlExpression(expression.getExpression(), context);
    }
    return null;
  }
  if (import_ts_morph.Node.isNewExpression(node) && isIdentifierName(node.getExpression(), "URL")) {
    const [pathArg, baseArg] = node.getArguments();
    const path3 = resolveString(pathArg, context);
    if (!path3) {
      return null;
    }
    const base = baseArg ? resolveString(baseArg, context) : null;
    try {
      return base ? new URL(path3, base).toString() : new URL(path3).toString();
    } catch {
      return null;
    }
  }
  if (import_ts_morph.Node.isCallExpression(node) && isStringConstructor(node)) {
    return resolveUrlExpression(node.getArguments()[0], context);
  }
  if (!import_ts_morph.Node.isIdentifier(node)) {
    return null;
  }
  if (context.visiting.has(getIdentifierCacheKey(node))) {
    return null;
  }
  const declaration = resolveConstDeclaration(node);
  const initializer = declaration?.getInitializer();
  if (!initializer) {
    return null;
  }
  return resolveUrlExpression(initializer, context);
}
function resolveConstDeclaration(identifier) {
  const symbol = identifier.getSymbol();
  if (!symbol) {
    return null;
  }
  for (const declaration of symbol.getDeclarations()) {
    if (!import_ts_morph.Node.isVariableDeclaration(declaration)) {
      continue;
    }
    const statement = declaration.getVariableStatement();
    if (!statement || statement.getDeclarationKind() !== import_ts_morph.VariableDeclarationKind.Const) {
      continue;
    }
    if (declaration.getSourceFile().getFilePath() !== identifier.getSourceFile().getFilePath()) {
      continue;
    }
    return declaration;
  }
  return null;
}
function isGlobalFetchIdentifier(identifier) {
  const symbol = identifier.getSymbol();
  if (!symbol) {
    return true;
  }
  return !symbol.getDeclarations().some((declaration) => declaration.getSourceFile().getFilePath() === identifier.getSourceFile().getFilePath());
}
function isAxiosBindingIdentifier(identifier, bindings) {
  if (!bindings.axios.has(identifier.getText())) {
    return false;
  }
  const symbol = identifier.getSymbol();
  if (!symbol) {
    return false;
  }
  return symbol.getDeclarations().some((declaration) => {
    if (declaration.getSourceFile().getFilePath() !== identifier.getSourceFile().getFilePath()) {
      return false;
    }
    if (import_ts_morph.Node.isImportClause(declaration) || import_ts_morph.Node.isNamespaceImport(declaration)) {
      return true;
    }
    if (!import_ts_morph.Node.isVariableDeclaration(declaration)) {
      return false;
    }
    const initializer = declaration.getInitializer();
    return Boolean(initializer && import_ts_morph.Node.isCallExpression(initializer) && isRequireCall(initializer, "axios"));
  });
}
function isFetchRoot(node) {
  if (import_ts_morph.Node.isIdentifier(node)) {
    return FETCH_ROOTS.has(node.getText());
  }
  if (import_ts_morph.Node.isPropertyAccessExpression(node)) {
    return isFetchRoot(node.getExpression());
  }
  return false;
}
function joinUrl(baseUrl, value) {
  if (!baseUrl || isAbsoluteUrl(value)) {
    return value;
  }
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}
function isAbsoluteUrl(value) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value);
}
function stripQueryAndHash(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  try {
    if (isAbsoluteUrl(trimmed)) {
      const url = new URL(trimmed);
      url.search = "";
      url.hash = "";
      return url.toString();
    }
  } catch {
  }
  return trimmed.replace(/[?#].*$/, "");
}
function isIdentifierName(node, name) {
  return import_ts_morph.Node.isIdentifier(node) && node.getText() === name;
}
function isRequireCall(node, moduleName) {
  const expression = node.getExpression();
  const [arg] = node.getArguments();
  return isIdentifierName(expression, "require") && import_ts_morph.Node.isStringLiteral(arg) && arg.getLiteralText() === moduleName;
}
function isStringConstructor(node) {
  return isIdentifierName(node.getExpression(), "String") && node.getArguments().length === 1;
}
function isToStringCall(node) {
  const expression = node.getExpression();
  return import_ts_morph.Node.isPropertyAccessExpression(expression) && expression.getName() === "toString" && node.getArguments().length === 0;
}
function getIdentifierCacheKey(identifier) {
  return `${identifier.getSourceFile().getFilePath()}:${identifier.getText()}:${identifier.getStart()}`;
}
function buildUnsupported(call, reason) {
  const sourceFile = call.getSourceFile();
  const location = getLocation(sourceFile, call);
  return {
    kind: "api-call",
    reason,
    location,
    expressionText: call.getText()
  };
}
function getLocation(sourceFile, node) {
  const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());
  return normalizeLocation(sourceFile.getFilePath(), line, column);
}
function compareRecords(left, right) {
  return compareLocation(left.location, right.location) || left.id.localeCompare(right.id);
}
function compareUnsupported(left, right) {
  return compareLocation(left.location, right.location) || left.expressionText.localeCompare(right.expressionText);
}
function compareLocation(left, right) {
  return left.filePath.localeCompare(right.filePath) || left.line - right.line || left.column - right.column;
}

// src/core/scan-handlers.ts
var import_promises2 = __toESM(require("fs/promises"));
var import_fast_glob2 = __toESM(require("fast-glob"));
var import_ts_morph2 = require("ts-morph");
var HANDLER_VERBS = /* @__PURE__ */ new Set(["all", "get", "post", "put", "patch", "delete", "head", "options"]);
async function scanHandlers(options) {
  const cwd = options.cwd;
  const handlerGlobs = options.handlerGlobs?.length ? options.handlerGlobs : DEFAULT_HANDLER_GLOBS;
  const excludeGlobs = options.excludeGlobs?.length ? options.excludeGlobs : DEFAULT_EXCLUDE_GLOBS;
  const files = await (0, import_fast_glob2.default)(handlerGlobs, {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: excludeGlobs
  });
  const project = new import_ts_morph2.Project({
    skipAddingFilesFromTsConfig: true
  });
  const sourceFiles = await Promise.all(
    files.map(async (filePath) => {
      const text = await import_promises2.default.readFile(filePath, "utf8");
      return project.createSourceFile(filePath, text, { overwrite: true });
    })
  );
  const handlers = [];
  const unsupported = [];
  for (const sourceFile of sourceFiles) {
    const bindings = collectImportBindings2(sourceFile);
    const context = {
      sourceFile,
      filePath: sourceFile.getFilePath(),
      constCache: /* @__PURE__ */ new Map(),
      visiting: /* @__PURE__ */ new Set()
    };
    for (const call of sourceFile.getDescendantsOfKind(import_ts_morph2.SyntaxKind.CallExpression)) {
      const handlerMeta = identifyHandlerCall(call, bindings);
      if (!handlerMeta) {
        continue;
      }
      const arg = call.getArguments()[0];
      if (!arg) {
        unsupported.push(buildUnsupported2(call, "handler", "handler call is missing a matcher argument"));
        continue;
      }
      const resolved = resolveHandlerMatcher(arg, context);
      if (!resolved) {
        unsupported.push(buildUnsupported2(call, "handler", describeUnsupportedMatcher(arg, context)));
        continue;
      }
      const location = getLocation2(sourceFile, call);
      handlers.push({
        id: createRecordId([location.filePath, String(location.line), String(location.column), handlerMeta.source, handlerMeta.method, resolved.normalized]),
        method: handlerMeta.method,
        pattern: resolved,
        location,
        source: handlerMeta.source
      });
    }
  }
  handlers.sort(compareRecords2);
  unsupported.sort(compareUnsupported2);
  return {
    handlers,
    unsupported
  };
}
function collectImportBindings2(sourceFile) {
  const direct = /* @__PURE__ */ new Map();
  const namespaces = /* @__PURE__ */ new Set();
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() !== "msw") {
      continue;
    }
    for (const namedImport of declaration.getNamedImports()) {
      const imported = namedImport.getName();
      const local = namedImport.getAliasNode()?.getText() ?? imported;
      if (imported === "http" || imported === "rest") {
        direct.set(local, imported);
      }
    }
    const namespaceImport = declaration.getNamespaceImport();
    if (namespaceImport) {
      namespaces.add(namespaceImport.getText());
    }
  }
  return { direct, namespaces };
}
function identifyHandlerCall(call, bindings) {
  const expression = call.getExpression();
  if (!import_ts_morph2.Node.isPropertyAccessExpression(expression)) {
    return null;
  }
  const verb = expression.getName();
  if (!HANDLER_VERBS.has(verb)) {
    return null;
  }
  const root = expression.getExpression();
  if (import_ts_morph2.Node.isIdentifier(root)) {
    const api = bindings.direct.get(root.getText());
    if (!api) {
      return null;
    }
    return {
      method: normalizeMethod(verb),
      source: api === "http" ? "msw-http" : "msw-rest"
    };
  }
  if (import_ts_morph2.Node.isPropertyAccessExpression(root)) {
    const namespace = root.getExpression();
    if (!import_ts_morph2.Node.isIdentifier(namespace) || !bindings.namespaces.has(namespace.getText())) {
      return null;
    }
    const api = root.getName();
    if (api !== "http" && api !== "rest") {
      return null;
    }
    return {
      method: normalizeMethod(verb),
      source: api === "http" ? "msw-http" : "msw-rest"
    };
  }
  return null;
}
function resolveHandlerMatcher(node, context) {
  const regexp = resolveStaticRegExp(node, context);
  if (regexp) {
    return createRegExpPattern(regexp);
  }
  const value = resolveStaticString(node, context);
  if (value === null) {
    return null;
  }
  return createPathPattern(stripQueryAndHash2(value));
}
function resolveStaticString(node, context) {
  if (import_ts_morph2.Node.isParenthesizedExpression(node) || import_ts_morph2.Node.isAsExpression(node) || import_ts_morph2.Node.isNonNullExpression(node)) {
    return resolveStaticString(node.getExpression(), context);
  }
  if (import_ts_morph2.Node.isStringLiteral(node) || import_ts_morph2.Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralText();
  }
  if (import_ts_morph2.Node.isTemplateExpression(node)) {
    let result = node.getHead().getLiteralText();
    for (const span of node.getTemplateSpans()) {
      const value = resolveStaticString(span.getExpression(), context);
      if (value === null) {
        return null;
      }
      result += value + span.getLiteral().getLiteralText();
    }
    return result;
  }
  if (import_ts_morph2.Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === import_ts_morph2.SyntaxKind.PlusToken) {
    const left = resolveStaticString(node.getLeft(), context);
    const right = resolveStaticString(node.getRight(), context);
    if (left === null || right === null) {
      return null;
    }
    return left + right;
  }
  const urlValue = resolveUrlLikeString(node, context);
  if (urlValue !== null) {
    return urlValue;
  }
  if (import_ts_morph2.Node.isIdentifier(node)) {
    const cacheKey = getIdentifierCacheKey2(node);
    if (context.constCache.has(cacheKey)) {
      return context.constCache.get(cacheKey) ?? null;
    }
    const declaration = resolveConstDeclaration2(node);
    if (!declaration) {
      context.constCache.set(cacheKey, null);
      return null;
    }
    if (context.visiting.has(cacheKey)) {
      return null;
    }
    const initializer = declaration.getInitializer();
    if (!initializer) {
      context.constCache.set(cacheKey, null);
      return null;
    }
    context.visiting.add(cacheKey);
    const resolved = resolveStaticString(initializer, context);
    context.visiting.delete(cacheKey);
    context.constCache.set(cacheKey, resolved);
    return resolved;
  }
  if (import_ts_morph2.Node.isCallExpression(node)) {
    if (isStringConstructor2(node)) {
      const [arg] = node.getArguments();
      if (!arg) {
        return null;
      }
      return resolveStaticString(arg, context);
    }
    if (isToStringCall2(node)) {
      const expression = node.getExpression().asKind(import_ts_morph2.SyntaxKind.PropertyAccessExpression);
      if (expression) {
        return resolveUrlLikeString(expression.getExpression(), context);
      }
      return null;
    }
  }
  return null;
}
function resolveStaticRegExp(node, context) {
  if (import_ts_morph2.Node.isParenthesizedExpression(node) || import_ts_morph2.Node.isAsExpression(node) || import_ts_morph2.Node.isNonNullExpression(node)) {
    return resolveStaticRegExp(node.getExpression(), context);
  }
  if (import_ts_morph2.Node.isRegularExpressionLiteral(node)) {
    return node.getText();
  }
  if (import_ts_morph2.Node.isNewExpression(node) && isIdentifierName2(node.getExpression(), "RegExp")) {
    const [patternArg, flagsArg] = node.getArguments();
    const pattern = patternArg ? resolveStaticString(patternArg, context) : null;
    const flags = flagsArg ? resolveStaticString(flagsArg, context) : "";
    if (pattern === null) {
      return null;
    }
    return `/${escapeRegExpLiteral(pattern)}/${flags ?? ""}`;
  }
  if (import_ts_morph2.Node.isIdentifier(node)) {
    const cacheKey = getIdentifierCacheKey2(node);
    if (context.constCache.has(cacheKey)) {
      return context.constCache.get(cacheKey) ?? null;
    }
    const declaration = resolveConstDeclaration2(node);
    if (!declaration || !declaration.getInitializer()) {
      context.constCache.set(cacheKey, null);
      return null;
    }
    if (context.visiting.has(cacheKey)) {
      return null;
    }
    context.visiting.add(cacheKey);
    const resolved = resolveStaticRegExp(declaration.getInitializerOrThrow(), context);
    context.visiting.delete(cacheKey);
    if (resolved !== null) {
      context.constCache.set(cacheKey, resolved);
    }
    return resolved;
  }
  return null;
}
function resolveUrlLikeString(node, context) {
  if (import_ts_morph2.Node.isPropertyAccessExpression(node) && node.getName() === "href") {
    const expression = node.getExpression().asKind(import_ts_morph2.SyntaxKind.PropertyAccessExpression);
    if (expression) {
      return resolveUrlExpression2(expression.getExpression(), context);
    }
    return null;
  }
  if (import_ts_morph2.Node.isCallExpression(node) && isToStringCall2(node)) {
    const expression = node.getExpression().asKind(import_ts_morph2.SyntaxKind.PropertyAccessExpression);
    if (expression) {
      return resolveUrlExpression2(expression.getExpression(), context);
    }
    return null;
  }
  if (import_ts_morph2.Node.isCallExpression(node) && isStringConstructor2(node)) {
    const [arg] = node.getArguments();
    if (!arg) {
      return null;
    }
    return resolveUrlExpression2(arg, context) ?? resolveStaticString(arg, context);
  }
  return null;
}
function resolveUrlExpression2(node, context) {
  if (import_ts_morph2.Node.isParenthesizedExpression(node) || import_ts_morph2.Node.isAsExpression(node) || import_ts_morph2.Node.isNonNullExpression(node)) {
    return resolveUrlExpression2(node.getExpression(), context);
  }
  if (import_ts_morph2.Node.isNewExpression(node) && isIdentifierName2(node.getExpression(), "URL")) {
    const [pathArg, baseArg] = node.getArguments();
    const path3 = pathArg ? resolveStaticString(pathArg, context) : null;
    const base = baseArg ? resolveStaticString(baseArg, context) : null;
    if (path3 === null || base === null) {
      return null;
    }
    try {
      return new URL(path3, base).toString();
    } catch {
      return null;
    }
  }
  if (import_ts_morph2.Node.isIdentifier(node)) {
    const cacheKey = getIdentifierCacheKey2(node);
    if (context.constCache.has(cacheKey)) {
      return context.constCache.get(cacheKey) ?? null;
    }
    const declaration = resolveConstDeclaration2(node);
    if (!declaration) {
      context.constCache.set(cacheKey, null);
      return null;
    }
    if (context.visiting.has(cacheKey)) {
      return null;
    }
    const initializer = declaration.getInitializer();
    if (!initializer) {
      context.constCache.set(cacheKey, null);
      return null;
    }
    context.visiting.add(cacheKey);
    const resolved = resolveUrlExpression2(initializer, context);
    context.visiting.delete(cacheKey);
    context.constCache.set(cacheKey, resolved);
    return resolved;
  }
  return resolveStaticString(node, context);
}
function resolveConstDeclaration2(identifier) {
  const sourceFile = identifier.getSourceFile();
  const name = identifier.getText();
  for (const statement of sourceFile.getVariableStatements()) {
    if (statement.getDeclarationKind() !== import_ts_morph2.VariableDeclarationKind.Const) {
      continue;
    }
    for (const declaration of statement.getDeclarations()) {
      if (declaration.getName() === name) {
        return declaration;
      }
    }
  }
  return null;
}
function getIdentifierCacheKey2(identifier) {
  return `${identifier.getSourceFile().getFilePath()}:${identifier.getText()}:${identifier.getStart()}`;
}
function isIdentifierName2(node, name) {
  return import_ts_morph2.Node.isIdentifier(node) && node.getText() === name;
}
function isStringConstructor2(node) {
  return isIdentifierName2(node.getExpression(), "String") && node.getArguments().length === 1;
}
function isToStringCall2(node) {
  const expression = node.getExpression();
  return import_ts_morph2.Node.isPropertyAccessExpression(expression) && expression.getName() === "toString" && node.getArguments().length === 0;
}
function stripQueryAndHash2(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  try {
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
      const url = new URL(trimmed);
      url.search = "";
      url.hash = "";
      return url.toString();
    }
  } catch {
  }
  return trimmed.replace(/[?#].*$/, "");
}
function escapeRegExpLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function describeUnsupportedMatcher(node, context) {
  if (import_ts_morph2.Node.isNewExpression(node) && isIdentifierName2(node.getExpression(), "URL")) {
    return "bare new URL() is not supported; use .href or .toString()";
  }
  if (import_ts_morph2.Node.isIdentifier(node)) {
    const declaration = resolveConstDeclaration2(node);
    if (declaration?.getInitializer() && !resolveStaticString(declaration.getInitializerOrThrow(), context)) {
      return `unable to statically resolve const ${node.getText()}`;
    }
  }
  return "unable to statically resolve handler matcher";
}
function buildUnsupported2(call, kind, reason) {
  const sourceFile = call.getSourceFile();
  const location = getLocation2(sourceFile, call);
  return {
    kind,
    reason,
    location,
    expressionText: call.getText()
  };
}
function getLocation2(sourceFile, node) {
  const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());
  return normalizeLocation(sourceFile.getFilePath(), line, column);
}
function compareRecords2(left, right) {
  return compareLocation2(left.location, right.location) || left.id.localeCompare(right.id);
}
function compareUnsupported2(left, right) {
  return compareLocation2(left.location, right.location) || left.expressionText.localeCompare(right.expressionText);
}
function compareLocation2(left, right) {
  return left.filePath.localeCompare(right.filePath) || left.line - right.line || left.column - right.column;
}

// src/core/analyze.ts
async function analyzeProject(options) {
  const [handlerResult, apiCallResult] = await Promise.all([
    scanHandlers(options),
    scanApiCalls(options)
  ]);
  return buildCoverageReport({
    handlers: handlerResult.handlers,
    apiCalls: apiCallResult.apiCalls,
    unsupported: [...handlerResult.unsupported, ...apiCallResult.unsupported]
  });
}

// src/core/format.ts
var import_picocolors = __toESM(require("picocolors"));
function formatCoverageReport(report) {
  const lines = [
    `${import_picocolors.default.green("\u2713")} ${report.handlers.length} handlers found`,
    `${import_picocolors.default.green("\u2713")} ${report.apiCalls.length} API calls found`,
    `${report.summary.unmockedCalls > 0 ? import_picocolors.default.red("\u2717") : import_picocolors.default.green("\u2713")} ${report.summary.unmockedCalls} unmocked endpoints`,
    `${report.summary.staleHandlers > 0 ? import_picocolors.default.red("\u2717") : import_picocolors.default.green("\u2713")} ${report.summary.staleHandlers} stale mocks`,
    "",
    `Coverage: ${report.summary.percentage}% (${report.summary.mockedCalls}/${report.summary.totalCalls})`
  ];
  if (report.unsupported.length > 0) {
    lines.push("", `${import_picocolors.default.yellow("!")} ${report.unsupported.length} unsupported patterns skipped`);
  }
  return lines.join("\n");
}

// src/cli.ts
var program = new import_commander.Command();
program.name("msw-inspector").description("Find gaps between your MSW handlers and your actual API usage.").option("--handlers <globs...>", "Override handler file globs.", DEFAULT_HANDLER_GLOBS).option("--sources <globs...>", "Override source file globs.", DEFAULT_SOURCE_GLOBS).option("--exclude <globs...>", "Exclude file globs.", DEFAULT_EXCLUDE_GLOBS).option("--format <format>", "Output format: text or json.", "text").option("--report-file <path>", "Write the JSON report to a file.").option("--min-coverage <percentage>", "Fail if API mock coverage drops below this percentage.").option("--fail-on-unmocked", "Fail if any API call is unmocked.").option("--fail-on-stale", "Fail if any stale handler is found.").option("--cwd <cwd>", "Working directory to inspect.", process.cwd()).action(async (options) => {
  const report = await analyzeProject({
    cwd: options.cwd,
    handlerGlobs: options.handlers,
    sourceGlobs: options.sources,
    excludeGlobs: options.exclude
  });
  const json = JSON.stringify(report, null, 2);
  if (options.reportFile) {
    const outputPath = import_node_path2.default.resolve(options.cwd, options.reportFile);
    await (0, import_promises3.mkdir)(import_node_path2.default.dirname(outputPath), { recursive: true });
    await (0, import_promises3.writeFile)(outputPath, `${json}
`, "utf8");
  }
  if (options.format === "json") {
    process.stdout.write(`${json}
`);
  } else {
    process.stdout.write(`${formatCoverageReport(report)}
`);
  }
  const minCoverage = options.minCoverage ? Number(options.minCoverage) : null;
  const shouldFail = typeof minCoverage === "number" && Number.isFinite(minCoverage) && report.summary.percentage < minCoverage || options.failOnUnmocked && report.summary.unmockedCalls > 0 || options.failOnStale && report.summary.staleHandlers > 0;
  if (shouldFail) {
    process.exitCode = 1;
  }
});
program.parseAsync().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
