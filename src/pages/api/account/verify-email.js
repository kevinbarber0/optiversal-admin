const requireAuth = require('@api/_require-auth');
const AccountService = require('@services/accountService');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const accountData = {
      details: {
        email_verified: true,
      },
    };

    AccountService.updateById(req.body.uid, null, accountData).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
