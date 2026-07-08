/** @type {import('msw-inspector-cli').MswInspectorConfig} */
module.exports = {
  handlers: ['src/mocks/**/*.{ts,tsx,js,jsx}'],
  sources: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
  baseUrl: 'http://localhost:3000',
}
