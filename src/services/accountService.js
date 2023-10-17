import SharedService from '@services/sharedService';
const Email = require('@util/email');
const AccountDB = require('../db/accountDB');
const AccountTokenService = require('./accountTokenService');
const AccountActionService = require('./accountActionService');
const { UserAction } = require('@util/enum');
const GoogleAPI = require('@util/googleapi');

class AccountService {
  static async findOrCreate(id, source, email, name, user) {
    const result = await AccountDB.findOrCreate(id, source, email, name, user)
      .then((acct) => {
        return { success: true, data: acct };
      })
      .catch((err) => {
        return { success: false, message: err };
      });
    return result;
  }

  static async getById(accountId) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      const trimmedAcct = {
        name: acct?.details?.name || acct?.details?.displayName,
        email: acct.email || null,
        roles: acct.roles ? acct.roles : null,
        organizationId: acct.organizationId ? acct.organizationId : null,
      };

      return { success: true, account: trimmedAcct };
    } else {
      console.error(`Account ${accountId} not found, returning`);
      console.log(`SharedService.getUserOrgId: ${SharedService.getUserOrgId(accountId)}`);
      console.log(`AccountDB.getById: ${JSON.stringify(acct)}`);
      return { success: false, message: 'Account not found' };
    }
  }

  static async getAll(accountId) {
    const acct = await AccountDB.getById(accountId);
    let success = false;
    let message = null;
    const accounts = [];
    if (acct) {
      const accts = await AccountDB.getAllByOrgId(SharedService.getUserOrgId(accountId));
      accts.forEach((acct) => {
        if (acct.status !== 0) {
          const trimmedAcct = {
            accountId: acct.accountId || null,
            email: acct.email || null,
            name: acct?.details?.name || acct?.details?.displayName,
          };
          accounts.push(trimmedAcct);
        }
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }

    return { success: success, message: message, accounts: accounts };
  }

  static async getOrganizations(accountId) {
    const organizations = await AccountDB.getAccountOrganizations(accountId);

    if (organizations) {
      return { success: true, organizations };
    }
    return { success: false, message: 'No Organizations', organizations: [] };
  }

  static async updateById(accountId, orgId, data) {
    const account = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (!orgId) {
      orgId = SharedService.getUserOrgId(accountId);
    }

    if (account) {
      const newData = {
        user: { ...account.details, ...data.details },
        status: data.status,
        roles: JSON.stringify(data.roles ? data.roles : account.roles),
        newOrganizationIds: data.newOrganizations,
        deletedOrganizationIds: data.deletedOrganizations,
      };

      return Promise.all([
        AccountDB.updateById(accountId, orgId, newData),
        AccountActionService.logAccountAction(accountId, {
          actionType: 'UpdateUser',
          description: UserAction.UpdateUser,
          itemType: 'user',
          itemId: accountId,
          itemName: `${newData.user.name} <${account.email}>`,
          changedValue: newData,
        }),
      ])
        .then(() =>
          Promise.all([
            AccountDB.getById(accountId, orgId),
            AccountDB.getAccountOrganizations(accountId),
          ]),
        )
        .then(([account, organizations]) => {
          return { success: true, account: { ...account, organizations } };
        })
        .catch((err) => {
          return { success: false, message: err.toString() };
        });
    } else {
      return { success: false, message: 'Account not found' };
    }
  }

  static async getOrgSettings(accountId) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      return { success: true, settings: acct.orgSettings };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async getOrgUrlSettings(accountId, pageType) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      const homeUrl = acct.orgSettings?.homeUrl;
      const urlFormat = acct.orgSettings?.urlFormat;
      return {
        success: true,
        settingUrl: pageType === 'home' ? homeUrl : urlFormat,
      };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async getLanguagesOption(accountId) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      return {
        success: true,
        languages: acct.orgSettings?.localizations || null,
      };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async getOrgPageSettings(accountId) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      return {
        success: true,
        settings: {
          homeUrl: acct.orgSettings.urlFormat,
          urlFormat: acct.orgSettings.urlFormat,
          locationPageTitle: acct.orgSettings.locationPageTitle,
          includeReviewExcerpts:
            acct.orgSettings.includeReviewExcerpts || false,
          includePros: acct.orgSettings.includePros || false,
          includeCons: acct.orgSettings.includeCons || false,
          includeBlurbs: acct.orgSettings.includeBlurbs || false,
          includeParagraphs: acct.orgSettings.includeParagraphs || false,
          maxResults: acct.orgSettings.maxResults || 10,
        },
      };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async updateOrgSettings(accountId, settings) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      if (
        settings.integrations &&
        settings.integrations.googleSearchConsoleAPICode &&
        !acct.orgSettings.integrations?.googleSearchConsoleAPICode
      ) {
        await GoogleAPI.setAuthTokens(
          acct.organizationId,
          settings.integrations.googleSearchConsoleAPICode,
          null,
        );
      } else {
        console.log('no token update');
      }
      return await Promise.all([
        AccountDB.updateOrgSettings(acct.organizationId, settings),
        AccountActionService.logAccountAction(accountId, {
          actionType: 'ChangeSettings',
          description: UserAction.ChangeSettings,
          itemType: 'setting',
          itemId: null,
          itemName: null,
          changedValue: settings,
        }),
      ])
        .then(() => {
          return { success: true, message: '' };
        })
        .catch((err) => {
          return { success: false, message: err };
        });
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async sendEmailVerification(accountId, email = null) {
    if (SharedService.locationInfo === null) {
      return { success: 'false', message: 'Unknown Location Info' };
    }

    if (email === null) {
      const acct = await AccountDB.getAccountDetailsById(accountId);
      if (acct) {
        email = acct.email;
      } else {
        return { success: false, message: 'Unauthorized' };
      }
    }

    const origin = SharedService.locationInfo?.origin;
    const token = AccountTokenService.generateToken(accountId);
    const verifyUrl = `${origin}/verify-email/${token}`;
    await Email.sendEmail(
      email,
      'support@optiversal.com',
      'Verify Your Optiversal Account',
      `
Hello,
To complete your Optiversal account registration, please verify your email address by clicking the link below
${verifyUrl}
If you did not register an account with Optiversal or have any questions, simply reply to this email.
- Optiversal Support
      `,
    );
    return { success: true };
  }

  static async checkEmailToken(token) {
    const parsedToken = await AccountTokenService.parseToken(token);
    if (parsedToken.success) {
      await AccountService.updateById(parsedToken.tokenInfo.uid, null, {
        details: {
          email_verified: true,
        },
      });
      return { success: true, uid: parsedToken.tokenInfo.uid };
    } else {
      return { success: false, uid: parsedToken.tokenInfo.uid };
    }
  }

  static async sendInviteEmail(fromAccount, toAccount) {
    if (SharedService.locationInfo === null) {
      return { success: 'false', message: 'Unknown Location Info' };
    }

    const origin = SharedService.locationInfo?.origin;
    const token = AccountTokenService.generateToken(toAccount.accountId);
    const verifyUrl = `${origin}/accept-invite/${token}`;
    await Email.sendEmail(
      toAccount.email,
      'support@optiversal.com',
      `You are invited to ${fromAccount.orgName} on Optiversal`,
      `
Hello,
${
  fromAccount?.details?.name || fromAccount?.details?.displayName
} invited you to join ${fromAccount.orgName} on Optiversal.
To accept this invitation, click the link below and set your password.
${verifyUrl}
If you have any questions, simply reply to this email.
- Optiversal Support
      `,
    );
    return { success: true };
  }

  static async setemail_verified(email) {
    const accountId = await AccountDB.getAccountIdByEmail(email);

    if (accountId) {
      await AccountService.updateById(accountId, null, {
        details: {
          email_verified: true,
        },
      });
      return {
        success: true,
        message: 'Account updated!',
      };
    } else {
      return {
        success: false,
        message: 'Account not found',
      };
    }
  }

  static async findIDProvider(email) {
    if (email.indexOf('@optiversal.com') < 0) {
      const name = await AccountDB.findOrgProvider(email);
      return { name };
    } else {
      return { name: null };
    }
  }

  static async updateUserProfile(accountId, userData) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      await AccountService.updateById(accountId, null, userData);
      return { success: true, message: '' };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async deleteUserProfile(accountId) {
    const acct = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));
    if (acct) {
      await AccountDB.deleteUser(accountId);
      await AccountActionService.logAccountAction(accountId, {
        actionType: 'DeleteUser',
        description: 'Delete profile',
        itemType: 'user',
        itemId: accountId,
        itemName: `${acct?.details?.displayName} <${acct?.email}>`,
        changedValue: '',
      });
      return { success: true, message: '' };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }
}

module.exports = AccountService;
