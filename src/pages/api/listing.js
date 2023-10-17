import { wrapArray } from '@helpers/utils';

const ListingService = require('@services/listingService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const offset = req.query.offset;
    const limit = req.query.limit;
    const filter = req.query.filter;
    const sortBy = req.query.sortBy;
    const marketplace = wrapArray(req.query.marketplace);
    const minQuality = req.query.minQuality;
    const maxQuality = req.query.maxQuality;

    return ListingService.getAll({
      accountId: req.user.uid,
      offset,
      limit,
      filter,
      sortBy,
      marketplace: marketplace,
      minQuality,
      maxQuality,
    }).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
