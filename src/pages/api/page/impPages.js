import { UserRole } from '@util/enum';

const PageService = require('@services/pageService');
const AccountService = require('@services/accountService');
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');

export default requireAuth(
  requireRoles(
    async (req, res) => {
      if (req.method === 'GET') {
        const resOrg = await AccountService.getOrgSettings(req.user.uid);

        if (!resOrg.success) {
          res.status(403).json({
            success: false,
            message: "You don't have permission to call this action",
          });
        } else {
          const startDate = req.query.startDate;
          const endDate = req.query.endDate;

          return PageService.getImpPages(req.user.uid, startDate, endDate).then(
            (result) => res.status(200).json(result),
          );
        }
      } else {
        res.status(404);
      }
    },
    [UserRole.ViewPages, UserRole.EditPages, UserRole.PublishPages],
  ),
);
