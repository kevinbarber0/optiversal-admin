import { wrapArray } from '@helpers/utils';
import { UserRole } from '@util/enum';

const requireAuth = require('@api/_require-auth');
const requireRoles = require('@api/_require-roles');
const AccountActionService = require('@services/accountActionService');

export default requireAuth(requireRoles((req, res) => {
  if (req.method === 'GET') {
    const offset = req.query.offset;
    const limit = req.query.limit;
    const filter = req.query.filter;
    const sortBy = req.query.sort;
    const accounts = wrapArray(req.query.accounts);
    const actionTypes = wrapArray(req.query.actionTypes);
    const dateRange = req.query.dateRange;

    return AccountActionService.getAll(req.user.uid, {
      offset,
      limit,
      filter,
      sortBy,
      accounts,
      actionTypes,
      dateRange,
    }).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
}, [UserRole.ManageUsers]));
