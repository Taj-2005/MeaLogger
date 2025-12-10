module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/', '/src/scripts/'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js', '!src/scripts/**'],
  coverageThreshold: {
    global: {
      branches: 50, // Lowered for MVP
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testTimeout: 30000, // Increase timeout for database operations
  maxWorkers: 1, // Run tests sequentially to avoid database conflicts
};

