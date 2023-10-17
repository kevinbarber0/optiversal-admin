const SuggestionService = require('@services/suggestionService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'POST') {
    const keywords = req.body.keywords;
    const label = req.body.label;
    return SuggestionService.bulkAddLabel(req.user.uid, keywords, label).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
