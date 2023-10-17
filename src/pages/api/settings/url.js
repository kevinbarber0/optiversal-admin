const AccountService = require('@services/accountService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return AccountService.getOrgUrlSettings(req.user.uid, req.query.type).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
