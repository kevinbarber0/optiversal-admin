const requireAuth = require('@api/_require-auth');
const Auth0Service = require('@services/auth0Service');
const { getSession } = require('@auth0/nextjs-auth0');

export default requireAuth(async (req, res) => {
  if (req.method === 'POST') {
    const { email } = req.body;
    const { user } = getSession(req, res);

    return Auth0Service.enableMFA(user.sub, email).then((result) =>
      res.status(200).json(result),
    );
  } else {
    return res.status(404);
  }
});
