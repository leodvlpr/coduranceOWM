import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const result = spawnSync("k6", ["run", "k6/current-weather.js"], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
