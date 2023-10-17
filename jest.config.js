const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: '.',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  moduleFileExtensions: [
    'js'
  ],
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@api/(.*)$': '<rootDir>/src/pages/api/$1',
    '^@root/(.*)$': '<rootDir>/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@util/(.*)$': '<rootDir>/src/util/$1',
    '^@helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^routes$': '<rootDir>/src/routes',
  },

  // For apps, test files must specify the environment explicitly in a file
  // comment, eg. @jest-environment node
  testEnvironment: 'jest-environment-jsdom',

  // TODO The apps directory uses a different babel configuration for
  // build/watch/dev, but for unit tests, the default configuration provided by
  // Next.js is used. If the configurations change, this `transform` section may
  // need to be used.

  // transform: {
  //   'apps/.*\\.[jt]sx?$': ['babel-jest', { configFile: './babel.server.js' }],
  // },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
