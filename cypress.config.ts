import { defineConfig } from "cypress";
import { existsSync } from "node:fs";
import type { Plugin } from "esbuild";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, "");
const uiBaseUrl = process.env.UI_BASE_URL?.trim().replace(/\/+$/, "");

if (!apiBaseUrl || !uiBaseUrl) {
  throw new Error("Set API_BASE_URL and UI_BASE_URL in the project .env");
}

export default defineConfig({
  expose: {
    API_BASE_URL: apiBaseUrl,
  },
  e2e: {
    baseUrl: uiBaseUrl,
    specPattern: ["cypress/e2e/api/**/*.cy.ts", "cypress/e2e/ui/**/*.feature"],
    supportFile: "cypress/support/e2e.ts",
    video: true,
    async setupNodeEvents(on, config) {
      const credentialEnv = {
        OWM_API_KEY: "CYPRESS_OWM_API_KEY",
        OWM_EMAIL: "CYPRESS_OWM_EMAIL",
        OWM_PASSWORD: "CYPRESS_OWM_PASSWORD",
      } as const;

      for (const [configKey, processKey] of Object.entries(credentialEnv)) {
        const value = process.env[processKey];
        if (value) {
          config.env[configKey] = value;
        }
      }

      await addCucumberPreprocessorPlugin(on, config);
      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config) as unknown as Plugin],
        })
      );
      return config;
    },
  },
});