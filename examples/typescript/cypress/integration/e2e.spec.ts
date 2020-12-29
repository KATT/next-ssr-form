/// <reference types="cypress" />
/// <reference path="../support/index.d.ts" />

describe('js enabled', () => {
  for (const path of ['/', 'formik-scaffold', 'vanilla']) {
    it(`${path} works`, () => {
      cy.visit('/');
      cy.contains('My guestbook');
      cy.happyForm();
      cy.sadForm();
    });
  }
});
