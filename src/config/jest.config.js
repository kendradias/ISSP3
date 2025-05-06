// jest.config.js
module.exports = {
    testEnvironment: 'node',
    collectCoverage: true,
    coveragePathIgnorePatterns: ['/node_modules/'],
    setupFiles: ['./jest.setup.js']
  };