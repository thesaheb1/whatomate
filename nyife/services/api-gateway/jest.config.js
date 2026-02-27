module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  moduleNameMapper: {
    '^../../../../shared/(.*)$': '<rootDir>/../../shared/$1',
    '^../../../shared/(.*)$': '<rootDir>/../../shared/$1',
  },
};
