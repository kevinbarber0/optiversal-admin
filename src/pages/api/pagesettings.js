import { UserRole } from '@util/enum.js';

const AccountService = require('@services/accountService');
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');

export default requireAuth(
  requireRoles(
    (req, res) => {
      if (req.method === 'GET') {
        return AccountService.getOrgPageSettings(req.user.uid).then((result) =>
          res.status(200).json(result),
        );
      } else {
        res.status(404);
      }
    },
    [UserRole.EditPages, UserRole.ViewPages, UserRole.PublishPages],
  ),
);
