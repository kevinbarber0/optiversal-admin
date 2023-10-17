const { defineConfig } = require('cypress');
const encrypt = require('cypress-nextjs-auth0/encrypt');

module.exports = defineConfig({
  projectId: 'sorwzz',
  e2e: {
    baseUrl: 'http://localhost:3000/',
    chromeWebSecurity: false,
    setupNodeEvents(on) {
      on('task', { encrypt });
    },
  },
});
