export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/contexts/*/server.js',
    '!src/start.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { lines: 80, functions: 70 },
  },
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  transform: {},
};
