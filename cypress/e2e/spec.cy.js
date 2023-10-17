context('Cookie', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.preserveAuth0CookiesOnce();
  });

  it('user login should preserve cookies', () => {
    cy.visit('/');

    cy.request('/api/auth/me').then(({ body: user }) => {
      expect(user.email).to.equal(Cypress.env('auth0Username'));
    });
  });

  it('passes', () => {
    cy.visit('/catalog');
  });
});

/*describe('Site Reachable', () => {
  it('passes', () => {
    cy.visit('/');
  });
});

context('Logging in', () => {
  it('should login', () => {
    cy.login().then(() => {
      // Now run your test...
      cy.request('/api/auth/me').then(({ body: user }) => {
        expect(user.email).to.equal(Cypress.env('auth0Username'));
      });
    });
  });
});
*/
