const OrganizationService = require('@services/organizationService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return OrganizationService.getGetOrgGeoLocations(req.user.uid).then(
      (result) => res.status(200).json(result),
    );
  } else if (req.method === 'PUT') {
    const locations = req.body;
    return OrganizationService.updateOrgGeoLocations(
      req.user.uid,
      locations,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
