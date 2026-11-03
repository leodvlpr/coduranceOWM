import { loginSelectors } from "../selectors/login.selectors";

export const loginPage = {
  path: "/users/sign_in",
  ...loginSelectors,

  visit: () => cy.visit("/users/sign_in"),

  signIn(email: string, password: string) {
    if (email) cy.get(this.email).clear().type(email, { log: false });
    if (password) cy.get(this.password).clear().type(password, { log: false });
    cy.get(this.submit).click();
  },
};