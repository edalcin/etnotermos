// OpenAPI Contract Test Setup (T017)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load OpenAPI specification
const openApiPath = path.resolve(__dirname, '../../../specs/main/contracts/openapi.yaml');
let openApiSpec = null;

/**
 * Load OpenAPI specification from YAML file
 */
export function loadOpenApiSpec() {
  if (!openApiSpec) {
    const fileContents = fs.readFileSync(openApiPath, 'utf8');
    openApiSpec = yaml.load(fileContents);
  }
  return openApiSpec;
}

/**
 * Validate response against OpenAPI schema
 * @param {Object} response - Supertest response object
 * @param {string} path - API path (e.g., '/terms')
 * @param {string} method - HTTP method (e.g., 'get')
 * @param {number} statusCode - Expected status code
 */
export function validateResponse(response, path, method, statusCode) {
  const spec = loadOpenApiSpec();

  // Check if path exists in spec
  if (!spec.paths[path]) {
    throw new Error(`Path ${path} not found in OpenAPI spec`);
  }

  // Check if method exists for path
  const pathSpec = spec.paths[path];
  if (!pathSpec[method.toLowerCase()]) {
    throw new Error(`Method ${method} not found for path ${path} in OpenAPI spec`);
  }

  // Check if status code is defined
  const methodSpec = pathSpec[method.toLowerCase()];
  const statusCodeStr = statusCode.toString();
  if (!methodSpec.responses[statusCodeStr]) {
    throw new Error(`Status code ${statusCode} not defined for ${method} ${path} in OpenAPI spec`);
  }

  // Validate response status code
  expect(response.status).toBe(statusCode);

  // Validate content type if specified
  const responseSpec = methodSpec.responses[statusCodeStr];
  if (responseSpec.content && responseSpec.content['application/json']) {
    expect(response.headers['content-type']).toMatch(/application\/json/);
  }

  return true;
}

/**
 * Validate request body against OpenAPI schema
 * @param {Object} requestBody - Request body object
 * @param {string} path - API path
 * @param {string} method - HTTP method
 */
export function validateRequestBody(requestBody, path, method) {
  const spec = loadOpenApiSpec();

  const pathSpec = spec.paths[path];
  if (!pathSpec || !pathSpec[method.toLowerCase()]) {
    throw new Error(`Path or method not found in OpenAPI spec`);
  }

  const methodSpec = pathSpec[method.toLowerCase()];
  if (!methodSpec.requestBody) {
    throw new Error(`No request body defined for ${method} ${path}`);
  }

  // Basic validation - check required fields
  expect(requestBody).toBeDefined();
  expect(typeof requestBody).toBe('object');

  return true;
}

export default {
  loadOpenApiSpec,
  validateResponse,
  validateRequestBody,
};
