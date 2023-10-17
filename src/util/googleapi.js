import AccountDB from '@db/accountDB';
const OrgDB = require('../db/orgDB');
import { google } from 'googleapis';

class GoogleAPI {
  static async setAuthTokens(organizationId, code, refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      'postmessage',
    );
    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // update the refresh token in org config
        console.log('new refresh token received', tokens);
        OrgDB.setConfig(organizationId, 'googleConsoleTokens', tokens);
      }
    });
    if (refreshToken) {
      console.log('using refresh token');
      oauth2Client.setCredentials(refreshToken);
    } else if (code) {
      console.log('using auth code');
      const { tokens } = await oauth2Client.getToken(code);
      console.log('new tokens from code', tokens);
      oauth2Client.setCredentials(tokens);
      await OrgDB.setConfig(organizationId, 'googleConsoleTokens', tokens);
    }
    google.options({
      auth: oauth2Client,
    });
  }

  static async getAcessToken(code) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      'postmessage',
    );
    if (code) {
      console.log('using auth code');
      const { tokens } = await oauth2Client.getToken(code);
      console.log('new tokens from code', tokens);
      return tokens;
    }
    google.options({
      auth: oauth2Client,
    });
  }
}

module.exports = GoogleAPI;
