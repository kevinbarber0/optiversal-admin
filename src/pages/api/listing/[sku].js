const ListingService = require('@services/listingService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    const sku = req.query.sku;

    return ListingService.getBySku(req.user.uid, sku).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
