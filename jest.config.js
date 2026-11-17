module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  testTimeout: 15000,
  maxWorkers: '50%',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/test/style-stub.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|standard-navigation|nativewind|react-native-css-interop))',
  ],
  collectCoverageFrom: [
    'src/shared/**/*.{ts,tsx}',
    'src/features/**/model/**/*.ts',
    '!src/**/index.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
  coverageReporters: ['text-summary', 'json-summary'],
};
