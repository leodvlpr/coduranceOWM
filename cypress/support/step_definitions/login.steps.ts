import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import { loginPage } from "../pages/login.page";

Given("I am on the sign in page", () => {
  loginPage.visit();
});

When("I sign in with the valid account", () => {
  cy.env(["OWM_EMAIL", "OWM_PASSWORD"], { log: false }).then(({ OWM_EMAIL, OWM_PASSWORD }) => {
    loginPage.signIn(OWM_EMAIL, OWM_PASSWORD);
  });
});

When("I sign in with the valid email and the password {string}", (password: string) => {
  cy.env(["OWM_EMAIL"], { log: false }).then(({ OWM_EMAIL }) => {
    loginPage.signIn(OWM_EMAIL, password);
  });
});

When("I sign in with email {string} and password {string}", (email: string, password: string) => {
  loginPage.signIn(email, password);
});

When("I submit the form without filling it", () => {
  cy.get(loginPage.submit).click();
});

When("I click the forgot password link", () => {
  cy.get(loginPage.forgotLink).first().click();
  cy.get(".pwd-lost-f").should("be.visible");
});

Then("I should see the email field, the password field and the submit button", () => {
  cy.get(loginPage.email).should("be.visible");
  cy.get(loginPage.password).should("be.visible");
  cy.get(loginPage.submit).should("be.visible");
});

Then("the password field should mask its input", () => {
  cy.get(loginPage.password).should("have.attr", "type", "password");
});

Then("I should be signed in", () => {
  cy.location("pathname").should("not.include", "/users/sign_in");
  cy.contains(/signed in successfully/i).should("be.visible");
});

Then("I should see the error {string}", (message: string) => {
  cy.contains(message, { matchCase: false }).should("be.visible");
});

Then("I should remain on the sign in page", () => {
  cy.url().should("include", "/users/sign_in");
});

Then("I should be on the password recovery page", () => {
  cy.get(".pwd-lost-f").should("be.visible");
  cy.get('form[action="/users/password"]').should("be.visible");
});