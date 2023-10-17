const AccountDB = require('@db/accountDB');
const OrganizationService = require('@services/organizationService');
import SharedService from '@services/sharedService';
const fetch = require('node-fetch');

class ThirdPartyAPIServices {
  static async checkSerp(accountId, q) {
    let success = false;
    let message = '';
    let ranked = false;
    const acct = await AccountDB.getById(accountId);
    if (acct) {
      const orgConfig = await OrganizationService.getOrgConfig(
        SharedService.getUserOrgId(accountId),
      );

      const loc = orgConfig?.config?.location || 'United States';

      let apiUrl = `${process.env.VALUESERP_URL}?api_key=${
        process.env.VALUESERP_KEY
      }&q=${encodeURIComponent(q?.toLowerCase())}&location=${encodeURIComponent(
        loc,
      )}&num=10`;

      const response = await fetch(apiUrl);
      const res = await response.json();

      if (res?.organic_results?.length > 0) {
        if (orgConfig?.config?.cannibalDomains?.length > 0) {
          const checker = (value) =>
            orgConfig.config.cannibalDomains.some((element) =>
              value.includes(element),
            );
          const org = res.organic_results.filter((o) => checker(o?.domain));

          if (org.length > 0) {
            ranked = true;
          }
        }
      }

      success = true;
    } else {
      message = 'Unauthorized';
    }
    return { success, message, ranked };
  }
}

module.exports = ThirdPartyAPIServices;
