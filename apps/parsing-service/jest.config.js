module.exports = {
  displayName: 'parsing-service',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/parsing-service',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
  ],
  moduleNameMapper: {
    '^@ecom-trader/shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
  },
};