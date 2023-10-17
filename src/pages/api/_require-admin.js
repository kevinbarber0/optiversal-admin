import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';

// Middleware for requiring authentication and getting user
const requireAdmin = (fn) =>
  withApiAuthRequired(async (req, res) => {
    try {
      const { user } = getSession(req, res);
      //const { accessToken } = await getAccessToken();
      // Get user from token and add to req object
      req.user = user;
      // Set uid value from sub
      req.user.uid = req.user.sub;
      if (req.user.uid.indexOf('|') >= 0) {
        //remove the first segment from the uid
        req.user.uid = req.user.uid.substring(req.user.uid.indexOf('|') + 1);
        if (!req.user.email) {
          //email is the last part of the identifier
          req.user.email = req.user.uid.substring(req.user.uid.lastIndexOf('|') + 1);
        }
      }

      if (
        !req.user ||
        !req.user.email ||
        req.user.email.indexOf('@optiversal.com') < 0
      ) {
        return res.status(401).send({
          status: 'error',
          message: 'Unauthorized',
        });
      }

      // Call route function passed into this middleware
      return fn(req, res);
    } catch (error) {
      console.error(error);
      // If there's an error assume token is expired and return
      // auth/invalid-user-token error (handled by apiRequest in util.js)
      res.status(401).send({
        status: 'error',
        code: 'auth/invalid-user-token',
        message: 'Your login has expired. Please login again.',
      });
    }
  });

module.exports = requireAdmin;
