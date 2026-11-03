# Ozymandias Perfect Holidays: Weather & Login Test Suite

End-to-end automated checks for the OpenWeather API and the OpenWeather sign-in flow. The project currently uses Cypress 16 + TypeScript, plus Gherkin/Cucumber for the UI flow and a k6 load script for performance checks.

## Scope

| Area | Target                                                                     | Current approach                                 |
| ---- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| API  | OpenWeather current weather endpoint (`/data/2.5/weather`)                 | Cypress `cy.request()` assertions                |
| UI   | OpenWeather sign-in page (`https://home.openweathermap.org/users/sign_in`) | Gherkin feature + step definitions + page object |
| Load | Simulated throughput checks                                                | k6 against a stub/test target                    |

## Relation to the Ozymandias system

The exercise targets OpenWeather, not the Ozymandias holiday domain. It covers the parts of the system diagram that map to OpenWeather and uses them as a representative sample of the testing strategy.

| Ozymandias component            | Exercise equivalent                    | What this suite validates                                                                                                                     |
| ------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| External Weather Service        | OpenWeather "Current weather data" API | Contract (fields, types, ranges), units and language parameters, error handling (401/404/400), response time                                  |
| Weather Façade Service          | Not tested directly                    | The API suite defines the contract the façade depends on. The same checks can target the façade by changing `API_BASE_URL` and the assertions |
| Website (user login)            | OpenWeather sign-in page               | BDD flow for authentication: form elements, valid login, invalid credentials, empty submission, password recovery                             |
| System throughput (~1000 req/s) | k6 script                              | Load profile against a stubbed façade or controlled environment, never against the public OpenWeather API                                     |

Not covered by this exercise: Holiday Service, Holidays DB, the recommendation algorithm, and the queue. See [Next steps](#next-steps-for-the-full-system).

## Current framework behavior

- Cypress 16 removes the legacy global `Cypress.env()` API. Tests should use `cy.env()` for runtime values or inject config before starting Cypress.
- The real OpenWeather sign-in route currently resolves to `/users/sign_in` rather than `/user/sign_in`.
- The suite uses explicit test IDs in the format `TEST-#### [COMPONENT] Validate ...` to keep scenario naming consistent and traceable.

## API coverage

The API suite exercises the real OpenWeather current weather API with black-box checks:

- Query methods: city name, coordinates, city ID
- Response contract: required keys, value ranges, response timing (<2s)
- Parameter validation: unit conversion consistency, language localization, XML response
- Negative scenarios: invalid API key, missing API key, unknown city, missing location, invalid coordinates

The API suite is intentionally value-based rather than hard-coded to specific weather results because the upstream data is dynamic.

## UI coverage

The BDD suite in `cypress/e2e/ui/login.feature` validates:

- sign-in form structure and password masking
- successful sign-in with valid credentials
- wrong-password errors
- unregistered-email errors
- empty submission validation
- forgot-password flow visibility

Selectors live in `cypress/support/pages/login.page.ts` and step definitions in `cypress/support/step_definitions/login.steps.ts`.

## Local setup

The Cypress config loads the project-root `.env` file automatically when present. Add these values to your ignored local `.env` file:

```bash
CYPRESS_OWM_API_KEY=<api-key>
CYPRESS_OWM_EMAIL=<email>
CYPRESS_OWM_PASSWORD=<password>
API_BASE_URL=https://api.openweathermap.org
UI_BASE_URL=https://home.openweathermap.org
```

`API_BASE_URL` and `UI_BASE_URL` are the only URL settings. Both are required in `.env`; there are no URL defaults in code. Cypress appends `/data/2.5/weather` to `API_BASE_URL` for API requests and uses `UI_BASE_URL` as its sign-in host. Replace the sample hosts with your test environment when needed. Credentials may also be provided through the shell or CI secret store. Cypress tests access credentials using `cy.env()` with command logging disabled; do not print or commit secret values.

## Run commands

```bash
npm run typecheck    # TypeScript validation
npm run test:api     # API spec
npm run test:ui      # UI feature spec
npm test             # full Cypress suite
npm run cy:open      # interactive mode
```

Cypress uses Chrome for interactive and headless runs. Install Google Chrome locally before running the Cypress commands; GitHub Actions' Ubuntu runner provides Chrome.

The load script requires k6 and a controlled stub/facade URL. Install k6 with Homebrew on macOS (`brew install k6`) or use the install instructions for your platform at [k6.io](https://grafana.com/docs/k6/latest/set-up/install-k6/). Set `API_BASE_URL` to the controlled host that implements `/weather?q=Madrid,ES`; Cypress uses that same host at `/data/2.5/weather`. `npm run load` reads `.env` automatically. Do not run the load test against the public OpenWeather API.

```bash
npm run load
```

## CI notes

The workflow runs type checking and live API/UI checks when a new PR targeting `main` is opened and when changes are pushed to `main` (including merges). It also runs every Monday at 9:00 AM Europe/Madrid time. GitHub Actions cron uses UTC, so the schedule checks both possible UTC hours and runs the tests only at 9:00 AM in Madrid, including daylight-saving changes. Live tests are skipped for forked PRs because GitHub does not expose repository secrets to those workflows.

The workflow uses `API_BASE_URL` and `UI_BASE_URL` repository variables when set; otherwise, it uses the sample hosts above. Add these repository secrets for the live tests and report email:

- Test credentials: `OWM_API_KEY`, `OWM_EMAIL`, `OWM_PASSWORD`
- SMTP delivery: `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `REPORT_EMAIL_TO`, `REPORT_EMAIL_FROM`

The workflow generates and emails a Mochawesome PDF and also uploads the HTML and PDF reports as an Actions artifact. `BASE_URL` is passed through as a repository variable for the optional k6 load-test target; the workflow does not run load tests, and that URL should point to a controlled test service, not the public OpenWeather API.

## Next steps for the full system

Proposed coverage for the components outside this exercise:

| Component              | Proposed approach                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Holiday Service        | API tests for the request/response contract: preferences, dates, and the 5 experience types                                                                                                                         |
| Holidays DB            | Read-only verification against the real production DB. Writes limited to customer-request data, using dedicated test customers and cleanup, because experience types and setup data are maintained by other systems |
| Queue                  | Integration tests that publish and consume messages: no message loss, asynchronous reply, retry and failure handling                                                                                                |
| Weather Façade Service | Contract tests against OpenWeather plus a stub to simulate failures and timeouts                                                                                                                                    |
| Business rule          | End-to-end scenario: options are updated and discarded when the forecast is inadequate for the activity                                                                                                             |
| Performance            | k6 run at ~1000 req/s against the real or stubbed façade, measuring latency and queue throughput                                                                                                                    |

## Assumptions and limitations

- The live login page may enforce bot protection or change markup without notice; the positive login scenario is therefore environment-sensitive.
- The API tier is a public external dependency and is validated by contract/range checks rather than fixed values.
- Cypress is not a load-testing tool; the k6 script is the load test path and should target a stubbed or controlled environment rather than the public OpenWeather endpoint.
- This exercise is intentionally focused on automation coverage and framework compatibility, not on production service integration or queue-based backend validation.
