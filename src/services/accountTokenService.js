const AccountTokenDB = require('@db/accountTokenDB');

const { encrypt, decrypt } = require('@util/crypt');

class AccountTokenService {
  static generateToken(accountId, expiration = 24 * 60 * 60) {
    return encrypt({
      uid: accountId,
      exp: new Date(new Date().getTime() + expiration * 1000).getTime(), // expire in one day
    });
  }

  static async parseToken(token) {
    const tokenInfo = decrypt(token);

    if (!tokenInfo) {
      return {
        success: false,
        message:
          'The provided token is not recognized. Please contact support to reset your password.',
      };
    } else if (tokenInfo.exp < new Date().getTime()) {
      return {
        success: false,
        expired: true,
        tokenInfo: tokenInfo,
        message: "The verification link you've followed has expired.",
      };
    } else {
      if (!(await AccountTokenDB.isTokenUsed(token)))
        await AccountTokenDB.setTokenUsed(token);
      return {
        success: true,
        tokenInfo: tokenInfo,
      };
    }
  }
}

module.exports = AccountTokenService;
