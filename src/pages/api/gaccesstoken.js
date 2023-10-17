import { UserRole } from '@util/enum.js';

const AccountService = require('@services/accountService');
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');

export default requireAuth(
  requireRoles(
    (req, res) => {
      if (req.method === 'PUT') {
        //update org settings
        const settings = req.body;
        return AccountService.updateOrgSettings(req.user.uid, settings).then(
          (result) => res.status(200).json(result),
        );
      } else if (req.method === 'GET') {
        return AccountService.getOrgSettings(req.user.uid).then((result) =>
          res.status(200).json(result),
        );
      } else {
        res.status(404);
      }
    },
    [UserRole.ManageSettings],
  ),
);
