import { UserRole } from '@util/enum';

const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');

export default requireAuth(
  requireRoles(
    (req, res) => {
      if (req.method === 'GET') {
        const slug = req.query.slugid;
        return PageService.getBySlug(req.user.uid, slug).then((result) =>
          res.status(200).json(result),
        );
      } else {
        res.status(404);
      }
    },
    [UserRole.ViewPages],
  ),
);
