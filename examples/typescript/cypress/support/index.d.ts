/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    happyForm(): Chainable<Element>;
    sadForm(): Chainable<Element>;
  }
}
