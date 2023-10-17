import SharedService from '@services/sharedService';
const AccountService = require('@services/accountService');

const handler = (req, res) => {
  SharedService.setLocationInfo(req);
  if (req.method === 'POST') {
    return AccountService.checkEmailToken(req.body.token).then((result) =>
      res.status(200).json(result),
    );
  } else {
    return res.status(404).send();
  }
};

export default handler;
