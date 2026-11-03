type Params = Record<string, string | number>;

export const getWeather = (params: Params = {}, apiKey?: string | null) => {
  const apiBaseUrl = Cypress.expose("API_BASE_URL") as string;
  const url = `${apiBaseUrl}/data/2.5/weather`;
  const request = (resolvedApiKey: string | null) =>
    cy.request({
      url,
      qs: { ...(resolvedApiKey ? { appid: resolvedApiKey } : {}), ...params },
      failOnStatusCode: false,
      log: false,
    });

  if (apiKey !== undefined) {
    return request(apiKey);
  }

  return cy.env(["OWM_API_KEY"], { log: false }).then(({ OWM_API_KEY }) =>
    request(typeof OWM_API_KEY === "string" ? OWM_API_KEY : null)
  );
};