import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import SharedService from '@services/sharedService';

// Middleware for requiring authentication and getting user
const requireAuth = (fn) =>
  withApiAuthRequired(async (req, res) => {
    try {
      // Get access token from
      const { user } = getSession(req, res);

      //const { accessToken } = await getAccessToken();
      // Get user from token and add to req object
      req.user = user;

      // Set uid value from sub
      req.user.uid = req.user.sub;
      if (req.user.uid.indexOf('|') >= 0) {
        //remove the first segment from the uid
        req.user.uid = req.user.uid.substring(
          req.user.uid.lastIndexOf('|') + 1,
        );
        if (!req.user.email) {
          //email is the last part of the identifier
          req.user.email = req.user.uid.substring(
            req.user.uid.lastIndexOf('|') + 1,
          );
        }
      }

      const userOrgId = await SharedService.getUserOrgIdOrDefault(req.user.uid);

      console.log(`req.user.uid: ${req.user.uid}`);

      console.log(`getOrgByMap: ${SharedService.getUserOrgId(req.user.uid)}`);

      for (let [key, value] of SharedService.orgUserMap) {
        console.log(key + ' = ' + value);
      }
      // If 'getUserOrgIdOrDefault' is functioning correctly,
      // this should never be true and the remaining code should never be executed.
      // Keeping it in for now to see if it ever gets hit.
      if (user.org_id_override && userOrgId !== user.org_id_override) {
        console.log(
          `organization id for ${req.user.uid} overriden to ${user.org_id_override}`,
        );
        await SharedService.setOrganizationId(
          req.user.uid,
          user.org_id_override,
        );
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

module.exports = requireAuth;
