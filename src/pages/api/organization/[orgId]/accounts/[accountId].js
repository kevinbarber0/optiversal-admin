import { filterNullValues } from '@helpers/utils.js';
import { UserRole } from '@util/enum.js';
import SharedService from '@services/sharedService';

const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');
const AccountService = require('@services/accountService');
const AccountDB = require('@db/accountDB');

export default requireAuth(
  requireRoles(
    (req, res) => {
      if (req.method === 'PUT') {
        return Promise.all([
          AccountDB.getAccountRoles(req.user.uid),
          AccountDB.getAccountOrganizations(req.query.accountId),
        ]).then(([currentUserRoles, accountOrganizations]) => {
          const changedOrganizations = [
            ...req.body.organizations,
            ...accountOrganizations.map(({ organizationId }) => organizationId),
          ].filter(
            (v, i, arr) => arr.filter((arrV) => arrV === v).length === 1,
          );

          // Check if this user has permission to changed organizations
          if (
            changedOrganizations.every(
              (orgId) =>
                !!currentUserRoles.find(
                  ({ organizationId, roles }) =>
                    organizationId === orgId &&
                    roles.includes(UserRole.ManageUsers),
                ),
            )
          ) {
            SharedService.setLocationInfo(req);
            const accountId = req.query.accountId;
            const orgId = req.query.orgId;
            const existingOrganizationIds = accountOrganizations.map(
              ({ organizationId }) => organizationId,
            );
            const accountData = filterNullValues({
              details: filterNullValues({
                name: req.body.name,
              }),
              status: req.body.status,
              roles: req.body.roles,
              newOrganizations: req.body.organizations.filter(
                (orgId) => !existingOrganizationIds.includes(orgId),
              ),
              deletedOrganizations: existingOrganizationIds.filter(
                (orgId) => !(req.body.organizations || []).includes(orgId),
              ),
            });

            return AccountService.updateById(
              accountId,
              orgId,
              accountData,
            ).then((result) => res.status(200).json(result));
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
