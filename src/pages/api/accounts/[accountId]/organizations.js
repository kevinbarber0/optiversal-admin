const requireAuth = require('@api/_require-auth');
const AccountService = require('@services/accountService');

export default requireAuth(async (req, res) => {
  if (req.method === 'GET') {
    const result = await AccountService.getOrganizations(req.query.accountId);
    res.json(result);
  } else {
    res.status(404);
  }
});
