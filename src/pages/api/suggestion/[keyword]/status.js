const SuggestionService = require('@services/suggestionService');
const requireAuth = require('@api/_require-auth');

export default requireAuth((req, res) => {
  if (req.method === 'PUT') {
    //update suggestion status
    const keyword = req.query.keyword;
    const status = req.body.status;
    return SuggestionService.updateStatus(req.user.uid, keyword, status).then(
      (result) => res.status(200).json(result),
    );
  } else {
    res.status(404);
  }
});
