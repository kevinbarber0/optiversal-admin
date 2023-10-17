const requireAuth = require('@api/_require-auth');
const AccountService = require('@services/accountService');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    AccountService.getOrganizations(req.user.uid).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
