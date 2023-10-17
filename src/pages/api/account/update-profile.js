import SharedService from '@services/sharedService';
const requireAuth = require('@api/_require-auth');

const AccountService = require('@services/accountService');


export default requireAuth((req, res) => {
  SharedService.setLocationInfo(req);
  if (req.method === 'PATCH') {
    const { accountId, userData } = req.body;
    AccountService.updateUserProfile(accountId, { details: userData }).then(
      (result) => res.status(200).json(result),
    );
  } else if (req.method === 'POST') {
    const accountId = req.user.uid;
    AccountService.deleteUserProfile(accountId).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
