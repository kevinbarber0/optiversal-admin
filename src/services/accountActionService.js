import SharedService from '@services/sharedService';
const AccountActionDB = require('../db/accountActionDB');
const AccountDB = require('../db/accountDB');

class AccountActionService {
  static async logAccountAction(accountId, actionDetails) {
    const account = await AccountDB.getById(accountId, SharedService.getUserOrgId(accountId));

    if (account) {
      const result = await AccountActionDB.createAccountAction({
        orgId: account.organizationId,
        accountId: accountId,
        accountEmail: account.email,
        actionDetails,
      });

      if (result) {
        return { success: true };
      } else {
        return { success: false, message: 'Failed to log action.' };
      }
    } else {
      return { success: false, message: 'Unauthorized' };
    }
  }

  static async getAll(
    accountId,
    { offset, limit, filter, sortBy, accounts, actionTypes, dateRange },
  ) {
    let success = false;
    let message = '';
    let pages = [];
    let totalCount = 0;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      pages = await AccountActionDB.getAll(SharedService.getUserOrgId(accountId), {
        offset,
        limit,
        filter,
        sortBy,
        accounts,
        actionTypes,
        dateRange,
      });
      totalCount = await AccountActionDB.getCount(SharedService.getUserOrgId(accountId), {
        offset,
        limit,
        filter,
        sortBy,
        accounts,
        actionTypes,
        dateRange,
      });
      success = true;
    } else {
      message = 'Unauthorized';
    }
    return {
      success: success,
      message: message,
      pages: pages,
      totalCount: totalCount,
    };
  }
}

module.exports = AccountActionService;
