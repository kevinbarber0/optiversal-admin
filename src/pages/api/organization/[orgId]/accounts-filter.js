import { UserRole } from '@util/enum.js';
import SharedService from '@services/sharedService';
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');
const OrganizationService = require('@services/organizationService');
const AccountService = require('@services/accountService');
const AccountDB = require('@db/accountDB');

export default requireAuth(
  (req, res) => {
    SharedService.setLocationInfo(req);

    if (req.method === 'GET') {
      const orgId = req.query.orgId;

      return OrganizationService.getAllAccountsForFilter(orgId).then((result) =>
        res.status(200).json(result),
      );
    }  else {
      res.status(404);
    }
  }
);
