import { getWeather } from "../../support/api/weather";

describe("OpenWeather API - Current weather data", () => {
  before(() => {
    cy.env(["OWM_API_KEY"], { log: false }).then(({ OWM_API_KEY }) => {
      expect(OWM_API_KEY, "CYPRESS_OWM_API_KEY is set").to.be.a("string").and.not.empty;
    });
  });

  context("Query methods", () => {
    it("TEST-0001 [DATA_API] Validate weather is returned by city name", () => {
      getWeather({ q: "Madrid,ES" }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.name).to.eq("Madrid");
        expect(body.sys.country).to.eq("ES");
        expect(Number(body.cod)).to.eq(200);
      });
    });

    it("TEST-0002 [DATA_API] Validate weather is returned by coordinates", () => {
      getWeather({ lat: 40.4168, lon: -3.7038 }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.coord.lat).to.be.closeTo(40.4168, 0.5);
        expect(body.coord.lon).to.be.closeTo(-3.7038, 0.5);
      });
    });

    it("TEST-0003 [DATA_API] Validate weather is returned by city id", () => {
      getWeather({ id: 3117735 }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.id).to.eq(3117735);
        expect(body.name).to.eq("Madrid");
      });
    });
  });

  context("Response contract", () => {
    it("TEST-0004 [DATA_API] Validate response structure and value ranges", () => {
      getWeather({ q: "Madrid,ES", units: "metric" }).then(({ body, duration }) => {
        expect(body).to.include.all.keys("coord", "weather", "main", "wind", "clouds", "dt", "sys", "timezone", "id", "name", "cod");
        expect(body.weather).to.be.an("array").and.not.empty;
        expect(body.weather[0]).to.include.all.keys("id", "main", "description", "icon");
        expect(body.main).to.include.all.keys("temp", "feels_like", "temp_min", "temp_max", "pressure", "humidity");
        expect(body.main.humidity).to.be.within(0, 100);
        expect(body.main.pressure).to.be.within(850, 1100);
        expect(body.wind.speed).to.be.at.least(0);
        expect(body.clouds.all).to.be.within(0, 100);
        expect(body.sys.sunrise).to.be.lessThan(body.sys.sunset);
        expect(duration, "response time ms").to.be.lessThan(2000);
      });
    });
  });

  context("Parameters", () => {
    it("TEST-0005 [DATA_API] Validate temperature conversion units are consistent", () => {
      getWeather({ q: "Madrid,ES" }).then(({ body: std }) => {
        getWeather({ q: "Madrid,ES", units: "metric" }).then(({ body: metric }) => {
          getWeather({ q: "Madrid,ES", units: "imperial" }).then(({ body: imp }) => {
            const k = std.main.temp;
            expect(k).to.be.within(200, 340);
            expect(metric.main.temp).to.be.closeTo(k - 273.15, 3);
            expect(imp.main.temp).to.be.closeTo((k - 273.15) * 9 / 5 + 32, 5);
          });
        });
      });
    });

    it("TEST-0006 [DATA_API] Validate localized weather descriptions", () => {
      getWeather({ q: "Madrid,ES", lang: "en" }).then(({ body: en }) => {
        getWeather({ q: "Madrid,ES", lang: "es" }).then(({ body: es }) => {
          expect(es.weather[0].description).to.be.a("string").and.not.empty;
          expect(es.weather[0].description).to.not.eq(en.weather[0].description);
        });
      });
    });

    it("TEST-0007 [DATA_API] Validate xml weather payload response", () => {
      getWeather({ q: "Madrid,ES", mode: "xml" }).then(({ status, headers, body }) => {
        expect(status).to.eq(200);
        expect(String(headers["content-type"])).to.include("xml");
        expect(body).to.be.a("string").and.include("<current>");
      });
    });
  });

  context("Negative cases", () => {
    it("TEST-0008 [DATA_API] Validate invalid API key returns 401", () => {
      getWeather({ q: "Madrid,ES" }, "invalid_key_123").then(({ status, body }) => {
        expect(status).to.eq(401);
        expect(String(body.cod)).to.eq("401");
        expect(body.message).to.be.a("string").and.not.empty;
      });
    });

    it("TEST-0009 [DATA_API] Validate missing API key returns 401", () => {
      getWeather({ q: "Madrid,ES" }, null).then(({ status }) => {
        expect(status).to.eq(401);
      });
    });

    it("TEST-0010 [DATA_API] Validate unknown city returns 404", () => {
      getWeather({ q: "NotARealCity_xyz" }).then(({ status, body }) => {
        expect(status).to.eq(404);
        expect(String(body.cod)).to.eq("404");
        expect(body.message).to.match(/city not found/i);
      });
    });

    it("TEST-0011 [DATA_API] Validate missing location returns 400", () => {
      getWeather({}).then(({ status }) => {
        expect(status).to.eq(400);
      });
    });

    it("TEST-0012 [DATA_API] Validate out-of-range coordinates return 400", () => {
      getWeather({ lat: 999, lon: 999 }).then(({ status }) => {
        expect(status).to.eq(400);
      });
    });
  });
});