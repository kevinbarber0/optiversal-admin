const ListingService = require('@services/listingService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'GET') {
    return ListingService.getNextGrammarSample(req.user.uid).then(
      (result) => res.status(200).json(result),
    );
  } else if (req.method === 'PUT') {
    const settings = req.body;
    return ListingService.saveGrammarSample(req.user.uid, settings.sampleId, settings.edited).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
