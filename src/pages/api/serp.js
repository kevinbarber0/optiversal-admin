const ThirdPartyAPIServices = require('@services/thirdpartyAPIService.js');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const q = req.query.q;
    return ThirdPartyAPIServices.checkSerp(req.user.uid, q).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
