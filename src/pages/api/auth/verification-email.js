const fetch = require('node-fetch');
const getAPIAccessToken = require('@api/auth/accesstoken');
const { getSession } = require('@auth0/nextjs-auth0');
const requireAuth = require('@api/_require-auth');

export default requireAuth(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const accessToken = await getAPIAccessToken();
      const { user } = getSession(req, res);

      await fetch(
        `${process.env.AUTH0_ISSUER_BASE_URL}/api/v2/jobs/verification-email`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.sub,
            client_id: process.env.AUTH0_CLIENT_ID,
          }),
        },
      ).then((res) => res.json());

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(200).json({
        success: false,
        message: 'Resending verification email was failed.',
      });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: 'Method not implemented.' });
  }
});
