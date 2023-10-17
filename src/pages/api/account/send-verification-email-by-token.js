import SharedService from '@services/sharedService';
const AccountService = require('@services/accountService');
const AccountTokenService = require('@services/accountTokenService');

const handler = async (req, res) => {
  SharedService.setLocationInfo(req);
  if (req.method === 'POST') {
    const parsedToken = await AccountTokenService.parseToken(req.body.token);

    if (parsedToken.success === true || parsedToken.expired === true) {
      const { tokenInfo } = parsedToken;
      AccountService.sendEmailVerification(tokenInfo.uid).then((result) =>
        res.status(200).json(result),
      );
    } else {
      res.status(400).send({
        success: false,
        message: "The verification link you've followed is invalid.",
      });
    }
  } else {
    res.status(404);
  }
};

export default handler;
