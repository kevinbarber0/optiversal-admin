import SharedService from '@services/sharedService';
const requireAuth = require('@api/_require-auth');
const ListingService = require('@services/listingService');


export default requireAuth((req, res) => {
  SharedService.setLocationInfo(req);

  if (req.method === 'GET') {
    return ListingService.getSources().then((result) =>
      res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
