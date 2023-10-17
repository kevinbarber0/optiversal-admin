const Auth0Service = require('@services/auth0Service');
const AccountDB = require('@db/accountDB');
const auth0 = require('@auth0/nextjs-auth0');
const { getSession } = require('@auth0/nextjs-auth0');
const requireAuth = require('@api/_require-auth');

export async function validateOrgSelection(accountId, selectedOrg) {
  const checkOrg = selectedOrg.trim();  
  const organizations = await AccountDB.getAccountOrganizations(accountId);
  return Boolean(organizations.some(({ organizationId }) => organizationId === checkOrg));
}

export const handleUserUpdate = async (req, res) => {
  if (req.method === 'PATCH') {

    const { data } = req.body;
    const { user } = getSession(req, res);
    let clearSession = false;

    if(data.org_id_override && data.org_id_override !== user.org_id_override) {
      const canSelectOrg = await validateOrgSelection(user.uid, data.org_id_override);
      if (!canSelectOrg) {
        return res.status(403).json({ message: 'You do not have access to this organization.' });
      }

      data.app_metadata = user.app_metadata || {};
      data.app_metadata.org_id_override = data.org_id_override;
      delete data.org_id_override;
      req.user.org_id_override = data.org_id_override;
      clearSession = true; // force a new session to be retrieved from Auth0 with the new org_id_override
    }
    
    Auth0Service.updateUserProfile(user.sub, data)
    .then((result) => {
      console.log('result:', JSON.stringify(result));
      if(clearSession){
        console.log('clearing session...');

        //res.removeHeader('Set-Cookie');
        console.log('headers:', JSON.stringify(res.getHeaders()));
        res.setHeader(
          'Set-Cookie',
          'appSession=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        );

        return res.redirect(`/api/auth/resetsession?redirect=${ req.headers.referer }`);
      }

      return res.status(200).json(result);
    });
  } else {
    return res.status(404);
  }
};

export default requireAuth(handleUserUpdate);
