import { UserRole } from '@util/enum';

const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');

export default requireAuth(
  requireRoles(
    (req, res) => {
      if (req.method === 'PUT') {
        //update page status
        const pageId = req.query.slugid;
        const status = req.body.status;
        return PageService.updateStatus(req.user.uid, pageId, status).then(
          (result) => res.status(200).json(result),
        );
      } else {
        res.status(404);
      }
    },
    [UserRole.PublishPages],
  ),
);
