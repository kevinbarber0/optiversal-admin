import { UserRole } from '@util/enum.js';
import SharedService from '@services/sharedService';
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');
const OrganizationService = require('@services/organizationService');
const AccountDB = require('@db/accountDB');
const Auth0Service = require('@services/auth0Service');

export default requireAuth(
  requireRoles(
    (req, res) => {
      SharedService.setLocationInfo(req);

      if (req.method === 'GET') {
        const orgId = req.query.orgId;
        const inactivate = req.query?.inactivate || false;

        return OrganizationService.getAllAccounts(orgId, inactivate).then(
          (result) => res.status(200).json(result),
        );
      } else if (req.method === 'POST') {
        const orgId = req.query.orgId;
        const newAccountOrganizations = req.body.organizations;

        // Check role
        return Promise.all([
          AccountDB.getById(req.user.uid),
          AccountDB.getAccountRoles(req.user.uid),
        ]).then(([currentUser, accountRoles]) => {
          if (
            // Check this user has ManageUsers role for this organization
            accountRoles.find(
              (accountRole) =>
                accountRole.organizationId === orgId &&
                accountRole.roles.includes(UserRole.ManageUsers),
            ) &&
            // Check this user has Manage Users role for given organizations
            newAccountOrganizations
              .map((organizationId) =>
                accountRoles.find(
                  (accountRole) =>
                    accountRole.organizationId === organizationId &&
                    accountRole.roles.includes(UserRole.ManageUsers),
                ),
              )
              .every((v) => !!v)
          ) {
            return OrganizationService.createAccount(orgId, req.body)
              .then((result) => {
                if (result.success === true) {
                  Auth0Service.sendResetPassword(result.account.email);
                }
                return result;
              })
              .then((result) => res.status(200).json(result));
          } else {
            res.status(403).send({
              status: 'error',
              message: "You don't have permission to call this endpoint",
            });
          }
        });
      } else {
        res.status(404);
      }
    },
    [UserRole.ManageUsers],
  ),
);
