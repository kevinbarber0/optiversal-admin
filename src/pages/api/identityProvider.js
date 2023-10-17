const AccountService = require('@services/accountService');

const handler = async (req, res) => {
  if (req.method === 'POST') {
    return AccountService.findIDProvider(req.body.email).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
};

export default handler;
