const SuggestionService = require('@services/suggestionService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'PUT') {
    //update suggestion labels
    const keyword = req.query.keyword;
    const labels = req.body.labels;
    return SuggestionService.setLabels(req.user.uid, keyword, labels).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
