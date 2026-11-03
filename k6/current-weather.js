import http from "k6/http";
import { check } from "k6";

const BASE_URL = (__ENV.LOAD_BASE_URL || __ENV.BASE_URL || "").replace(/\/+$/, "");
const BASE_ORIGIN = BASE_URL.match(/^https?:\/\/[^/]+/)?.[0];
if (!BASE_ORIGIN) {
  throw new Error("Set BASE_URL or LOAD_BASE_URL in the project .env to a controlled test target");
}
const TARGET_URL = `${BASE_ORIGIN}/weather?q=Madrid,ES`;

export const options = {
  scenarios: {
    target_load: {
      executor: "constant-arrival-rate",
      rate: 500,
      timeUnit: "1s",
      duration: "2m",
      preAllocatedVUs: 25,
      maxVUs: 40,
    },
  },
  thresholds: {
    checks: ["rate>0.95"],
    http_req_failed: ["rate<0.1"],
    http_req_duration: ["p(95)<500"],
    dropped_iterations: ["count<600"],
  },
};

export default function () {
  const res = http.get(TARGET_URL);
  const isJson = res.headers["Content-Type"]?.includes("application/json") ?? false;
  const body = isJson ? res.json() : null;

  check(res, {
    "status is 200": (r) => r.status === 200,
    "content type is JSON": () => isJson,
    "weather response has expected shape": () =>
      body !== null &&
      typeof body === "object" &&
      "main" in body &&
      Array.isArray(body.weather) &&
      body.weather.length > 0,
  });
}