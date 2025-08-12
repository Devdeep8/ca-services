const { createDefaultPreset } = require("ts-jest");
const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // ==> ADD THIS SECTION <==
  // This tells Jest to ignore specific paths when looking for tests.
  testPathIgnorePatterns: [
    "/node_modules/", // Default pattern to ignore dependencies
    "\\.next/",      // Default pattern to ignore Next.js build folder
    // This is your new rule:
    ".*\\.integration\\.test\\.ts$", // Ignores any file ending with .integration.test.ts
  ],
};