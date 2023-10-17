const SemanticSearchService = require('@services/semanticSearchService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const settings = req.body;
    return SemanticSearchService.getTopProducts(
      req.user.uid,
      settings.topic,
      settings.componentId,
    ).then((result) => res.status(200).json(result));
  } else {
    res.status(404);
  }
});
