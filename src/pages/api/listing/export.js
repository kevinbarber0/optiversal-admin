const ListingService = require('@services/listingService');
const requireAuth = require('@api/_require-auth');
const { wrapArray } = require('@helpers/utils');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const { filter, marketplace, minQuality, maxQuality } = req.body;
    return ListingService.getExportDownloadUrl(
      req.user.uid,
      filter,
      wrapArray(marketplace),
      minQuality,
      maxQuality,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
