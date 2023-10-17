import absoluteUrl from 'next-absolute-url';
const AccountDB = require('@db/accountDB');

export class SharedService {
  constructor() {
    this.orgUserMap = new Map();
    this.locationInfo = null;
  }

  getUserOrgId(accountId) {
    if (!this.orgUserMap.has(accountId)) {
      return null;
    }
    return this.orgUserMap.get(accountId);
  }

  async getUserOrgIdOrDefault(accountId) {
    if (!this.orgUserMap.has(accountId)) {
      await this.setDefaultOrganizationId(accountId);
    }
    return this.orgUserMap.get(accountId);
  }

  setLocationInfo(req) {
    this.locationInfo = absoluteUrl(req);
  }
  
  async setDefaultOrganizationId(accountId) {
    const organizations = await AccountDB.getAccountOrganizations(accountId);
    if (organizations && organizations.length > 0) {
      console.log(
        `Default to org ID ${organizations[0].organizationId} for account ${accountId}`,
      );
      this.orgUserMap.set(accountId, organizations[0].organizationId);
      this.orgId = organizations[0].organizationId;
    }
  }
  
  async setOrganizationId(accountId, orgId) {
    console.log('setting orgId', accountId, orgId);
    const organizations = await AccountDB.getAccountOrganizations(accountId);
    if (orgId && orgId.trim().length > 0) {
      if (
        organizations.some(({ organizationId }) => organizationId === orgId)
      ) {
        this.orgUserMap.set(accountId, orgId);
     
        this.orgId = orgId;
      } else {
        throw new Error('Invalid organization ID');
      }
    } else {
      if (organizations && organizations.length > 0) {
        console.log(
          `Default to org ID ${organizations[0].organizationId} for account ${accountId}`,
        );
        this.orgUserMap.set(accountId, organizations[0].organizationId);
        this.orgId = organizations[0].organizationId;
      }
    }
  }
}

const sharedService = new SharedService();

export default sharedService;
