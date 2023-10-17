import SharedService from '@services/sharedService';
const AccountDB = require('../db/accountDB');
const OrgDB = require('../db/orgDB');
const OrgGeoDB = require('../db/orgGeoDB');
const Auth0Service = require('@services/auth0Service');

class OrganizationService {
  static async getAllAccounts(orgId, inactivate = false) {
    const accts = await AccountDB.getAllByOrgId(orgId, inactivate);
    if (accts) {
      return {
        success: true,
        accounts: accts,
      };
    } else {
      return { success: false, message: 'Account not found' };
    }
  }

  static async getAllAccountsForFilter(orgId) {
    const accts = await AccountDB.getPublicAllByOrgId(orgId);
    if (accts) {
      return {
        success: true,
        accounts: accts,
      };
    } else {
      return { success: false, message: 'Account not found' };
    }
  }

  static async getOrgConfig(orgId) {
    const config = await OrgDB.getConfig(orgId);
    return {
      success: true,
      config: config,
    };
  }

  static async getOrgDefaultTemplate(accountId) {
    const acct = await AccountDB.getById(
      accountId,
      SharedService.getUserOrgId(accountId),
    );
    if (acct) {
      const settings = await OrgDB.getSettings(
        SharedService.getUserOrgId(accountId),
      );

      return {
        success: true,
        defaultTemplate: settings?.defaultTemplate,
      };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async getGetOrgGeoLocations(accountId) {
    const acct = await AccountDB.getById(
      accountId,
      SharedService.getUserOrgId(accountId),
    );
    if (acct) {
      const locations = await OrgGeoDB.getAll(
        SharedService.getUserOrgId(accountId),
      );
      return {
        success: true,
        totalCount: locations?.length || 0,
        locations: locations,
      };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async updateOrgGeoLocations(accountId, locations) {
    const acct = await AccountDB.getById(
      accountId,
      SharedService.getUserOrgId(accountId),
    );
    if (acct) {
      await OrgGeoDB.updatedGeoLocations(
        SharedService.getUserOrgId(accountId),
        locations,
      );
      return {
        success: true,
      };
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async createAccount(orgId, userInfo) {
    try {
      // create auth0 account
      const res = await Auth0Service.createUser({
        email: userInfo.email,
        email_verified: true,
        password: 'RandomPassword@' + Math.random().toString(8),
        name: userInfo.name,
        app_metadata: {
          invited: true,
        },
        connection: 'Username-Password-Authentication',
      });

      if (res.success) {
        const userData = res.userData;
        if (userData?.user_id?.indexOf('|') >= 0) {
          userData.uid = res.userData.user_id.substring(
            userData.user_id.indexOf('|') + 1,
          );
        }

        // create optiversal user
        const acct = await AccountDB.createAccount(userData.uid, userData, {
          orgId,
          email: userInfo.email,
          roles: userInfo.roles?.length > 0 ? userInfo.roles : null,
          organizationIds:
            userInfo.organizations?.length > 0 ? userInfo.organizations : [],
        });
        return { success: true, account: acct };
      } else {
        return res;
      }
    } catch (e) {
      console.error(e);
      return { success: false, message: e.message };
    }
  }
}

module.exports = OrganizationService;
