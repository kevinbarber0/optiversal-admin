const requireAuth = require('@api/_require-auth');
const Auth0Service = require('@services/auth0Service');

export default requireAuth(async (req, res) => {
  if (req.method === 'POST') {
    const { email } = req.body;

    return Auth0Service.sendResetPassword(email).then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
