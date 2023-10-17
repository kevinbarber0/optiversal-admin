import SharedService from '@services/sharedService';
const requireAuth = require('@api/_require-auth');
const AccountService = require('@services/accountService');

export default requireAuth((req, res) => {
  SharedService.setLocationInfo(req);
  if (req.method === 'POST') {
    AccountService.sendEmailVerification(req.user.uid).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
