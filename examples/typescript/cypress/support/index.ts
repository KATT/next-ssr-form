function makeId(length = 4) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
Cypress.Commands.add('happyForm', () => {
  const nonce = `${makeId()}`;
  cy.get('[name=from]')
    .focus()
    .type(`from${nonce}`);
  cy.get('[name=message]')
    .focus()
    .type(`message${nonce}`);
  cy.get('[type=submit]').click({ force: true });
  cy.contains('Yay! Your entry was added');
});
Cypress.Commands.add('sadForm', () => {
  cy.get('[name=from]')
    .focus()
    .type(`a`);
  cy.get('[name=message]')
    .focus()
    .type(`b`);
  cy.get('[type=submit]').click({ force: true });
  cy.contains('Should be at least 2 characters');
  cy.contains('Should be at least 4 characters');
});
