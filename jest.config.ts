import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// A base config with shared settings
const sharedConfig: Config = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
};

// The main export is an async function that returns the config
const config = async (): Promise<Config> => {
  const frontendConfig = await createJestConfig({
    ...sharedConfig,
    displayName: 'Frontend',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testMatch: ['<rootDir>/__tests__/**/*.test.tsx'],
    // --- THIS IS THE CHANGE ---
    // Keep the rule to ignore the API folder AND add the new rule for integration tests
    testPathIgnorePatterns: [
      '<rootDir>/__tests__/api/',
      '.*\\.integration\\.test\\.(ts|tsx)$',
    ],
  })();

  const backendConfig = await createJestConfig({
    ...sharedConfig,
    displayName: 'Backend',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
    // --- THIS IS THE CHANGE ---
    // Add the new rule for integration tests
    testPathIgnorePatterns: ['.*\\.integration\\.test\\.(ts|tsx)$'],
  })();

  return {
    projects: [frontendConfig, backendConfig],
  };
};

export default config;