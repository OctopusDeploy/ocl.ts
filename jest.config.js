/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only *.tests.ts are suites. Jest's default pattern treats every .ts file
  // under __tests__ as a suite, which breaks on shared helper files.
  testMatch: ['**/__tests__/**/*.tests.ts'],
};
