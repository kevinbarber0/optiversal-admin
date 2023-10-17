import SharedService from '@services/sharedService';
const requireAuth = require('@api/_require-auth');
const AccountService = require('@services/accountService');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    //get account settings
    return AccountService.getById(req.user.uid).then((result) =>
      res.status(200).json(result),
    );
  } else if (req.method === 'POST') {
    SharedService.setLocationInfo(req);
    //retrieve or create account based on email
    const obj = req.body;
    return AccountService.findOrCreate(obj.id, obj.source, obj.email, obj.raw)
    .then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
