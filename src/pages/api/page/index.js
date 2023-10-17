import { sendNoPermissionResponse } from '@util/auth';
import { UserRole } from '@util/enum';
import { wrapArray } from '@helpers/utils';

const PageService = require('@services/pageService');
const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');

export default requireAuth(
  requireRoles(
    (req, res) => {
      if (req.method === 'PUT') {
        if (!req.account.roles.includes(UserRole.EditPages)) {
          return sendNoPermissionResponse(res);
        }
        //update page
        const page = req.body;
        return PageService.updatePage(
          req.user.uid,
          page.pageId,
          page.slug,
          page.keyword,
          page.title,
          page.contentTemplateId,
          page.content,
          page.contentSettings,
          page.searchParameters,
          page.results,
          page.qualityMetrics,
          page.query,
          page.labels,
          page.pageSettings,
          page.locations,
        ).then((result) => res.status(200).json(result));
      } else if (req.method === 'GET') {
        if (!req.account.roles.includes(UserRole.ViewPages)) {
          return sendNoPermissionResponse(res);
        }
        const offset = req.query.offset;
        const limit = req.query.limit;
        const keyword = req.query.keyword;
        const sortBy = req.query.sortBy;
        const resultKey = req.query.resultKey;
        const filters =
          req.query.filters?.length > 0 ? JSON.parse(req.query.filters) : null;

        return PageService.getAll(
          req.user.uid,
          offset,
          limit,
          keyword,
          filters,
          sortBy,
          resultKey,
        ).then((result) => res.status(200).json(result));
      } else {
        res.status(404);
      }
    },
    [UserRole.ViewPages, UserRole.EditPages],
  ),
);
