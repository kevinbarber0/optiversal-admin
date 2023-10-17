import { UserRole } from '@util/enum';

const ContentService = require('@services/contentService');
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');

export default requireAuth(
  requireRoles(
    (req, res) => {
      if (req.method === 'POST') {
        const params = req.body;
        return ContentService.composeProductContent(
          req.user.uid,
          params.product,
          params.copyType,
          params.autoSave,
        ).then((result) => res.status(200).json(result));
      } else {
        res.status(404);
      }
    },
    [UserRole.ManageProductCopy],
  ),
);
