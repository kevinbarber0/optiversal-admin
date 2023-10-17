import {
  handleAuth,
  handleLogin,
  handleCallback,
  handleLogout,
  handleProfile,
} from '@auth0/nextjs-auth0';

// const afterCallback = (req, res, session, state) => {
//   // console.log('old session:', session);
//   const namespace = 'https://app.optiversal.com/user_metadata';
//   if (session.user[namespace]) {
//     Object.assign(session.user, {
//       displayName: session.user[namespace].full_name,
//     });
//   }
//   // console.log('new session:', session);
//   return session;
// };
// export default handleAuth()
export default handleAuth({
  async login(req, res) {
    try {
      await handleLogin(req, res, {
        authorizationParams: {
          response_type: 'code',
        },
      });
    } catch (error) {
      // Add you own custom error logging.
      console.error(error);
      res.status(error.status || 500).end(error.message);
    }
  },

  async logout(req, res) {
    try {
      // Pass in custom params to your handler
      await handleLogout(req, res, { returnTo: '/logout' });
    } catch (error) {
      // Add you own custom error logging.
      console.error(error);
      res.status(error.status || 500).end(error.message);
    }
  },

  async callback(req, res) {
    try {
      await handleCallback(req, res);
    } catch (error) {
      console.error(error);
      res.writeHead(301, {
        Location: encodeURI(
          '/autherr?errmsg=The login was canceled or not successful. Please try again.',
        ),
      });
      res.end();
    }
  },

  async profile(req, res) {
    try {
      await handleProfile(req, res, {
        refetch: true,
      });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
});
