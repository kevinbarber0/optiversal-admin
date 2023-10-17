import SharedService from '@services/sharedService';
const AccountDB = require('@db/accountDB');

const rolesMatch = (pageRoles, userRoles) => {
  const array = [
    ...Array.from(new Set(pageRoles)),
    ...Array.from(new Set(userRoles)),
  ];
  return new Set(array).size !== array.length;
};

const sendNoPermissionResponse = (res) =>
  res.status(403).send({
    status: 'error',
    message: "You don't have permission to call this endpoint",
  });

// Middleware for requiring authentication and getting user
const requireRoles = (fn, roles) => async (req, res) => {
  if (!req.user) {
    return res.status(401).send({
      status: 'error',
      message: 'You must be signed in to call this endpoint',
    });
  }

  const account = await AccountDB.getById(req.user.uid, SharedService.getUserOrgId(req.user.uid));

  if (!account) {
    return res.status(401).send({
      status: 'error',
      message: 'You must be signed in to call this endpoint',
    });
  }

  req.account = account;

  if (rolesMatch(roles, account.roles)) {
    return fn(req, res);
  } else {
    return sendNoPermissionResponse(res);
  }
};

module.exports = requireRoles;
